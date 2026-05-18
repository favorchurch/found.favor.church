# Private Public Catalog And Admin Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove public item discovery from the home/catalog experience while moving the fuzzy public catalog search and calendar filtering into the authenticated admin item catalogue.

**Architecture:** Public routes become non-discovery pages that route staff to login and direct guests to `info@favor.church`. Item data privacy is enforced in Supabase by removing public item read policies and replacing public RPC usage with authenticated admin-only catalogue RPCs. The admin dashboard keeps the existing item cards/table, keeps status toggle filters, removes the stats header cards, and gains old public-style search chips, venue chips, and calendar filtering with empty search showing all items.

**Tech Stack:** Next.js App Router 16.2.4, React 19, Supabase RLS/RPC, Tailwind CSS, React Query, date-fns, lucide-react, Node test runner with `--experimental-strip-types`.

---

## File Structure

- Modify `src/app/page.tsx`: replace the redirect with the new public lost-and-found help page and centered staff login CTA.
- Modify `src/app/catalog/page.tsx`: make `/catalog` inaccessible by redirecting to `/`; leave existing public catalog components in source untouched.
- Modify `src/app/catalog/items/[id]/page.tsx`: redirect item detail requests to `/`.
- Modify `src/app/@modal/(.)catalog/items/[id]/page.tsx`: redirect intercepted public item detail modal requests to `/`.
- Create `src/utils/catalogFilters.ts`: shared helpers for ISO date validation, venue expansion, and admin status validation.
- Create `tests/catalogFilters.test.mts`: unit coverage for the new shared helper behavior.
- Create `supabase/migrations/20260518090000_private_public_admin_catalog.sql`: remove public item read access, revoke old public RPC access, and add admin-only fuzzy search/date-count RPCs.
- Create `src/components/ui/AdminCatalogControls.tsx`: admin-only search/calendar/venue/status controls based on the old public search UI.
- Modify `src/app/admin/dashboard/page.tsx`: call the new admin RPC, remove stats queries/cards, parse date/venue/status/sort params, render `AdminCatalogControls`, and keep `AdminItemsView` plus pagination.
- Keep unchanged `src/components/ui/ItemCard.tsx`, `src/components/ui/AdminItemsView.tsx`, and `src/components/ui/AdminItemsTable.tsx`: this preserves the admin item-card look-and-feel.
- Read before coding, per `AGENTS.md`: `node_modules/next/dist/docs/01-app/index.md` and `node_modules/next/dist/docs/01-app/02-guides/redirecting.md`.

---

### Task 1: Add Shared Catalogue Filter Helpers

**Files:**
- Create: `src/utils/catalogFilters.ts`
- Create: `tests/catalogFilters.test.mts`

- [ ] **Step 1: Write the failing tests**

Create `tests/catalogFilters.test.mts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  expandVenueFilter,
  isIsoDate,
  normalizeAdminStatus,
  type CatalogVenue,
} from "../src/utils/catalogFilters.ts";

const venues: CatalogVenue[] = [
  { slug: "podium", name: "Podium Hall", parent_slug: null, display_order: 1 },
  { slug: "podium-main", name: "Main Hall", parent_slug: "podium", display_order: 2 },
  { slug: "studio", name: "Favor Studio", parent_slug: null, display_order: 3 },
];

test("isIsoDate only accepts yyyy-mm-dd values", () => {
  assert.equal(isIsoDate("2026-05-18"), true);
  assert.equal(isIsoDate("May 18, 2026"), false);
  assert.equal(isIsoDate("2026-5-18"), false);
  assert.equal(isIsoDate(""), false);
});

test("expandVenueFilter includes a parent venue and its children", () => {
  assert.deepEqual(expandVenueFilter(venues, "podium"), ["podium", "podium-main"]);
});

test("expandVenueFilter returns only the child when a child venue is selected", () => {
  assert.deepEqual(expandVenueFilter(venues, "podium-main"), ["podium-main"]);
});

test("expandVenueFilter returns null for all venues", () => {
  assert.equal(expandVenueFilter(venues, "all"), null);
});

test("normalizeAdminStatus accepts known admin statuses", () => {
  assert.equal(normalizeAdminStatus("all"), "all");
  assert.equal(normalizeAdminStatus("unclaimed"), "unclaimed");
  assert.equal(normalizeAdminStatus("claimed"), "claimed");
  assert.equal(normalizeAdminStatus("disposed"), "disposed");
});

test("normalizeAdminStatus falls back to all for unknown values", () => {
  assert.equal(normalizeAdminStatus("waiting"), "all");
  assert.equal(normalizeAdminStatus(undefined), "all");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node --experimental-strip-types --test tests/catalogFilters.test.mts
```

Expected: FAIL with an error like `Cannot find module '../src/utils/catalogFilters.ts'`.

- [ ] **Step 3: Implement the helper**

Create `src/utils/catalogFilters.ts`:

```ts
export interface CatalogVenue {
  slug: string;
  name: string;
  parent_slug: string | null;
  display_order: number | null;
}

export type AdminStatusFilter = "all" | "unclaimed" | "claimed" | "disposed";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ADMIN_STATUSES: AdminStatusFilter[] = [
  "all",
  "unclaimed",
  "claimed",
  "disposed",
];

export function isIsoDate(value: string | undefined | null): value is string {
  return Boolean(value && ISO_DATE.test(value));
}

export function normalizeAdminStatus(
  value: string | undefined | null,
): AdminStatusFilter {
  return ADMIN_STATUSES.includes(value as AdminStatusFilter)
    ? (value as AdminStatusFilter)
    : "all";
}

export function expandVenueFilter(
  venues: CatalogVenue[],
  slug: string,
): string[] | null {
  if (slug === "all") return null;

  const target = venues.find((venue) => venue.slug === slug);
  if (!target) return [slug];
  if (target.parent_slug) return [slug];

  const children = venues
    .filter((venue) => venue.parent_slug === slug)
    .map((venue) => venue.slug);

  return [slug, ...children];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
node --experimental-strip-types --test tests/catalogFilters.test.mts
```

Expected: PASS for all 6 tests. Node may print a module type warning; that is acceptable in this repo because the existing tests do the same.

- [ ] **Step 5: Commit**

```bash
git add src/utils/catalogFilters.ts tests/catalogFilters.test.mts
git commit -m "test: add catalog filter helpers"
```

---

### Task 2: Enforce Privacy And Add Admin Catalogue RPCs

**Files:**
- Create: `supabase/migrations/20260518090000_private_public_admin_catalog.sql`

- [ ] **Step 1: Create the migration**

Create `supabase/migrations/20260518090000_private_public_admin_catalog.sql`:

```sql
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
```

- [ ] **Step 2: Verify the migration SQL parses locally if Supabase CLI is available**

Run:

```bash
supabase db diff --local
```

Expected: either a valid diff or a local Supabase availability error. If the command fails because the local database is not running, continue and rely on `supabase db push` in the deploy flow.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260518090000_private_public_admin_catalog.sql
git commit -m "db: make item catalog admin only"
```

---

### Task 3: Replace Public Home And Disable Public Catalog Routes

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/catalog/page.tsx`
- Modify: `src/app/catalog/items/[id]/page.tsx`
- Modify: `src/app/@modal/(.)catalog/items/[id]/page.tsx`

- [ ] **Step 1: Replace the home redirect with the public help page**

Replace `src/app/page.tsx` with:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Lost & Found | Favor Church",
  description:
    "Need help with a lost item at Favor Church? Email our team so we can help you directly.",
};

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.24 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-bg">
      <section className="flex flex-1 items-center px-4 py-10 sm:px-6">
        <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div className="space-y-6">
            <p className="font-sans text-[10px] font-black uppercase tracking-widest text-brand">
              Favor Church Lost &amp; Found
            </p>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-text-main sm:text-5xl">
                Lost something at church?
              </h1>
              <p className="max-w-2xl text-base leading-7 text-text-muted">
                Email our team at{" "}
                <a className="font-semibold text-brand" href="mailto:info@favor.church">
                  info@favor.church
                </a>{" "}
                with a short description, the date you visited, and where you may have left it.
                We will help check it for you directly.
              </p>
            </div>
            <div className="grid gap-3 text-sm leading-6 text-text-muted sm:grid-cols-2">
              <div className="rounded-2xl border border-border-main bg-white p-4 shadow-sm">
                <Mail className="mb-3 h-5 w-5 text-brand" />
                <p className="font-sans text-[10px] font-black uppercase tracking-widest text-brand">
                  Email us
                </p>
                <p className="mt-1">
                  Include the item, date, service time, and any identifying details.
                </p>
              </div>
              <div className="rounded-2xl border border-border-main bg-white p-4 shadow-sm">
                <MapPin className="mb-3 h-5 w-5 text-brand" />
                <p className="font-sans text-[10px] font-black uppercase tracking-widest text-brand">
                  Visit the info booth
                </p>
                <p className="mt-1">
                  Our team can help after services at Favor Studio, Shangri-La Plaza.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border-main bg-white p-6 text-center shadow-lg shadow-brand/5">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10">
              <GoogleIcon />
            </div>
            <h2 className="text-lg font-bold text-text-main">Staff access</h2>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-text-muted">
              Staff and volunteers can sign in to manage the internal catalogue.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-brand px-6 py-4 font-sans text-[11px] font-black uppercase tracking-widest text-white shadow-sm shadow-brand/20 transition-all hover:bg-brand-dim focus:outline-none focus:ring-4 focus:ring-brand/20"
            >
              <GoogleIcon />
              Login as Staff
            </Link>
          </div>
        </div>
      </section>
      <footer className="border-t border-brand-dim bg-brand-deep px-6 py-8 text-center">
        <p className="font-sans text-xs font-black uppercase text-white">
          &copy; {new Date().getFullYear()}&nbsp;Favor Church &bull; Lost &amp; Found
        </p>
      </footer>
    </main>
  );
}
```

- [ ] **Step 2: Disable `/catalog` without deleting the source components**

Replace `src/app/catalog/page.tsx` with:

```tsx
import { redirect } from "next/navigation";

export default function CatalogPage() {
  redirect("/");
}
```

Leave `src/components/ui/PublicCatalogControls.tsx`, `src/components/ui/PublicCatalogResults.tsx`, `src/components/ui/PublicItemCard.tsx`, and `src/components/ui/PublicItemDetails.tsx` in the source tree for reference and possible future internal reuse.

- [ ] **Step 3: Disable public item detail route**

Replace `src/app/catalog/items/[id]/page.tsx` with:

```tsx
import { redirect } from "next/navigation";

export default function PublicCatalogItemPage() {
  redirect("/");
}
```

- [ ] **Step 4: Disable intercepted public item detail route**

Replace `src/app/@modal/(.)catalog/items/[id]/page.tsx` with:

```tsx
import { redirect } from "next/navigation";

export default function PublicCatalogItemModalPage() {
  redirect("/");
}
```

- [ ] **Step 5: Run lint**

Run:

```bash
pnpm lint
```

Expected: PASS with no new lint errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx src/app/catalog/page.tsx 'src/app/catalog/items/[id]/page.tsx' 'src/app/@modal/(.)catalog/items/[id]/page.tsx'
git commit -m "feat: replace public catalog with lost item contact page"
```

---

### Task 4: Add Admin Catalogue Controls

**Files:**
- Create: `src/components/ui/AdminCatalogControls.tsx`

- [ ] **Step 1: Create the admin controls from the old public search behavior**

Create `src/components/ui/AdminCatalogControls.tsx`. Use `RangeCalendar` from `PublicCatalogControls` so the existing calendar view and date range behavior remain consistent. Include:

```tsx
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format, parseISO, startOfWeek } from "date-fns";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/utils/cn";
import { RangeCalendar } from "@/components/ui/PublicCatalogControls";
import { SortSelector } from "@/components/ui/SortSelector";
import type { AdminStatusFilter, CatalogVenue } from "@/utils/catalogFilters";

interface AdminCatalogControlsProps {
  initialQuery: string;
  initialDateFrom: string;
  initialDateTo: string;
  venues: CatalogVenue[];
  activeVenue: string;
  statusFilter: AdminStatusFilter;
  sortBy: string;
}

const SEARCH_DEBOUNCE_MS = 300;
const SUGGESTED_SEARCHES = [
  "Cellphone",
  "Tumbler",
  "Umbrella",
  "Wallet",
  "Keys",
  "Jacket",
];

const STATUS_FILTERS: { label: string; value: AdminStatusFilter }[] = [
  { label: "Everything", value: "all" },
  { label: "Unclaimed", value: "unclaimed" },
  { label: "Claimed", value: "claimed" },
  { label: "Disposed", value: "disposed" },
];
```

Then implement the component with the same URL-update pattern as `PublicCatalogControls`:

```tsx
export function AdminCatalogControls({
  initialQuery,
  initialDateFrom,
  initialDateTo,
  venues,
  activeVenue,
  statusFilter,
  sortBy,
}: AdminCatalogControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [queryDraft, setQueryDraft] = useState(initialQuery);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const { data: dateCounts } = useQuery({
    queryKey: ["admin-catalog-item-counts"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc(
        "get_admin_catalog_item_counts_by_date",
      );
      if (error) throw error;
      return data as { date_found: string; item_count: number }[];
    },
  });

  useEffect(() => {
    setQueryDraft(initialQuery);
  }, [initialQuery]);

  const updateParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams.toString());
      mutate(next);
      next.delete("page");
      const queryString = next.toString();
      startTransition(() => {
        router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (queryDraft === initialQuery) return;
    const handle = window.setTimeout(() => {
      updateParams((next) => {
        if (queryDraft.trim()) next.set("q", queryDraft.trim());
        else next.delete("q");
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [queryDraft, initialQuery, updateParams]);

  useEffect(() => {
    if (!popoverOpen) return;
    const onClick = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [popoverOpen]);
```

Add helper actions inside the component:

```tsx
  const setRange = (from: string, to: string) => {
    updateParams((next) => {
      if (from) next.set("from", from);
      else next.delete("from");
      if (to) next.set("to", to);
      else next.delete("to");
    });
  };

  const setVenue = (slug: string) => {
    updateParams((next) => {
      if (slug === "all") next.delete("venue");
      else next.set("venue", slug);
    });
  };

  const setStatus = (status: AdminStatusFilter) => {
    updateParams((next) => {
      if (status === "all") next.delete("status");
      else next.set("status", status);
    });
  };

  const searchFor = (term: string) => {
    if (queryDraft.toLowerCase() === term.toLowerCase()) {
      setQueryDraft("");
      updateParams((next) => next.delete("q"));
    } else {
      setQueryDraft(term);
      updateParams((next) => next.set("q", term));
    }
  };

  const applySearch = () => {
    updateParams((next) => {
      const query = queryDraft.trim();
      if (query) next.set("q", query);
      else next.delete("q");
    });
  };
```

Add the date and venue derived values inside the component:

```tsx
  const dateRangeLabel = useMemo(() => {
    if (initialDateFrom && initialDateTo) {
      if (initialDateFrom === initialDateTo) {
        return format(parseISO(initialDateFrom), "MMM d, yyyy");
      }
      return `${format(parseISO(initialDateFrom), "MMM d")} - ${format(parseISO(initialDateTo), "MMM d, yyyy")}`;
    }
    if (initialDateFrom) return `From ${format(parseISO(initialDateFrom), "MMM d, yyyy")}`;
    if (initialDateTo) return `Until ${format(parseISO(initialDateTo), "MMM d, yyyy")}`;
    return "Filter by date";
  }, [initialDateFrom, initialDateTo]);

  const topLevelVenues = useMemo(
    () => venues.filter((venue) => !venue.parent_slug),
    [venues],
  );

  const childrenByParent = useMemo(() => {
    const map = new Map<string, CatalogVenue[]>();
    venues.forEach((venue) => {
      if (!venue.parent_slug) return;
      if (!map.has(venue.parent_slug)) map.set(venue.parent_slug, []);
      map.get(venue.parent_slug)!.push(venue);
    });
    return map;
  }, [venues]);

  const expandedParent = useMemo(() => {
    if (activeVenue === "all") return null;
    const active = venues.find((venue) => venue.slug === activeVenue);
    if (!active) return null;
    return active.parent_slug ?? active.slug;
  }, [activeVenue, venues]);

  const childChips = expandedParent
    ? childrenByParent.get(expandedParent) || []
    : [];

  const thisSunday = useMemo(
    () => format(startOfWeek(new Date()), "yyyy-MM-dd"),
    [],
  );

  const applyThisSunday = () => {
    if (initialDateFrom === thisSunday && initialDateTo === thisSunday) {
      setRange("", "");
    } else {
      setRange(thisSunday, thisSunday);
    }
  };

  const isThisSundayActive =
    initialDateFrom === thisSunday && initialDateTo === thisSunday;
```

Return the UI with status toggles, Last Sunday, mobile calendar popover, search input, suggested search toggle buttons, sort selector, and venue chips:

```tsx
  return (
    <div className="rounded-3xl border border-border-main bg-surface p-4 shadow-sm sm:p-5">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatus(option.value)}
              className={cn(
                "rounded-full border px-4 py-2 text-[10px] font-sans font-bold uppercase tracking-widest transition-all",
                statusFilter === option.value
                  ? "border-brand/40 bg-brand/10 text-brand"
                  : "border-border-main bg-white text-text-muted hover:border-border-hover hover:text-text-main",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="relative flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={applyThisSunday}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-sans font-bold uppercase tracking-widest transition-all hover:border-brand/40 hover:bg-brand/10 hover:text-brand",
              isThisSundayActive
                ? "border-brand/40 bg-brand/10 text-brand"
                : "border-border-main bg-white text-text-muted",
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            Last Sunday
          </button>
          <div ref={popoverRef} className="inline-block lg:hidden">
            <button
              type="button"
              onClick={() => setPopoverOpen((open) => !open)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-sans font-bold uppercase tracking-widest transition-all",
                initialDateFrom || initialDateTo
                  ? "border-brand/40 bg-brand/10 text-brand"
                  : "border-border-main bg-white text-text-muted hover:border-border-hover hover:text-text-main",
              )}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              {dateRangeLabel}
            </button>
            {popoverOpen && (
              <div
                className="absolute left-1/2 top-full z-40 mt-2 max-w-[320px] -translate-x-1/2 rounded-2xl border border-border-main bg-surface p-4 shadow-2xl"
                style={{ width: "calc(100vw - 2rem)" }}
              >
                <RangeCalendar
                  initialFrom={initialDateFrom}
                  initialTo={initialDateTo}
                  dateCounts={dateCounts}
                  onChange={(from, to, completedRange) => {
                    setRange(from, to);
                    if (completedRange) setPopoverOpen(false);
                  }}
                  onClear={() => {
                    setRange("", "");
                    setPopoverOpen(false);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <form
          className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            applySearch();
          }}
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-dim" />
            <input
              type="search"
              value={queryDraft}
              onChange={(event) => setQueryDraft(event.target.value)}
              placeholder="Search by item, place, claim code, status, or staff note"
              className="w-full rounded-2xl border border-border-main bg-white px-12 py-4 text-base font-medium text-text-main shadow-sm transition-colors placeholder:text-text-dim focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
            />
            {queryDraft && (
              <button
                type="button"
                onClick={() => setQueryDraft("")}
                aria-label="Clear search"
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-text-dim hover:bg-surface-hover hover:text-text-main"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-4 font-sans text-[11px] font-black uppercase tracking-widest text-white shadow-sm transition-all hover:bg-brand-dim focus:outline-none focus:ring-4 focus:ring-brand/20"
          >
            <Search className="h-4 w-4" />
            Find
          </button>
          <SortSelector defaultValue={sortBy} />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {SUGGESTED_SEARCHES.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => searchFor(term)}
              className={cn(
                "rounded-full border px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-widest transition-all",
                queryDraft.toLowerCase() === term.toLowerCase()
                  ? "border-brand/40 bg-brand/10 text-brand"
                  : "border-border-main bg-white text-text-muted hover:border-brand/40 hover:bg-brand/10 hover:text-brand",
              )}
            >
              {term}
            </button>
          ))}
        </div>

        <div className="border-t border-border-main pt-4">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-sans font-bold uppercase tracking-widest text-text-dim">
            <MapPin className="h-3.5 w-3.5" />
            Venue
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <VenueChip
              label="All venues"
              active={activeVenue === "all"}
              onClick={() => setVenue("all")}
            />
            {topLevelVenues.map((venue) => (
              <VenueChip
                key={venue.slug}
                label={venue.name}
                active={activeVenue === venue.slug || expandedParent === venue.slug}
                onClick={() => setVenue(venue.slug)}
              />
            ))}
          </div>
          {childChips.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-l border-border-main pl-4">
              <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-text-dim">
                Within {expandedParent ? venues.find((venue) => venue.slug === expandedParent)?.name || "" : ""}:
              </span>
              {childChips.map((child) => (
                <VenueChip
                  key={child.slug}
                  label={child.name}
                  active={activeVenue === child.slug}
                  size="sm"
                  onClick={() => setVenue(child.slug)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

Add `VenueChip` at the bottom of the file:

```tsx
function VenueChip({
  label,
  active,
  onClick,
  size = "md",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border font-sans font-bold uppercase tracking-widest transition-all",
        size === "md" ? "px-4 py-2 text-[10px]" : "px-3 py-1 text-[9px]",
        active
          ? "border-brand/40 bg-brand/10 text-brand"
          : "border-border-main bg-surface text-text-dim hover:border-border-hover hover:bg-surface-hover hover:text-text-main",
      )}
    >
      {label}
    </button>
  );
}
```

- [ ] **Step 2: Run lint**

Run:

```bash
pnpm lint
```

Expected: PASS. If React lint flags the `setQueryDraft(initialQuery)` sync effect, add the same one-line eslint disable comment used in `PublicCatalogControls.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/AdminCatalogControls.tsx
git commit -m "feat: add admin catalog controls"
```

---

### Task 5: Wire Admin Dashboard To Admin Fuzzy Search

**Files:**
- Modify: `src/app/admin/dashboard/page.tsx`

- [ ] **Step 1: Update imports**

In `src/app/admin/dashboard/page.tsx`, replace the lucide/admin-control related imports with:

```tsx
import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { type Item } from "@/components/ui/ItemCard";
import { PlusCircle, Globe } from "lucide-react";
import Link from "next/link";
import { ExportCSV } from "@/components/ui/ExportCSV";
import { AdminItemsView } from "@/components/ui/AdminItemsView";
import { Pagination } from "@/components/ui/Pagination";
import { PAGE_SIZE } from "@/utils/constants";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AdminCatalogControls } from "@/components/ui/AdminCatalogControls";
import {
  expandVenueFilter,
  isIsoDate,
  normalizeAdminStatus,
  type CatalogVenue,
} from "@/utils/catalogFilters";
import { CatalogSidebar } from "@/components/ui/CatalogSidebar";
```

- [ ] **Step 2: Update search params and remove stats queries**

Change the function signature and param parsing to:

```tsx
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    sort?: string;
    page?: string;
    venue?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const params = await searchParams;
  const query = (params.q || "").trim();
  const statusFilter = normalizeAdminStatus(params.status);
  const sortBy = params.sort || "created_at_desc";
  const page = Math.max(1, Number(params.page) || 1);
  const venueFilter = params.venue || "all";
  const dateFrom = isIsoDate(params.from) ? params.from : "";
  const dateTo = isIsoDate(params.to) ? params.to : "";

  const supabase = await createClient();

  const { data: venues, error: venuesError } = await supabase
    .from("found_item_venues")
    .select("slug, name, parent_slug, display_order")
    .order("display_order")
    .order("name");

  if (venuesError) {
    console.error("Admin venues fetch error:", venuesError);
  }

  const allVenues = (venues || []) as CatalogVenue[];
  const venueSlugs = expandVenueFilter(allVenues, venueFilter);
  const from = (page - 1) * PAGE_SIZE;

  const { data: rows, error: itemsError } = await supabase.rpc(
    "search_admin_catalog_items",
    {
      p_query: query,
      p_status: statusFilter,
      p_venues: venueSlugs,
      p_date_from: dateFrom || null,
      p_date_to: dateTo || null,
      p_sort: sortBy,
      p_limit: PAGE_SIZE,
      p_offset: from,
    },
  );

  if (itemsError) {
    console.error("Admin items fetch error:", {
      message: itemsError.message,
      details: itemsError.details,
      hint: itemsError.hint,
      code: itemsError.code,
    });
  }

  const searchRows = (rows || []) as unknown as AdminCatalogSearchRow[];
  const dashboardItems = searchRows as unknown as Item[];
  const totalFiltered = Number(searchRows[0]?.total_count ?? 0);
```

Add this interface near the bottom of the file:

```tsx
interface AdminCatalogSearchRow extends Item {
  total_count: number | string;
}
```

- [ ] **Step 3: Replace the filters/search/sort section**

Remove the whole stats grid block:

```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  ...
</div>
```

Remove `StatCard` and `FilterButton` functions from the bottom of the file.

Replace the old filters/search/sort block with:

```tsx
<div className="lg:grid lg:grid-cols-[320px_1fr] lg:items-start lg:gap-8">
  <aside className="sticky top-20 hidden lg:block">
    <CatalogSidebar
      initialDateFrom={dateFrom}
      initialDateTo={dateTo}
    />
  </aside>

  <div className="space-y-8">
    <AdminCatalogControls
      initialQuery={query}
      initialDateFrom={dateFrom}
      initialDateTo={dateTo}
      venues={allVenues}
      activeVenue={venueFilter}
      statusFilter={statusFilter}
      sortBy={sortBy}
    />

    <ErrorBoundary>
      <AdminItemsView items={dashboardItems} />
    </ErrorBoundary>

    <Pagination total={totalFiltered} />
  </div>
</div>
```

- [ ] **Step 4: Point the desktop calendar at admin counts**

`CatalogSidebar` currently calls `get_public_catalog_item_counts_by_date`, so either modify it to accept an `rpcName` prop or create an `AdminCatalogSidebar`. Prefer modifying it:

```tsx
export function CatalogSidebar({
  initialDateFrom,
  initialDateTo,
  countsRpc = "get_public_catalog_item_counts_by_date",
}: {
  initialDateFrom: string;
  initialDateTo: string;
  countsRpc?: "get_public_catalog_item_counts_by_date" | "get_admin_catalog_item_counts_by_date";
}) {
```

Change its query key and RPC call:

```tsx
const { data: dateCounts } = useQuery({
  queryKey: [countsRpc],
  queryFn: async () => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc(countsRpc);
    if (error) throw error;
    return data as { date_found: string; item_count: number }[];
  },
});
```

Then pass the admin RPC from dashboard:

```tsx
<CatalogSidebar
  initialDateFrom={dateFrom}
  initialDateTo={dateTo}
  countsRpc="get_admin_catalog_item_counts_by_date"
/>
```

- [ ] **Step 5: Run lint and build**

Run:

```bash
pnpm lint
pnpm build
```

Expected: both PASS. `pnpm build` should confirm App Router server/client boundaries are valid.

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/dashboard/page.tsx src/components/ui/CatalogSidebar.tsx
git commit -m "feat: power admin catalogue with fuzzy search"
```

---

### Task 6: Manual Verification

**Files:**
- No code changes unless verification finds a bug.

- [ ] **Step 1: Run focused unit tests**

Run:

```bash
node --experimental-strip-types --test tests/catalogFilters.test.mts tests/dateRangeSelection.test.mts tests/publicCatalogItem.test.mts
```

Expected: PASS for all tests. Node may print the existing module type warning.

- [ ] **Step 2: Run full static checks**

Run:

```bash
pnpm lint
pnpm build
```

Expected: PASS.

- [ ] **Step 3: Start the app**

Run:

```bash
pnpm dev
```

Expected: local Next dev server starts, typically at `http://localhost:3000`.

- [ ] **Step 4: Verify public privacy in browser**

Open:

```text
http://localhost:3000/
```

Expected:
- Page shows lost-item help copy.
- Page shows `info@favor.church`.
- Page shows a centered `Login as Staff` button with Google icon.
- No search input, calendar, suggested item chips, item cards, or public item data appear.

Open:

```text
http://localhost:3000/catalog
```

Expected: redirects to `/`.

Open a known old item detail URL:

```text
http://localhost:3000/catalog/items/<known-item-id>
```

Expected: redirects to `/`.

- [ ] **Step 5: Verify admin catalogue**

Sign in as a `@favor.church` user and open:

```text
http://localhost:3000/admin/dashboard
```

Expected:
- No stats cards for Active Items, Waiting, Resolved, or Disposed appear.
- Status toggle buttons still appear.
- Empty search shows all non-archived admin items.
- Item cards look the same as before.
- Search matches fuzzy terms across item name, description, location, claim code, status, created-by email, claimed-by, disposed-by, category, and venue.
- Calendar dots count all statuses.
- Calendar date filtering narrows admin results.
- Venue chips narrow admin results.
- Pagination works when results exceed `PAGE_SIZE`.

- [ ] **Step 6: Verify direct database privacy after migration**

After applying the migration in a Supabase environment, verify as anon:

```sql
select * from public.found_items limit 1;
select * from public.search_public_catalog_items('', 'all', null, null, null, 24, 0);
select * from public.get_public_catalog_item_counts_by_date(null, null);
```

Expected:
- `found_items` returns no rows or is denied by RLS.
- Old public RPCs are not executable by anon.

Verify as authenticated admin:

```sql
select * from public.search_admin_catalog_items('', 'all', null, null, null, 'created_at_desc', 24, 0);
select * from public.get_admin_catalog_item_counts_by_date(null, null);
```

Expected:
- Admin RPC returns non-archived items.
- Admin date-count RPC returns counts grouped by `date_found`.

---

## Self-Review

**Spec coverage:** Public search, calendar, item cards, and item detail routes are removed from public access. Home shows `info@favor.church` and a front-and-center `Login as Staff` button with Google icon. Admin uses fuzzy search, calendar, suggested toggle chips, venue chips, and status toggles. Admin empty search shows all non-archived items. Stats header cards are removed. Item cards/table are untouched.

**Placeholder scan:** No `TBD`, `TODO`, `implement later`, or "similar to" steps remain. The plan includes exact paths, code snippets, commands, and expected outcomes.

**Type consistency:** `CatalogVenue`, `AdminStatusFilter`, `expandVenueFilter`, `isIsoDate`, and `normalizeAdminStatus` are defined before use. RPC return fields match the existing `Item` surface plus `total_count`.

---

Plan complete and saved to `docs/superpowers/plans/2026-05-18-private-public-admin-catalog.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
