-- Add morning and afternoon availability columns to doctor table
ALTER TABLE doctor
  ADD COLUMN IF NOT EXISTS morning BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS afternoon BOOLEAN DEFAULT TRUE;

-- Update existing doctors to have both availabilities enabled by default
UPDATE doctor SET morning = TRUE WHERE morning IS NULL;
UPDATE doctor SET afternoon = TRUE WHERE afternoon IS NULL;

