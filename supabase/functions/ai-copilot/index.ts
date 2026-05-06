// AI Copilot — answers software help + workspace data questions for the logged-in user.
// Tenant-safe: uses the caller's JWT so all DB reads pass through RLS.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HELP = `
TalentFlow Revenue Engine — quick help:
- Schedule interview: Pipeline → Interviews → Schedule. Confirmation, 24h/3h/1h/30m reminders, post-interview feedback follow-ups are auto-queued.
- Start collection: Revenue → Billing → New billing case → set due date → Start automation. Scheduler runs at 13:00 IST daily.
- Payment-stop rule: marking a case Paid instantly cancels every pending reminder for that case (highest priority).
- Add WhatsApp provider: Settings → Communication providers → WhatsApp (Com.bot v19). Use base URL https://crmapi.com.bot and version v19.0.
- Tax Invoice: create from Billing screen, set tax_invoice_no and due date, then Start automation.
- AI Copilot only sees this workspace's data. Conversations are per-user.
`;

async function summariseWorkspace(sb: any) {
  const [clients, candidates, interviews, placements, billing, jobs] = await Promise.all([
    sb.from("clients").select("id,company_name,contact_person,email,whatsapp"),
    sb.from("candidates").select("id,full_name,phone,email,location,status"),
    sb.from("interviews").select("id,scheduled_at,status,candidates(full_name),clients(company_name),jobs(job_title)").order("scheduled_at",{ascending:false}).limit(40),
    sb.from("placements").select("id,loi_status,candidate_confirmed,client_confirmed,joining_date,status,candidates(full_name),clients(company_name)").limit(40),
    sb.from("billing_cases").select("id,candidate_name,tax_invoice_no,total_amount,due_date,payment_status,automation_status,current_stage,next_run_at,clients(company_name)"),
    sb.from("jobs").select("id,job_title,status,clients(company_name)").limit(40),
  ]);
  const today = new Date().toISOString().slice(0,10);
  const totals = {
    clients: clients.data?.length ?? 0,
    candidates: candidates.data?.length ?? 0,
    interviews: interviews.data?.length ?? 0,
    placements: placements.data?.length ?? 0,
    billing_cases: billing.data?.length ?? 0,
    outstanding: (billing.data ?? []).filter((b:any)=>b.payment_status!=="paid").reduce((a:number,b:any)=>a+Number(b.total_amount||0),0),
    overdue: (billing.data ?? []).filter((b:any)=>b.payment_status!=="paid"&&b.due_date&&b.due_date<today).reduce((a:number,b:any)=>a+Number(b.total_amount||0),0),
  };
  return { totals, clients: clients.data, candidates: candidates.data, interviews: interviews.data, placements: placements.data, billing: billing.data, jobs: jobs.data };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("authorization") ?? "";
    const token = auth.replace(/^Bearer\s+/i, "");
    if (!token) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type":"application/json"} });
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { question, history = [] } = await req.json();
    if (!question) return new Response(JSON.stringify({ error:"question required"}),{status:400,headers:{...corsHeaders,"Content-Type":"application/json"}});

    const data = await summariseWorkspace(sb);
    const sys = `You are TalentFlow Copilot, an AI assistant for a recruitment automation SaaS.
You answer two kinds of questions:
1. SOFTWARE HELP — how to use the app. Use the help text below.
2. WORKSPACE DATA — only use the JSON data block. NEVER invent numbers, names, or statuses. If the answer is not in the data block, say "I could not find this in your workspace."
Be concise and direct. When citing a record, mention its name. When relevant, suggest the next action (e.g. "Open Billing → mark paid").

HELP DOCS:
${HELP}

WORKSPACE TOTALS: ${JSON.stringify(data.totals)}
WORKSPACE DATA (JSON):
${JSON.stringify({clients:data.clients,candidates:data.candidates,interviews:data.interviews,placements:data.placements,billing:data.billing,jobs:data.jobs}).slice(0,18000)}`;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ answer: `AI provider not configured. Here is the local help:\n${HELP}`, fallback: true }),
        { headers: { ...corsHeaders, "Content-Type":"application/json"} });
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type":"application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role:"system", content: sys },
          ...history.slice(-6),
          { role:"user", content: question },
        ],
      }),
    });
    if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Rate limited, please retry shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type":"application/json"} });
    if (aiRes.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }), { status: 402, headers: { ...corsHeaders, "Content-Type":"application/json"} });
    if (!aiRes.ok) {
      const t = await aiRes.text();
      return new Response(JSON.stringify({ error: "AI gateway error", detail: t }), { status: 500, headers: { ...corsHeaders, "Content-Type":"application/json"} });
    }
    const j = await aiRes.json();
    const answer = j.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ answer }), { headers: { ...corsHeaders, "Content-Type":"application/json"} });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type":"application/json"} });
  }
});
