import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageBits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, User, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/copilot")({ component: Copilot });

const SUGGESTIONS = [
  "Which interviews are scheduled today?",
  "Which candidates are selected but LOI is pending?",
  "Which Tax Invoices are overdue?",
  "How much outstanding is pending from ABC Pvt Ltd?",
  "How do I start collection follow-up?",
  "What is the payment-stop rule?",
];

type Msg = { role: "user" | "assistant"; content: string };

function Copilot() {
  const { profile, user } = useAuth();
  const [convId, setConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      if (!profile?.company_id || !user) return;
      const { data: conv } = await supabase.from("ai_conversations").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle();
      let id = conv?.id;
      if (!id) {
        const { data: created } = await supabase.from("ai_conversations").insert({ company_id: profile.company_id, user_id: user.id, title: "New conversation" }).select().single();
        id = created?.id;
      }
      setConvId(id ?? null);
      if (id) {
        const { data: ms } = await supabase.from("ai_messages").select("role,content").eq("conversation_id", id).order("created_at");
        setMessages((ms ?? []) as Msg[]);
      }
    })();
  }, [profile?.company_id, user?.id]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }); }, [messages]);

  const ask = async (q: string) => {
    if (!q.trim() || !convId || !profile?.company_id || !user) return;
    setBusy(true);
    const userMsg: Msg = { role: "user", content: q };
    setMessages(m => [...m, userMsg]);
    setInput("");
    await supabase.from("ai_messages").insert({ conversation_id: convId, company_id: profile.company_id, user_id: user.id, role: "user", content: q });
    try {
      const { data, error } = await supabase.functions.invoke("ai-copilot", { body: { question: q, history: messages.slice(-6) } });
      if (error) throw error;
      const answer: string = data?.answer ?? data?.error ?? "(no response)";
      setMessages(m => [...m, { role: "assistant", content: answer }]);
      await supabase.from("ai_messages").insert({ conversation_id: convId, company_id: profile.company_id, user_id: user.id, role: "assistant", content: answer });
      await supabase.from("ai_query_logs").insert({ company_id: profile.company_id, user_id: user.id, question: q, answer });
    } catch (e: any) {
      toast.error(e.message ?? "AI request failed");
      setMessages(m => [...m, { role: "assistant", content: `I could not reach the AI service: ${e.message ?? e}` }]);
    } finally { setBusy(false); }
  };

  return (
    <div className="p-8 space-y-4">
      <PageHeader title="AI Copilot" description="Ask about your workspace data or how to use the software. Conversations are private to you and stay inside this workspace." />
      <Card><CardContent className="p-0">
        <div ref={scrollRef} className="h-[55vh] overflow-y-auto p-5 space-y-4 bg-muted/30">
          {messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-10">
              <Sparkles className="h-6 w-6 mx-auto mb-3 text-primary" />
              Ask anything about candidates, interviews, billing, collections — or how to use TalentFlow.
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground grid place-items-center"><Bot className="h-4 w-4" /></div>}
              <div className={`rounded-lg px-3 py-2 max-w-[75%] text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border"}`}>{m.content}</div>
              {m.role === "user" && <div className="h-7 w-7 rounded-full bg-secondary text-secondary-foreground grid place-items-center"><User className="h-4 w-4" /></div>}
            </div>
          ))}
          {busy && <div className="text-xs text-muted-foreground">Thinking…</div>}
        </div>
        <div className="p-3 border-t bg-card">
          <div className="flex flex-wrap gap-2 mb-2">
            {SUGGESTIONS.map(s => <button key={s} onClick={()=>ask(s)} disabled={busy} className="text-xs px-2.5 py-1 rounded-full border bg-muted hover:bg-accent">{s}</button>)}
          </div>
          <div className="flex gap-2">
            <Textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask Copilot…" rows={2}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input); } }} />
            <Button onClick={()=>ask(input)} disabled={busy || !input.trim()}><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </CardContent></Card>
    </div>
  );
}
