-- ============================================
-- DIAGNOSTICO QUIRURGICO v3 - Sistema de Barberia
-- Idempotente: no rompe si faltan tablas
-- Verificado contra: migration.sql, migration-loyalty.sql,
--   /api/styles, /api/public/styles, /api/cron/booking-reminders,
--   /api/reservas/[id]/complete, /api/public/reservas/[slug]/book
-- ============================================

DO $$
DECLARE
    v_table text;
    v_count integer;
    v_cols text;
BEGIN
    RAISE NOTICE '=== 1. TABLAS DEL SISTEMA DE RESERVAS ===';
    
    FOR v_table IN 
        SELECT unnest(ARRAY[
            'bookings','services','professionals','working_hours',
            'business_config','style_gallery','clients','client_profiles',
            'loyalty_levels','xp_history','earned_rewards','cut_photos'
        ])
    LOOP
        IF to_regclass(v_table) IS NOT NULL THEN
            EXECUTE format('SELECT COUNT(*) FROM %I', v_table) INTO v_count;
            RAISE NOTICE '✓ % existe - % filas', v_table, v_count;
        ELSE
            RAISE NOTICE '✗ % NO EXISTE', v_table;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== 2. COLUMNAS EN bookings ===';
    
    SELECT string_agg(column_name || ' (' || data_type || ')', ', ' ORDER BY ordinal_position)
    INTO v_cols
    FROM information_schema.columns 
    WHERE table_name = 'bookings';
    
    IF v_cols IS NOT NULL THEN
        RAISE NOTICE '%', v_cols;
    ELSE
        RAISE NOTICE 'Tabla bookings no existe';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== 3. COLUMNAS EN services ===';
    
    SELECT string_agg(column_name || ' (' || data_type || ')', ', ' ORDER BY ordinal_position)
    INTO v_cols
    FROM information_schema.columns 
    WHERE table_name = 'services';
    
    IF v_cols IS NOT NULL THEN
        RAISE NOTICE '%', v_cols;
    ELSE
        RAISE NOTICE 'Tabla services no existe';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== 4. TABLAS DE BETTER AUTH ===';
    
    FOR v_table IN 
        SELECT unnest(ARRAY['user','session','organization','member','account'])
    LOOP
        IF to_regclass(v_table) IS NOT NULL THEN
            RAISE NOTICE '✓ % existe', v_table;
        ELSE
            RAISE NOTICE '✗ % NO EXISTE', v_table;
        END IF;
    END LOOP;
    
END $$;

-- Resultados en formato tabla (donde existan)
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('bookings', 'services', 'style_gallery', 'clients', 'client_profiles', 'xp_history', 'earned_rewards', 'cut_photos', 'loyalty_levels', 'business_config')
ORDER BY table_name, ordinal_position;
