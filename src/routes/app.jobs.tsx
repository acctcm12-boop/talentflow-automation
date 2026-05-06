import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader, EmptyState } from "@/components/PageBits";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/app/jobs")({ component: Jobs });

const empty = { client_id: "", job_title: "", location: "", salary_min: "", salary_max: "", positions: 1, skills: "", status: "open" };

function Jobs() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(empty);

  const load = async () => {
    const [{ data: j }, { data: c }] = await Promise.all([
      supabase.from("jobs").select("*, clients(company_name)").order("created_at", { ascending: false }),
      supabase.from("clients").select("id,company_name").order("company_name"),
    ]);
    setRows(j ?? []); setClients(c ?? []);
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;
    const { error } = await supabase.from("jobs").insert({
      ...form, company_id: profile.company_id,
      client_id: form.client_id || null,
      positions: Number(form.positions) || 1,
      salary_min: form.salary_min ? Number(form.salary_min) : null,
      salary_max: form.salary_max ? Number(form.salary_max) : null,
    });
    if (error) return toast.error(error.message);
    toast.success("Job created"); setOpen(false); setForm(empty); load();
  };

  return (
    <div className="p-8">
      <PageHeader title="Jobs" description="Open requirements you are recruiting against."
        actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />New job</Button>} />
      {rows.length === 0 ? (
        <EmptyState icon={Briefcase} title="No open jobs" description="Create a job requirement to start sourcing and scheduling interviews."
          ctaLabel="Add a job" onCta={() => setOpen(true)} />
      ) : (
        <Card><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Title</TableHead><TableHead>Client</TableHead><TableHead>Location</TableHead>
              <TableHead>Salary</TableHead><TableHead>Positions</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>{rows.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.job_title}</TableCell>
                <TableCell>{r.clients?.company_name ?? "—"}</TableCell>
                <TableCell>{r.location ?? "—"}</TableCell>
                <TableCell>{r.salary_min ?? "?"}–{r.salary_max ?? "?"}</TableCell>
                <TableCell>{r.positions}</TableCell>
                <TableCell><Badge variant={r.status === "open" ? "default" : "secondary"}>{r.status}</Badge></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </CardContent></Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New job</DialogTitle></DialogHeader>
          <form onSubmit={save} className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Job title *</Label><Input required value={form.job_title} onChange={e=>setForm({...form, job_title:e.target.value})} /></div>
            <div className="col-span-2"><Label>Client</Label>
              <Select value={form.client_id} onValueChange={v=>setForm({...form, client_id:v})}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Location</Label><Input value={form.location} onChange={e=>setForm({...form, location:e.target.value})} /></div>
            <div><Label>Positions</Label><Input type="number" value={form.positions} onChange={e=>setForm({...form, positions:e.target.value})} /></div>
            <div><Label>Salary min</Label><Input type="number" value={form.salary_min} onChange={e=>setForm({...form, salary_min:e.target.value})} /></div>
            <div><Label>Salary max</Label><Input type="number" value={form.salary_max} onChange={e=>setForm({...form, salary_max:e.target.value})} /></div>
            <div className="col-span-2"><Label>Skills</Label><Input value={form.skills} onChange={e=>setForm({...form, skills:e.target.value})} placeholder="React, Node, …" /></div>
            <DialogFooter className="col-span-2"><Button type="submit">Create job</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
