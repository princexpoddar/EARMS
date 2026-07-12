"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  QrCode,
  SlidersHorizontal,
  Calendar,
  IndianRupee,
  MapPin,
  Tag,
  Wrench,
  History,
  X,
  Printer,
  ChevronDown,
  User,
} from "lucide-react";

interface Asset {
  id: string;
  name: string;
  tag: string;
  categoryId: string;
  category: { name: string; type: string };
  status: string; // AVAILABLE, ALLOCATED, MAINTENANCE, RETIRED
  location: string;
  serialNumber: string | null;
  purchaseDate: string;
  cost: number;
  imageUrl: string | null;
  currentUserId: string | null;
  currentUser: { name: string; email: string } | null;
  department?: { name: string };
}

interface Category {
  id: string;
  name: string;
  type: string;
}

export default function AssetsPage() {
  const { user, showToast } = useApp();
  const isAdminOrManager = user?.role === "ADMIN" || user?.role === "MANAGER";

  // Data States
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter/Search States
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");

  // Selected Asset for Drawer
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assetHistory, setAssetHistory] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // Form States (Create/Edit)
  const [formData, setFormData] = useState({
    name: "",
    tag: "",
    categoryId: "",
    location: "",
    serialNumber: "",
    cost: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    imageUrl: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 1. Fetch Assets
  const fetchAssets = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.set("search", search);
      if (statusFilter) queryParams.set("status", statusFilter);
      if (categoryFilter) queryParams.set("categoryId", categoryFilter);

      const res = await fetch(`/api/assets?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to fetch assets", "error");
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Categories
  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Refetch assets when filters change
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchAssets();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter, categoryFilter]);

  // Handle click on asset to open details drawer
  const handleSelectAsset = async (asset: Asset) => {
    setSelectedAsset(asset);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/assets/${asset.id}`);
      if (res.ok) {
        const data = await res.json();
        setAssetHistory(data.asset);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Handle Create Asset Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate
    const errors: Record<string, string> = {};
    if (!formData.name) errors.name = "Name is required";
    if (!formData.tag) errors.tag = "Tag (e.g. AST-0001) is required";
    if (!formData.categoryId) errors.categoryId = "Category is required";
    if (!formData.location) errors.location = "Location is required";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Asset ${data.asset.name} created!`, "success");
        setCreateOpen(false);
        setFormData({
          name: "",
          tag: "",
          categoryId: "",
          location: "",
          serialNumber: "",
          cost: "",
          purchaseDate: new Date().toISOString().split("T")[0],
          imageUrl: "",
        });
        fetchAssets();
      } else {
        showToast(data.error || "Failed to create asset", "error");
      }
    } catch (err) {
      showToast("Something went wrong", "error");
    }
  };

  // Pre-fill Edit form
  const handleEditClick = (asset: Asset) => {
    setFormData({
      name: asset.name,
      tag: asset.tag,
      categoryId: asset.categoryId,
      location: asset.location,
      serialNumber: asset.serialNumber || "",
      cost: asset.cost.toString(),
      purchaseDate: new Date(asset.purchaseDate).toISOString().split("T")[0],
      imageUrl: asset.imageUrl || "",
    });
    setEditOpen(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;

    try {
      const res = await fetch(`/api/assets/${selectedAsset.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Asset updated successfully!", "success");
        setEditOpen(false);
        setSelectedAsset({ ...selectedAsset, ...data.asset });
        fetchAssets();
      } else {
        showToast(data.error || "Failed to update asset", "error");
      }
    } catch (err) {
      showToast("Error updating asset", "error");
    }
  };

  // Handle Retire/Delete
  const handleRetireClick = async (asset: Asset) => {
    if (!confirm(`Are you sure you want to retire ${asset.name}? This will mark it as RETIRED.`)) return;

    try {
      const res = await fetch(`/api/assets/${asset.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast("Asset retired successfully", "success");
        setSelectedAsset(null);
        fetchAssets();
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to retire asset", "error");
      }
    } catch (err) {
      showToast("Error retiring asset", "error");
    }
  };

  return (
    <div className="space-y-6 relative min-h-screen pb-16">
      {/* Title & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Assets Catalog</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage and track hardware and office resources.</p>
        </div>

        {isAdminOrManager && (
          <button
            onClick={() => {
              setFormErrors({});
              setCreateOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-xs font-semibold shadow transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>Add Asset</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-card p-4 rounded-xl border border-border">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by tag, name, serial number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-muted/40 border border-border rounded-lg text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary transition"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap gap-2.5">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-muted/40 border border-border rounded-lg text-xs text-muted-foreground focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-muted/40 border border-border rounded-lg text-xs text-muted-foreground focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="ALLOCATED">ALLOCATED</option>
            <option value="MAINTENANCE">MAINTENANCE</option>
            <option value="RETIRED">RETIRED</option>
          </select>
        </div>
      </div>

      {/* Asset Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 bg-card border border-border rounded-lg animate-pulse" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center flex flex-col items-center justify-center">
          <SlidersHorizontal className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <h3 className="font-semibold text-sm">No assets found</h3>
          <p className="text-xs text-muted-foreground mt-1">Try adjusting search query or filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-border rounded-xl bg-card">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/20 text-muted-foreground font-semibold">
                <th className="p-4">Asset Tag</th>
                <th className="p-4">Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Location</th>
                <th className="p-4">Cost</th>
                <th className="p-4">Status</th>
                <th className="p-4">Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr
                  key={asset.id}
                  onClick={() => handleSelectAsset(asset)}
                  className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors duration-150"
                >
                  <td className="p-4 font-mono font-bold uppercase tracking-wider text-primary">
                    {asset.tag}
                  </td>
                  <td className="p-4 font-semibold text-foreground">{asset.name}</td>
                  <td className="p-4 text-muted-foreground">{asset.category.name}</td>
                  <td className="p-4 text-muted-foreground truncate max-w-[150px]">
                    {asset.location}
                  </td>
                  <td className="p-4 font-medium text-foreground">
                    {asset.cost > 0 ? `₹${asset.cost.toLocaleString()}` : "—"}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                        asset.status === "AVAILABLE"
                          ? "bg-green-500/10 text-green-500 border-green-500/20"
                          : asset.status === "ALLOCATED"
                          ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                          : asset.status === "MAINTENANCE"
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                      }`}
                    >
                      {asset.status}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-foreground">
                    {asset.currentUser ? asset.currentUser.name : <span className="text-muted-foreground/40">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sliding Details Drawer */}
      {selectedAsset && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 transition-opacity"
            onClick={() => setSelectedAsset(null)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-card border-l border-border shadow-2xl z-40 p-6 flex flex-col overflow-y-auto transform transition-transform duration-300">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-black uppercase text-primary bg-secondary px-2.5 py-1 rounded">
                  {selectedAsset.tag}
                </span>
                <span className="text-xs text-muted-foreground">· {selectedAsset.category.name}</span>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Asset General Specs */}
            <div className="space-y-5 flex-1">
              <div>
                <h2 className="text-base font-extrabold text-foreground leading-snug">
                  {selectedAsset.name}
                </h2>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-1">
                  Status: {selectedAsset.status}
                </p>
              </div>

              {/* QR Mockup */}
              <div className="flex flex-col items-center justify-center p-4 border border-border bg-muted/10 rounded-xl text-center">
                <div className="h-28 w-28 bg-white p-2 rounded-lg border border-zinc-200 shadow-sm flex items-center justify-center">
                  <QrCode className="h-24 w-24 text-zinc-950" />
                </div>
                <button
                  onClick={() => alert(`Label printed for ${selectedAsset.tag}`)}
                  className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-primary bg-secondary border border-border px-3 py-1.5 rounded hover:bg-muted transition"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Asset Label</span>
                </button>
              </div>

              {/* Specs List */}
              <div className="space-y-3 bg-muted/20 p-4 border border-border rounded-xl text-xs">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground font-medium w-24 shrink-0">Location:</span>
                  <span className="text-foreground font-semibold truncate">{selectedAsset.location}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground font-medium w-24 shrink-0">Serial S/N:</span>
                  <span className="text-foreground font-semibold font-mono truncate">
                    {selectedAsset.serialNumber || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <IndianRupee className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground font-medium w-24 shrink-0">Cost (INR):</span>
                  <span className="text-foreground font-semibold">
                    {selectedAsset.cost > 0 ? `₹${selectedAsset.cost.toLocaleString()}` : "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground font-medium w-24 shrink-0">Acquired:</span>
                  <span className="text-foreground font-semibold">
                    {new Date(selectedAsset.purchaseDate).toLocaleDateString()}
                  </span>
                </div>
                {selectedAsset.currentUser && (
                  <div className="flex items-start gap-3 border-t border-border pt-3 mt-3">
                    <User className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                        Assigned Custodian
                      </p>
                      <p className="text-foreground font-bold">{selectedAsset.currentUser.name}</p>
                      <p className="text-[10px] text-muted-foreground">{selectedAsset.currentUser.email}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* History Timeline Logs */}
              <div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-3 block">
                  Asset Lifecycle Logs
                </span>
                {historyLoading ? (
                  <p className="text-xs text-muted-foreground italic">Loading timeline...</p>
                ) : !assetHistory ? (
                  <p className="text-xs text-muted-foreground italic">No lifecycle logs available</p>
                ) : (
                  <div className="space-y-3.5 text-xs pl-2.5 border-l border-border">
                    {assetHistory.bookings.length === 0 && assetHistory.maintenance.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">No bookings or maintenance logs.</p>
                    )}
                    {/* Render bookings */}
                    {assetHistory.bookings.map((b: any) => (
                      <div key={b.id} className="relative pl-4">
                        <div className="absolute left-[-15px] top-1.5 h-2 w-2 rounded-full bg-blue-500 border border-card" />
                        <p className="font-semibold text-foreground">Booked / Checked out</p>
                        <p className="text-[10px] text-muted-foreground font-medium">
                          By {b.user.name} ({b.purpose})
                        </p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">
                          {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                    {/* Render maintenance */}
                    {assetHistory.maintenance.map((m: any) => (
                      <div key={m.id} className="relative pl-4">
                        <div className="absolute left-[-15px] top-1.5 h-2 w-2 rounded-full bg-amber-500 border border-card" />
                        <p className="font-semibold text-foreground">Maintenance Ticket ({m.status})</p>
                        <p className="text-[10px] text-muted-foreground font-medium">
                          {m.description}
                        </p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">
                          Reported: {new Date(m.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            {isAdminOrManager && (
              <div className="border-t border-border pt-4 mt-6 grid grid-cols-2 gap-3 shrink-0">
                <button
                  onClick={() => handleEditClick(selectedAsset)}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-secondary border border-border text-foreground hover:bg-muted rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit Asset</span>
                </button>
                <button
                  onClick={() => handleRetireClick(selectedAsset)}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white border border-destructive/20 rounded-lg text-xs font-semibold transition"
                  disabled={selectedAsset.status === "RETIRED"}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Retire Asset</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* CREATE MODAL */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="font-bold text-sm text-foreground">Register New Asset</h3>
              <button
                onClick={() => setCreateOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Name */}
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Asset Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MacBook Pro 14"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg placeholder:text-muted-foreground/50 focus:outline-none"
                  />
                </div>

                {/* Tag */}
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Asset Tag (QR Code) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AST-0099"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg placeholder:text-muted-foreground/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category */}
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Category *</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:outline-none"
                  >
                    <option value="" disabled>Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Head Office Floor 3"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Serial Number */}
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Serial Number</label>
                  <input
                    type="text"
                    placeholder="e.g. C02D93NF29"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:outline-none"
                  />
                </div>

                {/* Cost */}
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Cost (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1499.00"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Purchase Date */}
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Acquisition Date</label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-border pt-4 mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 bg-secondary hover:bg-muted rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg font-semibold shadow-sm"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="font-bold text-sm text-foreground">Edit Asset Details</h3>
              <button
                onClick={() => setEditOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Name */}
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Asset Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:outline-none"
                  />
                </div>

                {/* Tag */}
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Asset Tag (Read-only)</label>
                  <input
                    type="text"
                    disabled
                    value={formData.tag}
                    className="w-full px-3 py-2 bg-muted/20 border border-border rounded-lg text-muted-foreground/60 focus:outline-none cursor-not-allowed uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category */}
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Category *</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Location *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Serial Number */}
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Serial Number</label>
                  <input
                    type="text"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:outline-none"
                  />
                </div>

                {/* Cost */}
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Cost (INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Purchase Date */}
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Acquisition Date</label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-border pt-4 mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="px-4 py-2 bg-secondary hover:bg-muted rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg font-semibold shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
