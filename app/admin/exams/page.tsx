"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { authFetch, refreshAccessToken } from "@/lib/api";

interface Exam {
  id: string;
  title: string;
  description?: string;
  cohortId: string;
  durationMinutes: number;
  isPublished: boolean;
  isActive?: boolean;
  createdAt: string;
}

interface Cohort {
  id: string;
  name: string;
  state: string;
}

export default function AdminExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [userId, setUserId] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    cohortId: "",
    durationMinutes: 60,
    isPublished: false,
  });

  useEffect(() => {
    const restore = async () => {
      const refresh = localStorage.getItem("refreshToken");
      if (!refresh) {
        router.replace("/learn/lms");
        return;
      }

      let token = useAuthStore.getState().accessToken;
      if (!token) {
        try {
          token = await refreshAccessToken();
        } catch {
          router.replace("/learn/lms");
          return;
        }
      }

      try {
        const authToken = token;
        if (!authToken) {
          router.replace("/learn/lms");
          return;
        }
        const payload = JSON.parse(atob(authToken.split(".")[1]));
        setUserId(payload.userId || payload.sub || payload.id || "");

        const [cohortsRes, examsRes] = await Promise.all([
          authFetch("/cohorts"),
          authFetch("/lms/exams?showAll=true"),
        ]);

        if (cohortsRes.ok) {
          setCohorts(await cohortsRes.json());
        }

        if (examsRes.ok) {
          setExams(await examsRes.json());
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load exams.");
      } finally {
        setLoading(false);
      }
    };

    restore();
  }, [router]);

  const createExam = async () => {
    if (!form.title || !form.cohortId || !userId) return;
    setCreating(true);
    setError("");

    try {
      const res = await authFetch("/lms/exams", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          cohortId: form.cohortId,
          durationMinutes: form.durationMinutes,
          createdBy: userId,
          isPublished: form.isPublished,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create exam.");
        return;
      }

      setForm({
        title: "",
        description: "",
        cohortId: "",
        durationMinutes: 60,
        isPublished: false,
      });
      setExams((prev) => [data, ...prev]);
    } catch {
      setError("Unable to create exam.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4faf7] text-slate-800 flex items-center justify-center">
        Loading exams...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4faf7] text-slate-800 px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-emerald-700 font-bold mb-2">Admin exams</p>
            <h1 className="text-3xl font-black text-slate-900">Exam management</h1>
            <p className="text-sm text-slate-600 mt-2 max-w-2xl font-medium">
              Manage final exam configuration independently from weekly curriculum.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Available exams</h2>
                <p className="text-sm text-slate-500 mt-1 font-medium">All cohorts and draft/published exams are shown here.</p>
              </div>
            </div>
            {exams.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                No exams created yet.
              </div>
            ) : (
              <div className="space-y-4">
                {exams.map((exam) => (
                  <div key={exam.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-500 font-medium">{exam.cohortId ? cohorts.find((c) => c.id === exam.cohortId)?.name || exam.cohortId : "No cohort"}</p>
                        <h3 className="text-lg font-bold text-slate-900">{exam.title}</h3>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right text-sm text-slate-600 font-medium">
                          <p>{exam.durationMinutes} min</p>
                          <p>{exam.isPublished ? "Published" : "Draft"}</p>
                        </div>
                        <button
                          onClick={() => router.push(`/admin/exams/${exam.id}`)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
                        >
                          Manage Questions
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Create new exam</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                  placeholder="Final exam title"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                  placeholder="Optional exam description"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Cohort</label>
                <select
                  value={form.cohortId}
                  onChange={(e) => setForm((prev) => ({ ...prev, cohortId: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                >
                  <option value="">Select cohort</option>
                  {cohorts.map((cohort) => (
                    <option key={cohort.id} value={cohort.id}>
                      {cohort.name} · {cohort.state}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Duration</label>
                  <input
                    type="number"
                    min={10}
                    value={form.durationMinutes}
                    onChange={(e) => setForm((prev) => ({ ...prev, durationMinutes: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex-1 text-xs text-slate-500 font-bold uppercase tracking-widest">
                    <span className="block mb-2">Publish</span>
                    <input
                      type="checkbox"
                      checked={form.isPublished}
                      onChange={(e) => setForm((prev) => ({ ...prev, isPublished: e.target.checked }))}
                      className="mr-2 accent-emerald-600"
                    />
                    Live
                  </label>
                </div>
              </div>

              <button
                onClick={createExam}
                disabled={creating || !form.title || !form.cohortId}
                className="w-full rounded-3xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {creating ? "Creating exam..." : "Create exam"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
