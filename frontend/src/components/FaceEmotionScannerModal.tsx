"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  CameraOff,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Smile,
  RefreshCw,
  CheckCircle2,
  X,
  Sparkles,
  Lock,
  Eye,
  Info,
  Sliders,
  HeartHandshake
} from "lucide-react";

export interface EmotionDistribution {
  angry: number;
  disgust: number;
  fear: number;
  happy: number;
  neutral: number;
  sad: number;
  surprise: number;
}

export interface AffectiveWellness {
  affect_category: string;
  stress_vulnerability: "low" | "moderate" | "high";
  suggested_companion_tone: "calm" | "empathetic" | "happy" | "neutral";
  empathy_note: string;
}

export interface FaceAnalysisResult {
  status: "success" | "spoof_detected" | "no_face_detected" | "uncertain";
  face_detected: boolean;
  faces_count: number;
  bounding_box: { x: number; y: number; width: number; height: number } | null;
  is_real?: boolean;
  liveness_score?: number;
  emotions?: Record<string, number>;
  dominant_emotion?: string;
  liveness: {
    status: "passed" | "failed" | "uncertain";
    score: number;
    attack_type: string | null;
    model: string;
  };
  emotion: {
    dominant: string;
    confidence: number;
    distribution: EmotionDistribution;
    model: string;
  } | null;
  affective_wellness: AffectiveWellness | null;
  clinical_disclaimer: string;
}

interface FaceEmotionScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyEmotion: (result: FaceAnalysisResult) => void;
  currentAppliedEmotion?: string | null;
  sharedStream?: MediaStream | null;
  initialAnalysis?: FaceAnalysisResult | null;
}

const EMOTION_EMOJIS: Record<string, string> = {
  angry: "😠",
  disgust: "😣",
  fear: "😨",
  happy: "😊",
  neutral: "😐",
  sad: "🥺",
  surprise: "😲",
};

export function FaceEmotionScannerModal({
  isOpen,
  onClose,
  onApplyEmotion,
  currentAppliedEmotion,
  sharedStream,
  initialAnalysis,
}: FaceEmotionScannerModalProps) {
  const [consentGranted, setConsentGranted] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<FaceAnalysisResult | null>(initialAnalysis || null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Sync initial analysis when modal opens
  useEffect(() => {
    if (initialAnalysis && !result) {
      setResult(initialAnalysis);
    }
  }, [initialAnalysis, result]);

  // Robust video element ref callback that binds stream immediately upon mount
  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      try {
        node.srcObject = streamRef.current;
        node.muted = true;
        node.play().catch(() => {});
      } catch (err) {
        console.warn("[FaceEmotionScannerModal] setVideoRef play error:", err);
      }
    }
  }, []);

  // Stop camera helper (only stops tracks if not borrowing sharedStream)
  const stopCamera = useCallback(() => {
    if (streamRef.current && streamRef.current !== sharedStream) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
    }
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, [sharedStream]);

  // Adopt shared stream automatically if already live
  useEffect(() => {
    if (isOpen && sharedStream && sharedStream.active) {
      streamRef.current = sharedStream;
      setConsentGranted(true);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = sharedStream;
        videoRef.current.muted = true;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isOpen, sharedStream]);

  // Start camera with explicit consent
  const startCamera = async () => {
    if (!consentGranted) {
      setErrorMsg("Please grant explicit consent before starting the camera.");
      return;
    }
    setErrorMsg(null);

    // If shared stream is available, use it immediately
    if (sharedStream && sharedStream.active) {
      streamRef.current = sharedStream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = sharedStream;
        videoRef.current.muted = true;
        videoRef.current.play().catch(() => {});
      }
      return;
    }

    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera API is not supported in this browser environment.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;
      setCameraActive(true);

      // Bind to video element if already mounted
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setErrorMsg(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Camera permission denied. Please allow camera access in your browser settings."
          : `Could not access camera: ${err.message || "Unknown error"}`
      );
      setCameraActive(false);
    }
  };

  // Keep video playing when cameraActive transitions
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive]);

  // Cleanup on close or unmount
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, stopCamera]);

  // Capture single frame on-demand and send to backend
  const handleCaptureAndAnalyze = async () => {
    if (!videoRef.current || !cameraActive) return;

    try {
      setAnalyzing(true);
      setErrorMsg(null);

      // Create snapshot canvas
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not initialize 2D canvas context.");

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageBase64 = canvas.toDataURL("image/jpeg", 0.9);

      // Send to backend API
      const res = await fetch("/api/v1/face/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: imageBase64,
          user_consent: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server responded with ${res.status}`);
      }

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
                "Emotion detected via facial scan.",
            }
          : null,
        clinical_disclaimer:
          data.security_notice ||
          "Non-biometric wellness estimation. Not a psychiatric diagnosis or legal identity proof.",
      };

      setResult(normalizedResult);
    } catch (err: any) {
      console.error("Analysis error:", err);
      setErrorMsg(err.message || "Failed to analyze camera frame.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApplyToSanctuary = () => {
    if (!result || (!result.is_real && result.liveness.status === "failed")) return;
    onApplyEmotion(result);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Facial Emotion &amp; Liveness Perception
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold border border-teal-500/20">
                  Dual-Model AI
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                MiniFASNet v2 Anti-Spoofing + Swin Transformer FER
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 custom-scrollbar">
          
          {/* Privacy & Zero-Knowledge Security Notice */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-indigo-500/10 border border-emerald-500/20 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-400">
              <Lock className="w-4 h-4 shrink-0" />
              <span>Privacy &amp; DPDP Consent Shield</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              Your camera is <strong>never recorded, streamed, or stored</strong>. Analysis runs strictly on a single on-demand snapshot frame. Emotion detection does not perform identity verification.
            </p>
          </div>

          {/* Explicit Consent Step */}
          {!cameraActive && (
            <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="consent-checkbox"
                  checked={consentGranted}
                  onChange={(e) => setConsentGranted(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer"
                />
                <label htmlFor="consent-checkbox" className="text-xs text-slate-700 dark:text-slate-200 cursor-pointer select-none leading-relaxed">
                  I give explicit consent to activate my camera for this session to capture a single frame for affective wellness and liveness assessment.
                </label>
              </div>

              <button
                onClick={startCamera}
                disabled={!consentGranted}
                className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  consentGranted
                    ? "bg-gradient-to-r from-teal-500 to-indigo-600 text-white shadow-md shadow-teal-500/20 hover:opacity-95"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Start Camera Feed</span>
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Camera Viewport & Capture */}
          {cameraActive && (
            <div className="space-y-3">
              <div className="relative aspect-[4/3] sm:aspect-[16/10] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
                <video
                  ref={setVideoRef}
                  playsInline
                  muted
                  autoPlay
                  className="w-full h-full object-cover transform -scale-x-100"
                  onLoadedMetadata={(e) => {
                    const v = e.currentTarget;
                    v.muted = true;
                    v.play().catch(() => {});
                  }}
                />

                {/* Face Target Guide Oval Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-60 sm:w-56 sm:h-72 border-2 border-dashed border-teal-400/60 rounded-[48%] animate-pulse flex flex-col items-center justify-end pb-3">
                    <span className="text-[10px] font-mono text-teal-300 bg-slate-900/80 px-2 py-0.5 rounded-full border border-teal-500/30">
                      Align Face in Oval
                    </span>
                  </div>
                </div>

                {/* Top Status Overlay Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-[10px] font-mono text-teal-400 backdrop-blur-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    Live Camera Feed
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <button
                    onClick={stopCamera}
                    className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs transition-colors cursor-pointer"
                    title="Stop Camera"
                  >
                    <CameraOff className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCaptureAndAnalyze}
                  disabled={analyzing}
                  className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-teal-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {analyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-teal-200" />
                      <span>Running Liveness &amp; Emotion AI...</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      <span>Capture &amp; Analyze Frame</span>
                    </>
                  )}
                </button>

                <button
                  onClick={stopCamera}
                  className="py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Turn Off
                </button>
              </div>
            </div>
          )}

          {/* Analysis Results Display */}
          {result && (
            <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Analysis Pipeline Results
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Timestamp: {new Date().toLocaleTimeString()}
                </span>
              </div>

              {/* Status Grid: Face Detected + Liveness + Dominant Emotion */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* 1. Face Detected Status */}
                <div className={`p-3 rounded-2xl border ${
                  result.face_detected
                    ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                    : "bg-amber-50 dark:bg-amber-950/20 border-amber-500/30 text-amber-800 dark:text-amber-300"
                }`}>
                  <div className="text-[10px] uppercase font-bold tracking-wider opacity-80 mb-1">
                    1. Face Presence
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    {result.face_detected ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Face Detected ({result.faces_count})</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>No Face In Center</span>
                      </>
                    )}
                  </div>
                </div>

                {/* 2. Live Stream Status */}
                <div className={`p-3 rounded-2xl border ${
                  result.face_detected
                    ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                    : "bg-amber-50 dark:bg-amber-950/20 border-amber-500/30 text-amber-800 dark:text-amber-300"
                }`}>
                  <div className="text-[10px] uppercase font-bold tracking-wider opacity-80 mb-1">
                    2. Live Perception
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    {result.face_detected ? (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Live Emotion Detected</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>Awaiting Face</span>
                      </>
                    )}
                  </div>
                </div>

                {/* 3. Emotion Prediction */}
                <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/20 border border-teal-500/30 text-teal-800 dark:text-teal-300">
                  <div className="text-[10px] uppercase font-bold tracking-wider opacity-80 mb-1">
                    3. Affect Prediction
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    {result.emotion ? (
                      <>
                        <span className="text-base leading-none">
                          {EMOTION_EMOJIS[result.emotion.dominant] || "✨"}
                        </span>
                        <span className="capitalize">
                          {result.emotion.dominant} ({result.emotion.confidence}%)
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-400 font-normal">Detecting Affect...</span>
                    )}
                  </div>
                </div>
              </div>

              {/* No Face Detected Guidance Banner */}
              {!result.face_detected && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>No Face Detected In Snapshot</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Please ensure your face is well-lit, centered inside the oval guide, and look directly toward the camera, then click <strong>Capture &amp; Analyze Frame</strong> again.
                  </p>
                </div>
              )}

              {/* Live Emotion & Wellness Insights */}
              {result.face_detected && result.emotion && result.affective_wellness && (
                <div className="space-y-4">
                  
                  {/* Affective Empathy Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500/10 via-indigo-500/5 to-purple-500/10 border border-teal-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-xs text-teal-700 dark:text-teal-300">
                        <HeartHandshake className="w-4 h-4 text-teal-500" />
                        <span>Companion Affect Alignment</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 font-bold uppercase">
                        Vulnerability: {result.affective_wellness.stress_vulnerability}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                      {result.affective_wellness.empathy_note}
                    </p>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 pt-1">
                      <span>Suggested Avatar Mood:</span>
                      <span className="font-semibold capitalize text-teal-600 dark:text-teal-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-teal-500/20">
                        {result.affective_wellness.suggested_companion_tone}
                      </span>
                    </div>
                  </div>

                  {/* 7-Emotion Distribution Breakdown */}
                  <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>Emotion Distribution (Swin Transformer FER)</span>
                      <span className="text-[10px] text-slate-400 font-mono">SEARO1/FER_model</span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {Object.entries(result.emotion.distribution).map(([emo, rawVal]) => {
                        const isFraction = Object.values(result.emotion!.distribution).every((v) => v <= 1.0);
                        const val = isFraction ? rawVal * 100 : rawVal;
                        return (
                          <div key={emo} className="flex items-center gap-2 text-[11px]">
                            <span className="w-20 capitalize text-slate-600 dark:text-slate-400 flex items-center gap-1">
                              <span>{EMOTION_EMOJIS[emo] || "•"}</span>
                              <span>{emo}</span>
                            </span>
                            <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  emo === result.emotion?.dominant
                                    ? "bg-gradient-to-r from-teal-500 to-indigo-500"
                                    : "bg-slate-400/50"
                                }`}
                                style={{ width: `${Math.min(100, Math.max(0, val))}%` }}
                              />
                            </div>
                            <span className="w-12 text-right font-mono text-slate-500 dark:text-slate-400 text-[10px]">
                              {val.toFixed(1)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Apply to Sanctuary Button */}
                  <button
                    onClick={handleApplyToSanctuary}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-bold text-xs shadow-md shadow-teal-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Apply Affect to Sanctuary &amp; 3D Avatar</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Clinical & Identity Disclaimer */}
          <div className="text-[10px] text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-3 leading-tight flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              <strong>Wellness Aid Disclaimer:</strong> Facial emotion perception and anti-spoofing are experimental wellness aids designed to facilitate compassionate conversation. They do not constitute biometric identity verification or clinical psychiatric diagnosis.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-slate-500">
            {currentAppliedEmotion ? (
              <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active Affect: {currentAppliedEmotion}
              </span>
            ) : (
              "No affect currently synchronized"
            )}
          </span>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
