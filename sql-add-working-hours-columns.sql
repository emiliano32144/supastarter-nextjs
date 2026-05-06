-- Ejecutar en Supabase → SQL Editor (una vez)
-- Columnas usadas por createWorkingHours / página pública de reservas

ALTER TABLE working_hours
ADD COLUMN IF NOT EXISTS open_time TIME,
ADD COLUMN IF NOT EXISTS close_time TIME,
ADD COLUMN IF NOT EXISTS break_start TIME,
ADD COLUMN IF NOT EXISTS break_end TIME,
ADD COLUMN IF NOT EXISTS is_working BOOLEAN DEFAULT true;

-- Si tu tabla tenía start_time/end_time y querés conservar datos, descomentá:
-- ALTER TABLE working_hours RENAME COLUMN start_time TO open_time;
-- ALTER TABLE working_hours RENAME COLUMN end_time TO close_time;
