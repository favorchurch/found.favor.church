"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/utils/cn";

interface VenueRow {
  slug: string;
  name: string;
  parent_slug: string | null;
  display_order: number | null;
}

interface PublicCatalogControlsProps {
  initialQuery: string;
  initialDateFrom: string;
  initialDateTo: string;
  venues: VenueRow[];
  activeVenue: string;
  statusFilter: string;
}

const SEARCH_DEBOUNCE_MS = 300;
const SUGGESTED_SEARCHES = [
  "Cellphone",
  "Tumbler",
  "Umbrella",
  "Wallet",
  "Keys",
  "Jacket",
];

export function PublicCatalogControls({
  initialQuery,
  initialDateFrom,
  initialDateTo,
  venues,
  activeVenue,
  statusFilter,
}: PublicCatalogControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [queryDraft, setQueryDraft] = useState(initialQuery);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Sync local draft when URL changes externally (e.g. browser back).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQueryDraft(initialQuery);
  }, [initialQuery]);

  const updateParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams.toString());
      mutate(next);
      next.delete("page");
      const queryString = next.toString();
      startTransition(() => {
        router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router, searchParams],
  );

  // Debounced URL sync for the search input.
  useEffect(() => {
    if (queryDraft === initialQuery) return;
    const handle = window.setTimeout(() => {
      updateParams((next) => {
        if (queryDraft.trim()) {
          next.set("q", queryDraft.trim());
        } else {
          next.delete("q");
        }
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [queryDraft, initialQuery, updateParams]);

  // Close popover when clicking outside.
  useEffect(() => {
    if (!popoverOpen) return;
    const onClick = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [popoverOpen]);

  const setRange = (from: string, to: string) => {
    updateParams((next) => {
      if (from) next.set("from", from);
      else next.delete("from");
      if (to) next.set("to", to);
      else next.delete("to");
    });
  };

  const setVenue = (slug: string) => {
    updateParams((next) => {
      if (slug === "all") {
        next.delete("venue");
      } else {
        next.set("venue", slug);
      }
    });
  };

  const dateRangeLabel = useMemo(() => {
    if (initialDateFrom && initialDateTo) {
      return `${format(parseISO(initialDateFrom), "MMM d")} - ${format(parseISO(initialDateTo), "MMM d, yyyy")}`;
    }
    if (initialDateFrom) {
      return `From ${format(parseISO(initialDateFrom), "MMM d, yyyy")}`;
    }
    if (initialDateTo) {
      return `Until ${format(parseISO(initialDateTo), "MMM d, yyyy")}`;
    }
    return "Filter by date";
  }, [initialDateFrom, initialDateTo]);

  const topLevelVenues = useMemo(
    () => venues.filter((v) => !v.parent_slug),
    [venues],
  );

  const childrenByParent = useMemo(() => {
    const map = new Map<string, VenueRow[]>();
    venues.forEach((v) => {
      if (!v.parent_slug) return;
      if (!map.has(v.parent_slug)) {
        map.set(v.parent_slug, []);
      }
      map.get(v.parent_slug)!.push(v);
    });
    return map;
  }, [venues]);

  // Determine which parent's children to expose: the parent of the active
  // child, or the active venue itself if it's a parent.
  const expandedParent = useMemo(() => {
    if (activeVenue === "all") return null;
    const active = venues.find((v) => v.slug === activeVenue);
    if (!active) return null;
    return active.parent_slug ?? active.slug;
  }, [activeVenue, venues]);

  const childChips = expandedParent
    ? childrenByParent.get(expandedParent) || []
    : [];

  const activeVenueName = useMemo(() => {
    if (activeVenue === "all") return "";
    return venues.find((v) => v.slug === activeVenue)?.name || activeVenue;
  }, [activeVenue, venues]);

  const thisSunday = useMemo(
    () => format(startOfWeek(new Date()), "yyyy-MM-dd"),
    [],
  );

  const searchFor = (term: string) => {
    if (queryDraft.toLowerCase() === term.toLowerCase()) {
      setQueryDraft("");
      updateParams((next) => {
        next.delete("q");
      });
    } else {
      setQueryDraft(term);
      updateParams((next) => {
        next.set("q", term);
      });
    }
  };

  const applyThisSunday = () => {
    setRange(thisSunday, thisSunday);
  };

  const hasActiveFilters =
    queryDraft.trim() ||
    initialDateFrom ||
    initialDateTo ||
    activeVenue !== "all";

  return (
    <div className="mb-8 rounded-3xl border border-border-main bg-surface p-4 shadow-sm sm:p-5">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={applyThisSunday}
            className="inline-flex items-center gap-2 rounded-full border border-border-main bg-white px-4 py-2 text-[10px] font-sans font-bold uppercase tracking-widest text-text-muted transition-all hover:border-brand/40 hover:bg-brand/10 hover:text-brand"
          >
            <Clock className="h-3.5 w-3.5" />
            This Sunday
          </button>
          <div ref={popoverRef} className="relative inline-block">
            <button
              type="button"
              onClick={() => setPopoverOpen((open) => !open)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-sans font-bold uppercase tracking-widest transition-all",
                initialDateFrom || initialDateTo
                  ? "border-brand/40 bg-brand/10 text-brand"
                  : "border-border-main bg-white text-text-muted hover:border-border-hover hover:text-text-main",
              )}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              {dateRangeLabel}
            </button>

            {popoverOpen && (
              <div className="absolute left-0 top-full z-40 mt-2 w-[320px] rounded-2xl border border-border-main bg-surface p-4 shadow-2xl">
                <RangeCalendar
                  initialFrom={initialDateFrom}
                  initialTo={initialDateTo}
                  onApply={(from, to) => {
                    setRange(from, to);
                    setPopoverOpen(false);
                  }}
                  onClear={() => {
                    setRange("", "");
                    setPopoverOpen(false);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-dim" />
          <input
            type="search"
            value={queryDraft}
            onChange={(e) => setQueryDraft(e.target.value)}
            placeholder="Search by item, place, or claim code"
            className="w-full rounded-2xl border border-border-main bg-white px-12 py-4 text-base font-medium text-text-main shadow-sm transition-colors placeholder:text-text-dim focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
          />
          {queryDraft && (
            <button
              type="button"
              onClick={() => setQueryDraft("")}
              aria-label="Clear search"
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-text-dim hover:bg-surface-hover hover:text-text-main"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {SUGGESTED_SEARCHES.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => searchFor(term)}
                className={cn(
                  "rounded-full border px-3 py-2 text-[10px] font-sans font-bold uppercase tracking-widest transition-all",
                  queryDraft.toLowerCase() === term.toLowerCase()
                    ? "border-brand/40 bg-brand/10 text-brand"
                    : "border-border-main bg-white text-text-muted hover:border-brand/40 hover:bg-brand/10 hover:text-brand",
                )}
              >
                {term}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {queryDraft.trim() && (
                <FilterPill
                  label={`Search: ${queryDraft.trim()}`}
                  onClear={() => setQueryDraft("")}
                />
              )}
              {(initialDateFrom || initialDateTo) && (
                <FilterPill
                  label={dateRangeLabel}
                  onClear={() => setRange("", "")}
                />
              )}
              {activeVenue !== "all" && (
                <FilterPill
                  label={activeVenueName}
                  onClear={() => setVenue("all")}
                />
              )}
            </div>
          )}
        </div>

        {statusFilter !== "unclaimed" && (
          <p className="text-[10px] font-sans uppercase tracking-widest text-text-dim">
            Status filter: {statusFilter}
          </p>
        )}

        <div className="border-t border-border-main pt-4">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-sans font-bold uppercase tracking-widest text-text-dim">
            <MapPin className="h-3.5 w-3.5" />
            Venue
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <VenueChip
              label="All venues"
              active={activeVenue === "all"}
              onClick={() => setVenue("all")}
            />
            {topLevelVenues.map((venue) => (
              <VenueChip
                key={venue.slug}
                label={venue.name}
                active={
                  activeVenue === venue.slug || expandedParent === venue.slug
                }
                onClick={() => setVenue(venue.slug)}
              />
            ))}
          </div>

          {childChips.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-l border-border-main pl-4">
              <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-text-dim">
                Within{" "}
                {expandedParent
                  ? venues.find((v) => v.slug === expandedParent)?.name || ""
                  : ""}
                :
              </span>
              {childChips.map((child) => (
                <VenueChip
                  key={child.slug}
                  label={child.name}
                  active={activeVenue === child.slug}
                  size="sm"
                  onClick={() => setVenue(child.slug)}
                />
              ))}
            </div>
          )}
        </div>

        <p className="text-xs leading-5 text-text-dim">
          Our team may ask a few questions or use a private photo to confirm
          it is yours.
        </p>
      </div>
    </div>
  );
}

function FilterPill({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="inline-flex max-w-full items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1.5 text-[10px] font-sans font-bold uppercase tracking-widest text-brand transition-colors hover:bg-brand/15"
      aria-label={`Clear ${label}`}
    >
      <span className="truncate">{label}</span>
      <X className="h-3 w-3 shrink-0" />
    </button>
  );
}

function VenueChip({
  label,
  active,
  onClick,
  size = "md",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border font-sans font-bold uppercase tracking-widest transition-all",
        size === "md" ? "px-4 py-2 text-[10px]" : "px-3 py-1 text-[9px]",
        active
          ? "border-brand/40 bg-brand/10 text-brand"
          : "border-border-main bg-surface text-text-dim hover:border-border-hover hover:bg-surface-hover hover:text-text-main",
      )}
    >
      {label}
    </button>
  );
}

function RangeCalendar({
  initialFrom,
  initialTo,
  onApply,
  onClear,
}: {
  initialFrom: string;
  initialTo: string;
  onApply: (from: string, to: string) => void;
  onClear: () => void;
}) {
  const [draftFrom, setDraftFrom] = useState<string>(initialFrom);
  const [draftTo, setDraftTo] = useState<string>(initialTo);
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => {
    if (initialFrom) return startOfMonth(parseISO(initialFrom));
    return startOfMonth(new Date());
  });

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

  const handleDayClick = (day: Date) => {
    const dateKey = format(day, "yyyy-MM-dd");
    if (!draftFrom || (draftFrom && draftTo)) {
      // Start a new selection.
      setDraftFrom(dateKey);
      setDraftTo("");
      return;
    }
    // We have a from but no to.
    const fromDate = parseISO(draftFrom);
    if (isBefore(day, fromDate)) {
      // Clicked earlier → reset start.
      setDraftFrom(dateKey);
      setDraftTo("");
    } else {
      setDraftTo(dateKey);
    }
  };

  const isInRange = (day: Date): boolean => {
    if (!draftFrom || !draftTo) return false;
    const from = parseISO(draftFrom);
    const to = parseISO(draftTo);
    return !isBefore(day, from) && !isAfter(day, to);
  };

  const isEndpoint = (day: Date): boolean => {
    if (draftFrom && isSameDay(day, parseISO(draftFrom))) return true;
    if (draftTo && isSameDay(day, parseISO(draftTo))) return true;
    return false;
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setVisibleMonth((m) => subMonths(m, 1))}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-text-dim hover:bg-surface-hover hover:text-brand"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-text-main">
          {format(visibleMonth, "MMMM yyyy")}
        </span>
        <button
          type="button"
          onClick={() => setVisibleMonth((m) => addMonths(m, 1))}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-text-dim hover:bg-surface-hover hover:text-brand"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
          <div
            key={`${day}-${idx}`}
            className="py-1 text-[10px] font-sans font-bold uppercase text-text-dim"
          >
            {day}
          </div>
        ))}
        {days.map((day) => {
          const inRange = isInRange(day);
          const endpoint = isEndpoint(day);
          const inMonth = isSameMonth(day, visibleMonth);
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => handleDayClick(day)}
              className={cn(
                "relative flex aspect-square items-center justify-center rounded-lg text-xs transition-all",
                inMonth ? "text-text-main" : "text-text-dim/40",
                !endpoint && inRange && "bg-brand/10 text-brand",
                endpoint && "bg-brand text-white font-bold",
                !endpoint &&
                  !inRange &&
                  "hover:bg-surface-hover hover:text-text-main",
                isSameDay(day, new Date()) && !endpoint && "font-bold",
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border-main pt-3">
        <button
          type="button"
          onClick={onClear}
          className="text-[10px] font-sans font-bold uppercase tracking-widest text-text-dim hover:text-text-main"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => onApply(draftFrom, draftTo || draftFrom)}
          disabled={!draftFrom}
          className="rounded-lg bg-brand px-4 py-2 text-[10px] font-sans font-bold uppercase tracking-widest text-white transition-colors hover:bg-brand-dim disabled:opacity-40"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
