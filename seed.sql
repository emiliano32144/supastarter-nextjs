-- Datos de prueba - Filo Barberia
-- Ejecutar en Supabase SQL Editor

DO $$
DECLARE
  org_id TEXT := 'org_filo_barberia_test';
  prof_id UUID := gen_random_uuid();
  serv1_id UUID := gen_random_uuid();
  serv2_id UUID := gen_random_uuid();
  serv3_id UUID := gen_random_uuid();
BEGIN

-- 1. ORGANIZATION
INSERT INTO "organization" ("id", "name", "slug", "createdAt")
VALUES (org_id, 'Filo Barberia', 'filo-barberia', NOW())
ON CONFLICT ("id") DO NOTHING;

-- 2. BUSINESS CONFIG
INSERT INTO business_config (organization_id, business_name, slug, primary_color, secondary_color, phone, description, opening_time, closing_time, working_days)
VALUES (org_id, 'Filo Barberia', 'filo-barberia', '#1a1a1a', '#f5f5f5', '+34 600 000 000', 'Barberia clasica con estilo moderno', '09:00', '20:00', '{1,2,3,4,5,6}')
ON CONFLICT (slug) DO NOTHING;

-- 3. SERVICIOS
INSERT INTO services (id, organization_id, name, description, duration, price, color, xp_value, is_active)
VALUES
  (serv1_id, org_id, 'Corte clasico', 'Corte tradicional con tijera y maquina', 30, 15.00, '#3b82f6', 100, true),
  (serv2_id, org_id, 'Degradado', 'Fade profesional a maquina', 40, 18.00, '#8b5cf6', 120, true),
  (serv3_id, org_id, 'Barba', 'Arreglo y perfilado de barba', 20, 10.00, '#f59e0b', 80, true);

-- 4. PROFESIONAL
INSERT INTO professionals (id, organization_id, name, specialties, is_active)
VALUES (prof_id, org_id, 'Carlos', '{Corte clasico, Degradado, Barba}', true);

-- 5. HORARIOS (lunes=1 a sabado=6)
INSERT INTO working_hours (organization_id, professional_id, day_of_week, open_time, close_time, is_working)
VALUES
  (org_id, prof_id, 1, '09:00', '20:00', true),
  (org_id, prof_id, 2, '09:00', '20:00', true),
  (org_id, prof_id, 3, '09:00', '20:00', true),
  (org_id, prof_id, 4, '09:00', '20:00', true),
  (org_id, prof_id, 5, '09:00', '20:00', true),
  (org_id, prof_id, 6, '09:00', '20:00', true);

END $$;

-- VERIFICACION
SELECT 'organization' AS tabla, count(*) FROM "organization" WHERE id = 'org_filo_barberia_test'
UNION ALL
SELECT 'business_config', count(*) FROM business_config WHERE slug = 'filo-barberia'
UNION ALL
SELECT 'services', count(*) FROM services WHERE organization_id = 'org_filo_barberia_test'
UNION ALL
SELECT 'professionals', count(*) FROM professionals WHERE organization_id = 'org_filo_barberia_test'
UNION ALL
SELECT 'working_hours', count(*) FROM working_hours WHERE organization_id = 'org_filo_barberia_test';
