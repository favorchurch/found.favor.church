"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar, MapPin, CameraOff, ChevronRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { type Item } from "./ItemCard";
import { StatusBadge } from "./StatusBadge";
import { toast } from "sonner";
import { cn } from "@/utils/cn";
import { getPhotoUrl } from "@/utils/photo";
import { upsertItem } from "@/app/admin/actions/items";

interface AdminItemsTableProps {
  items: Item[];
}

export function AdminItemsTable({ items }: AdminItemsTableProps) {
  const [privacyCache, setPrivacyCache] = useState<Record<string, boolean>>({});

  const isPublic = (item: Item) =>
    privacyCache[item.id] ?? item.is_public;

  const togglePrivacy = async (item: Item) => {
    const next = !isPublic(item);
    setPrivacyCache((prev) => ({ ...prev, [item.id]: next }));
    try {
      await upsertItem({
        ...item,
        is_public: next,
      });
      toast.success(next ? "Item is now public" : "Item is now private");
    } catch {
      setPrivacyCache((prev) => ({ ...prev, [item.id]: !next }));
      toast.error("Failed to update privacy");
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border-main bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border-main bg-surface-active/50">
              <th className="px-4 py-4 font-sans text-[10px] uppercase tracking-widest text-text-dim w-12"></th>
              <th className="px-6 py-4 font-sans text-[10px] uppercase tracking-widest text-text-dim">Item</th>
              <th className="px-6 py-4 font-sans text-[10px] uppercase tracking-widest text-text-dim">Code</th>
              <th className="px-6 py-4 font-sans text-[10px] uppercase tracking-widest text-text-dim">Category</th>
              <th className="px-6 py-4 font-sans text-[10px] uppercase tracking-widest text-text-dim">Venue</th>
              <th className="px-6 py-4 font-sans text-[10px] uppercase tracking-widest text-text-dim">Date Found</th>
              <th className="px-6 py-4 font-sans text-[10px] uppercase tracking-widest text-text-dim">Added By</th>
              <th className="px-6 py-4 font-sans text-[10px] uppercase tracking-widest text-text-dim">Status</th>
              <th className="px-6 py-4 font-sans text-[10px] uppercase tracking-widest text-text-dim text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-main/50">
            {items.map((item) => {
              const photoUrl = getPhotoUrl(item.photo_path);
              return (
                <tr
                  key={item.id}
                  className="group hover:bg-surface-hover/50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-4">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        togglePrivacy(item);
                      }}
                      className={cn(
                        "p-1.5 rounded-lg border transition-all cursor-pointer",
                        isPublic(item)
                          ? "bg-white/80 text-brand border-brand/20 hover:bg-white/90"
                          : "bg-white/80 text-text-muted border-border-main hover:bg-white/90",
                      )}
                      title={isPublic(item) ? "Publicly Visible" : "Internal Check"}
                    >
                      {isPublic(item) ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/admin/items/${item.id}`} className="flex items-center gap-4">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-border-main bg-surface-active flex items-center justify-center">
                        {photoUrl ? (
                          <img src={photoUrl} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          <CameraOff className="h-4 w-4 text-text-dim opacity-40" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-text-main group-hover:text-brand transition-colors">
                          {item.name}
                        </div>
                        {item.description && (
                          <div className="text-[11px] text-text-muted line-clamp-1 mt-0.5">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[10px] font-sans font-bold text-text-muted bg-surface-active px-2 py-1 rounded border border-border-main/50">
                      {item.item_code}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-text-muted">
                      {item.category_name?.name || "Others"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <MapPin className="h-3.5 w-3.5 text-text-dim" />
                      {item.venue_name?.name || item.location || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <Calendar className="h-3.5 w-3.5 text-text-dim" />
                      {format(new Date(item.date_found), 'MMM dd, yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[10px] font-sans text-text-muted truncate max-w-[150px]" title={item.created_by_email || "Unknown"}>
                      {item.created_by_email?.split('@')[0] || "Unknown"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/admin/items/${item.id}`}
                      className="inline-flex items-center justify-center p-2 rounded-lg text-text-dim hover:text-brand hover:bg-brand/10 transition-all"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
