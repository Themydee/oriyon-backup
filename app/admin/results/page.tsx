"use client";

import { useEffect, useMemo, useState } from "react";
import { authFetch } from "@/lib/api";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  cohortId?: string | null;
}

interface Cohort {
  id: string;
  name: string;
}

interface QuizAttempt {
  attemptId: string;
  userId: string;
  quizId: string;
  quizTitle: string;
  weekId: string;
  score: number;
  passed: boolean;
  attemptedAt: string;
  cohortId?: string | null;
}

interface ExamSession {
  sessionId: string;
  userId: string;
  examId: string;
  examTitle: string;
  status: string;
  mcqScore: number | null;
  score: number | null;
  startedAt: string;
  submittedAt: string | null;
  isFullyMarked: boolean;
  cohortId?: string | null;
}

function UserResultsModal({
  user,
  quizAttempts,
  examSessions,
  onClose,
}: {
  user: User;
  quizAttempts: QuizAttempt[];
  examSessions: ExamSession[];
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"quiz" | "exam">("quiz");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-8">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl shadow-2xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-black text-2xl flex-shrink-0">
              {user.firstName[0]}
            </div>
            <div>
              <h2 className="text-slate-900 font-bold text-xl">{user.firstName} {user.lastName}</h2>
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 font-medium">
                <span>{user.email}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-hidden flex flex-col gap-6">
          {/* Toggles */}
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <button
              onClick={() => setActiveTab("quiz")}
              className={`rounded-2xl px-5 py-2.5 text-sm font-bold transition ${
                activeTab === "quiz"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
              }`}
            >
              Quiz Attempts ({quizAttempts.length})
            </button>
            <button
              onClick={() => setActiveTab("exam")}
              className={`rounded-2xl px-5 py-2.5 text-sm font-bold transition ${
                activeTab === "exam"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
              }`}
            >
              Exam Sessions ({examSessions.length})
            </button>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-y-auto pr-2 rounded-xl border border-slate-200">
            {activeTab === "quiz" ? (
              <table className="min-w-full border-separate border-spacing-y-2 relative">
                <thead className="sticky top-0 bg-slate-100 z-10 shadow-sm border-b border-slate-200">
                  <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-slate-600 font-bold">
                    <th className="py-3 px-4">Quiz</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Attempted At</th>
                  </tr>
                </thead>
                <tbody>
                  {quizAttempts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                        No quiz attempts found.
                      </td>
                    </tr>
                  ) : (
                    quizAttempts.map((attempt) => (
                      <tr key={attempt.attemptId} className="bg-white hover:bg-slate-50 transition group border-b border-slate-200">
                        <td className="py-4 px-4 text-sm text-slate-900 font-bold rounded-l-xl border-y border-l border-slate-200">{attempt.quizTitle}</td>
                        <td className="py-4 px-4 text-sm text-slate-800 font-semibold border-y border-slate-200">{attempt.score}%</td>
                        <td className="py-4 px-4 text-sm border-y border-slate-200">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold ${
                            attempt.passed ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
                          }`}>
                            {attempt.passed ? "Passed" : "Failed"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-500 rounded-r-xl border-y border-r border-slate-200 font-medium">
                          {new Date(attempt.attemptedAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="min-w-full border-separate border-spacing-y-2 relative">
                <thead className="sticky top-0 bg-slate-100 z-10 shadow-sm border-b border-slate-200">
                  <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-slate-600 font-bold">
                    <th className="py-3 px-4">Exam</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Submitted At</th>
                  </tr>
                </thead>
                <tbody>
                  {examSessions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                        No exam sessions found.
                      </td>
                    </tr>
                  ) : (
                    examSessions.map((session) => (
                      <tr key={session.sessionId} className="bg-white hover:bg-slate-50 transition group border-b border-slate-200">
                        <td className="py-4 px-4 text-sm text-slate-900 font-bold rounded-l-xl border-y border-l border-slate-200">{session.examTitle}</td>
                        <td className="py-4 px-4 text-sm border-y border-slate-200">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold ${
                            session.status === "submitted" || session.status === "auto_submitted" || session.status === "timed_out"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}>
                            {session.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-800 border-y border-slate-200">
                          {session.isFullyMarked ? <span className="font-bold text-emerald-700">{session.score ?? 0} pts</span> : `MCQ ${session.mcqScore ?? 0}`}
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-500 rounded-r-xl border-y border-r border-slate-200 font-medium">
                          {session.submittedAt
                            ? new Date(session.submittedAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                            : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminResultsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [examSessions, setExamSessions] = useState<ExamSession[]>([]);
  
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchingNewPage, setFetchingNewPage] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearAllAttempts = async () => {
    setClearing(true);
    try {
      const res = await authFetch("/lms/quizzes/admin/attempts", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to clear quiz attempts");
      setQuizAttempts([]);
      setShowClearConfirm(false);
    } catch (err: any) {
      alert(err?.message || "Failed to clear attempts.");
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (users.length === 0) setLoading(true);
      else setFetchingNewPage(true);

      try {
        const [usersRes, cohortsRes, quizRes, examRes] = await Promise.all([
          authFetch(`/users?limit=1000${search ? `&search=${encodeURIComponent(search)}` : ""}`),
          authFetch("/cohorts"),
          authFetch(`/lms/quizzes/admin/attempts?limit=500`),
          authFetch(`/lms/exams/admin/sessions?limit=500`),
        ]);

        if (!usersRes.ok) throw new Error("Failed to load users");
        if (!cohortsRes.ok) throw new Error("Failed to load cohorts");
        if (!quizRes.ok) throw new Error("Failed to load quiz attempts");
        if (!examRes.ok) throw new Error("Failed to load exam sessions");

        const usersData = await usersRes.json();
        const cohortsData = await cohortsRes.json();
        const quizData = await quizRes.json();
        const examData = await examRes.json();

        let usersList: User[] = Array.isArray(usersData) ? usersData : Array.isArray(usersData?.data) ? usersData.data : Array.isArray(usersData?.users) ? usersData.users : [];
        const cohortsList = Array.isArray(cohortsData) ? cohortsData : Array.isArray(cohortsData?.data) ? cohortsData.data : Array.isArray(cohortsData?.cohorts) ? cohortsData.cohorts : [];
        const quizList = Array.isArray(quizData) ? quizData : Array.isArray(quizData?.data) ? quizData.data : Array.isArray(quizData?.attempts) ? quizData.attempts : [];
        const examList = Array.isArray(examData) ? examData : Array.isArray(examData?.data) ? examData.data : Array.isArray(examData?.sessions) ? examData.sessions : [];

        // Check for any missing user profiles for users who took quizzes/exams
        const existingIds = new Set(usersList.map((u) => u.id));
        const missingUserIds = new Set<string>();

        for (const attempt of quizList) {
          if (attempt.userId && !existingIds.has(attempt.userId)) {
            missingUserIds.add(attempt.userId);
          }
        }
        for (const session of examList) {
          if (session.userId && !existingIds.has(session.userId)) {
            missingUserIds.add(session.userId);
          }
        }

        if (missingUserIds.size > 0) {
          const fetchedMissing = await Promise.all(
            Array.from(missingUserIds).map(async (id) => {
              try {
                const res = await authFetch(`/users/${id}`);
                if (res.ok) {
                  const data = await res.json();
                  return data.user || data.data || data;
                }
              } catch {
                return null;
              }
            })
          );
          for (const u of fetchedMissing) {
            if (u && u.id && !existingIds.has(u.id)) {
              usersList = [...usersList, u];
              existingIds.add(u.id);
            }
          }
        }

        setUsers(usersList);
        setCohorts(cohortsList);
        setQuizAttempts(quizList);
        setExamSessions(examList);
      } catch (err: any) {
        setError(err?.message || "Failed to load results.");
      } finally {
        setLoading(false);
        setFetchingNewPage(false);
      }
    };

    load();
  }, [search]);

  const cohortMap = useMemo(
    () => {
      const safeCohorts = Array.isArray(cohorts) ? cohorts : [];
      return new Map(safeCohorts.map((cohort) => [cohort.id, cohort.name]));
    },
    [cohorts],
  );

  const userStats = useMemo(() => {
    const statsMap = new Map<string, {
      user: User;
      cohortName: string;
      quizzesTaken: number;
      quizzesPassed: number;
      examsTaken: number;
    }>();

    const safeUsers = Array.isArray(users) ? users : [];
    const safeQuizAttempts = Array.isArray(quizAttempts) ? quizAttempts : [];
    const safeExamSessions = Array.isArray(examSessions) ? examSessions : [];

    for (const user of safeUsers) {
      statsMap.set(user.id, {
        user,
        cohortName: user.cohortId ? (cohortMap.get(user.cohortId) ?? "—") : "—",
        quizzesTaken: 0,
        quizzesPassed: 0,
        examsTaken: 0,
      });
    }

    for (const attempt of safeQuizAttempts) {
      let stat = statsMap.get(attempt.userId);
      if (!stat) {
        const fallbackUser: User = {
          id: attempt.userId,
          firstName: "Trainee",
          lastName: "",
          email: "—",
          cohortId: attempt.cohortId,
        };
        stat = {
          user: fallbackUser,
          cohortName: attempt.cohortId ? (cohortMap.get(attempt.cohortId) ?? "—") : "—",
          quizzesTaken: 0,
          quizzesPassed: 0,
          examsTaken: 0,
        };
        statsMap.set(attempt.userId, stat);
      }
      stat.quizzesTaken++;
      if (attempt.passed) stat.quizzesPassed++;
    }

    for (const session of safeExamSessions) {
      let stat = statsMap.get(session.userId);
      if (!stat) {
        const fallbackUser: User = {
          id: session.userId,
          firstName: "Trainee",
          lastName: "",
          email: "—",
          cohortId: session.cohortId,
        };
        stat = {
          user: fallbackUser,
          cohortName: session.cohortId ? (cohortMap.get(session.cohortId) ?? "—") : "—",
          quizzesTaken: 0,
          quizzesPassed: 0,
          examsTaken: 0,
        };
        statsMap.set(session.userId, stat);
      }
      stat.examsTaken++;
    }

    let results = Array.from(statsMap.values()).filter((stat) => stat.quizzesTaken > 0 || stat.examsTaken > 0);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      results = results.filter((stat) => {
        const name = `${stat.user.firstName || ""} ${stat.user.lastName || ""}`.toLowerCase();
        const email = (stat.user.email || "").toLowerCase();
        return name.includes(q) || email.includes(q);
      });
    }

    return results;
  }, [users, cohortMap, quizAttempts, examSessions, search]);

  const totalPages = Math.max(1, Math.ceil(userStats.length / pageSize));
  const paginatedUserStats = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return userStats.slice(start, start + pageSize);
  }, [userStats, currentPage, pageSize]);

  const stats = useMemo(() => ({
    quizAttempts: quizAttempts.length,
    examSessions: examSessions.length,
    usersActive: userStats.filter(s => s.quizzesTaken > 0 || s.examsTaken > 0).length,
  }), [quizAttempts, examSessions, userStats]);

  const selectedUser = useMemo(() => {
    if (!selectedUserId) return null;
    const found = users.find(u => u.id === selectedUserId);
    if (found) return found;
    const statFound = userStats.find(s => s.user.id === selectedUserId);
    return statFound ? statFound.user : null;
  }, [selectedUserId, users, userStats]);

  const selectedUserQuizzes = useMemo(() => {
    if (!selectedUserId) return [];
    return quizAttempts.filter(a => a.userId === selectedUserId);
  }, [selectedUserId, quizAttempts]);

  const selectedUserExams = useMemo(() => {
    if (!selectedUserId) return [];
    return examSessions.filter(e => e.userId === selectedUserId);
  }, [selectedUserId, examSessions]);

  return (
    <div className="min-h-screen bg-[#f4faf7] text-slate-800 px-4 py-8">
      {/* Modal */}
      {selectedUser && (
        <UserResultsModal
          user={selectedUser}
          quizAttempts={selectedUserQuizzes}
          examSessions={selectedUserExams}
          onClose={() => setSelectedUserId(null)}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-emerald-700 font-bold mb-2">Admin results</p>
            <h1 className="text-3xl font-black text-slate-900">Trainee Performance</h1>
            <p className="text-sm text-slate-600 mt-2 max-w-2xl font-medium">
              Select a trainee to view their detailed quiz and exam results.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
              <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-1">Active Trainees</p>
              <p className="text-lg font-black text-slate-900">{stats.usersActive}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-1">Quiz Attempts</p>
                <p className="text-lg font-black text-slate-900">{stats.quizAttempts}</p>
              </div>
              {stats.quizAttempts > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="mt-2 text-[10px] uppercase font-bold text-red-600 hover:text-red-800 transition underline text-left"
                >
                  Clear All Attempts
                </button>
              )}
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
              <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-1">Exam Sessions</p>
              <p className="text-lg font-black text-slate-900">{stats.examSessions}</p>
            </div>
          </div>
        </div>

        {/* Clear Confirm Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Clear All Quiz Attempts?</h3>
              <p className="text-sm text-slate-600">
                This will permanently delete all {quizAttempts.length} quiz attempt records from the system. Trainee quiz attempt histories will be reset. This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  disabled={clearing}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAllAttempts}
                  disabled={clearing}
                  className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition disabled:opacity-50"
                >
                  {clearing ? "Clearing..." : "Yes, Clear All"}
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 lg:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">All Trainees</h2>
              {fetchingNewPage && (
                <span className="text-xs text-emerald-600 font-semibold animate-pulse">Updating...</span>
              )}
            </div>
            <div className="w-full sm:max-w-md">
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by name or email..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 transition"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full border-separate border-spacing-0">
              <thead className="bg-slate-100">
                <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-slate-600 font-bold">
                  <th className="py-4 px-6 border-b border-slate-200">Trainee</th>
                  <th className="py-4 px-6 border-b border-slate-200">Quizzes Taken</th>
                  <th className="py-4 px-6 border-b border-slate-200">Quizzes Passed</th>
                  <th className="py-4 px-6 border-b border-slate-200">Exams Taken</th>
                  <th className="py-4 px-6 border-b border-slate-200 text-right">Action</th>
                </tr>
              </thead>
              <tbody className={fetchingNewPage ? "opacity-60 transition-opacity" : ""}>
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse border-b border-slate-200">
                      <td className="py-4 px-6 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200" />
                          <div className="space-y-2">
                            <div className="h-4 w-32 bg-slate-200 rounded" />
                            <div className="h-3 w-24 bg-slate-200 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 border-b border-slate-100"><div className="h-4 w-12 bg-slate-200 rounded" /></td>
                      <td className="py-4 px-6 border-b border-slate-100"><div className="h-6 w-20 bg-slate-200 rounded-full" /></td>
                      <td className="py-4 px-6 border-b border-slate-100"><div className="h-4 w-12 bg-slate-200 rounded" /></td>
                      <td className="py-4 px-6 border-b border-slate-100 text-right"><div className="h-4 w-16 bg-slate-200 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : userStats.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-slate-500 bg-slate-50">
                      {search ? "No trainees match your search." : "No trainees have taken a quiz yet."}
                    </td>
                  </tr>
                ) : (
                  paginatedUserStats.map((stat) => (
                    <tr 
                      key={stat.user.id} 
                      onClick={() => setSelectedUserId(stat.user.id)}
                      className="bg-white hover:bg-slate-50 transition cursor-pointer group"
                    >
                      <td className="py-4 px-6 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 font-black text-sm">
                            {stat.user.firstName?.[0] || "T"}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">
                              {[stat.user.firstName, stat.user.lastName].filter(Boolean).join(" ") || "Trainee"}
                            </div>
                            <div className="text-xs text-slate-500 font-medium">
                              {stat.user.email && stat.user.email !== "—" ? stat.user.email : ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm border-b border-slate-200">
                        <span className="font-bold text-slate-900">{stat.quizzesTaken}</span>
                      </td>
                      <td className="py-4 px-6 text-sm border-b border-slate-200">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold ${
                          stat.quizzesTaken === 0
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : stat.quizzesPassed > 0
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                          {stat.quizzesTaken === 0 ? "Not Attempted" : `${stat.quizzesPassed} Passed`}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm border-b border-slate-200">
                        <span className="font-bold text-slate-900">{stat.examsTaken}</span>
                      </td>
                      <td className="py-4 px-6 text-sm text-right border-b border-slate-200">
                        <span className="text-emerald-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          {stat.quizzesTaken === 0 && stat.examsTaken === 0 ? "View Details →" : "View Results →"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500 font-medium">
              Showing page <span className="font-bold text-slate-900">{currentPage}</span> of <span className="font-bold text-slate-900">{totalPages}</span> ({userStats.length} trainees)
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1 || fetchingNewPage}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ← Previous
              </button>
              <button
                disabled={currentPage >= totalPages || fetchingNewPage}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
