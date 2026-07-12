"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { useDemo } from "@/context/DemoContext";
import {
  Menu,
  Sun,
  Moon,
  Search,
  Bell,
  CheckCheck,
  Circle,
  HelpCircle,
  Play,
} from "lucide-react";
import Link from "next/link";

interface TopbarProps {
  setMobileOpen: (open: boolean) => void;
}

export default function Topbar({ setMobileOpen }: TopbarProps) {
  const pathname = usePathname();
  const {
    theme,
    toggleTheme,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    setCommandPaletteOpen,
  } = useApp();

  const { isDemoActive, startDemo } = useDemo();

  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute breadcrumb/title from path
  const getPageTitle = () => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "Home";
    const segment = segments[0];
    switch (segment) {
      case "dashboard":
        return "Dashboard";
      case "assets":
        return "Assets Catalog";
      case "allocation":
        return "Allocations & Transfers";
      case "booking":
        return "Resource Bookings";
      case "maintenance":
        return "Maintenance Hub";
      case "reports":
        return "Analytics & Reports";
      case "notifications":
        return "Notifications Center";
      default:
        return segment.charAt(0).toUpperCase() + segment.slice(1);
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-border bg-card/85 backdrop-blur px-6 shadow-sm">
      {/* Left side: Hamburger on mobile, breadcrumb title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted sm:hidden focus:outline-none"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
            Workspace
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline">/</span>
          <span className="font-semibold text-foreground text-sm md:text-base leading-none">
            {getPageTitle()}
          </span>
        </div>
      </div>

      {/* Right side: Search, Theme, Notifications */}
      <div className="flex items-center gap-3">
        {/* Run Demo Button */}
        {!isDemoActive && (
          <button
            onClick={startDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition animate-pulse shrink-0 cursor-pointer animate-duration-1000"
          >
            <Play className="h-3.5 w-3.5 fill-white" />
            <span className="hidden sm:inline">Run Demo</span>
          </button>
        )}

        {/* Command Palette Trigger Button */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/30 hover:bg-muted text-muted-foreground text-xs font-medium w-36 sm:w-48 transition-colors duration-200"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 text-left truncate">Search assets...</span>
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[9px] font-medium leading-none text-muted-foreground">
            Ctrl K
          </kbd>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-200"
          title="Toggle Light/Dark Theme"
        >
          {theme === "light" ? (
            <Moon className="h-4.5 w-4.5" />
          ) : (
            <Sun className="h-4.5 w-4.5" />
          )}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-200"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-border bg-card p-4 shadow-xl ring-1 ring-black/5 z-30">
              <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold text-destructive">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                  >
                    <CheckCheck className="h-3 w-3" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {/* Notification list */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                    <HelpCircle className="h-8 w-8 opacity-40 mb-1.5" />
                    <p className="text-xs">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`flex gap-3 p-2.5 rounded-lg text-left cursor-pointer transition-colors duration-150 ${
                        n.read ? "hover:bg-muted/30" : "bg-primary/5 hover:bg-primary/10 border-l-2 border-primary"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className={`text-xs font-semibold truncate ${n.read ? "text-foreground" : "text-primary"}`}>
                            {n.title}
                          </p>
                          <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-border pt-2.5 mt-3 text-center">
                <Link
                  href="/notifications"
                  onClick={() => setNotifOpen(false)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  View all in Notifications Center
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
