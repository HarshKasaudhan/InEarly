"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Maximize2,
  Minimize2,
  Camera,
  Smile,
  Heart,
  Square,
  AlertCircle,
} from "lucide-react";
import {
  cleanTextForSpeech,
  getBestIndianVoice,
  getPacingParameters,
  loadSpeechVoices,
  isDevanagariHindi,
  fetchElevenLabsAudio,
  TTSLanguage,
} from "@/lib/ttsVoiceService";

export interface TalkingHeadAvatarHandle {
  speakText: (
    text: string,
    mood?: "neutral" | "happy" | "calm" | "empathetic",
    languageOverride?: TTSLanguage,
    voiceIdOverride?: string
  ) => void;
  stopSpeaking: () => void;
  setMood: (mood: string) => void;
  lookAtUser: () => void;
  isReady: () => boolean;
}

interface TalkingHeadAvatarProps {
  className?: string;
  avatarUrl?: string;
  initialMood?: string;
  showControls?: boolean;
  language?: TTSLanguage;
  elevenLabsVoiceId?: string;
  onReady?: () => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onOpenFaceScanner?: () => void;
  isPersistentScanningActive?: boolean;
  onTogglePersistentScanning?: () => void;
}

const VALID_MOODS: Record<string, string> = {
  neutral: "neutral",
  happy: "happy",
  love: "love",
  calm: "neutral",
  empathetic: "neutral",
  reflective: "neutral",
  peaceful: "neutral",
  sad: "sad",
  angry: "angry",
  fear: "fear",
  disgust: "disgust",
  sleep: "sleep",
};

const sanitizeMood = (mood?: string): string => {
  if (!mood) return "neutral";
  const clean = mood.trim().toLowerCase();
  return VALID_MOODS[clean] || "neutral";
};

export const TalkingHeadAvatar = forwardRef<
  TalkingHeadAvatarHandle,
  TalkingHeadAvatarProps
>(
  (
    {
      className = "",
      avatarUrl = "/avatars/inearly-companion.glb",
      initialMood = "neutral",
      showControls = true,
      language = "Hinglish",
      elevenLabsVoiceId = "21m00Tcm4TlvDq8ikWAM",
      onReady,
      onSpeechStart,
      onSpeechEnd,
      onOpenFaceScanner,
      isPersistentScanningActive = false,
      onTogglePersistentScanning,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const headInstanceRef = useRef<any>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Eagerly preload browser voice catalog on mount
    useEffect(() => {
      loadSpeechVoices().catch(() => {});
    }, []);

    const [isLoading, setIsLoading] = useState(true);
    const [loadProgress, setLoadProgress] = useState(0);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [cameraView, setCameraView] = useState<"upper" | "head">("upper");
    const [currentMood, setCurrentMood] = useState(sanitizeMood(initialMood));
    const [isExpanded, setIsExpanded] = useState(false);

    // Safe setMood with fallback to 'neutral' to avoid TalkingHead throwing "Unknown mood"
    const safeSetMood = useCallback((moodName: string) => {
      const targetMood = sanitizeMood(moodName);
      setCurrentMood(targetMood);

      const head = headInstanceRef.current;
      if (!head || !head.avatar || !head.avatar.body) {
        return;
      }

      try {
        if (head.animMoods && typeof head.animMoods === "object") {
          if (Object.prototype.hasOwnProperty.call(head.animMoods, targetMood)) {
            head.setMood?.(targetMood);
          } else {
            head.setMood?.("neutral");
          }
        } else {
          head.setMood?.(targetMood);
        }
      } catch (err) {
        console.warn("[TalkingHeadAvatar] Safe setMood fallback:", err);
        try {
          head.setMood?.("neutral");
        } catch {
          // ignore
        }
      }
    }, []);

    // Stop speaking safely
    const stopSpeaking = useCallback(() => {
      try {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
      } catch (e) {
        console.warn("SpeechSynthesis cancel error:", e);
      }

      if (headInstanceRef.current?.avatar?.body) {
        try {
          headInstanceRef.current.stopSpeaking?.();
          headInstanceRef.current.resetLips?.();
          safeSetMood("neutral");
        } catch (e) {
          console.warn("TalkingHead stop error:", e);
        }
      }

      setIsSpeaking(false);
      onSpeechEnd?.();
    }, [onSpeechEnd, safeSetMood]);

    // Speak text with synchronized 3D lip-sync & speech synthesis
    const speakText = useCallback(
      async (
        text: string,
        mood: "neutral" | "happy" | "calm" | "empathetic" = "calm",
        languageOverride?: TTSLanguage,
        voiceIdOverride?: string
      ) => {
        if (!text || !text.trim()) return;

        // Clean text: strip markdown symbols, bold, hashtags, code blocks, emojis & fix numbers/slang
        const cleanText = cleanTextForSpeech(text);
        if (!cleanText) return;

        // Determine effective language: explicit override > prop language > auto-detect Hindi script > default Hinglish
        const effectiveLang =
          languageOverride ||
          language ||
          (isDevanagariHindi(cleanText) ? "Hindi" : "Hinglish");

        const { rate, pitch, lipsyncLang } = getPacingParameters(effectiveLang);

        stopSpeaking();
        setIsSpeaking(true);
        safeSetMood(mood);
        onSpeechStart?.();

        const head = headInstanceRef.current;
        const targetVoiceId = voiceIdOverride || elevenLabsVoiceId || "21m00Tcm4TlvDq8ikWAM";

        // =========================================================================
        // PRIMARY PIPELINE: ElevenLabs Natural Audio Stream & 3D Lip-Sync
        // =========================================================================
        if (!isMuted && head && head.audioCtx) {
          try {
            const elevenAudio = await fetchElevenLabsAudio(
              cleanText,
              head.audioCtx,
              targetVoiceId
            );

            if (elevenAudio && elevenAudio.audioBuffer) {
              safeSetMood(mood);
              try {
                head.lookAtCamera?.(600);
                head.speakWithHands?.();
              } catch {}

              // Feed decoded ElevenLabs audio directly into TalkingHead speech & lip-sync queue
              head.speakAudio(
                {
                  audio: elevenAudio.audioBuffer,
                  words: elevenAudio.words,
                  wtimes: elevenAudio.wtimes,
                  wdurations: elevenAudio.wdurations,
                },
                { lipsyncLang }
              );

              // Reset speaking state when ElevenLabs audio completes
              const durationMs = Math.round(elevenAudio.audioBuffer.duration * 1000);
              setTimeout(() => {
                setIsSpeaking(false);
                onSpeechEnd?.();
              }, durationMs + 100);

              return;
            }
          } catch (elevenErr) {
            console.warn("ElevenLabs audio pipeline fallback to Web Speech API:", elevenErr);
          }
        }

        // =========================================================================
        // RESILIENT FALLBACK: Web Speech API (Indian Voice Profiles) & Synthetic Lipsync
        // =========================================================================
        const rawWords = cleanText.split(/\s+/).filter(Boolean);
        const words: string[] = [];
        const wtimes: number[] = [];
        const wdurations: number[] = [];

        let runningTimeMs = 50;
        for (const w of rawWords) {
          const baseDuration = Math.min(Math.max(w.length * 55, 180), 450);
          words.push(w);
          wtimes.push(runningTimeMs);
          wdurations.push(baseDuration);

          const punctuationPause = /[.,!?;:]$/.test(w) ? 140 : 25;
          runningTimeMs += baseDuration + punctuationPause;
        }

        const totalDurationMs = runningTimeMs;

        // Trigger 3D lipsync animation in TalkingHead
        if (head && head.avatar && head.avatar.body) {
          try {
            safeSetMood(mood);
            head.lookAtCamera?.(600);
            try {
              head.speakWithHands?.();
            } catch {}

            if (head.audioCtx && head.speakAudio) {
              const sampleRate = head.audioCtx.sampleRate || 22050;
              const totalSec = Math.max((totalDurationMs + 400) / 1000, 0.5);
              const numSamples = Math.floor(sampleRate * totalSec);
              const silentBuffer = head.audioCtx.createBuffer(1, numSamples, sampleRate);

              head.speakAudio(
                {
                  audio: silentBuffer,
                  words,
                  wtimes,
                  wdurations,
                },
                { lipsyncLang }
              );
            }
          } catch (err) {
            console.warn("TalkingHead lipsync dispatch error:", err);
          }
        }

        // Trigger Web Speech API voice output if not muted
        if (!isMuted && typeof window !== "undefined" && "speechSynthesis" in window) {
          try {
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utteranceRef.current = utterance;

            // Pick Indian voice profile (hi-IN, en-IN)
            const voices = window.speechSynthesis.getVoices();
            const bestVoice = getBestIndianVoice(voices, effectiveLang, cleanText);

            if (bestVoice) {
              utterance.voice = bestVoice;
              utterance.lang = bestVoice.lang;
            } else {
              utterance.lang = effectiveLang.toLowerCase() === "hindi" ? "hi-IN" : "en-IN";
            }

            utterance.rate = rate;
            utterance.pitch = pitch;

            utterance.onend = () => {
              setIsSpeaking(false);
              onSpeechEnd?.();
            };

            utterance.onerror = (e) => {
              console.warn("Speech synthesis error:", e);
              setIsSpeaking(false);
              onSpeechEnd?.();
            };

            window.speechSynthesis.speak(utterance);
          } catch (e) {
            console.warn("SpeechSynthesis error:", e);
          }
        } else {
          // If muted, timer to reset speaking status when animation finishes
          setTimeout(() => {
            setIsSpeaking(false);
            onSpeechEnd?.();
          }, totalDurationMs + 200);
        }
      },
      [language, elevenLabsVoiceId, isMuted, stopSpeaking, safeSetMood, onSpeechStart, onSpeechEnd]
    );

    // Expose methods via ref
    useImperativeHandle(
      ref,
      () => ({
        speakText,
        stopSpeaking,
        setMood: (mood: string) => {
          safeSetMood(mood);
        },
        lookAtUser: () => {
          if (headInstanceRef.current?.avatar?.body) {
            try {
              headInstanceRef.current.lookAtCamera?.(600);
            } catch {}
          }
        },
        isReady: () => !isLoading && !!headInstanceRef.current?.avatar?.body,
      }),
      [speakText, stopSpeaking, safeSetMood, isLoading]
    );

    // Initialize TalkingHead
    const initCounterRef = useRef(0);
    useEffect(() => {
      const currentRunId = ++initCounterRef.current;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let head: any = null;

      const initAvatar = async () => {
        if (!containerRef.current || typeof window === "undefined") return;

        setIsLoading(true);
        setLoadError(null);

        try {
          // Dynamic import of TalkingHead class
          const { TalkingHead } = await import("@met4citizen/talkinghead");

          if (initCounterRef.current !== currentRunId || !containerRef.current) return;

          // Clear any previous canvas child nodes
          containerRef.current.innerHTML = "";

          // Instantiate TalkingHead
          head = new TalkingHead(containerRef.current, {
            cameraView: "upper",
            cameraDistance: 0,
            cameraX: 0,
            cameraY: 0.05,
            cameraRotateEnable: true,
            cameraPanEnable: false,
            cameraZoomEnable: true,
            avatarMood: initialMood,
            avatarSpeakingEyeContact: 0.7,
            avatarIdleEyeContact: 0.45,
            avatarSpeakingHeadMove: 0.55,
            lipsyncModules: ["en"],
            modelFPS: 30,
            lightAmbientColor: 0xffffff,
            lightAmbientIntensity: 2.2,
            lightDirectColor: 0xd4ecff,
            lightDirectIntensity: 22,
          });

          headInstanceRef.current = head;

          // Load 3D avatar GLB model
          console.log("[TalkingHeadAvatar] Loading 3D model:", avatarUrl);
          await head.showAvatar(
            {
              url: avatarUrl,
              body: "F",
              avatarMood: sanitizeMood(initialMood),
              lipsyncLang: "en",
              baseline: {
                headRotateX: -0.04,
                eyeBlinkLeft: 0.12,
                eyeBlinkRight: 0.12,
              },
            },
            (_url: string, ev?: { loaded?: number; total?: number; lengthComputable?: boolean }) => {
              if (ev?.lengthComputable && ev?.total && ev.total > 0 && initCounterRef.current === currentRunId) {
                const percent = Math.min(Math.round(((ev.loaded || 0) / ev.total) * 100), 100);
                setLoadProgress(percent);
              } else if (ev?.loaded && initCounterRef.current === currentRunId) {
                setLoadProgress((prev) => Math.min(prev + 5, 95));
              }
            }
          );

          if (initCounterRef.current !== currentRunId) {
            head.stop?.();
            head.dispose?.();
            return;
          }

          console.log("[TalkingHeadAvatar] Model successfully loaded and ready!");
          // Force resize update to guarantee crisp canvas pixel ratio
          head.onResize?.();
          setLoadProgress(100);
          setIsLoading(false);
          onReady?.();

          // Handle responsive window & container resize with ResizeObserver
          const handleResize = () => {
            if (head && head.avatar && typeof head.onResize === "function") {
              try {
                head.onResize();
              } catch {}
            }
          };
          window.addEventListener("resize", handleResize);

          let resizeObserver: ResizeObserver | null = null;
          if (containerRef.current && typeof ResizeObserver !== "undefined") {
            resizeObserver = new ResizeObserver(() => {
              handleResize();
            });
            resizeObserver.observe(containerRef.current);
          }

          return () => {
            window.removeEventListener("resize", handleResize);
            if (resizeObserver) {
              resizeObserver.disconnect();
            }
          };
        } catch (err: unknown) {
          console.error("TalkingHead initialization error:", err);
          if (initCounterRef.current === currentRunId) {
            setIsLoading(false);
            setLoadError(err instanceof Error ? err.message : "Failed to load 3D avatar model");
          }
        }
      };

      initAvatar();

      return () => {
        try {
          if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
          }
        } catch (e) {}

        if (headInstanceRef.current) {
          try {
            headInstanceRef.current.stop?.();
            headInstanceRef.current.dispose?.();
          } catch (e) {
            console.warn("Disposing TalkingHead:", e);
          }
          headInstanceRef.current = null;
        }
      };
    }, [avatarUrl, initialMood, onReady]);

    // Switch camera angle (head close-up vs upper body)
    const toggleCameraView = () => {
      const nextView = cameraView === "upper" ? "head" : "upper";
      setCameraView(nextView);
      if (headInstanceRef.current?.avatar?.body && typeof headInstanceRef.current.setView === "function") {
        try {
          headInstanceRef.current.setView(nextView);
        } catch (e) {
          console.warn("TalkingHead setView error:", e);
        }
      }
    };

    // Cycle avatar emotional mood safely with supported TalkingHead animMoods
    const cycleMood = () => {
      const moods = ["neutral", "happy", "love"];
      const nextIdx = (moods.indexOf(currentMood) + 1) % moods.length;
      const nextMood = moods[nextIdx];
      safeSetMood(nextMood);
    };

    return (
      <div
        className={`relative rounded-3xl overflow-hidden border border-slate-200/90 dark:border-slate-800/90 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 shadow-2xl transition-all duration-300 flex flex-col ${
          isExpanded ? "fixed inset-4 sm:inset-10 z-50 h-[calc(100vh-5rem)] max-w-5xl mx-auto" : className
        }`}
      >
        {/* Subtle Ambient Radial Backlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-teal-500/15 rounded-full blur-[90px] pointer-events-none -z-0" />
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none -z-0" />

        {/* 1. TOP STATUS BAR */}
        <div className="relative z-10 px-3.5 py-2.5 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-teal-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold shadow-xs shrink-0">
              3D
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-100 font-sans tracking-tight truncate">
                  Companion
                </span>
                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                  3D View
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-sans truncate">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isLoading
                      ? "bg-amber-400 animate-pulse"
                      : isSpeaking
                      ? "bg-teal-400 animate-ping"
                      : "bg-emerald-400"
                  }`}
                />
                <span className="truncate">
                  {isLoading
                    ? `${loadProgress}%`
                    : isSpeaking
                    ? "Speaking with lip-sync"
                    : "Attentive & Listening"}
                </span>
              </div>
            </div>
          </div>

          {/* Controls Cluster */}
          {showControls && (
            <div className="flex items-center gap-1 shrink-0">
              {/* Stop Speaking CTA if active */}
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                  title="Pause Avatar Speech"
                >
                  <Square className="w-2.5 h-2.5 fill-rose-300" />
                  <span>Pause</span>
                </button>
              )}

              {/* Mute Audio Toggle */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                  isMuted
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                    : "bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
                title={isMuted ? "Unmute Voice" : "Mute Voice (Silent Lip-sync)"}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              {/* Camera Face Emotion & Liveness Scanner Toggle */}
              <button
                onClick={() => {
                  if (onTogglePersistentScanning) {
                    onTogglePersistentScanning();
                  } else if (onOpenFaceScanner) {
                    onOpenFaceScanner();
                  } else {
                    toggleCameraView();
                  }
                }}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer shrink-0 relative ${
                  isPersistentScanningActive
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-500/20"
                    : onOpenFaceScanner || onTogglePersistentScanning
                    ? "bg-teal-500/10 border-teal-500/40 text-teal-300 hover:text-white hover:bg-teal-500/20 shadow-xs"
                    : "bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
                title={
                  isPersistentScanningActive
                    ? "Persistent Face Sensing Active (Tap to turn off)"
                    : "Enable Persistent Face Emotion & Liveness Sensing (Webcam)"
                }
              >
                <Camera className="w-3.5 h-3.5" />
                {isPersistentScanningActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </button>

              {/* Mood & Face Emotion Diagnostics Modal */}
              <button
                onClick={(e) => {
                  if (onOpenFaceScanner && !e.shiftKey) {
                    onOpenFaceScanner();
                  } else {
                    cycleMood();
                  }
                }}
                className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-teal-400 hover:text-teal-200 hover:bg-slate-800 transition-all cursor-pointer shrink-0"
                title={
                  onOpenFaceScanner
                    ? `Perceive Facial Emotion & View Diagnostics (Current: ${currentMood})`
                    : `Cycle mood (Currently: ${currentMood})`
                }
              >
                <Smile className="w-3.5 h-3.5" />
              </button>

              {/* Expand / Minimize */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer shrink-0"
                title={isExpanded ? "Collapse View" : "Expand 3D View"}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* 2. THREE.JS / TALKINGHEAD VIEWPORT CANVAS CONTAINER */}
        <div className="relative flex-1 w-full min-h-0 h-full flex items-center justify-center overflow-hidden">
          {/* Canvas Mount Node for TalkingHead */}
          <div
            ref={containerRef}
            className="w-full h-full min-h-0 flex-1 flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
            style={{ width: "100%", height: "100%" }}
          />

          {/* Loading Overlay with progress bar */}
          {isLoading && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center gap-3 p-6 text-center z-20">
              <div className="relative w-16 h-16">
                <div className="w-16 h-16 rounded-full border-2 border-teal-500/20 border-t-teal-400 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-teal-400">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-white font-sans">
                  Summoning Your 3D Companion
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Loading high-fidelity Oculus visemes &amp; rigging...
                </p>
              </div>
              <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-gradient-to-r from-teal-400 via-emerald-400 to-indigo-500 transition-all duration-300"
                  style={{ width: `${Math.max(loadProgress, 15)}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Fallback */}
          {loadError && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center gap-2 p-6 text-center z-20">
              <AlertCircle className="w-8 h-8 text-amber-400" />
              <p className="text-xs font-bold text-white">Could not load 3D Avatar</p>
              <p className="text-[10px] text-slate-400 max-w-xs">{loadError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Speaking Audio Wave Visualizer Accent (Overlay bottom) */}
          {isSpeaking && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-950/70 border border-teal-500/40 backdrop-blur-md flex items-center gap-1.5 z-10 shadow-lg pointer-events-none">
              <div className="flex items-center gap-1">
                <span className="w-1 h-3 bg-teal-400 rounded-full animate-bounce [animation-delay:0s]" />
                <span className="w-1 h-5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-1 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                <span className="w-1 h-4 bg-teal-400 rounded-full animate-bounce [animation-delay:0.45s]" />
              </div>
              <span className="text-[10px] font-mono text-teal-300 font-semibold uppercase tracking-wider pl-1">
                Active Lip-Sync
              </span>
            </div>
          )}
        </div>

        {/* 3. INTERACTIVE FOOTER BADGE */}
        <div className="relative z-10 px-4 py-2 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-sans shrink-0">
          <span className="flex items-center gap-1 text-slate-400">
            <Heart className="w-3 h-3 text-rose-400" />
            <span>Interactive 3D Active Listener</span>
          </span>
          <span className="text-slate-500">
            Rotate: Drag • Zoom: Scroll
          </span>
        </div>
      </div>
    );
  }
);

TalkingHeadAvatar.displayName = "TalkingHeadAvatar";
