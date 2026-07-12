"use client";

import React, { useState } from "react";
import { AppProvider, useApp } from "@/context/AppContext";
import { DemoProvider } from "@/context/DemoContext";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import CommandPalette from "@/components/CommandPalette";
import AiCopilot from "@/components/AiCopilot";
import DemoController from "@/components/DemoController";
import { usePathname } from "next/navigation";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

function ToastContainer() {
  const { toast } = useApp();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />,
    info: <Info className="h-5 w-5 text-blue-500 shrink-0" />,
  };

  const borderColors = {
    success: "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300",
    error: "border-red-500/20 bg-red-500/5 text-red-700 dark:text-red-300",
    info: "border-blue-500/20 bg-blue-500/5 text-blue-700 dark:text-blue-300",
  };

  return (
    <div className="fixed top-5 right-5 z-[9999] max-w-sm w-full bg-card/90 border border-border rounded-xl p-4 shadow-2xl backdrop-blur-md animate-fade-in">
      <div className={`flex items-center gap-3 w-full p-2 border rounded-lg ${borderColors[toast.type]}`}>
        {icons[toast.type]}
        <p className="text-xs font-semibold flex-1 leading-snug">{toast.message}</p>
      </div>
    </div>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loading } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
            Booting AssetFlow ERP...
          </span>
        </div>
      </div>
    );
  }

  if (isAuthPage) {
    return <div className="min-h-screen flex flex-col">{children}</div>;
  }

  return (
    <DemoProvider>
      <div className="min-h-screen flex flex-col bg-background text-foreground animate-fade-in">
        <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        <div className="flex-1 flex flex-col sm:pl-64">
          <Topbar setMobileOpen={setMobileOpen} />
          <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
        <CommandPalette />
        <AiCopilot />
        <DemoController />
      </div>
    </DemoProvider>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <LayoutContent>{children}</LayoutContent>
      <ToastContainer />
    </AppProvider>
  );
}
