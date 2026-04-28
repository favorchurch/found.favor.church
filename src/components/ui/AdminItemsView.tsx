"use client";

import { useState, useEffect } from "react";
import { type Item, ItemCard } from "./ItemCard";
import { AdminItemsTable } from "./AdminItemsTable";
import { LayoutToggle } from "./LayoutToggle";
import Link from "next/link";
import { Inbox } from "lucide-react";

interface AdminItemsViewProps {
  items: Item[];
}

export function AdminItemsView({ items }: AdminItemsViewProps) {
  const [state, setState] = useState<{ view: "grid" | "table"; mounted: boolean }>({
    view: "grid",
    mounted: false,
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(() => {
      const savedView = localStorage.getItem("admin-view-preference");
      const initialView = (savedView === "grid" || savedView === "table") ? (savedView as "grid" | "table") : "grid";
      return { view: initialView, mounted: true };
    });
  }, []);

  const handleViewChange = (newView: "grid" | "table") => {
    setState((prev) => ({ ...prev, view: newView }));
    localStorage.setItem("admin-view-preference", newView);
  };

  // Avoid hydration mismatch by not rendering anything during SSR if it depends on localStorage
  if (!state.mounted) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-10 w-32 bg-surface-active rounded-lg border border-border-main" />
          <div className="h-64 w-full bg-surface-active rounded-xl border border-border-main" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {items && items.length > 0 ? (
        state.view === "grid" ? (
          <div className="flex items-start gap-4">
            <div className="flex-1 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} admin />
              ))}
            </div>
            <LayoutToggle view={state.view} onChange={handleViewChange} />
          </div>
        ) : (
          <>
            <div className="flex justify-end">
              <LayoutToggle view={state.view} onChange={handleViewChange} />
            </div>
            <AdminItemsTable items={items} />
          </>
        )
      ) : (
        <div className="col-span-full h-80 flex flex-col items-center justify-center rounded-xl border border-dashed border-border-main text-center bg-surface/30">
          <Inbox className="h-12 w-12 text-text-dim mb-4 opacity-20" />
          <p className="text-text-dim text-sm font-sans uppercase tracking-widest">No entries found</p>
          <Link href="/admin/dashboard" className="mt-4 text-[10px] text-brand border border-brand/20 px-3 py-1.5 rounded hover:bg-brand/10 transition-colors uppercase font-sans tracking-widest">Clear Filters</Link>
        </div>
      )}
    </div>
  );
}
