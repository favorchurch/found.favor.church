# Catalog UI Enhancements & Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the public catalog UI for better usability, visual appeal, and performance using React Query and layout optimizations.

**Architecture:** 
- Add a new RPC for fetching item counts by date to power calendar highlights.
- Convert Catalog results to client-side fetching with React Query for snappy filtering.
- Redesign `PublicCatalogControls` for better layout (Date/Sunday above search) and desktop sidebar for calendar.
- Implement toggle behavior for search pills.
- Apply global styling for overscroll and background colors.

**Tech Stack:** React, Next.js (App Router), Tailwind CSS, Lucide Icons, Supabase, TanStack React Query.

---

### Task 1: Database - Add Date Counts RPC

**Files:**
- Create: `supabase/migrations/20260429130000_add_item_date_counts.sql`

- [ ] **Step 1: Create the migration file with the RPC**

```sql
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
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260429130000_add_item_date_counts.sql
git commit -m "db: add get_public_catalog_item_counts_by_date rpc"
```

---

### Task 2: UI - Global Background & Overscroll

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/catalog/page.tsx`

- [ ] **Step 1: Update globals.css for orange overscroll**

```css
/* ... existing code ... */
html {
  background-color: var(--orange);
}

body {
  background-color: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
  min-height: 100vh;
}
/* ... existing code ... */
```

- [ ] **Step 2: Ensure Catalog page has white background on main content**

In `src/app/catalog/page.tsx`, ensure the outer container or specific sections have `bg-bg` (which is white) to cover the orange html background except for overscroll.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css src/app/catalog/page.tsx
git commit -m "ui: set orange background for html and white for main content"
```

---

### Task 3: Performance - React Query for Catalog Results

**Files:**
- Modify: `src/components/ui/PublicCatalogResults.tsx`
- Modify: `src/app/catalog/page.tsx`

- [ ] **Step 1: Update PublicCatalogResults to use useQuery**

Refactor the component to take initial data but fetch updates via React Query when params change.

- [ ] **Step 2: Update CatalogPage to pass search state to client components**

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/PublicCatalogResults.tsx src/app/catalog/page.tsx
git commit -m "perf: implement react-query for catalog results"
```

---

### Task 4: UI - Refactor PublicCatalogControls Layout & Toggles

**Files:**
- Modify: `src/components/ui/PublicCatalogControls.tsx`

- [ ] **Step 1: Move "Last Sunday" and "Filter By Date" above search bar**
- [ ] **Step 2: Implement toggle behavior for search pills**
- [ ] **Step 3: Center "Quick Search" in idle state (in PublicCatalogResults.tsx)**

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/PublicCatalogControls.tsx src/components/ui/PublicCatalogResults.tsx
git commit -m "ui: update controls layout and pill toggle behavior"
```

---

### Task 5: UI - Desktop Floating Calendar with Highlights

**Files:**
- Modify: `src/components/ui/PublicCatalogControls.tsx`

- [ ] **Step 1: Add useQuery to fetch date counts**
- [ ] **Step 2: Update RangeCalendar to show orange dots and bold orange dates**
- [ ] **Step 3: Implement side-floating calendar for desktop**

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/PublicCatalogControls.tsx
git commit -m "ui: add calendar highlights and desktop floating layout"
```

---

### Task 6: UI - Cleanup Empty State

**Files:**
- Modify: `src/components/ui/PublicCatalogResults.tsx`

- [ ] **Step 1: Remove "Search Tumbler" from empty state**
- [ ] **Step 2: Commit**

```bash
git add src/components/ui/PublicCatalogResults.tsx
git commit -m "ui: remove search tumbler from empty state"
```

---

Plan complete and saved to `docs/superpowers/plans/2026-04-29-catalog-ui-enhancements.md`. Two execution options:

1. Subagent-Driven (recommended) - I dispatch a fresh subagent per task, review between tasks, fast iteration

2. Inline Execution - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
