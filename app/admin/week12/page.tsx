"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface Cohort {
  id: string;
  name: string;
  state: string;
}

interface Code {
  id: string;
  cohortId: string;
  day: number;
  code: string;
  validDate: string;
  createdAt: string;
}

interface Checkin {
  id: string;
  userId: string;
  day: number;
  checkedInAt: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  cohortId?: string | null;
  cohort?: any;
  cohorts?: { id: string; name: string }[];
}

const DAY_LABELS: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
};

export default function Week12Page() {
  const user = useAuthStore((s) => s.user);
  const [cohorts, setCohorts]         = useState<Cohort[]>([]);
  const [selectedCohort, setSelectedCohort] = useState("");
  const [codes, setCodes]             = useState<Code[]>([]);
  const [checkins, setCheckins]       = useState<Checkin[]>([]);
  const [users, setUsers]             = useState<User[]>([]);
  const [loading, setLoading]         = useState(true);
  const [generating, setGenerating]   = useState<number | null>(null);
  const [error, setError]             = useState("");
  const [activeTab, setActiveTab]     = useState<"codes" | "attendance">("codes");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res  = await authFetch("/cohorts");
        if (res.ok) {
          const data = await res.json();
          const cohortList = Array.isArray(data)
            ? data
            : Array.isArray(data?.cohorts)
            ? data.cohorts
            : Array.isArray(data?.data)
            ? data.data
            : [];
          if (cohortList.length > 0) {
            setCohorts(cohortList);
            setSelectedCohort((prev) => (prev ? prev : cohortList[0].id));
          }
        } else {
          setError("Failed to load cohorts.");
        }
      } catch {
        setError("Failed to load cohorts.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedCohort) return;
    fetchCodesAndAttendance();
  }, [selectedCohort]);

  const fetchCodesAndAttendance = async () => {
    setLoading(true);
    setError("");
    try {
      const [codesRes, checkinsRes, cohortRes, groupsRes] = await Promise.all([
        authFetch(`/lms/week12/codes/${selectedCohort}`),
        authFetch(`/lms/week12/checkins/${selectedCohort}`),
        authFetch(`/cohorts/${selectedCohort}`),
        authFetch(`/cohorts/${selectedCohort}/groups`),
      ]);

      if (codesRes.ok) {
        const data = await codesRes.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.codes)
          ? data.codes
          : Array.isArray(data?.data)
          ? data.data
          : [];
        setCodes(list);
      }

      if (checkinsRes.ok) {
        const data = await checkinsRes.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.checkins)
          ? data.checkins
          : Array.isArray(data?.data)
          ? data.data
          : [];
        setCheckins(list);
      }

      // We ONLY want users who are enrolled AND assigned to a group in this cohort
      const groupedUserMap = new Map<string, User>();

      // Extract members assigned to groups within this cohort
      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        const groupsList = Array.isArray(groupsData)
          ? groupsData
          : Array.isArray(groupsData?.groups)
          ? groupsData.groups
          : Array.isArray(groupsData?.data)
          ? groupsData.data
          : [];

        groupsList.forEach((g: any) => {
          const members = Array.isArray(g?.members) ? g.members : [];
          members.forEach((m: any) => {
            const userId = m.id || m.userId;
            if (userId) {
              groupedUserMap.set(userId, {
                id: userId,
                firstName: m.firstName || m.user?.firstName || "Trainee",
                lastName: m.lastName || m.user?.lastName || "",
                email: m.email || m.user?.email || "",
                role: m.role || m.user?.role || "trainee",
                cohortId: selectedCohort,
              });
            }
          });
        });
      }

      // Cross-reference with cohort members endpoint for additional profile details if needed
      if (cohortRes.ok) {
        const cohortData = await cohortRes.json();
        const cohortMembers = Array.isArray(cohortData?.members)
          ? cohortData.members
          : Array.isArray(cohortData)
          ? cohortData
          : [];

        cohortMembers.forEach((cm: any) => {
          const userId = cm.id || cm.userId;
          if (userId && groupedUserMap.has(userId)) {
            const existing = groupedUserMap.get(userId)!;
            groupedUserMap.set(userId, {
              ...existing,
              firstName: cm.firstName || cm.user?.firstName || existing.firstName,
              lastName: cm.lastName || cm.user?.lastName || existing.lastName,
              email: cm.email || cm.user?.email || existing.email,
              role: cm.role || cm.user?.role || existing.role,
            });
          }
        });
      }

      // Enrich details (firstName, lastName, email) from /users for grouped members
      try {
        const res = await authFetch("/users?page=1&limit=1000");
        if (res.ok) {
          const data = await res.json();
          const pageUsers = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
          pageUsers.forEach((u: any) => {
            if (groupedUserMap.has(u.id)) {
              const existing = groupedUserMap.get(u.id)!;
              groupedUserMap.set(u.id, {
                ...existing,
                firstName: u.firstName || existing.firstName,
                lastName: u.lastName || existing.lastName,
                email: u.email || existing.email,
                role: u.role || existing.role,
              });
            }
          });
        }
      } catch {}

      setUsers(Array.from(groupedUserMap.values()));
    } catch {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async (day: number) => {
    setGenerating(day);
    setError("");
    try {
      const token = useAuthStore.getState().accessToken;
      let createdBy = user?.id;
      if (!createdBy && token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          createdBy = payload.userId || payload.sub || payload.id;
        } catch {}
      }
      if (!createdBy) {
        setError("Session expired. Please log in again.");
        setGenerating(null);
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      const res = await authFetch("/lms/week12/codes", {
        method: "POST",
        body: JSON.stringify({
          cohortId: selectedCohort,
          day,
          validDate: today,
          createdBy,
        }),
      });

      if (res.ok) {
        fetchCodesAndAttendance();
      } else {
        const data = await res.json();
        setError(data.error || data.message || "Failed to generate code.");
      }
    } catch {
      setError("Failed to generate code.");
    } finally {
      setGenerating(null);
    }
  };

  const safeCodes = Array.isArray(codes) ? codes : [];
  const safeCheckins = Array.isArray(checkins) ? checkins : [];
  const safeUsers = Array.isArray(users) ? users : [];

  // Get today's code for a day
  const getTodayCode = (day: number) => {
    const today = new Date().toISOString().split("T")[0];
    return safeCodes.find((c) => c.day === day && c.validDate === today);
  };

  // Get all codes for a day
  const getDayCodes = (day: number) => safeCodes.filter((c) => c.day === day);

  // Get checkins for a user across all days
  const getUserCheckins = (userId: string) =>
    safeCheckins.filter((c) => c.userId === userId).map((c) => c.day);

  // Check if user has full attendance
  const hasFullAttendance = (userId: string) => {
    const days = getUserCheckins(userId);
    return [1, 2, 3, 4, 5].every((d) => days.includes(d));
  };

  // Count how many trainees have full attendance
  const fullyAttendedCount = safeUsers.filter((u) => hasFullAttendance(u.id)).length;

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading...</div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-1">Week 12 — Attendance</h1>
        <p className="text-slate-500 text-sm">Generate daily check-in codes and monitor attendance</p>
      </div>

      {/* Cohort selector */}
      {cohorts.length > 1 && (
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Cohort</label>
          <select
            value={selectedCohort}
            onChange={(e) => setSelectedCohort(e.target.value)}
            className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition shadow-2xs font-medium"
          >
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>{c.name} · {c.state}</option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm px-4 py-3 rounded-xl mb-6 shadow-2xs font-medium">{error}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 text-center shadow-xs">
          <p className="text-2xl font-black text-slate-900">{users.length}</p>
          <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mt-1">Total Trainees</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 text-center shadow-xs">
          <p className="text-2xl font-black text-emerald-700">{fullyAttendedCount}</p>
          <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mt-1">Full Attendance</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 text-center shadow-xs">
          <p className="text-2xl font-black text-rose-600">{users.length - fullyAttendedCount}</p>
          <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mt-1">Incomplete</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["codes", "attendance"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition ${
              activeTab === t
                ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs"
                : "bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t === "codes" ? "📅 Daily Codes" : "✅ Attendance Matrix"}
          </button>
        ))}
      </div>

      {/* CODES TAB */}
      {activeTab === "codes" && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-slate-500 font-medium">
            Generate a new code each morning. Trainees enter it in the LMS to check in for that day.
            Each code is valid for today only.
          </p>
          {[1, 2, 3, 4, 5].map((day) => {
            const todayCode = getTodayCode(day);
            const allCodes  = getDayCodes(day);
            const checkedIn = checkins.filter((c) => c.day === day).length;

            return (
              <div key={day} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-bold text-slate-900 text-base">Day {day} — {DAY_LABELS[day]}</p>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">{checkedIn} trainee{checkedIn !== 1 ? "s" : ""} checked in</p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {todayCode ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-center shadow-2xs">
                        <p className="text-[10px] text-emerald-800 uppercase font-extrabold tracking-widest mb-0.5">Today's Code</p>
                        <p className="text-xl font-black text-emerald-700 tracking-widest">{todayCode.code}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 font-medium">No code generated today</p>
                    )}

                    <button
                      onClick={() => generateCode(day)}
                      disabled={generating === day}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs disabled:opacity-50"
                    >
                      {generating === day ? "Generating..." : todayCode ? "Regenerate" : "Generate Code"}
                    </button>
                  </div>
                </div>

                {/* Previous codes */}
                {allCodes.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">All generated codes for Day {day}</p>
                    <div className="flex flex-wrap gap-2">
                      {allCodes.map((c) => (
                        <span key={c.id} className={`text-xs px-3 py-1 rounded-lg border font-mono font-medium ${
                          c.validDate === new Date().toISOString().split("T")[0]
                            ? "border-emerald-300 text-emerald-800 bg-emerald-50"
                            : "border-slate-200 text-slate-600 bg-slate-50"
                        }`}>
                          {c.code} <span className="text-slate-400">· {c.validDate}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ATTENDANCE TAB */}
      {activeTab === "attendance" && (
        <div>
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            {/* Table header */}
            <div className="grid grid-cols-7 gap-0 border-b border-slate-200 bg-slate-50/70 px-4 py-3">
              <div className="col-span-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Trainee</div>
              {[1, 2, 3, 4, 5].map((d) => (
                <div key={d} className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">
                  {DAY_LABELS[d].slice(0, 3)}
                </div>
              ))}
            </div>

            {/* Rows */}
            {users.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm font-medium">No trainees found for this cohort</div>
            ) : (
              users.map((u) => {
                const userDays = getUserCheckins(u.id);
                const full     = hasFullAttendance(u.id);
                return (
                  <div key={u.id} className={`grid grid-cols-7 gap-0 border-b border-slate-100 last:border-0 px-4 py-3 transition ${
                    full ? "bg-emerald-50/40" : "hover:bg-slate-50/50"
                  }`}>
                    <div className="col-span-2 flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                        full ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}>
                        {u.firstName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{u.firstName} {u.lastName}</p>
                        <p className="text-[10px] text-slate-500 truncate font-medium">{u.email}</p>
                      </div>
                    </div>
                    {[1, 2, 3, 4, 5].map((d) => (
                      <div key={d} className="flex items-center justify-center">
                        {userDays.includes(d)
                          ? <span className="text-emerald-600 font-bold text-base">✓</span>
                          : <span className="text-slate-300 font-bold text-base">✕</span>
                        }
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-xs text-slate-500 font-medium">
            <span><span className="text-emerald-600 font-bold">✓</span> Checked in</span>
            <span><span className="text-slate-300 font-bold">✕</span> Absent</span>
            <span className="ml-auto text-emerald-700 font-extrabold">{fullyAttendedCount}/{users.length} eligible for Week 13</span>
          </div>
        </div>
      )}
    </div>
  );
}