/**
 * Inearly TTS Voice Service
 * Comprehensive Speech Synthesis & Indian Locale Audio Engine
 * Supports: Hindi (hi-IN), Hinglish (en-IN), English (en-IN)
 * Features:
 *  - Explicit Indian voice locale mapping (hi-IN, en-IN) with fallback cascade
 *  - Clinical & emotional text preprocessor (strips markdown, emojis, fixes numbers & slang)
 *  - Asynchronous voice catalog caching with onvoiceschanged listeners
 *  - Empathetic pacing and pitch adjustments for mental wellness comfort
 */

export type TTSLanguage = "Hinglish" | "Hindi" | "English" | string;

export interface SpeechPacingConfig {
  rate: number;
  pitch: number;
  lipsyncLang: string;
}

// Cached voice catalog to avoid repeated browser queries
let cachedVoices: SpeechSynthesisVoice[] = [];
let voiceLoadPromise: Promise<SpeechSynthesisVoice[]> | null = null;

/**
 * Clean up text for speech synthesis:
 * - Strips code blocks, markdown tags, asterisks, brackets, hashes, links
 * - Removes ALL emojis, pictographs, decorative symbols
 * - Normalizes phone / crisis numbers into digit-by-digit spoken strings (e.g. 14416 -> 1 4 4 1 6)
 * - Expands common abbreviations (e.g., min -> minutes, w/ -> with)
 * - Normalizes ellipses, hyphens, and pauses for smooth cadence
 */
export function cleanTextForSpeech(text: string): string {
  if (!text || typeof text !== "string") return "";

  let cleaned = text;

  // 1. Remove code blocks and inline code
  cleaned = cleaned.replace(/```[\s\S]*?```/g, " ");
  cleaned = cleaned.replace(/`.*?`/g, " ");

  // 2. Remove URLs and web links (prevent reading "https colon slash slash")
  cleaned = cleaned.replace(/https?:\/\/\S+/gi, " ");
  cleaned = cleaned.replace(/www\.\S+/gi, " ");

  // 3. Remove Markdown links: [Anchor](url) -> Anchor
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // 4. Remove Markdown headers, blockquotes, horizontal rules
  cleaned = cleaned.replace(/^\s{0,3}[>#]+\s*/gm, " ");
  cleaned = cleaned.replace(/^---+$/gm, " ");

  // 5. Clean list bullets and numbering at start of lines for natural conversational flow
  cleaned = cleaned.replace(/^\s*[-*•]\s+/gm, " ");
  cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, " ");

  // 6. Expand Indian mental health helplines & numbers into digit-by-digit spoken text
  // Tele-MANAS: 14416 -> 1 4 4 1 6
  cleaned = cleaned.replace(/\b14416\b/g, "1, 4, 4, 1, 6");
  // Emergency 112 -> 1 1 2
  cleaned = cleaned.replace(/\b112\b/g, "1, 1, 2");
  // KIRAN: 1800-599-0019 -> 1 8 0 0, 5 9 9, 0 0 1 9
  cleaned = cleaned.replace(/\b1800[- ]?599[- ]?0019\b/g, "1 8 0 0, 5 9 9, 0 0 1 9");
  // 9999 666 555
  cleaned = cleaned.replace(/\b9999[- ]?666[- ]?555\b/g, "9 9 9 9, 6 6 6, 5 5 5");

  // 7. Expand common wellness, time, and conversational abbreviations
  cleaned = cleaned.replace(/\bTele-MANAS\b/gi, "Tele MANAS");
  cleaned = cleaned.replace(/\be\.?g\.?,?\s*/gi, "for example, ");
  cleaned = cleaned.replace(/\bi\.?e\.?,?\s*/gi, "that is, ");
  cleaned = cleaned.replace(/\bvs\.?\b/gi, "versus");
  cleaned = cleaned.replace(/\bw\/\s*/gi, "with ");
  cleaned = cleaned.replace(/\bw\/o\s*/gi, "without ");
  cleaned = cleaned.replace(/\bapprox\.?\s*/gi, "approximately ");
  cleaned = cleaned.replace(/\b(\d+)\s*(mins?|minutes?)\b/gi, "$1 minutes");
  cleaned = cleaned.replace(/\b(\d+)\s*(secs?|seconds?)\b/gi, "$1 seconds");
  cleaned = cleaned.replace(/\b(\d+)\s*(hrs?|hours?)\b/gi, "$1 hours");

  // 8. Remove ALL Unicode emojis and pictographs (modern Unicode property escapes + ranges)
  cleaned = cleaned.replace(
    /[\u{1F300}-\u{1FAD6}\u{1F900}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{FE0F}]/gu,
    ""
  );

  // 9. Remove markdown formatting characters (asterisks, tildes, underscores, pipes)
  cleaned = cleaned.replace(/[*_~`^#|\\/\[\]{}()<>]/g, " ");

  // 10. Replace symbols like & with "and", + with "plus", % with "percent"
  cleaned = cleaned.replace(/&/g, " and ");
  cleaned = cleaned.replace(/\+/g, " plus ");
  cleaned = cleaned.replace(/%/g, " percent ");
  cleaned = cleaned.replace(/@/g, " at ");

  // 11. Normalize hyphens and dashes into soothing commas for breathing pauses
  cleaned = cleaned.replace(/[-–—]{2,}/g, ", ");
  cleaned = cleaned.replace(/\s+[-–—]\s+/g, ", ");

  // 12. Normalize punctuation: Convert long ellipses or repeated marks into gentle pauses
  cleaned = cleaned.replace(/\.{2,}/g, ", ");
  cleaned = cleaned.replace(/!{2,}/g, "!");
  cleaned = cleaned.replace(/\?{2,}/g, "?");
  cleaned = cleaned.replace(/,{2,}/g, ",");

  // 13. Collapse multiple whitespaces and trim
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
}

/**
 * Detect whether text primarily contains Devanagari Hindi characters
 */
export function isDevanagariHindi(text: string): boolean {
  if (!text) return false;
  const devanagariRegex = /[\u0900-\u097F]/g;
  const matches = text.match(devanagariRegex);
  return !!matches && matches.length > 5;
}

/**
 * Asynchronously load and cache speech synthesis voices across browsers (Chrome, Edge, Safari, Firefox).
 */
export function loadSpeechVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return Promise.resolve([]);
  }

  if (cachedVoices.length > 0) {
    return Promise.resolve(cachedVoices);
  }

  if (voiceLoadPromise) {
    return voiceLoadPromise;
  }

  voiceLoadPromise = new Promise<SpeechSynthesisVoice[]>((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      cachedVoices = voices;
      resolve(voices);
      return;
    }

    // Chrome and Edge populate voices asynchronously
    const onVoicesChanged = () => {
      const updatedVoices = window.speechSynthesis.getVoices();
      if (updatedVoices && updatedVoices.length > 0) {
        cachedVoices = updatedVoices;
        window.speechSynthesis.onvoiceschanged = null;
        resolve(updatedVoices);
      }
    };

    window.speechSynthesis.onvoiceschanged = onVoicesChanged;

    // Fallback timeout after 1.5s if onvoiceschanged doesn't fire
    setTimeout(() => {
      const fallbackVoices = window.speechSynthesis.getVoices();
      cachedVoices = fallbackVoices;
      resolve(fallbackVoices);
    }, 1500);
  });

  return voiceLoadPromise;
}

/**
 * Select the best Indian voice profile based on user language preference and script.
 * 
 * Target profiles:
 * - Hindi: hi-IN (Google हिन्दी, Microsoft Swara, Microsoft Madhur, Microsoft Hemant, Lekha, etc.)
 * - Hinglish: en-IN (Microsoft Neerja, Microsoft Heera, Microsoft Ravi, Google English (India), etc.)
 * - English: en-IN / soothing en-GB female
 */
export function getBestIndianVoice(
  voices: SpeechSynthesisVoice[],
  languagePreference: TTSLanguage = "Hinglish",
  textSample: string = ""
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  const isHindiScript = isDevanagariHindi(textSample);
  const normalizedLang = languagePreference.toLowerCase();

  // CASE 1: HINDI (Explicit or detected Devanagari script)
  if (normalizedLang === "hindi" || isHindiScript) {
    // 1. Exact hi-IN match (Natural, Google, Microsoft, Apple)
    const hiVoice = voices.find(
      (v) =>
        (v.lang.toLowerCase() === "hi-in" || v.lang.toLowerCase() === "hi_in") &&
        /natural|swara|madhur|kalpana|lekha|hemant|google/i.test(v.name)
    );
    if (hiVoice) return hiVoice;

    // 2. Any hi-IN voice
    const anyHiIn = voices.find(
      (v) => v.lang.toLowerCase() === "hi-in" || v.lang.toLowerCase() === "hi_in"
    );
    if (anyHiIn) return anyHiIn;

    // 3. Voice starting with 'hi'
    const anyHi = voices.find((v) => v.lang.toLowerCase().startsWith("hi"));
    if (anyHi) return anyHi;

    // 4. Voice with "Hindi" in the name
    const namedHindi = voices.find((v) => /hindi|हिन्दी/i.test(v.name));
    if (namedHindi) return namedHindi;

    // 5. Fallback for Hindi script if no native Hindi TTS is installed: Indian English en-IN
    const indianEnglishFallback = voices.find(
      (v) => v.lang.toLowerCase() === "en-in" || /india|neerja|heera|ravi/i.test(v.name)
    );
    if (indianEnglishFallback) return indianEnglishFallback;
  }

  // CASE 2: HINGLISH (Romanized Hindi + English blend)
  // An Indian English voice (en-IN) has the exact phonetic table to pronounce Romanized Hindi
  // words ("aap kaise hain", "dhyan", "shant") accurately without sounding Americanized.
  if (normalizedLang === "hinglish") {
    // 1. Natural Indian English voices (Microsoft Neerja, Prabhat, Heera, Ravi, Google en-IN)
    const indianEnglishNatural = voices.find(
      (v) =>
        (v.lang.toLowerCase() === "en-in" || v.lang.toLowerCase() === "en_in") &&
        /natural|neerja|prabhat|heera|google/i.test(v.name)
    );
    if (indianEnglishNatural) return indianEnglishNatural;

    // 2. Any en-IN voice
    const anyIndianEnglish = voices.find(
      (v) =>
        v.lang.toLowerCase() === "en-in" ||
        v.lang.toLowerCase() === "en_in" ||
        /india|heera|ravi|veena|rishi|sangeeta/i.test(v.name)
    );
    if (anyIndianEnglish) return anyIndianEnglish;

    // 3. High quality Hindi voice that can speak Romanized text
    const hiVoice = voices.find((v) => v.lang.toLowerCase().startsWith("hi"));
    if (hiVoice) return hiVoice;

    // 4. British English female voice (closer vowel sounds to Indian English than American)
    const ukFemale = voices.find(
      (v) => v.lang.toLowerCase().startsWith("en-gb") && /female|natural|sonia|hazel/i.test(v.name)
    );
    if (ukFemale) return ukFemale;
  }

  // CASE 3: ENGLISH (Clean, culturally warm Indian English persona)
  if (normalizedLang === "english") {
    // 1. Prefer Indian English voice for cultural consistency with Inearly
    const indianEnglish = voices.find(
      (v) =>
        v.lang.toLowerCase() === "en-in" ||
        v.lang.toLowerCase() === "en_in" ||
        /india|neerja|heera|ravi/i.test(v.name)
    );
    if (indianEnglish) return indianEnglish;

    // 2. Soothing natural English female voice (UK or US)
    const calmingEnglish = voices.find(
      (v) =>
        v.lang.toLowerCase().startsWith("en") &&
        /google uk english female|samantha|karen|serena|zira|natural/i.test(v.name)
    );
    if (calmingEnglish) return calmingEnglish;
  }

  // GLOBAL FALLBACK CASCADE
  // Priority: en-IN -> hi-IN -> en-GB female -> en female -> any English -> first available voice
  const fallback =
    voices.find((v) => v.lang.toLowerCase().startsWith("en-in")) ||
    voices.find((v) => v.lang.toLowerCase().startsWith("hi")) ||
    voices.find((v) => v.lang.toLowerCase().startsWith("en-gb")) ||
    voices.find((v) => v.lang.toLowerCase().startsWith("en") && /female/i.test(v.name)) ||
    voices.find((v) => v.lang.toLowerCase().startsWith("en")) ||
    voices[0];

  return fallback || null;
}

/**
 * Pacing & pitch parameters tailored to Indian language cadence:
 * - Hindi: 0.92 rate (slightly slower so complex retroflex syllables & conjuncts don't clip)
 * - Hinglish: 0.94 rate (calm, reassuring, empathetic wellness cadence)
 * - English: 0.95 rate (unhurried and deliberate)
 */
export function getPacingParameters(languagePreference: TTSLanguage = "Hinglish"): SpeechPacingConfig {
  const norm = languagePreference.toLowerCase();

  if (norm === "hindi") {
    return {
      rate: 0.92,
      pitch: 1.02,
      lipsyncLang: "hi",
    };
  }

  if (norm === "hinglish") {
    return {
      rate: 0.94,
      pitch: 1.02,
      lipsyncLang: "en",
    };
  }

  // English
  return {
    rate: 0.95,
    pitch: 1.02,
    lipsyncLang: "en",
  };
}

export interface ElevenLabsAudioPayload {
  audioBuffer: AudioBuffer;
  words: string[];
  wtimes: number[];
  wdurations: number[];
  voiceId: string;
}

/**
 * Fetch synthesized speech from backend ElevenLabs TTS service and decode into an AudioBuffer.
 * Returns null if ElevenLabs is offline, quota exceeded, or unconfigured (triggering fallback).
 */
export async function fetchElevenLabsAudio(
  text: string,
  audioCtx: AudioContext,
  voiceId: string = "21m00Tcm4TlvDq8ikWAM"
): Promise<ElevenLabsAudioPayload | null> {
  if (!text || !text.trim() || !audioCtx) return null;

  try {
    const res = await fetch("/api/v1/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        voice_id: voiceId,
      }),
    });

    if (!res.ok) {
      return null;
    }

    const contentType = res.headers.get("Content-Type") || "";
    // If backend returns fallback JSON or non-audio, cleanly return null for browser TTS fallback
    if (!contentType.includes("audio/mpeg")) {
      return null;
    }

    const arrayBuffer = await res.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength < 500) {
      return null;
    }

    // Decode MP3 into AudioBuffer via Web Audio API
    // Clone arrayBuffer since decodeAudioData detaches the buffer in some browsers
    const bufferCopy = arrayBuffer.slice(0);
    const audioBuffer = await audioCtx.decodeAudioData(bufferCopy);
    const usedVoiceId = res.headers.get("X-Voice-Id") || voiceId;

    // Compute proportional word timings matching the actual audio duration
    const rawWords = text.split(/\s+/).filter(Boolean);
    const totalDurationMs = audioBuffer.duration * 1000;

    // Weight word duration by syllable length
    const weights = rawWords.map((w) => Math.max(w.length, 2));
    const totalWeight = weights.reduce((acc, w) => acc + w, 0) || 1;

    const words: string[] = [];
    const wtimes: number[] = [];
    const wdurations: number[] = [];

    let currentMs = 40; // slight lead-in
    const speechWindowMs = Math.max(totalDurationMs - 80, 200);

    for (let i = 0; i < rawWords.length; i++) {
      const w = rawWords[i];
      const wordSpan = (weights[i] / totalWeight) * speechWindowMs;
      words.push(w);
      wtimes.push(Math.round(currentMs));
      wdurations.push(Math.round(wordSpan));
      currentMs += wordSpan;
    }

    return {
      audioBuffer,
      words,
      wtimes,
      wdurations,
      voiceId: usedVoiceId,
    };
  } catch (err) {
    console.warn("ElevenLabs audio fetch/decode error, using client fallback:", err);
    return null;
  }
}
