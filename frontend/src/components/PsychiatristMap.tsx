"use client";

import React, { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export interface MapClinic {
  id: string;
  name: string;
  specialty: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  fee: string;
  free_student_tier: boolean;
  rating: number;
  phone?: string;
  next_available: string;
}

interface PsychiatristMapProps {
  clinics: MapClinic[];
  selectedClinicId: string | null;
  onSelectClinic: (clinic: MapClinic) => void;
  center?: [number, number];
  zoom?: number;
}

export default function PsychiatristMap({
  clinics,
  selectedClinicId,
  onSelectClinic,
  center = [20.5937, 78.9629], // Default center of India
  zoom = 5,
}: PsychiatristMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ [id: string]: any }>({});

  useEffect(() => {
    if (!mapContainerRef.current) return;

    let isMounted = true;

    async function initMap() {
      const L = (await import("leaflet")).default;
      if (!isMounted || !mapContainerRef.current) return;

      // Clean up previous instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize map with OpenStreetMap tiles
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // Free OpenStreetMap Tile Layer with clean attribution
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors • Inearly Health',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Render markers
      renderMarkers(L, map);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when clinics list changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    async function updateMarkers() {
      const L = (await import("leaflet")).default;
      if (!mapInstanceRef.current) return;
      renderMarkers(L, mapInstanceRef.current);
    }

    updateMarkers();
  }, [clinics, selectedClinicId]);

  // Center on selected clinic if changed
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedClinicId) return;
    const selected = clinics.find((c) => c.id === selectedClinicId);
    if (selected && selected.lat && selected.lng) {
      mapInstanceRef.current.flyTo([selected.lat, selected.lng], 14, {
        duration: 1.2,
      });

      // Open popup for selected marker
      if (markersRef.current[selectedClinicId]) {
        markersRef.current[selectedClinicId].openPopup();
      }
    }
  }, [selectedClinicId]);

  function renderMarkers(L: any, map: any) {
    // Clear old markers
    Object.values(markersRef.current).forEach((marker: any) => marker.remove());
    markersRef.current = {};

    if (!clinics || clinics.length === 0) return;

    const bounds = L.latLngBounds([]);

    clinics.forEach((clinic) => {
      if (!clinic.lat || !clinic.lng) return;

      const isSelected = selectedClinicId === clinic.id;

      // Custom sleek SVG Pin
      const pinHtml = `
        <div style="
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${isSelected ? "linear-gradient(135deg, #0d9488, #4f46e5)" : "linear-gradient(135deg, #14b8a6, #059669)"};
          color: white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 14px rgba(13, 148, 136, 0.45);
          border: 2px solid white;
          cursor: pointer;
          transition: transform 0.2s ease;
        ">
          <div style="transform: rotate(45deg); font-weight: bold; font-size: 13px;">
            🏥
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: "inearly-clinic-pin",
        html: pinHtml,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -38],
      });

      const marker = L.marker([clinic.lat, clinic.lng], { icon: customIcon }).addTo(map);

      // Popup with doctor info & call to action
      const popupContent = `
        <div style="font-family: system-ui, sans-serif; min-width: 200px; padding: 4px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 6px; background: #ccfbf1; color: #0f766e;">
              ⭐ ${clinic.rating} Verified
            </span>
            ${clinic.free_student_tier ? '<span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 6px; background: #dcfce7; color: #15803d;">Free/Subsidized</span>' : ""}
          </div>
          <h4 style="margin: 0 0 2px 0; font-size: 13px; font-weight: 700; color: #0f172a;">
            ${clinic.name}
          </h4>
          <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b;">
            ${clinic.specialty}
          </p>
          <p style="margin: 0 0 8px 0; font-size: 11px; color: #334155;">
            📍 ${clinic.address}
          </p>
          <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 6px; border-top: 1px solid #e2e8f0;">
            <span style="font-size: 11px; font-weight: 600; color: #0d9488;">
              ${clinic.fee}
            </span>
            ${
              clinic.phone
                ? `<a href="tel:${clinic.phone}" style="font-size: 11px; font-weight: bold; padding: 4px 8px; border-radius: 6px; background: #0f766e; color: white; text-decoration: none;">📞 Call Clinic</a>`
                : ""
            }
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on("click", () => {
        onSelectClinic(clinic);
      });

      markersRef.current[clinic.id] = marker;
      bounds.extend([clinic.lat, clinic.lng]);
    });

    // Auto-fit bounds if markers exist and no clinic specifically selected
    if (!selectedClinicId && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }

  return (
    <div className="relative w-full h-full min-h-[350px] rounded-2xl overflow-hidden shadow-inner border border-slate-200/80 dark:border-slate-800/80">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* Map Overlay Badge */}
      <div className="absolute top-3 right-3 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md flex items-center gap-2 pointer-events-none text-xs font-medium text-slate-700 dark:text-slate-300">
        <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
        <span>OpenStreetMap Live Data</span>
      </div>
    </div>
  );
}
