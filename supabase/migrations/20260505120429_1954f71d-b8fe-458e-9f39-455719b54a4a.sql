
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('super_admin','company_admin','manager','team_leader','recruiter','finance','collection','legal','viewer');
CREATE TYPE public.payment_status AS ENUM ('pending','partial','paid','cancelled','credit_note');
CREATE TYPE public.automation_status AS ENUM ('not_started','running','paused','stopped','completed');
CREATE TYPE public.dispatch_status AS ENUM ('queued','sent','failed','skipped');
CREATE TYPE public.channel AS ENUM ('email','whatsapp','sms','internal');

-- COMPANIES
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand_name TEXT,
  logo_url TEXT,
  default_send_time_ist TIME NOT NULL DEFAULT '13:00',
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- USER ROLES (separate table — required)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, company_id)
);

-- SECURITY DEFINER HELPERS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin')
$$;

CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$;

-- AUTO PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- CLIENTS
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  legal_name TEXT,
  contact_person TEXT,
  email TEXT,
  whatsapp TEXT,
  phone TEXT,
  gst_number TEXT,
  address TEXT,
  payment_due_days INT NOT NULL DEFAULT 30,
  service_fee_pct NUMERIC(5,2),
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- BILLING CASES (placement → invoice → collection)
CREATE TABLE public.billing_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  job_title TEXT,
  joining_date DATE,
  ctc NUMERIC(14,2),
  billing_pct NUMERIC(5,2),
  taxable_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  gst_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  due_date DATE,
  performa_invoice_no TEXT,
  tax_invoice_no TEXT,
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  automation_status public.automation_status NOT NULL DEFAULT 'not_started',
  current_stage INT NOT NULL DEFAULT 1,
  current_stage_day INT NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  pause_reason TEXT,
  responsible_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bc_next_run ON public.billing_cases (next_run_at) WHERE automation_status = 'running';
CREATE INDEX idx_bc_company ON public.billing_cases (company_id);
CREATE TRIGGER trg_bc_updated BEFORE UPDATE ON public.billing_cases FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- PAYMENTS
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  billing_case_id UUID NOT NULL REFERENCES public.billing_cases(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TEMPLATES
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  template_key TEXT NOT NULL,
  category TEXT NOT NULL,
  channel public.channel NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, template_key, channel)
);
CREATE TRIGGER trg_tpl_updated BEFORE UPDATE ON public.templates FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- WORKFLOW STEPS (defines stage progression)
CREATE TABLE public.collection_workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage INT NOT NULL,
  day_offset INT NOT NULL, -- days relative to due_date (negative = before)
  template_key TEXT NOT NULL,
  label TEXT NOT NULL,
  UNIQUE (stage, day_offset)
);

-- DISPATCH LOGS
CREATE TABLE public.dispatch_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  billing_case_id UUID REFERENCES public.billing_cases(id) ON DELETE CASCADE,
  channel public.channel NOT NULL,
  recipient TEXT,
  template_key TEXT,
  stage INT,
  stage_day INT,
  status public.dispatch_status NOT NULL,
  subject TEXT,
  body TEXT,
  error TEXT,
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (idempotency_key)
);
CREATE INDEX idx_dl_case ON public.dispatch_logs (billing_case_id, created_at DESC);

-- ENABLE RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES: profiles
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_super_admin(auth.uid()));
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- POLICIES: user_roles (read own, super admin all)
CREATE POLICY "view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));
CREATE POLICY "super admin manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- POLICIES: companies
CREATE POLICY "view own company" ON public.companies FOR SELECT TO authenticated USING (id = public.current_company_id() OR public.is_super_admin(auth.uid()));
CREATE POLICY "super admin manage companies" ON public.companies FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "company admin update own" ON public.companies FOR UPDATE TO authenticated USING (id = public.current_company_id() AND public.has_role(auth.uid(),'company_admin'));

-- Generic tenant policy macro applied per-table:
-- view = same company OR super_admin
-- write = same company AND not viewer
CREATE POLICY "tenant select" ON public.clients FOR SELECT TO authenticated USING (company_id = public.current_company_id() OR public.is_super_admin(auth.uid()));
CREATE POLICY "tenant write" ON public.clients FOR ALL TO authenticated USING (company_id = public.current_company_id() AND NOT public.has_role(auth.uid(),'viewer')) WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "tenant select" ON public.billing_cases FOR SELECT TO authenticated USING (company_id = public.current_company_id() OR public.is_super_admin(auth.uid()));
CREATE POLICY "tenant write" ON public.billing_cases FOR ALL TO authenticated USING (company_id = public.current_company_id() AND NOT public.has_role(auth.uid(),'viewer')) WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "tenant select" ON public.payments FOR SELECT TO authenticated USING (company_id = public.current_company_id() OR public.is_super_admin(auth.uid()));
CREATE POLICY "tenant write" ON public.payments FOR ALL TO authenticated USING (company_id = public.current_company_id() AND NOT public.has_role(auth.uid(),'viewer')) WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "tenant select" ON public.templates FOR SELECT TO authenticated USING (company_id = public.current_company_id() OR public.is_super_admin(auth.uid()));
CREATE POLICY "tenant write" ON public.templates FOR ALL TO authenticated USING (company_id = public.current_company_id() AND NOT public.has_role(auth.uid(),'viewer')) WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "tenant select" ON public.dispatch_logs FOR SELECT TO authenticated USING (company_id = public.current_company_id() OR public.is_super_admin(auth.uid()));
-- writes only via service role (server scheduler)

CREATE POLICY "all read steps" ON public.collection_workflow_steps FOR SELECT TO authenticated USING (true);

-- Seed default workflow steps (offsets relative to due_date)
INSERT INTO public.collection_workflow_steps (stage, day_offset, template_key, label) VALUES
  (3, -2, 'reminder_due_soon', 'Payment reminder (2 days before)'),
  (4, 0,  'reminder_due_today', 'Payment due today'),
  (5, 1,  'overdue_d1', 'Overdue day 1'),
  (5, 3,  'overdue_d3', 'Overdue day 3'),
  (5, 5,  'overdue_d5', 'Overdue day 5'),
  (5, 7,  'overdue_d7', 'Overdue day 7'),
  (6, 8,  'legal_notice_1', 'Legal notice 1'),
  (7, 9,  'legal_notice_2', 'Legal notice 2'),
  (8, 10, 'legal_notice_3', 'Legal notice 3'),
  (9, 11, 'legal_notice_4', 'Legal notice 4'),
  (10,12, 'advocate_letter', 'Advocate legal letter'),
  (12,20, 'msme_warning', 'MSME portal warning'),
  (13,22, 'gst_warning', 'GST portal warning'),
  (14,24, 'third_party_warning', 'Third party recovery warning'),
  (15,26, 'court_transfer', 'Court transfer notice');
