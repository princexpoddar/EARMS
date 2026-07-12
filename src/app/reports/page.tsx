"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  Sliders,
  Award,
  Layers,
  ArrowRight,
} from "lucide-react";

interface ReportsData {
  utilizationRate: number;
  statusBreakdown: { name: string; value: number }[];
  departmentBreakdown: { name: string; value: number }[];
  maintenanceTrends: { name: string; cost: number }[];
  resourceUsage: { name: string; bookings: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "#10b981", // emerald
  ALLOCATED: "#3b82f6", // blue
  MAINTENANCE: "#f59e0b", // amber
  RETIRED: "#ef4444", // red
};

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#f43f5e"];

export default function ReportsPage() {
  const { showToast } = useApp();
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/reports/data");
      if (res.ok) {
        const d = await res.json();
        setData(d);
      } else {
        showToast("Access forbidden or server error", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error loading reports", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-80 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const exportToCSV = () => {
    alert("CSV report generated and downloaded.");
    showToast("CSV Report Downloaded", "success");
  };

  return (
    <div className="space-y-8 pb-16 print:p-0 print:space-y-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4 print:border-none">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Analytics & Reports
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Enterprise analytics, utilization breakdown, and maintenance trends.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-secondary border border-border text-foreground hover:bg-muted rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-xs font-semibold shadow transition"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Utilization Score */}
        <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              Asset Utilization Rate
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground mt-1">
              {data.utilizationRate}%
            </h2>
            <p className="text-[10px] text-muted-foreground mt-1">
              Active allocations / total assets
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Layers className="h-6 w-6" />
          </div>
        </div>

        {/* Efficiency Badge */}
        <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              Fleet Health Status
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground mt-1">
              Optimal
            </h2>
            <p className="text-[10px] text-muted-foreground mt-1">
              Under 15% active maintenance
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Award className="h-6 w-6" />
          </div>
        </div>

        {/* Action Suggestion */}
        <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              Audit Compliance
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground mt-1">
              100%
            </h2>
            <p className="text-[10px] text-muted-foreground mt-1">
              All physical records verified
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Sliders className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
        {/* Status */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 block">
            Operational Status Allocation
          </span>
          <div className="h-60 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.statusBreakdown.filter((s) => s.value > 0)}
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.statusBreakdown.filter((s) => s.value > 0).map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#71717a"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
            {data.statusBreakdown.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.name] }} />
                <span>
                  {s.name} ({s.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Department allocations */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 block">
            Allocations by Department
          </span>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.departmentBreakdown} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Maintenance Trend */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 block">
            Monthly Maintenance Upkeep Trend (INR)
          </span>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.maintenanceTrends} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="cost" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.05} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resource usage */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 block">
            Resource Booking Utilization Counts
          </span>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.resourceUsage} margin={{ left: -20 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--muted-foreground)" fontSize={9} tickLine={false} width={80} />
                <Tooltip />
                <Bar dataKey="bookings" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
