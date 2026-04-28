"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Layers, Settings, Globe, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { cn } from "@/utils/cn"; // Checking if this utility exists, if not I'll use clsx

interface AdminSidebarProps {
  user: {
    email?: string;
  };
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export function AdminSidebar({ 
  user, 
  isCollapsed, 
  setIsCollapsed, 
  isMobileOpen, 
  setIsMobileOpen 
}: AdminSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/admin/dashboard",
      label: "Items",
      icon: Layers,
    },
    {
      href: "/admin/settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity duration-300",
          isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-brand-deep border-r border-brand-dim transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen shadow-xl",
          isCollapsed ? "w-20" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header/Logo Section */}
        <div className={cn(
          "flex items-center transition-all duration-300",
          isCollapsed ? "p-4 justify-center" : "p-6 justify-between"
        )}>
          <div className={cn(
            "flex items-center gap-3 transition-all duration-300 overflow-hidden shrink-0",
            isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}>
            <div className="flex h-8 w-8 items-center justify-center rounded bg-white shrink-0">
               <svg viewBox="0 0 16 16" className="h-5 w-5 fill-brand">
                <path d="M8 1a3 3 0 100 6A3 3 0 008 1zM4 4a4 4 0 118 0 4 4 0 01-8 0zm-2 9a6 6 0 1112 0H2z" />
              </svg>
            </div>
            <span className="font-sans text-base font-black tracking-normal text-white uppercase whitespace-nowrap">
              Lost<span className="text-white/80">&Found</span>
            </span>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 -mr-2 text-white/70 hover:text-white transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Collapse Toggle (Desktop only) */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 hover:bg-white/10 text-white/70 hover:text-white transition-colors shrink-0"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href} 
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-sans font-black uppercase tracking-normal transition-all group",
                isActive(item.href) 
                  ? "text-white bg-white/20" 
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className={cn(
                "h-4 w-4 shrink-0 transition-opacity",
                isActive(item.href) ? "opacity-100" : "opacity-40 group-hover:opacity-100"
              )} />
              <span className={cn(
                "transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap",
                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              )}>
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        {/* Secondary Links */}
        <div className="px-4 py-4 border-t border-border-main/50 mb-2">
          <Link 
            href="/catalog" 
            target="_blank"
            className={cn(
              "flex items-center gap-3 px-4 py-2 text-[10px] font-sans font-bold uppercase tracking-normal text-white/60 hover:text-white transition-colors",
              isCollapsed && "justify-center px-0"
            )}
            title="Public Catalog"
          >
            <Globe className="h-3 w-3 shrink-0" />
            <span className={cn(
              "transition-opacity duration-300",
              isCollapsed ? "opacity-0 invisible" : "opacity-100"
            )}>
              Public Catalog
            </span>
          </Link>
        </div>

        {/* Profile Section */}
        <div className="mt-auto p-4 border-t border-border-main">
          <div className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg border border-white/20 bg-white/10 mb-4 transition-all duration-300",
            isCollapsed ? "px-2 justify-center" : "px-4"
          )}>
            <div className="h-8 w-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[10px] font-sans text-white/80 shrink-0">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className={cn(
              "flex-1 min-w-0 transition-opacity duration-300",
              isCollapsed ? "opacity-0 invisible" : "opacity-100"
            )}>
              <p className="text-xs font-medium text-white truncate">{user.email}</p>
              <p className="text-[10px] text-white/60 uppercase font-sans tracking-tighter">Admin Staff</p>
            </div>
          </div>
          <form action="/auth/signout" method="POST">
            <button className={cn(
              "flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm text-white/80 hover:bg-white/10 hover:text-white transition-all",
              isCollapsed ? "justify-center" : "justify-start"
            )} title="Sign Out">
              <LogOut className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span>Sign Out</span>}
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
