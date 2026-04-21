-- Create items table
create table items (
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
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
before update on items
for each row
execute procedure handle_updated_at();

-- Enable RLS
alter table items enable row level security;

-- Policies
-- Admin (authenticated) can do everything
create policy "Admins can do everything"
  on items for all
  to authenticated
  using (true)
  with check (true);

-- Public can only read public items that are not archived
create policy "Public can read public items"
  on items for select
  to anon
  using (is_public = true and archived_at is null);

-- Storage bucket setup (requires bucket to be created via API/UI first, but policies can be declared)
-- Assuming 'item-images' bucket is created
-- insert into storage.buckets (id, name, public) values ('item-images', 'item-images', true) on conflict (id) do nothing;

create policy "Public can view images"
  on storage.objects for select
  to anon
  using (bucket_id = 'item-images');

create policy "Admins can upload images"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'item-images')
  with check (bucket_id = 'item-images');
