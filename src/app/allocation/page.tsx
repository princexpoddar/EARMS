"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  ArrowLeftRight,
  UserCheck,
  RotateCcw,
  Check,
  X,
  Laptop,
  User,
  Clock,
  PlusCircle,
  HelpCircle,
  TrendingUp,
} from "lucide-react";

interface Asset {
  id: string;
  name: string;
  tag: string;
  status: string;
  location: string;
  category: { name: string };
  currentUserId: string | null;
}

interface Transfer {
  id: string;
  assetId: string;
  asset: { name: string; tag: string };
  senderId: string;
  sender: { name: string };
  receiverId: string;
  receiver: { name: string; departmentId: string | null };
  status: string; // PENDING, APPROVED, REJECTED
  notes: string | null;
  createdAt: string;
}

interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AllocationPage() {
  const { user, showToast } = useApp();
  const isAdminOrManager = user?.role === "ADMIN" || user?.role === "MANAGER";

  const [activeTab, setActiveTab] = useState<"allocations" | "transfers">("allocations");

  // Data Lists
  const [allocatedAssets, setAllocatedAssets] = useState<Asset[]>([]);
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms Modals
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  // Form Inputs
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [transferAsset, setTransferAsset] = useState<Asset | null>(null);
  const [transferReceiverId, setTransferReceiverId] = useState("");
  const [transferNotes, setTransferNotes] = useState("");

  const [processingId, setProcessingId] = useState<string | null>(null);

  // Load Initial Data
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Load users
      const usersRes = await fetch("/api/users");
      if (usersRes.ok) {
        const d = await usersRes.json();
        setUsers(d.users || []);
      }

      // 2. Load transfers
      const transfersRes = await fetch("/api/transfers");
      if (transfersRes.ok) {
        const d = await transfersRes.json();
        setTransfers(d.transfers || []);
      }

      // 3. Load assets (to filter allocated vs available)
      const assetsRes = await fetch("/api/assets");
      if (assetsRes.ok) {
        const d = await assetsRes.json();
        const allAssets: Asset[] = d.assets || [];

        // If employee, allocatedAssets is only assets assigned to them.
        // If admin/manager, allocatedAssets shows ALL allocated assets.
        if (isAdminOrManager) {
          setAllocatedAssets(allAssets.filter((a) => a.status === "ALLOCATED"));
        } else {
          setAllocatedAssets(allAssets.filter((a) => a.currentUserId === user?.id));
        }

        // Available hardware assets for allocation (category resources cannot be allocated)
        setAvailableAssets(allAssets.filter((a) => a.status === "AVAILABLE"));
      }
    } catch (e) {
      console.error(e);
      showToast("Error loading allocation data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Handle Allocate Submit
  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !selectedUserId) {
      showToast("Please select both an asset and a user", "error");
      return;
    }

    try {
      const res = await fetch("/api/allocation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: selectedAssetId, userId: selectedUserId }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Asset allocated successfully!", "success");
        setAllocateOpen(false);
        setSelectedAssetId("");
        setSelectedUserId("");
        loadData();
      } else {
        showToast(data.error || "Allocation failed", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    }
  };

  // Handle Return (Check-in)
  const handleReturn = async (assetId: string) => {
    if (!confirm("Confirm return of this asset? It will be marked as available for reissue.")) return;

    try {
      const res = await fetch("/api/allocation/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Asset returned and check-in logged!", "success");
        loadData();
      } else {
        showToast(data.error || "Return check-in failed", "error");
      }
    } catch (err) {
      showToast("Error processing return", "error");
    }
  };

  // Open Transfer Modal
  const initiateTransfer = (asset: Asset) => {
    setTransferAsset(asset);
    setTransferReceiverId("");
    setTransferNotes("");
    setTransferOpen(true);
  };

  // Handle Transfer Request Submit
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAsset || !transferReceiverId) return;

    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: transferAsset.id,
          receiverId: transferReceiverId,
          notes: transferNotes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Ownership transfer request submitted!", "success");
        setTransferOpen(false);
        setTransferAsset(null);
        loadData();
      } else {
        showToast(data.error || "Failed to create transfer request", "error");
      }
    } catch (err) {
      showToast("Error submitting transfer", "error");
    }
  };

  // Process Transfer (Approve/Reject)
  const processTransfer = async (transferId: string, action: "approve" | "reject") => {
    setProcessingId(transferId);
    try {
      const res = await fetch(`/api/transfers/${transferId}/${action}`, {
        method: "POST",
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Transfer request ${action}d!`, "success");
        loadData();
      } else {
        showToast(data.error || `Failed to ${action} request`, "error");
      }
    } catch (err) {
      showToast("Error processing request", "error");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Allocations & Transfers
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Issue company equipment, return items, or request ownership transfers.
          </p>
        </div>

        {isAdminOrManager && (
          <button
            onClick={() => setAllocateOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-xs font-semibold shadow transition-all duration-200"
          >
            <UserCheck className="h-4.5 w-4.5" />
            <span>New Allocation</span>
          </button>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("allocations")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors uppercase tracking-wider ${
            activeTab === "allocations"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {isAdminOrManager ? "Active Allocations" : "My Assigned Assets"}
        </button>
        <button
          onClick={() => setActiveTab("transfers")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors uppercase tracking-wider ${
            activeTab === "transfers"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Transfer Requests
          {transfers.filter((t) => t.status === "PENDING").length > 0 && (
            <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[8px] font-black text-destructive-foreground">
              {transfers.filter((t) => t.status === "PENDING").length}
            </span>
          )}
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-12 bg-card rounded-lg animate-pulse" />
          <div className="h-40 bg-card rounded-lg animate-pulse" />
        </div>
      ) : activeTab === "allocations" ? (
        /* ALLOCATIONS TAB */
        allocatedAssets.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-10 text-center flex flex-col items-center justify-center">
            <Laptop className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <h3 className="font-semibold text-sm">No active allocations</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {isAdminOrManager ? "No assets are currently issued." : "You have no assigned assets."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allocatedAssets.map((asset) => (
              <div
                key={asset.id}
                className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold font-mono uppercase bg-secondary text-primary px-2 py-0.5 rounded">
                      {asset.tag}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      {asset.category.name}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-foreground">{asset.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Location: {asset.location}</p>
                </div>

                <div className="border-t border-border pt-4 mt-5 flex gap-2">
                  <button
                    onClick={() => initiateTransfer(asset)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-secondary border border-border text-foreground hover:bg-muted rounded-lg text-xs font-semibold shadow-sm transition"
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                    <span>Transfer</span>
                  </button>

                  {isAdminOrManager && (
                    <button
                      onClick={() => handleReturn(asset.id)}
                      className="flex items-center justify-center p-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white border border-destructive/20 rounded-lg text-xs font-semibold transition"
                      title="Mark as Returned (Check-in)"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* TRANSFERS TAB */
        transfers.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-10 text-center flex flex-col items-center justify-center">
            <ArrowLeftRight className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <h3 className="font-semibold text-sm">No transfer requests</h3>
            <p className="text-xs text-muted-foreground mt-1">No active ownership transfers logged.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-border rounded-xl bg-card">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-muted-foreground font-semibold">
                  <th className="p-4">Asset</th>
                  <th className="p-4">From</th>
                  <th className="p-4">To</th>
                  <th className="p-4">Notes</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t) => (
                  <tr key={t.id} className="border-b border-border hover:bg-muted/10">
                    <td className="p-4">
                      <div className="font-semibold text-foreground">{t.asset.name}</div>
                      <span className="font-mono text-[9px] uppercase font-bold text-muted-foreground">
                        {t.asset.tag}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground font-medium">{t.sender.name}</td>
                    <td className="p-4 text-muted-foreground font-medium">{t.receiver.name}</td>
                    <td className="p-4 text-muted-foreground italic font-medium max-w-[150px] truncate">
                      {t.notes || "—"}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                          t.status === "PENDING"
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            : t.status === "APPROVED"
                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {t.status === "PENDING" && isAdminOrManager ? (
                        <div className="inline-flex gap-1.5">
                          <button
                            onClick={() => processTransfer(t.id, "approve")}
                            disabled={processingId !== null}
                            className="p-1 bg-green-500/10 hover:bg-green-500 hover:text-white border border-green-500/20 text-green-500 rounded transition"
                            title="Approve Transfer"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => processTransfer(t.id, "reject")}
                            disabled={processingId !== null}
                            className="p-1 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-500 rounded transition"
                            title="Reject Transfer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {t.status === "PENDING" ? "Awaiting Review" : "Archived"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ALLOCATE DIALOG */}
      {allocateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="font-bold text-sm text-foreground mb-4 border-b border-border pb-3">
              Allocate Hardware Asset
            </h3>
            <form onSubmit={handleAllocate} className="space-y-4 text-xs">
              {/* Asset Dropdown */}
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Select Available Asset</label>
                <select
                  required
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:outline-none"
                >
                  <option value="">Choose Asset...</option>
                  {availableAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name} ({asset.tag})
                    </option>
                  ))}
                </select>
              </div>

              {/* User Dropdown */}
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Issue to Employee</label>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:outline-none"
                >
                  <option value="">Choose Employee...</option>
                  {users.map((usr) => (
                    <option key={usr.id} value={usr.id}>
                      {usr.name} ({usr.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t border-border pt-4 mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAllocateOpen(false)}
                  className="px-4 py-2 bg-secondary hover:bg-muted rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg font-semibold shadow-sm"
                >
                  Confirm Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {transferOpen && transferAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="font-bold text-sm text-foreground mb-1">
              Initiate Equipment Transfer
            </h3>
            <p className="text-[10px] text-muted-foreground mb-4">
              Transferring: <span className="font-bold text-foreground">{transferAsset.name} ({transferAsset.tag})</span>
            </p>
            <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs">
              {/* Target User */}
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Select Receiver Employee</label>
                <select
                  required
                  value={transferReceiverId}
                  onChange={(e) => setTransferReceiverId(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:outline-none"
                >
                  <option value="">Choose Receiver...</option>
                  {users
                    .filter((u) => u.id !== user?.id) // Cannot transfer to yourself
                    .map((usr) => (
                      <option key={usr.id} value={usr.id}>
                        {usr.name} ({usr.role})
                      </option>
                    ))}
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Transfer Justification / Notes</label>
                <textarea
                  placeholder="e.g. Project reallocation, employee transition to design team..."
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg placeholder:text-muted-foreground/50 focus:outline-none resize-none"
                />
              </div>

              <div className="border-t border-border pt-4 mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setTransferOpen(false);
                    setTransferAsset(null);
                  }}
                  className="px-4 py-2 bg-secondary hover:bg-muted rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg font-semibold shadow-sm"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
