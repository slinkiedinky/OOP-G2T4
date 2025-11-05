-- Create table to persist queue running/paused state per clinic
CREATE TABLE clinic_queue_state (
  id BIGSERIAL PRIMARY KEY,
  clinic_id BIGINT NOT NULL UNIQUE,
  running BOOLEAN NOT NULL DEFAULT FALSE,
  paused BOOLEAN NOT NULL DEFAULT FALSE,
  last_updated TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);
