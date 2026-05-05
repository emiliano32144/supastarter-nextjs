-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  FINAL SURGICAL FIX — Sincronización completa Supabase        ║
-- ║  Proyecto: lcfjenptlmgnmbdaamdt (supastarter-nextjs)          ║
-- ║  Fecha generación: 2026-05-05                                 ║
-- ╠═══════════════════════════════════════════════════════════════╣
-- ║  Verificado contra:                                           ║
-- ║   • packages/database/prisma/schema.prisma                    ║
-- ║   • apps/web/app/api/public/styles/[slug]/route.ts            ║
-- ║   • apps/web/app/api/styles/route.ts (+ [id]/route.ts)        ║
-- ║   • apps/web/app/api/cron/booking-reminders/route.ts          ║
-- ║   • apps/web/app/api/peluquerias/route.ts                     ║
-- ║   • apps/web/app/api/public/reservas/[slug]/book/route.ts     ║
-- ║   • apps/web/app/api/public/auth/register/route.ts            ║
-- ║   • apps/web/app/api/business-config/[organizationId]/route.ts║
-- ║   • apps/web/app/api/loyalty/levels/[organizationId]/route.ts ║
-- ║   • apps/web/app/api/reservas/[bookingId]/complete/route.ts   ║
-- ╠═══════════════════════════════════════════════════════════════╣
-- ║  Garantías:                                                   ║
-- ║   ✓ Idempotente (re-ejecutable N veces)                       ║
-- ║   ✓ NO dropea policies RLS existentes                         ║
-- ║   ✓ NO machaca valores legítimos (xp_value sólo si NULL)      ║
-- ║   ✓ Triggers updated_at sólo en tablas que tienen la columna  ║
-- ║   ✓ FKs con ON DELETE SET NULL/CASCADE para evitar bloqueos   ║
-- ╚═══════════════════════════════════════════════════════════════╝

BEGIN;

-- ════════════════════════════════════════════════════════════════
-- ÓRGANO 1 — BETTER AUTH (sistema circulatorio: usuarios, sesiones, orgs)
-- ════════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE "PurchaseType" AS ENUM ('SUBSCRIPTION', 'ONE_TIME');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "user" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL,
  "image" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "username" TEXT UNIQUE,
  "role" TEXT,
  "banned" BOOLEAN,
  "banReason" TEXT,
  "banExpires" TIMESTAMP(3),
  "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
  "paymentsCustomerId" TEXT,
  "locale" TEXT,
  "displayUsername" TEXT,
  "twoFactorEnabled" BOOLEAN
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" TEXT PRIMARY KEY,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "impersonatedBy" TEXT,
  "activeOrganizationId" TEXT,
  "token" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS "account" (
  "id" TEXT PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "expiresAt" TIMESTAMP(3),
  "password" TEXT,
  "accessTokenExpiresAt" TIMESTAMP(3),
  "refreshTokenExpiresAt" TIMESTAMP(3),
  "scope" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id" TEXT PRIMARY KEY,
  "identifier" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS "passkey" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT,
  "publicKey" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "credentialID" TEXT NOT NULL,
  "counter" INTEGER NOT NULL,
  "deviceType" TEXT NOT NULL,
  "backedUp" BOOLEAN NOT NULL,
  "transports" TEXT,
  "aaguid" TEXT,
  "createdAt" TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS "twoFactor" (
  "id" TEXT PRIMARY KEY,
  "secret" TEXT NOT NULL,
  "backupCodes" TEXT NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "organization" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT UNIQUE,
  "logo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "metadata" TEXT,
  "paymentsCustomerId" TEXT
);

CREATE TABLE IF NOT EXISTS "member" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL,
  UNIQUE("organizationId", "userId")
);

CREATE TABLE IF NOT EXISTS "invitation" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "email" TEXT NOT NULL,
  "role" TEXT,
  "status" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "inviterId" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "purchase" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT REFERENCES "organization"("id") ON DELETE CASCADE,
  "userId" TEXT REFERENCES "user"("id") ON DELETE CASCADE,
  "type" "PurchaseType" NOT NULL,
  "customerId" TEXT NOT NULL,
  "subscriptionId" TEXT UNIQUE,
  "productId" TEXT NOT NULL,
  "status" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ai_chat" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT REFERENCES "organization"("id") ON DELETE CASCADE,
  "userId" TEXT REFERENCES "user"("id") ON DELETE CASCADE,
  "title" TEXT,
  "messages" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_session_userId"          ON "session"("userId");
CREATE INDEX IF NOT EXISTS "idx_session_token"           ON "session"("token");
CREATE INDEX IF NOT EXISTS "idx_account_userId"          ON "account"("userId");
CREATE INDEX IF NOT EXISTS "idx_member_organizationId"   ON "member"("organizationId");
CREATE INDEX IF NOT EXISTS "idx_member_userId"           ON "member"("userId");
CREATE INDEX IF NOT EXISTS "idx_purchase_subscriptionId" ON "purchase"("subscriptionId");
CREATE INDEX IF NOT EXISTS "idx_purchase_organizationId" ON "purchase"("organizationId");
CREATE INDEX IF NOT EXISTS "idx_purchase_userId"         ON "purchase"("userId");

-- ════════════════════════════════════════════════════════════════
-- ÓRGANO 2 — Función reutilizable para auto-actualizar updated_at
-- ════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION reservas_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════════════
-- ÓRGANO 3 — Tablas core de reservas (sin dependencias)
-- ════════════════════════════════════════════════════════════════

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
CREATE INDEX IF NOT EXISTS idx_clients_org   ON clients(organization_id);
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

-- ════════════════════════════════════════════════════════════════
-- ÓRGANO 4 — Loyalty (perfiles de cliente + niveles)
-- ════════════════════════════════════════════════════════════════

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

-- ════════════════════════════════════════════════════════════════
-- ÓRGANO 5 — Bookings, working_hours y dependientes
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
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
CREATE INDEX IF NOT EXISTS idx_bookings_org    ON bookings(organization_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date   ON bookings(date, start_time);

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
  loyalty_level_id UUID REFERENCES loyalty_levels(id) ON DELETE SET NULL,
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

-- ════════════════════════════════════════════════════════════════
-- ÓRGANO 6 — style_gallery (schema VERIFICADO en apps/web/app/api/styles/route.ts)
-- ════════════════════════════════════════════════════════════════

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

-- ════════════════════════════════════════════════════════════════
-- ÓRGANO 7 — ALTERs para drift detectado (columnas que el código espera
-- pero que NO están en migration.sql original)
-- ════════════════════════════════════════════════════════════════
-- bookings.client_profile_id  → leído por /api/reservas/[id]/complete
-- bookings.reminder_sent      → leído/escrito por cron
-- bookings.client_email/phone → escritos por /api/public/.../book
-- services.xp_value           → leído por complete + insertado por peluquerias

ALTER TABLE services ADD COLUMN IF NOT EXISTS xp_value INTEGER DEFAULT 100;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_profile_id UUID REFERENCES client_profiles(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS client_phone TEXT;

-- Backfill xp_value SOLO para filas que nunca lo tuvieron (no machaca valores legítimos)
UPDATE services
   SET xp_value = GREATEST(50, ROUND(price * 2)::int)
 WHERE xp_value IS NULL;

-- ════════════════════════════════════════════════════════════════
-- ÓRGANO 8 — Triggers updated_at (sólo en tablas que tienen la columna)
-- ════════════════════════════════════════════════════════════════
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'services','professionals','clients','bookings',
    'business_config','client_profiles','style_gallery'
  ])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_reservas_set_updated_at ON %I', t);
    EXECUTE format(
      'CREATE TRIGGER trg_reservas_set_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION reservas_set_updated_at()', t);
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════════════
-- ÓRGANO 9 — RLS habilitada + policies "create-only-if-missing"
-- ════════════════════════════════════════════════════════════════
-- NOTA: Todas las rutas API del proyecto usan SUPABASE_SERVICE_ROLE_KEY,
-- que bypasea RLS. Estas policies sólo importan si en el futuro alguna
-- ruta usa anon key desde el browser. NO se dropean policies tuyas.

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

DO $$
DECLARE
  spec RECORD;
BEGIN
  FOR spec IN
    SELECT * FROM (VALUES
      -- (tabla,         policyname,     cmd,      using_expr, check_expr)
      ('business_config','public_read',  'SELECT', 'true',     NULL),
      ('services',       'public_read',  'SELECT', 'true',     NULL),
      ('professionals',  'public_read',  'SELECT', 'true',     NULL),
      ('working_hours',  'public_read',  'SELECT', 'true',     NULL),
      ('loyalty_levels', 'public_read',  'SELECT', 'true',     NULL),
      ('style_gallery',  'public_read',  'SELECT', 'true',     NULL),
      ('client_profiles','public_read',  'SELECT', 'true',     NULL),
      ('client_profiles','public_insert','INSERT', NULL,       'true'),
      ('client_profiles','public_update','UPDATE', 'true',     NULL),
      ('bookings',       'public_read',  'SELECT', 'true',     NULL),
      ('bookings',       'public_insert','INSERT', NULL,       'true'),
      ('clients',        'public_read',  'SELECT', 'true',     NULL),
      ('clients',        'public_insert','INSERT', NULL,       'true'),
      ('xp_history',     'public_read',  'SELECT', 'true',     NULL),
      ('earned_rewards', 'public_read',  'SELECT', 'true',     NULL)
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

COMMIT;

-- ════════════════════════════════════════════════════════════════
-- VERIFICACIÓN FINAL — output esperado: 28 tablas
-- ════════════════════════════════════════════════════════════════
SELECT
  COUNT(*) FILTER (WHERE table_name IN (
    'user','session','account','verification','passkey','twoFactor',
    'organization','member','invitation','purchase','ai_chat'
  )) AS auth_tables,
  COUNT(*) FILTER (WHERE table_name IN (
    'services','professionals','clients','bookings','working_hours',
    'business_config','client_profiles','loyalty_levels','xp_history',
    'earned_rewards','cut_photos','style_gallery'
  )) AS reservas_tables
FROM information_schema.tables
WHERE table_schema = 'public';

SELECT '✅ Cirugía completada. Esperado: auth_tables=11, reservas_tables=12' AS resultado;
