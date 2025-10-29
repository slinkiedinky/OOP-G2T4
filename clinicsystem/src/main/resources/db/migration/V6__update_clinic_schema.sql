-- Formerly V3__update_clinic_schema.sql; re-versioned to avoid duplicate V3 conflicts
ALTER TABLE clinic
  ADD COLUMN IF NOT EXISTS clinic_type VARCHAR(20) NOT NULL DEFAULT 'GP'
    CHECK (clinic_type IN ('GP', 'SPECIALIST')),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS telephone_number TEXT,
  ADD COLUMN IF NOT EXISTS pcn_network TEXT,
  ADD COLUMN IF NOT EXISTS specialty TEXT;

UPDATE clinic SET address = COALESCE(location, 'Address TBD') WHERE address IS NULL;

ALTER TABLE clinic ALTER COLUMN address SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clinic_type ON clinic(clinic_type);
CREATE INDEX IF NOT EXISTS idx_clinic_location ON clinic(location);
CREATE INDEX IF NOT EXISTS idx_clinic_pcn ON clinic(pcn_network) WHERE pcn_network IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clinic_specialty ON clinic(specialty) WHERE specialty IS NOT NULL;

COMMENT ON COLUMN clinic.clinic_type IS 'Type of clinic: GP or SPECIALIST';
COMMENT ON COLUMN clinic.pcn_network IS 'Primary Care Network name for GP clinics';
COMMENT ON COLUMN clinic.specialty IS 'Medical specialty for specialist clinics';

