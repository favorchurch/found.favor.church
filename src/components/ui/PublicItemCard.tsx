import { MapPin } from "lucide-react";
import { cn } from "@/utils/cn";

interface PublicItem {
  id: string;
  name: string;
  item_code: string;
  category: string;
  location: string | null;
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
            <span className="text-[10px] font-mono uppercase tracking-widest text-text-dim block mb-1">
              Claim Reference
            </span>
            <span className="inline-flex items-center rounded-lg bg-surface-active px-2.5 py-1 font-mono text-xs font-bold tracking-wider text-brand">
              {item.item_code}
            </span>
          </div>

          <div>
            <span className="inline-flex items-center rounded-lg border border-border-main bg-surface px-2.5 py-1 text-[10px] font-medium text-text-muted">
              {categoryLabels[item.category] || "Others"}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-row items-center gap-2 border-t border-border-main/50 pt-3 text-xs text-text-muted">
          {item.location ? (
            <>
              <MapPin className="h-3.5 w-3.5 text-text-dim" />
              <span className="line-clamp-1">{item.location}</span>
            </>
          ) : (
            <span className="italic text-text-dim">Location not recorded</span>
          )}
        </div>
      </div>
    </div>
  );
}