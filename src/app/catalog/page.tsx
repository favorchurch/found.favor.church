import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { Search, LogOut } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { PAGE_SIZE } from "@/utils/constants";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Link from "next/link";
import { PublicCatalogResults } from "@/components/ui/PublicCatalogResults";
import { cn } from "@/utils/cn";

export const metadata: Metadata = {
  title: "Public Catalog | Lost & Found — Favor Church",
  description:
    "Browse items found at Favor Church. If you recognize an item, please visit the information desk.",
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; venue?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const statusFilter = params.status || "unclaimed";
  const venueFilter = params.venue || "all";
  const page = Math.max(1, Number(params.page) || 1);

  const supabase = await createClient();

  const { data: venues, error: venuesError } = await supabase
    .from("found_item_venues")
    .select("slug, name")
    .order("name");

  if (venuesError) {
    console.error("Error fetching venues:", venuesError);
  }
  const sortedVenues = sortPublicVenues(venues || []);

  let baseQuery = supabase
    .from("found_items")
    .select("*, category_name:found_item_categories(name), venue_name:found_item_venues(name)", { count: "exact" })
    .eq("is_public", true)
    .is("archived_at", null)
    .order("date_found", { ascending: false });

  if (query) {
    baseQuery = baseQuery.ilike("name", `%${query}%`);
  }

  if (statusFilter !== "all") {
    baseQuery = baseQuery.eq("status", statusFilter);
  }

  if (venueFilter !== "all") {
    baseQuery = baseQuery.eq("venue", venueFilter);
  }

  const from = (page - 1) * PAGE_SIZE;
  const {
    data: items,
    count,
    error,
  } = await baseQuery.range(from, from + PAGE_SIZE - 1);

  let calendarQuery = supabase
    .from("found_items")
    .select("id, date_found")
    .eq("is_public", true)
    .is("archived_at", null)
    .order("date_found", { ascending: false });

  if (query) {
    calendarQuery = calendarQuery.ilike("name", `%${query}%`);
  }

  if (statusFilter !== "all") {
    calendarQuery = calendarQuery.eq("status", statusFilter);
  }

  if (venueFilter !== "all") {
    calendarQuery = calendarQuery.eq("venue", venueFilter);
  }

  const { data: calendarItems, error: calendarError } = await calendarQuery;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Error fetching items:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }

  if (calendarError) {
    console.error("Error fetching calendar items:", calendarError);
  }

  const total = count ?? 0;

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-brand-dim bg-brand-deep px-6 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-white">
            <svg viewBox="0 0 16 16" className="h-4 w-4 fill-brand">
              <path d="M8 1a3 3 0 100 6A3 3 0 008 1zM4 4a4 4 0 118 0 4 4 0 01-8 0zm-2 9a6 6 0 1112 0H2z" />
            </svg>
          </div>
          <span className="font-sans text-sm font-black tracking-normal text-white uppercase">
            Lost<span className="text-white/80">&Found</span>{" "}
            <span className="ml-2 text-white/50 font-medium lowercase tracking-normal">
              Catalog
            </span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {user.email &&
                (await import("@/utils/admin")).isAdmin(user.email) && (
                  <a
                    href="/admin/dashboard"
                    className="text-[10px] font-sans text-white hover:text-white/80 uppercase transition-colors"
                  >
                    Admin Dashboard
                  </a>
                )}
              <form action="/auth/signout" method="POST">
                <button
                  type="submit"
                  className="flex items-center gap-2 text-[10px] font-sans text-white/90 hover:text-white uppercase transition-colors"
                >
                  <LogOut className="h-3 w-3" />
                  Logout
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="text-[10px] font-sans text-white/80 hover:text-white uppercase transition-colors"
            >
              Staff Login
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-7xl">
          {/* Welcome & Search Section */}
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-brand">
                Public Catalog
              </h1>
              <p className="text-sm text-text-muted">
                Browse items found at Favor Church. If you recognize an item,
                please visit the information desk on Sunday or contact our
                office during the week.
              </p>
            </div>

            <div className="w-full md:w-80">
              <form className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
                <input
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder="Search and press enter..."
                  className="w-full rounded-lg border border-border-main bg-surface px-10 py-2.5 text-xs text-text-main focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
                {statusFilter !== "all" && (
                  <input type="hidden" name="status" value={statusFilter} />
                )}
                {venueFilter !== "all" && (
                  <input type="hidden" name="venue" value={venueFilter} />
                )}
              </form>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-2">
            <VenueChip
              label="All"
              slug="all"
              active={venueFilter === "all"}
              currentParams={params}
            />
            {sortedVenues.map((venue) => (
              <VenueChip
                key={venue.slug}
                label={venue.name}
                slug={venue.slug}
                active={venueFilter === venue.slug}
                currentParams={params}
              />
            ))}
          </div>

          {/* Grid */}
          <ErrorBoundary>
            <PublicCatalogResults
              items={(items || []) as Parameters<typeof PublicCatalogResults>[0]["items"]}
              calendarItems={(calendarItems || []) as Parameters<typeof PublicCatalogResults>[0]["calendarItems"]}
            />
          </ErrorBoundary>

          <Pagination total={total} />
        </div>
      </main>

      <footer className="border-t border-brand-dim bg-brand-deep py-12 px-6 text-center">
        <p className="font-sans text-xs font-black uppercase text-white tracking-normal">
          &copy; {new Date().getFullYear()}&nbsp;Favor Church &bull; Lost &amp;
          Found
        </p>
      </footer>
    </div>
  );
}

function sortPublicVenues<T extends { slug: string; name: string }>(venues: T[]) {
  const seededOrder = new Map([
    ["ynares", 0],
    ["studio", 1],
    ["metrotent", 2],
  ]);

  return [...venues].sort((a, b) => {
    const aRank = seededOrder.get(a.slug) ?? Number.MAX_SAFE_INTEGER;
    const bRank = seededOrder.get(b.slug) ?? Number.MAX_SAFE_INTEGER;

    if (aRank !== bRank) {
      return aRank - bRank;
    }

    return a.name.localeCompare(b.name);
  });
}

function VenueChip({
  label,
  slug,
  active,
  currentParams,
}: {
  label: string;
  slug: string;
  active: boolean;
  currentParams: { q?: string; status?: string; venue?: string; page?: string };
}) {
  const params = new URLSearchParams(currentParams);
  if (slug === "all") {
    params.delete("venue");
  } else {
    params.set("venue", slug);
  }
  params.delete("page");

  return (
    <Link
      href={`?${params.toString()}`}
      className={cn(
        "rounded-full border px-4 py-2 text-[10px] font-sans font-bold uppercase tracking-widest transition-all",
        active
          ? "border-brand/40 bg-brand/10 text-brand"
          : "border-border-main bg-surface text-text-dim hover:border-border-hover hover:bg-surface-hover hover:text-text-main",
      )}
    >
      {label}
    </Link>
  );
}
