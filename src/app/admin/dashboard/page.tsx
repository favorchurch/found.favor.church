import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { type Item } from "@/components/ui/ItemCard";
import { BadgeCheck, Inbox, Trash2, ArrowRightCircle, Search, PlusCircle, Globe } from "lucide-react";
import Link from "next/link";
import { ExportCSV } from "@/components/ui/ExportCSV";
import { SortSelector } from "@/components/ui/SortSelector";
import { AdminItemsView } from "@/components/ui/AdminItemsView";
import { Pagination } from "@/components/ui/Pagination";
import { PAGE_SIZE } from "@/utils/constants";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "Dashboard | Lost & Found — Favor Church",
  description: "Admin dashboard for managing lost and found items.",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const statusFilter = params.status || "all";
  const sortBy = params.sort || "created_at_desc";
  const page = Math.max(1, Number(params.page) || 1);

  const supabase = await createClient();

  // Fetch Stats
  const { data: statsData, error: statsError } = await supabase
    .from("found_items")
    .select("status, archived_at, is_public");

  if (statsError) {
    console.error("Stats fetch error:", statsError);
  }

  const total = statsData?.length || 0;
  const unclaimed = statsData?.filter(i => i.status === 'unclaimed' && !i.archived_at).length || 0;
  const claimed = statsData?.filter(i => i.status === 'claimed' && !i.archived_at).length || 0;
  const disposed = statsData?.filter(i => i.status === 'disposed' && !i.archived_at).length || 0;
  const archived = statsData?.filter(i => i.archived_at).length || 0;

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

  // Fetch Items with pagination
  let dbQuery = supabase
    .from("found_items")
    .select("*, category_name:found_item_categories(name), venue_name:found_item_venues(name)", { count: "exact" })
    .is("archived_at", null)
    .order(sortField, { ascending });

  if (query) {
    dbQuery = dbQuery.ilike("name", `%${query}%`);
  }

  if (statusFilter !== "all") {
    dbQuery = dbQuery.eq("status", statusFilter);
  }

  const from = (page - 1) * PAGE_SIZE;
  const { data: items, count, error: itemsError } = await dbQuery.range(from, from + PAGE_SIZE - 1);

  if (itemsError) {
    console.error("Items fetch error:", itemsError);
  }

  const totalFiltered = count ?? 0;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand uppercase font-sans">Items Management</h1>
          <p className="text-[10px] text-text-dim uppercase tracking-widest mt-1">Manage and track lost and found items</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/catalog"
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-sans font-bold uppercase tracking-widest border border-border-main bg-surface hover:bg-surface-hover hover:border-border-hover text-text-muted hover:text-text-main transition-all"
          >
            <Globe className="h-3.5 w-3.5" />
            Public Catalog
          </Link>
          <ExportCSV items={(items || []) as Item[]} />
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
        <StatCard label="Active Items" value={total - archived} color="text-brand" icon={<Inbox className="h-4 w-4" />} />
        <StatCard label="Waiting" value={unclaimed} color="text-yellow-500" icon={<ArrowRightCircle className="h-4 w-4" />} />
        <StatCard label="Resolved" value={claimed} color="text-emerald-500" icon={<BadgeCheck className="h-4 w-4" />} />
        <StatCard label="Disposed" value={disposed} color="text-red-500" icon={<Trash2 className="h-4 w-4" />} />
      </div>

      {/* Filters, Search & Sort */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-surface p-6 rounded-xl border border-border-main">
        <div className="flex flex-wrap items-center gap-3">
          <FilterButton active={statusFilter === 'all'} label="Everything" status="all" currentParams={params} />
          <FilterButton active={statusFilter === 'unclaimed'} label="Unclaimed" status="unclaimed" currentParams={params} />
          <FilterButton active={statusFilter === 'claimed'} label="Claimed" status="claimed" currentParams={params} />
          <FilterButton active={statusFilter === 'disposed'} label="Disposed" status="disposed" currentParams={params} />
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Search */}
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
          </form>

          {/* Sort */}
          <SortSelector defaultValue={sortBy} />
        </div>
      </div>

      {/* Items Section */}
      <ErrorBoundary>
        <AdminItemsView items={(items || []) as Item[]} />
      </ErrorBoundary>

      <Pagination total={totalFiltered} />
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

function FilterButton({ active, label, status, currentParams }: { active: boolean; label: string; status: string; currentParams: { q?: string; status?: string; sort?: string } }) {
  const params = new URLSearchParams(currentParams);
  params.set("status", status);
  params.delete("page");

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
      href={`?${params.toString()}`}
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
