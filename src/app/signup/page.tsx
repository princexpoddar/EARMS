"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { User, Lock, Mail, Building, ArrowRight, ArrowLeft } from "lucide-react";

interface Department {
  id: string;
  name: string;
}

export default function SignupPage() {
  const { login, showToast } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; department?: string }>({});

  useEffect(() => {
    async function loadDepartments() {
      try {
        const res = await fetch("/api/departments");
        if (res.ok) {
          const data = await res.json();
          setDepartments(data.departments || []);
        }
      } catch (e) {
        console.error("Failed to load departments:", e);
      }
    }
    loadDepartments();
  }, []);

  const validate = () => {
    const tempErrors: { name?: string; email?: string; password?: string; department?: string } = {};
    if (!name.trim()) tempErrors.name = "Full name is required";
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
    if (!departmentId) {
      tempErrors.department = "Department selection is required";
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, departmentId }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Registration failed", "error");
      } else {
        showToast(`Account created successfully! Welcome, ${data.user.name}`, "success");
        login(data.user);
      }
    } catch (err) {
      console.error(err);
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="text-xs text-zinc-400 mt-1.5">
            Register as an Employee to start request flows
          </p>
        </div>

        {/* Card wrapper */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Full Name</label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition"
                  disabled={loading}
                />
              </div>
              {errors.name && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.name}</p>}
            </div>

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

            {/* Department input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Department</label>
              <div className="relative flex items-center">
                <Building className="absolute left-3.5 h-4 w-4 text-zinc-500 z-10" />
                <select
                  value={departmentId}
                  onChange={(e) => {
                    setDepartmentId(e.target.value);
                    if (errors.department) setErrors((prev) => ({ ...prev, department: undefined }));
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition appearance-none"
                  disabled={loading}
                >
                  <option value="" disabled className="bg-zinc-950">Select your Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id} className="bg-zinc-950">
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.department && <p className="text-[10px] text-red-500 font-semibold mt-1">{errors.department}</p>}
            </div>

            {/* Password input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Password</label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 h-4 w-4 text-zinc-500" />
                <input
                  type="password"
                  placeholder="•••••••• (Min 6 characters)"
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
              {loading ? "Creating Account..." : "Create Account"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </div>

        {/* Bottom sign up helper */}
        <div className="text-center text-xs text-zinc-400">
          <Link href="/login" className="inline-flex items-center gap-1.5 font-semibold text-zinc-400 hover:text-zinc-200">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
