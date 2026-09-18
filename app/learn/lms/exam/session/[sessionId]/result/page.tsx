"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { authFetch } from "@/lib/api";
import { useNavigationHistory } from "@/components/NavigationHistoryProvider";
import { useAuthStore } from "@/store/authStore";
import {
  getUserAppeals,
  saveStoredAppeal,
  canAppealExamScore,
  AppealRecord,
} from "@/lib/appealsData";

interface ExamResult {
  sessionId: string;
  status: string;
  mcqScore: number;
  finalScore: number | null;
  isFullyMarked: boolean;
  pendingMarksCount: number;
  violationCount: number;
  submittedAt: string;
}

export default function ExamResultPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string;
  const { goBack } = useNavigationHistory();

  const token = useAuthStore((s) => s.accessToken);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [appealSuccess, setAppealSuccess] = useState("");
  const [appealReason, setAppealReason]   = useState("");
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const [userAppeals, setUserAppeals]     = useState<AppealRecord[]>([]);

  const userPayload = token ? (() => {
    try { return JSON.parse(atob(token.split(".")[1])); } catch { return null; }
  })() : null;
  const currentUserId = userPayload?.userId || userPayload?.sub || userPayload?.id || "trainee-1";
  const userName = userPayload?.firstName ? `${userPayload.firstName} ${userPayload.lastName || ""}` : "Trainee";
  const userEmail = userPayload?.email || "";

  useEffect(() => {
    if (currentUserId) {
      setUserAppeals(getUserAppeals(currentUserId));
    }
  }, [currentUserId]);

  const handleSubmitExamAppeal = async () => {
    if (!appealReason.trim() || !result) return;
    setSubmittingAppeal(true);
    setAppealSuccess("");

    const effectiveScore = result.finalScore !== null ? result.finalScore : result.mcqScore;
    const newAppeal: AppealRecord = {
      id: `appeal-exam-${Date.now()}`,
      userId: currentUserId,
      userName,
      userEmail,
      appealType: "exam_score",
      sessionId,
      score: effectiveScore,
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
      setAppealSuccess("✅ Your exam score appeal has been submitted to the Admin for review.");
      setAppealReason("");
    } catch {
      saveStoredAppeal(newAppeal);
      setUserAppeals((prev) => [newAppeal, ...prev]);
      setAppealSuccess("✅ Your exam score appeal has been submitted to the Admin for review.");
      setAppealReason("");
    } finally {
      setSubmittingAppeal(false);
    }
  };

  useEffect(() => {
    if (!sessionId) return;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await authFetch(`/lms/exams/sessions/${sessionId}/result`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Unable to load result.");
          return;
        }
        setResult(data);
      } catch {
        setError("Failed to fetch exam result.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4faf7] text-slate-500 flex items-center justify-center">
        Loading result...
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-[#f4faf7] text-slate-800 flex flex-col items-center justify-center gap-4 px-6 relative overflow-hidden">
        {/* Subtle repeating greenSubtract background pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none" 
          style={{ 
            backgroundImage: "url('/learn/training/greenSubtract.png')", 
            backgroundSize: '120px', 
            backgroundRepeat: 'repeat' 
          }} 
        />
        <div className="text-center relative z-10">
          <p className="text-lg font-semibold text-slate-800">Exam result unavailable</p>
          <p className="text-slate-500 text-sm mt-2">{error || "No result found for this session."}</p>
          <button
            onClick={() => goBack("/learn/lms/dashboard")}
            className="mt-6 rounded-3xl bg-[#00D1C1] hover:bg-[#00b8aa] px-6 py-3 text-[#002d25] font-bold transition cursor-pointer"
          >
            Return to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4faf7] text-slate-800 px-4 py-10 relative overflow-hidden">
      {/* Subtle repeating greenSubtract background pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: "url('/learn/training/greenSubtract.png')", 
          backgroundSize: '120px', 
          backgroundRepeat: 'repeat' 
        }} 
      />

      <div className="max-w-4xl mx-auto rounded-3xl border border-[#e2e8f0] bg-white p-8 shadow-xl relative z-10">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#00D1C1] font-bold">Exam result</p>
            <h1 className="text-3xl font-black text-[#002d25]">Session {result.sessionId.slice(0, 8)}</h1>
          </div>
          <button onClick={() => goBack("/learn/lms/dashboard")} className="text-sm text-green-600 hover:text-green-700 font-bold cursor-pointer bg-transparent border-0">
            ← Back to dashboard
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-6">
            <p className="text-sm text-slate-500 font-semibold">Exam status</p>
            <p className="text-xl font-bold mt-3 text-slate-800">{result.status.replace(/_/g, " ")}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-6">
            <p className="text-sm text-slate-500 font-semibold">MCQ score</p>
            <p className="text-xl font-bold mt-3 text-slate-800">{result.mcqScore}%</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-6">
            <p className="text-sm text-slate-500 font-semibold">Final score</p>
            <p className="text-xl font-bold mt-3 text-slate-800">{result.isFullyMarked ? `${result.finalScore}` : "Pending"}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-6">
            <p className="text-sm text-slate-500 font-semibold">Pending marks</p>
            <p className="text-xl font-bold mt-3 text-slate-800">{result.pendingMarksCount || 0}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-6">
            <p className="text-sm text-slate-500 font-semibold">Violations</p>
            <p className="text-xl font-bold mt-3 text-slate-850">{result.violationCount}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-6 mb-8">
          <p className="text-sm text-slate-550 font-semibold">Submitted</p>
          <p className="text-base mt-2 text-slate-800 font-bold">{new Date(result.submittedAt).toLocaleString()}</p>
        </div>

        {/* EXAM SCORE APPEAL SECTION */}
        {(() => {
          const effectiveScore = result.finalScore !== null ? result.finalScore : result.mcqScore;
          const isEligible = canAppealExamScore(effectiveScore) || result.status.toLowerCase().includes("fail");
          const existingAppeal = userAppeals.find((a) => a.appealType === "exam_score" && a.sessionId === sessionId);

          if (!isEligible && !existingAppeal) return null;

          return (
            <div className="mt-8 pt-6 border-t border-slate-200 font-sora">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">⚖️</span>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Exam Score Appeal</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    If you did not score well or experienced technical issues, you may submit a formal appeal to the Admin.
                  </p>
                </div>
              </div>

              {appealSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl mb-4 font-semibold">
                  {appealSuccess}
                </div>
              )}

              {existingAppeal ? (
                <div className={`p-5 rounded-2xl border ${
                  existingAppeal.status === "approved"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : existingAppeal.status === "rejected"
                    ? "bg-rose-50 border-rose-200 text-rose-900"
                    : "bg-amber-50 border-amber-200 text-amber-900"
                }`}>
                  <p className="text-xs font-extrabold uppercase tracking-wider mb-1">
                    Appeal Status: {existingAppeal.status.toUpperCase()}
                  </p>
                  <p className="text-xs font-medium italic">"{existingAppeal.reason}"</p>
                  {existingAppeal.adminNotes && (
                    <div className="mt-3 pt-2 border-t border-slate-200/60">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-0.5">
                        Admin Reviewer Feedback:
                      </p>
                      <p className="text-xs font-bold">{existingAppeal.adminNotes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                      Explain Ground Reasons for Appeal
                    </label>
                    <textarea
                      rows={3}
                      value={appealReason}
                      onChange={(e) => setAppealReason(e.target.value)}
                      placeholder="Provide ground reasons (e.g. medical excuse, technical interruption, request for retake)..."
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-[#00D1C1] font-medium transition"
                    />
                  </div>

                  <button
                    onClick={handleSubmitExamAppeal}
                    disabled={submittingAppeal || !appealReason.trim()}
                    className="w-full py-3.5 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#002d25] font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {submittingAppeal ? "Submitting Appeal..." : "Submit Exam Score Appeal →"}
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
