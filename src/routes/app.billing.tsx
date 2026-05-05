import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, Pause, CheckCircle2, Pencil } from "lucide-react";
import { inr, fmtDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/app/billing")({ component: Billing });

type BC = any;

const statusVariant: Record<string, string> = {
  pending: "warning", paid: "success", partial: "warning", cancelled: "secondary", credit_note: "secondary",
};
const autoVariant: Record<string, string> = {
  not_started: "secondary", running: "default", paused: "warning", stopped: "destructive", completed: "success",
};

function Billing() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<BC[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [payOpen, setPayOpen] = useState<BC | null>(null);
  const [form, setForm] = useState<any>({
    client_id: "", candidate_name: "", job_title: "", joining_date: "",
    ctc: "", billing_pct: 8.33, taxable_amount: "", gst_amount: "", total_amount: "",
    due_date: "", performa_invoice_no: "", tax_invoice_no: "",
  });

  const load = async () => {
    const [{ data: bc }, { data: cl }] = await Promise.all([
      supabase.from("billing_cases").select("*, clients(company_name)").order("created_at", { ascending: false }),
      supabase.from("clients").select("id,company_name").order("company_name"),
    ]);
    setRows(bc ?? []); setClients(cl ?? []);
  };
  useEffect(() => { load(); }, []);

  // Auto-calc totals
  useEffect(() => {
    const ctc = Number(form.ctc) || 0;
    const pct = Number(form.billing_pct) || 0;
    const taxable = ctc && pct ? +(ctc * pct / 100).toFixed(2) : Number(form.taxable_amount) || 0;
    const gst = +(taxable * 0.18).toFixed(2);
    setForm((f: any) => ({ ...f, taxable_amount: taxable || f.taxable_amount, gst_amount: gst, total_amount: +(taxable + gst).toFixed(2) }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.ctc, form.billing_pct]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;
    const { error } = await supabase.from("billing_cases").insert({
      ...form,
      company_id: profile.company_id,
      ctc: Number(form.ctc) || 0,
      billing_pct: Number(form.billing_pct) || 0,
      taxable_amount: Number(form.taxable_amount) || 0,
      gst_amount: Number(form.gst_amount) || 0,
      total_amount: Number(form.total_amount) || 0,
      joining_date: form.joining_date || null,
      due_date: form.due_date || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Billing case created"); setOpen(false); load();
  };

  const setAutomation = async (id: string, status: string) => {
    const patch: any = { automation_status: status };
    if (status === "running") patch.next_run_at = new Date().toISOString();
    const { error } = await supabase.from("billing_cases").update(patch).eq("id", id);
    if (error) toast.error(error.message); else { toast.success(`Workflow ${status}`); load(); }
  };

  const recordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payOpen || !profile?.company_id) return;
    const fd = new FormData(e.target as HTMLFormElement);
    const amount = Number(fd.get("amount")) || 0;
    const reference = String(fd.get("reference") ?? "");
    const { error: pErr } = await supabase.from("payments").insert({
      company_id: profile.company_id, billing_case_id: payOpen.id, amount, reference,
    });
    if (pErr) return toast.error(pErr.message);
    // Highest priority rule: payment received → stop automation immediately
    const { error: bErr } = await supabase.from("billing_cases").update({
      payment_status: "paid", automation_status: "completed", next_run_at: null, pause_reason: "Payment received",
    }).eq("id", payOpen.id);
    if (bErr) return toast.error(bErr.message);
    toast.success("Payment recorded — automation stopped");
    setPayOpen(null); load();
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold">Billing cases</h1><p className="text-sm text-muted-foreground">Performa Invoice → Tax Invoice → Collection workflow.</p></div>
        <Button onClick={() => setOpen(true)} disabled={!clients.length}><Plus className="h-4 w-4 mr-2" />New billing case</Button>
      </div>
      {!clients.length && <Card><CardContent className="py-6 text-sm text-muted-foreground">Add a <Link to="/app/clients" className="text-primary underline">client</Link> first.</CardContent></Card>}

      <Card>
        <CardHeader><CardTitle className="text-base">All cases ({rows.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Client / Candidate</TableHead><TableHead>Tax Invoice</TableHead>
              <TableHead>Total</TableHead><TableHead>Due</TableHead>
              <TableHead>Payment</TableHead><TableHead>Automation</TableHead>
              <TableHead>Stage</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No cases</TableCell></TableRow>}
              {rows.map(b => (
                <TableRow key={b.id}>
                  <TableCell>
                    <div className="font-medium">{b.clients?.company_name}</div>
                    <div className="text-xs text-muted-foreground">{b.candidate_name} · {b.job_title ?? "—"}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{b.tax_invoice_no ?? <span className="text-muted-foreground">pending</span>}</TableCell>
                  <TableCell>{inr(b.total_amount)}</TableCell>
                  <TableCell>{fmtDate(b.due_date)}</TableCell>
                  <TableCell><Badge variant={(statusVariant[b.payment_status] as any) ?? "default"}>{b.payment_status}</Badge></TableCell>
                  <TableCell><Badge variant={(autoVariant[b.automation_status] as any) ?? "default"}>{b.automation_status}</Badge></TableCell>
                  <TableCell className="text-xs">S{b.current_stage} / D{b.current_stage_day}</TableCell>
                  <TableCell className="text-right space-x-1">
                    {b.payment_status !== "paid" && b.automation_status !== "running" && (
                      <Button size="sm" variant="outline" onClick={() => setAutomation(b.id, "running")}><Play className="h-3 w-3 mr-1" />Start</Button>
                    )}
                    {b.automation_status === "running" && (
                      <Button size="sm" variant="outline" onClick={() => setAutomation(b.id, "paused")}><Pause className="h-3 w-3 mr-1" />Pause</Button>
                    )}
                    {b.automation_status === "paused" && (
                      <Button size="sm" variant="outline" onClick={() => setAutomation(b.id, "running")}><Play className="h-3 w-3 mr-1" />Resume</Button>
                    )}
                    {b.payment_status !== "paid" && (
                      <Button size="sm" onClick={() => setPayOpen(b)}><CheckCircle2 className="h-3 w-3 mr-1" />Mark paid</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>New billing case</DialogTitle></DialogHeader>
          <form onSubmit={create} className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Client *</Label>
              <Select value={form.client_id} onValueChange={v=>setForm({...form, client_id:v})}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Candidate name *</Label><Input required value={form.candidate_name} onChange={e=>setForm({...form, candidate_name:e.target.value})} /></div>
            <div><Label>Job title</Label><Input value={form.job_title} onChange={e=>setForm({...form, job_title:e.target.value})} /></div>
            <div><Label>Joining date</Label><Input type="date" value={form.joining_date} onChange={e=>setForm({...form, joining_date:e.target.value})} /></div>
            <div><Label>CTC (₹)</Label><Input type="number" value={form.ctc} onChange={e=>setForm({...form, ctc:e.target.value})} /></div>
            <div><Label>Billing %</Label><Input type="number" step="0.01" value={form.billing_pct} onChange={e=>setForm({...form, billing_pct:e.target.value})} /></div>
            <div><Label>Taxable (₹)</Label><Input type="number" value={form.taxable_amount} onChange={e=>setForm({...form, taxable_amount:e.target.value})} /></div>
            <div><Label>GST (₹)</Label><Input type="number" value={form.gst_amount} onChange={e=>setForm({...form, gst_amount:e.target.value})} /></div>
            <div><Label>Total (₹)</Label><Input type="number" value={form.total_amount} onChange={e=>setForm({...form, total_amount:e.target.value})} /></div>
            <div><Label>Due date *</Label><Input type="date" required value={form.due_date} onChange={e=>setForm({...form, due_date:e.target.value})} /></div>
            <div><Label>Performa Invoice #</Label><Input value={form.performa_invoice_no} onChange={e=>setForm({...form, performa_invoice_no:e.target.value})} /></div>
            <div><Label>Tax Invoice #</Label><Input value={form.tax_invoice_no} onChange={e=>setForm({...form, tax_invoice_no:e.target.value})} /></div>
            <DialogFooter className="col-span-2"><Button type="submit">Create case</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!payOpen} onOpenChange={v=>!v && setPayOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record payment</DialogTitle></DialogHeader>
          <form onSubmit={recordPayment} className="space-y-3">
            <div className="text-sm text-muted-foreground">Marking this case paid will stop all queued reminders immediately (highest priority rule).</div>
            <div><Label>Amount</Label><Input name="amount" type="number" required defaultValue={payOpen?.total_amount} /></div>
            <div><Label>Reference</Label><Input name="reference" placeholder="UTR / cheque / UPI ref" /></div>
            <DialogFooter><Button type="submit">Mark paid &amp; stop automation</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
