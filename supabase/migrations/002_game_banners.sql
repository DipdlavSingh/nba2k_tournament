-- Adds game banners. Run once in the Supabase SQL editor if you created the
-- database before this feature (new projects get it from schema.sql).

alter table games add column if not exists banner_active boolean not null default false;
alter table games add column if not exists banner_until timestamptz;
alter table games add column if not exists banner_version timestamptz;

create table if not exists banners (
  id uuid primary key references games(id) on delete cascade,
  image text not null,
  created_at timestamptz not null default now()
);

alter table banners enable row level security;
