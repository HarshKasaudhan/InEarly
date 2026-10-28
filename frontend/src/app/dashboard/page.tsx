"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Sun, Moon, ArrowLeft, ShieldCheck } from "lucide-react";
import { PrivacyMemoryDashboard } from "@/components/PrivacyMemoryDashboard";

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<{ userId: string; pseudonym: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem("inearly_theme");
      const prefersDark = storedTheme ? storedTheme === "dark" : true;
      setIsDarkMode(prefersDark);
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      const stored = localStorage.getItem("inearly_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        setSession({
          userId: parsed.userId || "anon-user-default",
          pseudonym: parsed.pseudonym || "CalmMonsoon_24",
        });
      } else {
        setSession({
          userId: "anon-user-default",
          pseudonym: "CalmMonsoon_24",
        });
      }
    } catch (e) {
      setSession({
        userId: "anon-user-default",
        pseudonym: "CalmMonsoon_24",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    try {
      localStorage.setItem("inearly_theme", nextDark ? "dark" : "light");
    } catch (e) {}

    if (nextDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleAccountWiped = () => {
    router.push("/");
  };

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></div>
          <span>Loading Privacy Vault...</span>
        </div>
      </div>
    );
  }

  return (
    <main
      className={`min-h-screen transition-colors duration-300 flex flex-col justify-between p-4 sm:p-8 ${
        isDarkMode ? "dark bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"
      }`}
    >
      {/* Top Header */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4 mb-4">
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => router.push("/")}>
          <div className="w-10 h-10 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-0.5 shadow-md shadow-teal-500/15 group-hover:scale-105 transition-transform shrink-0">
            <Image
              src="/logo.png"
              alt="Inearly Logo"
              width={40}
              height={40}
              priority
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Inearly
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                Privacy Vault
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">User-Owned Memory &amp; DPDP Data Controls</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          <button
            onClick={() => router.push("/chat")}
            className="text-xs px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold transition-all shadow-md shadow-teal-500/20 cursor-pointer"
          >
            ← Open Chat
          </button>
          <button
            onClick={() => router.push("/")}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Home
          </button>
        </div>
      </header>

      {/* Main Privacy & Memory Dashboard */}
      <div className="max-w-5xl w-full mx-auto my-auto py-2">
        <PrivacyMemoryDashboard
          userId={session.userId}
          pseudonym={session.pseudonym}
          onAccountWiped={handleAccountWiped}
          onBackToChat={() => router.push("/chat")}
        />
      </div>

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto border-t border-slate-200 dark:border-slate-800/80 pt-4 mt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 gap-2">
        <p>© 2026 Inearly Technologies. Right to Erasure • Data Minimization • DPDP Act (2023).</p>
        <div className="flex items-center gap-3">
          <a href="tel:14416" className="text-emerald-600 dark:text-emerald-400 hover:underline font-mono">
            Tele-MANAS: 14416
          </a>
          <span>•</span>
          <a href="tel:112" className="text-emerald-600 dark:text-emerald-400 hover:underline font-mono">
            112
          </a>
        </div>
      </footer>
    </main>
  );
}
