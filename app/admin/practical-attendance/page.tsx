"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  generateUserUniquePracticalCode,
  generateGroupPracticalCode,
  normalizePracticalCode,
  verifyRollingTOTP,
  getStoredPracticalCheckins,
  saveStoredPracticalCheckin,
  clearStoredPracticalCheckins,
  PracticalCheckin,
} from "@/lib/practicalData";

interface Cohort {
  id: string;
  name: string;
  state: string;
}

interface Group {
  id: string;
  name: string;
  practicalDay?: string;
  memberCount?: number;
  members?: any[];
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  groupId?: string;
  groupName?: string;
  practicalDay?: string;
}

const WEEK_OPTIONS = Array.from({ length: 11 }, (_, i) => i + 1);

export default function AdminPracticalAttendancePage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);

  const [cohorts, setCohorts]                   = useState<Cohort[]>([]);
  const [selectedCohort, setSelectedCohort]     = useState("");
  const [selectedWeek, setSelectedWeek]         = useState<number>(1);
  const [selectedGroup, setSelectedGroup]       = useState<string>("");
  const [groups, setGroups]                     = useState<Group[]>([]);
  const [users, setUsers]                       = useState<User[]>([]);
  const [checkins, setCheckins]                 = useState<PracticalCheckin[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState("");
  const [success, setSuccess]                   = useState("");

  // Code Submission State
  const [submittedCodeInput, setSubmittedCodeInput] = useState("");
  const [selectedStudentId, setSelectedStudentId]   = useState("");
  const [submittingCode, setSubmittingCode]         = useState(false);
  const [resettingAttendance, setResettingAttendance] = useState(false);
  const [activeTab, setActiveTab]                   = useState<"submit" | "matrix" | "group_codes">("submit");

  // Role validation check (Admin / Trainer / Lead Trainer only)
  const userPayload = token ? (() => {
    try { return JSON.parse(atob(token.split(".")[1])); } catch { return null; }
  })() : null;
  const userRole = userPayload?.role || user?.role || "";
  const isAuthorized = ["admin", "trainer", "lead_trainer"].includes(userRole);

  useEffect(() => {
    const loadCohorts = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await authFetch("/cohorts");
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data?.data || data?.cohorts || [];
          if (list.length > 0) {
            setCohorts(list);
            setSelectedCohort(list[0].id);
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
    loadCohorts();
  }, []);

  useEffect(() => {
    if (!selectedCohort) return;
    fetchGroupAndCheckinData();
  }, [selectedCohort, selectedWeek]);

  const fetchGroupAndCheckinData = async () => {
    setLoading(true);
    setError("");
    try {
      const [groupsRes, cohortRes] = await Promise.all([
        authFetch(`/cohorts/${selectedCohort}/groups`),
        authFetch(`/cohorts/${selectedCohort}`),
      ]);

      let groupList: Group[] = [];
      if (groupsRes.ok) {
        const gData = await groupsRes.json();
        groupList = Array.isArray(gData) ? gData : gData?.groups || gData?.data || [];
        setGroups(groupList);
        if (groupList.length > 0 && !selectedGroup) {
          setSelectedGroup(groupList[0].id);
        }
      }

      // Collect user list from groups
      const userMap = new Map<string, User>();

      groupList.forEach((g) => {
        const members = Array.isArray(g.members) ? g.members : [];
        members.forEach((m: any) => {
          const uId = m.id || m.userId;
          if (uId) {
            userMap.set(uId, {
              id: uId,
              firstName: m.firstName || m.user?.firstName || "Trainee",
              lastName: m.lastName || m.user?.lastName || "",
              email: m.email || m.user?.email || "",
              role: m.role || m.user?.role || "trainee",
              groupId: g.id,
              groupName: g.name,
              practicalDay: g.practicalDay || "Monday",
            });
          }
        });
      });

      if (cohortRes.ok) {
        const cData = await cohortRes.json();
        const cMembers = Array.isArray(cData?.members) ? cData.members : [];
        cMembers.forEach((cm: any) => {
          const uId = cm.id || cm.userId;
          if (uId && userMap.has(uId)) {
            const existing = userMap.get(uId)!;
            userMap.set(uId, {
              ...existing,
              firstName: cm.firstName || cm.user?.firstName || existing.firstName,
              lastName: cm.lastName || cm.user?.lastName || existing.lastName,
              email: cm.email || cm.user?.email || existing.email,
            });
          }
        });
      }

      const allUsers = Array.from(userMap.values());
      setUsers(allUsers);

      // Load checkins
      try {
        const checkRes = await authFetch(`/lms/practical/checkins/${selectedCohort}?week=${selectedWeek}`);
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          setCheckins(Array.isArray(checkData) ? checkData : checkData?.checkins || []);
        } else {
          const localCheckins = getStoredPracticalCheckins().filter(
            (c) => c.cohortId === selectedCohort && c.weekNumber === selectedWeek
          );
          setCheckins(localCheckins);
        }
      } catch {
        const localCheckins = getStoredPracticalCheckins().filter(
          (c) => c.cohortId === selectedCohort && c.weekNumber === selectedWeek
        );
        setCheckins(localCheckins);
      }
    } catch {
      setError("Failed to load attendance data.");
    } finally {
      setLoading(false);
    }
  };

  const isCheckedIn = (userId: string) => {
    return checkins.some((c) => c.userId === userId && c.weekNumber === selectedWeek);
  };

  const handleManualCheckinUser = async (targetUser: User, codeSubmitted: string) => {
    const isUuid = (val: any) => typeof val === "string" && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);
    const validVerifiedBy = isUuid(user?.id) ? user!.id : null;

    const newCheckin: PracticalCheckin = {
      id: `chk-admin-${Date.now()}`,
      cohortId: selectedCohort,
      groupId: targetUser.groupId || "group-1",
      userId: targetUser.id,
      weekNumber: selectedWeek,
      codeSubmitted,
      checkedInAt: new Date().toISOString(),
      verifiedBy: validVerifiedBy || undefined,
    };

    saveStoredPracticalCheckin(newCheckin);
    setCheckins((prev) => [newCheckin, ...prev.filter((c) => c.userId !== targetUser.id || c.weekNumber !== selectedWeek)]);

    try {
      const res = await authFetch("/lms/practical/checkins", {
        method: "POST",
        body: JSON.stringify({
          cohortId: selectedCohort,
          userId: targetUser.id,
          groupId: targetUser.groupId,
          weekNumber: selectedWeek,
          codeSubmitted,
          verifiedBy: validVerifiedBy,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error("Backend failed to save checkin:", errData);
        setError(errData.error || errData.message || "Failed to save attendance check-in on server database.");
      } else {
        const resData = await res.json();
        if (resData.checkin) {
          saveStoredPracticalCheckin(resData.checkin);
        }
      }
    } catch (err) {
      console.error("Failed to persist checkin to server", err);
      setError("Network error: Failed to reach database server to save check-in.");
    }

    return newCheckin;
  };

  const handleResetWeekAttendance = async () => {
    if (!selectedCohort || !selectedWeek) return;
    const confirmed = window.confirm(
      `⚠️ ARE YOU SURE YOU WANT TO DELETE ALL "PRESENT" ATTENDANCE RECORDS FOR WEEK ${selectedWeek}?\n\nThis will clear all check-ins for Week ${selectedWeek} in the database and reflect across all portals (including Corpers Portal).`
    );
    if (!confirmed) return;

    setResettingAttendance(true);
    setError("");
    setSuccess("");

    try {
      const res = await authFetch(`/lms/practical/checkins/${selectedCohort}?week=${selectedWeek}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || `Failed to reset Week ${selectedWeek} attendance.`);
        setResettingAttendance(false);
        return;
      }

      const resData = await res.json();
      clearStoredPracticalCheckins(selectedCohort, selectedWeek);
      setCheckins((prev) => prev.filter((c) => c.cohortId !== selectedCohort || Number(c.weekNumber) !== Number(selectedWeek)));
      setSuccess(`✅ Successfully deleted present attendance for all trainees in Week ${selectedWeek}! (${resData.deletedCount || 0} records cleared)`);
    } catch {
      setError(`Failed to reset Week ${selectedWeek} attendance.`);
    } finally {
      setResettingAttendance(false);
    }
  };

  const handleRemoveSingleUserCheckin = async (targetUser: User) => {
    const confirmed = window.confirm(
      `Remove present attendance record for ${targetUser.firstName} ${targetUser.lastName} in Week ${selectedWeek}?`
    );
    if (!confirmed) return;

    try {
      const res = await authFetch(`/lms/practical/checkins/${selectedCohort}?week=${selectedWeek}&userId=${targetUser.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        clearStoredPracticalCheckins(selectedCohort, selectedWeek, targetUser.id);
        setCheckins((prev) => prev.filter((c) => !(c.userId === targetUser.id && Number(c.weekNumber) === Number(selectedWeek))));
        setSuccess(`Removed check-in for ${targetUser.firstName} ${targetUser.lastName} in Week ${selectedWeek}.`);
      } else {
        setError("Failed to remove check-in record.");
      }
    } catch {
      setError("Failed to remove check-in record.");
    }
  };

  // Submit code handler
  const handleAdminCodeSubmission = async () => {
    const rawInput = submittedCodeInput.trim();
    const norm = normalizePracticalCode(rawInput);
    if (!norm) {
      setError("Please enter the unique practical attendance code presented by the trainee.");
      return;
    }

    setSubmittingCode(true);
    setError("");
    setSuccess("");

    try {
      let targetUser: User | undefined;

      // 1. Check rolling 60s pass if used
      targetUser = users.find((u) =>
        verifyRollingTOTP(norm, u.id, selectedCohort, u.groupId || "", selectedWeek)
      );

      // 2. If student explicitly selected from dropdown, verify their unique week code
      if (!targetUser && selectedStudentId) {
        const u = users.find((item) => item.id === selectedStudentId);
        if (u) {
          const expectedUserCode = generateUserUniquePracticalCode(u.id, selectedWeek, u.email);
          const normExpected = normalizePracticalCode(expectedUserCode);
          if (norm === normExpected || normExpected.endsWith(norm) || norm === normExpected.replace(`PRAC-W${selectedWeek}-`, "")) {
            targetUser = u;
          } else {
            setError(`❌ Invalid Code! The code entered does NOT match ${u.firstName} ${u.lastName}'s unique Week ${selectedWeek} attendance code.`);
            setSubmittingCode(false);
            return;
          }
        }
      }

      // 3. Direct lookup across all trainees in cohort using generateUserUniquePracticalCode
      if (!targetUser) {
        targetUser = users.find((u) => {
          const expectedCode = generateUserUniquePracticalCode(u.id, selectedWeek, u.email);
          const normExpected = normalizePracticalCode(expectedCode);
          return (
            norm === normExpected ||
            normExpected.endsWith(norm) ||
            norm === normExpected.replace(`PRAC-W${selectedWeek}-`, "")
          );
        });
      }

      if (!targetUser) {
        setError(`❌ Invalid or Fake Code! No trainee in this cohort has the attendance code "${rawInput}" for Week ${selectedWeek}.`);
        setSubmittingCode(false);
        return;
      }

      // Record checkin
      await handleManualCheckinUser(targetUser, norm);

      setSuccess(`✅ Verified! ${targetUser.firstName} ${targetUser.lastName} (${targetUser.groupName || "Trainee"}) marked PRESENT for Week ${selectedWeek} Practical Session!`);
      setSubmittedCodeInput("");
      setSelectedStudentId("");
    } catch {
      setError("An error occurred while submitting code.");
    } finally {
      setSubmittingCode(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-8 rounded-2xl text-center font-sora">
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-xs text-rose-600 font-medium">
          Only Admins, Lead Trainers, and Trainers have permission to access the Weekly Practical Submission portal.
        </p>
      </div>
    );
  }

  if (loading && cohorts.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 text-sm font-sora">
        Loading Practical Submission Portal...
      </div>
    );
  }

  const groupUsers = selectedGroup ? users.filter((u) => u.groupId === selectedGroup) : users;
  const checkedInCount = users.filter((u) => isCheckedIn(u.id)).length;

  return (
    <div className="font-sora">
      {/* Page Title */}
      <div className="mb-6">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full">
          Admin & Trainer Practical Attendance Submission
        </span>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 mt-2 mb-1">
          Weekly Practical Code Submission
        </h1>
        <p className="text-slate-500 text-xs font-medium">
          Submit and verify practical codes presented by trainees to confirm weekly field attendance.
        </p>
      </div>

      {/* Selectors Header Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 mb-6 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Cohort Selector */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
              Cohort
            </label>
            <select
              value={selectedCohort}
              onChange={(e) => setSelectedCohort(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-bold transition"
            >
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.state})
                </option>
              ))}
            </select>
          </div>

          {/* Week Selector */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
              Curriculum Week
            </label>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-bold transition"
            >
              {WEEK_OPTIONS.map((w) => (
                <option key={w} value={w}>
                  Week {w} Practical Session
                </option>
              ))}
            </select>
          </div>

          {/* Group Filter */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
              Group Filter
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-bold transition"
            >
              <option value="">All Groups</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.practicalDay || "Monday"})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reset Week Attendance Action */}
        <div className="ml-auto">
          <button
            onClick={handleResetWeekAttendance}
            disabled={resettingAttendance || checkedInCount === 0}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold transition shadow-2xs disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
          >
            <span>🗑️</span> {resettingAttendance ? "Resetting..." : `Reset Week ${selectedWeek} Attendance (${checkedInCount} Present)`}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-4 py-3 rounded-xl mb-6 font-semibold">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl mb-6 font-semibold">
          {success}
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center shadow-xs">
          <p className="text-2xl font-black text-slate-900">{users.length}</p>
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">Total Trainees</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center shadow-xs">
          <p className="text-2xl font-black text-emerald-600">{checkedInCount}</p>
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">Present (Week {selectedWeek})</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center shadow-xs">
          <p className="text-2xl font-black text-amber-600">{users.length - checkedInCount}</p>
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">Pending Submission</p>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex gap-2 mb-6">
        {(["submit", "matrix", "group_codes"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
              activeTab === t
                ? "bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs font-extrabold"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t === "submit" && "🔑 Submit Trainee Code"}
            {t === "matrix" && "📋 Trainee Attendance Matrix"}
            {t === "group_codes" && "🏷️ Trainee Unique Codes"}
          </button>
        ))}
      </div>

      {/* TAB 1: CODE SUBMISSION FORM */}
      {activeTab === "submit" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm mb-6 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl font-bold">
              🔑
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Submit Practical Verification Code</h2>
              <p className="text-xs text-slate-500 font-medium">
                Enter the code given to you by the trainee during the practical day session.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Optional Student Selector */}
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                Select Trainee (Optional)
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => {
                  setSelectedStudentId(e.target.value);
                  const selectedU = users.find((u) => u.id === e.target.value);
                  if (selectedU) {
                    const expected = generateUserUniquePracticalCode(selectedU.id, selectedWeek, selectedU.email);
                    setSubmittedCodeInput(expected);
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="">-- Choose Trainee (or enter code directly below) --</option>
                {groupUsers.map((u) => {
                  const present = isCheckedIn(u.id);
                  return (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.groupName || "Group"}) {present ? "✓ Already Present" : "⏳ Pending"}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Code Input */}
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                Trainee Practical Code
              </label>
              <input
                type="text"
                value={submittedCodeInput}
                onChange={(e) => setSubmittedCodeInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdminCodeSubmission();
                  }
                }}
                placeholder="e.g. PRAC-W1-7B3K-9M2F"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-mono tracking-widest text-slate-900 uppercase focus:outline-none focus:border-emerald-500 transition font-bold"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleAdminCodeSubmission}
              disabled={submittingCode || !submittedCodeInput.trim()}
              className="w-full py-3.5 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#002d25] font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submittingCode ? "Verifying Code..." : "Verify & Mark Trainee Present ✓"}
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE MATRIX */}
      {activeTab === "matrix" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="grid grid-cols-12 gap-0 border-b border-slate-200 bg-slate-50/80 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <div className="col-span-4">Trainee</div>
            <div className="col-span-3">Group & Practical Day</div>
            <div className="col-span-3">Status (Week {selectedWeek})</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          {groupUsers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">No trainees found for this selection</div>
          ) : (
            groupUsers.map((u) => {
              const checked = isCheckedIn(u.id);
              const userCode = generateUserUniquePracticalCode(u.id, selectedWeek, u.email);
              return (
                <div key={u.id} className="grid grid-cols-12 gap-0 border-b border-slate-100 last:border-0 px-4 py-3.5 items-center hover:bg-slate-50/60 transition">
                  <div className="col-span-4 min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                  </div>
                  <div className="col-span-3">
                    <span className="text-xs font-semibold text-slate-700">{u.groupName || "Group A"}</span>
                    <span className="text-[10px] text-slate-400 block font-medium">({u.practicalDay || "Monday"})</span>
                  </div>
                  <div className="col-span-3">
                    {checked ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                        ✓ Verified Present
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                        ⏳ Pending Code
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 text-right">
                    {!checked ? (
                      <button
                        onClick={async () => {
                          await handleManualCheckinUser(u, userCode);
                          setSuccess(`Marked ${u.firstName} ${u.lastName} as present for Week ${selectedWeek}.`);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition shadow-2xs cursor-pointer"
                      >
                        Submit Code & Verify
                      </button>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[11px] font-bold text-emerald-600">Verified ✓</span>
                        <button
                          onClick={() => handleRemoveSingleUserCheckin(u)}
                          title="Remove present attendance check-in"
                          className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-bold rounded-md border border-red-200 transition cursor-pointer"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: INDIVIDUAL TRAINEE ATTENDANCE CODES */}
      {activeTab === "group_codes" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm">Unique Week {selectedWeek} Trainee Attendance Codes</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Each trainee has a unique code that changes every week. Trainees show this code on their LMS portal.
            </p>
          </div>
          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {groupUsers.map((u) => {
              const uCode = generateUserUniquePracticalCode(u.id, selectedWeek, u.email);
              const present = isCheckedIn(u.id);
              return (
                <div key={u.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{u.firstName} {u.lastName}</p>
                    <p className="text-[10px] text-slate-500">{u.email} • {u.groupName || "Group"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-emerald-950 text-[#00D1C1] font-mono font-black text-sm px-3.5 py-1.5 rounded-lg border border-emerald-800 tracking-wider">
                      {uCode}
                    </span>
                    {present ? (
                      <span className="text-emerald-700 font-bold text-xs bg-emerald-100 px-2.5 py-1 rounded-full">✓ Present</span>
                    ) : (
                      <span className="text-amber-700 font-bold text-xs bg-amber-100 px-2.5 py-1 rounded-full">⏳ Pending</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
