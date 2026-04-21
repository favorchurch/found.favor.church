import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border-main bg-surface flex flex-col sticky top-0 h-screen">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-brand">
              <svg viewBox="0 0 16 16" className="h-5 w-5 fill-black">
                <path d="M8 1a3 3 0 100 6A3 3 0 008 1zM4 4a4 4 0 118 0 4 4 0 01-8 0zm-2 9a6 6 0 1112 0H2z" />
              </svg>
            </div>
            <span className="font-mono text-sm font-bold tracking-widest text-text-main uppercase">
              Lost<span className="text-brand">&Found</span>
            </span>
          </div>
        </div>

        {/* Profile & Sign Out Section (Moved up) */}
        <div className="mt-auto p-4 border-t border-border-main text-center">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border-main bg-bg mb-4">
            <div className="h-8 w-8 rounded-full bg-surface-active border border-border-hover flex items-center justify-center text-[10px] font-mono text-text-muted">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text-main truncate">{user.email}</p>
              <p className="text-[10px] text-text-dim uppercase font-mono tracking-tighter">Admin Staff</p>
            </div>
          </div>
          <form action="/auth/signout" method="POST">
            <button className="flex w-full items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-red-500/80 hover:bg-red-500/10 hover:text-red-500 transition-colors">
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  );
}
