"use client";

import React, { useState } from "react";

export type LanguagePref = "Hindi" | "Hinglish" | "English";
export type AgeBand = "13-17" | "18-24" | "25-34" | "35-49" | "50+";

interface OnboardingResult {
  consent_id: string;
  user_id: string;
  pseudonym: string;
  age_band: AgeBand;
  language_preference: LanguagePref;
  save_chats_consent: boolean;
  status: string;
}

interface OnboardingFlowProps {
  onBack: () => void;
  onComplete: (result: OnboardingResult) => void;
}

const PSEUDONYM_SUGGESTIONS = [
  "ShantiBreeze",
  "BanyanSoul",
  "NeemLeaf",
  "RiverNarmada",
  "LotusBloom",
  "CalmMonsoon",
  "SahyadriMist",
  "ChaiWarmth",
  "PavanEcho",
  "GulmoharPetal",
  "BraveSparrow",
  "QuietDeodar",
];

const LANGUAGE_SAMPLES: Record<LanguagePref, { title: string; subtitle: string; preview: string }> = {
  Hinglish: {
    title: "Hinglish (हिंग्लिश)",
    subtitle: "Everyday code-switching mixture of Hindi & English",
    preview: "“Namaste! Aaj kaisa feel kar rahe ho? Agar kisi baat se stress ya burnout lag raha hai, toh bina kisi judgment ke share kar sakte ho.”",
  },
  Hindi: {
    title: "Hindi (हिंदी)",
    subtitle: "सरल और आत्मीय हिंदी संवाद",
    preview: "“नमस्ते! आज आप कैसा महसूस कर रहे हैं? अगर मन में कोई उलझन या तनाव है, तो यहाँ बेझिझक साझा कर सकते हैं। मैं आपको सुनने के लिए यहाँ हूँ।”",
  },
  English: {
    title: "English",
    subtitle: "Calm, supportive and non-judgmental English",
    preview: "“Hello! How are you feeling today? If you're experiencing stress or overwhelm, take your time. I'm here to listen at your pace.”",
  },
};

const AGE_BANDS: { value: AgeBand; label: string; context: string }[] = [
  { value: "13-17", label: "School Student (13–17)", context: "Exam stress, peer dynamics, expectations" },
  { value: "18-24", label: "College Student (18–24)", context: "Placements, identity, hostel life, future anxiety" },
  { value: "25-34", label: "Young Adult (25–34)", context: "Early career, relationships, financial independence" },
  { value: "35-49", label: "Mid-Adult / Professional (35–49)", context: "Work-life balance, parenting, caregiver burnout" },
  { value: "50+", label: "Senior (50+)", context: "Retirement, life transitions, health, companionship" },
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onBack, onComplete }) => {
  // Form State
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [language, setLanguage] = useState<LanguagePref>("Hinglish");
  const [ageBand, setAgeBand] = useState<AgeBand>("18-24");
  const [pseudonym, setPseudonym] = useState<string>("CalmMonsoon_24");
  const [saveChats, setSaveChats] = useState<boolean>(false);
  const [consentAgreed, setConsentAgreed] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const rollNewPseudonym = () => {
    const randomMoniker = PSEUDONYM_SUGGESTIONS[Math.floor(Math.random() * PSEUDONYM_SUGGESTIONS.length)];
    const randomNum = Math.floor(10 + Math.random() * 90);
    setPseudonym(`${randomMoniker}_${randomNum}`);
  };

  const handleFinalSubmit = async () => {
    if (!consentAgreed) {
      setErrorMsg("Please grant explicit consent to proceed under privacy regulations.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const payload = {
      age_band: ageBand,
      pseudonym: pseudonym.trim() || undefined,
      purpose: "ai_mental_wellness_support",
      version: "1.0",
      agreed: true,
      language_preference: language,
      save_chats_consent: saveChats,
    };

    try {
      // First attempt direct backend or Next.js proxy route
      const response = await fetch("/api/v1/consents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      
      // Save pseudonym & preferences locally for non-identifying continuity
      if (typeof window !== "undefined") {
        localStorage.setItem("inearly_session", JSON.stringify({
          userId: data.user_id,
          pseudonym: data.pseudonym,
          language: data.language_preference,
          ageBand: data.age_band,
          saveChats: data.save_chats_consent,
          consentId: data.consent_id,
        }));
      }

      onComplete(data);
    } catch (err: any) {
      console.error("Consent recording failed:", err);
      setErrorMsg("Failed to connect to consent gateway. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      {/* Progress Tracker */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 text-xs font-medium text-slate-400">
        <button
          onClick={currentStep === 1 ? onBack : () => setCurrentStep((s) => (s - 1) as any)}
          className="hover:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          ← {currentStep === 1 ? "Disclosures" : "Previous Step"}
        </button>

        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${currentStep === 1 ? "bg-teal-500 text-slate-950" : "bg-slate-800 text-slate-300"}`}>
            1
          </span>
          <span className="text-slate-600">--</span>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${currentStep === 2 ? "bg-teal-500 text-slate-950" : "bg-slate-800 text-slate-300"}`}>
            2
          </span>
          <span className="text-slate-600">--</span>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${currentStep === 3 ? "bg-teal-500 text-slate-950" : "bg-slate-800 text-slate-300"}`}>
            3
          </span>
        </div>

        <span className="text-slate-500 font-mono">Step {currentStep} of 3</span>
      </div>

      {/* STEP 1: LANGUAGE SELECTION */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-teal-400 mb-1">
              Culturally Nuanced Code-Switching
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              Choose your preferred conversation style
            </h3>
            <p className="text-sm text-slate-300 mt-1">
              You can switch between Hindi, Hinglish, and English freely during conversations.
            </p>
          </div>

          <div className="space-y-3">
            {(Object.keys(LANGUAGE_SAMPLES) as LanguagePref[]).map((langKey) => {
              const langInfo = LANGUAGE_SAMPLES[langKey];
              const isSelected = language === langKey;
              return (
                <div
                  key={langKey}
                  onClick={() => setLanguage(langKey)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 border-teal-400 shadow-md ring-1 ring-teal-400/30"
                      : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-base font-semibold text-white">{langInfo.title}</span>
                      <p className="text-xs text-slate-400 mt-0.5">{langInfo.subtitle}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? "border-teal-400 bg-teal-400" : "border-slate-600"}`}>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-slate-950"></span>}
                    </div>
                  </div>

                  <div className="mt-3 p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs italic text-slate-300 leading-relaxed font-sans">
                    {langInfo.preview}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-sm transition-all shadow-md cursor-pointer"
            >
              Continue to Age Band →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: AGE BAND SELECTION */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1">
              Data Minimization Principle
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              Select your age band
            </h3>
            <p className="text-sm text-slate-300 mt-1">
              Under India&apos;s DPDP Act, we never ask for your date of birth or ID. Coarse bands help calibrate cultural context without fingerprinting.
            </p>
          </div>

          <div className="space-y-2.5">
            {AGE_BANDS.map((item) => {
              const isSelected = ageBand === item.value;
              return (
                <div
                  key={item.value}
                  onClick={() => setAgeBand(item.value)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-slate-900 border-indigo-400 shadow-md ring-1 ring-indigo-400/30"
                      : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <span className="text-sm font-semibold text-white">{item.label}</span>
                    <p className="text-xs text-slate-400 mt-0.5">{item.context}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-3 ${isSelected ? "border-indigo-400 bg-indigo-400" : "border-slate-600"}`}>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-slate-950"></span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-md cursor-pointer"
            >
              Continue to Pseudonym & Privacy →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PSEUDONYM & CONSENT RECORDING */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-teal-400 mb-1">
              Zero Legal Names or Phone Numbers
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              Choose your pseudonymous alias
            </h3>
            <p className="text-sm text-slate-300 mt-1">
              Pick a calm handle or roll a peaceful Indian nature-inspired moniker.
            </p>
          </div>

          {/* Pseudonym Generator */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <label className="text-xs font-medium text-slate-300 block">Your Anonymous Handle</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={pseudonym}
                onChange={(e) => setPseudonym(e.target.value)}
                maxLength={30}
                placeholder="e.g. CalmBanyan_42"
                className="flex-1 px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-teal-400 font-mono"
              />
              <button
                type="button"
                onClick={rollNewPseudonym}
                className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Roll a new random peaceful moniker"
              >
                🎲 Roll
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Never use your real name, phone number, or work email handle.
            </p>
          </div>

          {/* Chat Retention Control */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-white block">You control whether chats are saved</span>
                <span className="text-[11px] text-slate-400">
                  {saveChats ? "Encrypted history preserved on this device for 30 days" : "Ephemeral mode: Purged as soon as session ends"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSaveChats(!saveChats)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${saveChats ? "bg-teal-500" : "bg-slate-700"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${saveChats ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          </div>

          {/* DPDP Act Explicit Agreement Checkbox */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-300 leading-relaxed">
              <input
                type="checkbox"
                checked={consentAgreed}
                onChange={(e) => setConsentAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-teal-400 cursor-pointer"
              />
              <span>
                I agree to the privacy disclosures. I understand this is an AI wellness assistant (not medical/psychiatric care), and I grant explicit consent under the Digital Personal Data Protection Act (2023) for supportive conversational purposes.
              </span>
            </label>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleFinalSubmit}
              disabled={loading || !consentAgreed}
              className={`px-8 py-3.5 rounded-xl font-semibold text-sm transition-all shadow-lg flex items-center gap-2 cursor-pointer ${
                loading || !consentAgreed
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-teal-400 to-indigo-500 text-slate-950 hover:from-teal-300 hover:to-indigo-400 shadow-teal-500/25"
              }`}
            >
              {loading ? "Recording Consent..." : "Enter Confidential Space →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
