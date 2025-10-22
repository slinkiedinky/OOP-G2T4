-- ===== Add missing fields and tables to match schema diagram =====

-- Add missing fields to clinic table
ALTER TABLE clinic ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE clinic ADD COLUMN IF NOT EXISTS telephone_number text;
ALTER TABLE clinic ADD COLUMN IF NOT EXISTS pcn_network text;
ALTER TABLE clinic ADD COLUMN IF NOT EXISTS specialty text;
ALTER TABLE clinic ADD COLUMN IF NOT EXISTS clinic_type varchar(50);
ALTER TABLE clinic ADD COLUMN IF NOT EXISTS appt_interval int4 DEFAULT 30;

-- Create doctor_schedule table
CREATE TABLE IF NOT EXISTS doctor_schedule (
  id bigserial primary key,
  doctor_id bigint not null references doctor(id),
  start_time timestamp not null,
  end_time timestamp not null,
  available boolean not null default true
);

-- Create clinic_available_doctors junction table
CREATE TABLE IF NOT EXISTS clinic_available_doctors (
  clinic_id bigint not null references clinic(id),
  available_doctors_id bigint not null references doctor(id),
  PRIMARY KEY (clinic_id, available_doctors_id)
);

-- Update user_accounts role check to include DOCTOR
ALTER TABLE user_accounts DROP CONSTRAINT IF EXISTS user_accounts_role_check;
ALTER TABLE user_accounts ADD CONSTRAINT user_accounts_role_check 
  CHECK (role in ('PATIENT','STAFF','ADMIN','DOCTOR'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS ix_doctor_schedule_doctor_id ON doctor_schedule(doctor_id);
CREATE INDEX IF NOT EXISTS ix_doctor_schedule_available ON doctor_schedule(available);
CREATE INDEX IF NOT EXISTS ix_doctor_schedule_time ON doctor_schedule(start_time, end_time);







