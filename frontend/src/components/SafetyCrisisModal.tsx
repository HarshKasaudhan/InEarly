"use client";

import React from "react";

export interface HelplineDetail {
  name: string;
  number: string;
  toll_free_alt?: string;
  description: string;
  type?: string;
  availability?: string;
}

interface SafetyCrisisModalProps {
  isOpen: boolean;
  onClose: () => void;
  helplines?: HelplineDetail[];
  language?: string;
}

const DEFAULT_INDIAN_HELPLINES: HelplineDetail[] = [
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

export const SafetyCrisisModal: React.FC<SafetyCrisisModalProps> = ({
  isOpen,
  onClose,
  helplines = DEFAULT_INDIAN_HELPLINES,
  language = "Hinglish",
}) => {
  if (!isOpen) return null;

  const helplinesToDisplay = helplines.length > 0 ? helplines : DEFAULT_INDIAN_HELPLINES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="max-w-2xl w-full bg-slate-900 border-2 border-rose-500/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-rose-950/80 via-rose-900/40 to-slate-900 border-b border-rose-500/30 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center text-2xl font-bold shadow-lg shadow-rose-500/20">
              🛡️
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                Immediate Human Support
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Your Safety & Well-being Come First
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="Dismiss modal (helplines will remain pinned)"
          >
            ✕
          </button>
        </div>

        {/* Modal Reassuring Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-slate-200 text-sm leading-relaxed">
            {language === "Hindi" ? (
              <p>
                आप इस समय जो भी महसूस कर रहे हैं, वह बहुत भारी हो सकता है। <strong>आप अकेले नहीं हैं</strong> और आपकी सुरक्षा सबसे महत्वपूर्ण है। इन मुफ्त, 24/7 प्रशिक्षित काउंसलर से अभी बात करें:
              </p>
            ) : language === "Hinglish" ? (
              <p>
                Aap jo dard ya overwhelm mehsoos kar rahe hain, use hum deeply acknowledge karte hain. <strong>Aap bilkul akele nahi hain.</strong> Kripya bina kisi jhijhak ke turant niche diye gaye verified human helplines par connect karein—ye 24/7 free aur confidential hain:
              </p>
            ) : (
              <p>
                Whatever pain or distress you are experiencing right now, <strong>you do not have to carry it alone.</strong> Human professionals are ready to listen without judgment. Please reach out right now:
              </p>
            )}
          </div>

          {/* Emergency Contact Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {helplinesToDisplay.map((h, i) => {
              const cleanTel = h.number.replace(/[^0-9+]/g, "");
              const isPrimary = h.number === "14416" || h.number === "112";

              return (
                <div
                  key={i}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    isPrimary
                      ? "bg-slate-950 border-rose-500/50 shadow-md ring-1 ring-rose-500/20"
                      : "bg-slate-950/70 border-slate-800"
                  }`}
                >
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{h.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {h.availability || "24/7"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal">{h.description}</p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-900">
                    <a
                      href={`tel:${cleanTel}`}
                      className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                        isPrimary
                          ? "bg-rose-600 hover:bg-rose-500 text-white"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                      }`}
                    >
                      <span>📞 Call</span>
                      <span className="font-mono text-sm tracking-wider">{h.number}</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Grounding Prompt */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1.5">
            <strong className="text-slate-300 block font-semibold">Immediate Grounding While You Call:</strong>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
              <li>Place one hand gently on your chest and take three slow, deep breaths.</li>
              <li>Sip a glass of cool water and feel the temperature grounding you.</li>
              <li>You do not have to solve everything today. Just take this next breath.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            India National Helplines • Toll-Free
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Keep Helplines Visible & Return to Chat
          </button>
        </div>
      </div>
    </div>
  );
};
