"use client";

import React from "react";

interface WelcomeDisclosuresProps {
  onContinue: () => void;
}

export const WelcomeDisclosures: React.FC<WelcomeDisclosuresProps> = ({ onContinue }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Statement */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Privacy by Design • DPDP Act (2023) Compliant
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Welcome to Inearly
        </h2>
        <p className="text-slate-300 text-base leading-relaxed">
          A confidential, culturally attuned AI wellness companion designed for India.
          Before we begin, here are our four non-negotiable privacy commitments to you:
        </p>
      </div>

      {/* 4 Core Plain-Language Disclosures */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Disclosure 1 */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all shadow-md">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold text-lg mb-3">
            01
          </div>
          <h3 className="text-base font-bold text-white mb-1.5 flex items-center gap-2">
            You can skip questions
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            There is zero interrogation here. Share only what feels comfortable. You are in complete control of your pace and boundaries.
          </p>
        </div>

        {/* Disclosure 2 */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all shadow-md">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-lg mb-3">
            02
          </div>
          <h3 className="text-base font-bold text-white mb-1.5 flex items-center gap-2">
            You control whether chats are saved
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Sessions are ephemeral by default. You decide whether your session is purged immediately upon closing or retained for up to 30 days.
          </p>
        </div>

        {/* Disclosure 3 */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-amber-500/30 bg-amber-950/10 hover:border-amber-500/50 transition-all shadow-md">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-lg mb-3">
            03
          </div>
          <h3 className="text-base font-bold text-amber-200 mb-1.5 flex items-center gap-2">
            This is AI, not a clinician
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Inearly offers supportive listening and structured coping strategies, not clinical diagnosis or psychiatric treatment.
          </p>
        </div>

        {/* Disclosure 4 */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all shadow-md">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-lg mb-3">
            04
          </div>
          <h3 className="text-base font-bold text-white mb-1.5 flex items-center gap-2">
            Zero PII Data Collection Scope
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            No real names, phone numbers, email addresses, or Aadhaar details are collected. We only use coarse age bands and pseudonyms.
          </p>
        </div>
      </div>

      {/* Crisis Support Banner */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
        <div>
          <span className="font-semibold text-slate-200 block sm:inline">Emergency or Crisis?</span>{" "}
          National 24/7 mental health toll-free helplines:
        </div>
        <div className="flex items-center gap-3 font-mono text-emerald-400">
          <a href="tel:14416" className="hover:underline">Tele-MANAS: 14416</a>
          <span>•</span>
          <a href="tel:18005990019" className="hover:underline">KIRAN: 1800-599-0019</a>
        </div>
      </div>

      {/* Action */}
      <div className="flex items-center justify-end pt-4">
        <button
          onClick={onContinue}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-teal-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          I Understand, Begin Onboarding →
        </button>
      </div>
    </div>
  );
};
