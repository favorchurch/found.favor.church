"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SortAsc } from "lucide-react";

export function SortSelector({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 w-full md:w-auto px-4 py-2 bg-bg border border-border-hover rounded-lg">
      <SortAsc className="h-4 w-4 text-text-dim" />
      <select 
        className="bg-transparent text-[11px] font-mono text-text-main focus:outline-none cursor-pointer uppercase tracking-tighter"
        defaultValue={defaultValue}
        onChange={(e) => handleSortChange(e.target.value)}
      >
        <option value="created_at_desc">Newest Logged</option>
        <option value="created_at_asc">Oldest Logged</option>
        <option value="date_found_desc">Recently Found</option>
        <option value="date_found_asc">Found Long Ago</option>
        <option value="name_asc">Name A-Z</option>
        <option value="name_desc">Name Z-A</option>
      </select>
    </div>
  );
}
