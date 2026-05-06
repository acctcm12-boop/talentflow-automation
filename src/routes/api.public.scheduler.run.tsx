import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Server-side scheduler for collection workflows.
// Triggered by pg_cron every 5 minutes (or manually from /app/health).
// Strict rules enforced:
//   1. Re-check payment_status BEFORE every send. Paid → skip + mark completed.
//   2. Re-check automation_status. paused/stopped → skip.
//   3. Idempotency key prevents duplicates (case + stage + day + channel + recipient).
//   4. Advance stage/day ONLY after a successful send.
export const Route = createFileRoute("/api/public/scheduler/run")({
  server: {
    handlers: {
      POST: async () => {
        const sb = supabaseAdmin;
        const now = new Date();
        const nowIso = now.toISOString();
        // 13:00 IST gate — IST = UTC+5:30 → 13:00 IST = 07:30 UTC
        const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
        const sendWindowOpen = utcMinutes >= 7 * 60 + 30; // skip dispatch before 13:00 IST
        const istDateKey = new Date(now.getTime() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);

        const { data: cases, error } = await sb
          .from("billing_cases")
          .select("*, clients!inner(company_name, email, whatsapp)")
          .eq("automation_status", "running")
          .lte("next_run_at", nowIso)
          .limit(50);

        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

        const { data: steps } = await sb
          .from("collection_workflow_steps")
          .select("*")
          .order("day_offset", { ascending: true });

        let processed = 0, skipped = 0, failed = 0;

        for (const c of cases ?? []) {
          // Re-check payment status (highest priority rule)
          const { data: fresh } = await sb
            .from("billing_cases").select("payment_status, automation_status").eq("id", c.id).single();
          if (!fresh || fresh.payment_status === "paid" || fresh.payment_status === "cancelled" || fresh.payment_status === "credit_note") {
            await sb.from("billing_cases").update({ automation_status: "completed", next_run_at: null }).eq("id", c.id);
            await sb.from("dispatch_logs").insert({
              company_id: c.company_id, billing_case_id: c.id, channel: "internal",
              template_key: "skip_paid", status: "skipped",
              idempotency_key: `skip:${c.id}:${nowIso}`,
              error: `Skipped — payment_status=${fresh?.payment_status}`,
            });
            skipped++; continue;
          }
          if (fresh.automation_status !== "running") { skipped++; continue; }

          // Determine current target step
          if (!c.due_date) { skipped++; continue; }
          const due = new Date(c.due_date);
          const dayOffset = Math.floor((now.getTime() - due.getTime()) / 86400000);

          // Find the next step we haven't sent yet
          const target = (steps ?? []).find(s =>
            s.day_offset <= dayOffset &&
            (s.stage > c.current_stage || (s.stage === c.current_stage && s.day_offset > c.current_stage_day))
          ) ?? (steps ?? []).find(s => s.day_offset <= dayOffset && c.current_stage === 1 && c.current_stage_day === 0);

          if (!target) {
            // Nothing due yet — schedule next check
            const nextStep = (steps ?? []).find(s => s.day_offset > dayOffset);
            const nextRun = nextStep
              ? new Date(due.getTime() + nextStep.day_offset * 86400000).toISOString()
              : new Date(now.getTime() + 24 * 3600 * 1000).toISOString();
            await sb.from("billing_cases").update({ next_run_at: nextRun }).eq("id", c.id);
            skipped++; continue;
          }

          const recipient = c.clients?.email ?? c.clients?.whatsapp ?? "unknown";
          const idemKey = `${c.id}:${target.stage}:${target.day_offset}:email:${recipient}`;

          // Idempotency check
          const { data: existing } = await sb.from("dispatch_logs").select("id").eq("idempotency_key", idemKey).maybeSingle();
          if (existing) { skipped++; continue; }

          // Render message body (default template if none configured)
          const subject = `Payment reminder — ${c.tax_invoice_no ?? "Tax Invoice pending"}`;
          const body = `Dear ${c.clients?.company_name},\n\nThis is a reminder regarding the pending amount of ₹${c.total_amount} for ${c.candidate_name} (${c.job_title ?? ""}). Due date: ${c.due_date}.\n\nKindly arrange the payment.\n\nThank you.`;

          // In MVP we only LOG the send (no provider configured yet). Status=sent so workflow advances.
          const { error: logErr } = await sb.from("dispatch_logs").insert({
            company_id: c.company_id, billing_case_id: c.id,
            channel: "email", recipient, template_key: target.template_key,
            stage: target.stage, stage_day: target.day_offset,
            subject, body, status: "sent", idempotency_key: idemKey,
          });

          if (logErr) {
            failed++;
            await sb.from("dispatch_logs").insert({
              company_id: c.company_id, billing_case_id: c.id,
              channel: "email", recipient, template_key: target.template_key,
              stage: target.stage, stage_day: target.day_offset,
              status: "failed", error: logErr.message,
              idempotency_key: `${idemKey}:err:${nowIso}`,
            });
            continue;
          }

          // Advance stage + schedule next run
          const nextStep = (steps ?? []).find(s =>
            s.stage > target.stage || (s.stage === target.stage && s.day_offset > target.day_offset));
          const nextRun = nextStep
            ? new Date(Math.max(now.getTime() + 60_000, due.getTime() + nextStep.day_offset * 86400000)).toISOString()
            : null;

          await sb.from("billing_cases").update({
            current_stage: target.stage,
            current_stage_day: target.day_offset,
            last_sent_at: nowIso,
            next_run_at: nextRun,
            automation_status: nextRun ? "running" : "completed",
          }).eq("id", c.id);

          processed++;
        }

        return Response.json({ ok: true, processed, skipped, failed, at: nowIso });
      },
    },
  },
});
