import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { type Item } from "@/components/ui/ItemCard";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
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

export const metadata: Metadata = {
  title: "Dashboard | Lost & Found — Favor Church",
  description: "Admin dashboard for managing lost and found items.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

        <p className="text-[11px] font-sans text-text-dim uppercase tracking-widest -mt-4">
          {totalFiltered} item{totalFiltered !== 1 ? "s" : ""}
          {dateFrom || dateTo
            ? ` · ${
                dateFrom && dateTo
                  ? dateFrom === dateTo
                    ? format(parseISO(dateFrom), "MMM d, yyyy")
                    : `${format(parseISO(dateFrom), "MMM d")} – ${format(parseISO(dateTo), "MMM d, yyyy")}`
                  : dateFrom
                    ? `From ${format(parseISO(dateFrom), "MMM d, yyyy")}`
                    : `Until ${format(parseISO(dateTo), "MMM d, yyyy")}`
              }`
            : ""}
          {statusFilter !== "all" ? ` · ${statusFilter}` : ""}
        </p>

        <ErrorBoundary>
          <AdminItemsView items={dashboardItems} />
        </ErrorBoundary>

        <Pagination total={totalFiltered} />
      </div>
    </div>
  );
}

interface AdminCatalogSearchRow extends Item {
  total_count: number | string;
}
