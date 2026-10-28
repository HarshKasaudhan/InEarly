"use client";

import React, { useState, useEffect } from "react";
import { WellnessPlanCard, WellnessGoal } from "./WellnessPlanCard";

interface StoredMemory {
  id: string;
  user_id: string;
  mode: string;
  summary_snippet: string;
  created_at: string;
  retention_expiry: string;
  confirmed_tags: string[];
  days_until_purge: number;
  data_retention_policy: string;
}

interface PrivacyDashboardProps {
  userId?: string;
  pseudonym?: string;
  onAccountWiped?: () => void;
  onBackToChat?: () => void;
}

export const PrivacyMemoryDashboard: React.FC<PrivacyDashboardProps> = ({
  userId = "anon-user-default",
  pseudonym = "CalmMonsoon_24",
  onAccountWiped,
  onBackToChat,
}) => {
  const [memories, setMemories] = useState<StoredMemory[]>([]);
  const [activeGoals, setActiveGoals] = useState<WellnessGoal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showWipeConfirm, setShowWipeConfirm] = useState<boolean>(false);
  const [isWiping, setIsWiping] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/memories?user_id=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        setMemories(data.memories || []);
        setActiveGoals(data.active_goals || []);
      }
    } catch (e) {
      console.error("Failed to load memories:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const handleDeleteSingleMemory = async (memoryId: string) => {
    setDeletingId(memoryId);
    try {
      const res = await fetch(`/api/v1/memories/${memoryId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMemories((prev) => prev.filter((m) => m.id !== memoryId));
        setStatusMessage("Check-in memory permanently purged from database.");
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (e) {
      console.error("Deletion failed:", e);
    } finally {
      setDeletingId(null);
    }
  };

  const handleExecuteAccountErasure = async () => {
    setIsWiping(true);
    try {
      const res = await fetch(`/api/v1/account-data?user_id=${encodeURIComponent(userId)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("inearly_session");
        }
        setShowWipeConfirm(false);
        if (onAccountWiped) {
          onAccountWiped();
        }
      }
    } catch (e) {
      console.error("Account wipe failed:", e);
      setStatusMessage("Failed to complete account erasure. Please retry.");
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto w-full animate-fade-in p-4 sm:p-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>🔐</span>
            <span>User-Owned Privacy & Memory Controls</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Memory &amp; Data Vault ({pseudonym})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Compliant with India&apos;s Digital Personal Data Protection (DPDP) Act 2023. You have complete ownership of all stored memories.
          </p>
        </div>

        {onBackToChat && (
          <button
            onClick={onBackToChat}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            ← Return to Chat
          </button>
        )}
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* 1. DATA MINIMIZATION & RETENTION POLICY BANNER */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 shadow-sm">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
          <span className="text-[10px] font-mono text-teal-700 dark:text-teal-400 uppercase tracking-wider block">
            Storage Posture
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">Zero Raw Plaintext</span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Transcripts are envelope-encrypted or stored on device.</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
          <span className="text-[10px] font-mono text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
            Lifecycle Policy
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">30-Day Auto-Prune</span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Expired conversations are hard-deleted automatically.</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
          <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
            Right to Erasure
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">100% User Owned</span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Delete individual sessions or wipe everything instantly.</p>
        </div>
      </div>

      {/* 2. STORED CHECK-INS & APPROVED SUMMARIES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Stored Check-Ins &amp; Summaries</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              {memories.length}
            </span>
          </h3>
          <span className="text-xs text-slate-400 dark:text-slate-500">Individual session control</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading stored memories...</div>
        ) : memories.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-300">No persistent check-ins stored.</p>
            <p>You are running in ephemeral mode, or all memories have been pruned.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {memories.map((m) => (
              <div
                key={m.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-400">
                        Mode: {m.mode}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {new Date(m.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-mono">
                        ⏱️ Auto-purges in {m.days_until_purge} days
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                      {m.summary_snippet}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteSingleMemory(m.id)}
                    disabled={deletingId === m.id}
                    className="shrink-0 p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20 transition-all cursor-pointer text-xs"
                    title="Permanently erase this check-in"
                  >
                    {deletingId === m.id ? "Erasing..." : "🗑️ Delete"}
                  </button>
                </div>

                {m.confirmed_tags.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase">Confirmed Themes:</span>
                    {m.confirmed_tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                      >
                        ✓ {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. ACTIVE WELLNESS GOALS (OPTED-IN) */}
      {activeGoals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Your Active Coping Goals</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-mono">
              {activeGoals.length}
            </span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeGoals.map((g) => (
              <WellnessPlanCard
                key={g.id}
                recommendation={g}
                userId={userId}
                onGoalUpdated={fetchDashboardData}
              />
            ))}
          </div>
        </div>
      )}

      {/* 4. PERMANENT ACCOUNT ERASURE (DPDP ACT 2023 RIGHT TO BE FORGOTTEN) */}
      <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border-2 border-rose-300 dark:border-rose-500/30 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
              <span>⚠️</span>
              <span>Right to Erasure (DPDP Act 2023)</span>
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Permanently Wipe All Account Data</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1 max-w-xl">
              Under India&apos;s privacy law, you can irreversibly hard-delete all your conversations,
              messages, and consent records. This action cannot be undone.
            </p>
          </div>

          <button
            onClick={() => setShowWipeConfirm(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer shrink-0"
          >
            Erase All My Data
          </button>
        </div>
      </div>

      {/* 5. ACCOUNT ERASURE CONFIRMATION MODAL */}
      {showWipeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="max-w-md w-full bg-slate-900 border-2 border-rose-500/80 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-rose-400">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="text-lg font-extrabold text-white">Irreversible Erasure</h3>
                <span className="text-xs text-rose-400">Right to be Forgotten</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to completely wipe all your records for <strong>{pseudonym}</strong>?
              This will hard-delete every check-in, message, confirmed theme, and consent record.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowWipeConfirm(false)}
                disabled={isWiping}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAccountErasure}
                disabled={isWiping}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                {isWiping ? "Erasing Everything..." : "Yes, Permanently Wipe Everything"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
