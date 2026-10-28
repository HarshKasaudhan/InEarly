"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  Trash2, 
  Check, 
  X, 
  Lock, 
  AlertTriangle,
  History,
  RotateCcw
} from "lucide-react";

interface MemoryConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  pseudonym: string;
  isMemoryEnabled: boolean;
  onToggleMemory: (enabled: boolean) => void;
  onPurgeAll: () => Promise<void>;
}

export const MemoryConsentModal: React.FC<MemoryConsentModalProps> = ({
  isOpen,
  onClose,
  userId,
  pseudonym,
  isMemoryEnabled,
  onToggleMemory,
  onPurgeAll,
}) => {
  const [confirmPurge, setConfirmPurge] = useState(false);
  const [purging, setPurging] = useState(false);
  const [purgedSuccess, setPurgedSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePurge = async () => {
    setPurging(true);
    try {
      await onPurgeAll();
      setPurgedSuccess(true);
      setTimeout(() => {
        setPurgedSuccess(false);
        setConfirmPurge(false);
        onClose();
      }, 1400);
    } catch (e) {
      console.error("Purge error:", e);
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gradient Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-400 via-emerald-500 to-indigo-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Privacy, Memory &amp; Consent
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              India DPDP Act (2023) Aligned Data Sovereignty
            </p>
          </div>
        </div>

        {/* Information Box */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-300 space-y-2 mb-4">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100 text-xs">
            <Lock className="w-3.5 h-3.5 text-teal-500" />
            <span>Zero-PII &amp; Ephemeral Memory Policy</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            Inearly never collects your name, phone number, email, or Aadhaar. When context memory is enabled, previous session turns are stored pseudonymously under <strong className="text-teal-600 dark:text-teal-400">{pseudonym}</strong> to give you personalized coping recall.
          </p>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            ✓ Your chat transcripts are never sold or used for public AI model training.
          </div>
        </div>

        {/* Memory Toggle */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 mb-4 flex items-center justify-between">
          <div className="space-y-0.5 pr-3">
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-indigo-500" />
              <span>Context Memory &amp; History Retention</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isMemoryEnabled 
                ? "Active: AI remembers earlier conversation turns for empathetic continuity." 
                : "Paused: Sessions are purely ephemeral and forgotten when closed."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onToggleMemory(!isMemoryEnabled)}
            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
              isMemoryEnabled ? "bg-teal-500" : "bg-slate-300 dark:bg-slate-700"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                isMemoryEnabled ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* One-Click Purge History Section */}
        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3">
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Right to Erasure (DPDP Act 2023)
          </div>

          {!confirmPurge ? (
            <button
              onClick={() => setConfirmPurge(true)}
              className="w-full py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge All Past Conversations</span>
            </button>
          ) : (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2.5 animate-fade-in">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Permanently wipe all conversation history?</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                This action is irreversible. All past messages, transcripts, and classified concern tags will be completely erased from the database and local storage.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handlePurge}
                  disabled={purging}
                  className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {purging ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>Purging...</span>
                    </>
                  ) : purgedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Purged Cleanly!</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Yes, Purge Everything</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setConfirmPurge(false)}
                  disabled={purging}
                  className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
