"use client";

import { useState, useEffect } from "react";
import {
  generateRollingTOTP,
  getStoredPracticalCheckins,
  isTodayGroupPracticalDay,
  getTodayDayName,
} from "@/lib/practicalData";
import {
  calculateDistanceMeters,
  getPhysicalSiteById,
  PhysicalSite,
} from "@/lib/sitesData";

interface PracticalDayModalProps {
  userId: string;
  cohortId: string;
  groupId: string;
  groupName?: string;
  practicalDay?: string;
  siteId?: string;
  currentWeekNumber?: number;
}

export default function PracticalDayModal({
  userId,
  cohortId,
  groupId,
  groupName = "Group A",
  practicalDay,
  siteId,
  currentWeekNumber = 1,
}: PracticalDayModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);

  // 60-Second Rolling TOTP Code state
  const [rollingCode, setRollingCode] = useState("");
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  // Geofence GPS Location state
  const [site, setSite] = useState<PhysicalSite | null>(getPhysicalSiteById(siteId));
  const [geoStatus, setGeoStatus] = useState<"loading" | "in_range" | "out_of_range" | "denied">("loading");
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);

  const isPracticalDay = isTodayGroupPracticalDay(practicalDay);

  // 1. Check-in status & Modal display trigger
  useEffect(() => {
    if (!userId || !isPracticalDay) return;

    const checkins = getStoredPracticalCheckins();
    const hasCheckedIn = checkins.some(
      (c) => c.userId === userId && c.weekNumber === currentWeekNumber
    );

    if (hasCheckedIn) {
      setAlreadyCheckedIn(true);
    }

    const dismissedKey = `dismissed_prac_modal_w${currentWeekNumber}_${userId}`;
    if (sessionStorage.getItem(dismissedKey) === "true") {
      return;
    }

    setIsOpen(true);
  }, [userId, isPracticalDay, currentWeekNumber]);

  // 2. Rolling TOTP ticker (updates every second)
  useEffect(() => {
    if (!isOpen) return;

    const updateCode = () => {
      const { code, secondsRemaining: secs } = generateRollingTOTP(
        userId,
        cohortId,
        groupId,
        currentWeekNumber
      );
      setRollingCode(code);
      setSecondsRemaining(secs);
    };

    updateCode();
    const interval = setInterval(updateCode, 1000);
    return () => clearInterval(interval);
  }, [isOpen, userId, cohortId, groupId, currentWeekNumber]);

  // 3. Browser Geolocation GPS check
  useEffect(() => {
    if (!isOpen) return;

    const currentSite = getPhysicalSiteById(siteId);
    setSite(currentSite);

    if (!currentSite) {
      setGeoStatus("denied");
      return;
    }

    if (typeof window !== "undefined" && "geolocation" in navigator) {
      setGeoStatus("loading");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const dist = calculateDistanceMeters(
            pos.coords.latitude,
            pos.coords.longitude,
            currentSite.latitude,
            currentSite.longitude
          );
          setDistanceMeters(dist);
          if (dist <= currentSite.maxRadiusMeters) {
            setGeoStatus("in_range");
          } else {
            setGeoStatus("out_of_range");
          }
        },
        (err) => {
          console.warn("Geolocation error:", err.message);
          setGeoStatus("denied");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setGeoStatus("denied");
    }
  }, [isOpen, siteId]);

  const handleClose = () => {
    if (userId) {
      sessionStorage.setItem(`dismissed_prac_modal_w${currentWeekNumber}_${userId}`, "true");
    }
    setIsOpen(false);
  };

  if (!isOpen || !isPracticalDay) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-emerald-100 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative overflow-hidden font-sora">
        {/* Top Decorative Banner */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 transition text-sm font-bold"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="text-center mt-2 mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 text-3xl mb-2 shadow-inner">
            🐐
          </div>
          <div>
            <span className="inline-block px-3 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase tracking-widest rounded-full border border-emerald-200/80 mb-1">
              Week {currentWeekNumber} Practical Day • {getTodayDayName()}
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Today is your Practical Day!
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed max-w-sm mx-auto">
            Assigned Site: <strong className="text-slate-800">{site ? site.name : "Awaiting Site Assignment"}</strong> ({groupName})
          </p>
        </div>

        {/* Dynamic Rolling Code Box */}
        <div className="bg-emerald-950 text-white rounded-2xl p-6 text-center mb-4 relative overflow-hidden border border-emerald-800 shadow-md">
          <div className="flex items-center justify-between mb-2 border-b border-emerald-800/80 pb-2">
            <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest">
              🔐 60-Sec Rolling Verification Pass
            </span>
            <span className="text-[10px] text-emerald-300 font-mono font-bold flex items-center gap-1">
              ⏱️ Refreshes in <strong className="text-[#00D1C1] text-xs">{secondsRemaining}s</strong>
            </span>
          </div>

          <p className="text-4xl md:text-5xl font-black font-mono tracking-widest text-[#00D1C1] py-1">
            {rollingCode || "--- ---"}
          </p>

          <p className="text-[10px] text-emerald-200/80 mt-1 font-medium">
            Present this 6-digit rolling pass to your instructor at {site ? site.name : "your assigned site"}
          </p>
        </div>

        {/* GPS Geofence Status Indicator */}
        <div className="mb-4">
          {geoStatus === "loading" && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center text-xs text-blue-700 font-medium flex items-center justify-center gap-2">
              <span className="animate-spin text-sm">⏳</span> Verifying farm site GPS location...
            </div>
          )}

          {geoStatus === "in_range" && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800 font-bold flex items-center justify-center gap-2">
              <span>🟢</span> In Geofence Range ({distanceMeters}m from {site ? site.name : "site"})
            </div>
          )}

          {geoStatus === "out_of_range" && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center text-xs text-red-700 font-bold">
              <span>🔴</span> Out of Range ({(distanceMeters! / 1000).toFixed(1)}km from {site ? site.name : "site"}). You must be physically at the farm site to verify attendance.
            </div>
          )}

          {geoStatus === "denied" && (
            <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-center text-xs text-slate-600 font-medium">
              📍 Location disabled — Please enable GPS location on your phone at the farm site.
            </div>
          )}
        </div>

        {/* Attendance Verification Status */}
        {alreadyCheckedIn ? (
          <div className="bg-emerald-100 border border-emerald-300 rounded-2xl p-3.5 text-center mb-4">
            <p className="text-emerald-900 font-extrabold text-xs">
              ✅ Verified Present for Week {currentWeekNumber} Practical Day!
            </p>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center mb-4">
            <p className="text-amber-800 font-bold text-xs">
              ⏳ Pending — Show your rolling code to the instructor on duty
            </p>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleClose}
          className="w-full py-3.5 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#002d25] font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-xs cursor-pointer"
        >
          Close Pass Window
        </button>

        {/* Footer Note */}
        <p className="text-[10px] text-slate-400 text-center mt-3 font-medium">
          Verified practical attendance is required to unlock Week {currentWeekNumber + 1} LMS modules.
        </p>
      </div>
    </div>
  );
}
