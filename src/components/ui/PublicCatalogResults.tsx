"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { PublicItemCard } from "@/components/ui/PublicItemCard";
import { cn } from "@/utils/cn";

interface PublicItem {
  id: string;
  name: string;
  item_code: string;
  category: string;
  category_name?: { name: string } | null;
  venue: string | null;
  venue_name?: { name: string } | null;
  location: string | null;
  date_found: string;
}

interface CalendarItem {
  id: string;
  date_found: string;
}

interface PublicCatalogResultsProps {
  items: PublicItem[];
  calendarItems: CalendarItem[];
}

export function PublicCatalogResults({
  items,
  calendarItems,
}: PublicCatalogResultsProps) {
  const initialMonth = calendarItems[0]?.date_found
    ? startOfMonth(parseISO(calendarItems[0].date_found))
    : startOfMonth(new Date());
  const [visibleMonth, setVisibleMonth] = useState(initialMonth);
  const [highlightedDate, setHighlightedDate] = useState<string | null>(null);

  const datesWithItems = useMemo(() => {
    const dates = new Set<string>();
    calendarItems.forEach((item) => {
      dates.add(format(parseISO(item.date_found), "yyyy-MM-dd"));
    });
    return dates;
  }, [calendarItems]);

  const highlightDate = (dateKey: string) => {
    setHighlightedDate(dateKey);
    const target = document.querySelector<HTMLElement>(
      `[data-catalog-date="${dateKey}"]`,
    );
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px] lg:items-start">
      <div className="order-2 lg:order-1">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {items.length > 0 ? (
            items.map((item) => {
              const dateKey = format(parseISO(item.date_found), "yyyy-MM-dd");
              const isHighlighted = highlightedDate === dateKey;

              return (
                <div
                  key={item.id}
                  data-catalog-date={dateKey}
                  className={cn(
                    "rounded-xl transition-all duration-300",
                    isHighlighted &&
                      "ring-2 ring-brand ring-offset-2 ring-offset-bg",
                  )}
                >
                  <PublicItemCard item={item} />
                </div>
              );
            })
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-border-main py-20 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-hover">
                <Search className="h-6 w-6 text-text-dim" />
              </div>
              <h3 className="text-sm font-medium text-text-muted">
                No items found
              </h3>
              <p className="mt-1 text-xs text-text-dim">
                Try adjusting your search or filters.
              </p>
            </div>
          )}
        </div>
      </div>

      <CatalogCalendar
        visibleMonth={visibleMonth}
        datesWithItems={datesWithItems}
        onPrevious={() => setVisibleMonth((month) => subMonths(month, 1))}
        onNext={() => setVisibleMonth((month) => addMonths(month, 1))}
        onDateClick={highlightDate}
        highlightedDate={highlightedDate}
      />
    </div>
  );
}

function CatalogCalendar({
  visibleMonth,
  datesWithItems,
  highlightedDate,
  onPrevious,
  onNext,
  onDateClick,
}: {
  visibleMonth: Date;
  datesWithItems: Set<string>;
  highlightedDate: string | null;
  onPrevious: () => void;
  onNext: () => void;
  onDateClick: (dateKey: string) => void;
}) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(visibleMonth));
    const end = endOfWeek(endOfMonth(visibleMonth));
    const result: Date[] = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      result.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    return result;
  }, [visibleMonth]);

  return (
    <aside className="order-1 rounded-xl border border-border-main bg-surface p-4 shadow-sm lg:order-2 lg:sticky lg:top-20">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-brand" />
          <h2 className="text-xs font-sans font-black uppercase tracking-widest text-text-main">
            Activity
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevious}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-dim hover:bg-surface-hover hover:text-brand"
            title="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onNext}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-dim hover:bg-surface-hover hover:text-brand"
            title="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-3 text-sm font-semibold text-text-main">
        {format(visibleMonth, "MMMM yyyy")}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <div
            key={`${day}-${index}`}
            className="py-1 text-[10px] font-sans font-bold uppercase text-text-dim"
          >
            {day}
          </div>
        ))}

        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const hasItems = datesWithItems.has(dateKey);
          const isHighlighted = highlightedDate === dateKey;

          return (
            <button
              key={dateKey}
              type="button"
              disabled={!hasItems}
              onClick={() => onDateClick(dateKey)}
              className={cn(
                "relative flex aspect-square items-center justify-center rounded-lg text-xs transition-all",
                isSameMonth(day, visibleMonth)
                  ? "text-text-main"
                  : "text-text-dim/40",
                hasItems
                  ? "hover:bg-brand/10 hover:text-brand"
                  : "cursor-default opacity-50",
                isHighlighted && "bg-brand/10 text-brand ring-1 ring-brand/30",
                isSameDay(day, new Date()) && "font-bold",
              )}
            >
              {format(day, "d")}
              {hasItems && (
                <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-brand" />
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
