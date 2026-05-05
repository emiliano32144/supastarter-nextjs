-- ============================================
-- DIAGNOSTICO BETTER AUTH v3
-- Verifica si las tablas de autenticacion existen
-- Si faltan, aplica supabase-migration-better-auth.sql del proyecto
-- ============================================

DO $$
DECLARE
    v_table text;
BEGIN
    RAISE NOTICE '=== TABLAS BETTER AUTH ===';
    
    FOR v_table IN 
        SELECT unnest(ARRAY[
            'user','session','account','verification',
            'organization','member','invitation'
        ])
    LOOP
        IF to_regclass(v_table) IS NOT NULL THEN
            RAISE NOTICE '✓ % existe', v_table;
        ELSE
            RAISE NOTICE '✗ % NO EXISTE - NECESITAS aplicar supabase-migration-better-auth.sql', v_table;
        END IF;
    END LOOP;
END $$;

SELECT 
    'Si ves ✗ arriba, ejecuta el archivo supabase-migration-better-auth.sql del proyecto' as accion_requerida;
