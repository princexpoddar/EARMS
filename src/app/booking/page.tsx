"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  Calendar,
  Clock,
  MapPin,
  Check,
  X,
  PlusCircle,
  AlertTriangle,
  Info,
  Layers,
  HelpCircle,
} from "lucide-react";

interface Resource {
  id: string;
  name: string;
  tag: string;
  location: string;
  category: { name: string };
}

interface Booking {
  id: string;
  assetId: string;
  asset: { name: string; tag: string; location: string };
  userId: string;
  user: { name: string; email: string };
  startDate: string;
  endDate: string;
  purpose: string;
  status: string; // PENDING, APPROVED, REJECTED, COMPLETED
}

export default function BookingsPage() {
  const { user, showToast } = useApp();
  const isAdminOrManager = user?.role === "ADMIN" || user?.role === "MANAGER";

  // Data States
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [bookOpen, setBookOpen] = useState(false);

  // Form Inputs
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");

  const [processingId, setProcessingId] = useState<string | null>(null);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch bookings
      const bookingsRes = await fetch("/api/bookings");
      if (bookingsRes.ok) {
        const d = await bookingsRes.json();
        setBookings(d.bookings || []);
      }

      // 2. Fetch resources
      const resourcesRes = await fetch("/api/assets/resources");
      if (resourcesRes.ok) {
        const d = await resourcesRes.json();
        setResources(d.resources || []);
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to load reservation registry", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Book Resource Submit
  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedResourceId || !purpose || !startDate || !startTime || !endDate || !endTime) {
      showToast("Please fill in all details", "error");
      return;
    }

    const startISO = `${startDate}T${startTime}:00`;
    const endISO = `${endDate}T${endTime}:00`;

    // Validate date logic
    if (new Date(endISO) <= new Date(startISO)) {
      showToast("End date/time must be after start date/time", "error");
      return;
    }

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: selectedResourceId,
          startDate: startISO,
          endDate: endISO,
          purpose,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(
          isAdminOrManager
            ? "Booking confirmed and approved!"
            : "Booking request submitted! Awaiting manager approval.",
          "success"
        );
        setBookOpen(false);
        // Reset form
        setSelectedResourceId("");
        setPurpose("");
        setStartDate("");
        setStartTime("");
        setEndDate("");
        setEndTime("");
        loadData();
      } else {
        showToast(data.error || "Reservation failed", "error");
      }
    } catch (err) {
      showToast("Connection error", "error");
    }
  };

  // Process Booking (Approve / Decline)
  const processBooking = async (bookingId: string, action: "approve" | "reject") => {
    setProcessingId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/${action}`, {
        method: "POST",
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Booking successfully ${action === "approve" ? "approved" : "cancelled"}!`, "success");
        loadData();
      } else {
        showToast(data.error || "Failed to process request", "error");
      }
    } catch (e) {
      showToast("Network error", "error");
    } finally {
      setProcessingId(null);
    }
  };

  // Format Date Range beautifully
  const formatTimeRange = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const dateOptions: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    const timeOptions: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };

    const sameDay = start.toDateString() === end.toDateString();

    if (sameDay) {
      return `${start.toLocaleDateString("en-US", dateOptions)} · ${start.toLocaleTimeString([], timeOptions)} - ${end.toLocaleTimeString([], timeOptions)}`;
    } else {
      return `${start.toLocaleDateString("en-US", dateOptions)} ${start.toLocaleTimeString([], timeOptions)} - ${end.toLocaleDateString("en-US", dateOptions)} ${end.toLocaleTimeString([], timeOptions)}`;
    }
  };

  const activeBookings = bookings.filter((b) => b.status === "PENDING" || b.status === "APPROVED");
  const pastBookings = bookings.filter((b) => b.status === "REJECTED" || b.status === "COMPLETED");

  return (
    <div className="space-y-6 pb-16">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Resource Bookings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Book meeting spaces, conference suites, or shared AV equipment.
          </p>
        </div>

        <button
          onClick={() => setBookOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-xs font-semibold shadow transition-all duration-200"
        >
          <PlusCircle className="h-4.5 w-4.5" />
          <span>Reserve Space</span>
        </button>
      </div>

      {/* Grid splits into Active Reservations vs Booking History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Reservations */}
        <div className="bg-card border border-border rounded-xl p-5 lg:col-span-2 flex flex-col">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 block">
            Active Reservations & Schedules
          </span>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : activeBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-muted/10 rounded-lg border border-dashed border-border">
              <Calendar className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <h3 className="font-semibold text-sm">No active reservations</h3>
              <p className="text-xs text-muted-foreground mt-1">Book a conference room to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeBookings.map((b) => (
                <div
                  key={b.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/20 border border-border rounded-xl hover:border-muted-foreground/30 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase text-primary bg-secondary px-2 py-0.5 rounded">
                        {b.asset.tag}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {b.asset.location}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-foreground">{b.purpose}</h4>
                    <p className="text-xs font-medium text-muted-foreground mt-1">{b.asset.name}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1 font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatTimeRange(b.startDate, b.endDate)}</span>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2.5 sm:self-center shrink-0">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                        b.status === "APPROVED"
                          ? "bg-green-500/10 text-green-500 border-green-500/20"
                          : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      }`}
                    >
                      {b.status}
                    </span>

                    {b.status === "PENDING" && isAdminOrManager ? (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => processBooking(b.id, "approve")}
                          disabled={processingId !== null}
                          className="p-1.5 bg-green-500/10 hover:bg-green-500 hover:text-white border border-green-500/20 text-green-500 rounded transition"
                          title="Approve Reservation"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => processBooking(b.id, "reject")}
                          disabled={processingId !== null}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-500 rounded transition"
                          title="Decline Reservation"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      (b.userId === user?.id || isAdminOrManager) && (
                        <button
                          onClick={() => processBooking(b.id, "reject")}
                          disabled={processingId !== null}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-500 text-[10px] font-bold rounded-lg transition"
                        >
                          Cancel
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Booking History (1 Column) */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 block">
            Reservation History
          </span>

          {loading ? (
            <div className="h-40 bg-muted rounded-lg animate-pulse" />
          ) : pastBookings.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
              <p className="text-xs italic">No historical entries</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {pastBookings.map((b) => (
                <div key={b.id} className="p-3 bg-muted/10 border border-border rounded-lg text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-foreground truncate max-w-[150px]">{b.purpose}</span>
                    <span
                      className={`text-[8px] font-black px-1.5 rounded uppercase border ${
                        b.status === "COMPLETED"
                          ? "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{b.asset.name}</p>
                  <p className="text-[9px] text-muted-foreground mt-1">
                    Booked by {b.user.name}
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    {new Date(b.startDate).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BOOK RESOURCE DIALOG */}
      {bookOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="font-bold text-sm text-foreground mb-4 border-b border-border pb-3">
              Reserve Workspace Resource
            </h3>
            <form onSubmit={handleBookSubmit} className="space-y-4 text-xs">
              {/* Resource Selection */}
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Select Shareable Resource</label>
                <select
                  required
                  value={selectedResourceId}
                  onChange={(e) => setSelectedResourceId(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:outline-none"
                >
                  <option value="">Choose Room or Equipment...</option>
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.category.name} · {r.location})
                    </option>
                  ))}
                </select>
              </div>

              {/* Purpose */}
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Meeting Purpose / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design review, client demo..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:outline-none"
                />
              </div>

              {/* Start Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              {/* End Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-border pt-4 mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setBookOpen(false)}
                  className="px-4 py-2 bg-secondary hover:bg-muted rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg font-semibold shadow-sm"
                >
                  Book Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
