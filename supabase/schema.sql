-- artiflight database schema
-- Run this in the Supabase SQL Editor to set up a fresh project.

-- Artifacts
create table artifacts (
  id          uuid default gen_random_uuid() primary key,
  slug        text unique not null,
  title       text not null,
  description text,
  html        text not null,
  prompt      text,
  tags        text[],
  category    text,
  views       integer default 0,
  published   boolean default true,
  password    text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Version history
create table artifact_versions (
  id           uuid default gen_random_uuid() primary key,
  artifact_id  uuid references artifacts(id) on delete cascade,
  html         text not null,
  version      integer not null,
  note         text,
  created_at   timestamptz default now()
);

-- Row Level Security
alter table artifacts enable row level security;
alter table artifact_versions enable row level security;

-- Public can read published artifacts (anon key)
create policy "Public read"
  on artifacts for select
  using (published = true);

-- service_role bypasses RLS automatically — no write policy needed

-- Atomic view counter, no race conditions
create or replace function increment_views(artifact_id uuid)
returns void language sql security definer as $$
  update artifacts set views = views + 1 where id = artifact_id;
$$;
