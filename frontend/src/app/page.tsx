"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Floating3DParticles } from "@/components/ui/floating-3d-particles";
import { VideoText } from "@/components/ui/video-text";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Headphones,
  Compass,
  Lock,
  PhoneCall,
  Smartphone,
  Apple,
  Clock,
  HeartHandshake,
  CheckCircle2,
  ChevronRight,
  Sun,
  Moon,
  Users,
  AlertCircle,
  EyeOff,
  Coins,
  Activity,
  Key,
  Trash2,
  Fingerprint,
  Mic,
  Smile,
  Shield,
  Database,
  Radio,
  ExternalLink,
} from "lucide-react";

export default function Home() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [userPseudonym, setUserPseudonym] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Initialize theme and scroll tracking
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

      const storedSession = localStorage.getItem("inearly_session");
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        if (parsed.pseudonym) {
          setUserPseudonym(parsed.pseudonym);
        }
      }
    } catch (e) {}

    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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

  return (
    <div
      className={`relative min-h-screen overflow-x-hidden transition-colors duration-300 font-sans selection:bg-teal-500 selection:text-slate-950 ${
        isDarkMode ? "dark bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"
      }`}
    >
      {/* ----------------------------------------------------------------------- */}
      {/* TOP PROGRESS BAR                                                        */}
      {/* ----------------------------------------------------------------------- */}
      <div className="fixed top-0 left-0 right-0 h-[2.5px] z-50 bg-slate-200/50 dark:bg-slate-900">
        <div
          className="h-full bg-gradient-to-r from-teal-400 via-emerald-400 to-indigo-500 transition-all duration-150 ease-out shadow-[0_0_12px_rgba(45,212,191,0.8)]"
          style={{ width: `${Math.max(scrollProgress, 4)}%` }}
        />
      </div>

      {/* ----------------------------------------------------------------------- */}
      {/* 1. BACKGROUND FLOATING 3D PARTICLES LAYER                               */}
      {/* ----------------------------------------------------------------------- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <Floating3DParticles
          quantity={isDarkMode ? 320 : 180}
          color={isDarkMode ? "#2dd4bf" : "#0d9488"}
          size={4}
          opacity={isDarkMode ? 0.35 : 0.22}
          drift={0.7}
          depth={0.65}
        />
        {/* Soft radial ambient glow gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-teal-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-[40%] right-[-100px] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[10%] left-[-100px] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[160px] pointer-events-none" />
      </div>

      {/* ----------------------------------------------------------------------- */}
      {/* 2. GLASSMORPHIC TOP NAVIGATION BAR WITH THEME TOGGLE                    */}
      {/* ----------------------------------------------------------------------- */}
      <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-2xl bg-white/90 dark:bg-slate-950/85 border-b border-slate-200/80 dark:border-slate-800/80 transition-all duration-300 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 sm:h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 rounded-2xl overflow-hidden bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-0.5 shadow-md shadow-teal-500/15 group-hover:scale-105 transition-transform duration-200 shrink-0">
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
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-950 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors font-sans">
                  Inearly
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 font-sans">
                  India-First
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 hidden sm:block font-sans">
                AI Mental Wellness Sanctuary
              </p>
            </div>
          </Link>

          {/* Centered Neatly Packed Pill Navigation */}
          <nav className="hidden lg:flex items-center gap-1 p-1 rounded-full bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 shadow-xs backdrop-blur-md">
            <a href="#hero" className="whitespace-nowrap px-3.5 py-1.5 rounded-full hover:bg-white dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400 transition-all">
              Home
            </a>
            <a href="#impact" className="whitespace-nowrap px-3.5 py-1.5 rounded-full hover:bg-white dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400 transition-all">
              Impact
            </a>
            <a href="#crisis" className="whitespace-nowrap px-3.5 py-1.5 rounded-full hover:bg-white dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400 transition-all">
              The Reality
            </a>
            <a href="#features" className="whitespace-nowrap px-3.5 py-1.5 rounded-full hover:bg-white dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400 transition-all">
              Features
            </a>
            <a href="#architecture" className="whitespace-nowrap px-3.5 py-1.5 rounded-full hover:bg-white dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400 transition-all">
              Zero-Knowledge
            </a>
            <a href="#preview" className="whitespace-nowrap px-3.5 py-1.5 rounded-full hover:bg-white dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400 transition-all">
              App Preview
            </a>
            <Link href="/psychiatrists" className="whitespace-nowrap px-3.5 py-1.5 rounded-full hover:bg-white dark:hover:bg-slate-800 hover:text-teal-600 dark:hover:text-teal-400 transition-all flex items-center gap-1.5 font-semibold text-teal-700 dark:text-teal-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Find Psychiatrist</span>
            </Link>
          </nav>

          {/* Header Action CTA + Theme Switcher */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-teal-800 dark:text-teal-300 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs font-sans"
            >
              <Lock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span className="hidden sm:inline">Privacy Vault</span>
              <span className="sm:hidden">Vault</span>
            </Link>

            {/* Theme Toggle Button */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900 hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-xs"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Theme"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            {userPseudonym && (
              <span className="hidden 2xl:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {userPseudonym}
              </span>
            )}

            <Link
              href="/chat"
              className="relative group overflow-hidden px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-500/25 hover:shadow-lg hover:shadow-teal-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center gap-2 font-sans"
            >
              <span>Try Web App</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      {/* ----------------------------------------------------------------------- */}
      {/* 3. HERO SECTION & VIDEO TEXT                                            */}
      {/* ----------------------------------------------------------------------- */}
      <section
        id="hero"
        className="relative z-10 pt-32 sm:pt-36 pb-6 sm:pb-8 px-4 sm:px-6 max-w-5xl mx-auto flex flex-col items-center text-center"
      >
        {/* Subtle Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/90 border border-teal-500/30 text-teal-800 dark:text-teal-300 text-xs font-semibold shadow-xs mb-6 backdrop-blur-md animate-fade-in font-sans">
          <Sparkles className="w-3.5 h-3.5 text-teal-500 animate-pulse" />
          <span>DPDP Act (2023) Compliant • Zero-PII • Confidential AI</span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-600">|</span>
          <span className="hidden sm:inline text-emerald-700 dark:text-emerald-400 font-semibold">
            Hinglish / Hindi / English
          </span>
        </div>

        {/* Video Text Typography: "INEARLY" */}
        <div className="w-full max-w-3xl h-[100px] sm:h-[150px] md:h-[190px] flex items-center justify-center my-1 select-none">
          <VideoText
            src="/ocean-small.webm"
            fontSize={15}
            fontWeight="900"
            fontFamily="var(--font-sans), system-ui, -apple-system, sans-serif"
            className="w-full h-full flex items-center justify-center"
          >
            INEARLY
          </VideoText>
        </div>

        {/* Subheading */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mt-3 mb-4 font-sans">
          Understand yourself a little better
        </h2>

        {/* Supporting Narrative */}
        <p className="max-w-2xl text-slate-600 dark:text-slate-300 text-sm sm:text-base md:text-lg leading-relaxed mb-8 text-balance font-normal font-sans">
          A confidential, culturally attuned AI wellness companion crafted for India. Unpack exam
          anxiety, workplace burnout, and late-night overthinking with empathetic active listening,
          micro-action coping steps, and absolute privacy.
        </p>

        {/* Action Buttons: Primary "Try Web App" + Mobile Roadmap Link */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md sm:max-w-none mb-10">
          <Link
            href="/chat"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-extrabold text-base shadow-xl shadow-teal-500/25 hover:shadow-2xl hover:shadow-teal-500/40 hover:-translate-y-1 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer group font-sans"
          >
            <span>Try Web App</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          <a
            href="#downloads"
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-md cursor-pointer backdrop-blur-md font-sans"
          >
            <span>Explore Mobile Roadmap</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </a>
        </div>

        {/* Upcoming Downloads Badges */}
        <div
          id="downloads"
          className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left"
        >
          {/* Android Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 transition-all duration-200 backdrop-blur-md flex items-center justify-between group shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white font-sans">Android Application</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 font-bold">
                    Android (.APK) - Upcoming
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-sans font-normal">
                  Native Android release optimized for India&apos;s mobile ecosystem.
                </p>
              </div>
            </div>
          </div>

          {/* iOS Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 transition-all duration-200 backdrop-blur-md flex items-center justify-between group shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Apple className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white font-sans">iOS Application</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border border-indigo-500/30 font-bold">
                    iOS (.IPA) - Upcoming
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-sans font-normal">
                  Private on-device encrypted builds for Apple TestFlight &amp; App Store.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------------- */}
      {/* 4. IMPACT STATISTICS BAR                                                */}
      {/* ----------------------------------------------------------------------- */}
      <section
        id="impact"
        className="relative z-10 pt-2 pb-14 px-4 sm:px-6 max-w-6xl mx-auto"
      >
        <div className="rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 p-6 sm:p-8 backdrop-blur-2xl shadow-xl shadow-slate-200/40 dark:shadow-black/50">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 dark:divide-slate-800/80">
            {/* Stat 1 */}
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left px-2 pt-4 sm:pt-0">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3 shadow-xs">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-4xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white font-sans antialiased">
                300M+
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-teal-800 dark:text-teal-400 uppercase tracking-wider mt-1.5">
                Students in India
              </div>
              <p className="text-xs sm:text-[13px] font-medium text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Navigating hyper-competitive academic pressure and life transitions.
              </p>
            </div>

            {/* Stat 2 */}
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left px-2 sm:pl-8 pt-4 sm:pt-0">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 shadow-xs">
                <Activity className="w-5 h-5" />
              </div>
              <div className="text-4xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white font-sans antialiased">
                1 in 5
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-amber-800 dark:text-amber-400 uppercase tracking-wider mt-1.5">
                Face Mental Strain
              </div>
              <p className="text-xs sm:text-[13px] font-medium text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Experience acute exam anxiety, depressive episodes, or chronic burnout.
              </p>
            </div>

            {/* Stat 3 */}
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left px-2 sm:pl-8 pt-4 sm:pt-0">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3 shadow-xs">
                <EyeOff className="w-5 h-5" />
              </div>
              <div className="text-4xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white font-sans antialiased">
                &lt; 10%
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-rose-800 dark:text-rose-400 uppercase tracking-wider mt-1.5">
                Seek Help
              </div>
              <p className="text-xs sm:text-[13px] font-medium text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Deterred by stigma, fear of family discovery, and high consultation fees.
              </p>
            </div>

            {/* Stat 4 */}
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left px-2 sm:pl-8 pt-4 sm:pt-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 shadow-xs">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-4xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white font-sans antialiased">
                24/7
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider mt-1.5">
                AI Companion Access
              </div>
              <p className="text-xs sm:text-[13px] font-medium text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Immediate, non-judgmental reflective venting with zero appointment queues.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------------- */}
      {/* 5. THE CRISIS & PROBLEM SECTION                                         */}
      {/* ----------------------------------------------------------------------- */}
      <section
        id="crisis"
        className="relative z-10 py-16 px-4 sm:px-6 max-w-6xl mx-auto border-t border-slate-200/80 dark:border-slate-800/80"
      >
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-2">
            <AlertCircle className="w-4 h-4" />
            <span>The Silent Crisis</span>
          </div>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Why Indian Youth Suffer in Silence
          </h3>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2">
            Exam season, placement dread, and joint family expectations create immense pressure—yet
            traditional healthcare systems fail to provide a safe, accessible refuge.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Stigma & Silence */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-rose-400/50 dark:hover:border-rose-500/50 transition-all duration-300 shadow-lg backdrop-blur-md group">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <EyeOff className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 font-semibold">
              Cultural Barrier
            </span>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-2 mb-2 group-hover:text-rose-600 dark:group-hover:text-rose-300 transition-colors">
              Stigma &amp; Silence
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              The persistent fear of social judgment, parental disapproval, and &ldquo;log kya kahenge&rdquo;
              forces students to bottle up severe emotional turmoil until it manifests as acute crisis.
            </p>
            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
              <strong>Reality Check:</strong> Over 76% of Indian students report feeling uncomfortable
              discussing mental strain with family.
            </div>
          </div>

          {/* Card 2: Privacy Fears */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-amber-400/50 dark:hover:border-amber-500/50 transition-all duration-300 shadow-lg backdrop-blur-md group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Fingerprint className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold">
              Surveillance Anxiety
            </span>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-2 mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
              Privacy &amp; Data Fears
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Modern digital apps routinely demand phone numbers, real names, and intrusive data tracking.
              Youth fear their sensitive chats could be leaked to colleges, employers, or parents.
            </p>
            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
              <strong>Inearly Answer:</strong> True zero-knowledge pseudonymity with zero mandatory phone
              numbers or legal names.
            </div>
          </div>

          {/* Card 3: Inaccessibility */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-indigo-400/50 dark:hover:border-indigo-500/50 transition-all duration-300 shadow-lg backdrop-blur-md group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Coins className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-semibold">
              Severe Shortage
            </span>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-2 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
              Cost &amp; Inaccessibility
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              With only ~0.75 psychiatrists per 100,000 citizens in India and private therapy starting at
              ₹1,500/session, evidence-backed emotional support remains an unattainable luxury for non-metro youth.
            </p>
            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
              <strong>Impact:</strong> Available 24/7 at zero cost with culturally fluent Indian code-switching.
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------------- */}
      {/* 6. INTERACTIVE MOBILE MOCKUP SECTION ("Ready to find your peace?")      */}
      {/* ----------------------------------------------------------------------- */}
      <section
        id="preview"
        className="relative z-10 py-16 px-4 sm:px-6 max-w-6xl mx-auto border-t border-slate-200/80 dark:border-slate-800/80"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" />
              <span>Ready to find your peace?</span>
            </div>

            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              A private wellness sanctuary in your pocket.
            </h3>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Designed with calm typography, mindful pacing, and zero clutter. Express freely in your own
              language without pressure, judgment, or persistent tracking.
            </p>

            {/* Feature Bullet Points */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                    Anonymous Pseudonymity
                  </h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Interact safely as &ldquo;CalmMonsoon_24&rdquo; or create your own pseudonymous handle.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                    Zero Chat Retention By Default
                  </h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ephemeral conversations vanish from memory the moment your session ends.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                    Somatic Voice Companion
                  </h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Speak out loud when typing feels too heavy. Ephemeral audio stream with zero server recording.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Link
                href="/chat"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-teal-500/25 hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                <span>Launch Sanctuary Web App</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Mobile Phone Mockup Frame */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative w-[300px] sm:w-[330px] rounded-[44px] p-3.5 bg-slate-900 dark:bg-slate-950 border-4 border-slate-700/60 dark:border-slate-800 shadow-2xl shadow-teal-500/10">
              {/* Dynamic Island / Speaker Notch */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-800 dark:bg-slate-900 rounded-full z-20 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-950 ml-auto mr-2" />
              </div>

              {/* Inside Screen Container */}
              <div className="w-full rounded-[34px] overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/80 flex flex-col h-[560px] text-left">
                {/* Status Bar */}
                <div className="px-6 pt-3 pb-1 flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  <span>09:41</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px]">5G</span>
                    <div className="w-5 h-2.5 rounded-sm border border-current p-0.5 flex items-center">
                      <div className="h-full w-full bg-current rounded-xs" />
                    </div>
                  </div>
                </div>

                {/* Mockup Header */}
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-0.5 shadow-xs shrink-0">
                      <Image
                        src="/logo.png"
                        alt="Inearly Logo"
                        width={28}
                        height={28}
                        className="w-full h-full object-contain rounded-lg"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        <span>CalmMonsoon_24</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400">
                          18-24
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Gemini 2.5 Flash</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300">
                    🎧 Just Listen
                  </span>
                </div>

                {/* Mockup Message Stream */}
                <div className="flex-1 p-3.5 space-y-3 overflow-hidden text-xs">
                  {/* Assistant greeting */}
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-lg bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                      In
                    </div>
                    <div className="p-3 rounded-2xl rounded-tl-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px] leading-relaxed shadow-xs">
                      Namaste! Main Inearly hoon. Aaj padhai ya career ko lekar jo bhi stress ho, bina filter share karein.
                    </div>
                  </div>

                  {/* User message */}
                  <div className="flex items-end justify-end">
                    <div className="p-3 rounded-2xl rounded-tr-xs bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-[11px] leading-relaxed max-w-[85%] shadow-xs">
                      Exams agle hafte hain aur focus bilkul nahi ban raha... bohot panic ho raha hai.
                    </div>
                  </div>

                  {/* Assistant empathetic reply */}
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-lg bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                      In
                    </div>
                    <div className="p-3 rounded-2xl rounded-tl-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px] leading-relaxed shadow-xs">
                      Aapka panic hona completely understandable hai. Pehle ek lambi, gehri saans lein. Hum saath mein step-by-step handle karenge.
                    </div>
                  </div>

                  {/* Coping Chip */}
                  <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-500/30 text-[10px] text-teal-800 dark:text-teal-300 flex items-center justify-between">
                    <span>🌱 2-Min Box Breathing Reset</span>
                    <span className="font-bold">Try →</span>
                  </div>
                </div>

                {/* Mockup Bottom Input Dock */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-700/80 text-[11px] text-slate-400">
                    <span className="flex-1 truncate">Dil ki baat yahan share karein...</span>
                    <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center text-white shrink-0">
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-1 text-[9px] text-slate-400 mt-2 font-mono">
                    <Lock className="w-2.5 h-2.5 text-teal-500" />
                    <span>Zero-PII • Ephemeral Session Memory</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------------- */}
      {/* 7. PRIVACY & SECURITY ZERO-KNOWLEDGE ARCHITECTURE FLOW                  */}
      {/* ----------------------------------------------------------------------- */}
      <section
        id="architecture"
        className="relative z-10 py-16 px-4 sm:px-6 max-w-6xl mx-auto border-t border-slate-200/80 dark:border-slate-800/80"
      >
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Radical Privacy by Architecture</span>
          </div>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            How Your Vulnerability is Kept Safe
          </h3>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2">
            We don&apos;t just promise privacy in fine print—we engineered our system so we physically cannot
            demographically trace or exploit your personal emotional data.
          </p>
        </div>

        {/* 5-Step Horizontal Flow Component */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative">
          {/* Step 1 */}
          <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 transition-all shadow-md backdrop-blur-md flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold border border-teal-500/20">
                  Step 01
                </span>
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <h5 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                User Input
              </h5>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Natural expression in Hinglish, Hindi, or English without providing real names, phone
                numbers, or email.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-teal-600 dark:text-teal-400 font-mono">
              ✓ Zero-PII Ingestion
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 transition-all shadow-md backdrop-blur-md flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/20">
                  Step 02
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Key className="w-4 h-4" />
                </div>
              </div>
              <h5 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                256-bit Encryption
              </h5>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Application-level envelope encryption ciphers conversational text in transit with TLS 1.3
                and at rest.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
              ✓ AES-GCM Envelope
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 transition-all shadow-md backdrop-blur-md flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold border border-teal-500/20">
                  Step 03
                </span>
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Database className="w-4 h-4" />
                </div>
              </div>
              <h5 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                Session Memory
              </h5>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Active chat messages live inside an isolated ephemeral memory sandbox—never used to train
                general AI models.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-teal-600 dark:text-teal-400 font-mono">
              ✓ Sandboxed Context
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-rose-500/50 transition-all shadow-md backdrop-blur-md flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/20">
                  Step 04
                </span>
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Trash2 className="w-4 h-4" />
                </div>
              </div>
              <h5 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                Auto Delete
              </h5>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Immediate ephemeral wipe upon exiting or automated 30-day lifecycle expiration for saved
                wellness goals.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-rose-600 dark:text-rose-400 font-mono">
              ✓ Automated Purge
            </div>
          </div>

          {/* Step 5 */}
          <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-all shadow-md backdrop-blur-md flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                  Step 05
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <h5 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                Zero Trace
              </h5>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Full compliance with India&apos;s DPDP Act (2023). User retains total right to erasure with
                a single click.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
              ✓ DPDP 2023 Certified
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------------- */}
      {/* 8. FOUR PILLARS / CORE PLATFORM CAPABILITIES                            */}
      {/* ----------------------------------------------------------------------- */}
      <section
        id="features"
        className="relative z-10 py-16 px-4 sm:px-6 max-w-6xl mx-auto border-t border-slate-200/80 dark:border-slate-800/80"
      >
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-2">
            <span>Built For Your Mind</span>
          </div>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Dual Interaction Modes &amp; Non-Bypassable Safety
          </h3>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2">
            Choose how you want to be supported in this moment—whether you need quiet venting
            or gentle structured progress.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Feature 1: Just Listen */}
          <div className="p-7 rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 transition-all duration-300 shadow-lg backdrop-blur-md group">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Headphones className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors">
                Just Listen Mode
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold">
                Venting &amp; Catharsis
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              A peaceful, non-judgmental space to unpack stress, workplace burnout, and academic
              expectations. Zero unsolicited advice, zero 5-step lectures, and no toxic positivity.
            </p>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                <span>Reflective active listening (&ldquo;It sounds like...&rdquo;)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                <span>Express naturally in Hinglish, Hindi, or English</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                <span>Default ephemeral session: zero trace left behind</span>
              </li>
            </ul>
          </div>

          {/* Feature 2: Help Me Plan */}
          <div className="p-7 rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 transition-all duration-300 shadow-lg backdrop-blur-md group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Compass className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                Help Me Plan Mode
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold">
                Actionable Grounding
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Gentle cognitive reframing and bite-sized, evidence-informed coping steps drawn from
              our reviewed wellness library.
            </p>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>4-4-4 Pranayama box breathing &amp; 5-4-3-2-1 sensory resets</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>10-minute &ldquo;One Micro-Task&rdquo; box to break exam paralysis</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>User autonomy: opt-in or skip coping goals with 1 click</span>
              </li>
            </ul>
          </div>

          {/* Feature 3: Deterministic Safety Interceptor */}
          <div className="p-7 rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-rose-500/50 transition-all duration-300 shadow-lg backdrop-blur-md group">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-300 transition-colors">
                Deterministic Safety Interceptor
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold">
                Non-Bypassable
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              Runs before any agent or LLM execution. Scans for acute distress, self-harm, or
              crisis markers, instantly providing non-judgmental crisis templates and verified Indian
              helplines.
            </p>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Immediate 1-tap call cards for Tele-MANAS (14416) &amp; Emergency (112)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Secure audit logging: zero raw sensitive user text is ever logged</span>
              </li>
            </ul>
          </div>

          {/* Feature 4: Memory Vault & Right to Erasure */}
          <div className="p-7 rounded-3xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-all duration-300 shadow-lg backdrop-blur-md group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Lock className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                User-Owned Privacy Vault
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                DPDP Act 2023
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              We never collect real legal names, phone numbers, or national IDs. Coarse age bands
              and pseudonyms ensure zero demographic fingerprinting.
            </p>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>30-day automated lifecycle hard-deletion routine</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Complete Right to Erasure: wipe your account with a single click</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------------- */}
      {/* 9. CONTACT & CRISIS HELPLINES SECTION                                   */}
      {/* ----------------------------------------------------------------------- */}
      <section
        id="contact"
        className="relative z-10 py-16 px-4 sm:px-6 max-w-6xl mx-auto border-t border-slate-200/80 dark:border-slate-800/80 text-center"
      >
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-teal-50/50 dark:from-slate-900 dark:via-slate-900/90 dark:to-teal-950/30 border border-teal-500/25 shadow-xl backdrop-blur-md">
          <div className="max-w-2xl mx-auto space-y-4 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              <PhoneCall className="w-3.5 h-3.5 text-rose-500" />
              <span>Verified 24/7 National Emergency Helplines</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Need immediate human support or in a crisis?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              If you or someone you care about is experiencing acute emotional distress, help is
              available 24/7 across India. These toll-free services are free and confidential.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
            <a
              href="tel:14416"
              className="p-4 rounded-2xl bg-white dark:bg-slate-950/80 border border-rose-300 dark:border-rose-500/40 hover:border-rose-500 transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow-xs"
            >
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Tele-MANAS (Govt of India)</span>
              <span className="text-base font-extrabold font-mono text-rose-600 dark:text-rose-400 group-hover:text-rose-700 dark:group-hover:text-white mt-1">
                📞 14416
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">20+ Indian Languages • 24/7</span>
            </a>

            <a
              href="tel:112"
              className="p-4 rounded-2xl bg-white dark:bg-slate-950/80 border border-rose-300 dark:border-rose-500/40 hover:border-rose-500 transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow-xs"
            >
              <span className="text-[11px] text-slate-500 dark:text-slate-400">National Emergency</span>
              <span className="text-base font-extrabold font-mono text-rose-600 dark:text-rose-400 group-hover:text-rose-700 dark:group-hover:text-white mt-1">
                📞 112
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Police, Medical, Fire • 24/7</span>
            </a>

            <a
              href="tel:18005990019"
              className="p-4 rounded-2xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow-xs"
            >
              <span className="text-[11px] text-slate-500 dark:text-slate-400">KIRAN Helpline</span>
              <span className="text-base font-extrabold font-mono text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-white mt-1">
                📞 1800-599-0019
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Mental Health (DEPwD)</span>
            </a>

            <a
              href="tel:+919999666555"
              className="p-4 rounded-2xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 transition-all flex flex-col items-center justify-center text-center group cursor-pointer shadow-xs"
            >
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Vandrevala Foundation</span>
              <span className="text-sm font-extrabold font-mono text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-white mt-1">
                📞 +91 9999 666 555
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Free Counseling Support</span>
            </a>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <span>Platform Support: contact@inearly.com</span>
            <span>•</span>
            <Link href="/dashboard" className="text-teal-600 dark:text-teal-400 hover:underline">
              Access User Privacy Vault
            </Link>
            <span>•</span>
            <Link href="/chat" className="text-teal-600 dark:text-teal-400 hover:underline">
              Launch Web App
            </Link>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------------- */}
      {/* 10. MINIMALIST FOOTER                                                   */}
      {/* ----------------------------------------------------------------------- */}
      <footer className="relative z-10 border-t border-slate-200/80 dark:border-slate-800/80 py-8 px-4 sm:px-6 bg-slate-100/50 dark:bg-slate-950 transition-colors">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-0.5 shrink-0 shadow-2xs">
              <Image
                src="/logo.png"
                alt="Inearly Logo"
                width={24}
                height={24}
                className="w-full h-full object-contain rounded-md"
              />
            </div>
            <span>© 2026 Inearly Technologies. Engineered for India with zero-PII data minimization.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
              Right to Erasure
            </Link>
            <span>•</span>
            <a href="#architecture" className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
              DPDP Act (2023) Aligned
            </a>
            <span>•</span>
            <a href="tel:14416" className="text-emerald-600 dark:text-emerald-400 hover:underline font-mono">
              Tele-MANAS: 14416
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
