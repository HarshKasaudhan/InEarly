"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Sun,
  Moon,
  MessageSquare,
  Lock,
  PhoneCall,
  ShieldCheck,
  Building2,
} from "lucide-react";
import PsychiatristsView from "@/components/PsychiatristsView";

export default function PsychiatristsPage() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize theme from document or localStorage
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("inearly_theme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("inearly_theme", "dark");
      setIsDarkMode(true);
    }
  };

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden transition-colors duration-300">
      
      {/* Soft Background Radial Glows */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-teal-400/5 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Navbar */}
      <header className="px-4 sm:px-6 py-3 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/chat")}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
            title="Return to AI Companion"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div
            onClick={() => router.push("/")}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 shadow-sm shadow-teal-500/15 shrink-0 group-hover:scale-105 transition-transform">
              <Image
                src="/logo.png"
                alt="Inearly Logo"
                width={32}
                height={32}
                priority
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors">
                Inearly
              </span>
              <span className="text-[10px] text-teal-600 dark:text-teal-400 block font-medium">
                Care Network
              </span>
            </div>
          </div>
        </div>

        {/* Center / Right Links & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => router.push("/chat")}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-teal-500" />
            <span>AI Companion</span>
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-teal-500" />
            <span>Privacy Vault</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* Emergency Crisis Badge */}
          <a
            href="tel:14416"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer"
            title="Immediate Free Tele-MANAS Hotline"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tele-MANAS:</span>
            <span>14416</span>
          </a>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 flex flex-col min-h-0 w-full p-2 sm:p-4 overflow-hidden relative z-10">
        <PsychiatristsView />
      </main>

      {/* Bottom Legal & Safety Footer */}
      <footer className="shrink-0 px-4 py-1.5 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/70 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2 z-20">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
          <span>All specialists RCI / NMC verified. Zero-trace browsing.</span>
        </div>
        <div>
          <span>National Mental Health Helplines: <strong>14416 (Tele-MANAS)</strong> • <strong>112 (Emergency)</strong></span>
        </div>
      </footer>

    </div>
  );
}
