"use client";

import React, { useState } from "react";
import {
  Camera,
  CameraOff,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Smile,
  RefreshCw,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Eye,
  Lock,
} from "lucide-react";
import { FaceAnalysisResult } from "./FaceEmotionScannerModal";

interface LiveEmotionCompanionWidgetProps {
  setVideoRef: (node: HTMLVideoElement | null) => void;
  isAnalyzing: boolean;
  lastAnalysis: FaceAnalysisResult | null;
  onOpenDiagnostics: () => void;
  onTogglePause?: () => void;
  isPaused?: boolean;
  onStop: () => void;
  scanIntervalSeconds?: number;
}

const EMOTION_EMOJIS: Record<string, string> = {
  angry: "😠",
  disgust: "😣",
  fear: "😨",
  happy: "😊",
  neutral: "😐",
  sad: "🥺",
  surprise: "😲",
};

export function LiveEmotionCompanionWidget({
  setVideoRef,
  isAnalyzing,
  lastAnalysis,
  onOpenDiagnostics,
  onTogglePause,
  isPaused = false,
  onStop,
  scanIntervalSeconds = 3.5,
}: LiveEmotionCompanionWidgetProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  const dominantEmotion = lastAnalysis?.dominant_emotion || lastAnalysis?.emotion?.dominant || "neutral";
  const confidence = lastAnalysis?.emotion?.confidence ?? null;
  const hasFace = Boolean(lastAnalysis?.face_detected);

  // Emotion-driven glow border
  const borderColor =
    dominantEmotion === "happy" || dominantEmotion === "calm"
      ? "border-emerald-500/80 shadow-emerald-500/20"
      : dominantEmotion === "sad" || dominantEmotion === "fear" || dominantEmotion === "angry"
      ? "border-amber-500/80 shadow-amber-500/20"
      : "border-teal-500/70 shadow-teal-500/20";

  if (isMinimized) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-lg animate-fade-in text-xs">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-semibold text-slate-200">
          Vision Sensing Active
        </span>
        {hasFace && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-medium text-[10px]">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Live Emotion Detected</span>
          </span>
        )}
        {hasFace && lastAnalysis?.emotion && (
          <span className="px-2 py-0.5 rounded-lg bg-teal-500/20 text-teal-300 font-mono text-[11px] capitalize">
            {EMOTION_EMOJIS[dominantEmotion] || "✨"} {dominantEmotion}
          </span>
        )}
        <button
          onClick={() => setIsMinimized(false)}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Expand Live Feed"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden bg-slate-950 border transition-all duration-500 shadow-xl ${borderColor}`}
    >
      {/* 1. TOP HEADER OVERLAY */}
      <div className="absolute top-0 inset-x-0 z-20 px-3 py-2 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-transparent flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              isPaused
                ? "bg-amber-400"
                : isAnalyzing
                ? "bg-teal-400 animate-ping"
                : "bg-emerald-400 animate-pulse"
            }`}
          />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-200 font-mono">
            {isPaused ? "Paused" : isAnalyzing ? "Analyzing..." : `Live Sensing (${scanIntervalSeconds}s)`}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {onTogglePause && (
            <button
              onClick={onTogglePause}
              className="p-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={isPaused ? "Resume real-time analysis" : "Pause analysis loop"}
            >
              {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            </button>
          )}

          <button
            onClick={onOpenDiagnostics}
            className="p-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-teal-300 hover:text-teal-200 transition-colors cursor-pointer"
            title="Open Detailed FER Diagnostics Modal"
          >
            <Eye className="w-3 h-3" />
          </button>

          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Minimize to Pill"
          >
            <Minimize2 className="w-3 h-3" />
          </button>

          <button
            onClick={onStop}
            className="p-1 rounded-lg bg-slate-900/80 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
            title="Turn Off Camera"
          >
            <CameraOff className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 2. LIVE CAMERA VIEWPORT */}
      <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        <video
          ref={setVideoRef}
          playsInline
          muted
          autoPlay
          className="w-full h-full object-cover transform -scale-x-100"
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            v.muted = true;
            v.play().catch(() => {});
          }}
        />

        {/* Dynamic Center Face Tracking Oval Guide */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div
            className={`w-36 h-48 sm:w-44 sm:h-56 border-2 border-dashed rounded-[48%] transition-all duration-500 flex flex-col items-center justify-end pb-2.5 ${
              hasFace
                ? "border-emerald-400/80 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                : "border-teal-400/40 animate-pulse"
            }`}
          >
            <span className="text-[10px] font-mono bg-slate-950/90 px-2.5 py-0.5 rounded-full border border-emerald-500/40 text-emerald-300 shadow-md flex items-center gap-1">
              {hasFace ? (
                <>
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span className="font-semibold">Live Emotion Detected</span>
                </>
              ) : (
                "Align Face"
              )}
            </span>
          </div>
        </div>

        {/* Live Analyzing Radar Scan Line Effect */}
        {isAnalyzing && (
          <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent animate-[pulse_1.5s_infinite] top-1/2 z-10" />
        )}
      </div>

      {/* 3. BOTTOM TELEMETRY FOOTER */}
      <div className="px-3 py-2 bg-slate-900/95 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[11px] backdrop-blur-md">
        {/* Clean Green Live Emotion Detected Indicator */}
        <div className="flex items-center gap-1.5 min-w-0">
          {hasFace ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold truncate shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">Live Emotion Detected</span>
            </span>
          ) : (
            <span className="text-slate-400 truncate flex items-center gap-1">
              <Camera className="w-3 h-3 text-slate-400 shrink-0" />
              <span>Align face in frame...</span>
            </span>
          )}
        </div>

        {/* Active Detected Emotion Pill: smooth & natural */}
        {hasFace && lastAnalysis?.emotion ? (
          <button
            onClick={onOpenDiagnostics}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/35 text-teal-200 text-[11px] font-semibold transition-all cursor-pointer truncate shrink-0 shadow-xs active:scale-95"
            title="Click to view full Swin Transformer FER distribution"
          >
            <span className="text-xs">{EMOTION_EMOJIS[dominantEmotion] || "✨"}</span>
            <span className="capitalize">{dominantEmotion}</span>
            {confidence !== null && (
              <span className="font-mono text-[9px] text-teal-300/80 bg-teal-900/50 px-1 py-0.5 rounded">
                {confidence}%
              </span>
            )}
          </button>
        ) : (
          <span className="text-[10px] text-slate-500 font-mono">
            {isPaused ? "Paused" : "Awaiting Face"}
          </span>
        )}
      </div>
    </div>
  );
}
