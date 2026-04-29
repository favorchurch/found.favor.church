"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { RangeCalendar } from "./PublicCatalogControls";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

export function CatalogSidebar({
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
    queryKey: ["public-catalog-item-counts"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc(
        "get_public_catalog_item_counts_by_date",
      );
      if (error) throw error;
      return data as { date_found: string; item_count: number }[];
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
