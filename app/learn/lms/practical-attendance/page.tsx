"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useNavigationHistory } from "@/components/NavigationHistoryProvider";
import { authFetch, refreshAccessToken, getApiBase } from "@/lib/api";
import {
  generateUserUniquePracticalCode,
  getStoredPracticalCheckins,
  fetchAndSyncUserPracticalCheckins,
  isTodayGroupPracticalDay,
} from "@/lib/practicalData";

const API_BASE = getApiBase();

function TraineePracticalAttendanceContent() {
  const router = useRouter();
  const { goBack } = useNavigationHistory();
  const searchParams = useSearchParams();
  const { accessToken, setAccessToken, logout } = useAuthStore();

  const [userId, setUserId]             = useState("");
  const [userEmail, setUserEmail]       = useState("");
  const [cohortId, setCohortId]         = useState("");
  const [groupId, setGroupId]           = useState("");
  const [groupName, setGroupName]       = useState("Group A");
  const [practicalDay, setPracticalDay] = useState("Monday");
  const [firstName, setFirstName]       = useState("");

  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [checkinWeeks, setCheckinWeeks] = useState<number[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");

  useEffect(() => {
    const restore = async () => {
      const refresh = localStorage.getItem("refreshToken");
      if (!refresh) { router.replace("/learn/lms"); return; }

      let token = accessToken;
      if (!token) {
        try { token = await refreshAccessToken(); } catch { router.replace("/learn/lms"); return; }
      }

      try {
        const payload = JSON.parse(atob(token!.split(".")[1]));
        const currentUserId = payload.userId || payload.sub || payload.id;
        if (!currentUserId) { router.replace("/learn/lms"); return; }

        setUserId(currentUserId);
        setUserEmail(payload.email || "");

        const userRes = await authFetch(`/users/${currentUserId}`);
        if (userRes.ok) {
          const uData = await userRes.json();
          setFirstName(uData.firstName || "Trainee");
          setUserEmail(uData.email || payload.email || "");
          const cId = uData.cohortId || payload.cohortId || "cohort-1";
          setCohortId(cId);

          try {
            const gRes = await authFetch(`/cohorts/${cId}/groups`);
            if (gRes.ok) {
              const groupsData = await gRes.json();
              const groupsList = Array.isArray(groupsData) ? groupsData : groupsData?.groups || [];
              const userGroup = groupsList.find((g: any) =>
                Array.isArray(g.members) && g.members.some((m: any) => (m.id || m.userId) === currentUserId)
              );

              if (userGroup) {
                setGroupId(userGroup.id);
                setGroupName(userGroup.name);
                setPracticalDay(userGroup.practicalDay || "Monday");
              }
            }
          } catch {}
        }

        // Fetch user practical checkins verified by admin from server
        const syncedCheckins = await fetchAndSyncUserPracticalCheckins(currentUserId);
        const checkinWeekNums = syncedCheckins
          .filter((c) => c.userId === currentUserId)
          .map((c) => c.weekNumber);
        setCheckinWeeks(checkinWeekNums);

        const weekParam = searchParams?.get("week");
        if (weekParam) {
          const wNum = Number(weekParam);
          if (wNum >= 1 && wNum <= 11) setSelectedWeek(wNum);
        }
      } catch {
        setError("Failed to load practical attendance portal.");
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, []);

  const generatedCode = generateUserUniquePracticalCode(userId, selectedWeek, userEmail);
  const isToday = isTodayGroupPracticalDay(practicalDay);
  const isCheckedIn = checkinWeeks.includes(selectedWeek);

  const handleLogout = async () => {
    const refresh = localStorage.getItem("refreshToken");
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    logout();
    router.push("/learn/lms");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4faf7] flex items-center justify-center text-emerald-600 font-bold">
        Loading Practical Session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4faf7] text-slate-800 relative overflow-hidden font-sora">
      {/* Background overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "url('/learn/training/greenSubtract.png')",
          backgroundSize: "120px",
          backgroundRepeat: "repeat",
        }}
      />

      {/* Nav Header */}
      <nav className="h-16 flex items-center justify-between px-8 border-b border-slate-200 bg-white relative z-20">
        <div className="flex items-center gap-4">
          <img src="/logo.svg" className="h-8" alt="Oriyon" />
          <span className="text-emerald-700 font-bold">EEWYLA LMS</span>
          <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold">
            Weekly Practical Verification
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600 font-bold">👋 {firstName}</span>
          <button
            onClick={handleLogout}
            className="bg-[#00D1C1] hover:bg-[#00b8aa] text-[#002d25] px-4 py-2 rounded-lg text-sm font-bold cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-2xl mx-auto px-6 py-10 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🐐</div>
          <h1 className="text-3xl font-black text-[#002d25] mb-2">Weekly Practical Attendance</h1>
          <p className="text-slate-500 text-xs font-medium max-w-lg mx-auto">
            Give your verification code to your trainer/admin during field sessions. Admin verification is required to unlock subsequent online weeks.
          </p>
        </div>

        {/* Group Info Badge */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 mb-6 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Assigned Group</p>
            <p className="text-base font-bold text-slate-900">{groupName}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Practical Day</p>
            <span className={`inline-block text-xs font-extrabold px-3 py-1 rounded-full border ${
              isToday
                ? "bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse"
                : "bg-slate-100 text-slate-700 border-slate-200"
            }`}>
              {practicalDay} {isToday && "(Today!)"}
            </span>
          </div>
        </div>

        {/* Week Selector Grid */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 mb-6 shadow-xs">
          <p className="text-xs uppercase text-emerald-700 font-bold tracking-widest mb-3">Select Curriculum Week</p>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 11 }, (_, i) => i + 1).map((w) => {
              const done = checkinWeeks.includes(w);
              const active = selectedWeek === w;
              return (
                <button
                  key={w}
                  onClick={() => setSelectedWeek(w)}
                  className={`flex flex-col items-center justify-center py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    active
                      ? "bg-emerald-800 text-white border-emerald-900 shadow-xs"
                      : done
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span>W{w}</span>
                  <span className="text-[10px]">{done ? "✓" : "○"}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Verifiable Code Display Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-md mb-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Week {selectedWeek} Practical Code</h2>
              <p className="text-xs text-slate-500 font-medium">
                {isCheckedIn ? "Admin verified attendance for this week" : "Give this code to your admin at the field station"}
              </p>
            </div>
            {isCheckedIn ? (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-300">
                ✓ Admin Verified
              </span>
            ) : (
              <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full border border-amber-300">
                Pending Admin Submission
              </span>
            )}
          </div>

          {/* Group Verification Code Display Box */}
          <div className="bg-emerald-950 text-white rounded-2xl p-6 text-center mb-5 border border-emerald-800 shadow-sm">
            <p className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest mb-1.5">
              Your Verification Code for Week {selectedWeek}
            </p>
            <p className="text-3xl md:text-4xl font-black font-mono tracking-widest text-[#00D1C1]">
              {generatedCode}
            </p>
            <p className="text-xs text-emerald-200/90 mt-2 font-medium">
              Submit/show this code to your trainer or admin during practical session
            </p>
          </div>

          {isCheckedIn ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <p className="text-emerald-800 text-xs font-bold">
                🎉 Practical Attendance Verified by Admin for Week {selectedWeek}!
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <p className="text-amber-800 text-xs font-bold">
                📱 Present this code to your trainer. Once submitted by your admin, Week {selectedWeek + 1} will unlock automatically.
              </p>
            </div>
          )}
        </div>

        {/* Back Link */}
        <div className="text-center">
          <button
            onClick={() => goBack("/learn/lms/dashboard")}
            className="text-emerald-700 text-xs font-bold hover:underline bg-transparent border-0 cursor-pointer"
          >
            ← Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TraineePracticalAttendancePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f4faf7] text-slate-500 flex items-center justify-center">Loading...</div>}>
      <TraineePracticalAttendanceContent />
    </Suspense>
  );
}
