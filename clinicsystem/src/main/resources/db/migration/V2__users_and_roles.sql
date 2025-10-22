-- ===== Authentication & roles =====

create table user_accounts (
  id bigserial primary key,
  username text not null unique,
  password_hash text not null,
  role varchar(20) not null check (role in ('PATIENT','STAFF','ADMIN')),
  enabled boolean not null default true,
  patient_id bigint,
  staff_id bigint
);

create index ix_user_accounts_username on user_accounts(username);
