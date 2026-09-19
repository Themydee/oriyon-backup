"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useNavigationHistory } from "@/components/NavigationHistoryProvider";
import { authFetch, refreshAccessToken, getApiBase } from "@/lib/api";
import {
  getUserAppeals,
  saveStoredAppeal,
  canAppealWeek12Attendance,
  isWeek12AttendanceAppealApproved,
  AppealRecord,
} from "@/lib/appealsData";

const API_BASE = getApiBase();

const DAY_LABELS: Record<number, string> = {
  1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday",
};

function Week12CheckInContent() {
  const router = useRouter();
  const { goBack } = useNavigationHistory();
  const searchParams = useSearchParams();
  const { accessToken, setAccessToken, logout } = useAuthStore();

  const [userId, setUserId]       = useState("");
  const [cohortId, setCohortId]   = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [code, setCode]           = useState("");
  const [checkins, setCheckins]   = useState<number[]>([]);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [week12Allowed, setWeek12Allowed] = useState(false);

  const [appealReason, setAppealReason]         = useState("");
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const [userAppeals, setUserAppeals]           = useState<AppealRecord[]>([]);

  useEffect(() => {
    const restore = async () => {
      const refresh = localStorage.getItem("refreshToken");
      if (!refresh) { router.replace("/learn/lms"); return; }

      let token = accessToken;
      if (!token) {
        try {
          token = await refreshAccessToken();
        } catch {
          router.replace("/learn/lms");
          return;
        }
      }

      try {
        const payload = JSON.parse(atob(token!.split(".")[1]));
        const currentUserId =
          payload.userId ||
          payload.sub ||
          payload.id ||
          extractStringId(payload.user);
        if (!currentUserId) {
          setError("Failed to load your data.");
          setLoading(false);
          return;
        }

        setUserId(currentUserId);
        setUserAppeals(getUserAppeals(currentUserId));

        const userRes = await authFetch(`/users/${currentUserId}`);
        if (userRes.ok) {
          const userData = await userRes.json();
          setFirstName(userData.firstName || "");
          setLastName(userData.lastName || "");
          setUserEmail(userData.email || payload.email || "");

          const resolvedCohortId =
            userData.cohortId ||
            extractStringId(userData.cohort) ||
            (Array.isArray(userData.cohorts) && userData.cohorts.length > 0
              ? typeof userData.cohorts[0] === "string" ? userData.cohorts[0] : userData.cohorts[0]?.id || userData.cohorts[0]?._id
              : undefined) ||
            (Array.isArray(userData.cohortMembers) && userData.cohortMembers.length > 0
              ? userData.cohortMembers[0]?.cohortId || userData.cohortMembers[0]?.cohort?.id
              : undefined) ||
            payload.cohortId ||
            extractStringId(payload.cohort) ||
            "";

          setCohortId(resolvedCohortId);

          const weeksFetchUrl = resolvedCohortId ? `/lms/weeks?cohortId=${resolvedCohortId}` : `/lms/weeks`;
          const [weeksRes, progressRes] = await Promise.all([
            authFetch(weeksFetchUrl),
            authFetch(`/lms/progress/${currentUserId}`),
          ]);

          if (weeksRes.ok && progressRes.ok) {
            const weeksData = await weeksRes.json();
            const progressData = await progressRes.json();
            const week11 = Array.isArray(weeksData)
              ? weeksData.find((week: any) => week.weekNumber === 11)
              : null;
            const week11Complete = Boolean(
              week11 &&
              Array.isArray(week11.lessons) &&
              week11.lessons.length > 0 &&
              week11.lessons.every((lesson: any) =>
                Array.isArray(progressData) &&
                progressData.some(
                  (p: any) => p.lessonId === lesson.id && p.completed
                )
              )
            );

            if (!week11Complete) {
              router.replace("/learn/lms/dashboard");
              return;
            }

            setWeek12Allowed(true);
          }

          if (resolvedCohortId) {
            const checkRes = await authFetch(`/lms/week12/checkins/${resolvedCohortId}/${currentUserId}`);
            if (checkRes.ok) {
              const checkData = await checkRes.json();
              setCheckins(checkData.days || []);
            }
          }
        }
      } catch {
        setError("Failed to load your data.");
      } finally {
        setLoading(false);
      }
    };

    restore();
  }, []);

  const normalizeCode = (raw: string) =>
    raw
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^A-Z0-9-]/gi, "")
      .replace(/-+/g, "-")
      .toUpperCase();

  const extractStringId = (value: unknown): string => {
    if (!value && value !== 0) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    if (typeof value === "object" && value !== null) {
      if ("id" in value && typeof (value as any).id === "string") return (value as any).id;
      if ("_id" in value && typeof (value as any)._id === "string") return (value as any)._id;
      if ("cohortId" in value && typeof (value as any).cohortId === "string") return (value as any).cohortId;
      if ("userId" in value && typeof (value as any).userId === "string") return (value as any).userId;
      if ("sub" in value && typeof (value as any).sub === "string") return (value as any).sub;
      if ("user" in value) return extractStringId((value as any).user);
      if ("cohort" in value) return extractStringId((value as any).cohort);
      const nested = Object.values(value).find((v) => typeof v === "string" || typeof v === "number");
      return nested ? String(nested) : "";
    }
    return "";
  };

  useEffect(() => {
    const codeFromUrl = searchParams?.get("code");
    if (!codeFromUrl) return;
    setCode(normalizeCode(codeFromUrl));
  }, [searchParams]);

  const formatApiError = (data: any) => {
    if (!data) return "Invalid code. Please try again.";
    if (typeof data === "string") return data;
    if (data.error) return String(data.error);
    if (data.message) return String(data.message);
    if (data.fieldErrors) {
      const firstField = Object.keys(data.fieldErrors)[0];
      const firstError = data.fieldErrors[firstField];
      return Array.isArray(firstError)
        ? firstError.join(" ")
        : String(firstError);
    }
    if (data.formErrors) {
      if (Array.isArray(data.formErrors)) return data.formErrors.join(" ");
      return String(data.formErrors);
    }
    return JSON.stringify(data);
  };

  const handleCheckin = async () => {
    const normalizedCode = normalizeCode(code);
    if (!normalizedCode) {
      setError("Enter your check-in code.");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");

    const body: Record<string, string> = { code: normalizedCode };
    if (userId) body.userId = userId;
    if (cohortId) body.cohortId = cohortId;

    try {
      const res = await authFetch("/lms/week12/checkin", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(formatApiError(data));
      } else {
        setSuccess(formatApiError(data) || "Checked in successfully.");
        setCode("");
        // Refresh checkins
        const checkRes = await authFetch(`/lms/week12/checkins/${cohortId}/${userId}`);
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          setCheckins(checkData.days || []);
        }
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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

  const daysAttendedCount = [1, 2, 3, 4, 5].filter((d) => checkins.includes(d)).length;
  const fullyAttended = daysAttendedCount === 5;
  const appealApproved = isWeek12AttendanceAppealApproved(userId);
  const unlockedWeek13 = fullyAttended || appealApproved;

  const existingW12Appeal = userAppeals.find((a) => a.appealType === "week12_attendance");

  const handleSubmitWeek12Appeal = async () => {
    if (!appealReason.trim()) {
      setError("Please explain your ground reasons for missing 1 day.");
      return;
    }
    setSubmittingAppeal(true);
    setError("");
    setSuccess("");

    const newAppeal: AppealRecord = {
      id: `appeal-${Date.now()}`,
      userId,
      userName: `${firstName} ${lastName}`.trim() || "Trainee",
      userEmail,
      cohortId,
      appealType: "week12_attendance",
      daysAttended: daysAttendedCount,
      reason: appealReason.trim(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    try {
      await authFetch("/lms/appeals", {
        method: "POST",
        body: JSON.stringify(newAppeal),
      });
      saveStoredAppeal(newAppeal);
      setUserAppeals((prev) => [newAppeal, ...prev]);
      setSuccess("✅ Your attendance appeal has been submitted to the Admin for review.");
      setAppealReason("");
    } catch {
      saveStoredAppeal(newAppeal);
      setUserAppeals((prev) => [newAppeal, ...prev]);
      setSuccess("✅ Your attendance appeal has been submitted to the Admin for review.");
      setAppealReason("");
    } finally {
      setSubmittingAppeal(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f4faf7] flex items-center justify-center text-green-600">
      Loading...
    </div>
  );

  if (!week12Allowed) {
    return (
      <div className="min-h-screen bg-[#f4faf7] text-slate-800 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Subtle repeating greenSubtract background pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none" 
          style={{ 
            backgroundImage: "url('/learn/training/greenSubtract.png')", 
            backgroundSize: '120px', 
            backgroundRepeat: 'repeat' 
          }} 
        />
        <div className="max-w-xl w-full bg-white border border-[#e2e8f0] rounded-3xl p-10 text-center shadow-xl relative z-10">
          <p className="text-sm uppercase tracking-widest text-green-600 font-bold mb-4">
            Week 12 access blocked
          </p>
          <h1 className="text-3xl font-bold mb-4 text-[#002d25]">Complete Week 11 first</h1>
          <p className="text-slate-500 mb-6">
            Week 12 attendance is only available after your cohort completes Week 11. Return to your dashboard to continue the course.
          </p>
          <button
            type="button"
            onClick={() => goBack("/learn/lms/dashboard")}
            className="inline-flex items-center justify-center rounded-xl bg-[#00D1C1] hover:bg-[#00b8aa] px-6 py-3 text-sm font-bold text-[#002d25] transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4faf7] text-slate-800 relative overflow-hidden">
      {/* Subtle repeating greenSubtract background pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: "url('/learn/training/greenSubtract.png')", 
          backgroundSize: '120px', 
          backgroundRepeat: 'repeat' 
        }} 
      />

      {/* Nav */}
      <nav className="h-16 flex items-center justify-between px-8 border-b border-slate-200 bg-white relative z-20">
        <div className="flex items-center gap-4">
          <img src="/logo.svg" className="h-8" alt="Oriyon" />
          <span className="text-green-600 font-bold">EEWYLA LMS</span>
          <span className="text-xs bg-amber-500/10 text-amber-600 px-3 py-1 rounded-full font-bold">Week 12</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-655 font-bold">👋 {firstName}</span>
          <button onClick={handleLogout}
            className="bg-[#00D1C1] hover:bg-[#00b8aa] text-[#002d25] px-4 py-2 rounded-lg text-sm font-bold cursor-pointer">
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10 relative z-10">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🏫</div>
          <h1 className="text-3xl font-black text-[#002d25] mb-2">Week 12 Check-In</h1>
          <p className="text-slate-500 text-sm">
            Enter the daily code provided by your trainer to mark your attendance.
            You must attend all 5 days to unlock Week 13.
          </p>
        </div>

        {/* Attendance status */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 mb-8 shadow-md">
          <p className="text-xs uppercase text-green-600 font-bold tracking-widest mb-4">Your Attendance</p>
          <div className="grid grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((day) => {
              const done = checkins.includes(day);
              return (
                <div key={day} className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${
                  done
                    ? "bg-green-500/10 border-green-200"
                    : "bg-slate-50 border-slate-200"
                }`}>
                  <span className={`text-lg ${done ? "text-green-600" : "text-slate-300"}`}>
                    {done ? "✅" : "⬜"}
                  </span>
                  <span className={`text-[10px] font-bold uppercase ${done ? "text-green-600" : "text-slate-400"}`}>
                    {DAY_LABELS[day].slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>

          {unlockedWeek13 && (
            <>
              <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                <p className="text-green-700 font-bold text-sm">
                  {fullyAttended
                    ? "🎉 Full attendance confirmed — Week 13 is unlocked!"
                    : "🎉 Attendance Appeal Approved by Admin — Week 13 is unlocked!"}
                </p>
              </div>
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => router.push("/learn/lms/exams")}
                  className="inline-flex items-center justify-center rounded-xl bg-[#00D1C1] hover:bg-[#00b8aa] px-5 py-3 text-sm font-bold text-[#002d25] transition cursor-pointer font-sora"
                >
                  Go to Final Exam Portal →
                </button>
              </div>
            </>
          )}

          {/* 1-Day Missed Appeal Section */}
          {!unlockedWeek13 && canAppealWeek12Attendance(daysAttendedCount) && (
            <div className="mt-6 pt-5 border-t border-slate-100 font-sora">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
                <p className="text-xs font-bold text-amber-900">
                  ⚠️ You attended 4 out of 5 days (missed 1 day).
                </p>
                <p className="text-[11px] text-amber-800/90 mt-0.5">
                  You are eligible to submit an attendance appeal to request exam access. Please provide your ground reasons below.
                </p>
              </div>

              {existingW12Appeal ? (
                <div className={`p-4 rounded-xl border ${
                  existingW12Appeal.status === "approved"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : existingW12Appeal.status === "rejected"
                    ? "bg-rose-50 border-rose-200 text-rose-900"
                    : "bg-amber-50 border-amber-200 text-amber-900"
                }`}>
                  <p className="text-xs font-extrabold uppercase tracking-wider">
                    Appeal Status: {existingW12Appeal.status}
                  </p>
                  <p className="text-xs mt-1 font-medium italic">"{existingW12Appeal.reason}"</p>
                  {existingW12Appeal.adminNotes && (
                    <p className="text-xs mt-2 font-bold">Admin Note: {existingW12Appeal.adminNotes}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Explain Ground Reasons for Missing 1 Day
                  </label>
                  <textarea
                    rows={3}
                    value={appealReason}
                    onChange={(e) => setAppealReason(e.target.value)}
                    placeholder="Provide detailed ground reasons (e.g. medical excuse, official emergency) for missing 1 practical day..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-[#00D1C1] font-medium transition"
                  />
                  <button
                    onClick={handleSubmitWeek12Appeal}
                    disabled={submittingAppeal || !appealReason.trim()}
                    className="w-full py-3 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#002d25] font-extrabold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    {submittingAppeal ? "Submitting Appeal..." : "Submit Attendance Appeal →"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 2+ Days Missed Policy Notice */}
          {!unlockedWeek13 && !canAppealWeek12Attendance(daysAttendedCount) && daysAttendedCount < 4 && (
            <div className="mt-6 pt-4 border-t border-slate-100 text-center font-sora">
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
                <p className="text-xs font-extrabold text-rose-800 uppercase tracking-widest mb-1">
                  Policy Notice — Ineligible for Appeal
                </p>
                <p className="text-xs text-rose-700 font-medium leading-relaxed">
                  Attendance appeals are only eligible for trainees who attended at least 4 out of 5 days (missed exactly 1 day). Missing 2 or more days makes a trainee ineligible for an attendance appeal.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Check-in form */}
        {!fullyAttended && (
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-md">
            <p className="text-xs uppercase text-green-600 font-bold tracking-widest mb-4">Enter Today's Code</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2 rounded-lg mb-4">
                {success}
              </div>
            )}

            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCheckin(); } }}
              placeholder="e.g. EEWYLA-AB12-1"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00D1C1] transition font-mono tracking-widest mb-4"
            />

            <button
              onClick={handleCheckin}
              disabled={submitting || !code.trim()}
              className="w-full bg-[#00D1C1] hover:bg-[#00b8aa] text-[#002d25] font-bold py-3 rounded-xl transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Checking in..." : "Check In ✓"}
            </button>

            <p className="text-xs text-slate-500 text-center mt-3 font-medium">
              Get the daily code from your trainer at the start of each session
            </p>
          </div>
        )}

        {/* Dashboard link */}
        <div className="text-center mt-6">
          <button onClick={() => goBack("/learn/lms/dashboard")} className="text-green-600 text-sm font-bold hover:underline bg-transparent border-0 cursor-pointer">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Week12CheckIn() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f4faf7] text-slate-500 flex items-center justify-center">Loading...</div>}>
      <Week12CheckInContent />
    </Suspense>
  );
}