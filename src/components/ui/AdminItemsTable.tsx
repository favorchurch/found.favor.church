"use client";

import { format } from "date-fns";
import { Calendar, MapPin, CameraOff, ChevronRight } from "lucide-react";
import Link from "next/link";
import { type Item } from "./ItemCard";
import { StatusBadge } from "./StatusBadge";

interface AdminItemsTableProps {
  items: Item[];
}

export function AdminItemsTable({ items }: AdminItemsTableProps) {
  const getPhotoUrl = (path: string | null) => {
    if (!path) return null;
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/item-images/${path}`;
  };

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border-main bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border-main bg-surface-active/50">
              <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-text-dim">Item</th>
              <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-text-dim">Location</th>
              <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-text-dim">Date Found</th>
              <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-text-dim">Status</th>
              <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-widest text-text-dim text-right">Actions</th>
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
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <MapPin className="h-3.5 w-3.5 text-text-dim" />
                      {item.location || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <Calendar className="h-3.5 w-3.5 text-text-dim" />
                      {format(new Date(item.date_found), 'MMM dd, yyyy')}
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
