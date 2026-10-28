"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  MessageSquare, 
  Smile, 
  Wind, 
  Mic, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Lock, 
  ArrowLeft, 
  Menu, 
  X, 
  Heart, 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  Activity,
  CheckCircle2,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
  History,
  Trash2,
  Plus,
  Building2,
  MapPin
} from "lucide-react";
import { WellnessChatSpace } from "@/components/WellnessChatSpace";
import { LanguagePref, AgeBand } from "@/components/OnboardingFlow";
import { TalkingHeadAvatar, TalkingHeadAvatarHandle } from "@/components/TalkingHeadAvatar";
import { Floating3DParticles } from "@/components/ui/floating-3d-particles";
import { chatStorage, StoredConversation } from "@/lib/chatStorage";
import PsychiatristsView from "@/components/PsychiatristsView";
import CalmingSanctuary from "@/components/CalmingSanctuary";
import VoiceSanctuaryView from "@/components/VoiceSanctuaryView";

interface UserSession {
  userId: string;
  pseudonym: string;
  language: LanguagePref;
  ageBand: AgeBand;
  saveChats: boolean;
  consentId: string;
}

type NavTab = "ai-companion" | "mood-tracker" | "calming-tools" | "voice-companion" | "nearby-psychiatrists";

export default function ChatPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>("ai-companion");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>("");
  const [showHistoryFlyout, setShowHistoryFlyout] = useState(false);

  // Initialize theme, session, and sidebar persistence
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

      const storedCollapse = localStorage.getItem("inearly_sidebar_collapsed");
      if (storedCollapse !== null) {
        setSidebarCollapsed(storedCollapse === "true");
      }

      const storedSession = localStorage.getItem("inearly_session");
      if (storedSession) {
        setSession(JSON.parse(storedSession));
      } else {
        const defaultSession: UserSession = {
          userId: crypto.randomUUID(),
          pseudonym: "CalmMonsoon_24",
          language: "Hinglish",
          ageBand: "18-24",
          saveChats: false,
          consentId: crypto.randomUUID(),
        };
        setSession(defaultSession);
      }
    } catch (e) {
      // LocalStorage access fallback
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

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("inearly_sidebar_collapsed", String(next));
      } catch (e) {}
      return next;
    });
  };

  const loadConversations = useCallback(async () => {
    if (!session?.userId) return;
    try {
      const convs = await chatStorage.getConversations(session.userId);
      setConversations(convs);
      if (convs.length > 0 && !activeConversationId) {
        setActiveConversationId(convs[0].id);
      }
    } catch (e) {
      console.warn("Failed to load conversations:", e);
    }
  }, [session?.userId, activeConversationId]);

  useEffect(() => {
    if (session?.userId) {
      loadConversations();
    }
  }, [session?.userId, loadConversations]);

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setActiveTab("ai-companion");
    setMobileMenuOpen(false);
    setShowHistoryFlyout(false);
  };

  const handleStartNewChat = () => {
    const newId = crypto.randomUUID();
    setActiveConversationId(newId);
    setActiveTab("ai-companion");
    setMobileMenuOpen(false);
    setShowHistoryFlyout(false);
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session?.userId) return;
    if (confirm("Delete this conversation session permanently?")) {
      await chatStorage.deleteConversation(id, session.userId);
      await loadConversations();
      if (activeConversationId === id) {
        handleStartNewChat();
      }
    }
  };

  const handlePurgeAllHistory = async () => {
    if (!session?.userId) return;
    if (confirm("Permanently erase ALL past conversations and transcripts from database and device?")) {
      await chatStorage.purgeAllHistory(session.userId);
      setConversations([]);
      handleStartNewChat();
    }
  };

  const handleReset = () => {
    try {
      localStorage.removeItem("inearly_session");
    } catch (e) {}
    router.push("/");
  };

  if (loading || !session) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-medium">
          <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping"></div>
          <span>Preparing your confidential wellness sanctuary...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen w-full transition-colors duration-300 flex flex-col md:flex-row relative overflow-hidden ${isDarkMode ? "dark bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"}`}>
      
      {/* 0. CALMING 3D FLOATING PARTICLES BACKGROUND LAYER */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <Floating3DParticles
          quantity={isDarkMode ? 240 : 140}
          color={isDarkMode ? "#2dd4bf" : "#0d9488"}
          size={3.5}
          opacity={isDarkMode ? 0.32 : 0.20}
          drift={0.55}
          depth={0.65}
        />
        {/* Soft radial ambient glow gradients */}
        <div className="absolute top-0 left-1/4 w-[700px] h-[450px] bg-teal-500/10 dark:bg-teal-400/8 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-[600px] h-[500px] bg-indigo-500/10 dark:bg-indigo-600/8 rounded-full blur-[160px] pointer-events-none" />
      </div>

      {/* =========================================================================
          1. CLEAN COLLAPSIBLE LEFT SIDEBAR (Mansitra Wellness Style)
         ========================================================================= */}
      
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => router.push("/")}>
          <div className="w-8 h-8 rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 shadow-sm shadow-teal-500/15 shrink-0">
            <Image
              src="/logo.png"
              alt="Inearly Logo"
              width={32}
              height={32}
              priority
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
          <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">Inearly</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-500"
            title="Toggle Light/Dark Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Collapsible Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen border-r border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl flex flex-col justify-between z-50 transition-all duration-300 ease-in-out shrink-0 ${
          mobileMenuOpen ? "translate-x-0 shadow-2xl w-72 p-5" : "-translate-x-full md:translate-x-0"
        } ${sidebarCollapsed ? "md:w-20 md:p-3" : "md:w-64 lg:w-72 md:p-5"}`}
      >
        {!sidebarCollapsed ? (
          /* EXPANDED SIDEBAR VIEW */
          <>
            {/* Top: Branding, Theme & Collapse Button */}
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div 
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => router.push("/")}
                >
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
                    <div className="flex items-center gap-1.5">
                      <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                        Inearly
                      </h1>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium">Care Sanctuary</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Light / Dark Mode Toggle Button */}
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

                  {/* Collapse Sidebar Button */}
                  <button
                    onClick={toggleSidebar}
                    className="hidden md:flex p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                    title="Collapse sidebar to mini rail"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Session Overview Mini Card */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-medium">Pseudonym</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold border border-teal-500/20">
                    {session.ageBand}
                  </span>
                </div>
                <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
                  {session.pseudonym}
                </div>
              </div>

              {/* Navigation Tabs (Mansitra Spec) */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3">
                  Sanctuary Tools
                </span>

                {/* AI Companion */}
                <button
                  onClick={() => {
                    setActiveTab("ai-companion");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "ai-companion"
                      ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span>AI Companion</span>
                </button>

                {/* Mood Tracker */}
                <button
                  onClick={() => {
                    setActiveTab("mood-tracker");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "mood-tracker"
                      ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Smile className="w-4 h-4 shrink-0" />
                  <span>Mood Tracker</span>
                </button>

                {/* Calming Tools */}
                <button
                  onClick={() => {
                    setActiveTab("calming-tools");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "calming-tools"
                      ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Wind className="w-4 h-4 shrink-0" />
                  <span>Calming Tools</span>
                </button>

                {/* Voice Companion */}
                <button
                  onClick={() => {
                    setActiveTab("voice-companion");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "voice-companion"
                      ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Mic className="w-4 h-4 shrink-0" />
                  <span>Voice Companion</span>
                </button>

                {/* Nearby Psychiatrists */}
                <button
                  onClick={() => {
                    setActiveTab("nearby-psychiatrists");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === "nearby-psychiatrists"
                      ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>Nearby Psychiatrists</span>
                </button>
              </div>

              {/* PAST CONVERSATIONS SECTION */}
              <div className="space-y-2 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
                <div className="flex items-center justify-between px-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Past Conversations
                  </span>
                  <button
                    onClick={handleStartNewChat}
                    className="flex items-center gap-1 text-[10px] font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors cursor-pointer"
                    title="Start fresh conversation"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New</span>
                  </button>
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {conversations.length > 0 ? (
                    conversations.map((c) => {
                      const isActive = activeConversationId === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => handleSelectConversation(c.id)}
                          className={`w-full group flex items-center justify-between p-2 rounded-xl text-xs transition-all cursor-pointer border ${
                            isActive
                              ? "bg-teal-500/10 dark:bg-teal-500/15 border-teal-500/30 text-teal-950 dark:text-teal-200 shadow-2xs"
                              : "border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-1">
                            <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-teal-600 dark:text-teal-400" : "text-slate-400"}`} />
                            <div className="truncate">
                              <p className="font-semibold truncate text-[11px] leading-tight">
                                {c.title || "Session"}
                              </p>
                              <p className="text-[9px] text-slate-400 capitalize">
                                {c.mode} • {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={(e) => handleDeleteConversation(c.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all shrink-0 cursor-pointer"
                            title="Delete this session"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 text-center">
                      <p className="text-[10px] text-slate-400 leading-tight">
                        No saved sessions yet.
                      </p>
                    </div>
                  )}
                </div>

                {conversations.length > 0 && (
                  <button
                    onClick={handlePurgeAllHistory}
                    className="w-full text-center text-[10px] text-slate-400 hover:text-rose-500 transition-colors py-1 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    <span>Purge All History</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Section: Privacy Vault Link + Zero-Knowledge Privacy Badge */}
            <div className="space-y-3 pt-4 border-t border-slate-200/80 dark:border-slate-800/80 animate-fade-in">
              {/* Quick link to Memory & Privacy Dashboard */}
              <a
                href="/dashboard"
                className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:border-teal-500/40 text-xs text-slate-700 dark:text-slate-300 transition-colors group cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-teal-500" />
                  <span>Privacy &amp; Memory Vault</span>
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-400" />
              </a>

              {/* Zero-Knowledge Privacy Badge */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-indigo-500/10 border border-emerald-500/20 text-[11px] space-y-1.5 shadow-xs">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Zero-Knowledge Privacy</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  DPDP Act 2023 Aligned • Ephemeral Memory • Zero PII Stored
                </p>
              </div>

              {/* Leave/Exit Link */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
                <button
                  onClick={() => router.push("/")}
                  className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Home</span>
                </button>
                <button
                  onClick={handleReset}
                  className="hover:text-rose-500 transition-colors cursor-pointer"
                >
                  Purge Session
                </button>
              </div>
            </div>
          </>
        ) : (
          /* COLLAPSED NARROW RAIL VIEW */
          <div className="flex flex-col justify-between h-full items-center py-1 animate-fade-in">
            {/* Top: Mini Logo, Expand & Theme Buttons */}
            <div className="flex flex-col items-center space-y-4 w-full">
              <div 
                className="w-10 h-10 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-0.5 shadow-md shadow-teal-500/15 cursor-pointer hover:scale-105 transition-transform shrink-0"
                onClick={() => router.push("/")}
                title="Inearly - Return Home"
              >
                <Image
                  src="/logo.png"
                  alt="Inearly Logo"
                  width={40}
                  height={40}
                  priority
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>

              <div className="flex flex-col items-center gap-2">
                {/* Expand Sidebar Toggle Button */}
                <button
                  onClick={toggleSidebar}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-teal-50 dark:hover:bg-slate-800 text-teal-600 dark:text-teal-400 transition-colors cursor-pointer shadow-xs"
                  title="Expand Sidebar"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>

                {/* Theme Toggle Button */}
                <button
                  onClick={toggleTheme}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                  title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {isDarkMode ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-indigo-600" />
                  )}
                </button>
              </div>

              <div className="w-8 h-px bg-slate-200 dark:bg-slate-800 my-1" />

              {/* Navigation Mini Icons Rail */}
              <div className="flex flex-col items-center space-y-2.5 w-full">
                {/* AI Companion */}
                <button
                  onClick={() => {
                    setActiveTab("ai-companion");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                    activeTab === "ai-companion"
                      ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/25 scale-105"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="AI Companion"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>

                {/* Mood Tracker */}
                <button
                  onClick={() => {
                    setActiveTab("mood-tracker");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                    activeTab === "mood-tracker"
                      ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/25 scale-105"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="Mood Tracker"
                >
                  <Smile className="w-5 h-5" />
                </button>

                {/* Calming Tools */}
                <button
                  onClick={() => {
                    setActiveTab("calming-tools");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                    activeTab === "calming-tools"
                      ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/25 scale-105"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="Calming Tools"
                >
                  <Wind className="w-5 h-5" />
                </button>

                {/* Voice Companion */}
                <button
                  onClick={() => {
                    setActiveTab("voice-companion");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                    activeTab === "voice-companion"
                      ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/25 scale-105"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="Voice Companion"
                >
                  <Mic className="w-5 h-5" />
                </button>

                {/* Nearby Psychiatrists */}
                <button
                  onClick={() => {
                    setActiveTab("nearby-psychiatrists");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                    activeTab === "nearby-psychiatrists"
                      ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/25 scale-105"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="Nearby Psychiatrists & Clinics"
                >
                  <Building2 className="w-5 h-5" />
                </button>

                {/* Past Conversations Rail Icon */}
                <button
                  onClick={() => setShowHistoryFlyout(!showHistoryFlyout)}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer relative ${
                    showHistoryFlyout
                      ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/25 scale-105"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="Past Conversations"
                >
                  <History className="w-5 h-5" />
                  {conversations.length > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-teal-400"></span>
                  )}
                </button>
              </div>

              {/* Collapsed Rail Floating Past Conversations Flyout */}
              {showHistoryFlyout && (
                <div className="absolute left-20 top-24 w-72 p-4 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-xl z-50 animate-fade-in space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Past Conversations</span>
                    <button 
                      onClick={handleStartNewChat} 
                      className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> New
                    </button>
                  </div>

                  <div className="max-h-52 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {conversations.length > 0 ? (
                      conversations.map((c) => {
                        const isActive = activeConversationId === c.id;
                        return (
                          <div
                            key={c.id}
                            onClick={() => handleSelectConversation(c.id)}
                            className={`w-full group flex items-center justify-between p-2 rounded-xl text-xs transition-all cursor-pointer border ${
                              isActive
                                ? "bg-teal-500/10 dark:bg-teal-500/15 border-teal-500/30 text-teal-950 dark:text-teal-200"
                                : "border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-1">
                              <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-teal-600 dark:text-teal-400" : "text-slate-400"}`} />
                              <div className="truncate">
                                <p className="font-semibold truncate text-[11px] leading-tight">
                                  {c.title || "Session"}
                                </p>
                                <p className="text-[9px] text-slate-400 capitalize">
                                  {c.mode} • {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={(e) => handleDeleteConversation(c.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-all shrink-0 cursor-pointer"
                              title="Delete this session"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-3 py-4 text-center text-slate-400 text-xs">
                        No saved sessions yet.
                      </div>
                    )}
                  </div>

                  {conversations.length > 0 && (
                    <button
                      onClick={handlePurgeAllHistory}
                      className="w-full text-center text-[10px] text-slate-400 hover:text-rose-500 transition-colors py-1 cursor-pointer flex items-center justify-center gap-1 border-t border-slate-200 dark:border-slate-800 pt-2"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                      <span>Purge All History</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Rail Actions */}
            <div className="flex flex-col items-center space-y-3 pt-4 border-t border-slate-200/80 dark:border-slate-800/80 w-full">
              {/* Privacy Vault Link */}
              <a
                href="/dashboard"
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-teal-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Privacy & Memory Vault"
              >
                <Lock className="w-4 h-4 text-teal-500" />
              </a>

              {/* Return Home */}
              <button
                onClick={() => router.push("/")}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Return Home"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              {/* Zero-Knowledge Indicator Dot */}
              <div 
                className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse my-1" 
                title="Zero-Knowledge Privacy Active"
              />
            </div>
          </div>
        )}
      </aside>

      {/* =========================================================================
          2. MAIN WORKSPACE AREA: Centered Chat or Active Tab Tool
         ========================================================================= */}
      <main className="flex-1 flex flex-col justify-between h-full min-h-0 min-w-0 p-2.5 sm:p-3 md:p-4 lg:p-5 w-full relative z-10 overflow-hidden transition-all duration-300 ease-in-out">
        
        {/* Soft Organic Background Glow Gradients */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-teal-400/5 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

        {/* Tab 1: AI COMPANION (Main Redesigned Wellness Chat Container) */}
        {activeTab === "ai-companion" && (
          <div className="flex-1 w-full min-h-0 flex flex-col overflow-hidden">
            <WellnessChatSpace 
              userSession={session} 
              onResetSession={handleReset} 
              activeConversationId={activeConversationId}
              onSelectConversation={handleSelectConversation}
              onConversationsUpdated={loadConversations}
            />
          </div>
        )}

        {/* Tab 2: MOOD TRACKER (Mansitra Interactive Check-in) */}
        {activeTab === "mood-tracker" && (
          <div className="flex-1 w-full overflow-y-auto flex items-center justify-center p-2">
            <MoodTrackerView pseudonym={session.pseudonym} />
          </div>
        )}

        {/* Tab 3: CALMING SANCTUARY (Breathing, Ambient Music & Relaxing Mini-Games) */}
        {activeTab === "calming-tools" && (
          <div className="flex-1 w-full min-h-0 flex flex-col overflow-hidden">
            <CalmingSanctuary />
          </div>
        )}

        {/* Tab 4: VOICE COMPANION (Voice Sanctuary with Real-Time LLM & Lip-Sync) */}
        {activeTab === "voice-companion" && (
          <div className="flex-1 w-full overflow-y-auto flex items-center justify-center p-2">
            <VoiceSanctuaryView
              userSession={session}
              onNavigateToChat={() => setActiveTab("ai-companion")}
            />
          </div>
        )}

        {/* Tab 5: NEARBY PSYCHIATRISTS & CLINICS */}
        {activeTab === "nearby-psychiatrists" && (
          <div className="flex-1 w-full min-h-0 flex flex-col overflow-hidden">
            <PsychiatristsView />
          </div>
        )}

        {/* Minimal Footer */}
        <footer className="w-full pt-2 pb-0.5 mt-1 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 gap-1.5 shrink-0">
          <p>© 2026 Inearly Technologies. Ephemeral • Zero-PII • DPDP Act (2023) Aligned.</p>
          <div className="flex items-center gap-3">
            <span>24/7 Crisis Support:</span>
            <a href="tel:14416" className="text-emerald-600 dark:text-emerald-400 hover:underline font-mono">
              Tele-MANAS (14416)
            </a>
            <span>•</span>
            <a href="tel:112" className="text-emerald-600 dark:text-emerald-400 hover:underline font-mono">
              112
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}

{/* =========================================================================
    VIEW COMPONENT: MOOD TRACKER
   ========================================================================= */}
function MoodTrackerView({ pseudonym }: { pseudonym: string }) {
  const [selectedMood, setSelectedMood] = useState<string>("Calm");
  const [energyLevel, setEnergyLevel] = useState<number>(3);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>(["Exams / Studies"]);
  const [checkedIn, setCheckedIn] = useState(false);

  const MOODS = [
    { label: "Calm", emoji: "🌿", desc: "Centered & peaceful" },
    { label: "Anxious", emoji: "🌊", desc: "Racing thoughts & worry" },
    { label: "Overwhelmed", emoji: "⚡", desc: "Too much at once" },
    { label: "Burned Out", emoji: "🥀", desc: "Drained & exhausted" },
    { label: "Hopeful", emoji: "🌅", desc: "Looking forward" },
    { label: "Grounded", emoji: "🏔️", desc: "Steady & resilient" },
  ];

  const TRIGGERS = [
    "Exams / Studies",
    "Work Deadlines",
    "Sleep Quality",
    "Family / Relationships",
    "Loneliness",
    "Health / Body",
  ];

  const toggleTrigger = (t: string) => {
    setSelectedTriggers((prev) =>
      prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t]
    );
  };

  return (
    <div className="max-w-3xl mx-auto w-full rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 p-6 sm:p-8 shadow-xl shadow-slate-200/40 dark:shadow-black/50 space-y-6 my-auto">
      <div>
        <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Smile className="w-4 h-4" />
          <span>Mindful Daily Check-in</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          How is your heart feeling right now, {pseudonym}?
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          No right or wrong answers. Just taking 60 seconds to honor your emotional state.
        </p>
      </div>

      {/* Mood Selector Cards */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
          1. Select Primary Feeling
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {MOODS.map((m) => (
            <button
              key={m.label}
              onClick={() => {
                setSelectedMood(m.label);
                setCheckedIn(false);
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedMood === m.label
                  ? "bg-teal-50 dark:bg-teal-950/40 border-teal-500 shadow-md ring-1 ring-teal-500/30"
                  : "bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="text-2xl mb-1">{m.emoji}</div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">{m.label}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{m.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Energy Level Slider */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            2. Current Battery / Energy Level
          </label>
          <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
            {energyLevel} / 5 ({energyLevel <= 2 ? "Low Energy" : energyLevel === 3 ? "Balanced" : "High Energy"})
          </span>
        </div>
        <div className="flex items-center gap-3">
          {[1, 2, 3, 4, 5].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setEnergyLevel(lvl)}
              className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                energyLevel === lvl
                  ? "bg-gradient-to-r from-teal-500 to-indigo-600 text-white border-transparent shadow-md"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Triggers / Themes */}
      <div className="space-y-2 pt-2">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
          3. What is mostly on your mind? (Optional)
        </label>
        <div className="flex flex-wrap gap-2">
          {TRIGGERS.map((t) => (
            <button
              key={t}
              onClick={() => toggleTrigger(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                selectedTriggers.includes(t)
                  ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-500 text-indigo-700 dark:text-indigo-300"
                  : "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
              }`}
            >
              {selectedTriggers.includes(t) ? "✓ " : "+ "}
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Action / Result */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs text-slate-400">
          Your check-in is kept private and never tied to personal identity.
        </span>

        <button
          onClick={() => setCheckedIn(true)}
          className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-teal-500/25 transition-all cursor-pointer"
        >
          {checkedIn ? "✓ Check-in Saved" : "Save Daily Mood"}
        </button>
      </div>

      {checkedIn && (
        <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-500/30 text-xs text-teal-800 dark:text-teal-200 space-y-1 animate-fade-in">
          <div className="font-bold flex items-center gap-1.5 text-teal-700 dark:text-teal-300">
            <CheckCircle2 className="w-4 h-4" />
            <span>Check-in Recorded for {pseudonym}</span>
          </div>
          <p>
            It is completely valid to feel <strong>{selectedMood}</strong> today. Remember you don&apos;t have to solve everything in one single breath. Treat yourself with kindness today.
          </p>
        </div>
      )}
    </div>
  );
}

{/* =========================================================================
    VIEW COMPONENT: CALMING SANCTUARY (Delegates to modular CalmingSanctuary)
   ========================================================================= */}
function CalmingToolsView() {
  return <CalmingSanctuary />;
}


