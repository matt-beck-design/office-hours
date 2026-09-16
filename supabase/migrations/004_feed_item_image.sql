-- Hero/thumbnail image for feed items (RSS enclosure/media or Bluesky embed)

alter table feed_items
  add column if not exists image_url text;
