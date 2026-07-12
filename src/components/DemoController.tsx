"use client";

import React from "react";
import { useDemo } from "@/context/DemoContext";
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  XCircle,
  Zap,
  Gauge,
  HelpCircle,
} from "lucide-react";

export default function DemoController() {
  const {
    isDemoActive,
    isPlaying,
    currentStepIndex,
    speed,
    steps,
    stopDemo,
    pauseDemo,
    resumeDemo,
    skipStep,
    restartDemo,
    setSpeed,
  } = useDemo();

  if (!isDemoActive) return null;

  const currentStep = steps[currentStepIndex];
  const progressPercent = Math.round(((currentStepIndex + 1) / steps.length) * 100);

  return (
    <div className="fixed bottom-6 left-1/2 z-[9999] -translate-x-1/2 w-full max-w-xl px-4 animate-slide-up">
      <div className="bg-zinc-950/90 border border-zinc-800 text-zinc-100 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex flex-col gap-3 relative overflow-hidden">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-800">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Info row */}
        <div className="flex items-start justify-between mt-1.5 gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 animate-pulse">
                Automation Active
              </span>
              <span className="text-[10px] text-zinc-400 font-bold">
                Step {currentStepIndex + 1} of {steps.length}
              </span>
            </div>
            <h4 className="font-extrabold text-sm tracking-tight text-white truncate">
              {currentStep.title}
            </h4>
            <p className="text-[11px] leading-relaxed text-zinc-400 mt-1 leading-normal pr-4">
              {currentStep.description}
            </p>
          </div>

          <button
            onClick={stopDemo}
            className="p-1 text-zinc-400 hover:text-red-500 transition shrink-0"
            title="Exit Demo"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between border-t border-zinc-800/80 pt-3 mt-1 text-xs">
          {/* Left: Speed controls */}
          <div className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">
            <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
            <button
              onClick={() => setSpeed(1)}
              className={`px-1.5 py-0.5 rounded font-black text-[9px] uppercase tracking-wider transition ${
                speed === 1 ? "bg-primary text-primary-foreground shadow" : "text-zinc-400 hover:text-white"
              }`}
            >
              1x
            </button>
            <button
              onClick={() => setSpeed(2)}
              className={`px-1.5 py-0.5 rounded font-black text-[9px] uppercase tracking-wider transition ${
                speed === 2 ? "bg-primary text-primary-foreground shadow" : "text-zinc-400 hover:text-white"
              }`}
            >
              2x
            </button>
          </div>

          {/* Right: Operations buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={restartDemo}
              className="p-2 hover:bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 hover:text-white transition"
              title="Restart Automation"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            
            {isPlaying ? (
              <button
                onClick={pauseDemo}
                className="flex items-center gap-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white rounded-xl font-bold transition shadow-md"
                title="Pause Auto-play"
              >
                <Pause className="h-4 w-4" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={resumeDemo}
                className="flex items-center gap-1 px-4 py-2 bg-primary hover:opacity-90 text-primary-foreground rounded-xl font-bold transition shadow-md"
                title="Resume Auto-play"
              >
                <Play className="h-4 w-4 fill-primary-foreground" />
                <span>Resume</span>
              </button>
            )}

            {currentStepIndex < steps.length - 1 && (
              <button
                onClick={skipStep}
                className="flex items-center gap-1 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl font-bold transition"
                title="Skip to next step"
              >
                <span>Skip</span>
                <SkipForward className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
