-- Tag feed items by source content type (rss article vs bluesky post)

alter table feed_items
  add column if not exists source_type text
  check (source_type is null or source_type in ('rss', 'bluesky'));

update feed_items
set source_type = case
  when url like '%bsky.app%' then 'bluesky'
  else 'rss'
end
where source_type is null;

create index if not exists feed_items_source_type_published_idx
  on feed_items (source_type, published_at desc);
