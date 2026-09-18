"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useNavigationHistory } from "@/components/NavigationHistoryProvider";
import { authFetch, refreshAccessToken } from "@/lib/api";

interface Exam {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  isPublished: boolean;
  isActive?: boolean;
}

export default function ExamsPage() {
  const router = useRouter();
  const { goBack } = useNavigationHistory();
  const [userId, setUserId] = useState("");
  const [cohortId, setCohortId] = useState("");
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        const payload = JSON.parse(atob(token.split(".")[1]));
        const currentUserId = payload.userId || payload.sub || payload.id || "";
        setUserId(currentUserId);

        const userRes = await authFetch(`/users/${currentUserId}`);
        if (!userRes.ok) {
          throw new Error("Unable to fetch user");
        }

        const userData = await userRes.json();
        const resolvedCohort =
          userData.cohortId ||
          (typeof userData.cohort === "string" ? userData.cohort : undefined) ||
          userData.cohort?.id ||
          userData.cohort?._id ||
          (Array.isArray(userData.cohorts) && userData.cohorts.length > 0
            ? typeof userData.cohorts[0] === "string" ? userData.cohorts[0] : userData.cohorts[0]?.id || userData.cohorts[0]?._id
            : undefined) ||
          (Array.isArray(userData.cohortMembers) && userData.cohortMembers.length > 0
            ? userData.cohortMembers[0]?.cohortId || userData.cohortMembers[0]?.cohort?.id
            : undefined) ||
          "";

        setCohortId(resolvedCohort);

        const examsRes = await authFetch(resolvedCohort ? `/lms/exams?cohortId=${resolvedCohort}` : `/lms/exams`);
        if (!examsRes.ok) {
          const data = await examsRes.json();
          throw new Error(data.error || "Failed to load exams.");
        }

        const examsData = await examsRes.json();
        setExams(Array.isArray(examsData) ? examsData : []);
      } catch (err: any) {
        setError(err?.message || "Failed to load exams.");
      } finally {
        setLoading(false);
      }
    };

    restore();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4faf7] text-slate-500 flex items-center justify-center">
        Loading exam portal...
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

      <div className="max-w-6xl mx-auto px-6 py-10 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#00D1C1] font-bold mb-2">Final exam</p>
            <h1 className="text-3xl font-black text-[#002d25]">Exam Portal</h1>
            <p className="text-sm text-slate-550 mt-2 max-w-2xl">
              Final exams are delivered from here after the training curriculum completes. Select the available exam to begin.
            </p>
          </div>
          <button onClick={() => goBack("/learn/lms/dashboard")} className="text-sm text-green-600 hover:text-green-700 font-bold cursor-pointer bg-transparent border-0">
            ← Back to dashboard
          </button>
        </div>

        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 mb-6 text-sm text-red-700">
            {error}
          </div>
        )}

        {exams.length === 0 ? (
          <div className="rounded-3xl border border-[#e2e8f0] bg-white p-8 text-center shadow-xl">
            <p className="text-xl font-semibold text-slate-800">No exams available yet</p>
            <p className="text-sm text-slate-500 mt-2">
              Your trainer will publish the final exam once the cohort completes Week 12.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {exams.map((exam) => (
              <div key={exam.id} className="rounded-3xl border border-[#e2e8f0] bg-white p-6 lg:p-8 shadow-md">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-widest text-cyan-600 font-bold mb-2">{exam.isPublished ? "Published" : "Draft"}</p>
                    <h2 className="text-2xl font-bold text-[#002d25]">{exam.title}</h2>
                    {exam.description && (
                      <p className="text-sm text-slate-500 mt-3">{exam.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Duration</p>
                    <p className="text-xl font-black text-cyan-600 mt-1">{exam.durationMinutes} minutes</p>
                  </div>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-sm text-slate-500">
                    This exam is scheduled after the cohort completes the final training phase.
                  </div>
                  <Link
                    href={`/learn/lms/exam/${exam.id}`}
                    className="inline-flex items-center justify-center rounded-3xl bg-[#00D1C1] hover:bg-[#00b8aa] px-5 py-3 text-sm font-bold text-[#002d25] transition"
                  >
                    Start Exam
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
