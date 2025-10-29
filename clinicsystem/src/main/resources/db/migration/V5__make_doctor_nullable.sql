-- Make doctor_id nullable to allow generating slots without assigned doctor
ALTER TABLE appointment_slot
  ALTER COLUMN doctor_id DROP NOT NULL;

-- Optional: keep an index for faster null and lookup queries (index may already exist)
-- CREATE INDEX IF NOT EXISTS idx_appointment_slot_doctor_id ON appointment_slot(doctor_id);

