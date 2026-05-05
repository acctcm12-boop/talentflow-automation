import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Plus } from "lucide-react";
import { normalizePhone } from "@/lib/phone";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/clients")({ component: Clients });

type Client = {
  id: string; company_name: string; contact_person: string | null;
  email: string | null; whatsapp: string | null; phone: string | null;
  gst_number: string | null; payment_due_days: number; status: string;
};

const empty = { company_name: "", contact_person: "", email: "", whatsapp: "", phone: "", gst_number: "", payment_due_days: 30 };

function Clients() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<any>(empty);

  const load = async () => {
    const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setRows(data as Client[]);
  };
  useEffect(() => { load(); }, []);

  const startNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const startEdit = (c: Client) => { setEditing(c); setForm(c); setOpen(true); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return toast.error("No workspace");
    const payload = {
      ...form,
      whatsapp: normalizePhone(form.whatsapp),
      phone: normalizePhone(form.phone),
      payment_due_days: Number(form.payment_due_days) || 30,
      company_id: profile.company_id,
    };
    const res = editing
      ? await supabase.from("clients").update(payload).eq("id", editing.id)
      : await supabase.from("clients").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success(editing ? "Client updated" : "Client created");
    setOpen(false); load();
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold">Clients</h1><p className="text-sm text-muted-foreground">Master records with normalized contact numbers.</p></div>
        <Button onClick={startNew}><Plus className="h-4 w-4 mr-2" />Add client</Button>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">All clients ({rows.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Company</TableHead><TableHead>Contact</TableHead><TableHead>Email</TableHead>
              <TableHead>WhatsApp</TableHead><TableHead>Due days</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No clients yet</TableCell></TableRow>}
              {rows.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.company_name}</TableCell>
                  <TableCell>{c.contact_person ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.email ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{c.whatsapp ?? "—"}</TableCell>
                  <TableCell>{c.payment_due_days}</TableCell>
                  <TableCell><Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status}</Badge></TableCell>
                  <TableCell className="text-right"><Button size="icon" variant="ghost" onClick={() => startEdit(c)}><Pencil className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit client" : "New client"}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Company name *</Label><Input required value={form.company_name} onChange={e=>setForm({...form, company_name:e.target.value})} /></div>
            <div><Label>Contact person</Label><Input value={form.contact_person ?? ""} onChange={e=>setForm({...form, contact_person:e.target.value})} /></div>
            <div><Label>Email</Label><Input type="email" value={form.email ?? ""} onChange={e=>setForm({...form, email:e.target.value})} /></div>
            <div><Label>WhatsApp</Label><Input value={form.whatsapp ?? ""} onChange={e=>setForm({...form, whatsapp:e.target.value})} placeholder="+91 96670 36612" /></div>
            <div><Label>Phone</Label><Input value={form.phone ?? ""} onChange={e=>setForm({...form, phone:e.target.value})} /></div>
            <div><Label>GST number</Label><Input value={form.gst_number ?? ""} onChange={e=>setForm({...form, gst_number:e.target.value})} /></div>
            <div><Label>Payment due (days)</Label><Input type="number" value={form.payment_due_days} onChange={e=>setForm({...form, payment_due_days:e.target.value})} /></div>
            <DialogFooter className="col-span-2"><Button type="submit">{editing ? "Save changes" : "Create client"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
