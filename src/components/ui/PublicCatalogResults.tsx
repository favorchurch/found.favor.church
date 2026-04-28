"use client";

import { Search, Sparkles } from "lucide-react";
import { PublicItemCard } from "@/components/ui/PublicItemCard";

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
  if (idle) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-main py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-hover">
          <Sparkles className="h-6 w-6 text-text-dim" />
        </div>
        <h3 className="text-sm font-medium text-text-muted">
          Search to begin
        </h3>
        <p className="mt-1 max-w-sm text-xs text-text-dim">
          Type the name of your lost item, or pick a date range from the
          calendar above to see what was surrendered then.
        </p>
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
