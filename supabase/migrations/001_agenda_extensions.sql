-- Colunas em falta em agenda_employees
ALTER TABLE agenda_employees
  ADD COLUMN IF NOT EXISTS working_hours jsonb DEFAULT '{
    "0":{"active":false},
    "1":{"active":true,"start":"09:00","end":"18:00"},
    "2":{"active":true,"start":"09:00","end":"18:00"},
    "3":{"active":true,"start":"09:00","end":"18:00"},
    "4":{"active":true,"start":"09:00","end":"18:00"},
    "5":{"active":true,"start":"09:00","end":"18:00"},
    "6":{"active":false}
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS specialties text;

-- Colunas em falta em agenda_companies
ALTER TABLE agenda_companies
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS phone text;

-- Fila Virtual Walk-in
CREATE TABLE IF NOT EXISTS agenda_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES agenda_companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  service_id uuid REFERENCES agenda_services(id),
  service_name text,
  position int NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','called','done','left','converted')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  notified_at timestamptz,
  finished_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_agenda_queue_company_status ON agenda_queue(company_id, status);
ALTER TABLE agenda_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_queue" ON agenda_queue FOR ALL USING (
  company_id = (SELECT agenda_get_my_company_id())
);
-- Política pública para clientes entrarem na fila (sem autenticação)
CREATE POLICY "public_join_queue" ON agenda_queue FOR INSERT WITH CHECK (true);
CREATE POLICY "public_read_queue" ON agenda_queue FOR SELECT USING (status IN ('waiting','called'));

-- Membership Plans
CREATE TABLE IF NOT EXISTS agenda_membership_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES agenda_companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  billing_period text NOT NULL DEFAULT 'monthly' CHECK (billing_period IN ('monthly','quarterly')),
  services_per_month int NOT NULL DEFAULT 2,
  stripe_price_id text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE agenda_membership_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_membership_plans" ON agenda_membership_plans FOR ALL USING (
  company_id = (SELECT agenda_get_my_company_id())
);

-- Client Memberships
CREATE TABLE IF NOT EXISTS agenda_client_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES agenda_companies(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES agenda_clients(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES agenda_membership_plans(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled','expired')),
  stripe_subscription_id text,
  services_used int NOT NULL DEFAULT 0,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE agenda_client_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_client_memberships" ON agenda_client_memberships FOR ALL USING (
  company_id = (SELECT agenda_get_my_company_id())
);

-- Índice único para evitar duplicados de cliente na fila activa
CREATE UNIQUE INDEX IF NOT EXISTS idx_queue_active_phone
  ON agenda_queue(company_id, phone)
  WHERE status IN ('waiting','called') AND phone IS NOT NULL;
