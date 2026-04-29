drop function if exists public.search_public_catalog_items(
  text,
  text,
  text[],
  date,
  date,
  integer,
  integer
);

create or replace function public.search_public_catalog_items(
  p_query text default '',
  p_status text default 'unclaimed',
  p_venues text[] default null,
  p_date_from date default null,
  p_date_to date default null,
  p_limit integer default 24,
  p_offset integer default 0
)
returns table (
  id uuid,
  name text,
  description text,
  item_code text,
  category text,
  category_name jsonb,
  venue text,
  venue_name jsonb,
  location text,
  date_found date,
  total_count bigint
)
language sql
stable
set search_path = public, extensions
as $$
  with normalized as (
    select
      lower(trim(coalesce(p_query, ''))) as query_text,
      greatest(1, least(coalesce(p_limit, 24), 100)) as page_limit,
      greatest(0, coalesce(p_offset, 0)) as page_offset
  ),
  catalog_items as (
    select
      fi.id,
      fi.name,
      fi.description,
      fi.item_code,
      fi.category,
      jsonb_build_object('name', coalesce(c.name, 'Others')) as category_name,
      fi.venue,
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
      fi.location,
      fi.date_found,
      lower(concat_ws(
        ' ',
        fi.name,
        fi.description,
        fi.location,
        fi.item_code,
        c.name,
        v.name,
        parent_v.name
      )) as searchable_text
    from public.found_items fi
    left join public.found_item_categories c on c.slug = fi.category
    left join public.found_item_venues v on v.slug = fi.venue
    left join public.found_item_venues parent_v on parent_v.slug = v.parent_slug
    where fi.is_public = true
      and fi.archived_at is null
      and (p_status is null or p_status = 'all' or fi.status = p_status)
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
        similarity(lower(coalesce(ci.item_code, '')), n.query_text)
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
    counted.item_code,
    counted.category,
    counted.category_name,
    counted.venue,
    counted.venue_name,
    counted.location,
    counted.date_found,
    counted.total_count
  from counted
  cross join normalized n
  order by
    counted.rank_score desc,
    counted.date_found desc,
    counted.name asc
  limit (select page_limit from normalized)
  offset (select page_offset from normalized);
$$;

grant execute on function public.search_public_catalog_items(
  text,
  text,
  text[],
  date,
  date,
  integer,
  integer
) to anon, authenticated;
