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
import { Plus, CalendarCheck2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/interviews")({ component: Interviews });

const STATUSES = ["scheduled","candidate_confirmation_pending","client_confirmation_pending","confirmed","candidate_started","candidate_reached","completed","candidate_no_show","client_unavailable","rescheduled","feedback_pending","selected","rejected","on_hold","second_round","closed"];
const empty = { candidate_id: "", client_id: "", job_id: "", scheduled_at: "", mode: "online", meeting_link: "", location: "", recruiter: "", status: "scheduled" };

function Interviews() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [opts, setOpts] = useState<{ candidates: any[]; clients: any[]; jobs: any[] }>({ candidates: [], clients: [], jobs: [] });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(empty);

  const load = async () => {
    const [{ data: iv }, { data: ca }, { data: cl }, { data: jo }] = await Promise.all([
      supabase.from("interviews").select("*, candidates(full_name), clients(company_name), jobs(job_title)").order("scheduled_at", { ascending: false }),
      supabase.from("candidates").select("id,full_name").order("full_name"),
      supabase.from("clients").select("id,company_name").order("company_name"),
      supabase.from("jobs").select("id,job_title").order("job_title"),
    ]);
    setRows(iv ?? []); setOpts({ candidates: ca ?? [], clients: cl ?? [], jobs: jo ?? [] });
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;
    const { error } = await supabase.from("interviews").insert({
      ...form, company_id: profile.company_id,
      candidate_id: form.candidate_id || null, client_id: form.client_id || null, job_id: form.job_id || null,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
    });
    if (error) return toast.error(error.message);
    toast.success("Interview scheduled"); setOpen(false); setForm(empty); load();
  };

  const tone = (s: string) => s.includes("rejected") || s.includes("no_show") ? "destructive"
    : s === "selected" || s === "completed" ? "success"
    : s.includes("pending") || s.includes("confirmation") ? "warning" : "default";

  return (
    <div className="p-8">
      <PageHeader title="Interviews" description="Pre-interview confirmations, day-of reminders and feedback all flow from here."
        actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Schedule interview</Button>} />
      {rows.length === 0 ? (
        <EmptyState icon={CalendarCheck2} title="No interviews scheduled"
          description="Schedule an interview to send candidate and client confirmations 24h, 3h, 1h and 30m before."
          ctaLabel="Schedule interview" onCta={() => setOpen(true)} />
      ) : (
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>When</TableHead><TableHead>Candidate</TableHead><TableHead>Client</TableHead>
              <TableHead>Job</TableHead><TableHead>Mode</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>{rows.map(r => (
              <TableRow key={r.id}>
                <TableCell>{r.scheduled_at ? new Date(r.scheduled_at).toLocaleString() : "—"}</TableCell>
                <TableCell>{r.candidates?.full_name ?? "—"}</TableCell>
                <TableCell>{r.clients?.company_name ?? "—"}</TableCell>
                <TableCell>{r.jobs?.job_title ?? "—"}</TableCell>
                <TableCell className="capitalize">{r.mode}</TableCell>
                <TableCell><StageBadge tone={tone(r.status) as any}>{r.status.replace(/_/g," ")}</StageBadge></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </CardContent></Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schedule interview</DialogTitle></DialogHeader>
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
            <div><Label>When</Label><Input type="datetime-local" value={form.scheduled_at} onChange={e=>setForm({...form, scheduled_at:e.target.value})} /></div>
            <div><Label>Mode</Label>
              <Select value={form.mode} onValueChange={v=>setForm({...form, mode:v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem><SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Meeting link / address</Label><Input value={form.meeting_link} onChange={e=>setForm({...form, meeting_link:e.target.value})} /></div>
            <div className="col-span-2"><Label>Recruiter</Label><Input value={form.recruiter} onChange={e=>setForm({...form, recruiter:e.target.value})} /></div>
            <DialogFooter className="col-span-2"><Button type="submit">Schedule</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
