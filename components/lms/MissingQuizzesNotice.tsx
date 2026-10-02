import Link from "next/link";

export interface MissingQuiz {
  weekId: string;
  weekNumber: number;
  weekTitle: string;
  quizId: string;
  quizTitle: string;
  lessonsRemaining: number;
}

// Shown on the exam pages when the trainee still has weekly quizzes to take.
// Each row links straight to that week with the quiz panel open (?quiz=1).
export default function MissingQuizzesNotice({ missingQuizzes }: { missingQuizzes: MissingQuiz[] }) {
  if (!missingQuizzes.length) return null;

  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 md:p-6">
      <p className="text-xs uppercase tracking-widest text-amber-700 font-bold mb-1">Quizzes required</p>
      <h3 className="text-lg font-black text-[#002d25] mb-1">
        Take {missingQuizzes.length === 1 ? "this quiz" : `these ${missingQuizzes.length} quizzes`} before the exam
      </h3>
      <p className="text-sm text-slate-600 mb-4">
        You can start the exam as soon as every weekly quiz below has been taken.
      </p>
      <ul className="space-y-3">
        {missingQuizzes.map((q) => (
          <li
            key={q.weekId}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl bg-white border border-amber-100 p-4"
          >
            <div>
              <p className="text-sm font-bold text-[#002d25]">
                Week {q.weekNumber}: {q.quizTitle}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {q.weekTitle}
                {q.lessonsRemaining > 0 &&
                  ` · finish ${q.lessonsRemaining} lesson${q.lessonsRemaining === 1 ? "" : "s"} first to unlock the quiz`}
              </p>
            </div>
            <Link
              href={`/learn/lms/week/${q.weekId}?quiz=1`}
              className="inline-flex items-center justify-center rounded-2xl bg-green-600 hover:bg-green-700 px-4 py-2.5 text-sm font-bold text-white transition whitespace-nowrap"
            >
              {q.lessonsRemaining > 0 ? "Go to Week " + q.weekNumber : "Take quiz now"} →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
