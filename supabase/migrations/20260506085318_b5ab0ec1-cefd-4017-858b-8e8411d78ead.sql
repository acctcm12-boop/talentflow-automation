
-- 1) Workspace creation RPC (security definer)
CREATE OR REPLACE FUNCTION public.create_workspace(company_name text, brand_name text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  existing uuid;
  new_company_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF company_name IS NULL OR length(trim(company_name)) = 0 THEN RAISE EXCEPTION 'company_name_required'; END IF;

  INSERT INTO public.profiles (id, full_name)
    VALUES (uid, NULL)
    ON CONFLICT (id) DO NOTHING;

  SELECT company_id INTO existing FROM public.profiles WHERE id = uid;
  IF existing IS NOT NULL THEN RETURN existing; END IF;

  INSERT INTO public.companies (name, brand_name)
    VALUES (trim(company_name), NULLIF(trim(coalesce(brand_name,'')),''))
    RETURNING id INTO new_company_id;

  UPDATE public.profiles SET company_id = new_company_id, updated_at = now() WHERE id = uid;

  INSERT INTO public.user_roles (user_id, role, company_id)
    VALUES (uid, 'company_admin', new_company_id)
    ON CONFLICT (user_id, role, company_id) DO NOTHING;

  RETURN new_company_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_workspace(text, text) TO authenticated;

-- 2) Replace collection workflow steps with full 15-stage daily flow
DELETE FROM public.collection_workflow_steps;
INSERT INTO public.collection_workflow_steps (stage, day_offset, template_key, label) VALUES
  (1, -7, 'service_complete',     'Service / placement completion'),
  (2, -5, 'performa_issued',      'Performa Invoice issued'),
  (3, -2, 'reminder_due_soon',    'Payment reminder (2 days before)'),
  (4,  0, 'tax_invoice_due',      'Tax Invoice due'),
  (5,  1, 'overdue_d1',           'Gentle reminder — day 1'),
  (5,  2, 'overdue_d2',           'Gentle reminder — day 2'),
  (5,  3, 'overdue_d3',           'Gentle reminder — day 3'),
  (5,  4, 'overdue_d4',           'Gentle reminder — day 4'),
  (5,  5, 'overdue_d5',           'Gentle reminder — day 5'),
  (5,  6, 'overdue_d6',           'Gentle reminder — day 6'),
  (5,  7, 'overdue_d7',           'Gentle reminder — day 7'),
  (6,  8, 'legal_notice_1',       'Legal notice 1'),
  (7,  9, 'legal_notice_2',       'Legal notice 2'),
  (8, 10, 'legal_notice_3',       'Legal notice 3'),
  (9, 11, 'legal_notice_4',       'Legal notice 4'),
  (10,12, 'advocate_letter',      'Advocate legal letter'),
  (11,13, 'strict_d13',           'Strict reminder — day 13'),
  (11,14, 'strict_d14',           'Strict reminder — day 14'),
  (11,15, 'strict_d15',           'Strict reminder — day 15'),
  (11,16, 'strict_d16',           'Strict reminder — day 16'),
  (11,17, 'strict_d17',           'Strict reminder — day 17'),
  (11,18, 'strict_d18',           'Strict reminder — day 18'),
  (11,19, 'strict_d19',           'Strict reminder — day 19'),
  (12,20, 'msme_warning_d20',     'MSME portal warning — day 20'),
  (12,21, 'msme_warning_d21',     'MSME portal warning — day 21'),
  (13,22, 'gst_warning_d22',      'GST portal warning — day 22'),
  (13,23, 'gst_warning_d23',      'GST portal warning — day 23'),
  (14,24, 'third_party_d24',      'Third-party / recovery warning — day 24'),
  (14,25, 'third_party_d25',      'Third-party / recovery warning — day 25'),
  (15,26, 'court_transfer',       'Court transfer notice');

-- 3) Candidates
CREATE TABLE IF NOT EXISTS public.candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  full_name text NOT NULL,
  email text, phone text, whatsapp text,
  location text, current_ctc numeric, expected_ctc numeric,
  notice_period text, resume_url text,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant select" ON public.candidates;
CREATE POLICY "tenant select" ON public.candidates FOR SELECT TO authenticated
  USING (company_id = current_company_id() OR is_super_admin(auth.uid()));
DROP POLICY IF EXISTS "tenant write" ON public.candidates;
CREATE POLICY "tenant write" ON public.candidates FOR ALL TO authenticated
  USING (company_id = current_company_id() AND NOT has_role(auth.uid(),'viewer'))
  WITH CHECK (company_id = current_company_id());
CREATE TRIGGER trg_touch_candidates BEFORE UPDATE ON public.candidates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4) Jobs
CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  client_id uuid,
  job_title text NOT NULL,
  location text,
  salary_min numeric, salary_max numeric,
  positions int NOT NULL DEFAULT 1,
  skills text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant select" ON public.jobs;
CREATE POLICY "tenant select" ON public.jobs FOR SELECT TO authenticated
  USING (company_id = current_company_id() OR is_super_admin(auth.uid()));
DROP POLICY IF EXISTS "tenant write" ON public.jobs;
CREATE POLICY "tenant write" ON public.jobs FOR ALL TO authenticated
  USING (company_id = current_company_id() AND NOT has_role(auth.uid(),'viewer'))
  WITH CHECK (company_id = current_company_id());
CREATE TRIGGER trg_touch_jobs BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 5) Interviews
CREATE TABLE IF NOT EXISTS public.interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  candidate_id uuid,
  client_id uuid,
  job_id uuid,
  scheduled_at timestamptz,
  mode text NOT NULL DEFAULT 'online',
  meeting_link text,
  location text,
  recruiter text,
  status text NOT NULL DEFAULT 'scheduled',
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant select" ON public.interviews;
CREATE POLICY "tenant select" ON public.interviews FOR SELECT TO authenticated
  USING (company_id = current_company_id() OR is_super_admin(auth.uid()));
DROP POLICY IF EXISTS "tenant write" ON public.interviews;
CREATE POLICY "tenant write" ON public.interviews FOR ALL TO authenticated
  USING (company_id = current_company_id() AND NOT has_role(auth.uid(),'viewer'))
  WITH CHECK (company_id = current_company_id());
CREATE TRIGGER trg_touch_interviews BEFORE UPDATE ON public.interviews
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 6) Placements
CREATE TABLE IF NOT EXISTS public.placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  candidate_id uuid,
  client_id uuid,
  job_id uuid,
  selection_date date,
  loi_status text NOT NULL DEFAULT 'pending',
  joining_date date,
  candidate_confirmed boolean NOT NULL DEFAULT false,
  client_confirmed boolean NOT NULL DEFAULT false,
  ctc numeric,
  billing_pct numeric,
  status text NOT NULL DEFAULT 'selected',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant select" ON public.placements;
CREATE POLICY "tenant select" ON public.placements FOR SELECT TO authenticated
  USING (company_id = current_company_id() OR is_super_admin(auth.uid()));
DROP POLICY IF EXISTS "tenant write" ON public.placements;
CREATE POLICY "tenant write" ON public.placements FOR ALL TO authenticated
  USING (company_id = current_company_id() AND NOT has_role(auth.uid(),'viewer'))
  WITH CHECK (company_id = current_company_id());
CREATE TRIGGER trg_touch_placements BEFORE UPDATE ON public.placements
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 7) Internal responsible persons
CREATE TABLE IF NOT EXISTS public.internal_persons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  full_name text NOT NULL,
  role text,
  email text, whatsapp text, phone text,
  responsibilities text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.internal_persons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant select" ON public.internal_persons;
CREATE POLICY "tenant select" ON public.internal_persons FOR SELECT TO authenticated
  USING (company_id = current_company_id() OR is_super_admin(auth.uid()));
DROP POLICY IF EXISTS "tenant write" ON public.internal_persons;
CREATE POLICY "tenant write" ON public.internal_persons FOR ALL TO authenticated
  USING (company_id = current_company_id() AND NOT has_role(auth.uid(),'viewer'))
  WITH CHECK (company_id = current_company_id());

-- 8) Provider settings
CREATE TABLE IF NOT EXISTS public.provider_settings (
  company_id uuid PRIMARY KEY,
  email_smtp_host text, email_smtp_port int, email_smtp_user text, email_smtp_pass text,
  email_sender text, email_sender_name text,
  whatsapp_provider text DEFAULT 'com.bot',
  whatsapp_base_url text DEFAULT 'https://crmapi.com.bot',
  whatsapp_api_version text DEFAULT 'v19.0',
  whatsapp_token text, whatsapp_phone_number_id text, whatsapp_business_id text,
  whatsapp_sender_number text, whatsapp_template_name text, whatsapp_template_lang text DEFAULT 'en',
  sms_provider text, sms_api_key text, sms_sender_id text,
  test_email text, test_whatsapp text, test_sms text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.provider_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant rw" ON public.provider_settings;
CREATE POLICY "tenant rw" ON public.provider_settings FOR ALL TO authenticated
  USING (company_id = current_company_id() AND has_role(auth.uid(),'company_admin'))
  WITH CHECK (company_id = current_company_id());

-- 9) Audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  actor_id uuid,
  entity text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant select" ON public.audit_logs;
CREATE POLICY "tenant select" ON public.audit_logs FOR SELECT TO authenticated
  USING (company_id = current_company_id() OR is_super_admin(auth.uid()));
DROP POLICY IF EXISTS "tenant insert" ON public.audit_logs;
CREATE POLICY "tenant insert" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (company_id = current_company_id());
