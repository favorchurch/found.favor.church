"use client";

import { Download } from "lucide-react";
import { format } from "date-fns";
import type { Item } from "./ItemCard";

interface ExportCSVProps {
  items: Item[];
  filename?: string;
}

export function ExportCSV({ items, filename = "lost-found-items" }: ExportCSVProps) {
  const exportToCSV = () => {
    if (items.length === 0) return;

    const headers = ["ID", "Name", "Description", "Date Found", "Location", "Status", "Public", "Created At"];
    const rows = items.map((item) => [
      item.id,
      item.name,
      item.description || "",
      item.date_found,
      item.location || "",
      item.status,
      item.is_public ? "Yes" : "No",
      format(new Date(item.created_at), "yyyy-MM-dd HH:mm:ss"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${filename}-${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={exportToCSV}
      disabled={items.length === 0}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-widest border border-border-main bg-surface hover:bg-surface-hover hover:border-border-hover text-text-muted hover:text-text-main transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Download className="h-3.5 w-3.5" />
      Export CSV
    </button>
  );
}
