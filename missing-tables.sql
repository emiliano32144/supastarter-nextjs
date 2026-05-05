-- ============================================================
-- TABLAS FALTANTES - Ejecutar en Supabase SQL Editor
-- ============================================================
-- Modulos cubiertos:
--   1. ReservasPro: style_gallery, client_profiles, earned_rewards, xp_history, cut_photos
--   2. ContentFlow: agencies, agency_clients, content_calendar
--   3. InvoiceFlow: invoices, invoice_items, invoice_clients
--   4. TaskFlow:    tasks
-- ============================================================


-- ============================================================
-- 1. RESERVASPRO - GALERIA DE ESTILOS (admin)
-- ============================================================

CREATE TABLE IF NOT EXISTS style_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  base_price DECIMAL(10,2),
  image_url TEXT NOT NULL,
  recommended_for TEXT[],
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. RESERVASPRO - PERFILES DE CLIENTES (auth propio)
-- ============================================================

CREATE TABLE IF NOT EXISTS client_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  level_name TEXT DEFAULT 'Bronce',
  total_visits INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_visit TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, email)
);

-- ============================================================
-- 3. RESERVASPRO - RECOMPENSAS GANADAS
-- ============================================================

CREATE TABLE IF NOT EXISTS earned_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  client_profile_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  loyalty_level_id UUID REFERENCES loyalty_levels(id) ON DELETE SET NULL,
  reward_type TEXT NOT NULL,
  reward_value DECIMAL(10,2) DEFAULT 0,
  reward_description TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'used', 'expired')),
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. RESERVASPRO - HISTORIAL DE XP
-- ============================================================

CREATE TABLE IF NOT EXISTS xp_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  client_profile_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  xp_amount INTEGER NOT NULL,
  reason TEXT,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. RESERVASPRO - FOTOS DE CORTES (del cliente)
-- ============================================================

CREATE TABLE IF NOT EXISTS cut_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_profile_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  organization_id TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. CONTENTFLOW - AGENCIAS
-- ============================================================

CREATE TABLE IF NOT EXISTS agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand_voice JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. CONTENTFLOW - CLIENTES DE AGENCIA
-- ============================================================

CREATE TABLE IF NOT EXISTS agency_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  industry TEXT,
  email TEXT,
  approval_token UUID UNIQUE DEFAULT gen_random_uuid(),
  brief JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. CONTENTFLOW - CALENDARIO DE CONTENIDO
-- ============================================================

CREATE TABLE IF NOT EXISTS content_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES agency_clients(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram','facebook','twitter','linkedin','tiktok','blog')),
  content_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_approval','approved','scheduled','published','rejected')),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. INVOICEFLOW - FACTURAS
-- ============================================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT,
  invoice_number TEXT,
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. INVOICEFLOW - LINEAS DE FACTURA
-- ============================================================

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  organization_id TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. INVOICEFLOW - CLIENTES DE FACTURACION
-- ============================================================

CREATE TABLE IF NOT EXISTS invoice_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  tax_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. TASKFLOW - TAREAS
-- ============================================================

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  assigned_to TEXT,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDICES
-- ============================================================

-- style_gallery
CREATE INDEX IF NOT EXISTS idx_style_gallery_org ON style_gallery(organization_id);
CREATE INDEX IF NOT EXISTS idx_style_gallery_active ON style_gallery(organization_id, is_active);

-- client_profiles
CREATE INDEX IF NOT EXISTS idx_client_profiles_org ON client_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_profiles_email ON client_profiles(organization_id, email);

-- earned_rewards
CREATE INDEX IF NOT EXISTS idx_earned_rewards_client ON earned_rewards(client_profile_id);
CREATE INDEX IF NOT EXISTS idx_earned_rewards_status ON earned_rewards(status);

-- xp_history
CREATE INDEX IF NOT EXISTS idx_xp_history_client ON xp_history(client_profile_id);
CREATE INDEX IF NOT EXISTS idx_xp_history_org ON xp_history(organization_id);

-- cut_photos
CREATE INDEX IF NOT EXISTS idx_cut_photos_client ON cut_photos(client_profile_id);

-- agencies
CREATE INDEX IF NOT EXISTS idx_agencies_user ON agencies(user_id);

-- agency_clients
CREATE INDEX IF NOT EXISTS idx_agency_clients_agency ON agency_clients(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_clients_token ON agency_clients(approval_token);

-- content_calendar
CREATE INDEX IF NOT EXISTS idx_content_calendar_client ON content_calendar(client_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_date ON content_calendar(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_content_calendar_status ON content_calendar(status);

-- invoices
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- invoice_items
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

-- invoice_clients
CREATE INDEX IF NOT EXISTS idx_invoice_clients_org ON invoice_clients(organization_id);

-- tasks
CREATE INDEX IF NOT EXISTS idx_tasks_org ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- ============================================================
-- VERIFICACION
-- ============================================================

SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
