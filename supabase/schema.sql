-- Run this in your Supabase SQL editor

create table if not exists digests (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  content jsonb not null,
  created_at timestamptz default now()
);

create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  channel_id text not null,
  channel_name text not null,
  title text not null,
  thumbnail_url text,
  video_url text not null,
  published_at timestamptz not null,
  created_at timestamptz default now(),
  unique (channel_id, video_url)
);

create table if not exists seen_items (
  id uuid primary key default gen_random_uuid(),
  item_id text not null,
  source text not null,
  seen_at timestamptz default now(),
  unique (item_id, source)
);

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  keys jsonb not null,
  created_at timestamptz default now()
);

-- Admin-managed sources
create table if not exists feed_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  topic text not null,
  position int default 0,
  created_at timestamptz default now()
);

create table if not exists feed_sources (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references feed_groups(id) on delete cascade,
  name text not null,
  type text not null check (type in ('rss', 'bluesky')),
  url text,
  handle text,
  tier text not null check (tier in ('breaking', 'daily')),
  enabled boolean default true,
  created_at timestamptz default now()
);

create table if not exists youtube_channels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  channel_id text not null unique,
  enabled boolean default true,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists digests_date_idx on digests (date desc);
create index if not exists videos_published_at_idx on videos (published_at desc);
create index if not exists seen_items_item_id_idx on seen_items (item_id, source);
