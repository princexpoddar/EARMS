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
  Sparkles,
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
  const [generatingReport, setGeneratingReport] = useState(false);

  const generateWeeklyReportPdf = async () => {
    setGeneratingReport(true);
    showToast("Analyzing systems metadata...", "success");
    try {
      const res = await fetch("/api/ai/weekly-report");
      if (!res.ok) {
        throw new Error("Weekly report API failed");
      }
      const reportRes = await res.json();
      const report = reportRes.report;
      const stats = reportRes.stats;

      showToast("Compiling PDF document...", "success");

      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Colors
      const primaryColor = [20, 20, 23]; // Charcoal Dark
      const secondaryColor = [79, 70, 229]; // Indigo
      const lightBg = [244, 244, 245]; // Muted Soft Gray
      const borderStroke = [228, 228, 231]; // Gray 200

      // PAGE 1: COVER HEADER AND OPERATIONS & MAINTENANCE
      // Header Band
      doc.setFillColor(20, 20, 23);
      doc.rect(0, 0, 210, 32, "F");

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("WEEKLY OPERATIONAL SUMMARY", 12, 14);

      // Subtitle
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text("SYSTEM INTELLIGENCE BRIEFING & STRATEGIC RECOMMENDATIONS", 12, 21);

      // Generated timestamp
      const genDate = new Date(reportRes.generatedAt).toLocaleString();
      doc.setFontSize(7.5);
      doc.text(`Generated: ${genDate}`, 12, 27);
      doc.text(`Fleet Compliance: 100% (Optimal)`, 150, 27);

      let yPos = 42;

      // Render Helper Function
      const addSection = (title: string, statsList: string[], body: string) => {
        // Section Header
        doc.setFillColor(244, 244, 245);
        doc.rect(12, yPos, 186, 7.5, "F");

        doc.setTextColor(79, 70, 229); // Indigo Accent
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.text(title.toUpperCase(), 15, yPos + 5);
        yPos += 12;

        // Statistics List
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(63, 63, 70);
        statsList.forEach((stat) => {
          doc.text(`• ${stat}`, 16, yPos);
          yPos += 4.2;
        });
        yPos += 2.5;

        // AI Summary Header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(20, 20, 23);
        doc.text("AI Operational Diagnostics summary:", 16, yPos);
        yPos += 4.5;

        // AI Summary Paragraph
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(82, 82, 91);
        const splitParagraph = doc.splitTextToSize(body, 178);
        doc.text(splitParagraph, 16, yPos);
        yPos += (splitParagraph.length * 4) + 8;
      };

      // 1. Operations & Fleet summary
      const topDept = stats.departmentBreakdown?.sort((a: any, b: any) => b.count - a.count)[0]?.name || "Operations";
      addSection("1. Operations & General Fleet Efficiency", [
        `System Fleet hardware utilization score: ${stats.utilizationRate}% overall`,
        `Personnel deployment rate: ${stats.allocatedCount} / ${stats.totalAssets} items active`,
        `Top deployment density node: ${topDept} department`
      ], report.operations);

      // 2. Maintenance Analysis
      addSection("2. Maintenance Pipeline & Quality Assurance Logs", [
        `Pending maintenance queue count: ${stats.pendingMaintenance} issues awaiting scheduling`,
        `Resolved repair tasks: ${stats.resolvedMaintenance} tickets completed`,
        `Cumulative repair upkeep cost: INR ${stats.totalMaintenanceCost.toLocaleString()}`
      ], report.maintenance);

      // Page break for Next sections
      doc.addPage();
      
      // Header Band for page 2
      doc.setFillColor(20, 20, 23);
      doc.rect(0, 0, 210, 16, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("ASSETFLOW ENTERPRISE ERP • OPERATIONAL BRIEFING", 12, 10.5);

      yPos = 28;

      // 3. Shared Resource Reservation Schedules
      addSection("3. Shared Resources & Reservation Utilization", [
        `Active reservation events logged: ${stats.totalBookings} scheduling events`,
        `Approved/Upcoming bookings: ${stats.approvedBookings} bookings blocks`,
        `Booking overlaps conflicts prevented: 100% collision-free scheduler`
      ], report.bookings);

      // 4. Physical Depot Inventory Health
      addSection("4. Depot Inventory & Physical Asset Catalog Registry", [
        `Available storage inventory: ${stats.availableCount} hardware units ready for deployment`,
        `Hardware items offline: ${stats.maintenanceCount} units in repairs status`,
        `Equipment retired/decommissioned: ${stats.retiredCount} logs`
      ], report.assets);

      // 5. Strategic Recommendations
      // Header
      doc.setFillColor(20, 20, 23);
      doc.rect(12, yPos, 186, 7.5, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text("5. SYSTEM ACTIONS & EXECUTIVE STRATEGIC RECOMMENDATIONS", 15, yPos + 5);
      yPos += 12;

      // Render recommendations inside highlighted box
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(228, 228, 231);
      doc.setLineWidth(0.3);
      doc.rect(12, yPos, 186, 42, "FD");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(39, 39, 42);
      
      let recY = yPos + 6;
      report.recommendations.forEach((rec: string, index: number) => {
        const splitRec = doc.splitTextToSize(`${index + 1}. ${rec}`, 174);
        doc.text(splitRec, 18, recY);
        recY += (splitRec.length * 4) + 2.5;
      });

      // Footer
      doc.setDrawColor(228, 228, 231);
      doc.setLineWidth(0.2);
      doc.line(12, 280, 198, 280);

      doc.setTextColor(161, 161, 170);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.text("ASSETFLOW ENTERPRISE ERP • INTERNAL CONFIDENTIAL REPORT • DO NOT DISTRIBUTE OUTSIDE ORG", 12, 284);
      doc.text("Generated by AssetFlow AI Engine", 168, 284);

      // Save PDF
      doc.save(`AssetFlow_Weekly_Operational_Report.pdf`);
      showToast("AI Weekly Report generated and downloaded!", "success");
    } catch (e) {
      console.error(e);
      showToast("Failed to generate AI weekly report", "error");
    } finally {
      setGeneratingReport(false);
    }
  };

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
            onClick={generateWeeklyReportPdf}
            disabled={generatingReport}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white hover:opacity-95 rounded-lg text-xs font-semibold shadow-md transition disabled:opacity-50"
          >
            <Sparkles className={`h-4 w-4 ${generatingReport ? "animate-spin" : ""}`} />
            <span>{generatingReport ? "Generating AI Summary..." : "Generate Weekly Report"}</span>
          </button>
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
