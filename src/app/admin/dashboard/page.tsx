import { createClient } from "@/utils/supabase/server";
import { ItemCard, type Item } from "@/components/ui/ItemCard";
import { BadgeCheck, Inbox, Trash2, ArrowRightCircle, Search, LogOut, LayoutDashboard, PlusCircle, Globe } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const statusFilter = params.status || "all";

  const supabase = await createClient();

  // Fetch Stats
  const { data: statsData } = await supabase
    .from("items")
    .select("status, archived_at");

  const total = statsData?.length || 0;
  const unclaimed = statsData?.filter(i => i.status === 'unclaimed' && !i.archived_at).length || 0;
  const claimed = statsData?.filter(i => i.status === 'claimed' && !i.archived_at).length || 0;
  const disposed = statsData?.filter(i => i.status === 'disposed' && !i.archived_at).length || 0;
  const archived = statsData?.filter(i => i.archived_at).length || 0;

  // Fetch Items
  let dbQuery = supabase
    .from("items")
    .select("*")
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (query) {
    dbQuery = dbQuery.ilike("name", `%${query}%`);
  }

  if (statusFilter !== "all") {
    dbQuery = dbQuery.eq("status", statusFilter);
  }

  const { data: items } = await dbQuery;

  return (
    <div className="p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-main">Management Dashboard</h1>
          <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-brand bg-brand/10 border border-brand/20">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link href="/admin/items/new" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-text-muted hover:bg-surface-hover hover:text-text-main transition-colors">
            <PlusCircle className="h-4 w-4" />
            Add New Item
          </Link>
          <Link href="/catalog" target="_blank" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-text-muted hover:bg-surface-hover hover:text-text-main transition-colors">
            <Globe className="h-4 w-4" />
            View Public Catalog
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Active" value={total - archived} color="text-text-main" icon={<Inbox className="h-4 w-4" />} />
        <StatCard label="Unclaimed" value={unclaimed} color="text-yellow-500" icon={<ArrowRightCircle className="h-4 w-4" />} />
        <StatCard label="Claimed" value={claimed} color="text-emerald-500" icon={<BadgeCheck className="h-4 w-4" />} />
        <StatCard label="Disposed" value={disposed} color="text-red-500" icon={<Trash2 className="h-4 w-4" />} />
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-4 rounded-xl border border-border-main">
        <div className="flex items-center gap-2">
          <FilterButton active={statusFilter === 'all'} label="All Items" href="/admin/dashboard?status=all" />
          <FilterButton active={statusFilter === 'unclaimed'} label="Unclaimed" href="/admin/dashboard?status=unclaimed" />
          <FilterButton active={statusFilter === 'claimed'} label="Claimed" href="/admin/dashboard?status=claimed" />
          <FilterButton active={statusFilter === 'disposed'} label="Disposed" href="/admin/dashboard?status=disposed" />
        </div>
        
        <form className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search items..."
            className="w-full rounded-lg border border-border-hover bg-bg px-10 py-2 text-xs text-text-main focus:border-brand focus:outline-none"
          />
        </form>
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
          <div className="col-span-full h-64 flex flex-col items-center justify-center rounded-xl border border-dashed border-border-main text-center">
            <p className="text-text-dim text-sm">No items found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Archive Section (Approved as Manual) */}
      <div className="mt-12 p-6 rounded-xl border border-red-500/10 bg-red-500/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-sm font-semibold text-text-main">Archive Old Records</h3>
          <p className="text-xs text-text-muted mt-1 uppercase tracking-tighter font-mono">Archive items marked as &apos;Claimed&apos; and older than 30 days.</p>
        </div>
        <form action="/admin/actions/archive" method="POST">
          <button className="px-6 py-2.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-500 text-sm font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all">
            Run Archival Now
          </button>
        </form>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border-main p-4 rounded-xl flex items-start justify-between">
      <div>
        <p className="font-mono text-[10px] text-text-dim uppercase tracking-widest">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      </div>
      <div className={`p-2 rounded-lg bg-surface-active border border-border-hover ${color}`}>
        {icon}
      </div>
    </div>
  );
}

function FilterButton({ active, label, href }: { active: boolean; label: string; href: string }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-widest transition-all border ${
        active 
          ? "bg-brand/10 border-brand/40 text-brand" 
          : "text-text-dim border-transparent hover:bg-surface-hover hover:text-text-muted"
      }`}
    >
      {label}
    </Link>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}
