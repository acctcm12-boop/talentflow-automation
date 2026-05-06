import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageBits";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, UserCircle2 } from "lucide-react";
import { EmptyState } from "@/components/PageBits";
import { normalizePhone } from "@/lib/phone";
import { toast } from "sonner";

export const Route = createFileRoute("/app/candidates")({ component: Candidates });

const empty = { full_name: "", email: "", phone: "", whatsapp: "", location: "", current_ctc: "", expected_ctc: "", notice_period: "", status: "active" };

function Candidates() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);

  const load = async () => {
    const { data, error } = await supabase.from("candidates").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;
    const payload = {
      ...form,
      whatsapp: normalizePhone(form.whatsapp),
      phone: normalizePhone(form.phone),
      current_ctc: form.current_ctc ? Number(form.current_ctc) : null,
      expected_ctc: form.expected_ctc ? Number(form.expected_ctc) : null,
      company_id: profile.company_id,
    };
    const res = editing
      ? await supabase.from("candidates").update(payload).eq("id", editing.id)
      : await supabase.from("candidates").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success(editing ? "Candidate updated" : "Candidate added");
    setOpen(false); setEditing(null); setForm(empty); load();
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Candidates"
        description="Talent pool with normalized contact details and pipeline status."
        actions={<Button onClick={() => { setEditing(null); setForm(empty); setOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add candidate</Button>}
      />
      {rows.length === 0 ? (
        <EmptyState icon={UserCircle2} title="No candidates yet"
          description="Add candidates to start scheduling interviews and tracking placements through to billing."
          ctaLabel="Add your first candidate" onCta={() => setOpen(true)}
          secondary={{ label: "Next steps", items: ["Add a client", "Post a job", "Schedule an interview"] }} />
      ) : (
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>WhatsApp</TableHead>
              <TableHead>Location</TableHead><TableHead>Current CTC</TableHead><TableHead>Notice</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>{rows.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.full_name}</TableCell>
                <TableCell className="text-muted-foreground">{r.email ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs">{r.whatsapp ?? "—"}</TableCell>
                <TableCell>{r.location ?? "—"}</TableCell>
                <TableCell>{r.current_ctc ?? "—"}</TableCell>
                <TableCell>{r.notice_period ?? "—"}</TableCell>
                <TableCell className="text-right"><Button size="icon" variant="ghost" onClick={() => { setEditing(r); setForm(r); setOpen(true); }}><Pencil className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </CardContent></Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit candidate" : "New candidate"}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Full name *</Label><Input required value={form.full_name} onChange={e=>setForm({...form, full_name:e.target.value})} /></div>
            <div><Label>Email</Label><Input type="email" value={form.email ?? ""} onChange={e=>setForm({...form, email:e.target.value})} /></div>
            <div><Label>WhatsApp</Label><Input value={form.whatsapp ?? ""} onChange={e=>setForm({...form, whatsapp:e.target.value})} placeholder="+91 …" /></div>
            <div><Label>Phone</Label><Input value={form.phone ?? ""} onChange={e=>setForm({...form, phone:e.target.value})} /></div>
            <div><Label>Location</Label><Input value={form.location ?? ""} onChange={e=>setForm({...form, location:e.target.value})} /></div>
            <div><Label>Current CTC</Label><Input type="number" value={form.current_ctc ?? ""} onChange={e=>setForm({...form, current_ctc:e.target.value})} /></div>
            <div><Label>Expected CTC</Label><Input type="number" value={form.expected_ctc ?? ""} onChange={e=>setForm({...form, expected_ctc:e.target.value})} /></div>
            <div className="col-span-2"><Label>Notice period</Label><Input value={form.notice_period ?? ""} onChange={e=>setForm({...form, notice_period:e.target.value})} /></div>
            <DialogFooter className="col-span-2"><Button type="submit">{editing ? "Save" : "Create"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
