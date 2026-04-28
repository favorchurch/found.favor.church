"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { PAGE_SIZE } from "@/utils/constants";

interface PaginationProps {
  total: number;
}

export function Pagination({ total }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const setPage = useCallback(
    (p: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (p <= 1) params.delete("page");
      else params.set("page", String(p));
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  if (total <= PAGE_SIZE) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-6">
      <button
        onClick={() => setPage(page - 1)}
        disabled={page <= 1}
        className="p-2 rounded-lg border border-border-main bg-surface hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="font-sans text-[10px] text-text-dim uppercase tracking-widest px-3">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => setPage(page + 1)}
        disabled={page >= totalPages}
        className="p-2 rounded-lg border border-border-main bg-surface hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
