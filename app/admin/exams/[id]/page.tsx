"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useNavigationHistory } from "@/components/NavigationHistoryProvider";
import { authFetch } from "@/lib/api";
import { lmsApi } from "@/lib/lmsApi";
import { popup } from "@/components/layout/PopupProvider";

interface Exam {
  id: string;
  title: string;
  description?: string;
  cohortId: string;
  durationMinutes: number;
  isPublished: boolean;
}

interface Question {
  id: string;
  type: "mcq" | "short_answer" | "essay";
  questionText: string;
  options: string[];
  correctOptionIndex?: number; // Only for MCQ
  marks: number;
  orderIndex: number;
}

export default function AdminExamQuestionsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const userRole = token ? (() => {
    try {
      return JSON.parse(atob(token.split(".")[1])).role;
    } catch {
      return null;
    }
  })() : null;
  const isTrainer = userRole === "trainer";

  const params = useParams();
  const router = useRouter();
  const examId = params?.id as string;
  const { goBack } = useNavigationHistory();

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    type: "mcq" as "mcq" | "short_answer" | "essay",
    questionText: "",
    options: ["", "", "", ""],
    correctOptionIndex: 0,
    marks: 1,
  });

  useEffect(() => {
    if (!examId) return;
    loadExamAndQuestions();
  }, [examId]);

  const loadExamAndQuestions = async () => {
    setLoading(true);
    setError("");
    try {
      const [examRes, questionsData] = await Promise.all([
        authFetch(`/lms/exams/${examId}`),
        lmsApi.getExamQuestions(examId).catch(() => []), // Return empty array if questions don't exist yet
      ]);

      if (examRes.ok) {
        setExam(await examRes.json());
      } else {
        setError("Failed to load exam details.");
      }

      setQuestions(questionsData.sort((a: Question, b: Question) => a.orderIndex - b.orderIndex));
    } catch {
      setError("Failed to load exam data.");
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = async () => {
    if (!form.questionText.trim()) return;

    setSaving(true);
    setError("");
    try {
      const questionData = {
        type: form.type,
        questionText: form.questionText,
        marks: form.marks,
        orderIndex: questions.length,
        ...(form.type === "mcq" && {
          options: form.options.filter(opt => opt.trim()),
          correctOptionIndex: form.correctOptionIndex,
        }),
      };

      await lmsApi.addExamQuestion(examId, questionData);

      setForm({
        type: "mcq",
        questionText: "",
        options: ["", "", "", ""],
        correctOptionIndex: 0,
        marks: 1,
      });
      setShowForm(false);
      loadExamAndQuestions();
    } catch (err: any) {
      setError(err.message || "Failed to add question.");
    } finally {
      setSaving(false);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!(await popup.confirm("Are you sure you want to delete this question?"))) return;

    setError("");
    try {
      await lmsApi.deleteExamQuestion(questionId);
      loadExamAndQuestions();
    } catch (err: any) {
      setError(err.message || "Failed to delete question.");
    }
  };

  const updateQuestionOrder = async (questionId: string, direction: "up" | "down") => {
    const currentIndex = questions.findIndex(q => q.id === questionId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;

    const updatedQuestions = [...questions];
    [updatedQuestions[currentIndex], updatedQuestions[newIndex]] = [updatedQuestions[newIndex], updatedQuestions[currentIndex]];

    // Update order indices
    const updates = updatedQuestions.map((q, index) => ({
      id: q.id,
      orderIndex: index,
    }));

    setError("");
    try {
      await Promise.all(
        updates.map(update =>
          lmsApi.updateExamQuestion(update.id, { orderIndex: update.orderIndex })
        )
      );

      loadExamAndQuestions();
    } catch (err: any) {
      setError(err.message || "Failed to reorder questions.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4faf7] text-slate-800 flex items-center justify-center">
        Loading exam questions...
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-[#f4faf7] text-slate-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold mb-3">Exam not found</p>
          <button
            onClick={() => goBack("/admin/exams")}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg"
          >
            Back to Exams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4faf7] text-slate-800 px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-cyan-400/70 mb-2">Exam Questions</p>
            <h1 className="text-3xl font-black">{exam.title}</h1>
            <p className="text-sm text-slate-400 mt-2">
              Manage questions for this exam • {questions.length} questions
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => goBack("/admin/exams")}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
            >
              ← Back to Exams
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition"
            >
              + Add Question
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-3xl border border-red-700/30 bg-red-950/40 p-5 text-sm text-red-300">
            {error}
          </div>
        )}

        {showForm && (
          <div className="rounded-3xl border border-green-700/30 bg-[#020617] p-6">
            <h3 className="text-lg font-semibold mb-4">Add New Question</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-widest mb-2">Question Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full bg-[#0a0f1a] border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="mcq">Multiple Choice (MCQ)</option>
                  <option value="short_answer">Short Answer</option>
                  <option value="essay">Essay</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-widest mb-2">Question Text</label>
                <textarea
                  value={form.questionText}
                  onChange={(e) => setForm(prev => ({ ...prev, questionText: e.target.value }))}
                  rows={3}
                  className="w-full bg-[#0a0f1a] border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Enter the question..."
                />
              </div>

              {form.type === "mcq" && (
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-widest mb-2">Options</label>
                  <div className="space-y-2">
                    {form.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="correct"
                          checked={form.correctOptionIndex === index}
                          onChange={() => setForm(prev => ({ ...prev, correctOptionIndex: index }))}
                          className="text-cyan-500"
                        />
                        <input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...form.options];
                            newOptions[index] = e.target.value;
                            setForm(prev => ({ ...prev, options: newOptions }));
                          }}
                          className="flex-1 bg-[#0a0f1a] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                          placeholder={`Option ${index + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Select the radio button for the correct answer</p>
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-widest mb-2">Marks</label>
                <input
                  type="number"
                  min={1}
                  value={form.marks}
                  onChange={(e) => setForm(prev => ({ ...prev, marks: Number(e.target.value) }))}
                  className="w-full bg-[#0a0f1a] border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={addQuestion}
                  disabled={saving || !form.questionText.trim()}
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg transition disabled:opacity-50"
                >
                  {saving ? "Adding..." : "Add Question"}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-white/10 bg-[#020617] p-6">
          <h2 className="text-xl font-semibold mb-6">Questions ({questions.length})</h2>

          {questions.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400 text-center">
              No questions added yet. Click "Add Question" to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={question.id} className="rounded-3xl border border-white/10 bg-[#08101c] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded uppercase">
                          {question.type.replace("_", " ")}
                        </span>
                        <span className="text-xs text-slate-400">
                          {question.marks} mark{question.marks !== 1 ? "s" : ""}
                        </span>
                        <span className="text-xs text-slate-500">Q{index + 1}</span>
                      </div>
                      <p className="text-white mb-3">{question.questionText}</p>

                      {question.type === "mcq" && question.options && (
                        <div className="space-y-1">
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2">
                              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-xs ${
                                optIndex === question.correctOptionIndex
                                  ? "border-green-500 bg-green-500/20"
                                  : "border-slate-600"
                              }`}>
                                {optIndex === question.correctOptionIndex && "✓"}
                              </span>
                              <span className="text-sm text-slate-300">{option}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {!isTrainer && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuestionOrder(question.id, "up")}
                          disabled={index === 0}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-50"
                          title="Move up"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => updateQuestionOrder(question.id, "down")}
                          disabled={index === questions.length - 1}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-50"
                          title="Move down"
                        >
                          ▼
                        </button>
                        <button
                          onClick={() => deleteQuestion(question.id)}
                          className="p-1 text-red-400 hover:text-red-300"
                          title="Delete question"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}