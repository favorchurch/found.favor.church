import { Calendar, MapPin } from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils/cn";
import { format } from "date-fns";
import { getPublicItemLocation } from "@/utils/publicCatalogItem";

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

interface PublicItemCardProps {
  item: PublicItem;
  className?: string;
}

export function PublicItemCard({ item, className }: PublicItemCardProps) {
  const fullLocation = getPublicItemLocation(item);

  return (
    <Link
      href={`/catalog/items/${item.id}`}
      scroll={false}
      className={cn(
        "group relative flex min-h-[230px] flex-col overflow-hidden rounded-2xl border border-border-main bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lg hover:shadow-brand/5 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:ring-offset-2",
        className,
      )}
    >
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex items-center rounded-full border border-border-main bg-surface px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-text-muted">
              {item.category_name?.name || "Others"}
            </span>
            <h3 className="mt-3 line-clamp-2 text-lg font-black leading-tight text-text-main">
              {item.name}
            </h3>
          </div>
        </div>

        {item.description && (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-text-muted">
            {item.description}
          </p>
        )}

        <div className="mt-auto space-y-3 pt-5">
          <div className="grid gap-2 text-[11px] font-medium uppercase tracking-tight text-text-dim">
            <div className="flex min-w-0 items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0 opacity-60" />
              <span>{format(new Date(item.date_found), "MMM d, yyyy")}</span>
            </div>
            <div className="flex min-w-0 items-center gap-1.5">
              <MapPin className="h-3 w-3 shrink-0 opacity-60" />
              {fullLocation ? (
                <span className="truncate">{fullLocation}</span>
              ) : (
                <span className="italic opacity-50">No location</span>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-brand/10 px-3 py-2">
            <span className="block text-[9px] font-sans font-black uppercase tracking-widest text-brand/80">
              Code
            </span>
            <span className="block font-sans text-sm font-black tracking-wide text-brand">
              {item.item_code}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
