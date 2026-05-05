-- ═══════════════════════════════════════════════════════════════
-- DIAGNÓSTICO v2: ¿Qué falta en la DB de Supabase para reservas?
-- Pega en: Supabase → SQL Editor → New query → Run
-- Seguro aunque ninguna tabla exista (usa to_regclass).
-- ═══════════════════════════════════════════════════════════════

-- ─── 1) ¿Qué tablas existen? ──────────────────────────────────
SELECT
  t.table_name,
  CASE WHEN to_regclass('public.' || t.table_name) IS NOT NULL
       THEN '✅ EXISTE' ELSE '❌ FALTA' END AS estado
FROM (VALUES
  ('services'),
  ('professionals'),
  ('clients'),
  ('bookings'),
  ('working_hours'),
  ('business_config'),
  ('client_profiles'),
  ('loyalty_levels'),
  ('xp_history'),
  ('earned_rewards'),
  ('cut_photos'),
  ('style_gallery'),
  -- Better Auth (necesario para admin dashboard)
  ('user'),
  ('session'),
  ('account'),
  ('organization'),
  ('member')
) AS t(table_name)
ORDER BY estado DESC, t.table_name;

-- ─── 2) ¿Existen las columnas críticas que el código espera? ──
SELECT
  expected.table_name,
  expected.column_name,
  CASE
    WHEN to_regclass('public.' || expected.table_name) IS NULL
      THEN '⚠️ TABLA FALTA'
    WHEN ic.column_name IS NOT NULL
      THEN '✅ EXISTE'
    ELSE '❌ COLUMNA FALTA'
  END AS estado
FROM (VALUES
  -- Drift detectado por la auditoría (referenciadas por el código pero
  -- no incluidas en migration.sql original):
  ('bookings',       'client_profile_id'),
  ('bookings',       'reminder_sent'),
  ('bookings',       'client_email'),
  ('bookings',       'client_phone'),
  ('services',       'xp_value'),
  -- Schema base:
  ('services',       'color'),
  ('services',       'duration'),
  ('services',       'price'),
  ('client_profiles','total_xp'),
  ('client_profiles','current_level'),
  ('client_profiles','password_hash'),
  ('business_config','slug'),
  ('business_config','organization_id'),
  ('professionals',  'avatar_url'),
  ('working_hours',  'professional_id'),
  ('working_hours',  'day_of_week'),
  -- style_gallery (verificado en código real, no inventado):
  ('style_gallery',  'name'),
  ('style_gallery',  'category'),
  ('style_gallery',  'image_url'),
  ('style_gallery',  'recommended_for'),
  ('style_gallery',  'display_order'),
  ('style_gallery',  'duration_minutes'),
  ('style_gallery',  'base_price')
) AS expected(table_name, column_name)
LEFT JOIN information_schema.columns ic
  ON ic.table_schema = 'public'
 AND ic.table_name   = expected.table_name
 AND ic.column_name  = expected.column_name
ORDER BY estado DESC, expected.table_name, expected.column_name;

-- ─── 3) Conteo de filas (defensivo: 0 si la tabla no existe) ──
DO $$
DECLARE
  t TEXT;
  cnt BIGINT;
  result TEXT := '';
BEGIN
  FOR t IN
    SELECT unnest(ARRAY['business_config','services','professionals',
                        'bookings','clients','client_profiles',
                        'loyalty_levels','working_hours','style_gallery'])
  LOOP
    IF to_regclass('public.'||t) IS NOT NULL THEN
      EXECUTE format('SELECT COUNT(*) FROM %I', t) INTO cnt;
      result := result || format(E'  %s: %s filas\n', rpad(t,20), cnt);
    ELSE
      result := result || format(E'  %s: (tabla no existe)\n', rpad(t,20));
    END IF;
  END LOOP;
  RAISE NOTICE E'\n=== Conteo de filas ===\n%', result;
END $$;

-- ─── 4) Policies RLS existentes (para no destruir las tuyas) ──
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('business_config','services','professionals','clients',
                    'bookings','working_hours','client_profiles','loyalty_levels',
                    'xp_history','earned_rewards','style_gallery','cut_photos')
ORDER BY tablename, policyname;
