-- Flyway migration: add last_reset_at to clinic_queue_state
-- This column is nullable. Existing rows will keep last_reset_at = NULL
-- Application will treat NULL as "start of day" unless updated by the scheduled reset.

ALTER TABLE clinic_queue_state
  ADD COLUMN IF NOT EXISTS last_reset_at TIMESTAMP;
