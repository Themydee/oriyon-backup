  "use client";

  import { useEffect, useState } from "react";
  import { useParams } from "next/navigation";
import Link from "next/link";
import { authFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useNavigationHistory } from "@/components/NavigationHistoryProvider";

  interface Question {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
  }

  interface Quiz {
    id: string;
    title: string;
    questions: Question[];
    passingScore: number;
    isPublished: boolean;
  }

  interface Week {
    weekNumber: number;
    title: string;
    cohortId: string;
  }

  function blankQuestion(): Question {
    return {
      id: crypto.randomUUID(),
      question: "",
      options: ["", "", "", ""],
      correctIndex: 0,
    };
  }

export default function QuizPage() {
  const token = useAuthStore((s) => s.accessToken);
  const userRole = token ? (() => {
    try {
      return JSON.parse(atob(token.split(".")[1])).role;
    } catch {
      return null;
    }
  })() : null;
  const isTrainer = userRole === "trainer";

  const { weekId } = useParams();
  const { goBack } = useNavigationHistory();
  const [week, setWeek]       = useState<Week | null>(null);
    const [quiz, setQuiz]       = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving]   = useState(false);
    const [error, setError]     = useState("");
    const [saveMsg, setSaveMsg] = useState("");

    // Quiz form state
    const [title, setTitle]               = useState("Weekly Quiz");
    const [passingScore, setPassingScore] = useState(70);
    const [isPublished, setIsPublished]   = useState(false);
    const [questions, setQuestions]       = useState<Question[]>([blankQuestion()]);

    useEffect(() => {
      const load = async () => {
        try {
          const [weekRes, quizRes] = await Promise.all([
            authFetch(`/lms/weeks/${weekId}`),
            authFetch(`/lms/quizzes/week/${weekId}`),
          ]);

          if (weekRes.ok) {
            const w = await weekRes.json();
            setWeek(w);
          }

          if (quizRes.ok) {
            const quizzes = await quizRes.json();
            if (quizzes.length > 0) {
              const q = quizzes[0];
              setQuiz(q);
              setTitle(q.title);
              setPassingScore(70);
              setIsPublished(q.isPublished);
              setQuestions(q.questions.length > 0 ? q.questions : [blankQuestion()]);
            }
          }
        } catch {
          setError("Failed to load quiz.");
        } finally {
          setLoading(false);
        }
      };
      load();
    }, [weekId]);

    const addQuestion = () => setQuestions([...questions, blankQuestion()]);

    const removeQuestion = (i: number) =>
      setQuestions(questions.filter((_, idx) => idx !== i));

    const updateQuestion = (i: number, field: keyof Question, value: any) => {
      setQuestions(questions.map((q, idx) => idx === i ? { ...q, [field]: value } : q));
    };

    const updateOption = (qi: number, oi: number, value: string) => {
      setQuestions(questions.map((q, idx) => {
        if (idx !== qi) return q;
        const opts = [...q.options];
        opts[oi] = value;
        return { ...q, options: opts };
      }));
    };

    const saveQuiz = async () => {
      const validQuestions = questions.filter((q) => q.question.trim() && q.options.every((o) => o.trim()));
      if (validQuestions.length === 0) {
        setError("Add at least one complete question.");
        return;
      }

      setSaving(true);
      setError("");

      try {
        const payload = {
          title,
          passingScore,
          isPublished,
          questions: validQuestions,
          weekId,
          cohortId: week?.cohortId,
        };

        let res;
        if (quiz) {
          res = await authFetch(`/lms/quizzes/${quiz.id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          });
        } else {
          res = await authFetch("/lms/quizzes", {
            method: "POST",
            body: JSON.stringify(payload),
          });
        }

        if (res.ok) {
          const data = await res.json();
          setQuiz(data);
          setSaveMsg("Saved!");
          setTimeout(() => setSaveMsg(""), 2000);
        } else {
          setError("Failed to save quiz.");
        }
      } catch {
        setError("Failed to save quiz.");
      } finally {
        setSaving(false);
      }
    };

    const inp = "w-full bg-[#0a0f1a] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-600 transition";

    if (loading) return <div className="flex items-center justify-center py-20 text-slate-500 text-sm">Loading...</div>;

    return (
      <div>
        <div className="mb-8">
          <button onClick={() => goBack("/admin/curriculum")} className="text-xs text-slate-500 hover:text-slate-300 transition mb-2 inline-block cursor-pointer">
            ← Back to Curriculum
          </button>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-1">
            Week {week?.weekNumber} — Quiz
          </h1>
          <p className="text-slate-500 text-sm">{week?.title}</p>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-700/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">{error}</div>
        )}

      {/* Quiz settings */}
      <div className="bg-[#020617] border border-slate-800 rounded-2xl p-5 mb-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Quiz Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-500 uppercase tracking-widest mb-2">Quiz Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inp} disabled={isTrainer && !!quiz} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-widest mb-2">Passing Score (%)</label>
            <input type="number" min={1} max={100} value={passingScore}
              onChange={(e) => setPassingScore(parseInt(e.target.value))} className={inp} disabled={isTrainer && !!quiz} />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer mt-4">
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} disabled={isTrainer && !!quiz} />
          <span className="text-sm text-slate-400">Publish quiz (trainees can see and attempt it)</span>
        </label>
      </div>

        {/* Questions */}
        <div className="flex flex-col gap-4 mb-6">
          {questions.map((q, qi) => (
            <div key={q.id} className="bg-[#020617] border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Question {qi + 1}</p>
                {questions.length > 1 && !(isTrainer && !!quiz) && (
                  <button onClick={() => removeQuestion(qi)}
                    className="text-xs text-red-400 border border-red-700/30 hover:bg-red-500/10 px-2.5 py-1 rounded-lg transition">
                    Remove
                  </button>
                )}
              </div>

              <div className="mb-4">
                <input
                  value={q.question}
                  onChange={(e) => updateQuestion(qi, "question", e.target.value)}
                  placeholder="Enter your question..."
                  className={inp}
                  disabled={isTrainer && !!quiz}
                />
              </div>

              <div className="flex flex-col gap-2 mb-3">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name={`correct-${q.id}`}
                      checked={q.correctIndex === oi}
                      onChange={() => updateQuestion(qi, "correctIndex", oi)}
                      className="flex-shrink-0"
                      disabled={isTrainer && !!quiz}
                    />
                    <input
                      value={opt}
                      onChange={(e) => updateOption(qi, oi, e.target.value)}
                      placeholder={`Option ${oi + 1}`}
                      className={`${inp} flex-1`}
                      disabled={isTrainer && !!quiz}
                    />
                    {q.correctIndex === oi && (
                      <span className="text-xs text-green-400 font-bold flex-shrink-0">✓ Correct</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-600">Select the radio button next to the correct answer</p>
            </div>
          ))}
        </div>

        {isTrainer && !!quiz ? (
          <div className="bg-yellow-950/40 border border-yellow-700/30 text-yellow-400 text-sm px-4 py-3 rounded-xl">
            ⚠️ As a trainer, you do not have permission to modify existing quiz content. You may only view it.
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={addQuestion}
              className="px-4 py-2.5 border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white text-sm font-semibold rounded-xl transition">
              + Add Question
            </button>
            <button onClick={saveQuiz} disabled={saving}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-xl transition disabled:opacity-50">
              {saving ? "Saving..." : quiz ? "Save Changes" : "Create Quiz"}
            </button>
            {saveMsg && <p className="text-xs text-green-400">{saveMsg}</p>}
          </div>
        )}
      </div>
    );
  }