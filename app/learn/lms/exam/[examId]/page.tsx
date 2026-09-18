"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { authFetch } from "@/lib/api";
import { useNavigationHistory } from "@/components/NavigationHistoryProvider";

interface Exam {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  isPublished: boolean;
}

interface Question {
  id: string;
  type: "mcq" | "short_answer" | "essay";
  questionText: string;
  options: string[];
  marks: number;
  orderIndex: number;
}

interface Session {
  id: string;
  status: string;
  deadlineAt: string;
  startedAt: string;
  submittedAt?: string;
  mcqScore?: number;
  score?: number;
  isFullyMarked?: boolean;
  violationCount?: number;
}

interface SubmitResponse {
  session: Session;
  mcqScore: number;
  pendingMarks: boolean;
  message: string;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params?.examId as string;
  const { goBack } = useNavigationHistory();

  const [exam, setExam] = useState<Exam | null>(null);
  const [userId, setUserId] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"rules" | "exam" | "submitted">("rules");
  const [timer, setTimer] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitResult, setSubmitResult] = useState<SubmitResponse | null>(null);

  const answersRef = useRef<Record<string, string>>({});
  const autoSavingRef = useRef(false);
  const autoSubmittingRef = useRef(false);
  const ignoreFullscreenExitRef = useRef(false);
  const [showTabWarning, setShowTabWarning] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!token) {
        router.replace("/learn/lms");
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const uid = payload?.userId || payload?.id;
        if (!uid) {
          router.replace("/learn/lms");
          return;
        }
        setUserId(uid);

        const userRes = await authFetch(`/users/${uid}`);
        if (userRes.ok) {
          const userData = await userRes.json();
          const userCohortId =
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
        }
      } catch {
        router.replace("/learn/lms");
      }
    };
    checkUser();
  }, [router]);

  useEffect(() => {
    if (!examId) return;

    const loadExam = async () => {
      setError("");
      try {
        const res = await authFetch(`/lms/exams/${examId}`);
        if (!res.ok) {
          const body = await res.json();
          setError(body.error || "Exam not found.");
          return;
        }

        const data = await res.json();
        if (!data?.isPublished) {
          setError("This exam is not available yet.");
          return;
        }

        setExam(data);
      } catch {
        setError("Unable to load exam. Please try again.");
      }
    };

    loadExam();
  }, [examId]);

  useEffect(() => {
    if (!session?.deadlineAt || status !== "exam") return;

    const deadline = Math.max(0, Math.round((new Date(session.deadlineAt).getTime() - Date.now()) / 1000));
    setTimer(deadline);
  }, [session, status]);

  useEffect(() => {
    if (status !== "exam" || timer <= 0) return;

    const interval = window.setInterval(() => {
      setTimer((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          handleSubmit(true);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [status, timer]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    if (status !== "exam" || !session?.id) return;

    const interval = window.setInterval(() => {
      saveAnswers();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [status, session?.id]);

  const saveAnswers = async () => {
    if (!session?.id || autoSavingRef.current) return;
    autoSavingRef.current = true;

    try {
      await authFetch(`/lms/exams/sessions/${session.id}/autosave`, {
        method: "PATCH",
        body: JSON.stringify({ answers: answersRef.current }),
      });
    } catch {
      // silent failure - autosave will retry next interval
    } finally {
      autoSavingRef.current = false;
    }
  };

  const parseSavedAnswers = (savedAnswers: any[]) => {
    return savedAnswers.reduce((acc: Record<string, string>, item: any) => {
      if (item.questionId && item.answerText !== null && item.answerText !== undefined) {
        acc[item.questionId] = String(item.answerText);
      }
      return acc;
    }, {});
  };

  const handleStart = async () => {
    if (!examId || !userId) return;
    setSubmitting(true);
    setError("");
    ignoreFullscreenExitRef.current = false;

    try {
      if (typeof document !== "undefined" && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen().catch(() => undefined);
      }

      const res = await authFetch(`/lms/exams/${examId}/sessions/start`, {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 && data.sessionId) {
          router.push(`/learn/lms/exam/session/${data.sessionId}/result`);
          return;
        }
        setError(data.error || "Unable to start exam.");
        return;
      }

      setSession(data.session);
      setQuestions(data.questions || []);
      setAnswers(parseSavedAnswers(data.savedAnswers || []));

      if (data.session.status !== "in_progress") {
        router.push(`/learn/lms/exam/session/${data.session.id}/result`);
        return;
      }

      setStatus("exam");
    } catch {
      setError("Failed to begin exam.");
    } finally {
      setSubmitting(false);
    }
  };

  const logViolation = async (type: "tab_switch" | "fullscreen_exit" | "devtools" | "copy_paste") => {
    if (!session?.id) return null;
    try {
      const res = await authFetch(`/lms/exams/sessions/${session.id}/violations`, {
        method: "POST",
        body: JSON.stringify({ type }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.autoSubmitted) {
          ignoreFullscreenExitRef.current = true;
          if (typeof document !== "undefined" && document.fullscreenElement) {
            await document.exitFullscreen().catch(() => undefined);
          }
          setSubmitResult({
            session: {
              ...session,
              status: "auto_submitted",
              violationCount: data.violationCount,
            },
            mcqScore: data.mcqScore || 0,
            pendingMarks: true,
            message: data.message || "Exam auto-submitted due to repeated violations.",
          });
          setStatus("submitted");
          return { autoSubmitted: true };
        }
        return data;
      }
    } catch (err) {
      console.error("Failed to log violation:", err);
    }
    return null;
  };

  const terminateExamOnFullscreenExit = async () => {
    if (ignoreFullscreenExitRef.current || !session?.id) return;
    ignoreFullscreenExitRef.current = true;
    setSubmitting(true);
    setError("Terminating exam due to fullscreen exit...");

    try {
      await authFetch(`/lms/exams/sessions/${session.id}/violations`, {
        method: "POST",
        body: JSON.stringify({ type: "fullscreen_exit" }),
      });

      const res = await authFetch(`/lms/exams/sessions/${session.id}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers: answersRef.current }),
      });
      const data = await res.json();

      if (res.ok) {
        setSubmitResult(data);
        setSession(data.session ?? session);
        setStatus("submitted");
      } else {
        setError(data.error || "Exam terminated due to fullscreen exit.");
      }
    } catch {
      setError("Exam terminated due to fullscreen exit.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (auto = false) => {
    if (!session?.id || submitting || autoSubmittingRef.current) return;
    autoSubmittingRef.current = auto;
    setSubmitting(true);
    setError("");

    try {
      ignoreFullscreenExitRef.current = true;
      if (typeof document !== "undefined" && document.fullscreenElement) {
        await document.exitFullscreen().catch(() => undefined);
      }

      const res = await authFetch(`/lms/exams/sessions/${session.id}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers: answersRef.current }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit exam.");
        return;
      }

      setSubmitResult(data);
      setSession(data.session ?? session);
      setStatus("submitted");
    } catch {
      setError("Unable to submit the exam.");
    } finally {
      setSubmitting(false);
      autoSubmittingRef.current = false;
    }
  };

  useEffect(() => {
    if (status !== "exam" || !session?.id) return;

    const handleFullscreenChange = () => {
      if (ignoreFullscreenExitRef.current) return;
      if (!document.fullscreenElement) {
        terminateExamOnFullscreenExit();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        logViolation("tab_switch").then((res) => {
          if (res && (res as any).autoSubmitted) return;
          setShowTabWarning(true);
        });
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [status, session?.id]);

  const answeredCount = useMemo(
    () => questions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== "").length,
    [answers, questions]
  );

  if (!exam) {
    return (
      <div className="min-h-screen bg-[#f4faf7] text-slate-800 flex items-center justify-center px-6 py-10">
        <div className="max-w-lg text-center">
          <p className="text-xl font-semibold mb-3">Loading exam...</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
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

      <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-cyan-600 font-bold">Exam</p>
            <h1 className="text-3xl font-black tracking-tight text-[#002d25]">{exam.title}</h1>
            {exam.description && <p className="text-sm text-slate-500 mt-2">{exam.description}</p>}
          </div>
          <button onClick={() => goBack("/learn/lms/dashboard")} className="text-sm text-green-600 hover:text-green-700 font-bold cursor-pointer bg-transparent border-0">
            ← Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 mb-6">
            {error}
          </div>
        )}

        {status === "rules" && (
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="bg-white border border-[#e2e8f0] rounded-3xl p-8 shadow-md">
              <h2 className="text-xl font-bold mb-4 text-[#002d25]">Before you begin</h2>
              <div className="space-y-4 text-sm text-slate-600">
                <p>Read the rules below carefully. Once you begin, the timer starts immediately.</p>
                <ul className="space-y-3 list-disc pl-5">
                  <li>Finish within <strong>{exam.durationMinutes} minutes</strong>.</li>
                  <li>Your answers are auto-saved every 30 seconds.</li>
                  <li>If the timer expires, the exam is auto-submitted.</li>
                  <li>Short answer and essay questions will be marked by an admin.</li>
                  <li className="text-red-600 font-semibold">Exiting fullscreen mode will result in immediate termination and submission of your exam.</li>
                  <li className="text-amber-600 font-medium">Opening or switching tabs will trigger a warning. Accumulating 3 violations will auto-submit the exam.</li>
                </ul>
                <p className="text-sm text-slate-500">When you are ready, click Start Exam and the portal will enter fullscreen mode.</p>
              </div>
            </div>

            <div className="bg-white border border-[#e2e8f0] rounded-3xl p-8 shadow-md flex flex-col justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-450 mb-2 font-bold">Exam details</p>
                <div className="space-y-3 text-sm text-slate-655 font-medium">
                  <p><span className="font-semibold text-slate-800">Duration:</span> {exam.durationMinutes} minutes</p>
                  <p><span className="font-semibold text-slate-800">Questions:</span> {questions.length || "Loading..."}</p>
                  <p><span className="font-semibold text-slate-800">Autosave:</span> every 30 seconds</p>
                </div>
              </div>
              <button
                onClick={handleStart}
                disabled={submitting}
                className="mt-8 w-full bg-[#00D1C1] hover:bg-[#00b8aa] text-[#002d25] font-bold rounded-2xl py-3 transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Starting exam..." : "Start Exam"}
              </button>
            </div>
          </div>
        )}

        {status === "exam" && session && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">In progress</p>
                <h2 className="text-2xl font-bold text-[#002d25]">Answer the questions</h2>
              </div>
              <div className="rounded-3xl bg-white border border-[#e2e8f0] px-5 py-4 text-center shadow-sm">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Time remaining</p>
                <p className="text-3xl font-black text-cyan-600">{formatTime(timer)}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-[#e2e8f0] bg-white p-6 shadow-md">
              <div className="flex flex-wrap gap-3 mb-5 text-sm text-slate-600">
                <span className="rounded-full bg-slate-50 border border-slate-100 px-3 py-2 font-semibold">Autosaving every 30 seconds</span>
                <span className="rounded-full bg-slate-50 border border-slate-100 px-3 py-2 font-semibold">Session ID: {session.id.slice(0, 8)}</span>
              </div>

              <div className="space-y-6">
                {questions.map((question, qi) => (
                  <div key={question.id} className="rounded-3xl border border-slate-200 bg-slate-50/50 p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00D1C1]/20 text-cyan-700 font-black">{qi + 1}</span>
                      <div>
                        <p className="font-semibold text-slate-800">{question.questionText}</p>
                        <p className="text-xs text-slate-500">{question.type === "mcq" ? `${question.options.length} choices` : question.type === "short_answer" ? "Short answer" : "Essay question"}</p>
                      </div>
                    </div>

                    {question.type === "mcq" ? (
                      <div className="grid gap-3">
                        {question.options.map((option, oi) => (
                          <button key={oi}
                            type="button"
                            onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: String(oi) }))}
                            className={`w-full rounded-2xl border px-4 py-3 text-left transition cursor-pointer ${answers[question.id] === String(oi)
                              ? "border-[#00D1C1] bg-[#00D1C1]/10 text-[#002d25] font-bold"
                              : "border-slate-200 text-slate-700 bg-white hover:border-slate-300 hover:bg-slate-50"
                            }`}>
                            <span className="font-bold mr-3 text-cyan-600">{["A", "B", "C", "D"][oi] || String.fromCharCode(65 + oi)}.</span>
                            {option}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <textarea
                        value={answers[question.id] || ""}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                        rows={question.type === "essay" ? 6 : 4}
                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-[#00D1C1]"
                        placeholder={question.type === "essay" ? "Write your answer here..." : "Type your answer..."}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-slate-500">
                  {answeredCount}/{questions.length} answered
                </div>
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={submitting}
                  className="w-full md:w-auto rounded-3xl bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Submitting..." : "Submit Exam"}
                </button>
              </div>
            </div>
          </div>
        )}

        {status === "submitted" && submitResult && (
          <div className="rounded-3xl border border-[#e2e8f0] bg-white p-8 mt-6 shadow-xl">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Exam submitted</p>
              <h2 className="text-3xl font-black text-[#002d25]">{submitResult.pendingMarks ? "Your answers are under review" : "Your exam is complete"}</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 border border-slate-200 p-5">
                <p className="text-sm text-slate-500">MCQ score</p>
                <p className="text-3xl font-black text-cyan-600">{submitResult.mcqScore}%</p>
              </div>
              <div className="rounded-3xl bg-slate-50 border border-slate-200 p-5">
                <p className="text-sm text-slate-400">Final status</p>
                <p className="text-2xl font-black text-slate-800">{submitResult.pendingMarks ? "Pending review" : "Complete"}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mt-6">{submitResult.message}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={`/learn/lms/exam/session/${submitResult.session?.id || session?.id}/result`}
                className="inline-flex items-center justify-center rounded-3xl bg-[#00D1C1] hover:bg-[#00b8aa] px-6 py-3 text-[#002d25] font-bold transition">
                View result page
              </Link>
              <Link href="/learn/lms/dashboard"
                className="inline-flex items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-3 text-sm text-slate-700 hover:bg-slate-50 transition">
                Return to dashboard
              </Link>
            </div>
          </div>
        )}
      </div>

      {showTabWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-[#e2e8f0] rounded-3xl p-6 text-center shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-3xl mb-4">
              ⚠️
            </div>
            <h3 className="text-xl font-bold text-slate-850 mb-2">Tab Switch Detected</h3>
            <p className="text-sm text-slate-600 mb-6">
              You are not allowed to switch tabs or open other windows during the exam. 
              Accumulating 3 violations will result in the immediate automatic submission of your exam.
            </p>
            <button
              onClick={() => setShowTabWarning(false)}
              className="w-full rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 transition cursor-pointer"
            >
              I Understand & Resume Exam
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
