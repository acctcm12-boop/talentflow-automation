import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader, EmptyState } from "@/components/PageBits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, UserCog, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { normalizePhone } from "@/lib/phone";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings")({ component: Settings });

const RESPS = ["Interview Follow-up","Client Feedback","LOI Follow-up","Joining Follow-up","Billing","Payment Follow-up","MSME","GST","Third Party Collection","Court Filing","Advocate","General Admin"];
const personEmpty = { full_name: "", role: "", email: "", whatsapp: "", phone: "", responsibilities: [] as string[], active: true };

function Settings() {
  const { profile, roles } = useAuth();
  const [providers, setProviders] = useState<any>({
    whatsapp_base_url: "https://crmapi.com.bot", whatsapp_api_version: "v19.0",
    whatsapp_template_lang: "en", email_smtp_port: 587,
  });
  const [persons, setPersons] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [pForm, setPForm] = useState<any>(personEmpty);

  const load = async () => {
    if (!profile?.company_id) return;
    const [{ data: prov }, { data: ppl }] = await Promise.all([
      supabase.from("provider_settings").select("*").eq("company_id", profile.company_id).maybeSingle(),
      supabase.from("internal_persons").select("*").order("created_at", { ascending: false }),
    ]);
    if (prov) setProviders(prov);
    setPersons(ppl ?? []);
  };
  useEffect(() => { load(); }, [profile?.company_id]);

  const saveProviders = async () => {
    if (!profile?.company_id) return;
    const payload = {
      ...providers,
      company_id: profile.company_id,
      test_whatsapp: normalizePhone(providers.test_whatsapp ?? ""),
      whatsapp_sender_number: normalizePhone(providers.whatsapp_sender_number ?? ""),
    };
    const { error } = await supabase.from("provider_settings").upsert(payload, { onConflict: "company_id" });
    if (error) toast.error(error.message); else toast.success("Provider settings saved");
  };

  const savePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;
    const payload = {
      ...pForm, company_id: profile.company_id,
      whatsapp: normalizePhone(pForm.whatsapp), phone: normalizePhone(pForm.phone),
    };
    const res = editing ? await supabase.from("internal_persons").update(payload).eq("id", editing.id)
                        : await supabase.from("internal_persons").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Saved"); setOpen(false); setEditing(null); setPForm(personEmpty); load();
  };

  const toggleResp = (r: string) => setPForm((f: any) => ({
    ...f, responsibilities: f.responsibilities.includes(r) ? f.responsibilities.filter((x: string) => x !== r) : [...f.responsibilities, r],
  }));

  return (
    <div className="p-8 space-y-6">
      <PageHeader title="Settings" description="Workspace, providers and internal responsible persons." />

      <Card>
        <CardHeader><CardTitle className="text-base">Workspace</CardTitle></CardHeader>
        <CardContent className="text-sm grid gap-1">
          <div><span className="text-muted-foreground">User:</span> {profile?.full_name ?? "—"}</div>
          <div><span className="text-muted-foreground">Company ID:</span> <code className="text-xs">{profile?.company_id}</code></div>
          <div><span className="text-muted-foreground">Roles:</span> {roles.join(", ") || "—"}</div>
          <div><span className="text-muted-foreground">Default send time:</span> 13:00 IST (Asia/Kolkata)</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Communication providers</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Email (SMTP)</div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>SMTP host</Label><Input value={providers.email_smtp_host ?? ""} onChange={e=>setProviders({...providers, email_smtp_host:e.target.value})} /></div>
              <div><Label>Port</Label><Input type="number" value={providers.email_smtp_port ?? ""} onChange={e=>setProviders({...providers, email_smtp_port:Number(e.target.value)})} /></div>
              <div><Label>User</Label><Input value={providers.email_smtp_user ?? ""} onChange={e=>setProviders({...providers, email_smtp_user:e.target.value})} /></div>
              <div><Label>Password</Label><Input type="password" value={providers.email_smtp_pass ?? ""} onChange={e=>setProviders({...providers, email_smtp_pass:e.target.value})} /></div>
              <div><Label>Sender email</Label><Input value={providers.email_sender ?? ""} onChange={e=>setProviders({...providers, email_sender:e.target.value})} /></div>
              <div><Label>Sender display name</Label><Input value={providers.email_sender_name ?? ""} onChange={e=>setProviders({...providers, email_sender_name:e.target.value})} /></div>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">WhatsApp (Com.bot v19)</div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>API base URL</Label><Input value={providers.whatsapp_base_url ?? ""} onChange={e=>setProviders({...providers, whatsapp_base_url:e.target.value})} /></div>
              <div><Label>API version</Label><Input value={providers.whatsapp_api_version ?? ""} onChange={e=>setProviders({...providers, whatsapp_api_version:e.target.value})} /></div>
              <div className="col-span-2"><Label>Bearer token</Label><Input type="password" value={providers.whatsapp_token ?? ""} onChange={e=>setProviders({...providers, whatsapp_token:e.target.value})} /></div>
              <div><Label>Phone number ID</Label><Input value={providers.whatsapp_phone_number_id ?? ""} onChange={e=>setProviders({...providers, whatsapp_phone_number_id:e.target.value})} /></div>
              <div><Label>Business account ID</Label><Input value={providers.whatsapp_business_id ?? ""} onChange={e=>setProviders({...providers, whatsapp_business_id:e.target.value})} /></div>
              <div><Label>Sender number</Label><Input value={providers.whatsapp_sender_number ?? ""} onChange={e=>setProviders({...providers, whatsapp_sender_number:e.target.value})} placeholder="+91 …" /></div>
              <div><Label>Approved template name</Label><Input value={providers.whatsapp_template_name ?? ""} onChange={e=>setProviders({...providers, whatsapp_template_name:e.target.value})} /></div>
              <div><Label>Template language</Label><Input value={providers.whatsapp_template_lang ?? "en"} onChange={e=>setProviders({...providers, whatsapp_template_lang:e.target.value})} /></div>
              <div><Label>Test WhatsApp recipient</Label><Input value={providers.test_whatsapp ?? ""} onChange={e=>setProviders({...providers, test_whatsapp:e.target.value})} /></div>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">SMS</div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Provider</Label><Input value={providers.sms_provider ?? ""} onChange={e=>setProviders({...providers, sms_provider:e.target.value})} /></div>
              <div><Label>API key</Label><Input type="password" value={providers.sms_api_key ?? ""} onChange={e=>setProviders({...providers, sms_api_key:e.target.value})} /></div>
              <div><Label>Sender ID</Label><Input value={providers.sms_sender_id ?? ""} onChange={e=>setProviders({...providers, sms_sender_id:e.target.value})} /></div>
              <div><Label>Test SMS number</Label><Input value={providers.test_sms ?? ""} onChange={e=>setProviders({...providers, test_sms:e.target.value})} /></div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveProviders}><Save className="h-4 w-4 mr-2" />Save providers</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Internal responsible persons</CardTitle>
          <Button size="sm" onClick={()=>{setEditing(null);setPForm(personEmpty);setOpen(true);}}><Plus className="h-4 w-4 mr-2" />Add person</Button>
        </CardHeader>
        <CardContent className="p-0">
          {persons.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={UserCog} title="No internal persons configured"
                description="Add the team members responsible for invoice generation, LOI follow-up, MSME / GST / court filings, etc."
                ctaLabel="Add person" onCta={()=>setOpen(true)} />
            </div>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Email</TableHead>
                <TableHead>WhatsApp</TableHead><TableHead>Responsibilities</TableHead><TableHead>Active</TableHead>
              </TableRow></TableHeader>
              <TableBody>{persons.map(p => (
                <TableRow key={p.id} className="cursor-pointer" onClick={()=>{setEditing(p);setPForm({...p, responsibilities: p.responsibilities ?? []});setOpen(true);}}>
                  <TableCell className="font-medium">{p.full_name}</TableCell>
                  <TableCell>{p.role ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{p.email ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{p.whatsapp ?? "—"}</TableCell>
                  <TableCell className="text-xs">{(p.responsibilities ?? []).join(", ")}</TableCell>
                  <TableCell><Badge variant={p.active ? "default" : "secondary"}>{p.active ? "active" : "inactive"}</Badge></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editing ? "Edit person" : "New responsible person"}</DialogTitle></DialogHeader>
          <form onSubmit={savePerson} className="grid grid-cols-2 gap-3">
            <div><Label>Full name *</Label><Input required value={pForm.full_name} onChange={e=>setPForm({...pForm, full_name:e.target.value})} /></div>
            <div><Label>Role / department</Label><Input value={pForm.role ?? ""} onChange={e=>setPForm({...pForm, role:e.target.value})} /></div>
            <div><Label>Email</Label><Input type="email" value={pForm.email ?? ""} onChange={e=>setPForm({...pForm, email:e.target.value})} /></div>
            <div><Label>WhatsApp</Label><Input value={pForm.whatsapp ?? ""} onChange={e=>setPForm({...pForm, whatsapp:e.target.value})} /></div>
            <div><Label>Phone</Label><Input value={pForm.phone ?? ""} onChange={e=>setPForm({...pForm, phone:e.target.value})} /></div>
            <div className="flex items-center gap-2 pt-6"><Switch checked={pForm.active} onCheckedChange={v=>setPForm({...pForm, active:v})} /><Label>Active</Label></div>
            <div className="col-span-2">
              <Label>Responsibilities</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {RESPS.map(r => {
                  const on = pForm.responsibilities.includes(r);
                  return <button key={r} type="button" onClick={()=>toggleResp(r)} className={`text-xs px-2.5 py-1 rounded-full border ${on ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"}`}>{r}</button>;
                })}
              </div>
            </div>
            <DialogFooter className="col-span-2"><Button type="submit">Save</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
