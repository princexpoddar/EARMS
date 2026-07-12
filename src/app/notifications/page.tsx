"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { Bell, Check, Trash2, MailOpen, HelpCircle } from "lucide-react";

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useApp();

  const handleMarkRead = (id: string, isRead: boolean) => {
    if (!isRead) {
      markAsRead(id);
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return "border-l-4 border-l-green-500 bg-green-500/5";
      case "WARNING":
        return "border-l-4 border-l-amber-500 bg-amber-500/5";
      default:
        return "border-l-4 border-l-blue-500 bg-blue-500/5";
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Notification Center
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Stay up to date with allocation schedules, transfer requests, and maintenance alerts.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-secondary border border-border text-foreground hover:bg-muted rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Check className="h-4 w-4" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-10 text-center flex flex-col items-center justify-center">
            <Bell className="h-10 w-10 text-muted-foreground/30 mb-3 animate-pulse" />
            <h3 className="font-semibold text-sm">All caught up!</h3>
            <p className="text-xs text-muted-foreground mt-1">You have no new notifications.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleMarkRead(n.id, n.read)}
              className={`p-4 rounded-xl border border-border flex items-start gap-4 transition-colors cursor-pointer ${
                n.read ? "bg-card hover:bg-muted/10 opacity-70" : `bg-card hover:bg-muted/20 ${getNotificationColor(n.type)}`
              }`}
            >
              {/* Icon indicator */}
              <div className="p-2 rounded-lg bg-secondary shrink-0">
                <Bell className={`h-4.5 w-4.5 ${n.read ? "text-muted-foreground" : "text-primary"}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`text-xs font-bold truncate ${n.read ? "text-muted-foreground" : "text-foreground"}`}>
                    {n.title}
                  </h4>
                  <span className="text-[9px] text-muted-foreground">
                    {new Date(n.createdAt).toLocaleDateString()} · {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pr-6">
                  {n.message}
                </p>
              </div>

              {/* Action Button */}
              {!n.read && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(n.id);
                  }}
                  className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground shrink-0"
                  title="Mark as Read"
                >
                  <MailOpen className="h-4 w-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
