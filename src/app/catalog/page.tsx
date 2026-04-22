import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { ItemCard, type Item } from "@/components/ui/ItemCard";
import { Search, LogOut } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { PAGE_SIZE } from "@/utils/constants";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "Public Catalog | Lost & Found — Favor Church",
  description: "Browse items found at Favor Church. If you recognize an item, please visit the information desk.",
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const statusFilter = params.status || "unclaimed";
  const page = Math.max(1, Number(params.page) || 1);

  const supabase = await createClient();

  let baseQuery = supabase
    .from("found_items")
    .select("*", { count: "exact" })
    .eq("is_public", true)
    .is("archived_at", null)
    .order("date_found", { ascending: false });

  if (query) {
    baseQuery = baseQuery.ilike("name", `%${query}%`);
  }

  if (statusFilter !== "all") {
    baseQuery = baseQuery.eq("status", statusFilter);
  }

  const from = (page - 1) * PAGE_SIZE;
  const { data: items, count, error } = await baseQuery
    .range(from, from + PAGE_SIZE - 1);

  const { data: { user } } = await supabase.auth.getUser();

  if (error) {
    console.error("Error fetching items:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }

  const total = count ?? 0;

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border-main bg-surface px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-brand">
            <svg viewBox="0 0 16 16" className="h-4 w-4 fill-black">
              <path d="M8 1a3 3 0 100 6A3 3 0 008 1zM4 4a4 4 0 118 0 4 4 0 01-8 0zm-2 9a6 6 0 1112 0H2z" />
            </svg>
          </div>
          <span className="font-mono text-xs font-bold tracking-widest text-text-main uppercase">
            Lost<span className="text-brand">&Found</span> <span className="ml-2 text-text-dim font-normal">Catalog</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {user.email && (await import("@/utils/admin")).isAdmin(user.email) && (
                <a
                  href="/admin/dashboard"
                  className="text-[10px] font-mono text-brand hover:text-brand-bright uppercase transition-colors"
                >
                  Admin Dashboard
                </a>
              )}
              <form action="/auth/signout" method="POST">
                <button
                  type="submit"
                  className="flex items-center gap-2 text-[10px] font-mono text-red-500/70 hover:text-red-500 uppercase transition-colors"
                >
                  <LogOut className="h-3 w-3" />
                  Logout
                </button>
              </form>
            </>
          ) : (
            <a
              href="/login"
              className="text-[10px] font-mono text-text-dim hover:text-brand uppercase transition-colors"
            >
              Staff Login
            </a>
          )}
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-7xl">
          {/* Welcome & Search Section */}
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-brand">Public Catalog</h1>
              <p className="text-sm text-text-muted">
                Browse items found at Favor Church. If you recognize an item, please visit the information desk on Sunday or contact our office during the week.
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
                {statusFilter !== "all" && <input type="hidden" name="status" value={statusFilter} />}
              </form>
            </div>
          </div>

          {/* Grid */}
          <ErrorBoundary>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items && items.length > 0 ? (
                items.map((item) => <ItemCard key={item.id} item={item as Item} hideImage={true} hideStatus={true} />)
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-border-main py-20 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-hover">
                    <Search className="h-6 w-6 text-text-dim" />
                  </div>
                  <h3 className="text-sm font-medium text-text-muted">No items found</h3>
                  <p className="mt-1 text-xs text-text-dim">Try adjusting your search or filters.</p>
                </div>
              )}
            </div>
          </ErrorBoundary>

          <Pagination total={total} />
        </div>
      </main>

      <footer className="border-t border-border-main bg-surface py-8 px-6 text-center">
        <p className="font-mono text-[10px] uppercase text-text-dim tracking-widest">
          &copy; {new Date().getFullYear()} Favor Church &bull; Found Favor Church
        </p>
      </footer>
    </div>
  );
}
