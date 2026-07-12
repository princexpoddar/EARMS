"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  Laptop,
  Layers,
  Wrench,
  ArrowLeftRight,
  PlusCircle,
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

interface KPI {
  totalAssets: number;
  allocatedAssets: number;
  maintenance: number;
  pendingTransfers: number;
}

interface ChartData {
  name: string;
  value: number;
}

interface DeptData {
  name: string;
  assets: number;
}

interface TrendData {
  name: string;
  cost: number;
}

interface LogData {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  user?: {
    name: string;
    role: string;
  };
}

interface BookingData {
  id: string;
  purpose: string;
  startDate: string;
  endDate: string;
  asset: {
    name: string;
    location: string;
  };
  user: {
    name: string;
  };
}

interface StatsResponse {
  kpis: KPI;
  statusBreakdown: ChartData[];
  departmentBreakdown: DeptData[];
  maintenanceTrends: TrendData[];
  recentLogs: LogData[];
  upcomingBookings: BookingData[];
}

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "#10b981", // emerald
  ALLOCATED: "#3b82f6", // blue
  MAINTENANCE: "#f59e0b", // amber
  RETIRED: "#ef4444", // red
};

export default function DashboardPage() {
  const { user } = useApp();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {
        console.error("Failed to load dashboard statistics:", e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        {/* Skeleton Header */}
        <div className="h-10 w-64 bg-muted animate-pulse rounded-lg" />

        {/* Skeleton KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>

        {/* Skeleton Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-80 bg-card border border-border rounded-xl animate-pulse lg:col-span-1" />
          <div className="h-80 bg-card border border-border rounded-xl animate-pulse lg:col-span-2" />
        </div>

        {/* Skeleton Lists */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-80 bg-card border border-border rounded-xl animate-pulse" />
          <div className="h-80 bg-card border border-border rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Total Tracked Assets",
      value: stats.kpis.totalAssets,
      icon: Laptop,
      colorClass: "text-zinc-600 dark:text-zinc-400 bg-zinc-500/10",
      description: "Hardware and items registered",
    },
    {
      title: "Active Allocations",
      value: stats.kpis.allocatedAssets,
      icon: Layers,
      colorClass: "text-blue-500 bg-blue-500/10",
      description: "Currently assigned to users",
    },
    {
      title: "In Maintenance",
      value: stats.kpis.maintenance,
      icon: Wrench,
      colorClass: "text-amber-500 bg-amber-500/10",
      description: "Repair or diagnostics active",
    },
    {
      title: "Pending Transfers",
      value: stats.kpis.pendingTransfers,
      icon: ArrowLeftRight,
      colorClass: "text-red-500 bg-red-500/10",
      description: "Awaiting approval workflow",
    },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Welcome back, {user?.name.split(" ")[0]}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Here's the operational overview for AssetFlow. Today is{" "}
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            .
          </p>
        </div>

        {/* Quick Actions Console */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/assets?action=new"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition text-xs font-semibold shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add Asset</span>
          </Link>
          <Link
            href="/booking"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-secondary text-secondary-foreground border border-border hover:bg-muted transition text-xs font-semibold"
          >
            <Calendar className="h-4 w-4" />
            <span>Book Resource</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              className="bg-card text-card-foreground border border-border rounded-xl p-5 hover:shadow-md hover:border-muted-foreground/30 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">{kpi.title}</span>
                <div className={`p-2 rounded-lg ${kpi.colorClass}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {kpi.value}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                {kpi.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Status Breakdown (Donut) */}
        <div className="bg-card text-card-foreground border border-border rounded-xl p-5 lg:col-span-1">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 block">
            Asset Status Breakdown
          </span>
          <div className="h-56 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.statusBreakdown.filter((s) => s.value > 0)}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {stats.statusBreakdown.filter((s) => s.value > 0).map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#71717a"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    fontSize: "11px",
                    color: "var(--foreground)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Summary */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold leading-none">{stats.kpis.totalAssets}</span>
              <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                Total
              </span>
            </div>
          </div>
          {/* Custom Legends */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {stats.statusBreakdown.map((status) => (
              <div key={status.name} className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: STATUS_COLORS[status.name] || "#71717a" }}
                />
                <span className="text-[10px] font-semibold truncate text-muted-foreground uppercase">
                  {status.name}: {status.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Maintenance Spend Trend (Area Chart) */}
        <div className="bg-card text-card-foreground border border-border rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Maintenance Upkeep Costs
            </span>
            <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold bg-amber-500/10 px-2.5 py-0.5 rounded-full">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Cost Trends (USD)</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.maintenanceTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    fontSize: "11px",
                    color: "var(--foreground)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="#f59e0b"
                  fillOpacity={1}
                  fill="url(#colorCost)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid Bottom: Bookings vs Activities */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bookings */}
        <div className="bg-card text-card-foreground border border-border rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Upcoming Resource Bookings
            </span>
            <Link
              href="/booking"
              className="text-[11px] font-semibold text-primary flex items-center gap-1 hover:underline"
            >
              <span>Manage Bookings</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <div className="flex-1 space-y-3.5">
            {stats.upcomingBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                <Calendar className="h-8 w-8 opacity-30 mb-2" />
                <p className="text-xs">No active resource bookings</p>
              </div>
            ) : (
              stats.upcomingBookings.map((b) => {
                const start = new Date(b.startDate);
                return (
                  <div key={b.id} className="flex gap-4 items-start p-3 bg-muted/20 border border-border rounded-lg">
                    {/* Date Block */}
                    <div className="flex flex-col items-center justify-center shrink-0 h-12 w-12 rounded bg-secondary text-primary border border-border">
                      <span className="text-[10px] font-bold uppercase leading-none">
                        {start.toLocaleString("en-US", { month: "short" })}
                      </span>
                      <span className="text-lg font-extrabold leading-none mt-0.5">
                        {start.getDate()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{b.purpose}</p>
                      <p className="text-[11px] text-muted-foreground truncate font-medium mt-0.5">
                        {b.asset.name} · {b.asset.location}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold bg-primary/5 px-2 py-0.5 text-primary rounded-full uppercase">
                          {b.user.name}
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Activity Logs */}
        <div className="bg-card text-card-foreground border border-border rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Recent Activity Timeline
            </span>
            <span className="text-[9px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">
              Audits logged
            </span>
          </div>

          <div className="flex-1 space-y-4">
            {stats.recentLogs.map((log, index) => {
              const date = new Date(log.createdAt);
              return (
                <div key={log.id} className="relative flex gap-3 items-start group">
                  {/* Timeline vertical connector */}
                  {index < stats.recentLogs.length - 1 && (
                    <div className="absolute left-[7.5px] top-4 bottom-[-20px] w-0.5 bg-border group-hover:bg-muted-foreground/30 transition-colors" />
                  )}

                  {/* Dot */}
                  <div className="h-4 w-4 rounded-full border-2 border-border bg-card shrink-0 flex items-center justify-center z-10">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        {log.action.replace("_", " ")}
                      </span>
                      <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                      {log.details}
                    </p>
                    {log.user && (
                      <span className="inline-block text-[8px] font-semibold uppercase tracking-wider text-muted-foreground mt-1">
                        by {log.user.name} ({log.user.role})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
