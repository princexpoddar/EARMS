"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { Shield, Layers, User, Lock, Mail, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const { login, showToast } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const tempErrors: { email?: string; password?: string } = {};
    if (!email) {
      tempErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = "Invalid email format";
    }
    if (!password) {
      tempErrors.password = "Password is required";
    } else if (password.length < 6) {
      tempErrors.password = "Password must be at least 6 characters";
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Login failed", "error");
      } else {
        showToast(`Welcome back, ${data.user.name}!`, "success");
        login(data.user);
      }
    } catch (err) {
      console.error(err);
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role: "admin" | "manager" | "employee") => {
    const credentials = {
      admin: { email: "admin@assetflow.com", password: "admin123" },
      manager: { email: "manager@assetflow.com", password: "manager123" },
      employee: { email: "employee@assetflow.com", password: "employee123" },
    };

    const selected = credentials[role];
    setEmail(selected.email);
    setPassword(selected.password);

    // Run login immediately after state update
    setLoading(true);
    setTimeout(async () => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(selected),
        });

        const data = await res.json();

        if (res.ok) {
          showToast(`Logged in as ${role.toUpperCase()}`, "success");
          login(data.user);
        } else {
          showToast(data.error || "Login failed", "error");
        }
      } catch (err) {
        showToast("Quick login failed", "error");
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#09090b] text-zinc-100 overflow-hidden px-4">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-primary/10 blur-[80px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] rounded-full bg-indigo-500/5 blur-[80px]" />

      <div className="w-full max-w-md z-10 space-y-6">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-950 font-black text-xl tracking-wider shadow-lg mb-4">
            AF
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Sign in to AssetFlow</h1>
          <p className="text-xs text-zinc-400 mt-1.5">
            Enterprise Asset & Resource Management System
          </p>
        </div>

        {/* Card wrapper */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 h-4 w-4 text-zinc-500" />
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition"
                  disabled={loading}
                />
              </div>
              {errors.email && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.email}</p>}
            </div>

            {/* Password input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">Password</label>
                <a href="#" className="text-[10px] font-semibold text-zinc-400 hover:text-zinc-200">
                  Forgot password?
                </a>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 h-4 w-4 text-zinc-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition"
                  disabled={loading}
                />
              </div>
              {errors.password && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.password}</p>}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 py-2.5 rounded-lg bg-zinc-100 text-zinc-950 hover:bg-zinc-200 transition text-sm font-semibold shadow disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Authenticating..." : "Continue"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          {/* Quick login section */}
          <div className="border-t border-zinc-800 pt-5 space-y-3">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block text-center">
              Quick Role Login (For Judges)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin")}
                className="flex flex-col items-center gap-1.5 p-2 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-800/50 hover:border-zinc-700 transition"
              >
                <Shield className="h-4 w-4 text-amber-500" />
                <span className="text-[10px] font-bold">Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("manager")}
                className="flex flex-col items-center gap-1.5 p-2 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-800/50 hover:border-zinc-700 transition"
              >
                <Layers className="h-4 w-4 text-sky-400" />
                <span className="text-[10px] font-bold">Manager</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("employee")}
                className="flex flex-col items-center gap-1.5 p-2 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-800/50 hover:border-zinc-700 transition"
              >
                <User className="h-4 w-4 text-emerald-400" />
                <span className="text-[10px] font-bold">Employee</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom sign up helper */}
        <div className="text-center text-xs text-zinc-400">
          <span>New to AssetFlow? </span>
          <Link href="/signup" className="font-semibold text-zinc-200 hover:underline">
            Register as Employee
          </Link>
        </div>
      </div>
    </div>
  );
}
