-- Public visitors should not be able to discover lost-and-found inventory.
drop policy if exists "Public items are visible to all" on public.found_items;
drop policy if exists "Anyone can read public found_items" on public.found_items;
drop policy if exists "Public can read public found_items" on public.found_items;

revoke execute on function public.search_public_catalog_items(
  text,
  text,
  text[],
  date,
  date,
  integer,
  integer
) from anon;

revoke execute on function public.search_public_catalog_items(
  text,
  text,
  text[],
  date,
  date,
  integer,
  integer
) from authenticated;

revoke execute on function public.get_public_catalog_item_counts_by_date(
  date,
  date
) from anon;

revoke execute on function public.get_public_catalog_item_counts_by_date(
  date,
  date
) from authenticated;

drop policy if exists "Storage is public for reading" on storage.objects;
drop policy if exists "Anyone can view images" on storage.objects;
drop policy if exists "Public can view images" on storage.objects;

create policy "Admins can read item images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'item-images' and public.is_admin());

drop function if exists public.search_admin_catalog_items(
  text,
  text,
  text[],
  date,
  date,
  text,
  integer,
  integer
);

create or replace function public.search_admin_catalog_items(
  p_query text default '',
  p_status text default 'all',
  p_venues text[] default null,
  p_date_from date default null,
  p_date_to date default null,
  p_sort text default 'created_at_desc',
  p_limit integer default 24,
  p_offset integer default 0
)
returns table (
  id uuid,
  name text,
  description text,
  date_found date,
  location text,
  venue text,
  status text,
  photo_path text,
  is_public boolean,
  item_code text,
  category text,
  created_at timestamptz,
  created_by_email text,
  claimed_date timestamptz,
  claimed_by text,
  disposed_date timestamptz,
  disposed_by text,
  category_name jsonb,
  venue_name jsonb,
  total_count bigint
)
language sql
stable
set search_path = public, extensions
as $$
  with normalized as (
    select
      lower(trim(coalesce(p_query, ''))) as query_text,
      case
        when p_status in ('unclaimed', 'claimed', 'disposed') then p_status
        else 'all'
      end as status_text,
      case
        when p_sort in (
          'created_at_desc',
          'created_at_asc',
          'name_asc',
          'name_desc',
          'date_found_desc',
          'date_found_asc'
        ) then p_sort
        else 'created_at_desc'
      end as sort_text,
      greatest(1, least(coalesce(p_limit, 24), 100)) as page_limit,
      greatest(0, coalesce(p_offset, 0)) as page_offset
  ),
  catalog_items as (
    select
      fi.id,
      fi.name,
      fi.description,
      fi.date_found,
      fi.location,
      fi.venue,
      fi.status,
      fi.photo_path,
      fi.is_public,
      fi.item_code,
      fi.category,
      fi.created_at,
      fi.created_by_email,
      fi.claimed_date,
      fi.claimed_by,
      fi.disposed_date,
      fi.disposed_by,
      jsonb_build_object('name', coalesce(c.name, 'Others')) as category_name,
      case
        when v.slug is null then null
        else jsonb_build_object(
          'name', v.name,
          'parent_slug', v.parent_slug,
          'parent', case
            when parent_v.slug is null then null
            else jsonb_build_object('name', parent_v.name)
          end
        )
      end as venue_name,
      lower(concat_ws(
        ' ',
        fi.name,
        fi.description,
        fi.location,
        fi.item_code,
        fi.status,
        fi.created_by_email,
        fi.claimed_by,
        fi.disposed_by,
        c.name,
        v.name,
        parent_v.name
      )) as searchable_text
    from public.found_items fi
    left join public.found_item_categories c on c.slug = fi.category
    left join public.found_item_venues v on v.slug = fi.venue
    left join public.found_item_venues parent_v on parent_v.slug = v.parent_slug
    cross join normalized n
    where public.is_admin()
      and fi.archived_at is null
      and (n.status_text = 'all' or fi.status = n.status_text)
      and (p_venues is null or cardinality(p_venues) = 0 or fi.venue = any(p_venues))
      and (p_date_from is null or fi.date_found >= p_date_from)
      and (p_date_to is null or fi.date_found <= p_date_to)
  ),
  scored as (
    select
      ci.*,
      greatest(
        similarity(ci.searchable_text, n.query_text),
        similarity(lower(coalesce(ci.name, '')), n.query_text),
        similarity(lower(coalesce(ci.location, '')), n.query_text),
        similarity(lower(coalesce(ci.item_code, '')), n.query_text),
        similarity(lower(coalesce(ci.created_by_email, '')), n.query_text),
        similarity(lower(coalesce(ci.claimed_by, '')), n.query_text),
        similarity(lower(coalesce(ci.disposed_by, '')), n.query_text)
      ) as rank_score
    from catalog_items ci
    cross join normalized n
    where n.query_text = ''
      or position(n.query_text in ci.searchable_text) > 0
      or exists (
        select 1
        from regexp_split_to_table(n.query_text, '\s+') as token
        where length(token) >= 2
          and (
            position(token in ci.searchable_text) > 0
            or similarity(ci.searchable_text, token) >= 0.18
            or similarity(lower(coalesce(ci.name, '')), token) >= 0.25
            or similarity(lower(coalesce(ci.location, '')), token) >= 0.25
            or similarity(lower(coalesce(ci.item_code, '')), token) >= 0.25
            or similarity(lower(coalesce(ci.created_by_email, '')), token) >= 0.25
            or similarity(lower(coalesce(ci.claimed_by, '')), token) >= 0.25
            or similarity(lower(coalesce(ci.disposed_by, '')), token) >= 0.25
          )
      )
  ),
  counted as (
    select
      scored.*,
      count(*) over () as total_count
    from scored
  )
  select
    counted.id,
    counted.name,
    counted.description,
    counted.date_found,
    counted.location,
    counted.venue,
    counted.status,
    counted.photo_path,
    counted.is_public,
    counted.item_code,
    counted.category,
    counted.created_at,
    counted.created_by_email,
    counted.claimed_date,
    counted.claimed_by,
    counted.disposed_date,
    counted.disposed_by,
    counted.category_name,
    counted.venue_name,
    counted.total_count
  from counted
  cross join normalized n
  order by
    case when n.query_text <> '' then counted.rank_score end desc nulls last,
    case when n.sort_text = 'created_at_desc' then counted.created_at end desc nulls last,
    case when n.sort_text = 'created_at_asc' then counted.created_at end asc nulls last,
    case when n.sort_text = 'name_asc' then counted.name end asc nulls last,
    case when n.sort_text = 'name_desc' then counted.name end desc nulls last,
    case when n.sort_text = 'date_found_desc' then counted.date_found end desc nulls last,
    case when n.sort_text = 'date_found_asc' then counted.date_found end asc nulls last,
    counted.date_found desc,
    counted.name asc
  limit (select page_limit from normalized)
  offset (select page_offset from normalized);
$$;

grant execute on function public.search_admin_catalog_items(
  text,
  text,
  text[],
  date,
  date,
  text,
  integer,
  integer
) to authenticated;

create or replace function public.get_admin_catalog_item_counts_by_date(
  p_date_from date default null,
  p_date_to date default null
)
returns table (
  date_found date,
  item_count bigint
)
language sql
stable
set search_path = public, extensions
as $$
  select
    fi.date_found,
    count(*) as item_count
  from public.found_items fi
  where public.is_admin()
    and fi.archived_at is null
    and (p_date_from is null or fi.date_found >= p_date_from)
    and (p_date_to is null or fi.date_found <= p_date_to)
  group by fi.date_found;
$$;

grant execute on function public.get_admin_catalog_item_counts_by_date(
  date,
  date
) to authenticated;
