import { createClient } from "@/utils/supabase/server";
import { ItemCard, type Item } from "@/components/ui/ItemCard";
import { BadgeCheck, Inbox, Trash2, ArrowRightCircle, Search, Download, SortAsc } from "lucide-react";
import Link from "next/link";
import { ExportCSV } from "@/components/ui/ExportCSV";
import { SortSelector } from "@/components/ui/SortSelector";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const statusFilter = params.status || "all";
  const sortBy = params.sort || "created_at_desc";

  const supabase = await createClient();

  // Fetch Stats
  const { data: statsData } = await supabase
    .from("found_items")
    .select("status, archived_at");

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

  // Fetch Items
  let dbQuery = supabase
    .from("found_items")
    .select("*")
    .is("archived_at", null)
    .order(sortField, { ascending });

  if (query) {
    dbQuery = dbQuery.ilike("name", `%${query}%`);
  }

  if (statusFilter !== "all") {
    dbQuery = dbQuery.eq("status", statusFilter);
  }

  const { data: items } = await dbQuery;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand uppercase font-mono">Management Console</h1>
          <p className="text-[10px] text-text-dim uppercase tracking-widest mt-1">Admin Dashboard for Lost & Found items</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportCSV items={(items || []) as Item[]} />
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
              className="w-full rounded-lg border border-border-hover bg-bg px-10 py-2.5 text-[11px] font-mono text-text-main focus:border-brand focus:outline-none placeholder:text-text-dim/50"
            />
            {statusFilter !== 'all' && <input type="hidden" name="status" value={statusFilter} />}
          </form>

          {/* Sort */}
          <SortSelector defaultValue={sortBy} />
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items && items.length > 0 ? (
          items.map((item) => (
            <Link key={item.id} href={`/admin/items/${item.id}`}>
              <ItemCard item={item as Item} admin />
            </Link>
          ))
        ) : (
          <div className="col-span-full h-80 flex flex-col items-center justify-center rounded-xl border border-dashed border-border-main text-center bg-surface/30">
            <Inbox className="h-12 w-12 text-text-dim mb-4 opacity-20" />
            <p className="text-text-dim text-sm font-mono uppercase tracking-widest">No entries match your search</p>
            <Link href="/admin/dashboard" className="mt-4 text-[10px] text-brand border border-brand/20 px-3 py-1.5 rounded hover:bg-brand/10 transition-colors uppercase font-mono tracking-widest">Clear Filters</Link>
          </div>
        )}
      </div>

      {/* Archive Section */}
      <div className="p-8 rounded-xl border border-red-500/10 bg-red-500/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-sm font-bold text-text-main uppercase font-mono tracking-widest">Data Maintenance</h3>
          <p className="text-[10px] text-text-muted mt-1 uppercase tracking-tighter font-mono flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-red-500 animate-pulse" />
            Auto-Archive records older than 30 days (Claimed items only)
          </p>
        </div>
        <form action="/admin/actions/archive" method="POST">
          <button className="px-6 py-2.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-500 text-[11px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10">
            Run Archival Sequence
          </button>
        </form>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border-main p-6 rounded-xl flex items-start justify-between group hover:border-border-hover transition-colors">
      <div>
        <p className="font-mono text-[9px] text-text-dim uppercase tracking-[0.2em]">{label}</p>
        <p className={`text-3xl font-bold mt-2 font-mono ${color}`}>{value}</p>
      </div>
      <div className={`p-3 rounded-lg bg-surface-active border border-border-hover group-hover:scale-110 transition-transform ${color}`}>
        {icon}
      </div>
    </div>
  );
}

function FilterButton({ active, label, status, currentParams }: { active: boolean; label: string; status: string; currentParams: any }) {
  const params = new URLSearchParams(currentParams);
  params.set("status", status);
  
  return (
    <Link
      href={`?${params.toString()}`}
      className={`px-4 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-all border ${
        active 
          ? "bg-brand/10 border-brand/40 text-brand shadow-lg shadow-brand/5" 
          : "text-text-dim border-border-hover/50 hover:bg-surface-hover hover:text-text-muted hover:border-border-hover"
      }`}
    >
      {label}
    </Link>
  );
}
