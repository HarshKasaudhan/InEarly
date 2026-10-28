"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { 
  Send, 
  Sparkles, 
  Headphones, 
  Compass, 
  ShieldCheck, 
  ShieldAlert,
  PhoneCall, 
  Info, 
  Check, 
  X, 
  RefreshCw,
  Lock,
  ArrowUpRight,
  Mic,
  MicOff,
  User,
  Volume2,
  MessageSquare,
  CheckCircle2,
  Plus,
  History,
  Camera,
  Smile
} from "lucide-react";
import { LanguagePref, AgeBand } from "./OnboardingFlow";
import { SafetyCrisisModal, HelplineDetail } from "./SafetyCrisisModal";
import { WellnessPlanCard, WellnessGoal } from "./WellnessPlanCard";
import { TalkingHeadAvatar, TalkingHeadAvatarHandle } from "./TalkingHeadAvatar";
import { MemoryConsentModal } from "./MemoryConsentModal";
import { FaceEmotionScannerModal, FaceAnalysisResult } from "./FaceEmotionScannerModal";
import { useWebcamStream } from "@/hooks/useWebcamStream";
import { LiveEmotionCompanionWidget } from "./LiveEmotionCompanionWidget";
import { chatStorage } from "@/lib/chatStorage";

export interface ConcernTag {
  category: string;
  display_label: string;
  tentative_flag: boolean;
  confidence: number;
  user_confirmed: boolean;
}

interface Message {
  id: string;
  role: "assistant" | "user";
  text: string;
  timestamp: string;
  safetyAlert?: boolean;
  resources?: string[];
  tags?: ConcernTag[];
  helplines?: HelplineDetail[];
}

interface WellnessChatSpaceProps {
  userSession: {
    userId?: string;
    pseudonym: string;
    language: LanguagePref;
    ageBand: AgeBand;
    saveChats: boolean;
    consentId?: string;
  };
  onResetSession: () => void;
  activeConversationId?: string;
  onSelectConversation?: (id: string) => void;
  onConversationsUpdated?: () => void;
}

const DEFAULT_HELPLINES: HelplineDetail[] = [
  {
    name: "Tele-MANAS (Govt. of India)",
    number: "14416",
    toll_free_alt: "1800-891-4416",
    description: "Ministry of Health & Family Welfare 24/7 Comprehensive Mental Health Care (Available in 20+ Indian languages)",
    type: "crisis_mental_health",
    availability: "24/7 Free & Confidential",
  },
  {
    name: "National Emergency Number",
    number: "112",
    toll_free_alt: "112",
    description: "All-in-one Emergency Helpline across India for Police, Medical, & Immediate Physical Safety",
    type: "immediate_emergency",
    availability: "24/7 Immediate Dispatch",
  },
  {
    name: "KIRAN Helpline",
    number: "1800-599-0019",
    toll_free_alt: "1800-599-0019",
    description: "Department of Empowerment of Persons with Disabilities 24/7 Mental Health Helpline",
    type: "crisis_mental_health",
    availability: "24/7 Free & Confidential",
  },
  {
    name: "Vandrevala Foundation",
    number: "+91 9999 666 555",
    toll_free_alt: "+91 9999 666 555",
    description: "24/7 Free Crisis Counseling and Emotional Support",
    type: "counseling_helpline",
    availability: "24/7 Free & Confidential",
  },
];

const DEFAULT_PLAN_RECOMMENDATIONS: WellnessGoal[] = [
  {
    id: "box_breathing_pranayama",
    title: "4-4-4 Box Breathing (Pranayama Reset)",
    duration_minutes: 2,
    evidence_rationale: "Activates parasympathetic vagal tone to halt acute cortisol spikes and panic.",
    category: "calm_grounding",
    instructions: [
      "Sit relaxed, inhale slowly through your nose for 4 counts.",
      "Hold your breath gently without straining for 4 counts.",
      "Exhale smoothly through your mouth for 4 counts, then pause for 4 counts. Repeat 4 cycles.",
    ],
    status: "skipped",
  },
  {
    id: "one_micro_task_box",
    title: "The 10-Minute 'One Micro-Task' Box",
    duration_minutes: 10,
    evidence_rationale: "Isolating one atomic, achievable task breaks psychological inertia and executive paralysis.",
    category: "academic_stress",
    instructions: [
      "Pick exactly ONE 10-minute task (e.g. read 2 pages or draft 3 bullet points).",
      "Set a gentle 10-minute timer and put away all notifications.",
      "When the timer finishes, celebrate the small win and take a 3-minute stretch.",
    ],
    status: "skipped",
  },
];

const QUICK_EXPLORE_CHIPS = [
  { label: "Exam & Syllabus Stress", prompt: "Padhai aur upcoming exams ko lekar bohot anxiety aur pressure feel ho raha hai." },
  { label: "Workplace Burnout", prompt: "Work deadlines aur continuous screen exhaustion se bohot burned out lag raha hai." },
  { label: "Late Night Overthinking", prompt: "Raat ko neend nahi aati, negative spirals aur continuous thoughts chalte rehte hain." },
  { label: "Career & Future Fear", prompt: "Future stability aur career choices ko lekar deep uncertainty feel ho rahi hai." },
  { label: "Social Anxiety & Loneliness", prompt: "Logon se baat karne mein energy drain hoti hai, and akelaapan mehsoos hota hai." },
];

export const WellnessChatSpace: React.FC<WellnessChatSpaceProps> = ({
  userSession,
  onResetSession,
  activeConversationId,
  onSelectConversation,
  onConversationsUpdated,
}) => {
  const [mode, setMode] = useState<"listen" | "plan">("listen");
  const [currentLang, setCurrentLang] = useState<LanguagePref>(userSession.language);
  const [conversationId, setConversationId] = useState<string>(activeConversationId || "");
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeTags, setActiveTags] = useState<ConcernTag[]>([]);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [isMemoryConsent, setIsMemoryConsent] = useState<boolean>(() =>
    chatStorage.hasMemoryConsent(userSession.userId || "anon-user-default")
  );
  const [helplineDetails, setHelplineDetails] = useState<HelplineDetail[]>(DEFAULT_HELPLINES);
  const [activeCrisisAlert, setActiveCrisisAlert] = useState<{ alert: boolean; resources: string[] }>({
    alert: false,
    resources: [],
  });
  const [planRecommendations, setPlanRecommendations] = useState<WellnessGoal[]>([]);
  const [companionMode, setCompanionMode] = useState<"simple" | "3d">("3d");
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [isFaceScannerOpen, setIsFaceScannerOpen] = useState(false);
  const [activeFaceEmotion, setActiveFaceEmotion] = useState<FaceAnalysisResult | null>(null);
  const [isPersistentScanning, setIsPersistentScanning] = useState(false);
  const [isScanningPaused, setIsScanningPaused] = useState(false);
  const [isAnalyzingFrame, setIsAnalyzingFrame] = useState(false);
  const isAnalyzingRef = useRef(false);

  const {
    stream: webcamStream,
    isActive: isWebcamActive,
    startStream: startWebcam,
    stopStream: stopWebcam,
    setVideoRef: setWebcamVideoRef,
    captureFrameBase64,
  } = useWebcamStream({ idealWidth: 640, idealHeight: 480, facingMode: "user" });

  const avatarRef = useRef<TalkingHeadAvatarHandle>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Persistent Background Analysis Loop (Executes periodically every 3.5s while active)
  useEffect(() => {
    if (!isPersistentScanning || !isWebcamActive || isScanningPaused) {
      return;
    }

    const SCAN_INTERVAL_MS = 3500;
    const intervalId = setInterval(async () => {
      if (isAnalyzingRef.current) return;
      const frameBase64 = captureFrameBase64(0.85);
      if (!frameBase64) return;

      isAnalyzingRef.current = true;
      setIsAnalyzingFrame(true);

      try {
        const res = await fetch("/api/v1/face/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_base64: frameBase64,
            user_consent: true,
            session_id: conversationId,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const isFaceDetected = Boolean(data.face_detected);
          const livenessRaw = data.liveness || {};
          const emotionRaw = data.emotion || null;

          const isReal = typeof data.is_real === "boolean"
            ? data.is_real
            : (livenessRaw.status === "passed" && !livenessRaw.spoof_detected);

          const livenessScore = typeof data.liveness_score === "number"
            ? Math.round(data.liveness_score * 100)
            : Math.round((livenessRaw.live_confidence ?? livenessRaw.score ?? 0) * 100);

          const emotionsMap = data.emotions || emotionRaw?.all_emotions || emotionRaw?.distribution || {};
          const dominantEmotion = data.dominant_emotion || emotionRaw?.dominant_emotion || emotionRaw?.dominant || "neutral";

          const normalizedResult: FaceAnalysisResult = {
            status: !isFaceDetected
              ? "no_face_detected"
              : (!isReal && (livenessRaw.spoof_detected || livenessRaw.status === "failed"))
              ? "spoof_detected"
              : (livenessRaw.status === "uncertain" && !isReal)
              ? "uncertain"
              : "success",
            face_detected: isFaceDetected,
            faces_count: data.face_count || (isFaceDetected ? 1 : 0),
            bounding_box: data.bbox || null,
            is_real: isReal,
            liveness_score: livenessScore,
            emotions: emotionsMap,
            dominant_emotion: dominantEmotion,
            liveness: {
              status: isReal
                ? "passed"
                : livenessRaw.status === "failed" || livenessRaw.spoof_detected
                ? "failed"
                : "uncertain",
              score: livenessScore,
              attack_type:
                livenessRaw.attack_type && livenessRaw.attack_type !== "none"
                  ? livenessRaw.attack_type
                  : null,
              model: "garciafido/minifasnet-v2-anti-spoofing-onnx",
            },
            emotion: emotionRaw
              ? {
                  dominant: dominantEmotion,
                  confidence: Math.round((emotionRaw.confidence || 0) * 100),
                  distribution: emotionsMap,
                  model: "SEARO1/FER_model (Swin Transformer)",
                }
              : null,
            affective_wellness: emotionRaw
              ? {
                  affect_category: emotionRaw.affective_state || "steady_calm",
                  stress_vulnerability:
                    (emotionRaw.stress_vulnerability_index || 0) > 60
                      ? "high"
                      : (emotionRaw.stress_vulnerability_index || 0) > 30
                      ? "moderate"
                      : "low",
                  suggested_companion_tone: emotionRaw.avatar_mood || "calm",
                  empathy_note:
                    emotionRaw.empathy_guidance ||
                    data.empathy_guidance ||
                    "Live emotional presence detected.",
                }
              : null,
            clinical_disclaimer:
              data.security_notice ||
              "Non-biometric wellness estimation. Not a psychiatric diagnosis or legal identity proof.",
          };

          setActiveFaceEmotion(normalizedResult);

          // Synchronize 3D avatar facial expression in real-time
          if (normalizedResult.face_detected && (normalizedResult.is_real || normalizedResult.liveness.status === "passed")) {
            const targetMood =
              normalizedResult.affective_wellness?.suggested_companion_tone ||
              normalizedResult.emotion?.dominant ||
              "neutral";
            avatarRef.current?.setMood(targetMood);
          }
        }
      } catch (err) {
        console.warn("[WellnessChatSpace] Periodic face scan error:", err);
      } finally {
        isAnalyzingRef.current = false;
        setIsAnalyzingFrame(false);
      }
    }, SCAN_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isPersistentScanning, isWebcamActive, isScanningPaused, captureFrameBase64, conversationId]);

  const handleTogglePersistentScanning = useCallback(async () => {
    if (isPersistentScanning) {
      setIsPersistentScanning(false);
      stopWebcam();
    } else {
      const stream = await startWebcam();
      if (stream) {
        setIsPersistentScanning(true);
        setIsScanningPaused(false);
      }
    }
  }, [isPersistentScanning, startWebcam, stopWebcam]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Toggle Hands-free speech recognition
  const toggleVoiceInput = useCallback(() => {
    if (isListeningVoice) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListeningVoice(false);
      return;
    }

    if (typeof window === "undefined") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      alert("Voice input is supported in Google Chrome, Microsoft Edge, and Safari.");
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = currentLang === "Hindi" ? "hi-IN" : "en-IN";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListeningVoice(true);
        avatarRef.current?.lookAtUser();
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((result: any) => result[0].transcript)
          .join("");
        setInputText(transcript);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListeningVoice(false);
      };

      recognition.onend = () => {
        setIsListeningVoice(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn("Could not start speech recognition:", e);
      setIsListeningVoice(false);
    }
  }, [isListeningVoice, currentLang]);

  // Fetch recommendations when in Plan Mode
  useEffect(() => {
    if (mode === "plan") {
      const topCategory = activeTags[0]?.category || "";
      fetch(`/api/v1/plans/recommendations?category=${encodeURIComponent(topCategory)}&limit=2`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setPlanRecommendations(data);
        })
        .catch((e) => console.error("Error loading recommendations:", e));
    }
  }, [mode, activeTags]);

  const [messages, setMessages] = useState<Message[]>([]);

  const getGreeting = useCallback(
    (lang: LanguagePref) => {
      return lang === "Hindi"
        ? `नमस्ते ${userSession.pseudonym}! मैं Inearly हूँ—आपका शांत, गोपनीय और गैर-निर्णायक (non-judgmental) साथी। मन में जो भी बात हो, बिना किसी झिझक के साझा कर सकते हैं।`
        : lang === "Hinglish"
        ? `Namaste ${userSession.pseudonym}! Main Inearly hoon—aapka confidential companion. Aaj kaisa feel kar rahe hain? Padhai, work ya mann mein jo bhi baat ho, bina kisi filter ke share karein.`
        : `Hello ${userSession.pseudonym}, welcome to your safe haven. I'm Inearly. Take all the time and space you need. How are you feeling right now?`;
    },
    [userSession.pseudonym]
  );

  // Load conversation or generate initial greeting
  useEffect(() => {
    const uid = userSession.userId || "anon-user-default";
    const targetId = activeConversationId || conversationId || crypto.randomUUID();
    setConversationId(targetId);

    chatStorage.getMessages(targetId, uid).then((stored) => {
      if (stored && stored.length > 0) {
        setMessages(stored);
      } else {
        setMessages([
          {
            id: `m-init-${targetId}`,
            role: "assistant",
            text: getGreeting(currentLang),
            timestamp: "Just now",
          },
        ]);
      }
    });
  }, [activeConversationId, userSession.userId, getGreeting, currentLang]);

  const handleStartNewSession = () => {
    const newId = crypto.randomUUID();
    setConversationId(newId);
    onSelectConversation?.(newId);
    setActiveTags([]);
    setMessages([
      {
        id: `m-init-${Date.now()}`,
        role: "assistant",
        text: getGreeting(currentLang),
        timestamp: "Just now",
      },
    ]);
    onConversationsUpdated?.();
  };

  const handleToggleMemoryConsent = (enabled: boolean) => {
    const uid = userSession.userId || "anon-user-default";
    chatStorage.setMemoryConsent(uid, enabled);
    setIsMemoryConsent(enabled);
  };

  const handlePurgeAllHistory = async () => {
    const uid = userSession.userId || "anon-user-default";
    await chatStorage.purgeAllHistory(uid);
    handleStartNewSession();
    onConversationsUpdated?.();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isTyping) return;

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    const uid = userSession.userId || "anon-user-default";
    chatStorage.saveMessage(conversationId, uid, userMessage, mode);
    onConversationsUpdated?.();

    // Pass up to 12 turns for rich conversational context recall
    const historyPayload = messages.slice(-12).map((m) => ({
      role: m.role,
      content: m.text,
    }));

    // Construct live multimodal affective context for active Gemini/Groq prompt
    let emotionalContextStr: string | undefined = undefined;
    if (activeFaceEmotion && activeFaceEmotion.face_detected && activeFaceEmotion.emotion) {
      const dom = activeFaceEmotion.emotion.dominant;
      const conf = activeFaceEmotion.emotion.confidence;
      const cat = activeFaceEmotion.affective_wellness?.affect_category || "steady_calm";
      const note = activeFaceEmotion.affective_wellness?.empathy_note || "";
      let clinicalPriority = "";
      if (dom === "Fear" || cat.includes("stress") || cat.includes("anxiety")) {
        clinicalPriority = "CLINICAL PRIORITY: The user's face exhibits physiological signs of anxiety, tension, or fear. Ground them first with warm presence, emotional safety, and somatic reassurance.";
      } else if (dom === "Sad") {
        clinicalPriority = "CLINICAL PRIORITY: The user's face reflects quiet sadness or fatigue. Validate their emotional state with compassionate holding space.";
      }
      emotionalContextStr = `Dominant emotion: ${dom} (${conf}%). Category: ${cat}. Guidance: ${note}. ${clinicalPriority} Attune naturally without reciting technical metrics.`;
    }

    try {
      const res = await fetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          user_id: userSession.userId,
          message: textToSend.trim(),
          history: historyPayload,
          mode,
          language_preference: currentLang,
          age_band: userSession.ageBand,
          emotional_context: emotionalContextStr,
        }),
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const data = await res.json();

      const assistantMessage: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        safetyAlert: data.safety_alert,
        resources: data.resources,
        tags: data.tentative_tags,
        helplines: data.helpline_details,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      chatStorage.saveMessage(conversationId, uid, assistantMessage, mode);
      onConversationsUpdated?.();

      // Hook up TalkingHead Avatar: lipsync and animate in sync with AI message
      if (data.reply && companionMode === "3d") {
        avatarRef.current?.speakText(
          data.reply,
          data.safety_alert ? "empathetic" : mode === "plan" ? "happy" : "calm",
          currentLang
        );
      }

      if (data.safety_alert) {
        setActiveCrisisAlert({ alert: true, resources: data.resources || [] });
        if (data.helpline_details && data.helpline_details.length > 0) {
          setHelplineDetails(data.helpline_details);
        }
        setShowSafetyModal(true);
      }

      if (data.tentative_tags && Array.isArray(data.tentative_tags)) {
        setActiveTags((prevTags) => {
          const map = new Map<string, ConcernTag>();
          prevTags.forEach((t) => map.set(t.category, t));
          data.tentative_tags.forEach((t: ConcernTag) => {
            if (!map.has(t.category)) {
              map.set(t.category, t);
            }
          });
          return Array.from(map.values());
        });
      }
    } catch (err) {
      console.error("Chat communication error:", err);
      const fallbackReply =
        mode === "listen"
          ? "Main aapki baat dhyan se sun raha hoon. Overwhelm hona bilkul natural hai—main bina kisi judgment ke aapke saath hoon."
          : "Chaliye isse simple aur manageable banate hain. Pehle ek 2-minute deep breathing check-in try karein?";

      const fallbackMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: fallbackReply,
        timestamp: "Just now",
      };

      setMessages((prev) => [...prev, fallbackMsg]);
      chatStorage.saveMessage(conversationId, uid, fallbackMsg, mode);
      onConversationsUpdated?.();

      // Animate avatar on fallback response in 3D Companion mode
      if (companionMode === "3d") {
        avatarRef.current?.speakText(fallbackReply, "calm", currentLang);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleConfirmTag = (category: string) => {
    setActiveTags((prev) =>
      prev.map((t) => (t.category === category ? { ...t, user_confirmed: true, tentative_flag: false } : t))
    );
  };

  const handleDismissTag = (category: string) => {
    setActiveTags((prev) => prev.filter((t) => t.category !== category));
  };

  const handleApplyFaceEmotion = useCallback((analysis: FaceAnalysisResult) => {
    setActiveFaceEmotion(analysis);

    // 1. Synchronize 3D avatar facial expression immediately
    const targetMood =
      analysis.affective_wellness?.suggested_companion_tone ||
      analysis.emotion?.dominant ||
      "neutral";
    avatarRef.current?.setMood(targetMood);

    // 2. Add empathetic affective guidance to the active chat conversation
    if (analysis.affective_wellness?.empathy_note) {
      const dominantStr = analysis.emotion?.dominant || "steady";
      const confidenceStr = analysis.emotion?.confidence ? ` (${analysis.emotion.confidence}%)` : "";
      const feedbackMessage: Message = {
        id: `affect-${Date.now()}`,
        role: "assistant",
        text: `🌸 **Affective Synchrony Aligned**: Face scan perceived a **${dominantStr}${confidenceStr}** presence. ${analysis.affective_wellness.empathy_note}\n\nI've synchronized my 3D companion tone to **${targetMood}** to support you warmly.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        tags: analysis.emotion?.dominant
          ? [
              {
                category: "affective_emotion",
                display_label: `Affect: ${analysis.emotion.dominant}`,
                tentative_flag: false,
                confidence: (analysis.emotion.confidence || 0) / 100,
                user_confirmed: true,
              },
            ]
          : undefined,
      };

      setMessages((prev) => [...prev, feedbackMessage]);
      const uid = userSession.userId || "anon-user-default";
      if (conversationId) {
        chatStorage.saveMessage(conversationId, uid, feedbackMessage, mode);
        onConversationsUpdated?.();
      }
    }
  }, [userSession.userId, conversationId, mode, onConversationsUpdated]);

  return (
    <>
      <SafetyCrisisModal
        isOpen={showSafetyModal}
        onClose={() => setShowSafetyModal(false)}
        helplines={helplineDetails}
        language={currentLang}
      />

      <MemoryConsentModal
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        userId={userSession.userId || "anon-user-default"}
        pseudonym={userSession.pseudonym}
        isMemoryEnabled={isMemoryConsent}
        onToggleMemory={handleToggleMemoryConsent}
        onPurgeAll={handlePurgeAllHistory}
      />

      <FaceEmotionScannerModal
        isOpen={isFaceScannerOpen}
        onClose={() => setIsFaceScannerOpen(false)}
        onApplyEmotion={handleApplyFaceEmotion}
        currentAppliedEmotion={activeFaceEmotion?.emotion?.dominant || null}
        sharedStream={webcamStream}
        initialAnalysis={activeFaceEmotion}
      />

      <div className="w-full flex-1 flex flex-col h-full min-h-0 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 shadow-2xl shadow-slate-200/40 dark:shadow-black/50 overflow-hidden backdrop-blur-xl transition-all duration-300 ease-in-out">
        
        {/* 1. MANSITRA-INSPIRED HEADER: Anonymous status, Gemini 2.5 Flash, Mode pill */}
        <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* User Session & Model Indicator */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-0.5 shadow-md shadow-teal-500/15 shrink-0">
                <Image
                  src="/logo.png"
                  alt="Inearly Logo"
                  width={40}
                  height={40}
                  priority
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
                  {userSession.pseudonym}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-teal-700 dark:text-teal-400 font-medium border border-teal-500/20">
                  {userSession.ageBand}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/20 hidden sm:inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Anonymous
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Gemini 2.5 Flash
                </span>
                <span>•</span>
                <span className="text-[11px] text-slate-500">
                  {userSession.saveChats ? "Encrypted on Device" : "Ephemeral (Zero-Trace)"}
                </span>
              </div>
            </div>
          </div>

          {/* Controls: Mode Selection Toggle (Simple Chat vs 3D) + Language Switcher + Helplines */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Selector: Simple Chat vs 3D Companion */}
            <div className="flex rounded-2xl bg-slate-200/80 dark:bg-slate-950 p-1 border border-slate-300/70 dark:border-slate-800 text-xs shadow-inner">
              <button
                type="button"
                onClick={() => setCompanionMode("simple")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  companionMode === "simple"
                    ? "bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs border border-slate-200/80 dark:border-slate-700/80"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Distraction-free, zen text conversation"
              >
                <MessageSquare className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span className="hidden sm:inline">Simple Chat</span>
                <span className="sm:hidden">Chat</span>
              </button>
              <button
                type="button"
                onClick={() => setCompanionMode("3d")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  companionMode === "3d"
                    ? "bg-gradient-to-r from-teal-500 to-indigo-600 text-white shadow-md shadow-teal-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Interactive 3D Avatar with speech and lip-sync"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">3D Companion</span>
                <span className="sm:hidden">3D</span>
              </button>
            </div>

            {/* Language Switcher */}
            <div className="flex rounded-xl bg-slate-200/60 dark:bg-slate-800/80 p-0.5 border border-slate-300/40 dark:border-slate-700/50 text-xs">
              {(["Hinglish", "Hindi", "English"] as LanguagePref[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setCurrentLang(l)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                    currentLang === l
                      ? "bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Persistent Face Emotion Sensing Toggle Button */}
            <button
              type="button"
              onClick={handleTogglePersistentScanning}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs border ${
                isPersistentScanning && isWebcamActive
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-200/80 dark:hover:bg-slate-700 border-slate-300/80 dark:border-slate-700"
              }`}
              title={
                isPersistentScanning && isWebcamActive
                  ? "Live Face Sensing Active (Tap to pause/stop)"
                  : "Start Persistent Webcam Face Emotion & Liveness Sensing"
              }
            >
              <Camera className="w-3.5 h-3.5 text-teal-500" />
              <span className="hidden sm:inline">
                {isPersistentScanning && isWebcamActive ? "Sensing Active" : "Face Sensing"}
              </span>
              {isPersistentScanning && isWebcamActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>

            {/* Active Affect Badge */}
            {activeFaceEmotion?.emotion && (
              <button
                type="button"
                onClick={() => setIsFaceScannerOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 transition-all cursor-pointer animate-fade-in shadow-xs"
                title={`Live Emotion Detected: ${activeFaceEmotion.emotion.dominant} (${activeFaceEmotion.emotion.confidence}%). Click to inspect FER breakdown.`}
              >
                <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="capitalize">{activeFaceEmotion.emotion.dominant}</span>
                <span className="hidden sm:inline font-mono text-[9px] opacity-80">
                  ({activeFaceEmotion.emotion.confidence}%)
                </span>
              </button>
            )}

            {/* Helplines Button */}
            <button
              onClick={() => setShowSafetyModal(true)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-300 transition-colors cursor-pointer flex items-center gap-1 font-medium"
              title="Verified National Helplines (Tele-MANAS & 112)"
            >
              <PhoneCall className="w-3 h-3" />
              <span className="hidden sm:inline">Helplines</span>
            </button>
          </div>
        </div>

        {/* 2. CONVERSATION INTENT BAR (Just Listen vs Action Plan) */}
        <div className="px-4 sm:px-5 py-2.5 bg-slate-100/70 dark:bg-slate-950/60 border-b border-slate-200/70 dark:border-slate-800/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:inline">
              Chat Intent:
            </span>
            <div className="flex rounded-xl bg-white/90 dark:bg-slate-900/90 p-0.5 border border-slate-300/70 dark:border-slate-800 text-xs shadow-xs">
              <button
                type="button"
                onClick={() => setMode("listen")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mode === "listen"
                    ? "bg-teal-500 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Venting & compassionate listening without unsolicited advice"
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>Just Listen</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("plan")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mode === "plan"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Collaborative, small, evidence-informed coping steps"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Action Plan</span>
              </button>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:inline ml-1 font-sans">
              {mode === "listen"
                ? "• Reflective listening, zero unsolicited advice"
                : "• Actionable evidence-informed coping steps"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* New Conversation Button */}
            <button
              onClick={handleStartNewSession}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/20 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              title="Start a fresh conversation session"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Session</span>
            </button>

            {/* Context Memory & DPDP Consent Status Pill */}
            <button
              onClick={() => setShowConsentModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:border-teal-500/40 text-xs text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shadow-2xs"
              title="DPDP Act 2023 Context Memory Retention & Purge Settings"
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${isMemoryConsent ? "text-teal-500" : "text-slate-400"}`} />
              <span className="hidden sm:inline">Memory:</span>
              <span className={`font-semibold ${isMemoryConsent ? "text-teal-600 dark:text-teal-400" : "text-slate-400"}`}>
                {isMemoryConsent ? "On (DPDP)" : "Paused"}
              </span>
            </button>
          </div>
        </div>

        {/* 3. TENTATIVE CONCERN TAGS PANEL */}
        {activeTags.length > 0 && (
          <div className="px-5 py-2 bg-slate-50/90 dark:bg-slate-900/70 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">
              Focus Areas:
            </span>
            {activeTags.map((tag) => (
              <div
                key={tag.category}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  tag.user_confirmed
                    ? "bg-indigo-50 dark:bg-indigo-500/20 border-indigo-300 dark:border-indigo-400/60 text-indigo-700 dark:text-indigo-300"
                    : "bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300"
                }`}
              >
                <span>{tag.display_label}</span>
                {tag.tentative_flag && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-200/60 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 uppercase font-mono">
                    Tentative
                  </span>
                )}
                {tag.user_confirmed ? (
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold ml-1 text-[11px]">✓ Confirmed</span>
                ) : (
                  <div className="flex items-center gap-1 ml-1">
                    <button
                      onClick={() => handleConfirmTag(tag.category)}
                      className="hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-500 dark:text-slate-400 text-[11px] px-1 rounded transition-colors"
                      title="Confirm this matches how you feel"
                    >
                      ✓
                    </button>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <button
                      onClick={() => handleDismissTag(tag.category)}
                      className="hover:text-rose-600 dark:hover:text-rose-400 text-slate-500 dark:text-slate-400 text-[11px] px-1 rounded transition-colors"
                      title="Dismiss"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 3.5 WELLNESS RECOMMENDATIONS DRAWER IN PLAN MODE */}
        {mode === "plan" && (
          <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-50/90 via-purple-50/50 to-indigo-50/90 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-indigo-950/40 border-b border-indigo-200/80 dark:border-indigo-500/30 space-y-3 animate-fade-in shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    Actionable Wellness Steps Grounded in Science
                  </span>
                  <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/70">
                    Small coping actions tailored to your headspace. Opt-in or skip at your own pace.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {planRecommendations.length > 0 ? `${planRecommendations.length} Coping Steps Available` : "Library Active"}
                </span>
              </div>
            </div>

            {/* Recommendations Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {(planRecommendations.length > 0 ? planRecommendations : DEFAULT_PLAN_RECOMMENDATIONS).map((rec) => (
                <WellnessPlanCard
                  key={rec.id}
                  recommendation={rec}
                  userId={userSession.userId}
                />
              ))}
            </div>

            {/* Quick Planning Prompts */}
            <div className="flex items-center gap-2 pt-1 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" /> Quick Plan:
              </span>
              <button
                onClick={() => handleSend("Can you help me break down what is overwhelming me into 2 small, realistic steps?")}
                className="text-[11px] whitespace-nowrap px-3 py-1 rounded-full bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-slate-800 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 transition-colors shadow-2xs"
              >
                🎯 Break stress into 2 small steps
              </button>
              <button
                onClick={() => handleSend("Suggest a gentle 5-minute wind down routine for right now.")}
                className="text-[11px] whitespace-nowrap px-3 py-1 rounded-full bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-slate-800 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 transition-colors shadow-2xs"
              >
                🌿 5-minute wind down routine
              </button>
            </div>
          </div>
        )}

        {/* 4. PINNED CRISIS SAFETY ALERT */}
        {activeCrisisAlert.alert && (
          <div className="px-5 py-3 bg-rose-50 dark:bg-rose-950/40 border-b-2 border-rose-500/50 space-y-2 shrink-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <span className="text-xs font-bold text-rose-800 dark:text-rose-200">
                  Immediate 24/7 Crisis Support Resources (Free &amp; Confidential)
                </span>
              </div>
              <button
                onClick={() => setShowSafetyModal(true)}
                className="text-xs px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors cursor-pointer"
              >
                View Full Crisis Guide →
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {helplineDetails.slice(0, 4).map((h, i) => (
                <a
                  key={i}
                  href={`tel:${h.number.replace(/[^0-9+]/g, "")}`}
                  className="p-2 rounded-xl bg-white dark:bg-slate-950/80 border border-rose-300 dark:border-rose-500/30 hover:border-rose-500 transition-all flex flex-col items-center justify-center text-center cursor-pointer shadow-sm"
                >
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 truncate w-full">
                    {h.name}
                  </span>
                  <span className="text-xs font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
                    📞 {h.number}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* MAIN BODY: Split view with Chat Stream on left and 3D TalkingHead Avatar on right */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 min-w-0 overflow-hidden transition-all duration-300 ease-in-out">
          {/* Left Column: Chat Conversation Stream */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0 w-full transition-all duration-300 ease-in-out">
            {/* 5. MESSAGES STREAM */}
            <div className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 w-full ${companionMode === "simple" ? "max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto" : ""}`}>
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"} animate-fade-in`}
                >
                  <div className="flex items-end gap-2 max-w-[85%]">
                    {m.role === "assistant" && (
                      <div className="w-7 h-7 rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-0.5 shrink-0 mb-1 shadow-xs">
                        <Image
                          src="/logo.png"
                          alt="Inearly Logo"
                          width={28}
                          height={28}
                          className="w-full h-full object-contain rounded-lg"
                        />
                      </div>
                    )}

                    <div
                      className={`rounded-3xl p-4 text-sm leading-relaxed transition-all ${
                        m.safetyAlert
                          ? "bg-rose-50 dark:bg-rose-950/60 text-rose-950 dark:text-rose-100 border-2 border-rose-400 dark:border-rose-500/60 rounded-bl-sm shadow-lg"
                          : m.role === "user"
                          ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-br-sm shadow-md shadow-teal-500/20 font-sans"
                          : "bg-slate-100/90 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 rounded-bl-sm border border-slate-200/70 dark:border-slate-700/60 shadow-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.text}</p>

                      {/* Inline Safety Helpline chips */}
                      {m.safetyAlert && m.resources && m.resources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-rose-300 dark:border-rose-500/30 space-y-2">
                          <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 block uppercase tracking-wider">
                            Immediate Free Helplines:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href="tel:14416"
                              className="text-xs font-mono px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors cursor-pointer"
                            >
                              📞 Tele-MANAS: 14416
                            </a>
                            <a
                              href="tel:112"
                              className="text-xs font-mono px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
                            >
                              📞 Police/Medical: 112
                            </a>
                            <a
                              href="tel:18005990019"
                              className="text-xs font-mono px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
                            >
                              📞 KIRAN: 1800-599-0019
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-1 px-9 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    <span>{m.timestamp}</span>
                    {m.role === "assistant" && (
                      <span>• {m.safetyAlert ? "Safety Guard" : "Inearly Care"}</span>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-xs italic pl-9 animate-fade-in">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                  <span>Inearly is thinking mindfully...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 6. QUICK EXPLORE CHIPS (Above Input) */}
            <div className="px-4 sm:px-6 py-2.5 border-t border-slate-200/80 dark:border-slate-800/60 bg-slate-50/60 dark:bg-slate-950/40 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 w-full">
              <div className={`flex items-center gap-2 w-full ${companionMode === "simple" ? "max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto" : ""}`}>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-teal-500" /> Explore:
                </span>
                {QUICK_EXPLORE_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(chip.prompt)}
                    className="text-[11px] whitespace-nowrap px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800/80 hover:bg-teal-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-teal-700 dark:hover:text-white border border-slate-200 dark:border-slate-700/70 transition-all cursor-pointer shadow-xs hover:border-teal-400 dark:hover:border-teal-500"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 7. SLEEK INPUT AREA WITH HANDS-FREE VOICE INPUT */}
            <div className="p-3.5 sm:p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md shrink-0 w-full">
              <div className={`w-full ${companionMode === "simple" ? "max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto" : ""}`}>
                <div className="flex items-center gap-2 bg-slate-100/90 dark:bg-slate-900 border border-slate-300/80 dark:border-slate-700/80 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 rounded-full px-3 py-1.5 transition-all shadow-inner">
                  {/* Voice Interaction Mic Button */}
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                      isListeningVoice
                        ? "bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/40"
                        : "bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-600 hover:bg-slate-300/80 dark:hover:bg-slate-700"
                    }`}
                    title={isListeningVoice ? "Listening... (Tap to stop)" : "Hands-free Voice Input (Tap to speak)"}
                  >
                    <Mic className={`w-4 h-4 ${isListeningVoice ? "animate-bounce" : ""}`} />
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder={
                      isListeningVoice
                        ? "Listening to your thoughts... (Speak now)"
                        : currentLang === "Hindi"
                        ? "यहाँ अपने मन की बात लिखें या माइक दबाएँ... (Enter)"
                        : currentLang === "Hinglish"
                        ? "Mann mein jo bhi ho, type karein ya mic dabayein... (Enter)"
                        : "Share what is on your mind or tap the mic... (Enter)"
                    }
                    className="flex-1 bg-transparent border-0 text-slate-900 dark:text-white text-sm focus:outline-none placeholder-slate-400 dark:placeholder-slate-500 px-1 py-1.5"
                  />

                  <button
                    onClick={() => handleSend()}
                    disabled={!inputText.trim() || isTyping}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                      inputText.trim() && !isTyping
                        ? "bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-600 text-white shadow-md shadow-teal-500/30 hover:scale-105 active:scale-95"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                    }`}
                    title="Send confidential message"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-2 px-3">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-teal-500" />
                    <span>Zero-PII • End-to-end ephemeral session</span>
                  </span>
                  <span>{isListeningVoice ? "Listening to mic..." : "Type or speak naturally"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Dedicated 3D TalkingHead Avatar Viewport Container */}
          {companionMode === "3d" && (
            <div className="w-full lg:w-[360px] xl:w-[420px] 2xl:w-[460px] h-[320px] sm:h-[360px] lg:h-full order-first lg:order-last border-b lg:border-b-0 lg:border-l border-slate-200/80 dark:border-slate-800/80 flex flex-col bg-slate-950/95 shrink-0 min-h-0 overflow-hidden transition-all duration-300 ease-in-out relative">
              <div className="flex-1 min-h-0 relative">
                <TalkingHeadAvatar
                  ref={avatarRef}
                  className="w-full h-full border-0 rounded-none bg-transparent"
                  avatarUrl="/avatars/inearly-companion.glb"
                  initialMood={mode === "plan" ? "happy" : "neutral"}
                  language={currentLang}
                  elevenLabsVoiceId="21m00Tcm4TlvDq8ikWAM"
                  onOpenFaceScanner={() => setIsFaceScannerOpen(true)}
                  isPersistentScanningActive={isPersistentScanning && isWebcamActive}
                  onTogglePersistentScanning={handleTogglePersistentScanning}
                />
              </div>

              {/* Embedded Live Webcam & Emotion Widget docked inside companion column */}
              {isPersistentScanning && isWebcamActive && (
                <div className="p-2.5 border-t border-slate-800/80 bg-slate-950/95 shrink-0 z-20">
                  <LiveEmotionCompanionWidget
                    setVideoRef={setWebcamVideoRef}
                    isAnalyzing={isAnalyzingFrame}
                    lastAnalysis={activeFaceEmotion}
                    onOpenDiagnostics={() => setIsFaceScannerOpen(true)}
                    onTogglePause={() => setIsScanningPaused((prev) => !prev)}
                    isPaused={isScanningPaused}
                    onStop={handleTogglePersistentScanning}
                    scanIntervalSeconds={3.5}
                  />
                </div>
              )}
            </div>
          )}

          {/* Floating PIP Live Webcam & Emotion Widget if in Simple Chat mode */}
          {companionMode === "simple" && isPersistentScanning && isWebcamActive && (
            <div className="fixed bottom-24 right-5 z-40 w-72 shadow-2xl animate-fade-in">
              <LiveEmotionCompanionWidget
                setVideoRef={setWebcamVideoRef}
                isAnalyzing={isAnalyzingFrame}
                lastAnalysis={activeFaceEmotion}
                onOpenDiagnostics={() => setIsFaceScannerOpen(true)}
                onTogglePause={() => setIsScanningPaused((prev) => !prev)}
                isPaused={isScanningPaused}
                onStop={handleTogglePersistentScanning}
                scanIntervalSeconds={3.5}
              />
            </div>
          )}
        </div>

      </div>
    </>
  );
};
