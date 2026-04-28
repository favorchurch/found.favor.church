import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { LogOut } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { PAGE_SIZE } from "@/utils/constants";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Link from "next/link";
import { PublicCatalogResults } from "@/components/ui/PublicCatalogResults";
import { PublicCatalogControls } from "@/components/ui/PublicCatalogControls";

export const metadata: Metadata = {
  title: "Public Catalog | Lost & Found — Favor Church",
  description:
    "Browse items found at Favor Church. If you recognize an item, please visit the information desk.",
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    venue?: string;
    page?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const params = await searchParams;
  const query = (params.q || "").trim();
  const statusFilter = params.status || "unclaimed";
  const venueFilter = params.venue || "all";
  const page = Math.max(1, Number(params.page) || 1);
  const dateFrom = ISO_DATE.test(params.from || "") ? params.from! : "";
  const dateTo = ISO_DATE.test(params.to || "") ? params.to! : "";

  const supabase = await createClient();

  const { data: venues, error: venuesError } = await supabase
    .from("found_item_venues")
    .select("slug, name, parent_slug, display_order")
    .order("display_order")
    .order("name");

  if (venuesError) {
    console.error("Error fetching venues:", venuesError);
  }
  const allVenues = (venues || []) as VenueRow[];

  const isIdle = !query && !dateFrom && !dateTo;

  let items: PublicCatalogItem[] = [];
  let total = 0;

  if (!isIdle) {
    let baseQuery = supabase
      .from("found_items")
      .select(
        "id, name, item_code, category, venue, location, date_found, category_name:found_item_categories(name), venue_name:found_item_venues!found_items_venue_fkey(name, parent_slug, parent:found_item_venues!found_item_venues_parent_slug_fkey(name))",
        { count: "exact" },
      )
      .eq("is_public", true)
      .is("archived_at", null)
      .order("date_found", { ascending: false });

    if (query) {
      const tokens = tokenizeQuery(query);
      if (tokens.length > 0) {
        const orFilter = tokens
          .flatMap((token) => {
            const escaped = escapeIlikePattern(token);
            return [
              `name.ilike.%${escaped}%`,
              `description.ilike.%${escaped}%`,
            ];
          })
          .join(",");
        baseQuery = baseQuery.or(orFilter);
      }
    }

    if (statusFilter !== "all") {
      baseQuery = baseQuery.eq("status", statusFilter);
    }

    if (venueFilter !== "all") {
      const slugs = expandVenueFilter(allVenues, venueFilter);
      if (slugs.length === 1) {
        baseQuery = baseQuery.eq("venue", slugs[0]);
      } else {
        baseQuery = baseQuery.in("venue", slugs);
      }
    }

    if (dateFrom) {
      baseQuery = baseQuery.gte("date_found", dateFrom);
    }

    if (dateTo) {
      baseQuery = baseQuery.lte("date_found", dateTo);
    }

    const from = (page - 1) * PAGE_SIZE;
    const {
      data: rows,
      count,
      error,
    } = await baseQuery.range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error("Error fetching items:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    }

    items = (rows || []) as unknown as PublicCatalogItem[];
    total = count ?? 0;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 max-w-2xl space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-brand">
              Public Catalog
            </h1>
            <p className="text-sm text-text-muted">
              Browse items found at Favor Church. If you recognize an item,
              please visit the information desk on Sunday or contact our office
              during the week.
            </p>
          </div>

          <PublicCatalogControls
            initialQuery={query}
            initialDateFrom={dateFrom}
            initialDateTo={dateTo}
            venues={allVenues}
            activeVenue={venueFilter}
            statusFilter={statusFilter}
          />

          <ErrorBoundary>
            <PublicCatalogResults idle={isIdle} items={items} />
          </ErrorBoundary>

          {!isIdle && <Pagination total={total} />}
        </div>
      </main>

      <footer className="border-t border-brand-dim bg-brand-deep py-10 px-6">
        <div className="mx-auto max-w-5xl space-y-6 text-center">
          <div className="mx-auto max-w-3xl rounded-xl border border-white/15 bg-white/5 p-5 text-left">
            <h2 className="font-sans text-[11px] font-black uppercase tracking-widest text-white/90">
              Disclaimer on Unclaimed Lost &amp; Found Items
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-white/80">
              To keep items moving and avoid long-term storage, Lost and Found
              disposal will happen every <strong>three (3) months</strong> or{" "}
              <strong>nine (9) weeks</strong>. Make sure to check for your lost
              item within three (3) months from the date it was lost.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-white/80">
              Any item left unclaimed after this period may be donated or
              distributed as part of the volunteer prize pool.
            </p>
          </div>
          <p className="font-sans text-xs font-black uppercase text-white tracking-normal">
            &copy; {new Date().getFullYear()}&nbsp;Favor Church &bull; Lost
            &amp; Found
          </p>
        </div>
      </footer>
    </div>
  );
}

interface VenueRow {
  slug: string;
  name: string;
  parent_slug: string | null;
  display_order: number | null;
}

interface PublicCatalogItem {
  id: string;
  name: string;
  item_code: string;
  category: string;
  category_name?: { name: string } | null;
  venue: string | null;
  venue_name?: {
    name: string;
    parent_slug: string | null;
    parent?: { name: string } | null;
  } | null;
  location: string | null;
  date_found: string;
}

function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function escapeIlikePattern(token: string): string {
  // PostgREST `or` filter parses commas/parens as syntax. Escape them along
  // with the standard ILIKE wildcards so user input cannot break the filter.
  return token
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}

function expandVenueFilter(venues: VenueRow[], slug: string): string[] {
  const target = venues.find((v) => v.slug === slug);
  if (!target) return [slug];
  if (target.parent_slug) return [slug];
  const children = venues.filter((v) => v.parent_slug === slug).map((v) => v.slug);
  return [slug, ...children];
}
