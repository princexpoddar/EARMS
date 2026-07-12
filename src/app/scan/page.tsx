"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import {
  QrCode,
  Laptop,
  User,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Play,
  ArrowLeftRight,
  RefreshCw,
  Camera,
  XCircle,
} from "lucide-react";

interface ScannedAsset {
  id: string;
  name: string;
  tag: string;
  serialNumber: string | null;
  status: string; // AVAILABLE, ALLOCATED, MAINTENANCE, RETIRED
  location: string;
  cost: number;
  category: { name: string; type: string };
  department: { name: string } | null;
  currentUser: { name: string; email: string } | null;
  bookings: { purpose: string; startDate: string; endDate: string; status: string }[];
  maintenance: { description: string; priority: string; status: string }[];
}

export default function ScanPage() {
  const { user, showToast } = useApp();
  const [scannedAsset, setScannedAsset] = useState<ScannedAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [scannerActive, setScannerActive] = useState(false);
  const [flashSuccess, setFlashSuccess] = useState(false);

  // Quick allocation modal inputs
  const [allocModalOpen, setAllocModalOpen] = useState(false);
  const [allocEmployeeId, setAllocEmployeeId] = useState("");
  const [employeesList, setEmployeesList] = useState<{ id: string; name: string }[]>([]);

  // HTML5 Qr Code Scanner Ref
  const scannerRef = useRef<any>(null);

  // Load Employees list for Quick Allocation Action
  useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          setEmployeesList(data.users || []);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadEmployees();
  }, []);

  // Initialize and clean up html5-qrcode
  useEffect(() => {
    return () => {
      stopCameraScanner();
    };
  }, []);

  const startCameraScanner = async () => {
    setScannerActive(true);
    setErrorMsg("");
    setScannedAsset(null);

    // Dynamic import to avoid Next.js SSR document reference errors
    try {
      const { Html5QrcodeScanner } = await import("html5-qrcode");
      
      setTimeout(() => {
        const scanner = new Html5QrcodeScanner(
          "qr-reader-container",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          /* verbose= */ false
        );

        scanner.render(
          async (decodedText) => {
            // Success callback: stop scanner and load asset
            scanner.clear();
            setScannerActive(false);
            handleScanSuccess(decodedText);
          },
          (errorMessage) => {
            // Silent error callback to avoid flooding console log
          }
        );

        scannerRef.current = scanner;
      }, 300);
    } catch (e) {
      console.error(e);
      setErrorMsg("Failed to start camera feed. Please check camera permissions.");
      setScannerActive(false);
    }
  };

  const stopCameraScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch (e) {
        // ignore
      }
      scannerRef.current = null;
    }
    setScannerActive(false);
  };

  // Handle Scan Event
  const handleScanSuccess = async (tag: string) => {
    setLoading(true);
    setErrorMsg("");
    setFlashSuccess(true);
    setTimeout(() => setFlashSuccess(false), 800);

    try {
      // 1. Query asset by tag search
      const res = await fetch(`/api/assets?search=${tag.trim()}`);
      if (!res.ok) throw new Error("Search query failed");
      const searchData = await res.json();
      const assetsList: any[] = searchData.assets || [];
      const matchedAsset = assetsList.find(
        (a) => a.tag.toUpperCase() === tag.trim().toUpperCase()
      );

      if (!matchedAsset) {
        showToast(`Asset Tag ${tag} not found`, "error");
        setErrorMsg(`Asset tag "${tag}" is not recognized in the database.`);
        setScannedAsset(null);
        return;
      }

      // 2. Fetch full asset detail with relations
      const detailRes = await fetch(`/api/assets/${matchedAsset.id}`);
      if (detailRes.ok) {
        const detailData = await detailRes.json();
        setScannedAsset(detailData.asset);
        showToast(`Successfully Scanned ${tag}`, "success");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Connection error looking up asset.");
    } finally {
      setLoading(false);
    }
  };

  // Check for auto-scan query parameter
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tagParam = params.get("tag");
      if (tagParam) {
        handleScanSuccess(tagParam);
      }
    }
  }, []);

  // Action: Return Asset
  const handleReturnAsset = async () => {
    if (!scannedAsset) return;
    setLoading(true);
    try {
      const res = await fetch("/api/allocation/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: scannedAsset.id }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Asset successfully returned!", "success");
        // Reload asset details
        handleScanSuccess(scannedAsset.tag);
      } else {
        showToast(data.error || "Failed to return asset", "error");
      }
    } catch (e) {
      showToast("Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  // Action: Allocate Asset Submit
  const handleAllocateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedAsset || !allocEmployeeId) return;

    setLoading(true);
    try {
      const res = await fetch("/api/allocation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: scannedAsset.id,
          userId: allocEmployeeId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Asset successfully allocated!", "success");
        setAllocModalOpen(false);
        setAllocEmployeeId("");
        // Reload asset details
        handleScanSuccess(scannedAsset.tag);
      } else {
        showToast(data.error || "Allocation failed", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  // Action: Send to Maintenance
  const handleSendToMaintenance = async () => {
    if (!scannedAsset) return;
    setLoading(true);
    try {
      // Auto report maintenance with high priority
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: scannedAsset.id,
          description: "Routine diagnostic checkout triggered from QR scan logs.",
          priority: "HIGH",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Maintenance ticket requested successfully!", "success");
        handleScanSuccess(scannedAsset.tag);
      } else {
        showToast(data.error || "Failed to log maintenance", "error");
      }
    } catch (e) {
      showToast("Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "ALLOCATED":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "MAINTENANCE":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default:
        return "bg-red-500/10 text-red-500 border-red-500/20";
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          QR Code Scanner
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Scan a barcode or physical QR label using your camera to view asset state or log check-ins.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Scanner Control Deck */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 self-start">
            Scan Viewfinder
          </span>

          {/* Flash green overlay on scan success */}
          <div
            className={`w-full aspect-square max-w-[320px] rounded-xl border-2 border-dashed border-border/80 flex flex-col items-center justify-center relative overflow-hidden bg-muted/10 transition-all duration-300 ${
              flashSuccess ? "border-green-500 bg-green-500/10 scale-98" : ""
            }`}
          >
            {scannerActive ? (
              <div id="qr-reader-container" className="w-full h-full" />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground space-y-4">
                <div className="relative">
                  <QrCode className="h-16 w-16 text-muted-foreground/30" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/30 to-transparent h-0.5 animate-scan-laser top-0" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">Webcam inactive</h3>
                  <p className="text-[10px] text-muted-foreground mt-1">Start camera scanner to begin.</p>
                </div>
                <button
                  onClick={startCameraScanner}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  <Camera className="h-4 w-4" />
                  <span>Start Camera</span>
                </button>
              </div>
            )}

            {scannerActive && (
              <button
                onClick={stopCameraScanner}
                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition"
              >
                <XCircle className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Simulation console for fast hackathon demo checks */}
          <div className="w-full border-t border-border mt-6 pt-5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-3">
              Judge Simulation Deck
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleScanSuccess("AST-0001")}
                className="px-3 py-2 bg-secondary hover:bg-muted border border-border rounded-lg font-semibold text-foreground text-left flex items-center justify-between"
              >
                <span>MacBook Pro 16"</span>
                <span className="text-[8px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-mono font-bold">AST-0001</span>
              </button>
              <button
                onClick={() => handleScanSuccess("AST-0004")}
                className="px-3 py-2 bg-secondary hover:bg-muted border border-border rounded-lg font-semibold text-foreground text-left flex items-center justify-between"
              >
                <span>iPad Pro M2</span>
                <span className="text-[8px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-mono font-bold">AST-0004</span>
              </button>
              <button
                onClick={() => handleScanSuccess("AST-0005")}
                className="px-3 py-2 bg-secondary hover:bg-muted border border-border rounded-lg font-semibold text-foreground text-left flex items-center justify-between"
              >
                <span>Boardroom Alpha</span>
                <span className="text-[8px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-mono font-bold">AST-0005</span>
              </button>
              <button
                onClick={() => handleScanSuccess("AST-0999")}
                className="px-3 py-2 bg-secondary hover:bg-muted border border-border rounded-lg font-semibold text-foreground text-left flex items-center justify-between"
              >
                <span>iPad Mini 6</span>
                <span className="text-[8px] bg-primary/15 text-primary px-1.5 py-0.5 rounded font-mono font-bold">AST-0999</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scan Details panel */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col h-full min-h-[350px]">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
            Details & Quick Actions
          </span>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest animate-pulse">
                Querying database...
              </span>
            </div>
          ) : errorMsg ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-red-500/5 border border-dashed border-red-500/20 rounded-xl">
              <AlertTriangle className="h-10 w-10 text-red-500/60 mb-3" />
              <h3 className="font-bold text-sm text-red-500">Scan Failed</h3>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                {errorMsg}
              </p>
            </div>
          ) : scannedAsset ? (
            <div className="space-y-5 animate-fade-in text-xs">
              {/* Asset Title */}
              <div className="flex items-start justify-between border-b border-border/60 pb-4">
                <div>
                  <h3 className="font-extrabold text-sm text-foreground">{scannedAsset.name}</h3>
                  <span className="text-[10px] text-muted-foreground font-mono mt-1 block">
                    Serial: {scannedAsset.serialNumber || "—"}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-[10px] font-black uppercase text-primary bg-secondary px-2 py-0.5 rounded">
                    {scannedAsset.tag}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${getStatusBadge(scannedAsset.status)}`}>
                    {scannedAsset.status}
                  </span>
                </div>
              </div>

              {/* Asset Specs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Category</span>
                  <p className="font-bold text-foreground">{scannedAsset.category.name}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Location</span>
                  <p className="font-bold text-foreground">{scannedAsset.location}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Custodian</span>
                  <p className="font-bold text-foreground flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>{scannedAsset.currentUser?.name || "Shared Inventory"}</span>
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Department</span>
                  <p className="font-bold text-foreground">{scannedAsset.department?.name || "Global / Shared"}</p>
                </div>
              </div>

              {/* Maintenance Status Widget */}
              {scannedAsset.maintenance.length > 0 && (
                <div className="p-3 bg-muted/20 border border-border rounded-xl">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1.5">
                    Upkeep Diagnostics Log
                  </span>
                  <div className="flex justify-between items-center text-[11px]">
                    <div>
                      <p className="font-semibold text-foreground truncate max-w-[200px]">
                        "{scannedAsset.maintenance[0].description}"
                      </p>
                      <span className="text-[9px] text-muted-foreground">
                        Priority: **{scannedAsset.maintenance[0].priority}**
                      </span>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase">
                      {scannedAsset.maintenance[0].status}
                    </span>
                  </div>
                </div>
              )}

              {/* QUICK ACTIONS SECTION */}
              <div className="border-t border-border/60 pt-4 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Quick Action Controls
                </span>
                <div className="flex flex-wrap gap-2">
                  {scannedAsset.status === "AVAILABLE" && (
                    <button
                      onClick={() => setAllocModalOpen(true)}
                      className="flex items-center gap-1 px-3 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-xs font-semibold shadow-sm transition"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>Allocate Item</span>
                    </button>
                  )}
                  {scannedAsset.status === "ALLOCATED" && (
                    <button
                      onClick={handleReturnAsset}
                      className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white hover:opacity-90 rounded-lg text-xs font-semibold shadow-sm transition"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Return & Check-in</span>
                    </button>
                  )}
                  {scannedAsset.status !== "MAINTENANCE" && scannedAsset.status !== "RETIRED" && (
                    <button
                      onClick={handleSendToMaintenance}
                      className="flex items-center gap-1 px-3 py-2 bg-amber-500 text-white hover:opacity-90 rounded-lg text-xs font-semibold shadow-sm transition"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Log Issue (Maintenance)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground py-10 bg-muted/5 rounded-xl border border-dashed border-border/80">
              <QrCode className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <h3 className="font-semibold text-sm">Waiting for Scan</h3>
              <p className="text-[10px] text-muted-foreground mt-1 leading-normal max-w-[200px]">
                Scan a barcode with your camera or select a simulated item from the preset deck.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* QUICK ALLOCATE MODAL */}
      {allocModalOpen && scannedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="font-bold text-sm text-foreground mb-1">
              Quick Issue / Allocation
            </h3>
            <p className="text-[10px] text-muted-foreground mb-4">
              Item: <span className="font-bold text-foreground">{scannedAsset.name} ({scannedAsset.tag})</span>
            </p>
            <form onSubmit={handleAllocateSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Select Custodian Employee</label>
                <select
                  required
                  value={allocEmployeeId}
                  onChange={(e) => setAllocEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:outline-none"
                >
                  <option value="">Choose User...</option>
                  {employeesList.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t border-border pt-4 mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setAllocModalOpen(false);
                    setAllocEmployeeId("");
                  }}
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
    </div>
  );
}
