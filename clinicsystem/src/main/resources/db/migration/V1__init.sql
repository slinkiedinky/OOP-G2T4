-- ===== Core domain =====

create table clinic(
  id bigserial primary key,
  name text not null,
  location text,
  operating_hours text,
  num_rooms int
);

create table doctor(
  id bigserial primary key,
  clinic_id bigint not null references clinic(id),
  name text not null,
  specialization text
);

create table patient(
  id bigserial primary key,
  full_name text not null,
  email text unique,
  contact_number text
);

-- We keep "enums" as VARCHAR + CHECK for portability (Postgres/H2)
create table appointment_slot(
  id bigserial primary key,
  clinic_id bigint not null references clinic(id),
  doctor_id bigint not null references doctor(id),
  patient_id bigint references patient(id),
  start_time timestamp not null,
  end_time timestamp not null,
  status varchar(20) not null
    check (status in ('AVAILABLE','BOOKED','CHECKED_IN','CANCELLED','COMPLETED','NO_SHOW')),
  version bigint not null default 0
);

-- Prevent double-booking same doctor & start time once the slot is taken
create unique index ux_doctor_time_booked
  on appointment_slot(doctor_id, start_time)
  where status in ('BOOKED','CHECKED_IN');

create table queue_ticket(
  id bigserial primary key,
  clinic_id bigint not null references clinic(id),
  appointment_id bigint not null references appointment_slot(id),
  number text not null,
  position int not null,
  priority varchar(20) not null
    check (priority in ('NORMAL','EXPRESS','EMERGENCY')),
  status varchar(20) not null
    check (status in ('WAITING','CALLED','SKIPPED','COMPLETED')),
  created_at timestamp not null default now()
);

create index ix_queue_waiting on queue_ticket(clinic_id, status, created_at);

create table appointment_history(
  id bigserial primary key,
  slot_id bigint not null references appointment_slot(id),
  action text not null,
  actor text not null,
  at timestamp not null default now(),
  details text
);
