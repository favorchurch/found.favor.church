import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { type Item } from "@/components/ui/ItemCard";
import { BadgeCheck, Inbox, Trash2, ArrowRightCircle, Search, PlusCircle, MapPin } from "lucide-react";
import Link from "next/link";
import { ExportCSV } from "@/components/ui/ExportCSV";
import { SortSelector } from "@/components/ui/SortSelector";
import { AdminItemsView } from "@/components/ui/AdminItemsView";
import { Pagination } from "@/components/ui/Pagination";
import { PAGE_SIZE } from "@/utils/constants";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AdminCatalogSidebar } from "@/components/ui/AdminCatalogSidebar";

export const metadata: Metadata = {
  title: "Dashboard | Lost & Found — Favor Church",
  description: "Admin dashboard for managing lost and found items.",
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

interface VenueRow {
  slug: string;
  name: string;
  parent_slug: string | null;
  display_order: number | null;
}

function expandVenueFilter(venues: VenueRow[], slug: string): string[] {
  const target = venues.find((v) => v.slug === slug);
  if (!target) return [slug];
  if (target.parent_slug) return [slug];
  const children = venues.filter((v) => v.parent_slug === slug).map((v) => v.slug);
  return [slug, ...children];
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string; page?: string; from?: string; to?: string; venue?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const statusFilter = params.status || "all";
  const sortBy = params.sort || "created_at_desc";
  const page = Math.max(1, Number(params.page) || 1);
  const dateFrom = ISO_DATE.test(params.from || "") ? params.from! : "";
  const dateTo = ISO_DATE.test(params.to || "") ? params.to! : "";
  const venueFilter = params.venue || "all";

  const supabase = await createClient();

  const [
    activeCountResult,
    unclaimedCountResult,
    claimedCountResult,
    disposedCountResult,
    venuesResult,
  ] = await Promise.all([
    supabase
      .from("found_items")
      .select("*", { count: "exact", head: true })
      .is("archived_at", null),
    supabase
      .from("found_items")
      .select("*", { count: "exact", head: true })
      .is("archived_at", null)
      .eq("status", "unclaimed"),
    supabase
      .from("found_items")
      .select("*", { count: "exact", head: true })
      .is("archived_at", null)
      .eq("status", "claimed"),
    supabase
      .from("found_items")
      .select("*", { count: "exact", head: true })
      .is("archived_at", null)
      .eq("status", "disposed"),
    supabase
      .from("found_item_venues")
      .select("slug, name, parent_slug, display_order")
      .order("display_order")
      .order("name"),
  ]);

  const statsError =
    activeCountResult.error ||
    unclaimedCountResult.error ||
    claimedCountResult.error ||
    disposedCountResult.error;

  if (statsError) {
    console.error("Stats fetch error:", statsError);
  }

  const active = activeCountResult.count ?? 0;
  const unclaimed = unclaimedCountResult.count ?? 0;
  const claimed = claimedCountResult.count ?? 0;
  const disposed = disposedCountResult.count ?? 0;
  const allVenues = (venuesResult.data || []) as VenueRow[];
  const topLevelVenues = allVenues.filter((v) => !v.parent_slug);

  // Sorting logic
  let sortField = "created_at";
  let ascending = false;

  switch (sortBy) {
    case "created_at_asc":
      sortField = "created_at";
      ascending = true;
      break;
    case "name_asc":
      sortField = "name";
      ascending = true;
      break;
    case "name_desc":
      sortField = "name";
      ascending = false;
      break;
    case "date_found_desc":
      sortField = "date_found";
      ascending = false;
      break;
    case "date_found_asc":
      sortField = "date_found";
      ascending = true;
      break;
    default:
      sortField = "created_at";
      ascending = false;
  }

  // Fetch items with pagination
  let dbQuery = supabase
    .from("found_items")
    .select(
      "id, name, description, date_found, location, venue, status, photo_path, is_public, item_code, category, created_at, created_by_email, claimed_date, claimed_by, disposed_date, disposed_by, category_name:found_item_categories(name), venue_name:found_item_venues(name)",
      { count: "exact" },
    )
    .is("archived_at", null)
    .order(sortField, { ascending });

  if (query) {
    dbQuery = dbQuery.ilike("name", `%${query}%`);
  }

  if (statusFilter !== "all") {
    dbQuery = dbQuery.eq("status", statusFilter);
  }

  if (dateFrom) {
    dbQuery = dbQuery.gte("date_found", dateFrom);
  }

  if (dateTo) {
    dbQuery = dbQuery.lte("date_found", dateTo);
  }

  if (venueFilter !== "all") {
    const venueSlugs = expandVenueFilter(allVenues, venueFilter);
    if (venueSlugs.length === 1) {
      dbQuery = dbQuery.eq("venue", venueSlugs[0]);
    } else {
      dbQuery = dbQuery.in("venue", venueSlugs);
    }
  }

  const fromOffset = (page - 1) * PAGE_SIZE;
  const { data: items, count, error: itemsError } = await dbQuery.range(fromOffset, fromOffset + PAGE_SIZE - 1);

  if (itemsError) {
    console.error("Items fetch error:", itemsError);
  }

  const totalFiltered = count ?? 0;
  const dashboardItems = (items || []) as unknown as Item[];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand uppercase font-sans">Items Management</h1>
          <p className="text-[10px] text-text-dim uppercase tracking-widest mt-1">Manage and track lost and found items</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportCSV items={dashboardItems} />
          <Link
            href="/admin/items/new"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-brand text-white hover:bg-brand-dim transition-all shadow-sm shadow-brand/20"
          >
            <PlusCircle className="h-4 w-4" />
            New Entry
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Items" value={active} color="text-brand" icon={<Inbox className="h-4 w-4" />} />
        <StatCard label="Waiting" value={unclaimed} color="text-yellow-500" icon={<ArrowRightCircle className="h-4 w-4" />} />
        <StatCard label="Resolved" value={claimed} color="text-emerald-500" icon={<BadgeCheck className="h-4 w-4" />} />
        <StatCard label="Disposed" value={disposed} color="text-red-500" icon={<Trash2 className="h-4 w-4" />} />
      </div>

      {/* Sidebar + Main content */}
      <div className="lg:grid lg:grid-cols-[320px_1fr] lg:items-start lg:gap-8">
        <aside className="sticky top-20 hidden lg:block">
          <AdminCatalogSidebar initialDateFrom={dateFrom} initialDateTo={dateTo} />
        </aside>

        <div className="space-y-6">
          {/* Filters, Search & Sort */}
          <div className="flex flex-col gap-5 bg-surface p-6 rounded-xl border border-border-main">
            {/* Status filters */}
            <div className="flex flex-wrap items-center gap-3">
              <FilterButton active={statusFilter === 'all'} label="Everything" status="all" currentParams={params} />
              <FilterButton active={statusFilter === 'unclaimed'} label="Unclaimed" status="unclaimed" currentParams={params} />
              <FilterButton active={statusFilter === 'claimed'} label="Claimed" status="claimed" currentParams={params} />
              <FilterButton active={statusFilter === 'disposed'} label="Disposed" status="disposed" currentParams={params} />
            </div>

            {/* Venue filter */}
            {allVenues.length > 0 && (
              <div className="border-t border-border-main pt-4">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-sans font-bold uppercase tracking-widest text-text-dim">
                  <MapPin className="h-3.5 w-3.5" />
                  Venue
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <VenueFilterChip label="All venues" active={venueFilter === "all"} slug="all" currentParams={params} />
                  {topLevelVenues.map((venue) => (
                    <VenueFilterChip
                      key={venue.slug}
                      label={venue.name}
                      active={venueFilter === venue.slug}
                      slug={venue.slug}
                      currentParams={params}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Search & Sort */}
            <div className="flex flex-col md:flex-row items-center gap-4 border-t border-border-main pt-4">
              <form className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
                <input
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder="Search by name..."
                  className="w-full rounded-lg border border-border-hover bg-bg px-10 py-2.5 text-[11px] font-sans text-text-main focus:border-brand focus:outline-none placeholder:text-text-dim/50"
                />
                {statusFilter !== 'all' && <input type="hidden" name="status" value={statusFilter} />}
                {venueFilter !== 'all' && <input type="hidden" name="venue" value={venueFilter} />}
                {dateFrom && <input type="hidden" name="from" value={dateFrom} />}
                {dateTo && <input type="hidden" name="to" value={dateTo} />}
              </form>

              <SortSelector defaultValue={sortBy} />
            </div>
          </div>

          {/* Items Section */}
          <ErrorBoundary>
            <AdminItemsView items={dashboardItems} />
          </ErrorBoundary>

          <Pagination total={totalFiltered} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border-main p-6 rounded-xl flex items-start justify-between group hover:border-border-hover transition-colors">
      <div>
        <p className="font-sans text-[9px] text-text-dim uppercase tracking-[0.2em]">{label}</p>
        <p className={`text-3xl font-bold mt-2 font-sans ${color}`}>{value}</p>
      </div>
      <div className={`p-3 rounded-lg bg-surface-active border border-border-hover group-hover:scale-110 transition-transform ${color}`}>
        {icon}
      </div>
    </div>
  );
}

function FilterButton({ active, label, status, currentParams }: { active: boolean; label: string; status: string; currentParams: { q?: string; status?: string; sort?: string; from?: string; to?: string; venue?: string } }) {
  const p = new URLSearchParams();
  if (currentParams.q) p.set("q", currentParams.q);
  if (currentParams.sort) p.set("sort", currentParams.sort);
  if (currentParams.from) p.set("from", currentParams.from);
  if (currentParams.to) p.set("to", currentParams.to);
  if (currentParams.venue) p.set("venue", currentParams.venue);
  p.set("status", status);

  const getActiveStyles = (status: string) => {
    switch (status) {
      case "unclaimed": return "bg-yellow-500/10 border-yellow-500/40 text-yellow-500";
      case "claimed": return "bg-emerald-500/10 border-emerald-500/40 text-emerald-500";
      case "disposed": return "bg-red-500/10 border-red-500/40 text-red-500";
      default: return "bg-brand/10 border-brand/40 text-brand";
    }
  };

  return (
    <Link
      href={`?${p.toString()}`}
      className={`px-4 py-2 rounded-lg text-[10px] font-sans font-bold uppercase tracking-widest transition-all border ${
        active
          ? `${getActiveStyles(status)} shadow-lg shadow-black/5`
          : "text-text-dim border-border-hover/50 hover:bg-surface-hover hover:text-text-muted hover:border-border-hover"
      }`}
    >
      {label}
    </Link>
  );
}

function VenueFilterChip({ label, active, slug, currentParams }: { label: string; active: boolean; slug: string; currentParams: { q?: string; status?: string; sort?: string; from?: string; to?: string; venue?: string } }) {
  const p = new URLSearchParams();
  if (currentParams.q) p.set("q", currentParams.q);
  if (currentParams.status) p.set("status", currentParams.status);
  if (currentParams.sort) p.set("sort", currentParams.sort);
  if (currentParams.from) p.set("from", currentParams.from);
  if (currentParams.to) p.set("to", currentParams.to);
  if (slug !== "all") p.set("venue", slug);

  return (
    <Link
      href={`?${p.toString()}`}
      className={`px-4 py-2 rounded-full text-[10px] font-sans font-bold uppercase tracking-widest transition-all border ${
        active
          ? "bg-brand/10 border-brand/40 text-brand shadow-lg shadow-black/5"
          : "text-text-dim border-border-hover/50 hover:bg-surface-hover hover:text-text-muted hover:border-border-hover"
      }`}
    >
      {label}
    </Link>
  );
}
