-- Create queue_entries table for QueueEntry JPA entity

CREATE TABLE IF NOT EXISTS queue_entries (
  id bigserial PRIMARY KEY,
  clinic_id bigint NOT NULL REFERENCES clinic(id),
  slot_id bigint NOT NULL REFERENCES appointment_slot(id),
  queue_number integer,
  status varchar(30) NOT NULL
    CHECK (status IN ('WAITING','QUEUED','CALLED','SERVING','SKIPPED','COMPLETED')),
  created_at timestamp NOT NULL DEFAULT now(),
  called_at timestamp,
  room text,
  doctor_name text
);

CREATE INDEX IF NOT EXISTS ix_queue_entries_clinic_queue_number ON queue_entries(clinic_id, queue_number);
CREATE INDEX IF NOT EXISTS ix_queue_entries_created_at ON queue_entries(created_at);

-- Optional: unique index to prevent duplicate queue entries for the same slot
CREATE UNIQUE INDEX IF NOT EXISTS uq_queue_entries_slot ON queue_entries(slot_id);
