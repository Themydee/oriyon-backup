"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface Week {
  id: string;
  weekNumber: number;
  title: string;
  description: string;
  isPublished: boolean;
  requiresQuizPass: boolean;
  cohortId: string;
  objectives?: string[];
  unlockDate?: string | null;
}

interface Cohort {
  id: string;
  _id?: string;
  name: string;
  state: string;
}

export default function CurriculumPage() {
  const token = useAuthStore((s) => s.accessToken);
  const userRole = token ? (() => {
    try {
      return JSON.parse(atob(token.split(".")[1])).role;
    } catch {
      return null;
    }
  })() : null;
  const isTrainer = userRole === "trainer";

  const [weeks, setWeeks] = useState<Week[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [selectedCohort, setSelectedCohort] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingWeek, setEditingWeek] = useState<Week | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    weekNumber: 1,
    requiresQuizPass: true,
    isPublished: false,
    objectivesText: "",
    unlockDate: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const cohortRes = await authFetch("/cohorts");
        if (cohortRes.ok) {
          const data = await cohortRes.json();
          setCohorts(data);
          if (data.length > 0) {
            setSelectedCohort(data[0].id || data[0]._id || "");
          }
        } else {
          const body = await cohortRes.json();
          setError(body.error || "Failed to load cohorts.");
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
    fetchWeeks();
  }, [selectedCohort]);

  const fetchWeeks = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authFetch(
        `/lms/weeks?cohortId=${selectedCohort}&showAll=true`
      );
      const data = await res.json();
      if (res.ok) {
        setWeeks(data.sort((a: Week, b: Week) => a.weekNumber - b.weekNumber));
      } else {
        setError(data.error || "Failed to load weeks.");
      }
    } catch {
      setError("Failed to load weeks.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewWeekClick = () => {
    setEditingWeek(null);
    setForm({
      title: "",
      description: "",
      weekNumber: weeks.length + 1,
      requiresQuizPass: true,
      isPublished: false,
      objectivesText: "",
      unlockDate: "",
    });
    setShowForm(true);
  };

  const startEdit = (week: Week) => {
    setEditingWeek(week);
    setForm({
      title: week.title,
      description: week.description || "",
      weekNumber: week.weekNumber,
      requiresQuizPass: week.requiresQuizPass,
      isPublished: week.isPublished,
      objectivesText: (week.objectives || []).join("\n"),
      unlockDate: week.unlockDate ? new Date(week.unlockDate).toISOString().slice(0, 16) : "",
    });
    setShowForm(true);
  };

  const saveWeek = async () => {
    if (!form.title || !selectedCohort) return;

    setSaving(true);
    setError("");
    try {
      const objectives = form.objectivesText
        .split("\n")
        .map((o) => o.trim())
        .filter(Boolean);

      const payload = {
        ...form,
        objectives,
        cohortId: selectedCohort,
        unlockDate: form.unlockDate ? new Date(form.unlockDate).toISOString() : null,
      };

      let res;
      if (editingWeek) {
        res = await authFetch(`/lms/weeks/${editingWeek.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        res = await authFetch("/lms/weeks", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setShowForm(false);
        setEditingWeek(null);
        setForm({
          title: "",
          description: "",
          weekNumber: weeks.length + 1,
          requiresQuizPass: true,
          isPublished: false,
          objectivesText: "",
          unlockDate: "",
        });
        fetchWeeks();
      } else {
        const body = await res.json();
        setError(body.error || `Failed to ${editingWeek ? "update" : "create"} week.`);
      }
    } catch {
      setError(`Failed to ${editingWeek ? "update" : "create"} week.`);
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (week: Week) => {
    setError("");
    try {
      await authFetch(`/lms/weeks/${week.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isPublished: !week.isPublished }),
      });
      fetchWeeks();
    } catch {
      setError("Failed to update week.");
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-1">
            Curriculum
          </h1>
          <p className="text-slate-500 text-sm">
            Manage weeks, lessons and quizzes
          </p>
        </div>
        <button
          onClick={handleNewWeekClick}
          className="px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-xl transition"
        >
          + New Week
        </button>
      </div>

      {cohorts.length > 1 && (
        <div className="mb-6">
          <label className="block text-xs text-slate-500 uppercase tracking-widest mb-2">
            Cohort
          </label>
          <select
            value={selectedCohort}
            onChange={(e) => setSelectedCohort(e.target.value)}
            className="bg-[#020617] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-600 transition"
          >
            {cohorts.map((c) => (
              <option key={c.id || c._id} value={c.id || c._id}>
                {c.name} · {c.state}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="bg-red-950/40 border border-red-700/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm md:relative md:inset-auto md:z-auto md:bg-transparent md:backdrop-blur-none md:p-0">
          <div className="w-full max-w-xl bg-[#020617] border border-green-700/30 rounded-2xl p-6 shadow-2xl relative md:shadow-none md:p-5 md:mb-6 overflow-y-auto max-h-[90vh] md:max-h-none">
            <button 
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white md:hidden text-lg focus:outline-none"
            >
              ✕
            </button>
            <h3 className="text-sm font-black text-white mb-4">
              {editingWeek ? `Edit Week ${editingWeek.weekNumber}` : "New Week"}
            </h3>
            {cohorts.length === 0 && (
              <div className="bg-yellow-950/40 border border-yellow-700/30 text-yellow-400 text-xs px-4 py-3 rounded-xl mb-4">
                ⚠️ You must create at least one cohort before you can add weeks. Go to the <Link href="/admin/cohorts" className="underline font-bold text-yellow-300">Cohorts Page</Link> to create one.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-widest mb-2">
                  Week Number
                </label>
                <input
                  type="number"
                  value={form.weekNumber}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      weekNumber: parseInt(e.target.value, 10) || 1,
                    })
                  }
                  className="w-full bg-[#0a0f1a] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-600 transition"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-widest mb-2">
                  Title *
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Introduction to Goat Husbandry"
                  className="w-full bg-[#0a0f1a] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-600 transition"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-slate-500 uppercase tracking-widest mb-2">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={2}
                placeholder="Brief description of the week..."
                className="w-full bg-[#0a0f1a] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-600 transition resize-none"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-slate-500 uppercase tracking-widest mb-2">
                Weekly Objectives (One per line)
              </label>
              <textarea
                value={form.objectivesText}
                onChange={(e) =>
                  setForm({ ...form, objectivesText: e.target.value })
                }
                rows={4}
                placeholder="Understand basic nutrition&#10;Set up feeding stations&#10;Implement daily health checks"
                className="w-full bg-[#0a0f1a] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-600 transition resize-y"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-slate-500 uppercase tracking-widest mb-2">
                Unlock Date (Optional)
              </label>
              <input
                type="datetime-local"
                value={form.unlockDate}
                onChange={(e) => setForm({ ...form, unlockDate: e.target.value })}
                className="w-full bg-[#0a0f1a] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-600 transition"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                If set, trainees cannot access this week or its lessons before this date. Leave blank to unlock immediately.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.requiresQuizPass}
                  onChange={(e) =>
                    setForm({ ...form, requiresQuizPass: e.target.checked })
                  }
                />
                <span className="text-sm text-slate-400">
                  Requires quiz pass to unlock next week
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) =>
                    setForm({ ...form, isPublished: e.target.checked })
                  }
                />
                <span className="text-sm text-slate-400">
                  Publish immediately
                </span>
              </label>
            </div>
            <div className="flex gap-3">
              <button
                onClick={saveWeek}
                disabled={saving || !form.title || !selectedCohort}
                className="px-5 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-xl transition disabled:opacity-50"
              >
                {saving ? (editingWeek ? "Saving..." : "Creating...") : (editingWeek ? "Save Changes" : "Create Week")}
              </button>
              <button
                onClick={() => { setShowForm(false); setEditingWeek(null); }}
                className="px-5 py-2 border border-slate-700 text-slate-400 text-sm rounded-xl hover:border-slate-500 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500 text-sm">
          Loading...
        </div>
      ) : weeks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-sm font-semibold">No weeks yet</p>
          <p className="text-xs mt-1">Create your first week to get started</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {weeks.map((week) => (
            <div
              key={week.id}
              className="bg-[#020617] border border-slate-800 rounded-2xl p-4 md:p-5 hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-green-500/15 border border-green-600/20 flex items-center justify-center text-green-400 font-black text-sm flex-shrink-0">
                    W{week.weekNumber}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-white truncate">
                      {week.title}
                    </p>
                    {week.description && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {week.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {week.isPublished ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border text-green-400 bg-green-500/10 border-green-700/30">
                          Published
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border text-slate-500 bg-slate-800 border-slate-700">
                          Draft
                        </span>
                      )}
                      {week.requiresQuizPass && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border text-yellow-400 bg-yellow-500/10 border-yellow-700/30">
                          Quiz required
                        </span>
                      )}
                      {week.unlockDate && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border text-sky-400 bg-sky-500/10 border-sky-700/30">
                          Locks until {new Date(week.unlockDate).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                  {!isTrainer && (
                    <>
                      <button
                        onClick={() => startEdit(week)}
                        className="text-xs border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => togglePublish(week)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition font-semibold ${
                          week.isPublished
                            ? "border-slate-700 text-slate-400 hover:border-slate-500"
                            : "border-green-700/40 text-green-400 hover:bg-green-500/10"
                        }`}
                      >
                        {week.isPublished ? "Unpublish" : "Publish"}
                      </button>
                    </>
                  )}
                  <Link
                    href={`/admin/curriculum/${week.id}/lessons`}
                    className="text-xs border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition"
                  >
                    Lessons →
                  </Link>
                  <Link
                    href={`/admin/curriculum/${week.id}/quiz`}
                    className="text-xs border border-yellow-700/40 text-yellow-400 hover:bg-yellow-500/10 px-3 py-1.5 rounded-lg transition"
                  >
                    Quiz →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}