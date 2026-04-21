"use client";

import React, { useState, useEffect } from "react";
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Persistence for desktop collapse state
  useEffect(() => {
    const saved = localStorage.getItem("admin-sidebar-collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

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
        <header className="lg:hidden h-16 flex items-center justify-between px-4 border-b border-border-main bg-surface sticky top-0 z-30">
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
          
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 -mr-2 text-text-muted hover:text-brand"
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
