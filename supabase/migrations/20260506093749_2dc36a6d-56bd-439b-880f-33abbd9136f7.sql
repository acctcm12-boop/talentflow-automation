
-- AUTOMATION JOBS
CREATE TABLE IF NOT EXISTS public.automation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  user_id uuid,
  workflow_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  recipient_type text,
  recipient_name text,
  recipient_channel text NOT NULL DEFAULT 'email',
  recipient_contact text,
  template_key text,
  subject text,
  body text,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  retry_count int NOT NULL DEFAULT 0,
  idempotency_key text UNIQUE,
  last_error text,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS automation_jobs_due_idx ON public.automation_jobs(company_id, status, scheduled_at);
ALTER TABLE public.automation_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant select" ON public.automation_jobs;
CREATE POLICY "tenant select" ON public.automation_jobs FOR SELECT TO authenticated
  USING (company_id = current_company_id() OR is_super_admin(auth.uid()));
DROP POLICY IF EXISTS "tenant write" ON public.automation_jobs;
CREATE POLICY "tenant write" ON public.automation_jobs FOR ALL TO authenticated
  USING (company_id = current_company_id() AND NOT has_role(auth.uid(), 'viewer'::app_role))
  WITH CHECK (company_id = current_company_id());
DROP TRIGGER IF EXISTS aj_touch ON public.automation_jobs;
CREATE TRIGGER aj_touch BEFORE UPDATE ON public.automation_jobs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- AI COPILOT
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  user_id uuid NOT NULL,
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own conv rw" ON public.ai_conversations;
CREATE POLICY "own conv rw" ON public.ai_conversations FOR ALL TO authenticated
  USING (company_id = current_company_id() AND user_id = auth.uid())
  WITH CHECK (company_id = current_company_id() AND user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  referenced_entities jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_messages_conv_idx ON public.ai_messages(conversation_id, created_at);
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own msg rw" ON public.ai_messages;
CREATE POLICY "own msg rw" ON public.ai_messages FOR ALL TO authenticated
  USING (company_id = current_company_id() AND user_id = auth.uid())
  WITH CHECK (company_id = current_company_id() AND user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.ai_query_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  user_id uuid NOT NULL,
  question text NOT NULL,
  answer text,
  referenced_entities jsonb DEFAULT '[]'::jsonb,
  tokens_in int, tokens_out int,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_query_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own log rw" ON public.ai_query_logs;
CREATE POLICY "own log rw" ON public.ai_query_logs FOR ALL TO authenticated
  USING (company_id = current_company_id() AND user_id = auth.uid())
  WITH CHECK (company_id = current_company_id() AND user_id = auth.uid());

-- PROVIDER SETTINGS: AI fields
ALTER TABLE public.provider_settings
  ADD COLUMN IF NOT EXISTS ai_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ai_provider text DEFAULT 'lovable',
  ADD COLUMN IF NOT EXISTS ai_model text DEFAULT 'google/gemini-3-flash-preview',
  ADD COLUMN IF NOT EXISTS ai_system_prompt text;

-- COMPANIES: workspace branding
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS gst_rate numeric DEFAULT 18,
  ADD COLUMN IF NOT EXISTS default_billing_pct numeric DEFAULT 8.33,
  ADD COLUMN IF NOT EXISTS default_payment_due_days int DEFAULT 30,
  ADD COLUMN IF NOT EXISTS upi_id text,
  ADD COLUMN IF NOT EXISTS bank_details text,
  ADD COLUMN IF NOT EXISTS payment_qr_url text;

-- SEED DEFAULT TEMPLATES RPC
CREATE OR REPLACE FUNCTION public.seed_default_templates()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cid uuid := current_company_id(); inserted int := 0; r record;
BEGIN
  IF cid IS NULL THEN RAISE EXCEPTION 'no_workspace'; END IF;
  FOR r IN
    SELECT * FROM (VALUES
      ('candidate_interview_confirmation','candidate','whatsapp','Interview confirmed','Hi {{candidateName}}, your interview with {{clientName}} for {{jobTitle}} is confirmed on {{interviewAt}}. Please confirm.'),
      ('candidate_interview_24h_reminder','candidate','whatsapp',NULL,'Hi {{candidateName}}, reminder: your interview with {{clientName}} is tomorrow at {{interviewAt}}.'),
      ('candidate_interview_3h_reminder','candidate','whatsapp',NULL,'Hi {{candidateName}}, your interview is in 3 hours at {{interviewAt}}.'),
      ('candidate_interview_1h_reminder','candidate','whatsapp',NULL,'Hi {{candidateName}}, your interview starts in 1 hour.'),
      ('candidate_interview_30m_reminder','candidate','whatsapp',NULL,'Hi {{candidateName}}, your interview starts in 30 minutes. Please be ready.'),
      ('candidate_reached_confirmation','candidate','whatsapp',NULL,'Hi {{candidateName}}, please confirm once you reach the interview venue / join the call.'),
      ('candidate_feedback_request','candidate','whatsapp',NULL,'Hi {{candidateName}}, how did your interview with {{clientName}} go? Please share your feedback.'),
      ('client_interview_confirmation','client','email','Interview scheduled — {{candidateName}}','Dear {{contactPerson}}, the interview for {{candidateName}} ({{jobTitle}}) is scheduled at {{interviewAt}}.'),
      ('client_interview_24h_reminder','client','email','Reminder: interview tomorrow','Dear {{contactPerson}}, reminder of the interview with {{candidateName}} tomorrow at {{interviewAt}}.'),
      ('client_interview_3h_reminder','client','email','Interview in 3 hours','Dear {{contactPerson}}, the interview with {{candidateName}} is in 3 hours.'),
      ('client_interview_30m_reminder','client','email','Interview in 30 minutes','Dear {{contactPerson}}, the interview with {{candidateName}} starts in 30 minutes.'),
      ('client_feedback_request','client','email','Feedback request — {{candidateName}}','Dear {{contactPerson}}, kindly share your feedback for {{candidateName}}.'),
      ('client_selected_followup','client','email','Selection confirmation needed','Dear {{contactPerson}}, please confirm the selection of {{candidateName}} so we can proceed with LOI.'),
      ('loi_request','client','email','LOI request for {{candidateName}}','Dear {{contactPerson}}, please share the Letter of Intent for {{candidateName}} at the earliest.'),
      ('loi_pending_client','client','email','LOI pending','Dear {{contactPerson}}, the LOI for {{candidateName}} is still pending. Please process it.'),
      ('loi_received_candidate','candidate','whatsapp',NULL,'Hi {{candidateName}}, your LOI from {{clientName}} has been received. Please confirm acceptance.'),
      ('joining_reminder_candidate','candidate','whatsapp',NULL,'Hi {{candidateName}}, your joining at {{clientName}} is on {{joiningDate}}.'),
      ('joining_reminder_client','client','email','Joining reminder — {{candidateName}}','Dear {{contactPerson}}, {{candidateName}} is scheduled to join on {{joiningDate}}.'),
      ('joining_confirmation_candidate','candidate','whatsapp',NULL,'Hi {{candidateName}}, please confirm once you have joined {{clientName}}.'),
      ('joining_confirmation_client','client','email','Confirm joining','Dear {{contactPerson}}, please confirm {{candidateName}}''s joining at your end.'),
      ('performa_invoice_issued','client','email','Performa Invoice {{performaInvoiceNumber}}','Dear {{contactPerson}}, please find the Performa Invoice for {{candidateName}}. Amount: {{invoiceAmount}}.'),
      ('tax_invoice_due','client','email','Tax Invoice {{taxInvoiceNumber}} — payment due','Dear {{contactPerson}}, the Tax Invoice {{taxInvoiceNumber}} of {{invoiceAmount}} is due on {{dueDate}}.'),
      ('due_soon_reminder','client','email','Payment due in 2 days','Dear {{contactPerson}}, this is a reminder that {{taxInvoiceNumber}} is due on {{dueDate}}.'),
      ('overdue_gentle_reminder','client','email','Gentle reminder — {{taxInvoiceNumber}}','Dear {{contactPerson}}, the payment against {{taxInvoiceNumber}} is overdue. Kindly arrange the same at the earliest.'),
      ('legal_notice_1','client','email','Legal Notice — {{taxInvoiceNumber}}','Dear {{contactPerson}}, this is a legal notice regarding the unpaid Tax Invoice {{taxInvoiceNumber}}.'),
      ('legal_notice_2','client','email','Second legal notice — {{taxInvoiceNumber}}','Dear {{contactPerson}}, this is the second legal notice for unpaid {{taxInvoiceNumber}}.'),
      ('legal_notice_3','client','email','Third legal notice — {{taxInvoiceNumber}}','Dear {{contactPerson}}, third legal notice for unpaid {{taxInvoiceNumber}}.'),
      ('legal_notice_4','client','email','Final legal notice — {{taxInvoiceNumber}}','Dear {{contactPerson}}, final legal notice for unpaid {{taxInvoiceNumber}} before advocate transfer.'),
      ('advocate_letter','client','email','Advocate notice — {{taxInvoiceNumber}}','Dear {{contactPerson}}, your case is being escalated to our advocate.'),
      ('strict_payment_reminder','client','email','Strict reminder — {{taxInvoiceNumber}}','Dear {{contactPerson}}, immediate payment required for {{taxInvoiceNumber}}.'),
      ('msme_warning','client','email','MSME complaint warning','Dear {{contactPerson}}, non-payment may lead to MSME Samadhaan complaint.'),
      ('gst_warning','client','email','GST authority intimation','Dear {{contactPerson}}, non-payment may be reported to GST authorities.'),
      ('third_party_warning','client','email','Third-party recovery / CreditQ warning','Dear {{contactPerson}}, the case may be transferred to CreditQ / third-party recovery.'),
      ('court_transfer_notice','client','email','Court transfer notice','Dear {{contactPerson}}, this is a final notice before court transfer.'),
      ('payment_thank_you','client','email','Thank you for the payment','Dear {{contactPerson}}, thank you for the payment against {{taxInvoiceNumber}}.'),
      ('cancellation_credit_note','client','email','Credit note — {{taxInvoiceNumber}}','Dear {{contactPerson}}, please find attached credit note. The case has been closed.'),
      ('internal_pending_action','internal','email','Pending action','Internal alert: {{actionTitle}} pending for {{clientName}} / {{candidateName}}.'),
      ('internal_invoice_pending','internal','email','Invoice pending','Performa/Tax Invoice not generated for {{candidateName}}.'),
      ('internal_msme_pending','internal','email','MSME action pending','MSME filing pending for {{clientName}} ({{taxInvoiceNumber}}).'),
      ('internal_gst_pending','internal','email','GST action pending','GST escalation pending for {{clientName}}.'),
      ('internal_court_pending','internal','email','Court filing pending','Court filing pending for {{clientName}} ({{taxInvoiceNumber}}).'),
      ('advocate_court_filing_reminder','advocate','email','Court filing required','Please proceed with court filing for {{clientName}} — {{taxInvoiceNumber}}.')
    ) AS t(template_key, category, channel, subject, body)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.templates WHERE company_id = cid AND template_key = r.template_key) THEN
      INSERT INTO public.templates(company_id, template_key, category, channel, subject, body, active)
        VALUES (cid, r.template_key, r.category, r.channel::channel, r.subject, r.body, true);
      inserted := inserted + 1;
    END IF;
  END LOOP;
  RETURN inserted;
END $$;

-- DEMO DATA RPC (idempotent — only seeds if no clients)
CREATE OR REPLACE FUNCTION public.load_demo_data()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cid uuid := current_company_id();
  cl1 uuid; cl2 uuid; cl3 uuid; cl4 uuid; cl5 uuid;
  ca1 uuid; ca2 uuid; ca3 uuid;
  jb1 uuid; jb2 uuid; jb3 uuid;
  bc_paid uuid; bc_overdue uuid; bc_legal uuid;
  cnt int;
BEGIN
  IF cid IS NULL THEN RAISE EXCEPTION 'no_workspace'; END IF;
  SELECT count(*) INTO cnt FROM public.clients WHERE company_id = cid;
  IF cnt > 0 THEN RETURN jsonb_build_object('skipped', true, 'reason', 'data_exists'); END IF;

  INSERT INTO public.clients(company_id,company_name,contact_person,email,whatsapp,payment_due_days,service_fee_pct)
  VALUES
    (cid,'ABC Pvt Ltd','Rohan Mehta','rohan@abc.example','919876500001',30,8.33) RETURNING id INTO cl1;
  INSERT INTO public.clients(company_id,company_name,contact_person,email,whatsapp,payment_due_days,service_fee_pct)
  VALUES
    (cid,'XYZ Industries','Anita Verma','anita@xyz.example','919876500002',45,10),
    (cid,'Helix Tech','Sameer Khan','sameer@helix.example','919876500003',30,8.33),
    (cid,'NorthStar Pharma','Pooja Iyer','pooja@northstar.example','919876500004',30,8.5),
    (cid,'Vertex Logistics','Karan Singh','karan@vertex.example','919876500005',60,7.5);

  SELECT id INTO cl2 FROM public.clients WHERE company_id=cid AND company_name='XYZ Industries';
  SELECT id INTO cl3 FROM public.clients WHERE company_id=cid AND company_name='Helix Tech';
  SELECT id INTO cl4 FROM public.clients WHERE company_id=cid AND company_name='NorthStar Pharma';
  SELECT id INTO cl5 FROM public.clients WHERE company_id=cid AND company_name='Vertex Logistics';

  INSERT INTO public.candidates(company_id,full_name,email,phone,whatsapp,location,current_ctc,expected_ctc,notice_period)
  VALUES
    (cid,'Rahul Sharma','rahul.sharma@example.com','919811100001','919811100001','Mumbai',1200000,1500000,'30 days') RETURNING id INTO ca1;
  INSERT INTO public.candidates(company_id,full_name,email,phone,whatsapp,location,current_ctc,expected_ctc,notice_period)
  VALUES
    (cid,'Priya Nair','priya.nair@example.com','919811100002','919811100002','Bangalore',1800000,2200000,'60 days') RETURNING id INTO ca2;
  INSERT INTO public.candidates(company_id,full_name,email,phone,whatsapp,location,current_ctc,expected_ctc,notice_period)
  VALUES
    (cid,'Aman Gupta','aman.gupta@example.com','919811100003','919811100003','Pune',900000,1200000,'15 days') RETURNING id INTO ca3;
  INSERT INTO public.candidates(company_id,full_name,email,phone,whatsapp,location,current_ctc,expected_ctc)
  VALUES
    (cid,'Sneha Kulkarni','sneha@example.com','919811100004','919811100004','Mumbai',2400000,2800000),
    (cid,'Vikas Yadav','vikas@example.com','919811100005','919811100005','Delhi',1500000,1800000),
    (cid,'Megha Singh','megha@example.com','919811100006','919811100006','Hyderabad',1100000,1400000),
    (cid,'Arjun Rao','arjun@example.com','919811100007','919811100007','Chennai',2000000,2400000),
    (cid,'Ishita Banerjee','ishita@example.com','919811100008','919811100008','Kolkata',1300000,1600000),
    (cid,'Rohit Joshi','rohit@example.com','919811100009','919811100009','Ahmedabad',1700000,2000000),
    (cid,'Neha Kapoor','neha@example.com','919811100010','919811100010','Gurgaon',2100000,2500000);

  INSERT INTO public.jobs(company_id,client_id,job_title,location,salary_min,salary_max,positions,skills)
  VALUES (cid,cl1,'Senior Backend Engineer','Mumbai',1500000,2200000,2,'Node.js, PostgreSQL, AWS') RETURNING id INTO jb1;
  INSERT INTO public.jobs(company_id,client_id,job_title,location,salary_min,salary_max,positions,skills)
  VALUES (cid,cl2,'Product Manager','Bangalore',2000000,2800000,1,'B2B SaaS, Roadmapping') RETURNING id INTO jb2;
  INSERT INTO public.jobs(company_id,client_id,job_title,location,salary_min,salary_max,positions,skills)
  VALUES (cid,cl3,'Data Scientist','Remote',1800000,2500000,1,'Python, ML, NLP') RETURNING id INTO jb3;

  INSERT INTO public.interviews(company_id,candidate_id,client_id,job_id,scheduled_at,mode,recruiter,status)
  VALUES
    (cid,ca1,cl1,jb1, now() + interval '1 day', 'online','Neeraj','scheduled'),
    (cid,ca2,cl2,jb2, now() + interval '2 day', 'online','Neeraj','candidate_confirmation_pending'),
    (cid,ca3,cl3,jb3, now() - interval '1 day', 'offline','Sara','feedback_pending'),
    (cid,ca1,cl4,NULL, now() + interval '4 day', 'online','Sara','scheduled'),
    (cid,ca2,cl5,NULL, now() - interval '3 day', 'online','Neeraj','selected');

  INSERT INTO public.placements(company_id,candidate_id,client_id,job_id,selection_date,joining_date,loi_status,candidate_confirmed,client_confirmed,ctc,billing_pct,status)
  VALUES
    (cid,ca2,cl2,jb2, current_date - 3, current_date + 14,'accepted',true,true,2200000,8.33,'joining_pending'),
    (cid,ca3,cl3,jb3, current_date - 10, current_date - 1,'accepted',true,true,1500000,10,'joined');

  -- billing cases
  INSERT INTO public.billing_cases(company_id,client_id,candidate_name,job_title,joining_date,ctc,billing_pct,taxable_amount,gst_amount,total_amount,due_date,tax_invoice_no,payment_status,automation_status,current_stage,current_stage_day,next_run_at)
  VALUES (cid,cl3,'Aman Gupta','Data Scientist', current_date - 1, 1500000, 10, 150000, 27000, 177000, current_date + 25, 'TINV-100', 'pending','running',1,0, now()) RETURNING id INTO bc_paid;
  -- mark first as paid
  UPDATE public.billing_cases SET payment_status='paid', automation_status='completed', next_run_at=NULL WHERE id=bc_paid;
  INSERT INTO public.payments(company_id, billing_case_id, amount, reference) VALUES (cid, bc_paid, 177000,'UTR123456');

  INSERT INTO public.billing_cases(company_id,client_id,candidate_name,job_title,joining_date,ctc,billing_pct,taxable_amount,gst_amount,total_amount,due_date,tax_invoice_no,payment_status,automation_status,current_stage,current_stage_day,next_run_at)
  VALUES (cid,cl1,'Rahul Sharma','Senior Backend Engineer', current_date - 35, 1800000, 8.33, 150000, 27000, 177000, current_date - 10, 'TINV-101','pending','running',5,5, now()) RETURNING id INTO bc_overdue;

  INSERT INTO public.billing_cases(company_id,client_id,candidate_name,job_title,joining_date,ctc,billing_pct,taxable_amount,gst_amount,total_amount,due_date,tax_invoice_no,payment_status,automation_status,current_stage,current_stage_day,next_run_at)
  VALUES (cid,cl2,'Priya Nair','Product Manager', current_date - 50, 2200000, 8.33, 183260, 32987, 216247, current_date - 22, 'TINV-102','pending','running',12,22, now()) RETURNING id INTO bc_legal;

  RETURN jsonb_build_object('ok',true,'clients',5,'candidates',10,'jobs',3,'interviews',5,'placements',2,'billing_cases',3);
END $$;

CREATE OR REPLACE FUNCTION public.cancel_pending_jobs(_case_id uuid)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  UPDATE public.automation_jobs
    SET status='cancelled', updated_at=now()
    WHERE company_id = current_company_id()
      AND entity_type='billing_case' AND entity_id=_case_id AND status='pending';
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
