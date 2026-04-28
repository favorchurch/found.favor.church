-- Speed up the admin dashboard and public catalog read paths.
create extension if not exists pg_trgm with schema extensions;

set local search_path = public, extensions;

create index if not exists found_items_active_created_at_idx
  on public.found_items (created_at desc)
  where archived_at is null;

create index if not exists found_items_active_date_found_idx
  on public.found_items (date_found desc)
  where archived_at is null;

create index if not exists found_items_active_status_created_at_idx
  on public.found_items (status, created_at desc)
  where archived_at is null;

create index if not exists found_items_active_status_date_found_idx
  on public.found_items (status, date_found desc)
  where archived_at is null;

create index if not exists found_items_active_name_idx
  on public.found_items (name)
  where archived_at is null;

create index if not exists found_items_active_name_trgm_idx
  on public.found_items using gin (name gin_trgm_ops)
  where archived_at is null;

create index if not exists found_items_public_catalog_idx
  on public.found_items (is_public, status, venue, date_found desc)
  where archived_at is null;
