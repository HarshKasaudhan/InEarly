"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  MessageSquare,
  Square,
  Play,
  Pause,
  AlertCircle,
  CheckCircle2,
  Lock,
  Globe,
} from "lucide-react";
import { TalkingHeadAvatar, TalkingHeadAvatarHandle } from "@/components/TalkingHeadAvatar";

interface UserSession {
  userId?: string;
  pseudonym?: string;
  language?: string;
  ageBand?: string;
  saveChats?: boolean;
  consentId?: string;
}

interface VoiceSanctuaryViewProps {
  userSession?: UserSession | null;
  onNavigateToChat?: () => void;
}

interface VoiceDialogueTurn {
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

export default function VoiceSanctuaryView({
  userSession,
  onNavigateToChat,
}: VoiceSanctuaryViewProps) {
  const avatarRef = useRef<TalkingHeadAvatarHandle>(null);

  // States
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [dialogueHistory, setDialogueHistory] = useState<VoiceDialogueTurn[]>([]);
  const [activeLang, setActiveLang] = useState<"Hinglish" | "Hindi" | "English">(
    (userSession?.language as any) || "Hinglish"
  );
  const [statusMessage, setStatusMessage] = useState<string>(
    "Tap the microphone and speak whatever is on your mind."
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mutable refs to prevent React closure staleness
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>("");
  const isManuallyStoppedRef = useRef<boolean>(false);

  const pseudonym = userSession?.pseudonym || "Friend";

  // Pre-configured Guided Voice Prompts
  const GUIDED_STARTERS = [
    {
      title: "2-Minute Evening Wind Down",
      desc: "Gentle somatic grounding before sleep",
      prompt: "Can you guide me through a calming evening wind down to quiet my racing thoughts before sleep?",
    },
    {
      title: "Exam & Academic Dread",
      desc: "De-escalate acute syllabus panic",
      prompt: "I am feeling paralyzed by exam stress and backlogs. How do I calm my mind right now?",
    },
    {
      title: "Career & Imposter Fear",
      desc: "Overcome placement & interview comparison",
      prompt: "Everyone around me is getting job offers and I feel like a failure. Help me process this.",
    },
    {
      title: "Heartbreak & Emotional Release",
      desc: "Hold space for grief & loneliness",
      prompt: "I am dealing with a painful breakup and feeling completely empty and alone today.",
    },
  ];

  // Send recognized voice text to AI chat API
  const handleSendVoiceMessage = useCallback(
    async (textToSend: string) => {
      const cleanText = textToSend.trim();
      if (!cleanText || isProcessing) return;

      setIsProcessing(true);
      setErrorMessage(null);
      setStatusMessage("Inearly is thinking mindfully...");

      // Append user's voice message to dialogue history
      const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const userTurn: VoiceDialogueTurn = {
        role: "user",
        text: cleanText,
        timestamp: nowStr,
      };

      setDialogueHistory((prev) => [...prev, userTurn]);
      setCurrentTranscript("");
      transcriptRef.current = "";

      try {
        // Format history for payload
        const historyPayload = dialogueHistory.slice(-8).map((t) => ({
          role: t.role,
          content: t.text,
        }));

        const res = await fetch("/api/v1/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: cleanText,
            mode: "listen",
            language_preference: activeLang,
            age_band: userSession?.ageBand || "18-24",
            history: historyPayload,
          }),
        });

        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }

        const data = await res.json();
        const aiReply = data.reply || "I am right here with you. Take a gentle, deep breath.";

        // Append assistant turn
        const assistantTurn: VoiceDialogueTurn = {
          role: "assistant",
          text: aiReply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setDialogueHistory((prev) => [...prev, assistantTurn]);

        setStatusMessage("Inearly is speaking...");
        setIsSpeaking(true);

        // Trigger 3D TalkingHead speech synthesis and mouth lip-sync
        avatarRef.current?.lookAtUser();
        avatarRef.current?.speakText(aiReply, "empathetic", activeLang);
      } catch (err: any) {
        console.error("Voice chat error:", err);
        setErrorMessage("Could not connect to AI companion. Please check your connection.");
        setStatusMessage("Tap to try speaking again.");
      } finally {
        setIsProcessing(false);
      }
    },
    [activeLang, dialogueHistory, isProcessing, userSession?.ageBand]
  );

  // Start or Stop Speech Recognition
  const toggleSpeechRecognition = useCallback(() => {
    // If currently listening, stop and process the captured text
    if (isListening) {
      isManuallyStoppedRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn("Error stopping recognition:", e);
        }
      }
      setIsListening(false);

      const captured = transcriptRef.current.trim();
      if (captured) {
        handleSendVoiceMessage(captured);
      } else {
        setStatusMessage("No speech was detected. Tap the mic to try again.");
      }
      return;
    }

    // Stop avatar if it's currently speaking
    if (isSpeaking) {
      avatarRef.current?.stopSpeaking();
      setIsSpeaking(false);
    }

    if (typeof window === "undefined") return;

    // Check cross-browser SpeechRecognition
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      setErrorMessage(
        "Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari."
      );
      return;
    }

    try {
      setErrorMessage(null);
      isManuallyStoppedRef.current = false;
      transcriptRef.current = "";
      setCurrentTranscript("");

      const recognition = new SpeechRec();
      // Adjust language code based on user's preference
      recognition.lang = activeLang === "Hindi" ? "hi-IN" : "en-IN";
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setStatusMessage("Listening to your voice... Speak naturally.");
        avatarRef.current?.lookAtUser();
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((result: any) => result[0].transcript)
          .join("");

        transcriptRef.current = transcript;
        setCurrentTranscript(transcript);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error !== "no-speech") {
          setErrorMessage(`Microphone error (${event.error}). Please check mic permissions.`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        const finalText = transcriptRef.current.trim();

        // If user finished speaking and we have text, send to LLM
        if (finalText && !isManuallyStoppedRef.current) {
          handleSendVoiceMessage(finalText);
        } else if (!finalText) {
          setStatusMessage("No speech was detected. Tap the mic to speak.");
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.error("Failed to start speech recognition:", e);
      setErrorMessage("Could not access microphone. Please check your browser settings.");
      setIsListening(false);
    }
  }, [activeLang, handleSendVoiceMessage, isListening, isSpeaking]);

  // Stop avatar speech manually
  const handleStopSpeaking = () => {
    avatarRef.current?.stopSpeaking();
    setIsSpeaking(false);
    setStatusMessage("Speech paused. Tap the mic to speak.");
  };

  // Replay the last assistant message
  const handleReplayLast = () => {
    const lastAssistantTurn = [...dialogueHistory].reverse().find((t) => t.role === "assistant");
    if (lastAssistantTurn) {
      setIsSpeaking(true);
      setStatusMessage("Replaying response...");
      avatarRef.current?.speakText(lastAssistantTurn.text, "empathetic", activeLang);
    }
  };

  // Select a guided reflection starter
  const handleSelectStarter = (starter: (typeof GUIDED_STARTERS)[0]) => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
    handleSendVoiceMessage(starter.prompt);
  };

  return (
    <div className="w-full flex-1 flex flex-col h-full min-h-0 bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl transition-all duration-300">
      
      {/* 1. HEADER BAR */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/60 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-teal-500/25">
                <Mic className="w-4 h-4" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                3D Interactive Voice Sanctuary
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Speak naturally with Inearly. Your voice is transcribed locally with real-time lip-sync and zero audio data stored.
            </p>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline flex items-center gap-1">
              <Globe className="w-3 h-3 text-teal-500" /> Language:
            </span>
            <div className="flex rounded-xl bg-slate-200/80 dark:bg-slate-800 p-0.5 border border-slate-300/60 dark:border-slate-700/60 text-xs">
              {(["Hinglish", "Hindi", "English"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setActiveLang(l)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeLang === l
                      ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN BODY: Split view with 3D Avatar & Live Voice Flow */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-between gap-4 custom-scrollbar">
        
        {/* 3D TalkingHead Avatar Viewport Container */}
        <div className="relative w-full max-w-xl h-[300px] sm:h-[350px] rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-950 shrink-0">
          <TalkingHeadAvatar
            ref={avatarRef}
            className="w-full h-full border-0"
            avatarUrl="/avatars/inearly-companion.glb"
            initialMood="calm"
            language={activeLang}
            elevenLabsVoiceId="21m00Tcm4TlvDq8ikWAM"
            onSpeechStart={() => setIsSpeaking(true)}
            onSpeechEnd={() => {
              setIsSpeaking(false);
              setStatusMessage("Tap the mic to reply or share more.");
            }}
          />

          {/* Avatar Live Status Badge Overlay */}
          <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md border border-slate-800/80 text-[11px] font-medium text-slate-200 flex items-center gap-2 pointer-events-none shadow-md">
            {isListening ? (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="text-rose-400 font-semibold">Listening to you...</span>
              </>
            ) : isProcessing ? (
              <>
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-spin" />
                <span className="text-teal-300 font-semibold">Thinking mindfully...</span>
              </>
            ) : isSpeaking ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300 font-semibold">Speaking &amp; Lip-syncing</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                <span>Ready • Attentive Listener</span>
              </>
            )}
          </div>

          {/* Quick Avatar Voice Stop / Replay Controls */}
          {isSpeaking && (
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <button
                onClick={handleStopSpeaking}
                className="px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-semibold backdrop-blur-md shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop Voice</span>
              </button>
            </div>
          )}
        </div>

        {/* Real-time Subtitles / Latest Transcript Bubble */}
        <div className="w-full max-w-xl space-y-2">
          {/* Live User Recognition Preview */}
          {currentTranscript && (
            <div className="p-3.5 rounded-2xl bg-teal-50/90 dark:bg-teal-950/40 border border-teal-500/30 text-xs text-teal-900 dark:text-teal-100 animate-fade-in shadow-sm">
              <div className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-bold mb-1 text-[10px] uppercase tracking-wider">
                <Mic className="w-3 h-3 animate-bounce" />
                <span>You are saying:</span>
              </div>
              <p className="italic font-sans">&ldquo;{currentTranscript}&rdquo;</p>
            </div>
          )}

          {/* Last AI Voice Reply Display */}
          {dialogueHistory.length > 0 && !currentTranscript && (
            <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-800 dark:text-slate-100 shadow-sm animate-fade-in">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400">
                  <Sparkles className="w-3 h-3" /> Inearly Companion:
                </span>
                <button
                  onClick={handleReplayLast}
                  className="flex items-center gap-1 hover:text-teal-500 cursor-pointer transition-colors"
                  title="Replay voice response"
                >
                  <Volume2 className="w-3 h-3" /> Replay Voice
                </button>
              </div>
              <p className="leading-relaxed font-sans text-sm">
                {dialogueHistory[dialogueHistory.length - 1].role === "assistant"
                  ? dialogueHistory[dialogueHistory.length - 1].text
                  : dialogueHistory[dialogueHistory.length - 2]?.text || ""}
              </p>
            </div>
          )}

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* 3. CENTRAL VOICE ACTION BAR */}
        <div className="flex flex-col items-center justify-center gap-3 w-full max-w-xl">
          {/* Audio Wave Sound Bars when Listening */}
          {isListening && (
            <div className="flex items-center gap-1.5 h-6">
              {[40, 70, 95, 60, 85, 100, 75, 50, 90, 65].map((height, i) => (
                <div
                  key={i}
                  className="w-1 bg-gradient-to-t from-teal-500 to-rose-500 rounded-full animate-pulse"
                  style={{
                    height: `${height}%`,
                    animationDelay: `${i * 0.08}s`,
                    animationDuration: "0.6s",
                  }}
                />
              ))}
            </div>
          )}

          {/* Master Tap to Speak Button */}
          <button
            onClick={toggleSpeechRecognition}
            disabled={isProcessing}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-full font-bold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xl ${
              isProcessing
                ? "bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                : isListening
                ? "bg-rose-500 hover:bg-rose-600 text-white animate-pulse shadow-rose-500/40 scale-105"
                : "bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white shadow-teal-500/30 hover:scale-105 active:scale-95"
            }`}
          >
            <Mic className={`w-5 h-5 ${isListening ? "animate-bounce" : ""}`} />
            <span>
              {isProcessing
                ? "Inearly is thinking..."
                : isListening
                ? "Listening... (Tap to Send)"
                : "Tap to Speak Freely"}
            </span>
          </button>

          {/* Status Micro-copy */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Lock className="w-3 h-3 text-teal-500" />
            <span>{statusMessage}</span>
          </div>
        </div>

        {/* 4. GUIDED VOICE PROMPT STARTERS */}
        <div className="w-full max-w-xl space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">
            Or Tap a Guided Voice Starter:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {GUIDED_STARTERS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectStarter(s)}
                disabled={isProcessing}
                className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/50 hover:border-teal-500/60 dark:hover:border-teal-500/60 text-left transition-all cursor-pointer shadow-2xs group hover:shadow-sm"
              >
                <div className="font-semibold text-xs text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  {s.title}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                  {s.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
