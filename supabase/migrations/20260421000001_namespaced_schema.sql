-- Cleanup previous namespaced schema attempt
drop schema if exists found cascade;

-- Create items table in public schema with 'found_' prefix for namespacing
drop table if exists public.found_items;
create table public.found_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  date_found date not null,
  location text,
  status text check (status in ('unclaimed', 'claimed', 'disposed')) default 'unclaimed',
  photo_path text, -- Path in Supabase Storage
  is_public boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  archived_at timestamp with time zone
);

-- Register a function to update the updated_at column
create or replace function public.handle_found_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_found_updated_at on public.found_items;
create trigger set_found_updated_at
before update on public.found_items
for each row
execute procedure public.handle_found_updated_at();

-- Enable RLS
alter table public.found_items enable row level security;

-- Policies
-- Admin (authenticated) can do everything
create policy "Admins can do everything on found_items"
  on public.found_items for all
  to authenticated
  using (true)
  with check (true);

-- Public can only read public items that are not archived
create policy "Public can read public found_items"
  on public.found_items for select
  to anon
  using (is_public = true and archived_at is null);

-- Storage policies (bucket is already 'item-images')
-- Ensuring policies apply correctly to the bucket
drop policy if exists "Public can view images" on storage.objects;
drop policy if exists "Admins can upload images" on storage.objects;

create policy "Public can view images"
  on storage.objects for select
  to anon
  using (bucket_id = 'item-images');

create policy "Admins can upload images"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'item-images')
  with check (bucket_id = 'item-images');
