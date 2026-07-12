"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  LayoutDashboard,
  Laptop,
  ArrowLeftRight,
  Calendar,
  Wrench,
  BarChart3,
  Bell,
  LogOut,
  Menu,
  X,
  Shield,
  Layers,
} from "lucide-react";

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, unreadCount } = useApp();

  const links = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["ADMIN", "MANAGER", "EMPLOYEE"],
    },
    {
      name: "Assets",
      href: "/assets",
      icon: Laptop,
      roles: ["ADMIN", "MANAGER", "EMPLOYEE"],
    },
    {
      name: "Allocations & Transfers",
      href: "/allocation",
      icon: ArrowLeftRight,
      roles: ["ADMIN", "MANAGER", "EMPLOYEE"],
    },
    {
      name: "Resource Bookings",
      href: "/booking",
      icon: Calendar,
      roles: ["ADMIN", "MANAGER", "EMPLOYEE"],
    },
    {
      name: "Maintenance Hub",
      href: "/maintenance",
      icon: Wrench,
      roles: ["ADMIN", "MANAGER", "EMPLOYEE"],
    },
    {
      name: "Analytics & Reports",
      href: "/reports",
      icon: BarChart3,
      roles: ["ADMIN", "MANAGER"],
    },
    {
      name: "Notifications",
      href: "/notifications",
      icon: Bell,
      roles: ["ADMIN", "MANAGER", "EMPLOYEE"],
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
  ];

  const filteredLinks = links.filter(
    (link) => user && link.roles.includes(user.role)
  );

  const sidebarContent = (
    <div className="flex h-full flex-col border-r border-border bg-card text-card-foreground">
      {/* Logo Area */}
      <div className="flex h-16 items-center px-6 gap-2 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black tracking-wider shadow-md">
          AF
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-base leading-none tracking-tight">AssetFlow</span>
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mt-0.5">Enterprise ERP</span>
        </div>
      </div>

      {/* Nav Links */}
      <div className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
        {filteredLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-secondary text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span>{link.name}</span>
              </div>
              {link.badge !== undefined && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Profile/Logout Area */}
      {user && (
        <div className="border-t border-border p-4 bg-muted/20">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary border border-border">
              {user.role === "ADMIN" ? (
                <Shield className="h-5 w-5 text-primary" />
              ) : (
                <Layers className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate leading-tight text-foreground">
                {user.name}
              </span>
              <span className="text-[10px] text-muted-foreground truncate uppercase font-bold tracking-wider mt-0.5">
                {user.role} {user.department ? `· ${user.department.name}` : ""}
              </span>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors duration-200"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 z-50 transform md:hidden transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
