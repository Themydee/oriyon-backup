"use client";

import { useState, useEffect, useMemo } from "react";
import { authFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { popup } from "@/components/layout/PopupProvider";
import { getStoredPracticalCheckins, saveStoredPracticalCheckin, clearStoredPracticalCheckins, PracticalCheckin } from "@/lib/practicalData";

interface Cohort {
  id: string;
  name: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  cohortId?: string | null;
  groupId?: string | null;
  assignedLga?: string | null;
  assignedState?: string | null;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  level: "global" | "state" | "zone" | "cooperative" | "trainers" | "trainees";
  isPinned?: boolean;
  postedBy?: string;
  createdAt: string;
}

export default function CorperHubPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);

  const [activeTab, setActiveTab] = useState<"announcements" | "practical" | "week12">("announcements");

  // General State
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Announcements State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annLevel, setAnnLevel] = useState<"global" | "state" | "zone" | "cooperative" | "trainees">("trainees");
  const [annPinned, setAnnPinned] = useState(false);
  const [annSubmitting, setAnnSubmitting] = useState(false);

  // Practical Attendance State
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [practicalCode, setPracticalCode] = useState("");
  const [selectedTraineeId, setSelectedTraineeId] = useState("");
  const [practicalVerifying, setPracticalVerifying] = useState(false);
  const [practicalRecords, setPracticalRecords] = useState<Record<string, Record<number, boolean>>>({});

  // Week 12 Physical Attendance State
  const [week12Codes, setWeek12Codes] = useState<any[]>([]);
  const [week12Attendance, setWeek12Attendance] = useState<Record<string, Record<number, boolean>>>({});
  const [week12Updating, setWeek12Updating] = useState<string | null>(null);

  // Trainee Search
  const [traineeSearch, setTraineeSearch] = useState("");

  // Initial Load
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError("");
    try {
      const [cohortsRes, usersRes, annRes] = await Promise.all([
        authFetch("/cohorts"),
        authFetch("/users?limit=1000"),
        authFetch("/cooperative/announcements/broadcast"),
      ]);

      if (cohortsRes.ok) {
        const cData = await cohortsRes.json();
        const cList = Array.isArray(cData) ? cData : cData?.data || [];
        setCohorts(cList);
        if (cList.length > 0) setSelectedCohortId(cList[0].id);
      }

      if (usersRes.ok) {
        const uData = await usersRes.json();
        const uList = Array.isArray(uData) ? uData : uData?.data || uData?.users || [];
        setUsers(uList);
      }

      if (annRes.ok) {
        const aData = await annRes.json();
        const aList = Array.isArray(aData) ? aData : aData?.announcements || [];
        setAnnouncements(aList);
      }
    } catch (err: any) {
      setError("Failed to load initial portal data.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Attendance when cohort changes
  useEffect(() => {
    if (!selectedCohortId) return;
    fetchPracticalAttendance();
    fetchWeek12Attendance();
  }, [selectedCohortId]);

  const fetchPracticalAttendance = async () => {
    try {
      const res = await authFetch(`/lms/practical/checkins/${selectedCohortId}`);
      let serverCheckins: any[] = [];
      if (res.ok) {
        const data = await res.json();
        serverCheckins = Array.isArray(data) ? data : data?.checkins || [];
        clearStoredPracticalCheckins(selectedCohortId);
        serverCheckins.forEach((c) => saveStoredPracticalCheckin(c));
      }

      const localCheckins = getStoredPracticalCheckins().filter((c) => c.cohortId === selectedCohortId);

      const matrix: Record<string, Record<string, boolean>> = {};

      const addCheckinToMatrix = (c: any) => {
        const uId = c.userId || c.user_id;
        const wNum = c.weekNumber || c.week_number || c.week;
        if (uId && wNum) {
          if (!matrix[uId]) matrix[uId] = {};
          matrix[uId][wNum] = true;
        }
      };

      serverCheckins.forEach(addCheckinToMatrix);
      localCheckins.forEach(addCheckinToMatrix);

      setPracticalRecords(matrix);
    } catch (err) {
      console.error("fetchPracticalAttendance error:", err);
    }
  };

  const fetchWeek12Attendance = async () => {
    try {
      const [codesRes, attRes] = await Promise.all([
        authFetch(`/lms/week12/codes?cohortId=${selectedCohortId}`),
        authFetch(`/lms/week12/attendance?cohortId=${selectedCohortId}`),
      ]);

      if (codesRes.ok) setWeek12Codes(await codesRes.json());
      if (attRes.ok) {
        const attData = await attRes.json();
        setWeek12Attendance(attData.matrix || {});
      }
    } catch {}
  };

  // 1. Post Announcement
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) {
      setError("Announcement title and content are required.");
      return;
    }

    setAnnSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        title: annTitle.trim(),
        content: annContent.trim(),
        level: annLevel,
        isPinned: annPinned,
        postedBy: user?.firstName ? `${user.firstName} ${user.lastName} (Corper)` : "Field Officer",
      };

      const res = await authFetch("/cooperative/announcements/broadcast", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || "Failed to broadcast announcement.");
      }

      setSuccess("📢 Announcement published successfully!");
      setAnnTitle("");
      setAnnContent("");
      setAnnPinned(false);

      // Refresh list
      const annRes = await authFetch("/cooperative/announcements/broadcast");
      if (annRes.ok) {
        const aData = await annRes.json();
        setAnnouncements(Array.isArray(aData) ? aData : aData?.announcements || []);
      }
    } catch (err: any) {
      setError(err.message || "Error posting announcement.");
    } finally {
      setAnnSubmitting(false);
    }
  };

  // 2. Submit Weekly Practical Attendance Code
  const handleVerifyPracticalCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTraineeId) {
      setError("Please select a trainee.");
      return;
    }
    if (!practicalCode.trim()) {
      setError("Please enter the trainee's weekly practical code.");
      return;
    }

    setPracticalVerifying(true);
    setError("");
    setSuccess("");

    try {
      const targetUser = cohortUsers.find((u) => u.id === selectedTraineeId);
      const codeSubmitted = practicalCode.trim().toUpperCase();

      const newCheckin: PracticalCheckin = {
        id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        cohortId: selectedCohortId,
        groupId: targetUser?.groupId || "",
        userId: selectedTraineeId,
        weekNumber: selectedWeek,
        codeSubmitted,
        checkedInAt: new Date().toISOString(),
        verifiedBy: user?.id,
      };

      saveStoredPracticalCheckin(newCheckin);

      const res = await authFetch("/lms/practical/checkins", {
        method: "POST",
        body: JSON.stringify({
          cohortId: selectedCohortId,
          userId: selectedTraineeId,
          groupId: targetUser?.groupId || null,
          weekNumber: selectedWeek,
          codeSubmitted,
          verifiedBy: user?.id,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || "Failed to record practical attendance check-in.");
      }

      setSuccess(`✅ Trainee verified and checked in for Week ${selectedWeek}!`);
      setPracticalCode("");
      await fetchPracticalAttendance();
    } catch (err: any) {
      setError(err.message || "Failed to verify practical attendance code.");
    } finally {
      setPracticalVerifying(false);
    }
  };

  // 3. Toggle Week 12 Physical Check-in Day
  const handleToggleWeek12Day = async (userId: string, day: number, currentStatus: boolean) => {
    setWeek12Updating(`${userId}_${day}`);
    setError("");
    setSuccess("");

    try {
      const res = await authFetch("/lms/week12/toggle-checkin", {
        method: "POST",
        body: JSON.stringify({
          userId,
          cohortId: selectedCohortId,
          day,
          status: !currentStatus,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || "Failed to update check-in.");
      }

      setSuccess(`Updated Day ${day} attendance status.`);
      fetchWeek12Attendance();
    } catch (err: any) {
      setError(err.message || "Failed to toggle check-in.");
    } finally {
      setWeek12Updating(null);
    }
  };

  // Filtered Users
  const cohortUsers = useMemo(() => {
    let list = users;
    if (selectedCohortId) {
      list = list.filter((u) => u.cohortId === selectedCohortId || !u.cohortId);
    }
    if (traineeSearch.trim()) {
      const q = traineeSearch.toLowerCase().trim();
      list = list.filter(
        (u) =>
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          `${u.assignedLga || ""} ${u.assignedState || ""}`.toLowerCase().includes(q)
      );
    }

    const isOgb = (u: any) => {
      const str = `${u.assignedLga || ""} ${u.assignedState || ""} ${u.address || ""}`.toLowerCase();
      return str.includes("ogbomoso") || str.includes("ogbomosho") || str.includes("lautech");
    };

    return [...list].sort((a, b) => {
      const aOgb = isOgb(a);
      const bOgb = isOgb(b);
      if (aOgb && !bOgb) return -1;
      if (!aOgb && bOgb) return 1;
      return 0;
    });
  }, [users, selectedCohortId, traineeSearch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4faf7] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 font-bold text-sm tracking-wide uppercase">Loading Corper Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4faf7] text-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER SECTION */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-full uppercase tracking-wider">
                Field Operations
              </span>
              <span className="text-xs text-slate-500 font-semibold">• Corper Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">Corper Operational Hub 🎖️</h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1 font-medium">
              Broadcast announcements and verify trainee practical & physical attendance records.
            </p>
          </div>

          {/* Quick Stat Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-center">
              <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">Notices</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{announcements.length}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-center">
              <p className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-800">Trainees</p>
              <p className="text-xl font-black text-emerald-900 mt-0.5">{cohortUsers.length}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 text-center">
              <p className="text-[10px] uppercase tracking-wider font-extrabold text-blue-800">Cohorts</p>
              <p className="text-xl font-black text-blue-900 mt-0.5">{cohorts.length}</p>
            </div>
          </div>
        </div>

        {/* FEEDBACK MESSAGES */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold p-4 rounded-2xl flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError("")} className="text-rose-500 hover:text-rose-800 font-black">✕</button>
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold p-4 rounded-2xl flex items-center justify-between">
            <span>{success}</span>
            <button onClick={() => setSuccess("")} className="text-emerald-600 hover:text-emerald-900 font-black">✕</button>
          </div>
        )}

        {/* COHORT SELECTOR & NAVIGATION TABS */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300/60">
            <button
              onClick={() => setActiveTab("announcements")}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "announcements"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-700 hover:bg-slate-300/50"
              }`}
            >
              <span>📢</span>
              <span>Post Announcements</span>
            </button>
            <button
              onClick={() => setActiveTab("practical")}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "practical"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-700 hover:bg-slate-300/50"
              }`}
            >
              <span>🐐</span>
              <span>Weekly Practical</span>
            </button>
            <button
              onClick={() => setActiveTab("week12")}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "week12"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-700 hover:bg-slate-300/50"
              }`}
            >
              <span>🗓️</span>
              <span>Week 12 Physical</span>
            </button>
          </div>

          {/* Active Cohort Dropdown */}
          {cohorts.length > 0 && (
            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Cohort:</span>
              <select
                value={selectedCohortId}
                onChange={(e) => setSelectedCohortId(e.target.value)}
                className="bg-transparent text-xs font-black text-slate-900 focus:outline-none cursor-pointer"
              >
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ── TAB 1: ANNOUNCEMENTS ── */}
        {activeTab === "announcements" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Create Announcement Form */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>📢</span> Broadcast New Announcement
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Publish updates directly to trainees on their LMS dashboard.
                </p>
              </div>

              <form onSubmit={handlePostAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="e.g. Practical Field Meeting — Venue Change"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 bg-slate-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
                      Audience Level
                    </label>
                    <select
                      value={annLevel}
                      onChange={(e: any) => setAnnLevel(e.target.value)}
                      className="w-full px-3 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 bg-slate-50"
                    >
                      <option value="trainees">Trainees Broadcast</option>
                      <option value="global">Global Portal</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={annPinned}
                        onChange={(e) => setAnnPinned(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Pin to Top 📌</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
                    Announcement Body *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    placeholder="Write your announcement details here..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 bg-slate-50 font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={annSubmitting}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {annSubmitting ? "Publishing Notice..." : "Publish Announcement 🚀"}
                </button>
              </form>
            </div>

            {/* Published Announcements Feed */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Recent Notices Feed</h2>
                  <p className="text-xs text-slate-500 font-medium">Currently active announcements across LMS</p>
                </div>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                  {announcements.length} Posted
                </span>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {announcements.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                    No announcements posted yet.
                  </div>
                ) : (
                  announcements.map((ann, idx) => (
                    <div
                      key={ann.id || idx}
                      className="p-4 bg-slate-50 hover:bg-emerald-50/40 border border-slate-200/80 rounded-2xl transition space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-800 text-[10px] font-black rounded uppercase">
                            {ann.level || "trainees"}
                          </span>
                          {ann.isPinned && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded">
                              📌 Pinned
                            </span>
                          )}
                          <h3 className="font-extrabold text-sm text-slate-900">{ann.title}</h3>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold pt-1">
                        <span>Posted by: {ann.postedBy || "Admin"}</span>
                        <span>
                          {ann.createdAt
                            ? new Date(ann.createdAt).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : ""}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: WEEKLY PRACTICAL ATTENDANCE ── */}
        {activeTab === "practical" && (
          <div className="space-y-6">
            {/* Practical Attendance Verification Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>🐐</span> Verify Weekly Practical Code
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Enter the unique weekly attendance code presented by a trainee to verify field attendance.
                </p>
              </div>

              <form onSubmit={handleVerifyPracticalCode} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-3">
                  <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
                    Select Week
                  </label>
                  <select
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:outline-none focus:border-emerald-600"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                      <option key={w} value={w}>
                        Week {w} Practical
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
                    Select Trainee
                  </label>
                  <select
                    value={selectedTraineeId}
                    onChange={(e) => setSelectedTraineeId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:outline-none focus:border-emerald-600"
                  >
                    <option value="">-- Choose Trainee --</option>
                    {cohortUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1">
                    Attendance Code
                  </label>
                  <input
                    type="text"
                    value={practicalCode}
                    onChange={(e) => setPracticalCode(e.target.value.toUpperCase())}
                    placeholder="e.g. PR-8A9X2"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 bg-slate-50 uppercase focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={practicalVerifying}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                  >
                    {practicalVerifying ? "Verifying..." : "Verify Code ✓"}
                  </button>
                </div>
              </form>
            </div>

            {/* Practical Attendance Matrix */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Cohort Practical Attendance Matrix</h2>
                  <p className="text-xs text-slate-500 font-medium">Recorded weekly practical completions for trainees</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={async () => {
                      const confirmed = window.confirm(`⚠️ ARE YOU SURE YOU WANT TO DELETE ALL ATTENDANCE FOR WEEK ${selectedWeek}?\n\nThis will clear check-ins for Week ${selectedWeek} in the database and reflect across all portals.`);
                      if (!confirmed) return;
                      try {
                        const res = await authFetch(`/lms/practical/checkins/${selectedCohortId}?week=${selectedWeek}`, { method: "DELETE" });
                        if (res.ok) {
                          clearStoredPracticalCheckins(selectedCohortId, selectedWeek);
                          fetchPracticalAttendance();
                          popup.alert(`✓ Successfully deleted attendance records for Week ${selectedWeek}.`);
                        } else {
                          popup.alert("Failed to reset attendance for week.");
                        }
                      } catch {
                        popup.alert("Failed to reset attendance for week.");
                      }
                    }}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-2xs transition shrink-0 cursor-pointer"
                  >
                    🗑️ Reset Week {selectedWeek} Attendance
                  </button>
                  <input
                    type="text"
                    value={traineeSearch}
                    onChange={(e) => setTraineeSearch(e.target.value)}
                    placeholder="Filter trainee..."
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-emerald-600 w-full sm:w-64"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full border-separate border-spacing-0">
                  <thead className="bg-slate-100">
                    <tr className="text-left text-[10px] uppercase tracking-wider text-slate-600 font-bold">
                      <th className="py-3 px-4 border-b border-slate-200">Trainee</th>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                        <th key={w} className="py-3 px-2 border-b border-slate-200 text-center">
                          W{w}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cohortUsers.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="py-8 text-center text-xs text-slate-400 bg-slate-50">
                          No trainees found for this cohort.
                        </td>
                      </tr>
                    ) : (
                      cohortUsers.map((u) => {
                        const userRecord = practicalRecords[u.id] || {};
                        return (
                          <tr key={u.id} className="hover:bg-slate-50 transition border-b border-slate-100">
                            <td className="py-3 px-4 border-b border-slate-200">
                              <div className="font-bold text-xs text-slate-900">{u.firstName} {u.lastName}</div>
                              <div className="text-[10px] text-slate-400">{u.email}</div>
                            </td>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => {
                              const attended = Boolean(userRecord[w]);
                              return (
                                <td key={w} className="py-3 px-2 border-b border-slate-200 text-center">
                                  <span
                                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black ${
                                      attended
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-slate-100 text-slate-400"
                                    }`}
                                  >
                                    {attended ? "✓" : "—"}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: WEEK 12 PHYSICAL ATTENDANCE ── */}
        {activeTab === "week12" && (
          <div className="space-y-6">
            {/* Week 12 Code Display Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>🗓️</span> Week 12 Physical Check-in Codes
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Daily check-in codes generated for physical attendance validation.
                  </p>
                </div>
                <button
                  onClick={fetchWeek12Attendance}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
                >
                  Refresh Codes
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { day: 1, label: "Day 1 (Mon)" },
                  { day: 2, label: "Day 2 (Tue)" },
                  { day: 3, label: "Day 3 (Wed)" },
                  { day: 4, label: "Day 4 (Thu)" },
                  { day: 5, label: "Day 5 (Fri)" },
                ].map((d) => {
                  const codeObj = week12Codes.find((c) => c.day === d.day);
                  return (
                    <div
                      key={d.day}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1"
                    >
                      <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500">
                        {d.label}
                      </p>
                      <p className="text-sm font-mono font-black text-emerald-800 tracking-wider">
                        {codeObj?.code || "— — —"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5-Day Attendance Toggle Matrix */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900">5-Day Physical Attendance Matrix</h2>
                  <p className="text-xs text-slate-500 font-medium">Click on any day pill to mark or toggle trainee check-in</p>
                </div>
                <input
                  type="text"
                  value={traineeSearch}
                  onChange={(e) => setTraineeSearch(e.target.value)}
                  placeholder="Filter trainee..."
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-emerald-600 w-full sm:w-64"
                />
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full border-separate border-spacing-0">
                  <thead className="bg-slate-100">
                    <tr className="text-left text-[10px] uppercase tracking-wider text-slate-600 font-bold">
                      <th className="py-3 px-4 border-b border-slate-200">Trainee</th>
                      {[1, 2, 3, 4, 5].map((d) => (
                        <th key={d} className="py-3 px-3 border-b border-slate-200 text-center">
                          Day {d}
                        </th>
                      ))}
                      <th className="py-3 px-4 border-b border-slate-200 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohortUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-slate-400 bg-slate-50">
                          No trainees found.
                        </td>
                      </tr>
                    ) : (
                      cohortUsers.map((u) => {
                        const userAtt = week12Attendance[u.id] || {};
                        const daysAttendedCount = [1, 2, 3, 4, 5].filter((d) => userAtt[d]).length;
                        const isFull = daysAttendedCount === 5;

                        return (
                          <tr key={u.id} className="hover:bg-slate-50 transition border-b border-slate-100">
                            <td className="py-3 px-4 border-b border-slate-200">
                              <div className="font-bold text-xs text-slate-900">{u.firstName} {u.lastName}</div>
                              <div className="text-[10px] text-slate-400">{u.email}</div>
                            </td>
                            {[1, 2, 3, 4, 5].map((d) => {
                              const checked = Boolean(userAtt[d]);
                              const isUpdating = week12Updating === `${u.id}_${d}`;
                              return (
                                <td key={d} className="py-3 px-3 border-b border-slate-200 text-center">
                                  <button
                                    onClick={() => handleToggleWeek12Day(u.id, d, checked)}
                                    disabled={isUpdating}
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-black transition cursor-pointer ${
                                      checked
                                        ? "bg-emerald-600 text-white shadow-2xs"
                                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    } ${isUpdating ? "opacity-40" : ""}`}
                                  >
                                    {isUpdating ? "..." : checked ? "Present ✓" : "Absent"}
                                  </button>
                                </td>
                              );
                            })}
                            <td className="py-3 px-4 border-b border-slate-200 text-center">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                  isFull
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                    : "bg-amber-100 text-amber-800 border border-amber-300"
                                }`}
                              >
                                {daysAttendedCount}/5 Days
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
