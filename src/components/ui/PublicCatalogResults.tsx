import { CalendarDays, Loader2, Search, Sparkles, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PublicItemCard } from "@/components/ui/PublicItemCard";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { PAGE_SIZE } from "@/utils/constants";
import { Pagination } from "@/components/ui/Pagination";
import { cn } from "@/utils/cn";

const SUGGESTED_SEARCHES = [
  "Cellphone",
  "Tumbler",
  "Umbrella",
  "Wallet",
  "Keys",
  "Jacket",
];

interface VenueRow {
  slug: string;
  name: string;
  parent_slug: string | null;
  display_order: number | null;
}

interface PublicItem {
  id: string;
  name: string;
  description: string | null;
  item_code: string;
  category: string;
  category_name?: { name: string } | null;
  venue: string | null;
  venue_name?: {
    name: string;
    parent_slug: string | null;
    parent?: { name: string } | null;
  } | null;
  location: string | null;
  date_found: string;
}

interface PublicCatalogResultsProps {
  initialItems: PublicItem[];
  initialTotal: number;
  idle: boolean;
  venues: VenueRow[];
  searchParams: {
    q: string;
    venue: string;
    from: string;
    to: string;
    page: number;
    status: string;
  };
}

interface PublicCatalogSearchRow extends PublicItem {
  total_count: number | string;
}

function expandVenueFilter(venues: VenueRow[], slug: string): string[] {
  const target = venues.find((v) => v.slug === slug);
  if (!target) return [slug];
  if (target.parent_slug) return [slug];
  const children = venues
    .filter((v) => v.parent_slug === slug)
    .map((v) => v.slug);
  return [slug, ...children];
}

export function PublicCatalogResults({
  initialItems,
  initialTotal,
  idle,
  venues,
  searchParams: serverParams,
}: PublicCatalogResultsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // We use the serverParams as the baseline, but the query key ensures
  // we refetch when they change. Using initialData ensures SEO and fast first paint.
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: [
      "public-catalog",
      serverParams.q,
      serverParams.venue,
      serverParams.from,
      serverParams.to,
      serverParams.page,
      serverParams.status,
    ],
    queryFn: async () => {
      const supabase = createClient();
      const venueSlugs =
        serverParams.venue === "all"
          ? null
          : expandVenueFilter(venues, serverParams.venue);

      const from = (serverParams.page - 1) * PAGE_SIZE;

      const { data: rows, error } = await supabase.rpc(
        "search_public_catalog_items",
        {
          p_query: serverParams.q,
          p_status: serverParams.status,
          p_venues: venueSlugs,
          p_date_from: serverParams.from || null,
          p_date_to: serverParams.to || null,
          p_limit: PAGE_SIZE,
          p_offset: from,
        },
      );

      if (error) throw error;

      const searchRows = (rows || []) as unknown as PublicCatalogSearchRow[];
      return {
        items: searchRows,
        total: Number(searchRows[0]?.total_count ?? 0),
      };
    },
    initialData: {
      items: initialItems,
      total: initialTotal,
    },
    enabled: !idle,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const searchFor = (term: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("q", term);
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const clearFilters = () => {
    router.replace(pathname, { scroll: false });
  };

  const clearVenue = () => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("venue");
    next.delete("page");
    const queryString = next.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  };

  const clearDate = () => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("from");
    next.delete("to");
    next.delete("page");
    const queryString = next.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  };

  if (idle) {
    return (
      <div className="rounded-3xl border border-dashed border-border-main bg-white px-5 py-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand/10">
          <Sparkles className="h-6 w-6 text-brand" />
        </div>
        <h3 className="text-base font-bold text-text-main">
          Start with what you remember
        </h3>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-text-muted">
          Search a common item, choose the date you lost it, or narrow by
          venue. Photos stay private so our team can confirm ownership in
          person.
        </p>
        <div className="mt-5 flex max-w-xl flex-wrap justify-center gap-2">
          {SUGGESTED_SEARCHES.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => searchFor(term)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border-main bg-surface px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-widest text-text-muted transition-all hover:border-brand/40 hover:bg-brand/10 hover:text-brand focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <Search className="h-3 w-3" />
              {term}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-dashed border-red-200 bg-red-50 px-5 py-12 text-center">
        <h3 className="text-base font-bold text-red-800">
          Error loading catalog
        </h3>
        <p className="mt-2 text-sm text-red-600">
          Please try again or contact support if the issue persists.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-full bg-red-100 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-red-700 hover:bg-red-200"
        >
          Reload page
        </button>
      </div>
    );
  }

  if (items.length === 0 && !isLoading) {
    return (
      <div className="rounded-3xl border border-dashed border-border-main bg-white px-5 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-hover">
          <Search className="h-6 w-6 text-text-dim" />
        </div>
        <h3 className="text-base font-bold text-text-main">No items found</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-muted">
          Try a broader item name, clear the venue, or expand the date range.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {searchParams.get("venue") && (
            <button
              type="button"
              onClick={clearVenue}
              className="inline-flex items-center gap-1.5 rounded-full border border-border-main bg-surface px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-widest text-text-muted transition-all hover:border-brand/40 hover:bg-brand/10 hover:text-brand"
            >
              <X className="h-3 w-3" />
              Clear venue
            </button>
          )}
          {(searchParams.get("from") || searchParams.get("to")) && (
            <button
              type="button"
              onClick={clearDate}
              className="inline-flex items-center gap-1.5 rounded-full border border-border-main bg-surface px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-widest text-text-muted transition-all hover:border-brand/40 hover:bg-brand/10 hover:text-brand"
            >
              <CalendarDays className="h-3 w-3" />
              Clear date
            </button>
          )}
          <button
            type="button"
            onClick={() => searchFor("Tumbler")}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand/10 px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-widest text-brand transition-all hover:bg-brand/15"
          >
            <Search className="h-3 w-3" />
            Search tumbler
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 rounded-full border border-border-main bg-surface px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-widest text-text-muted transition-all hover:border-border-hover hover:text-text-main"
          >
            Start over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-sm font-bold text-text-main">
              {total === 1 ? "1 possible match" : `${total} possible matches`}
            </h2>
            <p className="text-xs text-text-dim">
              Show the claim reference at the information desk.
            </p>
          </div>
          {isFetching && (
            <Loader2 className="h-4 w-4 animate-spin text-brand" />
          )}
        </div>
      </div>

      <div
        className={cn(
          "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 transition-opacity duration-200",
          isFetching && items.length > 0 ? "opacity-60" : "opacity-100",
        )}
      >
        {items.map((item) => (
          <PublicItemCard key={item.id} item={item} />
        ))}
      </div>

      {!idle && total > 0 && (
        <div className="pt-4">
          <Pagination total={total} />
        </div>
      )}
    </div>
  );
}
