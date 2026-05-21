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
import { format, parseISO, startOfWeek } from "date-fns";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAdminItemCountsByDate } from "@/app/admin/actions/items";
import { cn } from "@/utils/cn";
import { RangeCalendar } from "@/components/ui/PublicCatalogControls";
import { SortSelector } from "@/components/ui/SortSelector";
import type { AdminStatusFilter, CatalogVenue } from "@/utils/catalogFilters";

interface AdminCatalogControlsProps {
  initialQuery: string;
  initialDateFrom: string;
  initialDateTo: string;
  venues: CatalogVenue[];
  activeVenue: string;
  statusFilter: AdminStatusFilter;
  sortBy: string;
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

const STATUS_FILTERS: { label: string; value: AdminStatusFilter }[] = [
  { label: "Everything", value: "all" },
  { label: "Unclaimed", value: "unclaimed" },
  { label: "Claimed", value: "claimed" },
  { label: "Disposed", value: "disposed" },
];

export function AdminCatalogControls({
  initialQuery,
  initialDateFrom,
  initialDateTo,
  venues,
  activeVenue,
  statusFilter,
  sortBy,
}: AdminCatalogControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [queryDraft, setQueryDraft] = useState(initialQuery);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const { data: dateCounts } = useQuery({
    queryKey: ["admin-catalog-item-counts"],
    queryFn: async () => {
      return await getAdminItemCountsByDate();
    },
  });

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

  useEffect(() => {
    if (queryDraft === initialQuery) return;
    const handle = window.setTimeout(() => {
      updateParams((next) => {
        if (queryDraft.trim()) next.set("q", queryDraft.trim());
        else next.delete("q");
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [queryDraft, initialQuery, updateParams]);

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
      if (slug === "all") next.delete("venue");
      else next.set("venue", slug);
    });
  };

  const setStatus = (status: AdminStatusFilter) => {
    updateParams((next) => {
      if (status === "all") next.delete("status");
      else next.set("status", status);
    });
  };

  const searchFor = (term: string) => {
    if (queryDraft.toLowerCase() === term.toLowerCase()) {
      setQueryDraft("");
      updateParams((next) => next.delete("q"));
    } else {
      setQueryDraft(term);
      updateParams((next) => next.set("q", term));
    }
  };

  const applySearch = () => {
    updateParams((next) => {
      const query = queryDraft.trim();
      if (query) next.set("q", query);
      else next.delete("q");
    });
  };

  const dateRangeLabel = useMemo(() => {
    if (initialDateFrom && initialDateTo) {
      if (initialDateFrom === initialDateTo) {
        return format(parseISO(initialDateFrom), "MMM d, yyyy");
      }
      return `${format(parseISO(initialDateFrom), "MMM d")} - ${format(parseISO(initialDateTo), "MMM d, yyyy")}`;
    }
    if (initialDateFrom) return `From ${format(parseISO(initialDateFrom), "MMM d, yyyy")}`;
    if (initialDateTo) return `Until ${format(parseISO(initialDateTo), "MMM d, yyyy")}`;
    return "Filter by date";
  }, [initialDateFrom, initialDateTo]);

  const topLevelVenues = useMemo(
    () => venues.filter((venue) => !venue.parent_slug),
    [venues],
  );

  const childrenByParent = useMemo(() => {
    const map = new Map<string, CatalogVenue[]>();
    venues.forEach((venue) => {
      if (!venue.parent_slug) return;
      if (!map.has(venue.parent_slug)) map.set(venue.parent_slug, []);
      map.get(venue.parent_slug)!.push(venue);
    });
    return map;
  }, [venues]);

  const expandedParent = useMemo(() => {
    if (activeVenue === "all") return null;
    const active = venues.find((venue) => venue.slug === activeVenue);
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

  const applyThisSunday = () => {
    if (initialDateFrom === thisSunday && initialDateTo === thisSunday) {
      setRange("", "");
    } else {
      setRange(thisSunday, thisSunday);
    }
  };

  const isThisSundayActive =
    initialDateFrom === thisSunday && initialDateTo === thisSunday;

  return (
    <div className="rounded-3xl border border-border-main bg-surface p-4 shadow-sm sm:p-5">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatus(option.value)}
              className={cn(
                "rounded-full border px-4 py-2 text-[10px] font-sans font-bold uppercase tracking-widest transition-all",
                statusFilter === option.value
                  ? "border-brand/40 bg-brand/10 text-brand"
                  : "border-border-main bg-white text-text-muted hover:border-border-hover hover:text-text-main",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
        </div>

        <form
          className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
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
              onChange={(event) => setQueryDraft(event.target.value)}
              placeholder="Search by item, place, claim code, status, or staff note"
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
          <div ref={popoverRef} className="relative lg:hidden">
            <button
              type="button"
              onClick={() => setPopoverOpen((open) => !open)}
              aria-label={dateRangeLabel}
              className={cn(
                "flex h-full items-center justify-center rounded-full border px-4 aspect-square transition-all",
                initialDateFrom || initialDateTo
                  ? "border-brand/40 bg-brand/10 text-brand"
                  : "border-border-main bg-white text-text-muted hover:border-border-hover hover:text-text-main",
              )}
            >
              <CalendarIcon className="h-4 w-4" />
            </button>
            {popoverOpen && (
              <div
                className="absolute right-0 top-full z-40 mt-2 w-[320px] rounded-2xl border border-border-main bg-surface p-4 shadow-2xl"
              >
                <RangeCalendar
                  initialFrom={initialDateFrom}
                  initialTo={initialDateTo}
                  dateCounts={dateCounts}
                  onChange={(from, to, completedRange) => {
                    setRange(from, to);
                    if (completedRange) setPopoverOpen(false);
                  }}
                  onClear={() => {
                    setRange("", "");
                    setPopoverOpen(false);
                  }}
                />
              </div>
            )}
          </div>
          <SortSelector defaultValue={sortBy} />
        </form>

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
                active={activeVenue === venue.slug || expandedParent === venue.slug}
                onClick={() => setVenue(venue.slug)}
              />
            ))}
          </div>
          {childChips.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-l border-border-main pl-4">
              <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-text-dim">
                Within {expandedParent ? venues.find((venue) => venue.slug === expandedParent)?.name || "" : ""}:
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

        <div className="hidden lg:block border-t border-border-main pt-4">
          <div className="mb-3 text-[10px] font-sans font-bold uppercase tracking-widest text-text-dim">
            Filter by Date
          </div>
          <div className="max-w-xs">
            <RangeCalendar
              initialFrom={initialDateFrom}
              initialTo={initialDateTo}
              dateCounts={dateCounts}
              onChange={(from, to) => setRange(from, to)}
              onClear={() => setRange("", "")}
            />
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
