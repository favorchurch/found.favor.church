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
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { selectDateRange } from "@/utils/dateRangeSelection";

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
      if (initialDateFrom === initialDateTo) {
        return format(parseISO(initialDateFrom), "MMM d, yyyy");
      }
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

  const applySearch = () => {
    updateParams((next) => {
      const query = queryDraft.trim();
      if (query) {
        next.set("q", query);
      } else {
        next.delete("q");
      }
    });
  };

  const applyThisSunday = () => {
    if (initialDateFrom === thisSunday && initialDateTo === thisSunday) {
      setRange("", "");
    } else {
      setRange(thisSunday, thisSunday);
    }
  };
  const isThisSundayActive =
    initialDateFrom === thisSunday && initialDateTo === thisSunday;
  const showDisclaimer =
    !queryDraft.trim() && !initialDateFrom && !initialDateTo;

  return (
    <div className="mb-8 rounded-3xl border border-border-main bg-surface p-4 shadow-sm sm:p-5">
      <div className="space-y-4">
        <div className="relative flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={applyThisSunday}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-sans font-bold uppercase tracking-widest transition-all hover:border-brand/40 hover:bg-brand/10 hover:text-brand",
              isThisSundayActive
                ? "border-brand/40 bg-brand/10 text-brand"
                : "border-border-main bg-white text-text-muted",
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            Last Sunday
          </button>
          <div ref={popoverRef} className="inline-block lg:hidden">
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
              <div
                className="absolute left-1/2 top-full z-40 mt-2 max-w-[320px] -translate-x-1/2 rounded-2xl border border-border-main bg-surface p-4 shadow-2xl"
                style={{ width: "calc(100vw - 2rem)" }}
              >
                <RangeCalendar
                  initialFrom={initialDateFrom}
                  initialTo={initialDateTo}
                  dateCounts={dateCounts}
                  onChange={(from, to, completedRange) => {
                    setRange(from, to);
                    if (completedRange) {
                      setPopoverOpen(false);
                    }
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

        <form
          className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            applySearch();
          }}
        >
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
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-4 font-sans text-[11px] font-black uppercase tracking-widest text-white shadow-sm transition-all hover:bg-brand-dim focus:outline-none focus:ring-4 focus:ring-brand/20"
          >
            <Search className="h-4 w-4" />
            Find
          </button>
        </form>

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

          <div
            className={cn(
              "grid transition-[grid-template-rows,opacity,margin-top] duration-300 ease-out motion-reduce:transition-none",
              showDisclaimer
                ? "mt-4 grid-rows-[1fr] opacity-100"
                : "mt-0 grid-rows-[0fr] opacity-0",
            )}
            aria-hidden={!showDisclaimer}
          >
            <div className="overflow-hidden">
              <div className="rounded-2xl border border-brand/15 bg-brand/5 p-4">
                <h2 className="font-sans text-[10px] font-black uppercase tracking-widest text-brand">
                  Disclaimer on Unclaimed Lost &amp; Found Items
                </h2>
                <p className="mt-2 text-xs leading-5 text-text-muted">
                  To keep items moving and avoid long-term storage, Lost and
                  Found disposal will happen every{" "}
                  <strong>three (3) months</strong> or{" "}
                  <strong>nine (9) weeks</strong>. Make sure to check for your
                  lost item within three (3) months from the date it was lost.
                </p>
                <p className="mt-2 text-xs leading-5 text-text-muted">
                  Any item left unclaimed after this period may be donated or
                  distributed as part of the volunteer prize pool.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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

export function RangeCalendar({
  initialFrom,
  initialTo,
  dateCounts,
  onChange,
  onClear,
}: {
  initialFrom: string;
  initialTo: string;
  dateCounts?: { date_found: string; item_count: number }[];
  onChange: (from: string, to: string, completedRange: boolean) => void;
  onClear: () => void;
}) {
  const [draftFrom, setDraftFrom] = useState<string>(initialFrom);
  const [draftTo, setDraftTo] = useState<string>(
    initialFrom === initialTo ? "" : initialTo,
  );
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => {
    if (initialFrom) return startOfMonth(parseISO(initialFrom));
    return startOfMonth(new Date());
  });

  // Keep internal draft in sync with props if props change from outside
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraftFrom(initialFrom);
    setDraftTo(initialFrom === initialTo ? "" : initialTo);
  }, [initialFrom, initialTo]);

  const countsMap = useMemo(() => {
    const map = new Map<string, number>();
    dateCounts?.forEach((item) => {
      map.set(item.date_found, Number(item.item_count));
    });
    return map;
  }, [dateCounts]);

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
    const selection = selectDateRange({ draftFrom, draftTo }, dateKey);
    setDraftFrom(selection.draftFrom);
    setDraftTo(selection.draftTo);
    onChange(
      selection.filterFrom,
      selection.filterTo,
      selection.completedRange,
    );
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
          const dateKey = format(day, "yyyy-MM-dd");
          const hasItems = countsMap.get(dateKey);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => handleDayClick(day)}
              className={cn(
                "relative flex aspect-square items-center justify-center rounded-lg text-xs transition-all",
                inMonth ? "text-text-main" : "text-text-dim/40",
                !endpoint && inRange && "bg-brand/10 text-brand",
                endpoint &&
                  (hasItems
                    ? "bg-brand/10 text-brand font-black ring-1 ring-brand/40"
                    : "bg-brand text-white font-bold"),
                !endpoint &&
                  !inRange &&
                  "hover:bg-surface-hover hover:text-text-main",
                isSameDay(day, new Date()) && !endpoint && "font-bold",
                hasItems && "text-brand font-black",
              )}
            >
              {format(day, "d")}
              {hasItems && (
                <div className="absolute top-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 border-t border-border-main pt-3">
        <button
          type="button"
          onClick={() => {
            setDraftFrom("");
            setDraftTo("");
            onClear();
          }}
          className="text-[10px] font-sans font-bold uppercase tracking-widest text-text-dim hover:text-text-main"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
