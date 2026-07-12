"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle,
  HelpCircle,
  PlusCircle,
  Play,
  Check,
  X,
  ChevronRight,
  User,
  Calendar,
  DollarSign,
} from "lucide-react";

interface Ticket {
  id: string;
  assetId: string;
  asset: { name: string; tag: string; status: string };
  reporterId: string;
  reporter: { name: string; email: string };
  description: string;
  priority: string; // LOW, MEDIUM, HIGH, CRITICAL
  status: string; // PENDING, APPROVED, IN_PROGRESS, RESOLVED
  cost: number;
  scheduledDate: string | null;
  completedDate: string | null;
  comments: string | null;
  createdAt: string;
}

interface UserAsset {
  id: string;
  name: string;
  tag: string;
}

export default function MaintenancePage() {
  const { user, showToast } = useApp();
  const isAdminOrManager = user?.role === "ADMIN" || user?.role === "MANAGER";

  // Data States
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [myAssets, setMyAssets] = useState<UserAsset[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [reportOpen, setReportOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);

  // Selected Ticket for Actions
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Form Inputs
  const [reportAssetId, setReportAssetId] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportPriority, setReportPriority] = useState("MEDIUM");

  const [approveScheduledDate, setApproveScheduledDate] = useState("");
  const [approveCost, setApproveCost] = useState("");

  const [resolveCost, setResolveCost] = useState("");
  const [resolveComments, setResolveComments] = useState("");

  const [processingId, setProcessingId] = useState<string | null>(null);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch tickets
      const res = await fetch("/api/maintenance");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }

      // 2. Fetch my assets (for reporting)
      const assetsRes = await fetch("/api/assets");
      if (assetsRes.ok) {
        const data = await assetsRes.json();
        const allAssets: any[] = data.assets || [];
        // Only load assets currently allocated to the employee
        if (isAdminOrManager) {
          setMyAssets(allAssets.filter((a) => a.status !== "RETIRED"));
        } else {
          setMyAssets(allAssets.filter((a) => a.currentUserId === user?.id));
        }
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to load maintenance tracker", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Report Issue Submit
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportAssetId || !reportDescription) {
      showToast("Please fill in description and select asset", "error");
      return;
    }

    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: reportAssetId,
          description: reportDescription,
          priority: reportPriority,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Maintenance issue logged successfully!", "success");
        setReportOpen(false);
        setReportAssetId("");
        setReportDescription("");
        setReportPriority("MEDIUM");
        loadData();
      } else {
        showToast(data.error || "Failed to log issue", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    }
  };

  // Open Approve Modal
  const openApproveModal = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setApproveScheduledDate(new Date().toISOString().split("T")[0]);
    setApproveCost("");
    setApproveOpen(true);
  };

  // Handle Approve Submit
  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      const res = await fetch(`/api/maintenance/${selectedTicket.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledDate: approveScheduledDate,
          cost: approveCost || "0.0",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Ticket approved and asset moved to maintenance state!", "success");
        setApproveOpen(false);
        setSelectedTicket(null);
        loadData();
      } else {
        showToast(data.error || "Failed to approve ticket", "error");
      }
    } catch (err) {
      showToast("Error processing approval", "error");
    }
  };

  // Handle Start Work
  const handleStartWork = async (ticketId: string) => {
    setProcessingId(ticketId);
    try {
      const res = await fetch(`/api/maintenance/${ticketId}/start`, {
        method: "POST",
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Technician work started!", "success");
        loadData();
      } else {
        showToast(data.error || "Failed to start work", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    } finally {
      setProcessingId(null);
    }
  };

  // Open Resolve Modal
  const openResolveModal = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setResolveCost(ticket.cost > 0 ? ticket.cost.toString() : "");
    setResolveComments("");
    setResolveOpen(true);
  };

  // Handle Resolve Submit
  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      const res = await fetch(`/api/maintenance/${selectedTicket.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cost: resolveCost || "0.0",
          comments: resolveComments,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Issue resolved and asset released back to operations!", "success");
        setResolveOpen(false);
        setSelectedTicket(null);
        loadData();
      } else {
        showToast(data.error || "Failed to resolve ticket", "error");
      }
    } catch (err) {
      showToast("Error resolving ticket", "error");
    }
  };

  // Columns definition
  const columns = [
    { id: "PENDING", title: "Pending", icon: Clock, colorClass: "text-zinc-500 bg-zinc-500/10" },
    { id: "APPROVED", title: "Approved / Scheduled", icon: Calendar, colorClass: "text-blue-500 bg-blue-500/10" },
    { id: "IN_PROGRESS", title: "In Progress", icon: Wrench, colorClass: "text-amber-500 bg-amber-500/10" },
    { id: "RESOLVED", title: "Resolved", icon: CheckCircle, colorClass: "text-emerald-500 bg-emerald-500/10" },
  ];

  // Helper for priority color
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "HIGH":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "MEDIUM":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Maintenance Hub
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log maintenance issues, coordinate technician repairs, and track upkeep costs.
          </p>
        </div>

        <button
          onClick={() => {
            if (myAssets.length === 0) {
              showToast("You have no active allocated assets to report issues for.", "info");
              return;
            }
            setReportOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-xs font-semibold shadow transition-all duration-200"
        >
          <PlusCircle className="h-4.5 w-4.5" />
          <span>Report Issue</span>
        </button>
      </div>

      {/* Kanban Board Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-80 bg-card rounded-xl border border-border animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {columns.map((col) => {
            const ColumnIcon = col.icon;
            const columnTickets = tickets.filter((t) => t.status === col.id);

            return (
              <div key={col.id} className="bg-card border border-border rounded-xl p-4 flex flex-col max-h-[75vh]">
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-border pb-3 mb-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded ${col.colorClass}`}>
                      <ColumnIcon className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-xs text-foreground tracking-tight">
                      {col.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                    {columnTickets.length}
                  </span>
                </div>

                {/* Tickets list */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {columnTickets.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground/40 italic text-xs">
                      No tickets
                    </div>
                  ) : (
                    columnTickets.map((t) => (
                      <div
                        key={t.id}
                        className="bg-card border border-border rounded-lg p-3 space-y-3.5 hover:shadow transition-shadow"
                      >
                        {/* Upper row: Tag & Priority */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[9px] uppercase font-bold text-primary bg-secondary px-2 py-0.5 rounded">
                            {t.asset.tag}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-black border uppercase tracking-wider ${getPriorityStyle(
                              t.priority
                            )}`}
                          >
                            {t.priority}
                          </span>
                        </div>

                        {/* Middle Content */}
                        <div>
                          <h4 className="font-bold text-[11px] text-foreground leading-tight">{t.asset.name}</h4>
                          <p className="text-[11px] text-muted-foreground leading-normal mt-1 line-clamp-2">
                            "{t.description}"
                          </p>
                        </div>

                        {/* Extra Details (Dates, Costs) */}
                        <div className="space-y-1.5 border-t border-border/60 pt-2.5 text-[9px] text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3 w-3 shrink-0" />
                            <span className="truncate font-semibold text-foreground">
                              {t.reporter.name}
                            </span>
                          </div>
                          {t.scheduledDate && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span>Sched: {new Date(t.scheduledDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          {t.cost > 0 && (
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="h-3 w-3 text-emerald-500 shrink-0" />
                              <span className="font-bold text-foreground">
                                Cost: ${t.cost.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons inside Card (Managers only) */}
                        {isAdminOrManager && (
                          <div className="border-t border-border/60 pt-2.5 flex justify-end gap-1.5">
                            {t.status === "PENDING" && (
                              <button
                                onClick={() => openApproveModal(t)}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-500 text-white rounded text-[10px] font-bold hover:opacity-90 shadow-sm"
                              >
                                <Check className="h-3 w-3" />
                                <span>Schedule</span>
                              </button>
                            )}
                            {t.status === "APPROVED" && (
                              <button
                                onClick={() => handleStartWork(t.id)}
                                disabled={processingId !== null}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 text-white rounded text-[10px] font-bold hover:opacity-90 shadow-sm"
                              >
                                <Play className="h-3 w-3 fill-white" />
                                <span>Start Work</span>
                              </button>
                            )}
                            {t.status === "IN_PROGRESS" && (
                              <button
                                onClick={() => openResolveModal(t)}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 text-white rounded text-[10px] font-bold hover:opacity-90 shadow-sm"
                              >
                                <CheckCircle className="h-3 w-3" />
                                <span>Resolve</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* REPORT ISSUE DIALOG */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="font-bold text-sm text-foreground mb-4 border-b border-border pb-3">
              Report Equipment Malfunction
            </h3>
            <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
              {/* Asset list */}
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Select Damaged Item</label>
                <select
                  required
                  value={reportAssetId}
                  onChange={(e) => setReportAssetId(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:outline-none"
                >
                  <option value="">Select Asset...</option>
                  {myAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name} ({asset.tag})
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Criticality Level</label>
                <select
                  value={reportPriority}
                  onChange={(e) => setReportPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:outline-none"
                >
                  <option value="LOW">LOW (stickers, minor keys sticky)</option>
                  <option value="MEDIUM">MEDIUM (charging port loose, display flickers)</option>
                  <option value="HIGH">HIGH (unusable monitor, sound card broken)</option>
                  <option value="CRITICAL">CRITICAL (battery swelling, fire risk, server down)</option>
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Describe Issue / Symptoms</label>
                <textarea
                  required
                  placeholder="e.g. Battery swelling on Macbook. Lower casing is bending..."
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg placeholder:text-muted-foreground/50 focus:outline-none resize-none"
                />
              </div>

              <div className="border-t border-border pt-4 mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="px-4 py-2 bg-secondary hover:bg-muted rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg font-semibold shadow-sm"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPROVE/SCHEDULE DIALOG */}
      {approveOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="font-bold text-sm text-foreground mb-1">
              Schedule & Approve Repair
            </h3>
            <p className="text-[10px] text-muted-foreground mb-4">
              Item: <span className="font-bold text-foreground">{selectedTicket.asset.name} ({selectedTicket.asset.tag})</span>
            </p>
            <form onSubmit={handleApproveSubmit} className="space-y-4 text-xs">
              {/* Scheduled date */}
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Technician Dispatch Date</label>
                <input
                  type="date"
                  required
                  value={approveScheduledDate}
                  onChange={(e) => setApproveScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:outline-none"
                />
              </div>

              {/* Estimate Cost */}
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Estimated Cost (USD, optional)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 150.00"
                  value={approveCost}
                  onChange={(e) => setApproveCost(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:outline-none"
                />
              </div>

              <div className="border-t border-border pt-4 mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setApproveOpen(false);
                    setSelectedTicket(null);
                  }}
                  className="px-4 py-2 bg-secondary hover:bg-muted rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg font-semibold shadow-sm"
                >
                  Confirm & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOLVE DIALOG */}
      {resolveOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="font-bold text-sm text-foreground mb-1">
              Close Maintenance Ticket
            </h3>
            <p className="text-[10px] text-muted-foreground mb-4">
              Item: <span className="font-bold text-foreground">{selectedTicket.asset.name} ({selectedTicket.asset.tag})</span>
            </p>
            <form onSubmit={handleResolveSubmit} className="space-y-4 text-xs">
              {/* Final Cost */}
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Final Resolution Cost (USD) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 120.00"
                  value={resolveCost}
                  onChange={(e) => setResolveCost(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:outline-none"
                />
              </div>

              {/* Remarks */}
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Resolution Remarks / Repair Notes</label>
                <textarea
                  placeholder="e.g. Screen replaced by Apple Store. Charger replaced. Tested okay."
                  value={resolveComments}
                  onChange={(e) => setResolveComments(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg placeholder:text-muted-foreground/50 focus:outline-none resize-none"
                />
              </div>

              <div className="border-t border-border pt-4 mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setResolveOpen(false);
                    setSelectedTicket(null);
                  }}
                  className="px-4 py-2 bg-secondary hover:bg-muted rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg font-semibold shadow-sm"
                >
                  Resolve & Close Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
