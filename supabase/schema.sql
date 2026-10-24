-- NBA 2K26 tournament schema. Run this once in the Supabase SQL editor.
-- The app talks to the database only from the server with the service role
-- key, so row level security is enabled with no policies: the public anon key
-- can read or write nothing.

create table if not exists teams (
  id uuid primary key,
  name text not null,
  nba_team text unique,
  tagline text,
  created_at timestamptz not null default now()
);

create table if not exists players (
  id uuid primary key,
  username text not null unique,
  password_hash text not null,
  display_name text not null,
  gamertag text,
  tagline text,
  avatar text, -- small JPEG data URL, resized in the browser
  team_id uuid references teams(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists games (
  id uuid primary key,
  stage text not null check (stage in ('rr', 'final')),
  round int not null default 1,
  home_team_id uuid not null references teams(id) on delete cascade,
  away_team_id uuid not null references teams(id) on delete cascade,
  scheduled_at timestamptz,
  home_score int,
  away_score int,
  status text not null default 'scheduled' check (status in ('scheduled', 'final')),
  notes text,
  banner_active boolean not null default false,
  banner_until timestamptz,
  banner_version timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists banners (
  id uuid primary key references games(id) on delete cascade,
  image text not null, -- JPEG data URL, resized in the browser
  created_at timestamptz not null default now()
);

create table if not exists settings (
  id text primary key,
  name text not null,
  season text not null default '',
  announcement text not null default '',
  registration_open boolean not null default true,
  finals_override jsonb,
  created_at timestamptz not null default now()
);

alter table teams enable row level security;
alter table players enable row level security;
alter table games enable row level security;
alter table banners enable row level security;
alter table settings enable row level security;
