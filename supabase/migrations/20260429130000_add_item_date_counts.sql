create or replace function public.get_public_catalog_item_counts_by_date(
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
  where fi.is_public = true
    and fi.archived_at is null
    and (p_date_from is null or fi.date_found >= p_date_from)
    and (p_date_to is null or fi.date_found <= p_date_to)
  group by fi.date_found;
$$;

grant execute on function public.get_public_catalog_item_counts_by_date(date, date) to anon, authenticated;
