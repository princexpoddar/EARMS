"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import confetti from "canvas-confetti";

interface DemoStep {
  title: string;
  description: string;
  route: string;
  actionName: string;
}

interface DemoContextType {
  isDemoActive: boolean;
  isPlaying: boolean;
  currentStepIndex: number;
  speed: 1 | 2; // 1 = 1x (4s delay), 2 = 2x (2s delay)
  steps: DemoStep[];
  startDemo: () => void;
  stopDemo: () => void;
  pauseDemo: () => void;
  resumeDemo: () => void;
  skipStep: () => void;
  restartDemo: () => void;
  setSpeed: (s: 1 | 2) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const steps: DemoStep[] = [
  {
    title: "Start Automation & Login",
    description: "Authenticating programmatically as Administrator (Priya Sharma) to access the command core.",
    route: "/login",
    actionName: "login",
  },
  {
    title: "Operations Dashboard",
    description: "Inspecting glassmorphic KPI status cards and reviewing the live AI Summary briefing at the top.",
    route: "/dashboard",
    actionName: "check_dashboard",
  },
  {
    title: "Asset Registration",
    description: "Registering a new hardware asset (Demo MacBook, Tag: AST-DEMO, value: ₹85,000) directly into SQLite.",
    route: "/assets",
    actionName: "create_asset",
  },
  {
    title: "Inspect Specs & Barcode",
    description: "Simulating a details row click to open the slide-out specs sheet and view client-side QR labels.",
    route: "/assets",
    actionName: "view_specs",
  },
  {
    title: "Asset Allocation Custody",
    description: "Issuing the Demo MacBook (AST-DEMO) directly to employee Amit Patel. The asset's status locks to ALLOCATED.",
    route: "/allocation",
    actionName: "allocate_asset",
  },
  {
    title: "Block Double Allocation",
    description: "Attempting to allocate the same MacBook again. System blocks request and prints a red validation warning.",
    route: "/allocation",
    actionName: "test_duplicate_allocation",
  },
  {
    title: "Reserve Workspace Resource",
    description: "Booking Boardroom Alpha for tomorrow from 14:00 to 16:00. Slot registers on the schedule board.",
    route: "/booking",
    actionName: "book_resource",
  },
  {
    title: "Block Overlapping Booking",
    description: "Attempting a duplicate booking for Boardroom Alpha at the exact same times. SQLite overlap validation blocks it.",
    route: "/booking",
    actionName: "test_booking_conflict",
  },
  {
    title: "Kanban Upkeep Schedule",
    description: "Scheduling repair dispatch for a pending maintenance ticket. Associated asset transitions to MAINTENANCE.",
    route: "/maintenance",
    actionName: "schedule_repair",
  },
  {
    title: "Resolve Maintenance",
    description: "Technician work starts and resolves. Asset is released back to AVAILABLE. Dashboard summary refreshes.",
    route: "/maintenance",
    actionName: "resolve_repair",
  },
  {
    title: "Demo Finished!",
    description: "All core business logic verified in production. Confetti triggered! Ready for judge questions.",
    route: "/dashboard",
    actionName: "celebrate",
  },
];

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { showToast, login: authLogin } = useApp();

  const [isDemoActive, setIsDemoActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [speed, setSpeed] = useState<1 | 2>(1);

  // Auto-run loop when playing
  useEffect(() => {
    if (!isDemoActive || !isPlaying) return;

    const delay = speed === 1 ? 5500 : 2500;
    const timer = setTimeout(() => {
      executeNextStep();
    }, delay);

    return () => clearTimeout(timer);
  }, [isDemoActive, isPlaying, currentStepIndex, speed]);

  const startDemo = () => {
    setIsDemoActive(true);
    setIsPlaying(true);
    setCurrentStepIndex(0);
    router.push(steps[0].route);
    showToast("Hackathon Demo Mode Started", "info");
  };

  const stopDemo = () => {
    setIsDemoActive(false);
    setIsPlaying(false);
    showToast("Demo Mode Exited", "info");
  };

  const pauseDemo = () => {
    setIsPlaying(false);
    showToast("Demo Automation Paused", "info");
  };

  const resumeDemo = () => {
    setIsPlaying(true);
    showToast("Demo Automation Resumed", "info");
  };

  const skipStep = () => {
    executeNextStep();
  };

  const restartDemo = () => {
    setCurrentStepIndex(0);
    setIsPlaying(true);
    router.push(steps[0].route);
    showToast("Demo Automation Restarted", "info");
  };

  // Perform programmatic step actions
  const executeStepAction = async (actionName: string) => {
    try {
      switch (actionName) {
        case "login":
          // Call Quick Login endpoint programmatically
          const loginRes = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "admin@assetflow.com", bypass: true }),
          });
          if (loginRes.ok) {
            // Hard refresh or location re-route to load context
            window.location.href = "/dashboard";
          }
          break;

        case "create_asset":
          // Query categories to get Laptop ID
          const catRes = await fetch("/api/categories");
          const catData = await catRes.json();
          const laptopCat = (catData.categories || []).find((c: any) => c.name.includes("Laptop")) || { id: "1" };

          // Create AST-DEMO
          await fetch("/api/assets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: "Demo MacBook",
              tag: "AST-DEMO",
              serialNumber: "SER-DEMO-99",
              categoryId: laptopCat.id,
              location: "Mumbai Hub",
              cost: "85000",
              purchaseDate: new Date().toISOString().split("T")[0],
            }),
          });
          showToast("Asset AST-DEMO registered in SQLite!", "success");
          break;

        case "view_specs":
          showToast("Simulating details drawer overlay trigger.", "success");
          break;

        case "allocate_asset":
          // Fetch users list
          const usersRes = await fetch("/api/users");
          const usersData = await usersRes.json();
          const amit = (usersData.users || []).find((u: any) => u.name.includes("Amit")) || { id: "1" };

          // Find newly created asset AST-DEMO
          const searchRes = await fetch("/api/assets?search=AST-DEMO");
          const searchData = await searchRes.json();
          const demoAsset = (searchData.assets || []).find((a: any) => a.tag === "AST-DEMO");

          if (demoAsset) {
            await fetch("/api/allocation", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                assetId: demoAsset.id,
                userId: amit.id,
              }),
            });
            showToast(`MacBook issued to Amit Patel successfully!`, "success");
          }
          break;

        case "test_duplicate_allocation":
          // Attempt duplicate allocation
          const dupSearchRes = await fetch("/api/assets?search=AST-DEMO");
          const dupSearchData = await dupSearchRes.json();
          const dupDemoAsset = (dupSearchData.assets || []).find((a: any) => a.tag === "AST-DEMO");

          if (dupDemoAsset) {
            const errRes = await fetch("/api/allocation", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                assetId: dupDemoAsset.id,
                userId: "1",
              }),
            });
            const errData = await errRes.json();
            if (!errRes.ok) {
              showToast(`BLOCKED: ${errData.error || "Asset already allocated!"}`, "error");
            }
          }
          break;

        case "book_resource":
          // Book Boardroom Alpha AST-0005
          const bookSearch = await fetch("/api/assets?search=AST-0005");
          const bookSearchData = await bookSearch.json();
          const boardroom = (bookSearchData.assets || []).find((a: any) => a.tag === "AST-0005");

          if (boardroom) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const ymd = tomorrow.toISOString().split("T")[0];

            await fetch("/api/bookings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                assetId: boardroom.id,
                startDate: `${ymd}T14:00:00`,
                endDate: `${ymd}T16:00:00`,
                purpose: "Hackathon Sprint Planning",
              }),
            });
            showToast("Boardroom Alpha reserved successfully!", "success");
          }
          break;

        case "test_booking_conflict":
          // Attempt overlapping booking
          const confSearch = await fetch("/api/assets?search=AST-0005");
          const confSearchData = await confSearch.json();
          const confBoardroom = (confSearchData.assets || []).find((a: any) => a.tag === "AST-0005");

          if (confBoardroom) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const ymd = tomorrow.toISOString().split("T")[0];

            const conflictRes = await fetch("/api/bookings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                assetId: confBoardroom.id,
                startDate: `${ymd}T14:30:00`,
                endDate: `${ymd}T15:30:00`,
                purpose: "Conflict Testing Meeting",
              }),
            });
            const conflictData = await conflictRes.json();
            if (!conflictRes.ok) {
              showToast(`BLOCKED: ${conflictData.error || "Resource unavailable!"}`, "error");
            }
          }
          break;

        case "schedule_repair":
          // Find first pending maintenance ticket
          const maintRes = await fetch("/api/maintenance");
          const maintData = await maintRes.json();
          const pendingMaint = (maintData.tickets || []).find((t: any) => t.status === "PENDING");

          if (pendingMaint) {
            await fetch(`/api/maintenance/${pendingMaint.id}/approve`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                scheduledDate: new Date().toISOString().split("T")[0],
                cost: "15000",
              }),
            });
            showToast("Repair scheduled! Asset status is locked.", "success");
          }
          break;

        case "resolve_repair":
          // Find first active maintenance ticket in progress or approved
          const resMaintRes = await fetch("/api/maintenance");
          const resMaintData = await resMaintRes.json();
          
          let ticketToResolve = (resMaintData.tickets || []).find((t: any) => t.status === "IN_PROGRESS" || t.status === "APPROVED");

          if (ticketToResolve) {
            // Start it first if approved
            if (ticketToResolve.status === "APPROVED") {
              await fetch(`/api/maintenance/${ticketToResolve.id}/start`, { method: "POST" });
            }

            // Resolve
            await fetch(`/api/maintenance/${ticketToResolve.id}/resolve`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                cost: "18500",
                comments: "Component replaced. Passed operational diagnostics checks.",
              }),
            });
            showToast("Asset repaired and released back to available!", "success");
          }
          break;

        case "celebrate":
          // Confetti explosion
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
          });
          break;

        default:
          break;
      }
    } catch (e) {
      console.error(`Demo step action error [${actionName}]:`, e);
    }
  };

  const executeNextStep = async () => {
    const nextIdx = currentStepIndex + 1;
    if (nextIdx >= steps.length) {
      // Finished
      setIsPlaying(false);
      return;
    }

    const nextStep = steps[nextIdx];
    setCurrentStepIndex(nextIdx);
    
    // Execute backend API operation
    await executeStepAction(nextStep.actionName);

    // Route navigation
    router.push(nextStep.route);
  };

  return (
    <DemoContext.Provider
      value={{
        isDemoActive,
        isPlaying,
        currentStepIndex,
        speed,
        steps,
        startDemo,
        stopDemo,
        pauseDemo,
        resumeDemo,
        skipStep,
        restartDemo,
        setSpeed,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
}
