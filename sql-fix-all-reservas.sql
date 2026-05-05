-- ═══════════════════════════════════════════════════════════════
-- FIX-ALL v2: Migración idempotente para sistema de reservas
-- Verificado contra el código real (Dec 2025).
-- ═══════════════════════════════════════════════════════════════
-- ⚠️  PRE-REQUISITO: aplica primero `sql-better-auth.sql` si no
--    existen las tablas user/session/account/organization/member.
-- ⚠️  CORRE PRIMERO `sql-diagnostico-reservas.sql` para ver el estado.
-- ✅  Idempotente: seguro re-ejecutar. NO dropea policies del usuario.
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- PASO 1: Función para auto-actualizar updated_at (trigger genérico)
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- PASO 2: Tablas core (sin dependencias)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 30,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_services_org ON services(organization_id);

CREATE TABLE IF NOT EXISTS professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  specialties TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_professionals_org ON professionals(organization_id);

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  total_visits INTEGER DEFAULT 0,
  last_visit TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(organization_id, email);

CREATE TABLE IF NOT EXISTS business_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL UNIQUE,
  business_name TEXT NOT NULL DEFAULT 'Mi Salón',
  business_description TEXT DEFAULT 'Sistema de reservas online',
  slug TEXT UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#1E40AF',
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  opening_time TIME DEFAULT '09:00',
  closing_time TIME DEFAULT '19:00',
  working_days TEXT[] DEFAULT ARRAY['1','2','3','4','5','6'],
  instagram_url TEXT,
  facebook_url TEXT,
  website_url TEXT,
  min_advance_hours INTEGER DEFAULT 2,
  max_advance_days INTEGER DEFAULT 30,
  slot_duration INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_business_config_slug
  ON business_config(slug) WHERE slug IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════
-- PASO 3: Tablas de loyalty (dependen de las anteriores)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS client_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT,
  auth_provider TEXT DEFAULT 'email',
  name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  birth_date DATE,
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  level_name TEXT DEFAULT 'Bronce',
  total_visits INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_visit TIMESTAMPTZ,
  preferred_professional_id UUID,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, email)
);
CREATE INDEX IF NOT EXISTS idx_client_profiles_email
  ON client_profiles(organization_id, email);

CREATE TABLE IF NOT EXISTS loyalty_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  level_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  min_xp INTEGER NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT '⭐',
  reward_type TEXT
    CHECK (reward_type IN ('discount_percent','discount_fixed','free_service','gift','none')),
  reward_value DECIMAL(10,2),
  reward_description TEXT,
  reward_service_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, level_number)
);

-- ═══════════════════════════════════════════════════════════════
-- PASO 4: Tablas que dependen de TODO lo anterior
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  client_id UUID REFERENCES clients(id),
  professional_id UUID REFERENCES professionals(id),
  service_id UUID REFERENCES services(id),
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','completed','cancelled','no_show')),
  notes TEXT,
  price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bookings_org ON bookings(organization_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date, start_time);

CREATE TABLE IF NOT EXISTS working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '18:00',
  is_working BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_working_hours_org ON working_hours(organization_id);
CREATE INDEX IF NOT EXISTS idx_working_hours_pro ON working_hours(professional_id, day_of_week);

CREATE TABLE IF NOT EXISTS xp_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  client_profile_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  xp_amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_xp_history_client
  ON xp_history(client_profile_id, created_at DESC);

CREATE TABLE IF NOT EXISTS earned_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  client_profile_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  loyalty_level_id UUID REFERENCES loyalty_levels(id),
  reward_type TEXT NOT NULL,
  reward_value DECIMAL(10,2),
  reward_description TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available','used','expired')),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  booking_id_used UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_earned_rewards_client
  ON earned_rewards(client_profile_id, status);

CREATE TABLE IF NOT EXISTS cut_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  client_profile_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  description TEXT,
  is_favorite BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cut_photos_client
  ON cut_photos(client_profile_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- PASO 5: style_gallery (schema VERIFICADO contra apps/web/app/api/styles/route.ts)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS style_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  base_price DECIMAL(10,2),
  image_url TEXT NOT NULL,
  recommended_for TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_style_gallery_org
  ON style_gallery(organization_id, is_active, display_order);

-- ═══════════════════════════════════════════════════════════════
-- PASO 6: ALTERs para schema drift (columnas referenciadas por código)
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE services ADD COLUMN IF NOT EXISTS xp_value INTEGER DEFAULT 100;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_profile_id UUID REFERENCES client_profiles(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_phone TEXT;

-- Solo asignar xp_value calculado en filas que NUNCA lo tuvieron (NULL).
-- NO machaca valores legítimos de 100 puestos a propósito.
UPDATE services
   SET xp_value = GREATEST(50, ROUND(price * 2)::int)
 WHERE xp_value IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- PASO 7: Triggers de updated_at (idempotentes)
-- ═══════════════════════════════════════════════════════════════
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'services','professionals','clients','bookings',
    'business_config','client_profiles','style_gallery'
  ])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_updated_at ON %I', t);
    EXECUTE format(
      'CREATE TRIGGER trg_set_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t);
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- PASO 8: RLS — habilitar y crear policies SOLO si no existen
-- ═══════════════════════════════════════════════════════════════
-- NOTA: Todas las rutas API del proyecto usan SUPABASE_SERVICE_ROLE_KEY,
-- que bypasea RLS. Estas policies solo importan si en el futuro alguna
-- ruta usa el anon key desde el browser. NO se dropean policies que ya
-- tengas tú creadas.

ALTER TABLE business_config  ENABLE ROW LEVEL SECURITY;
ALTER TABLE services         ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients          ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_hours    ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_levels   ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_history       ENABLE ROW LEVEL SECURITY;
ALTER TABLE earned_rewards   ENABLE ROW LEVEL SECURITY;
ALTER TABLE style_gallery    ENABLE ROW LEVEL SECURITY;
ALTER TABLE cut_photos       ENABLE ROW LEVEL SECURITY;

-- Helper que crea policy solo si no existe (no destruye existentes)
DO $$
DECLARE
  spec RECORD;
BEGIN
  FOR spec IN
    SELECT * FROM (VALUES
      ('business_config', 'public_read',  'SELECT', 'true', NULL),
      ('services',        'public_read',  'SELECT', 'true', NULL),
      ('professionals',   'public_read',  'SELECT', 'true', NULL),
      ('working_hours',   'public_read',  'SELECT', 'true', NULL),
      ('loyalty_levels',  'public_read',  'SELECT', 'true', NULL),
      ('style_gallery',   'public_read',  'SELECT', 'true', NULL),
      ('client_profiles', 'public_read',  'SELECT', 'true', NULL),
      ('client_profiles', 'public_insert','INSERT', NULL,   'true'),
      ('client_profiles', 'public_update','UPDATE', 'true', NULL),
      ('bookings',        'public_read',  'SELECT', 'true', NULL),
      ('bookings',        'public_insert','INSERT', NULL,   'true'),
      ('clients',         'public_read',  'SELECT', 'true', NULL),
      ('clients',         'public_insert','INSERT', NULL,   'true'),
      ('xp_history',      'public_read',  'SELECT', 'true', NULL),
      ('earned_rewards',  'public_read',  'SELECT', 'true', NULL)
    ) AS s(tablename, policyname, cmd, using_expr, check_expr)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
       WHERE schemaname = 'public'
         AND tablename  = spec.tablename
         AND policyname = spec.policyname
    ) THEN
      IF spec.cmd = 'INSERT' THEN
        EXECUTE format(
          'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (%s)',
          spec.policyname, spec.tablename, spec.check_expr);
      ELSE
        EXECUTE format(
          'CREATE POLICY %I ON public.%I FOR %s USING (%s)',
          spec.policyname, spec.tablename, spec.cmd, spec.using_expr);
      END IF;
    END IF;
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════════════════
SELECT '✅ Migración aplicada. Re-ejecuta sql-diagnostico-reservas.sql para verificar.' AS resultado;
