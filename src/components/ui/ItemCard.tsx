import { Calendar, MapPin, CameraOff } from "lucide-react";
import { format } from "date-fns";
import { StatusBadge, type ItemStatus } from "./StatusBadge";
import { cn } from "@/utils/cn";

export interface Item {
  id: string;
  name: string;
  description: string | null;
  date_found: string;
  location: string | null;
  status: ItemStatus;
  photo_path: string | null;
  is_public: boolean;
  created_at: string;
}

interface ItemCardProps {
  item: Item;
  onClick?: (item: Item) => void;
  className?: string;
  admin?: boolean;
}

export function ItemCard({ item, onClick, className, admin = false }: ItemCardProps) {
  const getPhotoUrl = (path: string | null) => {
    if (!path) return null;
    // Assuming bucket name is 'item-images'
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/item-images/${path}`;
  };

  const photoUrl = getPhotoUrl(item.photo_path);

  return (
    <div
      onClick={() => onClick?.(item)}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border border-border-main bg-surface transition-all hover:border-border-hover/80 hover:translate-y-[-2px] cursor-pointer",
        item.status === 'unclaimed' && "border-l-4 border-l-yellow-500",
        item.status === 'claimed' && "border-l-4 border-l-emerald-500",
        item.status === 'disposed' && "border-l-4 border-l-red-500",
        className
      )}
    >
      {/* Image Section */}
      <div className="aspect-[16/10] w-full overflow-hidden bg-surface-hover flex items-center justify-center relative">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-text-dim opacity-40">
            <CameraOff className="h-8 w-8" />
            <span className="font-mono text-[10px] uppercase">No photo attached</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-col p-4 flex-1">
        <h3 className="line-clamp-1 text-sm font-semibold text-text-main group-hover:text-brand transition-colors">
          {item.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-text-muted">
          {item.description || "No description provided."}
        </p>

        <div className="mt-4 flex flex-col gap-1.5 border-t border-border-main/50 pt-3">
          <div className="flex items-center gap-2 font-mono text-[10px] text-text-dim">
            <Calendar className="h-3 w-3" />
            {format(new Date(item.date_found), 'MMM dd, yyyy')}
          </div>
          {item.location && (
            <div className="flex items-center gap-2 font-mono text-[10px] text-text-dim">
              <MapPin className="h-3 w-3" />
              {item.location}
            </div>
          )}
        </div>

        <div className="mt-auto pt-3 flex items-center justify-between">
          <StatusBadge status={item.status} />
          {admin && !item.is_public && (
            <span className="text-[10px] font-mono text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 uppercase">
              Internal Only
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
