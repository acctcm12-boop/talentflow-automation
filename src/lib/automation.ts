import { supabase } from "@/integrations/supabase/client";

// Queues automation jobs for an interview's pre/post lifecycle.
export async function queueInterviewAutomation(interview: any, candidate: any, client: any) {
  if (!interview?.scheduled_at) return;
  const at = new Date(interview.scheduled_at).getTime();
  const company_id = interview.company_id;
  const slots: { offsetMin: number; tpl: string; recip: "candidate" | "client"; channel: string; }[] = [
    { offsetMin: -24*60, tpl: "candidate_interview_24h_reminder", recip: "candidate", channel: "whatsapp" },
    { offsetMin: -180,   tpl: "candidate_interview_3h_reminder",  recip: "candidate", channel: "whatsapp" },
    { offsetMin: -60,    tpl: "candidate_interview_1h_reminder",  recip: "candidate", channel: "whatsapp" },
    { offsetMin: -30,    tpl: "candidate_interview_30m_reminder", recip: "candidate", channel: "whatsapp" },
    { offsetMin: -24*60, tpl: "client_interview_24h_reminder",    recip: "client",    channel: "email" },
    { offsetMin: -30,    tpl: "client_interview_30m_reminder",    recip: "client",    channel: "email" },
    { offsetMin: 60,     tpl: "candidate_feedback_request",       recip: "candidate", channel: "whatsapp" },
    { offsetMin: 120,    tpl: "client_feedback_request",          recip: "client",    channel: "email" },
  ];
  const rows = slots.map(s => {
    const sched = new Date(at + s.offsetMin * 60000);
    const recipName = s.recip === "candidate" ? candidate?.full_name : client?.company_name;
    const recipContact = s.recip === "candidate" ? (candidate?.whatsapp ?? candidate?.phone ?? candidate?.email) : (client?.email ?? client?.whatsapp);
    return {
      company_id, workflow_type: "interview", entity_type: "interview", entity_id: interview.id,
      recipient_type: s.recip, recipient_name: recipName, recipient_contact: recipContact,
      recipient_channel: s.channel, template_key: s.tpl, scheduled_at: sched.toISOString(),
      status: "pending", idempotency_key: `iv:${interview.id}:${s.tpl}`,
    };
  }).filter(r => r.recipient_contact);
  if (rows.length) await supabase.from("automation_jobs").upsert(rows, { onConflict: "idempotency_key" });
}

export async function queueBillingAutomation(billingCase: any, client: any) {
  if (!billingCase?.due_date) return;
  const due = new Date(billingCase.due_date).getTime();
  const offsets = [
    { d: -2,  tpl: "due_soon_reminder" },
    { d: 0,   tpl: "tax_invoice_due" },
    { d: 1,   tpl: "overdue_gentle_reminder" },
    { d: 8,   tpl: "legal_notice_1" },
    { d: 12,  tpl: "advocate_letter" },
    { d: 20,  tpl: "msme_warning" },
    { d: 22,  tpl: "gst_warning" },
    { d: 24,  tpl: "third_party_warning" },
    { d: 26,  tpl: "court_transfer_notice" },
  ];
  const rows = offsets.map(o => ({
    company_id: billingCase.company_id, workflow_type: "collection", entity_type: "billing_case", entity_id: billingCase.id,
    recipient_type: "client", recipient_name: client?.company_name,
    recipient_contact: client?.email ?? client?.whatsapp, recipient_channel: client?.email ? "email" : "whatsapp",
    template_key: o.tpl, scheduled_at: new Date(due + o.d * 86400000).toISOString(),
    status: "pending", idempotency_key: `bc:${billingCase.id}:${o.tpl}`,
  })).filter(r => r.recipient_contact);
  if (rows.length) await supabase.from("automation_jobs").upsert(rows, { onConflict: "idempotency_key" });
}
