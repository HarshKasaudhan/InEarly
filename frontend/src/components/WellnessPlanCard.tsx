"use client";

import React, { useState } from "react";

export interface WellnessGoal {
  id: string;
  title: string;
  duration_minutes: number;
  evidence_rationale: string;
  category: string;
  instructions: string[];
  status?: "opted_in" | "skipped" | "completed";
}

interface WellnessPlanCardProps {
  recommendation: WellnessGoal;
  userId?: string;
  onGoalUpdated?: (goalId: string, status: "opted_in" | "skipped") => void;
}

export const WellnessPlanCard: React.FC<WellnessPlanCardProps> = ({
  recommendation,
  userId,
  onGoalUpdated,
}) => {
  const [currentStatus, setCurrentStatus] = useState<string>(recommendation.status || "skipped");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const handleAction = async (action: "opted_in" | "skipped") => {
    setIsUpdating(true);
    setCurrentStatus(action);

    try {
      await fetch("/api/v1/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId || "anon-user-default",
          goal_id: recommendation.id,
          action,
        }),
      });

      if (onGoalUpdated) {
        onGoalUpdated(recommendation.id, action);
      }
    } catch (e) {
      console.error("Failed to update goal:", e);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        currentStatus === "opted_in"
          ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-500/50 shadow-md ring-1 ring-indigo-400/20"
          : "bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              ⏱️ {recommendation.duration_minutes} mins
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Evidence-Informed
            </span>
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            {recommendation.title}
          </h4>
        </div>

        {currentStatus === "opted_in" && (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
            ✓ Opted-In
          </span>
        )}
      </div>

      {/* Evidence Rationale */}
      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3 italic">
        &ldquo;{recommendation.evidence_rationale}&rdquo;
      </p>

      {/* Step Instructions */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 mb-3 space-y-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
          Simple Steps:
        </span>
        <ol className="list-decimal list-inside text-xs text-slate-700 dark:text-slate-300 space-y-1">
          {recommendation.instructions.map((step, idx) => (
            <li key={idx} className="leading-normal">
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* User Opt-In / Skip Controls */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-slate-400 dark:text-slate-500">You are in control • No pressure</span>
        <div className="flex items-center gap-2">
          {currentStatus === "opted_in" ? (
            <button
              onClick={() => handleAction("skipped")}
              disabled={isUpdating}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Remove Goal
            </button>
          ) : (
            <>
              <button
                onClick={() => handleAction("skipped")}
                disabled={isUpdating}
                className="text-xs px-3 py-1.5 rounded-xl hover:text-slate-700 dark:hover:text-slate-300 text-slate-400 dark:text-slate-500 transition-colors cursor-pointer"
              >
                Skip for now
              </button>
              <button
                onClick={() => handleAction("opted_in")}
                disabled={isUpdating}
                className="text-xs px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-1.5"
              >
                <span>✓ Opt-in to Goal</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
