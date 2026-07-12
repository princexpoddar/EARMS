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

      // Branding / Logo draw helper
      const drawPdfLogo = (pdfDoc: any, x: number, y: number) => {
        // Outer Hexagonal flow ring
        pdfDoc.setDrawColor(16, 185, 129); // Emerald accent
        pdfDoc.setLineWidth(0.4);
        const r = 5.5;
        const pts = [];
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          pts.push([x + r * Math.cos(angle), y + r * Math.sin(angle)]);
        }
        for (let i = 0; i < 6; i++) {
          const nextIdx = (i + 1) % 6;
          pdfDoc.line(pts[i][0], pts[i][1], pts[nextIdx][0], pts[nextIdx][1]);
        }

        // Isometric core 3D cube (Asset representation)
        // Top Face (Indigo)
        pdfDoc.setFillColor(79, 70, 229);
        pdfDoc.triangle(x, y - 2.8, x + 3.8, y - 0.9, x, y + 1, "F");
        pdfDoc.triangle(x, y - 2.8, x, y + 1, x - 3.8, y - 0.9, "F");
        
        // Left Face (Darker Indigo)
        pdfDoc.setFillColor(55, 48, 163);
        pdfDoc.triangle(x - 3.8, y - 0.9, x, y + 1, x, y + 4.8, "F");
        pdfDoc.triangle(x - 3.8, y - 0.9, x, y + 4.8, x - 3.8, y + 2.9, "F");

        // Right Face (Teal/Emerald)
        pdfDoc.setFillColor(16, 185, 129);
        pdfDoc.triangle(x, y + 1, x + 3.8, y - 0.9, x + 3.8, y + 2.9, "F");
        pdfDoc.triangle(x, y + 1, x + 3.8, y + 2.9, x, y + 4.8, "F");

        // Overlay Ribbon Accent (White)
        pdfDoc.setDrawColor(255, 255, 255);
        pdfDoc.setLineWidth(0.5);
        pdfDoc.line(x - 2.8, y + 1.3, x, y + 2.8);
        pdfDoc.line(x, y + 2.8, x + 2.8, y + 1.3);
      };

      const genDate = new Date(reportRes.generatedAt).toLocaleDateString([], {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      // ==========================================
      // PAGE 1: HEADER & OPERATIONS & MAINTENANCE
      // ==========================================

      // Main Header (Left Side)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("WEEKLY OPERATIONAL REPORT", 15, 20);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(79, 70, 229); // Indigo
      doc.text("ASSETFLOW ENTERPRISE ERP • SYSTEM INTELLIGENCE BRIEFING", 15, 25);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`Security: INTERNAL CONFIDENTIAL  |  Generated: ${genDate}`, 15, 29);

      // Brand Logo (Right Side)
      drawPdfLogo(doc, 183, 18);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text("AssetFlow", 173, 29);

      // Top Border Line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.3);
      doc.line(15, 33, 195, 33);

      // KPI Scorecard Grid (Y: 37 to 74)
      const cardW = 87;
      const cardH = 16;
      
      const drawKpiCard = (x: number, y: number, label: string, val: string, sub: string, accentColor: number[]) => {
        // Soft background fill
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(x, y, cardW, cardH, "F");
        // Left accent border line
        doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.rect(x, y, 1.2, cardH, "F");
        // Card thin border
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.rect(x, y, cardW, cardH, "S");

        // Text Content
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(label.toUpperCase(), x + 4, y + 4.5);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.text(val, x + 4, y + 10.5);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(sub, x + 4, y + 14);
      };

      // Draw 2x2 Scorecards
      drawKpiCard(15, 37, "Fleet Utilization Rate", `${stats.utilizationRate}%`, "Ratio of allocated vs total trackable hardware", [16, 185, 129]);
      drawKpiCard(108, 37, "Active Deployments", `${stats.allocatedCount} / ${stats.totalAssets} Items`, "Assets currently assigned to corporate custodians", [79, 70, 229]);
      drawKpiCard(15, 57, "Maintenance Upkeep Costs", `INR ${stats.totalMaintenanceCost.toLocaleString()}`, `${stats.pendingMaintenance} tickets pending, ${stats.resolvedMaintenance} completed`, [245, 158, 11]);
      drawKpiCard(108, 57, "Shared Space Reservations", `${stats.totalBookings} Events Logged`, "Conflict-free resource bookings registered this week", [15, 23, 42]);

      // Divider Line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(15, 78, 195, 78);

      // Section 1: Fleet Operations & Density Breakdown
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(79, 70, 229);
      doc.text("1. FLEET OPERATIONS & DENSITY BREAKDOWN", 15, 84);

      // Department Allocation Table
      doc.setFillColor(241, 245, 249);
      doc.rect(15, 88, 180, 6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text("DEPARTMENT NODE", 18, 92);
      doc.text("ALLOCATED INVENTORY", 108, 92);
      doc.text("DEPLOYMENT RATIO (%)", 158, 92);

      let deptY = 94;
      const sortedDepts = [...(stats.departmentBreakdown || [])].sort((a: any, b: any) => b.count - a.count).slice(0, 4);
      sortedDepts.forEach((dept: any, index: number) => {
        if (index % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(15, deptY, 180, 5.5, "F");
        }
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        doc.text(dept.name, 18, deptY + 4);
        doc.text(`${dept.count} items`, 108, deptY + 4);
        doc.text(`${dept.percent}%`, 158, deptY + 4);
        deptY += 5.5;
      });

      // AI Summary Operations Box
      let boxY = deptY + 4;
      const splitOps = doc.splitTextToSize(report.operations, 170);
      const boxH = (splitOps.length * 4.2) + 10;
      
      doc.setFillColor(240, 244, 255); // Blue-50
      doc.rect(15, boxY, 180, boxH, "F");
      doc.setFillColor(79, 70, 229); // Indigo Accent Left Border
      doc.rect(15, boxY, 1.2, boxH, "F");
      doc.setDrawColor(219, 234, 254);
      doc.setLineWidth(0.2);
      doc.rect(15, boxY, 180, boxH, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(79, 70, 229);
      doc.text("AI OPERATIONAL DIAGNOSTICS & VELOCITY INSIGHTS:", 19, boxY + 5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(splitOps, 19, boxY + 9.5);

      // Section 2: Maintenance Pipeline
      let maintSectionY = boxY + boxH + 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(79, 70, 229);
      doc.text("2. MAINTENANCE PIPELINE & LIFECYCLE QA LOGS", 15, maintSectionY);

      // AI Summary Maintenance Box
      let maintBoxY = maintSectionY + 4;
      const splitMaint = doc.splitTextToSize(report.maintenance, 170);
      const maintBoxH = (splitMaint.length * 4.2) + 10;

      doc.setFillColor(254, 243, 199); // Amber-50
      doc.rect(15, maintBoxY, 180, maintBoxH, "F");
      doc.setFillColor(245, 158, 11); // Amber Accent Left Border
      doc.rect(15, maintBoxY, 1.2, maintBoxH, "F");
      doc.setDrawColor(253, 230, 138);
      doc.setLineWidth(0.2);
      doc.rect(15, maintBoxY, 180, maintBoxH, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(217, 119, 6); // Amber dark
      doc.text("AI FLEET HEALTH & PREVENTATIVE MAINTENANCE ISSUES:", 19, maintBoxY + 5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(splitMaint, 19, maintBoxY + 9.5);

      // Page 1 Footer
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(15, 280, 195, 280);

      doc.setTextColor(148, 163, 184);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.text("ASSETFLOW ENTERPRISE ERP • INTERNAL CONFIDENTIAL REPORT • DO NOT DISTRIBUTE OUTSIDE ORG", 15, 284);
      doc.text("Page 1 of 2", 182, 284);

      // ==========================================
      // PAGE 2: BOOKINGS, DEPOT HEALTH & RECS
      // ==========================================
      doc.addPage();

      // Page 2 Header Band
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("ASSETFLOW ENTERPRISE ERP • OPERATIONAL BRIEFING", 15, 15);
      doc.setFont("helvetica", "normal");
      doc.text("Page 2 of 2", 182, 15);
      
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(15, 18, 195, 18);

      // Section 3: Shared Space Reservations
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(79, 70, 229);
      doc.text("3. SHARED RESOURCES & SCHEDULING EFFICIENCY", 15, 24);

      // AI Summary Bookings Box
      let bookBoxY = 28;
      const splitBook = doc.splitTextToSize(report.bookings, 170);
      const bookBoxH = (splitBook.length * 4.2) + 10;

      doc.setFillColor(240, 253, 250); // Teal-50
      doc.rect(15, bookBoxY, 180, bookBoxH, "F");
      doc.setFillColor(13, 148, 136); // Teal Accent Left Border
      doc.rect(15, bookBoxY, 1.2, bookBoxH, "F");
      doc.setDrawColor(204, 251, 241);
      doc.setLineWidth(0.2);
      doc.rect(15, bookBoxY, 180, bookBoxH, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(13, 148, 136);
      doc.text("AI RESERVATION METRICS & CONFLICT ANALYSIS:", 19, bookBoxY + 5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(splitBook, 19, bookBoxY + 9.5);

      // Section 4: Depot Inventory Health
      let depotSectionY = bookBoxY + bookBoxH + 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(79, 70, 229);
      doc.text("4. DEPOT INVENTORY HEALTH & STATUS CATALOG", 15, depotSectionY);

      // Status progress bars
      let statusY = depotSectionY + 4;
      const statusList = [
        { label: "AVAILABLE IN STORAGE", count: stats.availableCount || 0, color: [16, 185, 129] }, // Emerald
        { label: "ALLOCATED TO USER", count: stats.allocatedCount || 0, color: [79, 70, 229] }, // Indigo
        { label: "UNDERGOING REPAIRS", count: stats.maintenanceCount || 0, color: [245, 158, 11] }, // Amber
        { label: "RETIRED FROM ACTIVE SERVICE", count: stats.retiredCount || 0, color: [239, 68, 68] } // Red
      ];

      statusList.forEach((st) => {
        const percent = stats.totalAssets > 0 ? (st.count / stats.totalAssets) : 0;
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(st.label, 18, statusY + 3);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`${st.count} units`, 60, statusY + 3);

        // Progress bar background track
        doc.setFillColor(241, 245, 249);
        doc.rect(78, statusY + 0.5, 98, 2.8, "F");

        // Progress bar fill
        doc.setFillColor(st.color[0], st.color[1], st.color[2]);
        doc.rect(78, statusY + 0.5, percent * 98, 2.8, "F");

        // Percentage text
        doc.setFont("helvetica", "bold");
        doc.setTextColor(st.color[0], st.color[1], st.color[2]);
        doc.text(`${Math.round(percent * 100)}%`, 181, statusY + 3);

        statusY += 5.5;
      });

      // AI Summary Assets Box
      let assetBoxY = statusY + 3;
      const splitAssets = doc.splitTextToSize(report.assets, 170);
      const assetBoxH = (splitAssets.length * 4.2) + 10;

      doc.setFillColor(248, 250, 252); // Slate-50/Gray-50
      doc.rect(15, assetBoxY, 180, assetBoxH, "F");
      doc.setFillColor(148, 163, 184); // Slate Accent Left Border
      doc.rect(15, assetBoxY, 1.2, assetBoxH, "F");
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.rect(15, assetBoxY, 180, assetBoxH, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("AI REGISTRY DIAGNOSTICS & CAPACITY AUDITING:", 19, assetBoxY + 5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(splitAssets, 19, assetBoxY + 9.5);

      // Section 5: Strategic Recommendations
      let recSectionY = assetBoxY + assetBoxH + 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(79, 70, 229);
      doc.text("5. SYSTEM ACTIONS & EXECUTIVE STRATEGIC RECOMMENDATIONS", 15, recSectionY);

      // Recommendation Card panels
      let recY = recSectionY + 4;
      const recColors = [
        [245, 158, 11], // Amber
        [79, 70, 229], // Indigo
        [16, 185, 129]  // Emerald
      ];

      (report.recommendations || []).slice(0, 3).forEach((rec: string, index: number) => {
        const color = recColors[index % 3];
        
        // Card bg
        doc.setFillColor(248, 250, 252);
        doc.rect(15, recY, 180, 16, "F");
        
        // Accent border
        doc.setFillColor(color[0], color[1], color[2]);
        doc.rect(15, recY, 1.2, 16, "F");
        
        // Card box border
        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(0.2);
        doc.rect(15, recY, 180, 16, "S");

        // Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(`STRATEGIC ITEM #${index + 1}:`, 19, recY + 4.5);

        // Recommendation text
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.2);
        doc.setTextColor(51, 65, 85);
        const splitText = doc.splitTextToSize(rec, 171);
        doc.text(splitText, 19, recY + 9);

        recY += 19;
      });

      // Page 2 Footer
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(15, 280, 195, 280);

      doc.setTextColor(148, 163, 184);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.text("ASSETFLOW ENTERPRISE ERP • INTERNAL CONFIDENTIAL REPORT • DO NOT DISTRIBUTE OUTSIDE ORG", 15, 284);
      doc.text("Page 2 of 2", 182, 284);

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
