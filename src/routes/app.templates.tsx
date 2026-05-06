import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader, EmptyState } from "@/components/PageBits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/app/templates")({ component: Templates });

const CATEGORIES = ["candidate","client","internal","advocate","collection"];
const CHANNELS = ["email","whatsapp","sms","internal"];
const empty = { template_key: "", category: "client", channel: "email", subject: "", body: "", active: true };

function Templates() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);

  const load = async () => {
    const { data } = await supabase.from("templates").select("*").order("category");
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;
    const payload = { ...form, company_id: profile.company_id };
    const res = editing
      ? await supabase.from("templates").update(payload).eq("id", editing.id)
      : await supabase.from("templates").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Template saved"); setOpen(false); setEditing(null); setForm(empty); load();
  };

  return (
    <div className="p-8">
      <PageHeader title="Templates" description="Email, WhatsApp, SMS and internal templates by category. Variables like {{candidateName}} and {{taxInvoiceNumber}} are filled at send time."
        actions={<Button onClick={()=>{setEditing(null);setForm(empty);setOpen(true);}}><Plus className="h-4 w-4 mr-2" />New template</Button>} />
      {rows.length === 0 ? (
        <EmptyState icon={Mail} title="No templates yet"
          description="Create message templates for candidate confirmations, client reminders, legal notices and internal alerts."
          ctaLabel="Add template" onCta={()=>setOpen(true)}
          secondary={{ label: "Suggested keys", items: ["tax_invoice_due", "overdue_d1", "candidate_interview_reminder", "advocate_letter", "internal_pending_action"] }} />
      ) : (
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Key</TableHead><TableHead>Category</TableHead><TableHead>Channel</TableHead><TableHead>Subject</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{rows.map(r => (
              <TableRow key={r.id} className="cursor-pointer" onClick={()=>{setEditing(r);setForm(r);setOpen(true);}}>
                <TableCell className="font-mono text-xs">{r.template_key}</TableCell>
                <TableCell className="capitalize">{r.category}</TableCell>
                <TableCell className="capitalize">{r.channel}</TableCell>
                <TableCell className="text-muted-foreground truncate max-w-[280px]">{r.subject ?? "—"}</TableCell>
                <TableCell><Badge variant={r.active ? "default" : "secondary"}>{r.active ? "active" : "inactive"}</Badge></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </CardContent></Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit template" : "New template"}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="grid grid-cols-2 gap-3">
            <div><Label>Template key *</Label><Input required value={form.template_key} onChange={e=>setForm({...form, template_key:e.target.value})} placeholder="overdue_d1" /></div>
            <div><Label>Category</Label>
              <Select value={form.category} onValueChange={v=>setForm({...form, category:v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Channel</Label>
              <Select value={form.channel} onValueChange={v=>setForm({...form, channel:v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CHANNELS.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Active</Label>
              <Select value={String(form.active)} onValueChange={v=>setForm({...form, active: v === "true"})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="true">Yes</SelectItem><SelectItem value="false">No</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Subject (email)</Label><Input value={form.subject ?? ""} onChange={e=>setForm({...form, subject:e.target.value})} /></div>
            <div className="col-span-2"><Label>Body *</Label>
              <Textarea required rows={8} value={form.body} onChange={e=>setForm({...form, body:e.target.value})} placeholder="Dear {{contactPerson}}, this is regarding Tax Invoice {{taxInvoiceNumber}} of {{invoiceAmount}}…" />
              <p className="text-[11px] text-muted-foreground mt-1">Variables: {`{{candidateName}} {{clientName}} {{taxInvoiceNumber}} {{invoiceAmount}} {{dueDate}} {{daysOverdue}} {{paymentLink}}`}</p>
            </div>
            <DialogFooter className="col-span-2"><Button type="submit">Save template</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
