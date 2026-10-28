"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import {
  Wind,
  Music,
  Gamepad2,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Headphones,
  Radio,
  Volume2,
  VolumeX,
  CloudRain,
  Waves,
  TreePine,
  Coffee,
  RefreshCw,
  Eye,
  Hand,
  Ear,
  Flower2,
  Smile,
} from "lucide-react";

// Web Audio API Pop Sound Synthesizer (Zero-dependency, zero-latency)
function playPopSound(freq = 450) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq + Math.random() * 80 - 40, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  } catch (e) {
    // Ignore audio autoplay restrictions
  }
}

// Curated Relaxing YouTube Music & Soundscapes
interface AmbientTrack {
  id: string;
  title: string;
  category: "lofi" | "nature" | "ambient";
  duration: string;
  youtubeId: string;
  description: string;
  tags: string[];
  icon: any;
}

const AMBIENT_TRACKS: AmbientTrack[] = [
  {
    id: "lofi-girl",
    title: "Lofi Girl - Relaxing Beats to Study & Chill",
    category: "lofi",
    duration: "Live 24/7",
    youtubeId: "5qap5aO4i9A",
    description: "Soothing downtempo Lo-Fi hip hop beats curated for calm focus and evening unwinding.",
    tags: ["Lo-Fi", "Gentle Beats", "Study/Work"],
    icon: Headphones,
  },
  {
    id: "rain-night",
    title: "Gentle Rain on Leaves & Distant Thunder",
    category: "nature",
    duration: "Continuous",
    youtubeId: "mPZkdNFkNps",
    description: "Calming natural rainfall acoustics to lower heart rate and soothe bedtime overthinking.",
    tags: ["Rainfall", "Nature", "Sleep"],
    icon: CloudRain,
  },
  {
    id: "himalayan-bowls",
    title: "Tibetan & Himalayan Singing Bowls (432Hz)",
    category: "ambient",
    duration: "Continuous",
    youtubeId: "Q5dU6serX64",
    description: "Harmonic Tibetan singing bowls tuned to resonant healing frequencies for deep somatic peace.",
    tags: ["Singing Bowls", "Meditation", "Deep Grounding"],
    icon: Flower2,
  },
  {
    id: "indian-flute",
    title: "Indian Classical Bamboo Flute (Bansuri Meditation)",
    category: "ambient",
    duration: "Continuous",
    youtubeId: "qYNAXbQrq_w",
    description: "Traditional Indian Raaga on bamboo flute echoing tranquility and spiritual grounding.",
    tags: ["Bansuri", "Indian Classical", "Soulful Calm"],
    icon: Wind,
  },
  {
    id: "ocean-waves",
    title: "Gentle Ocean Waves at Sunset",
    category: "nature",
    duration: "Continuous",
    youtubeId: "WHPEKLQID4U",
    description: "Rhythmic oceanic waves ebbing and flowing to synchronise and deepen your natural breathing.",
    tags: ["Ocean", "Coastline", "Rhythm"],
    icon: Waves,
  },
  {
    id: "cozy-coffee",
    title: "Rainy Night Coffee Shop Soft Jazz & Piano",
    category: "lofi",
    duration: "Continuous",
    youtubeId: "VMAPTo7RVCo",
    description: "Warm acoustic jazz piano melodies with ambient coffee-shop warmth and distant rain.",
    tags: ["Jazz Piano", "Cozy", "Warmth"],
    icon: Coffee,
  },
];

export default function CalmingSanctuary() {
  const [activeMainTab, setActiveMainTab] = useState<"breathing" | "music" | "games">("breathing");

  // =========================================================================
  // 1. BREATHING SANCTUARY STATE (Box 4-4-4, 4-7-8, 5-4-3-2-1 Grounding)
  // =========================================================================
  const [breathingMethod, setBreathingMethod] = useState<"box" | "478" | "grounding">("box");
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<string>("Inhale");
  const [phaseSeconds, setPhaseSeconds] = useState(4);

  // Box (4-4-4-4) vs 4-7-8 Relaxing breath configurations
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isBreathingActive && breathingMethod !== "grounding") {
      interval = setInterval(() => {
        setPhaseSeconds((prev) => {
          if (prev <= 1) {
            if (breathingMethod === "box") {
              setBreathPhase((current) => {
                if (current === "Inhale") return "Hold";
                if (current === "Hold") return "Exhale";
                if (current === "Exhale") return "Rest";
                return "Inhale";
              });
              return 4;
            } else {
              // 4-7-8 Deep Sleep breath
              setBreathPhase((current) => {
                if (current === "Inhale") return "Hold";
                if (current === "Hold") return "Exhale";
                return "Inhale";
              });
              if (breathPhase === "Inhale") return 7;
              if (breathPhase === "Hold") return 8;
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBreathingActive, breathingMethod, breathPhase]);

  const resetBreathing = () => {
    setIsBreathingActive(false);
    setBreathPhase("Inhale");
    setPhaseSeconds(breathingMethod === "478" ? 4 : 4);
  };

  // 5-4-3-2-1 Sensory Grounding Checklist
  const [checkedGrounding, setCheckedGrounding] = useState<number[]>([]);
  const GROUNDING_STEPS = [
    { count: 5, label: "SEE", icon: Eye, action: "5 things you can SEE around you (e.g., wall clock, plant, window sunlight)" },
    { count: 4, label: "TOUCH", icon: Hand, action: "4 things you can physically TOUCH (e.g., cool table, fabric of your shirt, hair)" },
    { count: 3, label: "HEAR", icon: Ear, action: "3 distinct sounds you can HEAR (e.g., fan hum, distant vehicles, your breathing)" },
    { count: 2, label: "SMELL", icon: Wind, action: "2 things you can SMELL (e.g., tea, fresh air, soap scent)" },
    { count: 1, label: "AFFIRM", icon: Smile, action: "1 kind truth about yourself (e.g., 'I am doing the best I can right now')" },
  ];

  const toggleGrounding = (idx: number) => {
    playPopSound(500 + idx * 50);
    setCheckedGrounding((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  // =========================================================================
  // 2. AMBIENT MUSIC & YOUTUBE PLAYER STATE
  // =========================================================================
  const [selectedTrack, setSelectedTrack] = useState<AmbientTrack>(AMBIENT_TRACKS[0]);
  const [musicFilter, setMusicFilter] = useState<"all" | "lofi" | "nature" | "ambient">("all");
  const [isPlayingEmbed, setIsPlayingEmbed] = useState(false);

  const filteredTracks = AMBIENT_TRACKS.filter(
    (t) => musicFilter === "all" || t.category === musicFilter
  );

  // =========================================================================
  // 3. MIND RELAXING MINI-GAMES STATE
  // =========================================================================
  const [activeGame, setActiveGame] = useState<"bubble" | "particle">("bubble");

  // Game 1: Bubble Pop State
  const BUBBLE_COUNT = 32;
  const [poppedBubbles, setPoppedBubbles] = useState<boolean[]>(new Array(BUBBLE_COUNT).fill(false));
  const [popScore, setPopScore] = useState(0);

  const handlePop = (idx: number) => {
    if (poppedBubbles[idx]) return;
    playPopSound(380 + (idx % 8) * 40);
    setPoppedBubbles((prev) => {
      const next = [...prev];
      next[idx] = true;
      return next;
    });
    setPopScore((s) => s + 1);
  };

  const refillBubbles = () => {
    playPopSound(300);
    setPoppedBubbles(new Array(BUBBLE_COUNT).fill(false));
  };

  // Game 2: Particle Flow Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (activeMainTab !== "games" || activeGame !== "particle") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 400);

    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      color: string;
      vx: number;
      vy: number;
      alpha: number;
      life: number;
    }> = [];

    const colors = ["#14b8a6", "#2dd4bf", "#6366f1", "#818cf8", "#38bdf8", "#34d399"];

    function createParticle(x: number, y: number, speedMultiplier = 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 1.8 + 0.4) * speedMultiplier;
      particles.push({
        x,
        y,
        radius: Math.random() * 3.5 + 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 0.85,
        life: Math.random() * 80 + 60,
      });
      if (particles.length > 250) particles.shift();
    }

    // Seed initial gentle floating particles
    for (let i = 0; i < 45; i++) {
      createParticle(Math.random() * width, Math.random() * height);
    }

    // Mouse / Touch Interaction
    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      for (let i = 0; i < 3; i++) {
        createParticle(x, y, 1.2);
      }
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      playPopSound(520);
      for (let i = 0; i < 24; i++) {
        createParticle(x, y, 2.5);
      }
    };

    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("click", handleClick);

    function render() {
      if (!ctx) return;
      ctx.fillStyle = "rgba(15, 23, 42, 0.18)";
      ctx.fillRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.007;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.save();
        ctx.globalAlpha = Math.max(p.alpha, 0);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.alpha <= 0) {
          particles.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("click", handleClick);
    };
  }, [activeMainTab, activeGame]);

  return (
    <div className="w-full flex-1 flex flex-col h-full min-h-0 bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl transition-all duration-300">
      
      {/* 1. MANSITRA-INSPIRED SANCTUARY HEADER & MAIN NAVIGATION TABS */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/60 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-teal-500/25">
                <Wind className="w-4 h-4" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Calming Sanctuary &amp; Relaxation
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Evidence-based nervous system regulation, curated calming YouTube soundscapes, and stress-relief mini-games.
            </p>
          </div>

          {/* 3 Main Sanctuary Tabs */}
          <div className="flex items-center bg-slate-200/80 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-300/70 dark:border-slate-700/80 text-xs shadow-inner shrink-0">
            <button
              onClick={() => setActiveMainTab("breathing")}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                activeMainTab === "breathing"
                  ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Wind className="w-3.5 h-3.5" />
              <span>Breathing Sanctuary</span>
            </button>

            <button
              onClick={() => setActiveMainTab("music")}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                activeMainTab === "music"
                  ? "bg-gradient-to-r from-teal-500 to-indigo-600 text-white shadow-md shadow-teal-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Ambient &amp; YouTube</span>
            </button>

            <button
              onClick={() => setActiveMainTab("games")}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                activeMainTab === "games"
                  ? "bg-gradient-to-r from-indigo-500 to-teal-500 text-white shadow-md shadow-teal-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Mind Mini-Games</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. TAB CONTENT CONTAINER */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        
        {/* =====================================================================
            TAB 1: BREATHING SANCTUARY & SENSORY GROUNDING
           ===================================================================== */}
        {activeMainTab === "breathing" && (
          <div className="max-w-3xl mx-auto w-full space-y-6 animate-fade-in">
            {/* Method Pills */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Somatic Regulation &amp; Breathing
                </h3>
                <p className="text-xs text-slate-500">
                  Activates the parasympathetic vagal nerve to rapidly ease heart rate and adrenaline.
                </p>
              </div>

              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 text-xs">
                <button
                  onClick={() => {
                    setBreathingMethod("box");
                    resetBreathing();
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    breathingMethod === "box"
                      ? "bg-teal-500 text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Box (4-4-4)
                </button>
                <button
                  onClick={() => {
                    setBreathingMethod("478");
                    resetBreathing();
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    breathingMethod === "478"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  4-7-8 Deep Sleep
                </button>
                <button
                  onClick={() => {
                    setBreathingMethod("grounding");
                    resetBreathing();
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    breathingMethod === "grounding"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  5-4-3-2-1 Sensory
                </button>
              </div>
            </div>

            {/* Interactive Breathing Circles (Box 4-4-4 or 4-7-8) */}
            {breathingMethod !== "grounding" && (
              <div className="flex flex-col items-center justify-center py-6 space-y-6 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                  {breathingMethod === "box"
                    ? "Inhale 4s • Hold 4s • Exhale 4s • Rest 4s. A Navy SEAL & yogic Pranayama technique to stop panic."
                    : "Inhale 4s • Hold gently 7s • Exhale through mouth 8s. Clinically proven to calm bedtime racing thoughts."}
                </p>

                {/* Animated Pulsing Ring */}
                <div className="relative flex items-center justify-center w-60 h-60">
                  <div
                    className={`absolute inset-0 rounded-full bg-teal-400/20 dark:bg-teal-500/20 transition-all duration-1000 ${
                      isBreathingActive && breathPhase === "Inhale"
                        ? "scale-110 opacity-90"
                        : isBreathingActive && breathPhase === "Exhale"
                        ? "scale-75 opacity-40"
                        : "scale-95 opacity-60"
                    }`}
                  />

                  <div
                    className={`w-48 h-48 rounded-full border-4 border-teal-500/40 bg-gradient-to-tr from-teal-500/10 via-emerald-500/20 to-indigo-500/20 backdrop-blur-md flex flex-col items-center justify-center transition-all duration-1000 shadow-2xl ${
                      isBreathingActive && breathPhase === "Inhale"
                        ? "scale-105 border-teal-400 shadow-teal-500/30"
                        : isBreathingActive && breathPhase === "Exhale"
                        ? "scale-90 border-indigo-400 shadow-indigo-500/20"
                        : "scale-100 border-teal-500/50"
                    }`}
                  >
                    <span className="text-xs uppercase font-extrabold tracking-widest text-teal-600 dark:text-teal-300">
                      {isBreathingActive ? breathPhase : "Ready"}
                    </span>
                    <span className="text-4xl font-extrabold font-mono text-slate-900 dark:text-white my-1">
                      {isBreathingActive ? phaseSeconds : 4}s
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {breathPhase === "Inhale"
                        ? "Breathe in softly"
                        : breathPhase === "Hold"
                        ? "Hold gently without strain"
                        : breathPhase === "Exhale"
                        ? "Smoothly release tension"
                        : "Rest before next cycle"}
                    </span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsBreathingActive(!isBreathingActive)}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-semibold text-sm shadow-lg shadow-teal-500/25 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
                  >
                    {isBreathingActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isBreathingActive ? "Pause Exercise" : "Start Guided Breathing"}</span>
                  </button>

                  <button
                    onClick={resetBreathing}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer transition-colors"
                    title="Reset timer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* 5-4-3-2-1 Sensory Grounding Tool */}
            {breathingMethod === "grounding" && (
              <div className="space-y-4 animate-fade-in">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  When dissociation or anxiety strikes, this cognitive grounding sequence pulls your mind back to the safe, tangible physical room. Tap each item as you notice it:
                </p>

                <div className="space-y-2.5">
                  {GROUNDING_STEPS.map((step, idx) => {
                    const Icon = step.icon;
                    const isDone = checkedGrounding.includes(idx);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleGrounding(idx)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isDone
                            ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-500/60 shadow-xs"
                            : "bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              isDone
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">
                              Step {step.count} • {step.label}
                            </span>
                            <span
                              className={`text-xs ${
                                isDone
                                  ? "text-slate-900 dark:text-white font-medium line-through opacity-75"
                                  : "text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {step.action}
                            </span>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center text-[10px] shrink-0 ${
                            isDone
                              ? "bg-indigo-600 border-indigo-600 text-white"
                              : "border-slate-300 dark:border-slate-700 text-transparent"
                          }`}
                        >
                          ✓
                        </div>
                      </div>
                    );
                  })}
                </div>

                {checkedGrounding.length === 5 && (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-fade-in shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Wonderful! You are anchored in this safe present moment. Breathe easy.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            TAB 2: AMBIENT MUSIC & YOUTUBE SONGS (Curated Calming Soundscapes)
           ===================================================================== */}
        {activeMainTab === "music" && (
          <div className="max-w-4xl mx-auto w-full space-y-6 animate-fade-in">
            {/* Embedded Active YouTube Player Section */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
              <div className="relative aspect-video w-full bg-slate-900">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube-nocookie.com/embed/${selectedTrack.youtubeId}?autoplay=${isPlayingEmbed ? "1" : "0"}&rel=0`}
                  title={selectedTrack.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {/* Player Details Bar */}
              <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                    <selectedTrack.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{selectedTrack.title}</h4>
                    <p className="text-[11px] text-slate-400">{selectedTrack.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://www.youtube.com/watch?v=${selectedTrack.youtubeId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span>Open in YouTube</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Curated Track Selector List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Curated Calming Soundscapes
                </span>

                {/* Genre Filter Pills */}
                <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-[11px]">
                  {(["all", "lofi", "nature", "ambient"] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setMusicFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-all cursor-pointer ${
                        musicFilter === cat
                          ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 font-bold shadow-xs"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredTracks.map((track) => {
                  const isCurrent = selectedTrack.id === track.id;
                  const Icon = track.icon;
                  return (
                    <div
                      key={track.id}
                      onClick={() => {
                        setSelectedTrack(track);
                        setIsPlayingEmbed(true);
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isCurrent
                          ? "bg-teal-500/10 border-teal-500 text-teal-950 dark:text-teal-100 shadow-md ring-1 ring-teal-500/30"
                          : "bg-white dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isCurrent
                              ? "bg-gradient-to-tr from-teal-500 to-indigo-600 text-white shadow-xs"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <h5 className="font-bold text-xs truncate text-slate-900 dark:text-white">
                            {track.title}
                          </h5>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono">
                              {track.duration}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate">
                              {track.tags.join(" • ")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <button
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                            isCurrent
                              ? "bg-teal-500 text-white shadow-xs"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          <Play className="w-3 h-3 ml-0.5 fill-current" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 3: MIND RELAXING MINI-GAMES (Bubble Pop & Zen Particle Flow)
           ===================================================================== */}
        {activeMainTab === "games" && (
          <div className="max-w-3xl mx-auto w-full space-y-6 animate-fade-in">
            {/* Mini-Game Switcher */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Mind Relaxing Mini-Games
                </h3>
                <p className="text-xs text-slate-500">
                  Tactile, satisfying micro-interactions to disrupt anxiety loops and promote tactile grounding.
                </p>
              </div>

              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 text-xs">
                <button
                  onClick={() => setActiveGame("bubble")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    activeGame === "bubble"
                      ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Bubble Pop (32x)
                </button>
                <button
                  onClick={() => setActiveGame("particle")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    activeGame === "particle"
                      ? "bg-gradient-to-r from-indigo-500 to-teal-500 text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Zen Particle Flow
                </button>
              </div>
            </div>

            {/* Game 1: Sensory Bubble Pop */}
            {activeGame === "bubble" && (
              <div className="flex flex-col items-center justify-center py-4 space-y-5 animate-fade-in text-center">
                <div className="flex items-center justify-between w-full px-2 text-xs">
                  <span className="font-bold text-teal-600 dark:text-teal-400 font-mono">
                    🫧 Total Popped: {popScore}
                  </span>
                  <button
                    onClick={refillBubbles}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors font-medium cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-teal-500" />
                    <span>Refill All Bubbles</span>
                  </button>
                </div>

                {/* 32 Bubble Glassmorphic Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-4 p-4 rounded-3xl bg-slate-100/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 shadow-inner w-full max-w-xl mx-auto">
                  {poppedBubbles.map((isPopped, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePop(idx)}
                      className={`aspect-square rounded-full transition-all duration-200 flex items-center justify-center font-bold text-xs select-none cursor-pointer ${
                        isPopped
                          ? "bg-slate-200/50 dark:bg-slate-900/40 border border-slate-300/30 dark:border-slate-800/30 scale-90 opacity-40 shadow-inner"
                          : "bg-gradient-to-tr from-teal-400/80 via-emerald-300/70 to-indigo-400/80 hover:scale-110 active:scale-95 shadow-md shadow-teal-500/25 border-2 border-white/80 dark:border-white/20 animate-pulse hover:shadow-lg"
                      }`}
                      title={isPopped ? "Popped" : "Tap to pop!"}
                    >
                      {isPopped ? "" : "✨"}
                    </button>
                  ))}
                </div>

                <p className="text-[11px] text-slate-400">
                  Tap or click any bubble to trigger soothing acoustic frequencies and pop animations.
                </p>
              </div>
            )}

            {/* Game 2: Zen Particle Flow Canvas */}
            {activeGame === "particle" && (
              <div className="flex flex-col items-center justify-center space-y-3 animate-fade-in text-center">
                <div className="relative w-full h-[360px] sm:h-[400px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl bg-slate-950">
                  <canvas ref={canvasRef} className="w-full h-full cursor-crosshair" />

                  {/* Canvas HUD Instruction Overlay */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-800 text-[11px] text-slate-300 pointer-events-none flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    <span>Move cursor to guide stardust • Click anywhere to burst ripples</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  Watching fluid, self-organizing particle currents calms the visual cortex and induces mindful focus.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
