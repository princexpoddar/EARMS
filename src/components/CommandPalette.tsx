"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Search, Laptop, Calendar, Wrench, LayoutDashboard, ArrowLeftRight, Bell, X, Terminal } from "lucide-react";

interface AssetResult {
  id: string;
  name: string;
  tag: string;
  status: string;
}

export default function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen } = useApp();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AssetResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searching, setSearching] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [commandPaletteOpen]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setCommandPaletteOpen(false);
      }
    }
    if (commandPaletteOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  // Fetch search results from API
  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/assets?search=${encodeURIComponent(query)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.assets || []);
          setSelectedIndex(0);
        }
      } catch (e) {
        console.error("Command palette search failed:", e);
      } finally {
        setSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setCommandPaletteOpen(false);
      return;
    }

    const navigationOptionsCount = results.length + 5; // results + 5 navigation shortcuts

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % navigationOptionsCount);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + navigationOptionsCount) % navigationOptionsCount);
    } else if (e.key === "Enter") {
      e.preventDefault();
      triggerAction(selectedIndex);
    }
  };

  const triggerAction = (index: number) => {
    setCommandPaletteOpen(false);

    // Shortcuts mapping
    if (index === 0 && results.length === 0) return;

    if (index < results.length) {
      const asset = results[index];
      router.push(`/assets?search=${asset.tag}`);
      return;
    }

    const shortcutIndex = index - results.length;
    switch (shortcutIndex) {
      case 0:
        router.push("/dashboard");
        break;
      case 1:
        router.push("/assets");
        break;
      case 2:
        router.push("/allocation");
        break;
      case 3:
        router.push("/booking");
        break;
      case 4:
        router.push("/maintenance");
        break;
      default:
        break;
    }
  };

  if (!commandPaletteOpen) return null;

  const navigationShortcuts = [
    { name: "Go to Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Go to Assets Catalog", href: "/assets", icon: Laptop },
    { name: "Go to Allocations & Transfers", href: "/allocation", icon: ArrowLeftRight },
    { name: "Go to Resource Bookings", href: "/booking", icon: Calendar },
    { name: "Go to Maintenance Hub", href: "/maintenance", icon: Wrench },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm p-4">
      <div
        ref={containerRef}
        className="w-full max-w-xl rounded-xl border border-border bg-card shadow-2xl ring-1 ring-black/5 overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-muted/20">
          <Search className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search assets..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            onClick={() => setCommandPaletteOpen(false)}
            className="rounded p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto p-2">
          {/* Dynamic Search Results */}
          {query && (
            <div className="mb-4">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider px-3 mb-1 block">
                Assets Matching "{query}"
              </span>
              {searching ? (
                <div className="text-xs text-muted-foreground px-3 py-2 italic">Searching...</div>
              ) : results.length === 0 ? (
                <div className="text-xs text-muted-foreground px-3 py-2 italic">No assets matching tag or name</div>
              ) : (
                results.map((asset, idx) => {
                  const isFocused = selectedIndex === idx;
                  return (
                    <div
                      key={asset.id}
                      onClick={() => triggerAction(idx)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                        isFocused ? "bg-secondary text-primary" : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Laptop className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
                        <span className="text-xs font-semibold text-foreground truncate">{asset.name}</span>
                        <span className="text-[10px] font-mono bg-muted/80 text-muted-foreground px-1.5 py-0.5 rounded uppercase">{asset.tag}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          asset.status === "AVAILABLE"
                            ? "bg-green-500/10 text-green-500 border border-green-500/20"
                            : asset.status === "ALLOCATED"
                            ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                            : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        }`}
                      >
                        {asset.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Navigation Shortcuts */}
          <div>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider px-3 mb-1 block">
              Quick Shortcuts & Commands
            </span>
            {navigationShortcuts.map((shortcut, idx) => {
              const shortcutIndexInSelection = results.length + idx;
              const isFocused = selectedIndex === shortcutIndexInSelection;
              const Icon = shortcut.icon;
              return (
                <div
                  key={shortcut.name}
                  onClick={() => triggerAction(shortcutIndexInSelection)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    isFocused ? "bg-secondary text-primary" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4.5 w-4.5 text-muted-foreground" />
                    <span className="text-xs font-medium">{shortcut.name}</span>
                  </div>
                  <kbd className="inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[9px] font-medium leading-none text-muted-foreground">
                    ↵ Select
                  </kbd>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
