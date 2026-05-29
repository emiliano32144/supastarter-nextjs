-- ═══════════════════════════════════════════════════════════════
-- Anti doble-reserva: constraint de exclusión a nivel de base de datos
-- ═══════════════════════════════════════════════════════════════
--
-- PROBLEMA QUE RESUELVE
-- Los endpoints de reserva (book) y reprogramación comprueban la
-- disponibilidad y luego insertan/actualizan en dos pasos separados.
-- Entre la comprobación y la escritura existe una condición de carrera
-- (TOCTOU): dos peticiones concurrentes para el mismo hueco pueden
-- pasar ambas la comprobación y crear reservas solapadas.
--
-- SOLUCIÓN
-- Un EXCLUDE constraint garantiza, de forma atómica en la BD, que no
-- existan dos reservas NO canceladas que se solapen en el tiempo para
-- la misma organización y el mismo profesional. Si professional_id es
-- NULL (sin profesional asignado), se usa un UUID centinela para que
-- esas reservas también compitan entre sí por el mismo hueco.
--
-- El rango usa '[)' (inicio incluido, fin excluido) → permite citas
-- consecutivas (una termina 10:00, otra empieza 10:00) sin conflicto,
-- igual que la lógica de solapamiento de la app.
--
-- SEGURO DE EJECUTAR: idempotente. Si ya hay solapamientos previos en
-- los datos, el ALTER fallará; en ese caso, limpiar duplicados primero
-- (ver consulta de diagnóstico al final).
-- ═══════════════════════════════════════════════════════════════

-- 1. Extensión necesaria para combinar igualdad (=) y solapamiento (&&)
--    de rangos en un mismo índice GiST.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Constraint de exclusión (parcial: ignora las canceladas)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_no_overlap'
  ) THEN
    ALTER TABLE bookings
      ADD CONSTRAINT bookings_no_overlap
      EXCLUDE USING gist (
        organization_id WITH =,
        COALESCE(professional_id, '00000000-0000-0000-0000-000000000000'::uuid) WITH =,
        tsrange((date + start_time), (date + end_time)) WITH &&
      )
      WHERE (status <> 'cancelled');
  END IF;
END $$;

-- ───────────────────────────────────────────────────────────────
-- DIAGNÓSTICO (opcional): detectar solapamientos existentes antes
-- de aplicar el constraint. Si esta consulta devuelve filas, hay que
-- resolver esos conflictos (cancelar duplicados) antes del ALTER.
-- ───────────────────────────────────────────────────────────────
-- SELECT a.id, b.id, a.organization_id, a.date, a.start_time, a.end_time
-- FROM bookings a
-- JOIN bookings b
--   ON a.id < b.id
--  AND a.organization_id = b.organization_id
--  AND COALESCE(a.professional_id, '00000000-0000-0000-0000-000000000000'::uuid)
--      = COALESCE(b.professional_id, '00000000-0000-0000-0000-000000000000'::uuid)
--  AND a.date = b.date
--  AND a.status <> 'cancelled' AND b.status <> 'cancelled'
--  AND tsrange((a.date + a.start_time), (a.date + a.end_time))
--   && tsrange((b.date + b.start_time), (b.date + b.end_time));
