"use client";

import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/utils/cn";

interface LayoutToggleProps {
  view: "grid" | "table";
  onChange: (view: "grid" | "table") => void;
}

export function LayoutToggle({ view, onChange }: LayoutToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-surface-active p-1 rounded-lg border border-border-hover shadow-inner">
      <button
        onClick={() => onChange("grid")}
        className={cn(
          "p-1.5 rounded-md transition-all duration-200",
          view === "grid"
            ? "bg-brand text-white shadow-md shadow-brand/20"
            : "text-text-dim hover:text-text-muted hover:bg-surface-hover"
        )}
        title="Grid View"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        onClick={() => onChange("table")}
        className={cn(
          "p-1.5 rounded-md transition-all duration-200",
          view === "table"
            ? "bg-brand text-white shadow-md shadow-brand/20"
            : "text-text-dim hover:text-text-muted hover:bg-surface-hover"
        )}
        title="Table View"
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}
