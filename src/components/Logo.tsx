"use client";

import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = "", size = 36 }: LogoProps) {
  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full transition-transform duration-300 hover:scale-105"
      >
        <defs>
          {/* Logo Gradients */}
          <linearGradient id="logo-grad-primary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" /> {/* Indigo */}
            <stop offset="100%" stopColor="#3b82f6" /> {/* Blue */}
          </linearGradient>
          <linearGradient id="logo-grad-accent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" /> {/* Emerald */}
            <stop offset="100%" stopColor="#06b6d4" /> {/* Cyan */}
          </linearGradient>
          {/* Glowing Filter */}
          <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <style>{`
          @keyframes logo-ring-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .logo-ring {
            animation: logo-ring-spin 24s linear infinite;
            transform-origin: 50px 50px;
          }
        `}</style>

        {/* Outer Hexagonal Flow Ring */}
        <polygon
          points="50,6 88,28 88,72 50,94 12,72 12,28"
          stroke="url(#logo-grad-accent)"
          strokeWidth="3"
          strokeDasharray="14 8"
          strokeLinecap="round"
          className="logo-ring"
        />

        {/* 3D Isometric Core Cube (Asset) */}
        {/* Top Face */}
        <polygon
          points="50,23 74,37 50,51 26,37"
          fill="url(#logo-grad-primary)"
          opacity="0.9"
        />
        {/* Left Face */}
        <polygon
          points="26,37 50,51 50,79 26,65"
          fill="url(#logo-grad-primary)"
          opacity="0.75"
        />
        {/* Right Face */}
        <polygon
          points="50,51 74,37 74,65 50,79"
          fill="url(#logo-grad-accent)"
          opacity="0.85"
        />

        {/* Diagonal white shine reflection cut */}
        <polygon
          points="50,23 62,30 38,44 26,37"
          fill="#ffffff"
          opacity="0.12"
        />

        {/* Intersecting Flow Ribbon */}
        <path
          d="M 20,44 L 50,61 L 80,44"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#logo-glow)"
          opacity="0.95"
        />
        
        {/* Center core light node */}
        <circle cx="50" cy="51" r="3" fill="#ffffff" filter="url(#logo-glow)" />
      </svg>
    </div>
  );
}
