-- ============================================
-- FIX QUIRURGICO v4 - Sistema de Barberia
-- Idempotente: seguro re-ejecutar 100 veces
-- Verificado contra: 
--   - migration.sql (tablas base: services, professionals, clients, working_hours, bookings)
--   - migration-loyalty.sql (client_profiles, loyalty_levels, xp_history, earned_rewards, cut_photos)
--   - /api/styles/route.ts (style_gallery con organization_id)
--   - /api/public/styles/[slug]/route.ts (style_gallery filtrada por organization_id)
--   - /api/cron/booking-reminders/route.ts (bookings: client_email, reminder_sent)
--   - /api/reservas/[bookingId]/complete/route.ts (client_profiles, xp_amount, reason, loyalty_level_id)
--   - /api/public/reservas/[slug]/book/route.ts (bookings: client_id, client_phone, price)
-- ============================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. FUNCION updated_at (idempotente)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TABLAS BASE (de migration.sql) - Solo si faltan
-- ============================================

-- clients (tabla base de clientes - usada en /book/route.ts)
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

-- ============================================
-- TABLAS DE FIDELIDAD (de migration-loyalty.sql)
-- ============================================

-- client_profiles (clientes autenticados - usada en /complete/route.ts)
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

CREATE INDEX IF NOT EXISTS idx_client_profiles_org ON client_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_profiles_email ON client_profiles(organization_id, email);
CREATE INDEX IF NOT EXISTS idx_client_profiles_xp ON client_profiles(organization_id, total_xp DESC);

DROP TRIGGER IF EXISTS trigger_client_profiles_updated_at ON client_profiles;
CREATE TRIGGER trigger_client_profiles_updated_at
    BEFORE UPDATE ON client_profiles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- loyalty_levels (niveles de fidelidad)
CREATE TABLE IF NOT EXISTS loyalty_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL,
    level_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    min_xp INTEGER NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT '⭐',
    reward_type TEXT CHECK (reward_type IN ('discount_percent', 'discount_fixed', 'free_service', 'gift', 'none')),
    reward_value DECIMAL(10,2),
    reward_description TEXT,
    reward_service_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, level_number)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_levels_org ON loyalty_levels(organization_id, level_number);

-- style_gallery (VERIFICADA contra /api/styles/route.ts y /api/public/styles/[slug]/route.ts)
-- Necesita organization_id porque ambas rutas filtran por organization_id
CREATE TABLE IF NOT EXISTS style_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    duration_minutes INTEGER,
    base_price DECIMAL(10,2),
    image_url TEXT,
    recommended_for TEXT[],
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_style_gallery_org ON style_gallery(organization_id);
CREATE INDEX IF NOT EXISTS idx_style_gallery_category ON style_gallery(organization_id, category);
CREATE INDEX IF NOT EXISTS idx_style_gallery_active ON style_gallery(organization_id, is_active);

DROP TRIGGER IF EXISTS trigger_style_gallery_updated_at ON style_gallery;
CREATE TRIGGER trigger_style_gallery_updated_at
    BEFORE UPDATE ON style_gallery
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- xp_history (VERIFICADA contra /api/reservas/[bookingId]/complete/route.ts)
-- El codigo usa: organization_id, client_profile_id, xp_amount, reason, booking_id
CREATE TABLE IF NOT EXISTS xp_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL,
    client_profile_id UUID NOT NULL,
    xp_amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    booking_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_xp_history_client ON xp_history(client_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_history_booking ON xp_history(booking_id);

-- earned_rewards (VERIFICADA contra /api/reservas/[bookingId]/complete/route.ts)
-- El codigo usa: organization_id, client_profile_id, loyalty_level_id, reward_type, reward_value, reward_description, status, expires_at
CREATE TABLE IF NOT EXISTS earned_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL,
    client_profile_id UUID NOT NULL,
    loyalty_level_id UUID,
    reward_type TEXT NOT NULL,
    reward_value DECIMAL(10,2),
    reward_description TEXT,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'used', 'expired')),
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    booking_id_used UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_earned_rewards_client ON earned_rewards(client_profile_id, status);

-- cut_photos (fotos de cortes - de migration-loyalty.sql)
CREATE TABLE IF NOT EXISTS cut_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL,
    client_profile_id UUID NOT NULL,
    booking_id UUID,
    professional_id UUID,
    photo_url TEXT NOT NULL,
    thumbnail_url TEXT,
    description TEXT,
    is_favorite BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cut_photos_client ON cut_photos(client_profile_id, created_at DESC);

-- ============================================
-- COLUMNAS FALTANTES EN TABLAS EXISTENTES
-- ============================================

-- 3. bookings - columnas que faltan (verificadas contra codigo)
DO $$
BEGIN
    -- client_email (usado por cron de recordatorios y /book)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'client_email'
    ) THEN
        ALTER TABLE bookings ADD COLUMN client_email TEXT;
        RAISE NOTICE 'Añadida: bookings.client_email';
    END IF;

    -- client_phone (usado por /book/route.ts linea 107)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'client_phone'
    ) THEN
        ALTER TABLE bookings ADD COLUMN client_phone TEXT;
        RAISE NOTICE 'Añadida: bookings.client_phone';
    END IF;

    -- reminder_sent (usado por cron de recordatorios)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'reminder_sent'
    ) THEN
        ALTER TABLE bookings ADD COLUMN reminder_sent BOOLEAN DEFAULT false;
        RAISE NOTICE 'Añadida: bookings.reminder_sent';
    END IF;

    -- client_profile_id (usado por sistema XP al completar reserva)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'client_profile_id'
    ) THEN
        ALTER TABLE bookings ADD COLUMN client_profile_id UUID;
        RAISE NOTICE 'Añadida: bookings.client_profile_id';
    END IF;
    
    -- price (usado por /book/route.ts linea 138)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'price'
    ) THEN
        ALTER TABLE bookings ADD COLUMN price DECIMAL(10,2);
        RAISE NOTICE 'Añadida: bookings.price';
    END IF;
END $$;

-- 4. services - xp_value (sistema de fidelidad - usado en /complete/route.ts)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'xp_value'
    ) THEN
        ALTER TABLE services ADD COLUMN xp_value INTEGER DEFAULT 100;
        RAISE NOTICE 'Añadida: services.xp_value';
    END IF;
END $$;

-- Solo rellenar NULLs, NO machacar valores legitimos
UPDATE services SET xp_value = 100 WHERE xp_value IS NULL;

-- 5. business_config - timezone (manejo de zonas horarias)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'business_config' AND column_name = 'timezone'
    ) THEN
        ALTER TABLE business_config ADD COLUMN timezone TEXT DEFAULT 'Europe/Madrid';
        RAISE NOTICE 'Añadida: business_config.timezone';
    END IF;
END $$;

UPDATE business_config SET timezone = 'Europe/Madrid' WHERE timezone IS NULL;

-- ============================================
-- working_hours (GRANULAR)
-- ============================================

CREATE TABLE IF NOT EXISTS working_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL,
    professional_id UUID,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    break_start TIME,
    break_end TIME,
    is_working BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_working_hours_org ON working_hours(organization_id);
CREATE INDEX IF NOT EXISTS idx_working_hours_prof ON working_hours(organization_id, professional_id);

-- Migrar columnas viejas (start_time/end_time → open_time/close_time) si existen
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'working_hours' AND column_name = 'start_time'
    ) THEN
        ALTER TABLE working_hours RENAME COLUMN start_time TO open_time;
        RAISE NOTICE 'Migrado: working_hours.start_time → open_time';
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'working_hours' AND column_name = 'end_time'
    ) THEN
        ALTER TABLE working_hours RENAME COLUMN end_time TO close_time;
        RAISE NOTICE 'Migrado: working_hours.end_time → close_time';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'working_hours' AND column_name = 'break_start'
    ) THEN
        ALTER TABLE working_hours ADD COLUMN break_start TIME;
        RAISE NOTICE 'Añadida: working_hours.break_start';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'working_hours' AND column_name = 'break_end'
    ) THEN
        ALTER TABLE working_hours ADD COLUMN break_end TIME;
        RAISE NOTICE 'Añadida: working_hours.break_end';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'working_hours' AND column_name = 'is_working'
    ) THEN
        ALTER TABLE working_hours ADD COLUMN is_working BOOLEAN DEFAULT true;
        RAISE NOTICE 'Añadida: working_hours.is_working';
    END IF;
END $$;

-- ============================================
-- blocked_slots (feriados, vacaciones, descansos)
-- ============================================

CREATE TABLE IF NOT EXISTS blocked_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL,
    professional_id UUID,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blocked_slots_org ON blocked_slots(organization_id, date);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_prof ON blocked_slots(organization_id, professional_id, date);

DROP TRIGGER IF EXISTS trigger_blocked_slots_updated_at ON blocked_slots;
CREATE TRIGGER trigger_blocked_slots_updated_at
    BEFORE UPDATE ON blocked_slots
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- TRIGGERS updated_at PARA TABLAS EXISTENTES
-- ============================================

DO $$
DECLARE
    v_table text;
BEGIN
    FOR v_table IN 
        SELECT unnest(ARRAY[
            'bookings','services','professionals','working_hours',
            'business_config','clients'
        ])
    LOOP
        IF to_regclass(v_table) IS NOT NULL THEN
            EXECUTE format(
                'DROP TRIGGER IF EXISTS trigger_%I_updated_at ON %I; 
                 CREATE TRIGGER trigger_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
                v_table, v_table, v_table, v_table
            );
            RAISE NOTICE 'Trigger updated_at: %', v_table;
        END IF;
    END LOOP;
END $$;

-- ============================================
-- RLS - Seguridad (habilitar en tablas nuevas)
-- ============================================

DO $$
BEGIN
    IF to_regclass('style_gallery') IS NOT NULL THEN
        ALTER TABLE style_gallery ENABLE ROW LEVEL SECURITY;
    END IF;
    IF to_regclass('xp_history') IS NOT NULL THEN
        ALTER TABLE xp_history ENABLE ROW LEVEL SECURITY;
    END IF;
    IF to_regclass('earned_rewards') IS NOT NULL THEN
        ALTER TABLE earned_rewards ENABLE ROW LEVEL SECURITY;
    END IF;
    IF to_regclass('cut_photos') IS NOT NULL THEN
        ALTER TABLE cut_photos ENABLE ROW LEVEL SECURITY;
    END IF;
    IF to_regclass('client_profiles') IS NOT NULL THEN
        ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
    END IF;
    IF to_regclass('clients') IS NOT NULL THEN
        ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ============================================
-- RESUMEN
-- ============================================

SELECT 
    'FIX COMPLETADO v4' as status,
    NOW() as executed_at,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'bookings') as bookings_columns,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'services') as services_columns,
    CASE WHEN to_regclass('style_gallery') IS NOT NULL THEN 'OK' ELSE 'FALTA' END as style_gallery,
    CASE WHEN to_regclass('xp_history') IS NOT NULL THEN 'OK' ELSE 'FALTA' END as xp_history,
    CASE WHEN to_regclass('earned_rewards') IS NOT NULL THEN 'OK' ELSE 'FALTA' END as earned_rewards,
    CASE WHEN to_regclass('cut_photos') IS NOT NULL THEN 'OK' ELSE 'FALTA' END as cut_photos,
    CASE WHEN to_regclass('client_profiles') IS NOT NULL THEN 'OK' ELSE 'FALTA' END as client_profiles,
    CASE WHEN to_regclass('clients') IS NOT NULL THEN 'OK' ELSE 'FALTA' END as clients,
    CASE WHEN to_regclass('working_hours') IS NOT NULL THEN 'OK' ELSE 'FALTA' END as working_hours;
