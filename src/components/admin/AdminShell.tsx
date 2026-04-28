"use client";

import React, { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { Menu } from "lucide-react";
import { cn } from "@/utils/cn";

interface AdminShellProps {
  user: {
    email?: string;
  };
  children: React.ReactNode;
  modal: React.ReactNode;
}

export function AdminShell({ user, children, modal }: AdminShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("admin-sidebar-collapsed");
      return saved === "true";
    }
    return false;
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Persistence for desktop collapse state
  // Initial state is handled by useState lazy initializer

  const handleSetCollapsed = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    localStorage.setItem("admin-sidebar-collapsed", String(collapsed));
  };

  return (
    <div className="flex min-h-screen bg-bg text-text-main">
      {/* Sidebar Component */}
      <AdminSidebar
        user={user}
        isCollapsed={isCollapsed}
        setIsCollapsed={handleSetCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 flex items-center justify-between px-4 border-b border-brand-dim bg-brand-deep sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-white">
              <svg viewBox="0 0 16 16" className="h-5 w-5 fill-brand">
                <path d="M8 1a3 3 0 100 6A3 3 0 008 1zM4 4a4 4 0 118 0 4 4 0 01-8 0zm-2 9a6 6 0 1112 0H2z" />
              </svg>
            </div>
            <span className="font-sans text-base font-black tracking-widest text-white uppercase">
               Lost<span className="text-white/80">&Found</span>
            </span>
          </div>
          
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 -mr-2 text-white/80 hover:text-white"
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
        </header>

        {/* Main Content Area */}
        <main className={cn(
          "flex-1 min-h-0 overflow-auto relative"
        )}>
            {children}
           {modal}
        </main>
      </div>
    </div>
  );
}
