import { MapPin, Calendar } from "lucide-react";
import { cn } from "@/utils/cn";
import { format } from "date-fns";

interface PublicItem {
  id: string;
  name: string;
  item_code: string;
  category: string;
  location: string | null;
  date_found: string;
}

interface PublicItemCardProps {
  item: PublicItem;
  className?: string;
}

const categoryLabels: Record<string, string> = {
  cash_wallet: "Cash & Wallet",
  clothing: "Clothing, Apparel & Accessories",
  documents_books: "Documents, Notebooks & Books",
  electronics: "Electronics & Gadget Accessories",
  jewelry: "Jewelry",
  tumblers_bottles: "Tumblers & Water Bottles",
  others: "Others",
};

export function PublicItemCard({ item, className }: PublicItemCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-border-main transition-all duration-300 hover:border-border-hover/80 bg-surface/50",
        className
      )}
    >
      <div className="flex flex-col p-4 flex-1">
        <h3 className="line-clamp-1 text-sm font-semibold text-text-main opacity-90 pr-2">
          {item.name}
        </h3>

        <div className="mt-3 flex flex-col gap-2">
          <div>
            <span className="text-[10px] font-sans uppercase tracking-widest text-text-dim block mb-1">
              Claim Reference
            </span>
            <span className="inline-flex items-center rounded-lg bg-surface-active px-2.5 py-1 font-sans text-xs font-bold tracking-wider text-brand">
              {item.item_code}
            </span>
          </div>

          <div>
            <span className="inline-flex items-center rounded-lg border border-border-main bg-surface px-2.5 py-1 text-[10px] font-medium text-text-muted">
              {categoryLabels[item.category] || "Others"}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-row items-center justify-between gap-2 border-t border-border-main/50 pt-3 text-[10px] text-text-dim uppercase tracking-tight font-medium">
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="h-3 w-3 shrink-0 opacity-60" />
            {item.location ? (
              <span className="truncate">{item.location}</span>
            ) : (
              <span className="italic opacity-50">No location</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0 opacity-80">
            <Calendar className="h-3 w-3 opacity-60" />
            <span>{format(new Date(item.date_found), "MMM d, yyyy")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}