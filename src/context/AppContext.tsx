"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: string; // ADMIN, MANAGER, EMPLOYEE
  departmentId: string | null;
  department?: { id: string; name: string } | null;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string; // INFO, WARNING, SUCCESS
  read: boolean;
  createdAt: string;
}

interface AppContextType {
  user: UserSession | null;
  loading: boolean;
  login: (userData: UserSession) => void;
  logout: () => Promise<void>;
  theme: "light" | "dark";
  toggleTheme: () => void;
  notifications: NotificationItem[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addSystemNotification: (title: string, message: string, type: "INFO" | "WARNING" | "SUCCESS") => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  toast: { message: string; type: "success" | "error" | "info" } | null;
  showToast: (message: string, type: "success" | "error" | "info") => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
  };

  // Clear toast after 3 seconds whenever it is set
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const [theme, setTheme] = useState<"light" | "dark">("dark"); // Default dark mode for modern visual impact
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const router = useRouter();

  // 1. Fetch current session
  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error("Failed to load user session:", e);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    }
  };

  // 3. Mark single notification read
  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch (e) {
      console.error("Failed to mark notification as read:", e);
    }
  };

  // 4. Mark all as read
  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "POST",
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (e) {
      console.error("Failed to mark all as read:", e);
    }
  };

  // 5. Add simulated client-side notification
  const addSystemNotification = (title: string, message: string, type: "INFO" | "WARNING" | "SUCCESS") => {
    const newNotif: NotificationItem = {
      id: Math.random().toString(),
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Initialize session & theme
  useEffect(() => {
    fetchSession();

    // Check system preference or localStorage
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      document.documentElement.classList.add("dark"); // Default dark mode
    }
  }, []);

  // Sync notifications when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Periodically poll notifications for simulated real-time impact
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [user]);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const login = (userData: UserSession) => {
    setUser(userData);
    router.push("/dashboard");
    router.refresh();
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        theme,
        toggleTheme,
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        addSystemNotification,
        commandPaletteOpen,
        setCommandPaletteOpen,
        toast,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
