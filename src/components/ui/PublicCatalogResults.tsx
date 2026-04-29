"use client";

import { CalendarDays, Search, Sparkles, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PublicItemCard } from "@/components/ui/PublicItemCard";

const SUGGESTED_SEARCHES = [
  "Cellphone",
  "Tumbler",
  "Umbrella",
  "Wallet",
  "Keys",
  "Jacket",
];

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
  items: PublicItem[];
  idle: boolean;
  total: number;
}

export function PublicCatalogResults({
  items,
  idle,
  total,
}: PublicCatalogResultsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  if (items.length === 0) {
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
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-text-main">
            {total === 1 ? "1 possible match" : `${total} possible matches`}
          </h2>
          <p className="text-xs text-text-dim">
            Show the claim reference at the information desk.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <PublicItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
