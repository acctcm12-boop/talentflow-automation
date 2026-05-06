import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader, EmptyState, StageBadge } from "@/components/PageBits";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Award } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/app/placements")({ component: Placements });

const empty = { candidate_id: "", client_id: "", job_id: "", selection_date: "", joining_date: "", loi_status: "pending", ctc: "", billing_pct: 8.33, candidate_confirmed: false, client_confirmed: false, status: "selected" };

function Placements() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [opts, setOpts] = useState<{ candidates: any[]; clients: any[]; jobs: any[] }>({ candidates: [], clients: [], jobs: [] });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);

  const load = async () => {
    const [{ data: pl }, { data: ca }, { data: cl }, { data: jo }] = await Promise.all([
      supabase.from("placements").select("*, candidates(full_name), clients(company_name), jobs(job_title)").order("created_at", { ascending: false }),
      supabase.from("candidates").select("id,full_name").order("full_name"),
      supabase.from("clients").select("id,company_name").order("company_name"),
      supabase.from("jobs").select("id,job_title").order("job_title"),
    ]);
    setRows(pl ?? []); setOpts({ candidates: ca ?? [], clients: cl ?? [], jobs: jo ?? [] });
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;
    const payload: any = {
      ...form, company_id: profile.company_id,
      candidate_id: form.candidate_id || null, client_id: form.client_id || null, job_id: form.job_id || null,
      selection_date: form.selection_date || null, joining_date: form.joining_date || null,
      ctc: form.ctc ? Number(form.ctc) : null, billing_pct: form.billing_pct ? Number(form.billing_pct) : null,
    };
    const res = editing ? await supabase.from("placements").update(payload).eq("id", editing.id)
                        : await supabase.from("placements").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Saved"); setOpen(false); setEditing(null); setForm(empty); load();
  };

  return (
    <div className="p-8">
      <PageHeader title="Placements" description="Selection → LOI → joining → billing handoff. When both sides confirm joining, a billing case can be created."
        actions={<Button onClick={()=>{setEditing(null);setForm(empty);setOpen(true);}}><Plus className="h-4 w-4 mr-2" />New placement</Button>} />
      {rows.length === 0 ? (
        <EmptyState icon={Award} title="No placements yet" description="Mark a selected candidate as a placement to start LOI and joining tracking."
          ctaLabel="Add placement" onCta={()=>setOpen(true)} />
      ) : (
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Candidate</TableHead><TableHead>Client</TableHead><TableHead>Job</TableHead>
              <TableHead>Joining</TableHead><TableHead>LOI</TableHead><TableHead>Confirmed</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>{rows.map(r => (
              <TableRow key={r.id} className="cursor-pointer" onClick={()=>{setEditing(r);setForm({...r, selection_date: r.selection_date ?? "", joining_date: r.joining_date ?? ""});setOpen(true);}}>
                <TableCell className="font-medium">{r.candidates?.full_name ?? "—"}</TableCell>
                <TableCell>{r.clients?.company_name ?? "—"}</TableCell>
                <TableCell>{r.jobs?.job_title ?? "—"}</TableCell>
                <TableCell>{r.joining_date ?? "—"}</TableCell>
                <TableCell><StageBadge tone={r.loi_status === "accepted" ? "success" : "warning"}>{r.loi_status}</StageBadge></TableCell>
                <TableCell className="text-xs">{r.candidate_confirmed ? "C✓" : "C·"} {r.client_confirmed ? "K✓" : "K·"}</TableCell>
                <TableCell><StageBadge>{r.status}</StageBadge></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </CardContent></Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit placement" : "New placement"}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="grid grid-cols-2 gap-3">
            <div><Label>Candidate</Label>
              <Select value={form.candidate_id} onValueChange={v=>setForm({...form, candidate_id:v})}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{opts.candidates.map(c=><SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Client</Label>
              <Select value={form.client_id} onValueChange={v=>setForm({...form, client_id:v})}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{opts.clients.map(c=><SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Job</Label>
              <Select value={form.job_id} onValueChange={v=>setForm({...form, job_id:v})}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{opts.jobs.map(j=><SelectItem key={j.id} value={j.id}>{j.job_title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Selection date</Label><Input type="date" value={form.selection_date ?? ""} onChange={e=>setForm({...form, selection_date:e.target.value})} /></div>
            <div><Label>Joining date</Label><Input type="date" value={form.joining_date ?? ""} onChange={e=>setForm({...form, joining_date:e.target.value})} /></div>
            <div><Label>LOI status</Label>
              <Select value={form.loi_status} onValueChange={v=>setForm({...form, loi_status:v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["pending","issued","accepted","declined"].map(x=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Status</Label>
              <Select value={form.status} onValueChange={v=>setForm({...form, status:v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["selected","loi_pending","loi_issued","loi_accepted","joining_pending","joined","dropout","cancelled","billed","payment_pending","payment_received","closed"].map(x=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>CTC</Label><Input type="number" value={form.ctc ?? ""} onChange={e=>setForm({...form, ctc:e.target.value})} /></div>
            <div><Label>Billing %</Label><Input type="number" step="0.01" value={form.billing_pct ?? ""} onChange={e=>setForm({...form, billing_pct:e.target.value})} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.candidate_confirmed} onCheckedChange={v=>setForm({...form, candidate_confirmed:v})} /><Label>Candidate confirmed joining</Label></div>
            <div className="flex items-center gap-2"><Switch checked={form.client_confirmed} onCheckedChange={v=>setForm({...form, client_confirmed:v})} /><Label>Client confirmed joining</Label></div>
            <DialogFooter className="col-span-2"><Button type="submit">Save</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
