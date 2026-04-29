"use client";

import { Search, Sparkles } from "lucide-react";
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
}

export function PublicCatalogResults({
  items,
  idle,
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

  if (idle) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-main px-5 py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-hover">
          <Sparkles className="h-6 w-6 text-text-dim" />
        </div>
        <h3 className="text-sm font-medium text-text-muted">
          Try a quick search
        </h3>
        <p className="mt-1 max-w-sm text-xs text-text-dim">
          Start with one of the most common lost items, or type your own search
          above.
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
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-main py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-hover">
          <Search className="h-6 w-6 text-text-dim" />
        </div>
        <h3 className="text-sm font-medium text-text-muted">
          No items found
        </h3>
        <p className="mt-1 text-xs text-text-dim">
          Try adjusting your search, date range, or venue filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <PublicItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
