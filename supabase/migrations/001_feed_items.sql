-- Apply on existing projects that already ran the older schema.sql

alter table feed_groups add column if not exists context text;

create table if not exists settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

alter table youtube_channels add column if not exists group_id uuid references feed_groups(id) on delete set null;
alter table videos add column if not exists group_id uuid references feed_groups(id) on delete set null;

create table if not exists feed_items (
  id uuid primary key default gen_random_uuid(),
  external_id text not null,
  group_id uuid references feed_groups(id) on delete cascade,
  source_name text not null,
  title text not null,
  url text not null,
  summary text,
  published_at timestamptz not null,
  created_at timestamptz default now(),
  unique (external_id, source_name)
);

create index if not exists feed_items_published_at_idx on feed_items (published_at desc);
create index if not exists feed_items_group_published_idx on feed_items (group_id, published_at desc);
create index if not exists videos_group_id_published_idx on videos (group_id, published_at desc);
