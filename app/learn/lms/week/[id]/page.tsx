
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useNavigationHistory } from "@/components/NavigationHistoryProvider";
import { authFetch, refreshAccessToken } from "@/lib/api";
import { getUserPracticalCheckinWeeks, fetchAndSyncUserPracticalCheckins } from "@/lib/practicalData";
import { getStoredReadings, ReadingMaterial } from "@/lib/readingsData";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Lesson {
  id: string;
  title: string;
  description: string;
  type: "video" | "document";
  videoUrl: string;
  audioUrl?: string;
  body: string;
  durationMinutes: number;
  order: number;
  isPublished: boolean;
}

interface Week {
  id: string;
  weekNumber: number;
  title: string;
  description: string;
  requiresQuizPass: boolean;
  cohortId: string;
  lessons: Lesson[];
  objectives: string[];
  unlockDate?: string | null;
}

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
}

interface Exam {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  isPublished: boolean;
}

type MobilePanel = "overview" | "lesson" | "lessons" | "quiz";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getEmbedSrc(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("enablejsapi", "1");
    u.searchParams.set("rel", "0");
    u.searchParams.set("modestbranding", "1");
    if (typeof window !== "undefined") {
      u.searchParams.set("origin", window.location.origin);
    }
    return u.toString();
  } catch { return url; }
}

type Block =
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "image"; url: string; caption?: string }
  | { type: "paragraph"; text: string }
  | { type: "spacer" };

function parseLessonBody(text: string): Block[] {
  if (!text) return [];
  const lines = text.split("\n");
  const blocks: Block[] = [];
  let currentList: string[] = [];
  let currentTableLines: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      blocks.push({ type: "list", items: currentList });
      currentList = [];
    }
  };

  const flushTable = () => {
    if (currentTableLines.length > 0) {
      const tableLines = currentTableLines.map(line =>
        line
          .trim()
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map(cell => cell.trim())
      );

      if (tableLines.length > 0) {
        const headers = tableLines[0];
        let rows = tableLines.slice(1);
        if (rows.length > 0 && rows[0].every(cell => /^[-:]+$/.test(cell))) {
          rows = rows.slice(1);
        }
        blocks.push({ type: "table", headers, rows });
      }
      currentTableLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("🖼️") || (trimmed.startsWith("![") && trimmed.includes("]("))) {
      flushList();
      flushTable();
      if (trimmed.startsWith("🖼️")) {
        const parts = trimmed.substring(2).trim().split("|");
        blocks.push({ type: "image", url: parts[0].trim(), caption: parts[1]?.trim() });
      } else {
        const match = trimmed.match(/!\[(.*?)\]\((.*?)\)/);
        if (match) {
          blocks.push({ type: "image", caption: match[1], url: match[2] });
        }
      }
      continue;
    }

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushList();
      currentTableLines.push(line);
      continue;
    } else {
      flushTable();
    }

    if (line.startsWith("•")) {
      currentList.push(line.substring(1).trim());
      continue;
    } else {
      flushList();
    }

    if (line.startsWith("📌")) {
      blocks.push({ type: "heading", text: line.substring(1).trim() });
    } else if (line === "") {
      blocks.push({ type: "spacer" });
    } else {
      blocks.push({ type: "paragraph", text: line });
    }
  }

  flushList();
  flushTable();

  return blocks;
}

function LessonBody({ body }: { body: string }) {
  const blocks = parseLessonBody(body);
  return (
    <div className="space-y-2">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            return (
              <div key={i} className="flex gap-2 items-start font-bold text-sm md:text-base mt-6 mb-2 text-green-700">
                <span className="flex-shrink-0 mt-0.5">📌</span>
                <span>{block.text}</span>
              </div>
            );
          case "image":
            return (
              <div key={i} className="my-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm max-w-2xl">
                <img src={block.url} alt={block.caption || "Lesson diagram"} className="w-full h-auto object-cover max-h-[500px]" />
                {block.caption && (
                  <p className="p-3 text-center text-xs font-semibold text-slate-600 bg-slate-50 border-t border-slate-100">
                    📷 {block.caption}
                  </p>
                )}
              </div>
            );
          case "list":
            return (
              <div key={i} className="flex flex-col gap-1.5 pl-2 mb-2">
                {block.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 text-slate-700 text-sm">
                    <span className="flex-shrink-0 text-green-600 font-bold">•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            );
          case "table":
            return (
              <div key={i} className="my-4 overflow-x-auto border border-slate-200 rounded-xl bg-slate-50/50">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100">
                      {block.headers.map((header, idx) => (
                        <th key={idx} className="px-4 py-3 font-bold text-slate-700 text-xs uppercase tracking-wider">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors">
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx} className="px-4 py-3 text-slate-600 font-medium">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "spacer":
            return <div key={i} className="h-3" />;
          case "paragraph":
            return <p key={i} className="text-slate-700 text-sm leading-relaxed mb-2 font-medium">{block.text}</p>;
          default:
            return null;
        }
      })}
    </div>
  );
}

function OverviewPanel({ week, completedCount, totalCount, nextUnlockedLessonIndex, onStartLesson, onOpenReadingModal }: {
  week: Week; completedCount: number; totalCount: number; nextUnlockedLessonIndex: number; onStartLesson: (idx: number) => void; onOpenReadingModal: (reading: any) => void;
}) {
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const weekReadings = getStoredReadings().filter((r) => r.recommendedWeek === week.weekNumber);

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 md:px-8 py-6"
      style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,0,0,0.08) transparent" }}>
      <div className="mb-6">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
          Week {week.weekNumber} Overview
        </span>
        <h2 className="text-xl md:text-2xl font-black text-[#002d25] mt-4">{week.title}</h2>
        {week.description && (
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">{week.description}</p>
        )}
      </div>

      {/* WEEK RECOMMENDED READING MINIMAL CARD */}
      {weekReadings.length > 0 && (
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 mb-8 shadow-xs font-sora space-y-3">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2.5 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-lg">📚</span>
              <h3 className="text-xs md:text-sm font-black text-[#002d25] uppercase tracking-wider">
                Week {week.weekNumber} Recommended Reading
              </h3>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Pre-Lesson Reference
            </span>
          </div>

          {weekReadings.map((reading) => (
            <div key={reading.id}>
              {reading.chapterReference && (
                <div className="bg-amber-50 border border-amber-200/90 text-amber-950 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2">
                  <span className="text-sm">📖</span>
                  <span className="text-slate-600 font-medium">Textbook Chapter Reference:</span>
                  <span className="font-black text-amber-900">{reading.chapterReference}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">🎯 Weekly Objectives</p>
          {week.objectives && week.objectives.length > 0 ? (
            <ul className="space-y-3">
              {week.objectives.map((obj, i) => (
                <li key={i} className="text-sm text-slate-600 flex items-start gap-3 font-medium">
                  <span className="w-5 h-5 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-[10px] text-green-600 font-bold flex-shrink-0 mt-0.5">
                    ✓
                  </span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">No specific objectives listed for this week.</p>
          )}
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">📈 Your Progress</p>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-black text-[#002d25]">{completedCount}</span>
              <span className="text-sm text-slate-400">/ {totalCount} Lessons Complete</span>
            </div>
            <p className="text-xs text-slate-550 mb-4 font-semibold">{pct}% of this week's content completed</p>
          </div>
          
          <div className="space-y-3">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            {totalCount > 0 ? (
              <button
                onClick={() => onStartLesson(nextUnlockedLessonIndex)}
                className="w-full py-2.5 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#002d25] font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{completedCount === 0 ? "Start Learning" : completedCount === totalCount ? "Review Material" : "Continue Lesson"}</span>
                <span>→</span>
              </button>
            ) : (
              <div className="text-center py-2 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-xs text-slate-400">No lessons are published yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>



      {week.weekNumber <= 11 && (
        <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-2xl p-5 mb-8 border border-emerald-800 shadow-md flex items-center justify-between gap-4 flex-wrap">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#00D1C1]">
              🐐 Mandatory Field Session
            </span>
            <h3 className="text-lg font-black text-white mt-0.5">
              Week {week.weekNumber} Practical Attendance
            </h3>
            <p className="text-xs text-emerald-200/80 mt-1 max-w-md font-medium">
              You must complete practical attendance for Week {week.weekNumber} to unlock Week {week.weekNumber + 1} online modules.
            </p>
          </div>
          <Link
            href={`/learn/lms/practical-attendance?week=${week.weekNumber}`}
            className="px-5 py-2.5 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#002d25] font-extrabold text-xs rounded-xl transition shadow-sm font-mono uppercase"
          >
            Check In Practical Code →
          </Link>
        </div>
      )}

      {totalCount === 0 && (
        <div className="bg-yellow-50 border border-yellow-250 rounded-2xl p-5 text-center">
          <span className="text-2xl mb-2 block">⏳</span>
          <p className="text-sm font-bold text-yellow-750">Lessons are being prepared</p>
          <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
            Your trainer is currently working on the learning material for this week. As soon as lessons are published, they will appear in your sidebar.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Quiz Panel ───────────────────────────────────────────────────────────────
function QuizPanel({ quiz, userId, weekId, cohortId, onPassed }: {
  quiz: Quiz; userId: string; weekId: string; cohortId: string; onPassed: () => void;
}) {
  const [answers, setAnswers]     = useState<Record<string, number>>({});
  const [result, setResult]       = useState<{ score: number; passed: boolean; correct: number; total: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState("");

  const allAnswered = quiz.questions.every((q) => answers[q.id] !== undefined);

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res  = await authFetch(`/lms/quizzes/${quiz.id}/attempt`, {
        method: "POST",
        body: JSON.stringify({ userId, weekId, cohortId, answers }),
      });
      const data = await res.json();
      if (res.ok) {
        const isPassed = Boolean(data.passed) || (typeof data.score === "number" && data.score >= 70);
        const normalizedData = { ...data, passed: isPassed };
        setResult(normalizedData);
        if (isPassed) setTimeout(onPassed, 2500);
      } else {
        setError(data.error || "Failed to submit.");
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) return (
    <div className="flex flex-col items-center justify-center h-full px-8 py-12 text-center relative z-10">
      <div className="text-6xl mb-4">{result.passed ? "🎉" : "😔"}</div>
      <h2 className={`text-2xl font-black mb-2 ${result.passed ? "text-green-600" : "text-red-600"}`}>
        {result.passed ? "Quiz Passed!" : "Not Quite"}
      </h2>
      <p className="text-slate-500 text-sm mb-2">
        You scored <span className="text-slate-800 font-bold">{result.score}%</span> ({result.correct}/{result.total} correct)
      </p>
      <p className="text-slate-400 text-xs">
        {result.passed ? "Moving to dashboard..." : `You need 70% to pass. Review the lessons and try again.`}
      </p>
      {!result.passed && (
        <button onClick={() => { setResult(null); setAnswers({}); }}
          className="mt-6 px-6 py-2.5 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#002d25] text-sm font-bold rounded-xl transition cursor-pointer">
          Try Again
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-y-auto px-4 md:px-8 py-6 relative z-10"
      style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,0,0,0.08) transparent" }}>
      <div className="mb-6">
        <h2 className="text-xl font-black text-[#002d25] mb-1">{quiz.title}</h2>
        <p className="text-slate-550 text-xs">Answer all questions · Passing score: 70%</p>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
      )}
      <div className="flex flex-col gap-6 mb-8">
        {quiz.questions.map((q, qi) => (
          <div key={q.id} className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-800 mb-4">
              <span className="text-green-600 font-bold mr-2">{qi + 1}.</span>
              {q.question}
            </p>
            <div className="flex flex-col gap-2">
              {q.options.map((opt, oi) => (
                <button key={oi} onClick={() => setAnswers({ ...answers, [q.id]: oi })}
                  className={`text-left px-4 py-3 rounded-xl border text-sm transition cursor-pointer ${
                    answers[q.id] === oi
                      ? "border-green-600 bg-green-50 text-green-700 font-bold"
                      : "border-slate-200 text-slate-600 bg-white hover:border-slate-350 hover:bg-slate-50"
                  }`}>
                  <span className="font-bold mr-2 text-slate-400">{["A","B","C","D"][oi]}.</span>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button onClick={submit} disabled={!allAnswered || submitting}
        className="w-full py-3 bg-[#00D1C1] hover:bg-[#00b8aa] text-[#002d25] font-black rounded-xl transition disabled:opacity-50 cursor-pointer">
        {submitting ? "Submitting..." : "Submit Quiz"}
      </button>
      {!allAnswered && (
        <p className="text-slate-400 text-xs text-center mt-3 font-semibold">Answer all questions to submit</p>
      )}
    </div>
  );
}

// ─── Audio Player Widget ──────────────────────────────────────────────────────
function AudioPlayerWidget({ url, onAudioEnded }: { url: string; onAudioEnded?: () => void }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [audioError, setAudioError] = useState(false);

  // Format and sanitize URL (ensure absolute protocol https://)
  const formatAudioUrl = (rawUrl: string): { cleanUrl: string; isValid: boolean } => {
    let clean = rawUrl.trim();
    if (!clean) return { cleanUrl: "", isValid: false };

    // Check if user accidentally pasted console error log text
    if (clean.includes("Failed to load resource") || clean.includes("Internal Server Error") || clean.includes("Status of 500")) {
      return { cleanUrl: clean, isValid: false };
    }

    if (clean.startsWith("s3://")) {
      const parts = clean.substring(5).split("/");
      const bucket = parts[0];
      const key = parts.slice(1).join("/");
      clean = `https://${bucket}.s3.amazonaws.com/${key}`;
    } else if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
      clean = `https://${clean}`;
    }

    clean = clean.replace(/ /g, "%20");
    return { cleanUrl: clean, isValid: true };
  };

  const { cleanUrl, isValid } = formatAudioUrl(url);

  const togglePlay = () => {
    if (!audioRef.current || !isValid) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current.readyState === 0) {
        audioRef.current.load();
      }
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setAudioError(false);
      }).catch((err) => {
        console.error("Audio playback error:", err);
        setAudioError(true);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setAudioError(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIndex];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const lowerUrl = cleanUrl.toLowerCase();
  const primaryMime = lowerUrl.endsWith(".wav")
    ? "audio/wav"
    : lowerUrl.endsWith(".m4a") || lowerUrl.endsWith(".aac") || lowerUrl.endsWith(".mp4")
    ? "audio/mp4"
    : lowerUrl.endsWith(".ogg")
    ? "audio/ogg"
    : "audio/mpeg";

  return (
    <div className="bg-gradient-to-r from-[#002d25] via-[#00382e] to-[#00241d] text-white rounded-2xl p-4 md:p-5 mb-6 border border-emerald-800/60 shadow-lg relative overflow-hidden">
      {isValid && (
        <audio
          ref={audioRef}
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={() => setAudioError(true)}
          onEnded={() => {
            setIsPlaying(false);
            onAudioEnded?.();
          }}
        >
          <source src={cleanUrl} type={primaryMime} />
          <source src={cleanUrl} type="audio/mpeg" />
          <source src={cleanUrl} type="audio/wav" />
          <source src={cleanUrl} type="audio/mp4" />
          <source src={cleanUrl} type="audio/ogg" />
        </audio>
      )}
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#00D1C1]/20 border border-[#00D1C1]/40 flex items-center justify-center text-[#00D1C1] text-sm">
            🎧
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Audio Narration / Lecture</h4>
            <p className="text-[10px] text-emerald-200/70 font-medium">Listen while reading lesson text below</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cyclePlaybackRate}
            className="px-2.5 py-1 bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-700/50 text-[10px] font-mono font-bold text-[#00D1C1] rounded-lg transition"
            title="Change Playback Speed"
          >
            {playbackRate}x
          </button>
          <button
            type="button"
            onClick={toggleMute}
            className="p-1.5 bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-700/50 text-xs text-slate-300 rounded-lg transition"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? "🔇" : "🔊"}
          </button>
        </div>
      </div>

      {!isValid && (
        <div className="mt-3 bg-amber-950/80 border border-amber-700/60 rounded-xl p-3.5 text-xs text-amber-200 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <span>⚠️ Invalid Audio URL in Lesson Settings</span>
          </div>
          <p className="text-[11px] text-amber-300/90 leading-relaxed">
            The saved Audio URL for this lesson contains an invalid link or error text. Please open the <strong>Admin Panel → Curriculum</strong>, edit this lesson, and enter a valid MP3 audio URL (e.g. <code>https://your-bucket.s3.amazonaws.com/audio.mp3</code>).
          </p>
        </div>
      )}

      {isValid && audioError && (
        <div className="mt-3 bg-red-950/80 border border-red-700/60 rounded-xl p-3.5 text-xs text-red-200 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-red-300">⚠️ Audio Stream Unavailable</span>
            <a
              href={cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00D1C1] font-bold hover:underline font-mono text-[11px]"
            >
              Open Direct Audio Link ↗
            </a>
          </div>
          <p className="text-[11px] text-red-300/80 leading-relaxed">
            The browser could not play this audio file directly. Check the S3 bucket object permission (Public Read) and CORS configuration.
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-[#00D1C1] hover:bg-[#00b8aa] text-[#002d25] flex items-center justify-center font-bold text-base transition shadow-md flex-shrink-0 cursor-pointer"
        >
          {isPlaying ? "❚❚" : "▶"}
        </button>

        <div className="flex-1 flex items-center gap-2">
          <span className="text-[10px] font-mono text-emerald-200/80 w-8 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1.5 bg-emerald-950/80 rounded-lg appearance-none cursor-pointer accent-[#00D1C1]"
          />
          <span className="text-[10px] font-mono text-emerald-200/80 w-8">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Lesson Panel ─────────────────────────────────────────────────────────────
function LessonPanel({ lesson, index, total, isDone, nextUnlocked, onComplete, onNext, onPrev }: {
  lesson: Lesson; index: number; total: number;
  isDone: boolean; nextUnlocked: boolean;
  onComplete: () => void; onNext: () => void; onPrev: () => void;
}) {
  const isVideo = lesson.type === "video" && Boolean(lesson.videoUrl);
  const hasAudio = Boolean(lesson.audioUrl);
  const [audioFinished, setAudioFinished] = useState(false);
  const [scrollPct, setScrollPct]         = useState(0);
  const [videoError, setVideoError]       = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [canComplete, setCanComplete]     = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Reset state when lesson changes
  useEffect(() => {
    setAudioFinished(false); setScrollPct(0); setVideoError(false); setJustCompleted(false); setCanComplete(false);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [index]);

  // Track scroll progress for document lessons
  useEffect(() => {
    if (isVideo) return;
    const el = scrollRef.current;
    if (!el) return;
    
    const checkScroll = () => {
      if (!lesson.body || lesson.body.trim() === "") {
        setScrollPct(0);
        if (!hasAudio) setCanComplete(false);
        return;
      }
      const { scrollTop, scrollHeight, clientHeight } = el;
      const pct = scrollHeight <= clientHeight ? 100 : Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
      setScrollPct(pct);

      // If lesson has audio, completion is ONLY unlocked when audio finishes!
      if (!hasAudio && pct >= 95) {
        setCanComplete(true);
      }
    };

    checkScroll();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => checkScroll());
      resizeObserver.observe(el);
    }

    el.addEventListener("scroll", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [isVideo, hasAudio, index, lesson.body]);

  // Track video completion via postMessage
  useEffect(() => {
    if (!isVideo) return;
    
    const isYouTube = lesson.videoUrl.includes("youtube") || lesson.videoUrl.includes("youtu.be");
    
    // For non-YouTube videos, we use the native HTML5 <video> onEnded event instead!
    if (!isYouTube) return;

    const onMessage = (event: MessageEvent) => {
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return;
      try {
        const data = JSON.parse(event.data);
        if (data.event === "infoDelivery" && data.info && data.info.playerState === 0) {
          setCanComplete(true); // 0 = YT.PlayerState.ENDED
        }
      } catch (e) {}
    };

    window.addEventListener("message", onMessage);
    
    // Ping the iframe to start sending events
    const timer = setInterval(() => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: "listening", id: 1 }), "*");
      }
    }, 1000);

    return () => {
      window.removeEventListener("message", onMessage);
      clearInterval(timer);
    };
  }, [isVideo, index, lesson.videoUrl]);

  const handleComplete = useCallback(() => {
    if (isDone || justCompleted || !canComplete) return;
    setJustCompleted(true);
    onComplete();
  }, [isDone, justCompleted, canComplete, onComplete]);

  const isFinished = isDone || justCompleted;

  return (
    <div className="flex flex-col h-full bg-[#f4faf7]">
      {/* Header */}
      <div className="flex-shrink-0 px-4 md:px-8 pt-5 pb-4 border-b border-slate-200/80 bg-white">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
            isVideo
              ? "text-sky-700 bg-sky-50 border-sky-200"
              : hasAudio
              ? "text-teal-700 bg-teal-50 border-teal-200"
              : "text-purple-700 bg-purple-50 border-purple-200"
          }`}>
            {isVideo ? "🎬 Video" : hasAudio ? "🎧 Audio + 📄 Document" : "📄 Document"}
          </span>
          {lesson.durationMinutes && (
            <span className="text-[10px] text-slate-400">{lesson.durationMinutes} min</span>
          )}
          <span className="ml-auto text-[10px] text-slate-400 font-medium">Lesson {index + 1} of {total}</span>
        </div>
        <h2 className="text-base md:text-xl font-black text-[#002d25] leading-snug mb-1">{lesson.title}</h2>
        {lesson.description && (
          <p className="text-slate-500 text-xs mb-2 font-medium">{lesson.description}</p>
        )}
        {!isVideo && (
          <div className="mt-3 h-0.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300 bg-green-500"
              style={{ width: `${isFinished ? 100 : scrollPct}%` }} />
          </div>
        )}
      </div>

      {/* Body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-6"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,0,0,0.08) transparent" }}>

        {/* AUDIO PLAYER (Plays alongside text document or video) */}
        {hasAudio && (
          <AudioPlayerWidget
            key={`audio-${lesson.id}-${index}`}
            url={lesson.audioUrl!}
            onAudioEnded={() => {
              setAudioFinished(true);
              setCanComplete(true);
            }}
          />
        )}

        {/* VIDEO */}
        {isVideo && (
          <div className="mb-6">
            {videoError ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                <div className="text-4xl mb-3">⚠️</div>
                <p className="text-red-700 font-bold text-sm">Video failed to load</p>
              </div>
            ) : (
              <div className="relative pb-[56.25%] rounded-2xl overflow-hidden bg-black/60 border border-slate-200 shadow-lg">
                {(lesson.videoUrl.includes("youtube") || lesson.videoUrl.includes("youtu.be")) ? (
                  <iframe key={index} ref={iframeRef} src={getEmbedSrc(lesson.videoUrl)}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen onError={() => setVideoError(true)}
                    className="absolute inset-0 w-full h-full border-0" />
                ) : (
                  <video key={index} src={lesson.videoUrl} controls controlsList="nodownload"
                    onEnded={() => setCanComplete(true)}
                    onError={() => setVideoError(true)}
                    className="absolute inset-0 w-full h-full border-0 bg-black" />
                )}
              </div>
            )}
            {!isFinished && (
              <p className="text-slate-500 text-xs text-center mt-3 font-semibold">
                {canComplete ? (
                  <>Ready! Tap <span className="text-slate-700 font-bold">"I've watched this ✓"</span> below</>
                ) : (
                  <>Please finish watching the video to unlock completion</>
                )}
              </p>
            )}
          </div>
        )}

        {/* DOCUMENT */}
        {!isVideo && (
          <>
            {!isFinished && (
              <div className="flex items-center gap-2 mb-6 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
                {hasAudio && !audioFinished ? (
                  <>
                    <span className="text-sm">🎧</span>
                    <span className="text-xs text-slate-600 flex-1 font-semibold">
                      Listen to the audio narration to unlock completion
                    </span>
                    <span className="text-xs font-bold text-amber-600 font-mono">Audio required</span>
                  </>
                ) : !lesson.body || lesson.body.trim() === "" ? (
                  <>
                    <span className="text-sm">⏳</span>
                    <span className="text-xs text-slate-550 flex-1 font-semibold">
                      This lesson has no content yet. Completion is locked until the body is available.
                    </span>
                    <span className="text-xs font-bold text-red-650">0%</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm">{canComplete ? "✅" : "👇"}</span>
                    <span className="text-xs text-slate-550 flex-1 font-semibold">
                      {canComplete ? "Ready! Click 'Mark complete ✓' below" : "Read through to the bottom to unlock completion"}
                    </span>
                    <span className="text-xs font-bold text-green-600">{scrollPct}%</span>
                  </>
                )}
              </div>
            )}
            {lesson.body && lesson.body.trim() !== ""
              ? <LessonBody body={lesson.body} />
              : <p className="text-slate-400 text-sm">No content yet.</p>
            }
            <div className="h-8" />
          </>
        )}

        {/* Completion flash */}
        {isFinished && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl px-5 py-4 border border-green-200 bg-green-50 shadow-sm">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-bold text-sm text-green-700">Lesson complete!</p>
              <p className="text-slate-500 text-xs mt-0.5 font-semibold">Great work — keep going.</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 md:px-8 py-4 border-t border-slate-200/80 bg-white flex items-center justify-between gap-3 relative z-10">
        <button onClick={onPrev} disabled={index === 0}
          className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition cursor-pointer">
          ← <span className="hidden sm:inline">Prev</span>
        </button>

        {!isFinished && (
          <button onClick={handleComplete} disabled={!canComplete}
            className={`flex-1 sm:flex-none text-xs font-bold px-4 py-2 rounded-lg transition text-center border ${
              canComplete
                ? "bg-[#00D1C1] text-[#002d25] border-[#00D1C1] hover:bg-[#00b8aa] cursor-pointer"
                : "bg-slate-50 text-slate-350 border-slate-200 cursor-not-allowed"
            }`}>
            {isVideo ? "I've watched this ✓" : "Mark complete ✓"}
          </button>
        )}

        <button onClick={onNext} disabled={index === total - 1 || !nextUnlocked}
          className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition justify-end cursor-pointer">
          <span className="hidden sm:inline">Next</span> →
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function WeekPage() {
  const router  = useRouter();
  const params  = useParams();
  const weekId  = params?.id as string;
  const { goBack } = useNavigationHistory();
  const { accessToken, setAccessToken, logout } = useAuthStore();

  const [week, setWeek]               = useState<Week | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [quiz, setQuiz]               = useState<Quiz | null>(null);
  const [showQuiz, setShowQuiz]       = useState(false);
  const [quizPassed, setQuizPassed]   = useState(false);
  const [activeLesson, setActiveLesson] = useState(0);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("overview");
  const [viewingOverview, setViewingOverview] = useState(true);
  const [activeReadingModal, setActiveReadingModal] = useState<ReadingMaterial | null>(null);
  const [userId, setUserId]           = useState("");
  const [cohortId, setCohortId]       = useState("");
  const [isPracticalPresent, setIsPracticalPresent] = useState<boolean>(true);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");

  useEffect(() => {
    const restore = async () => {
      const refresh = localStorage.getItem("refreshToken");
      if (!refresh) { router.replace("/learn/lms"); return; }

      let token = accessToken;
      if (!token) {
        try {
          token = await refreshAccessToken();
        } catch { router.replace("/learn/lms"); return; }
      }

      try {
        const payload = JSON.parse(atob(token!.split(".")[1]));
        setUserId(payload.userId);

        // Fetch user to get cohortId
        const userRes = await authFetch(`/users/${payload.userId}`);
        if (userRes.ok) {
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
            payload.cohortId ||
            "";
          if (resolvedCohort) {
            setCohortId(resolvedCohort);
          }
        }

        const userRole = payload.role;

        // Fetch week + lessons
        const weekRes = await authFetch(`/lms/weeks/${weekId}`);
        if (!weekRes.ok) { setError("Week not found."); setLoading(false); return; }
        const weekData = await weekRes.json();

        // Enforce lock date client-side block for trainees
        if (userRole === "trainee" && weekData.unlockDate) {
          const now = new Date();
          const unlock = new Date(weekData.unlockDate);
          if (now < unlock) {
            setError(`This week is locked until ${unlock.toLocaleString(undefined, { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}.`);
            setLoading(false);
            return;
          }
        }

        const isStaff = userRole === "admin" || userRole === "trainer" || userRole === "lead_trainer";
        const rawLessons: Lesson[] = Array.isArray(weekData.lessons) ? weekData.lessons : [];
        const visibleLessons = isStaff ? rawLessons : rawLessons.filter((l) => l.isPublished !== false);

        setWeek({
          ...weekData,
          lessons: visibleLessons,
        });

        // Fetch progress
        const progressRes = await authFetch(`/lms/progress/${payload.userId}`);
        if (progressRes.ok) {
          const progressData = await progressRes.json();
          const ids = new Set<string>(
            Array.isArray(progressData)
              ? progressData
                  .filter((p: any) => p.completed && p.weekId === weekId)
                  .map((p: any) => p.lessonId)
              : []
          );
          setCompletedIds(ids);
        }

        // Fetch quiz for this week
        const quizRes = await authFetch(`/lms/quizzes/week/${weekId}`);
        if (quizRes.ok) {
          const quizzes = await quizRes.json();
          if (quizzes.length > 0 && quizzes[0].isPublished) {
            const currentQuiz = quizzes[0];
            setQuiz(currentQuiz);
            try {
              const attemptsRes = await authFetch(`/lms/quizzes/${currentQuiz.id}/attempts/${payload.userId}`);
              if (attemptsRes.ok) {
                const attempts = await attemptsRes.json();
                if (Array.isArray(attempts) && attempts.some((a: any) => Boolean(a.passed) || (typeof a.score === "number" && a.score >= 70))) {
                  setQuizPassed(true);
                }
              }
            } catch {
              // Ignore attempt fetch error
            }
          }
        }

        // Fetch & verify user practical check-in for this week
        const userCheckins = await fetchAndSyncUserPracticalCheckins(payload.userId);
        const isPresentForWeek = isStaff || userCheckins.some((c: any) => Number(c.weekNumber) === Number(weekData.weekNumber));
        setIsPracticalPresent(isPresentForWeek);
      } catch {
        setError("Failed to load week.");
      } finally {
        setLoading(false);
      }
    };

    restore();
  }, [weekId]);


  const completeLesson = useCallback(async (lessonId: string, lessonIndex: number) => {
    if (completedIds.has(lessonId) || !week) return;

    // Optimistic update
    setCompletedIds((prev) => new Set([...prev, lessonId]));

    try {
      await authFetch("/lms/progress", {
        method: "POST",
        body: JSON.stringify({
          userId,
          lessonId,
          weekId: week.id,
          cohortId,
        }),
      });
    } catch {
      // Revert on failure
      setCompletedIds((prev) => {
        const next = new Set(prev);
        next.delete(lessonId);
        return next;
      });
    }

    // Auto advance
    const total = week.lessons?.length ?? 0;
    if (lessonIndex + 1 < total) {
      setTimeout(() => setActiveLesson(lessonIndex + 1), 1000);
    }
  }, [completedIds, week, userId, cohortId]);

  if (loading) return (
    <div className="min-h-screen bg-[#f4faf7] flex items-center justify-center text-slate-500 text-sm">
      Loading week...
    </div>
  );

  if (error || !week) return (
    <div className="min-h-screen bg-[#f4faf7] flex flex-col items-center justify-center gap-4 p-6 relative overflow-hidden">
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
        <span className="text-5xl">🔍</span>
        <p className="text-slate-500 text-center mt-3">{error || "Week not found."}</p>
        <Link href="/learn/lms/dashboard" className="text-green-600 font-bold text-sm hover:underline mt-4 block">← Dashboard</Link>
      </div>
    </div>
  );

  const lessons    = [...(week.lessons ?? [])].sort((a, b) => a.order - b.order);
  const doneMods   = lessons.map((l) => completedIds.has(l.id));
  const allDone    = lessons.length > 0 && lessons.every((l) => completedIds.has(l.id));
  const pct        = lessons.length ? Math.round((completedIds.size / lessons.length) * 100) : 0;
  const activeLesson0 = lessons[activeLesson];

  const WeekSidebar = () => (
    <div className="flex flex-col h-full overflow-hidden bg-white border-r border-slate-200/80">
      {/* Week meta */}
      <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-slate-100">
        <p className="text-[10px] font-bold uppercase tracking-widest text-green-600 mb-1">
          Week {week.weekNumber}
        </p>
        <p className="text-sm font-black text-[#002d25] leading-snug mb-1">{week.title}</p>
        {week.description && (
          <p className="text-slate-500 text-xs line-clamp-2 mb-3 font-medium">{week.description}</p>
        )}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-slate-400 font-medium">{completedIds.size}/{lessons.length} lessons</span>
          <span className="ml-auto text-xs font-black text-green-600">{pct}%</span>
        </div>
        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Lessons list */}
      <div className="flex-1 overflow-y-auto py-2"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,0,0,0.06) transparent" }}>
        
        {/* Week Overview button */}
        <button
          onClick={() => { setViewingOverview(true); setShowQuiz(false); setMobilePanel("overview"); }}
          className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-all relative ${
            viewingOverview && !showQuiz
              ? "bg-slate-50 text-[#002d25]"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-800 cursor-pointer"
          }`}
        >
          {viewingOverview && !showQuiz && <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-green-500" />}
          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-black ${
            viewingOverview && !showQuiz
              ? "bg-green-50 text-green-600 border border-green-200"
              : "bg-slate-50 text-slate-400 border border-slate-200"
          }`}>
            🎯
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold leading-snug ${viewingOverview && !showQuiz ? "text-slate-800" : "text-slate-600"}`}>
              Week Overview
            </p>
            <span className="text-[10px] text-slate-400">Objectives & Progress</span>
          </div>
        </button>

        <div className="border-t border-slate-100 my-1.5 mx-4" />

        {lessons.map((lesson, i) => {
          const done    = completedIds.has(lesson.id);
          const active  = i === activeLesson && !showQuiz && !viewingOverview;
          const prevDone = i === 0 || completedIds.has(lessons[i - 1].id);
          const locked  = !done && !prevDone;
          const isVideo = lesson.type === "video" && Boolean(lesson.videoUrl);

          return (
            <button key={lesson.id}
              onClick={() => { if (!locked) { setActiveLesson(i); setShowQuiz(false); setViewingOverview(false); setMobilePanel("lesson"); } }}
              disabled={locked}
              className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-all relative ${
                locked ? "cursor-not-allowed opacity-35"
                : active ? "bg-slate-50 text-[#002d25]"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-800 cursor-pointer"
              }`}>
              {active && <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-green-500" />}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-black ${
                done   ? "bg-green-50 text-green-600 border border-green-200"
                : active ? "bg-[#00D1C1]/20 text-[#002d25] border border-[#00D1C1]/30 font-black"
                : locked ? "bg-slate-50/50 text-slate-300 border border-slate-100"
                :          "bg-slate-50 text-slate-400 border border-slate-200"
              }`}>
                {locked ? "🔒" : done ? "✓" : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold leading-snug ${
                  locked ? "text-slate-300" : active ? "text-slate-800 font-bold" : done ? "text-slate-400 line-through" : "text-slate-600"
                }`}>{lesson.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  {locked
                    ? <span className="text-[10px] text-slate-400">Complete previous lesson</span>
                    : <>
                        <span className="text-[10px] text-slate-400 font-medium">{isVideo ? "🎬 Video" : "📄 Document"}</span>
                        {lesson.durationMinutes && (
                          <span className="text-[10px] text-slate-400 font-medium">{lesson.durationMinutes}m</span>
                        )}
                      </>
                  }
                </div>
              </div>
            </button>
          );
        })}

        {/* Quiz entry — only displays when all lessons are completed AND practical attendance is verified */}
        {quiz && allDone && isPracticalPresent && (
          <button
            onClick={() => {
              if (!isPracticalPresent) {
                alert(`⚠️ Practical Attendance Required: You must be marked present by your trainer for Week ${week?.weekNumber} practical session before taking this quiz.`);
                return;
              }
              setShowQuiz(true); setViewingOverview(false); setMobilePanel("quiz");
            }}
            className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-all relative ${
              showQuiz ? "bg-yellow-50 text-yellow-800" : "hover:bg-slate-50 text-slate-600"
            }`}>
            {showQuiz && <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-yellow-400" />}
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-black ${
              !isPracticalPresent
                ? "bg-amber-100 text-amber-800 border border-amber-300"
                : quizPassed
                ? "bg-green-50 text-green-600 border border-green-200"
                : "bg-yellow-50 text-yellow-600 border border-yellow-250"
            }`}>
              {!isPracticalPresent ? "🔒" : quizPassed ? "✓" : "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold leading-snug ${showQuiz ? "text-yellow-800 font-bold" : "text-slate-600"}`}>
                {quiz.title}
              </p>
              <span className={`text-[10px] font-medium block mt-0.5 ${!isPracticalPresent ? "text-amber-700 font-bold" : "text-yellow-600"}`}>
                {!isPracticalPresent
                  ? "🔒 Practical Attendance Required"
                  : quizPassed
                  ? "✅ Passed"
                  : `Pass 70% to unlock next week`}
              </span>
            </div>
          </button>
        )}

      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-slate-100">
        {allDone && !quiz && (
          <Link href="/learn/lms/dashboard"
            className="w-full block text-center bg-green-600 hover:bg-green-700 text-white font-black text-sm py-3 rounded-xl transition">
            ✅ Back to Dashboard
          </Link>
        )}
        {allDone && quiz && quizPassed && (
          <Link href="/learn/lms/dashboard"
            className="w-full block text-center bg-green-600 hover:bg-green-700 text-white font-black text-sm py-3 rounded-xl transition">
            ✅ Back to Dashboard
          </Link>
        )}
        {allDone && quiz && !quizPassed && (
          !isPracticalPresent ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center space-y-1.5 font-sora">
              <p className="text-xs font-bold text-amber-900 flex items-center justify-center gap-1">
                <span>🔒</span> Practical Attendance Required
              </p>
              <p className="text-[10px] text-amber-700 font-medium">
                Marked present required before taking this quiz.
              </p>
              <Link href="/learn/lms/practical-attendance" className="block text-[10px] font-extrabold text-emerald-800 underline">
                View Attendance Code →
              </Link>
            </div>
          ) : (
            <button onClick={() => { setShowQuiz(true); setViewingOverview(false); setMobilePanel("quiz"); }}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-black text-sm py-3 rounded-xl transition cursor-pointer">
              📝 Take the Quiz
            </button>
          )
        )}
        {!allDone && (
          <p className="text-slate-400 text-[11px] text-center font-semibold">
            {lessons.length - completedIds.size} lesson{lessons.length - completedIds.size !== 1 ? "s" : ""} remaining
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-[100dvh] bg-[#f4faf7] text-slate-800 flex flex-col overflow-hidden relative">
      {/* Subtle repeating greenSubtract background pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: "url('/learn/training/greenSubtract.png')", 
          backgroundSize: '120px', 
          backgroundRepeat: 'repeat' 
        }} 
      />

      {/* Top bar */}
      <header className="flex-shrink-0 h-14 flex items-center justify-between px-4 md:px-6 border-b border-slate-200 bg-white gap-3 relative z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => goBack("/learn/lms/dashboard")}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-655 text-sm font-bold transition flex-shrink-0 bg-transparent border-0 cursor-pointer">
            ← <span className="hidden sm:inline">Dashboard</span>
          </button>
          <span className="text-slate-200 hidden sm:block">|</span>
          <span className="text-xs font-black text-green-600 flex-shrink-0">W{week.weekNumber}</span>
          <span className="text-slate-200 flex-shrink-0">·</span>
          <span className="text-xs font-semibold text-slate-600 truncate">{week.title}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-1.5">
            <div className="w-20 h-1 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-slate-550 font-bold">{pct}%</span>
          </div>
        </div>
      </header>

      {/* Desktop */}
      <div className="hidden lg:flex flex-1 overflow-hidden relative z-10">
        <aside className="w-72 flex-shrink-0 border-r border-slate-200/80 bg-white overflow-hidden">
          <WeekSidebar />
        </aside>
        <main className="flex-1 overflow-hidden bg-transparent">
          {showQuiz && quiz ? (
            !isPracticalPresent ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center font-sora bg-white rounded-2xl border border-slate-200">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-3xl mb-4 border border-amber-200">
                  🔒
                </div>
                <h2 className="text-xl font-black text-slate-900 mb-2">Practical Attendance Required</h2>
                <p className="text-xs text-slate-600 max-w-md mb-6 leading-relaxed">
                  You must attend the <strong>Week {week?.weekNumber}</strong> field practical session and be marked present by your trainer or admin before taking this quiz.
                </p>
                <Link href="/learn/lms/practical-attendance" className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs">
                  📱 View My Practical Attendance Code →
                </Link>
              </div>
            ) : (
              <QuizPanel
                quiz={quiz} userId={userId} weekId={week.id} cohortId={cohortId}
                onPassed={() => { setQuizPassed(true); setTimeout(() => router.push("/learn/lms/dashboard"), 2000); }}
              />
            )
          ) : viewingOverview ? (
            <OverviewPanel
              week={week}
              completedCount={completedIds.size}
              totalCount={lessons.length}
              nextUnlockedLessonIndex={lessons.findIndex((l) => !completedIds.has(l.id)) === -1 ? 0 : lessons.findIndex((l) => !completedIds.has(l.id))}
              onStartLesson={(idx) => {
                if (lessons.length > 0) {
                  setActiveLesson(idx);
                  setViewingOverview(false);
                  setShowQuiz(false);
                }
              }}
              onOpenReadingModal={(reading) => setActiveReadingModal(reading)}
            />
          ) : lessons.length > 0 ? (
            activeLesson0 ? (
              <LessonPanel
                key={activeLesson}
                lesson={activeLesson0}
                index={activeLesson}
                total={lessons.length}
                isDone={completedIds.has(activeLesson0.id)}
                nextUnlocked={activeLesson + 1 < lessons.length && (completedIds.has(activeLesson0.id) || doneMods[activeLesson])}
                onComplete={() => completeLesson(activeLesson0.id, activeLesson)}
                onNext={() => setActiveLesson((i) => Math.min(i + 1, lessons.length - 1))}
                onPrev={() => setActiveLesson((i) => Math.max(i - 1, 0))}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-slate-400 text-sm font-semibold">Select a lesson to begin</p>
              </div>
            )
          ) : (
            <div className="h-full flex items-center justify-center px-6">
              <div className="max-w-sm text-center">
                <p className="text-lg font-bold text-slate-700">Lessons are being prepared.</p>
                <p className="text-slate-400 text-sm mt-3 font-semibold">
                  Your trainer is still publishing this week's material. Check back soon for the full lesson list.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile */}
      <div className="flex lg:hidden flex-1 flex-col overflow-hidden relative z-10">
        <div className="flex-1 overflow-hidden">
          {mobilePanel === "overview" && (
            <OverviewPanel
              week={week}
              completedCount={completedIds.size}
              totalCount={lessons.length}
              nextUnlockedLessonIndex={lessons.findIndex((l) => !completedIds.has(l.id)) === -1 ? 0 : lessons.findIndex((l) => !completedIds.has(l.id))}
              onStartLesson={(idx) => {
                if (lessons.length > 0) {
                  setActiveLesson(idx);
                  setViewingOverview(false);
                  setShowQuiz(false);
                  setMobilePanel("lesson");
                }
              }}
              onOpenReadingModal={(reading) => setActiveReadingModal(reading)}
            />
          )}
          {mobilePanel === "lessons" && <WeekSidebar />}
          {mobilePanel === "lesson" && activeLesson0 && !showQuiz && (
            <LessonPanel
              key={activeLesson}
              lesson={activeLesson0}
              index={activeLesson}
              total={lessons.length}
              isDone={completedIds.has(activeLesson0.id)}
              nextUnlocked={activeLesson + 1 < lessons.length && completedIds.has(activeLesson0.id)}
              onComplete={() => completeLesson(activeLesson0.id, activeLesson)}
              onNext={() => setActiveLesson((i) => Math.min(i + 1, lessons.length - 1))}
              onPrev={() => setActiveLesson((i) => Math.max(i - 1, 0))}
            />
          )}
          {mobilePanel === "lesson" && !showQuiz && lessons.length === 0 && (
            <div className="h-full flex items-center justify-center px-6">
              <div className="max-w-sm text-center">
                <p className="text-lg font-bold text-slate-700">Lessons are being prepared.</p>
                <p className="text-slate-455 text-sm mt-3 font-medium">
                  Your trainer is still publishing this week's material. Check back soon for the full lesson list.
                </p>
              </div>
            </div>
          )}
          {mobilePanel === "quiz" && quiz && (
            <QuizPanel
              quiz={quiz} userId={userId} weekId={week.id} cohortId={cohortId}
              onPassed={() => { setQuizPassed(true); setTimeout(() => router.push("/learn/lms/dashboard"), 2000); }}
            />
          )}
        </div>

        {/* Bottom tab bar */}
        <div className="flex-shrink-0 flex border-t border-slate-200/80 bg-white relative z-20">
          {([
            { id: "overview" as MobilePanel, icon: "🎯", label: "Overview" },
            { id: "lesson" as MobilePanel, icon: "📖", label: "Lesson" },
            { id: "lessons" as MobilePanel, icon: "📋", label: "All" },
            ...(quiz && allDone ? [{ id: "quiz" as MobilePanel, icon: "📝", label: "Quiz" }] : []),
          ]).map((t) => (
            <button key={t.id} onClick={() => {
              setMobilePanel(t.id);
              if (t.id === "overview") {
                setViewingOverview(true);
                setShowQuiz(false);
              } else if (t.id === "lesson") {
                setViewingOverview(false);
                setShowQuiz(false);
              } else if (t.id === "quiz") {
                setViewingOverview(false);
                setShowQuiz(true);
              }
            }}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition cursor-pointer ${
                mobilePanel === t.id ? "text-green-600 font-black" : "text-slate-400"
              }`}>
              <span className="text-lg leading-none">{t.icon}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* READ ONLINE MODAL INSIDE WEEK PAGE */}
      {activeReadingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 md:p-8 space-y-6 font-sora relative text-left">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-lg">
                    Week {activeReadingModal.recommendedWeek}
                  </span>
                  <span className="bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-lg">
                    {activeReadingModal.category}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">⏱️ {activeReadingModal.readTime}</span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
                  {activeReadingModal.title}
                </h2>
                <p className="text-xs text-slate-500 font-medium">Author: {activeReadingModal.author}</p>
              </div>
              <button
                onClick={() => setActiveReadingModal(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1 leading-none shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="prose prose-slate max-w-none text-slate-700 text-xs md:text-sm leading-relaxed whitespace-pre-wrap font-sans bg-slate-50 border border-slate-200/80 p-5 rounded-2xl">
              {activeReadingModal.content || activeReadingModal.summary}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              {activeReadingModal.downloadUrl && (
                <a
                  href={activeReadingModal.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                >
                  <span>⬇️</span> Download Official PDF
                </a>
              )}
              <button
                onClick={() => setActiveReadingModal(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
              >
                Close Reader
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}