"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { RangeCalendar } from "./PublicCatalogControls";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

export function AdminCatalogSidebar({
  initialDateFrom,
  initialDateTo,
}: {
  initialDateFrom: string;
  initialDateTo: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const { data: dateCounts } = useQuery({
    queryKey: ["admin-catalog-item-counts"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("found_items")
        .select("date_found")
        .is("archived_at", null);
      if (error) throw error;
      const counts = new Map<string, number>();
      for (const row of data ?? []) {
        const d = row.date_found as string;
        counts.set(d, (counts.get(d) ?? 0) + 1);
      }
      return Array.from(counts.entries()).map(([date_found, item_count]) => ({
        date_found,
        item_count,
      }));
    },
  });

  const updateParams = (from: string, to: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (from) next.set("from", from);
    else next.delete("from");
    if (to) next.set("to", to);
    else next.delete("to");
    next.delete("page");
    const queryString = next.toString();
    startTransition(() => {
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    });
  };

  return (
    <div className="rounded-3xl border border-border-main bg-surface p-5 shadow-sm">
      <h3 className="mb-4 text-[10px] font-sans font-bold uppercase tracking-widest text-text-dim">
        Filter by Date
      </h3>
      <RangeCalendar
        initialFrom={initialDateFrom}
        initialTo={initialDateTo}
        dateCounts={dateCounts}
        onChange={updateParams}
        onClear={() => updateParams("", "")}
      />
    </div>
  );
}
