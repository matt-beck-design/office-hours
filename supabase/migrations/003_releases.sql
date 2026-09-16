create table if not exists releases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text not null check (kind in ('game', 'movie', 'show', 'music', 'other')),
  release_date date not null,
  url text,
  notes text,
  created_at timestamptz default now()
);

create index if not exists releases_date_idx on releases (release_date);
create index if not exists releases_kind_date_idx on releases (kind, release_date);
