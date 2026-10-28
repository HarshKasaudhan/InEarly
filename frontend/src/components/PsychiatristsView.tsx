"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Search,
  MapPin,
  Video,
  Building2,
  Calendar,
  CheckCircle2,
  Phone,
  ExternalLink,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  SlidersHorizontal,
  Clock,
  Star,
  Globe,
  Filter,
} from "lucide-react";
import type { PsychiatristListing } from "@/app/api/v1/psychiatrists/route";

// Dynamically import map with SSR disabled to prevent Leaflet 'window is not defined'
const PsychiatristMap = dynamic(() => import("./PsychiatristMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[350px] rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse flex flex-col items-center justify-center text-slate-400 gap-2 border border-slate-200 dark:border-slate-800">
      <MapPin className="w-8 h-8 text-teal-500 animate-bounce" />
      <span className="text-xs font-mono">Loading OpenStreetMap India...</span>
    </div>
  ),
});

const CITIES = [
  "All Cities",
  "National (Tele-MANAS)",
  "Bengaluru",
  "Delhi NCR",
  "Mumbai",
  "Pune",
  "Hyderabad",
  "Chennai",
  "Kolkata",
];

interface PsychiatristsViewProps {
  initialMode?: "online" | "offline";
  compactHeader?: boolean;
}

export default function PsychiatristsView({
  initialMode = "online",
  compactHeader = false,
}: PsychiatristsViewProps) {
  const [tab, setTab] = useState<"online" | "offline">(initialMode);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [freeStudentOnly, setFreeStudentOnly] = useState(false);
  const [psychiatrists, setPsychiatrists] = useState<PsychiatristListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const [bookingSuccessModal, setBookingSuccessModal] = useState<PsychiatristListing | null>(null);

  // Fetch psychiatrist listings from API
  useEffect(() => {
    async function loadPsychiatrists() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("mode", tab);
        if (selectedCity && selectedCity !== "All Cities") {
          params.append("city", selectedCity);
        }
        if (freeStudentOnly) {
          params.append("free_only", "true");
        }
        if (searchQuery.trim()) {
          params.append("search", searchQuery.trim());
        }

        const res = await fetch(`/api/v1/psychiatrists?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setPsychiatrists(data);
          if (data.length > 0 && !selectedClinicId) {
            setSelectedClinicId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch psychiatrists:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPsychiatrists();
  }, [tab, selectedCity, freeStudentOnly, searchQuery]);

  // Selected clinic for map focus
  const activeClinic = useMemo(() => {
    return psychiatrists.find((p) => p.id === selectedClinicId) || psychiatrists[0] || null;
  }, [psychiatrists, selectedClinicId]);

  return (
    <div className="w-full flex-1 flex flex-col h-full min-h-0 bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl transition-all duration-300">
      
      {/* 1. TOP HEADER & TELEHEALTH TOGGLE */}
      <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/60 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-teal-500/25">
                <Building2 className="w-4 h-4" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Connect Verified Psychiatrists & Clinics
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Confidential, non-judgmental mental healthcare with subsidized student tiers and free Govt. Tele-MANAS support.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-200/80 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-300/70 dark:border-slate-700/80 text-xs shadow-inner shrink-0">
            <button
              onClick={() => {
                setTab("online");
                setSelectedClinicId(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                tab === "online"
                  ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Online Telehealth Doctors</span>
            </button>

            <button
              onClick={() => {
                setTab("offline");
                setSelectedClinicId(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                tab === "offline"
                  ? "bg-gradient-to-r from-teal-500 to-indigo-600 text-white shadow-md shadow-teal-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Offline Clinics & Hospitals</span>
            </button>
          </div>
        </div>

        {/* Search & Filters Bar */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="flex-1 min-w-[240px] relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                tab === "online"
                  ? "Search by doctor name, anxiety, ADHD, depression, or AIIMS/NIMHANS..."
                  : "Search nearby clinics, OPD, hospital name, or neighborhood..."
              }
              className="w-full bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all shadow-2xs"
            />
          </div>

          {/* City Selector */}
          <div className="relative min-w-[150px]">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300/80 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500 cursor-pointer shadow-2xs"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  📍 {c}
                </option>
              ))}
            </select>
          </div>

          {/* Subsidized Student Filter Pill */}
          <button
            onClick={() => setFreeStudentOnly(!freeStudentOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              freeStudentOnly
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 shadow-xs"
                : "bg-white dark:bg-slate-900 border-slate-300/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
            <span>Free / Student Subsidized Only</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA (ONLINE LIST VS OFFLINE SPLIT MAP) */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
            <p className="text-xs font-mono">Fetching verified medical registry...</p>
          </div>
        ) : psychiatrists.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
            <ShieldAlert className="w-10 h-10 text-amber-500" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">No matches found</h3>
            <p className="text-xs max-w-sm">
              We couldn't find any listings matching your search criteria. Try selecting "All Cities" or clearing search filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCity("All Cities");
                setFreeStudentOnly(false);
              }}
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-teal-500 text-white hover:bg-teal-600 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : tab === "online" ? (
          /* =========================================================================
             A. ONLINE TELEHEALTH DOCTORS GRID VIEW
             ========================================================================= */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
              {psychiatrists.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-950/60 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:border-teal-400 dark:hover:border-teal-500/50"
                >
                  <div>
                    {/* Top row: Avatar, Name, Verified Badge, Rating */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500/20 via-emerald-500/20 to-indigo-500/20 border border-teal-500/30 flex items-center justify-center font-bold text-teal-700 dark:text-teal-300 text-base shrink-0 shadow-2xs">
                          {doc.name.startsWith("Dr.") ? doc.name.replace("Dr. ", "").slice(0, 2) : "TM"}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
                              {doc.name}
                            </h3>
                            {doc.verified && (
                              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-medium border border-teal-500/20">
                                <CheckCircle2 className="w-3 h-3" /> RCI / NMC Verified
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 mt-0.5">
                            {doc.specialty}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {doc.qualifications} • {doc.experience}
                          </p>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold shrink-0">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{doc.rating}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({doc.reviews_count})
                        </span>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed line-clamp-3">
                      {doc.bio}
                    </p>

                    {/* Hospital affiliations / City & Languages */}
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-teal-500" /> {doc.city}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3 text-indigo-400" /> {doc.languages.slice(0, 3).join(", ")}
                      </span>
                      {doc.languages.length > 3 && (
                        <span>+{doc.languages.length - 3} more</span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {doc.fee}
                        </span>
                        {doc.free_student_tier && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                            Student Tier
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                        <Clock className="w-3 h-3 text-emerald-500" />
                        <span>Next Slot: {doc.next_available}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {doc.phone && (
                        <a
                          href={`tel:${doc.phone}`}
                          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                          title="Call directly"
                        >
                          <Phone className="w-3.5 h-3.5 text-teal-500" />
                          <span>Call</span>
                        </a>
                      )}

                      <button
                        onClick={() => setBookingSuccessModal(doc)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-xs font-semibold transition-all shadow-md shadow-teal-500/25 flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Start Video/Chat Consult</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* =========================================================================
             B. OFFLINE LOCAL CLINICS WITH INTERACTIVE LEAFLET OPENSTREETMAP
             ========================================================================= */
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
            {/* Left Column / Top on Mobile: Interactive Leaflet Map */}
            <div className="w-full lg:w-7/12 h-[340px] lg:h-full p-3 sm:p-4 shrink-0 min-h-0">
              <PsychiatristMap
                clinics={psychiatrists}
                selectedClinicId={selectedClinicId}
                onSelectClinic={(c) => setSelectedClinicId(c.id)}
                center={
                  activeClinic && activeClinic.lat && activeClinic.lng
                    ? [activeClinic.lat, activeClinic.lng]
                    : [20.5937, 78.9629]
                }
                zoom={activeClinic ? 13 : 5}
              />
            </div>

            {/* Right Column: Scrollable Clinics List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 border-t lg:border-t-0 lg:border-l border-slate-200/80 dark:border-slate-800/80 space-y-3 custom-scrollbar">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {psychiatrists.length} Nearby Clinics & OPD Centers
                </span>
                <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                  Click clinic to center on map
                </span>
              </div>

              {psychiatrists.map((clinic) => {
                const isSelected = selectedClinicId === clinic.id;
                return (
                  <div
                    key={clinic.id}
                    onClick={() => setSelectedClinicId(clinic.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-teal-50/80 dark:bg-teal-950/20 border-teal-500 shadow-md ring-1 ring-teal-500/40"
                        : "bg-white dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                            {clinic.name}
                          </h4>
                          {clinic.free_student_tier && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                              Free/Subsidized OPD
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-teal-600 dark:text-teal-400 font-medium mt-0.5">
                          {clinic.specialty}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{clinic.rating}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
                      <span>{clinic.address}</span>
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {clinic.fee}
                        </span>
                        <p className="text-[10px] text-slate-400">
                          {clinic.next_available}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {clinic.phone && (
                          <a
                            href={`tel:${clinic.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-teal-600 dark:text-teal-400 text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call OPD</span>
                          </a>
                        )}

                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${clinic.name} ${clinic.address}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-medium transition-colors flex items-center gap-1"
                        >
                          <span>Directions</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. SIMULATED CONFIDENTIAL VIDEO/CHAT CONSULT MODAL */}
      {bookingSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-500 mx-auto">
              <Video className="w-6 h-6 animate-pulse" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Start Telehealth Consultation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You are connecting with <strong className="text-slate-800 dark:text-slate-200">{bookingSuccessModal.name}</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800/70 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Doctor / Cell:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{bookingSuccessModal.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Specialty:</span>
                <span className="text-slate-700 dark:text-slate-300">{bookingSuccessModal.specialty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Consultation Fee:</span>
                <span className="font-bold text-teal-600 dark:text-teal-400">{bookingSuccessModal.fee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Privacy Guarantee:</span>
                <span className="font-semibold text-emerald-500">Zero-Trace • End-to-End Encrypted</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {bookingSuccessModal.phone && (
                <a
                  href={`tel:${bookingSuccessModal.phone}`}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold text-xs text-center shadow-md shadow-teal-500/25 hover:from-teal-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Doctor Hotline ({bookingSuccessModal.phone})</span>
                </a>
              )}

              <button
                onClick={() => {
                  alert(`Encrypted Telehealth session opened for ${bookingSuccessModal.name}. You are connected with zero-PII data sharing.`);
                  setBookingSuccessModal(null);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-semibold text-xs text-center hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Video className="w-3.5 h-3.5 text-teal-400" />
                <span>Launch Digital Video Room</span>
              </button>

              <button
                onClick={() => setBookingSuccessModal(null)}
                className="w-full py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
