"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { authFetch } from "@/lib/api";
import { useLmsSession, LmsSession } from "@/hooks/useLmsSession";
import { readError, timeAgo, formatDateTime } from "@/lib/tickets";
import {
  Answer,
  Channel,
  ChatMessage,
  Question,
  MODERATOR_ROLES,
  ROLE_BADGE,
  STAFF_ROLES,
  initials,
} from "@/lib/community";

type Tab = "questions" | "chat";
type Filter = "all" | "unanswered" | "solved" | "mine";
type Sort = "newest" | "active" | "top";

const input =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";
const CHAT_POLL_MS = 5000;

export default function CommunityPage() {
  const session = useLmsSession();
  const [tab, setTab] = useState<Tab>("questions");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channel, setChannel] = useState("all");
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  const loadChannels = useCallback(async () => {
    const res = await authFetch("/lms/community/channels", { cache: "no-store" });
    if (res.ok) setChannels(await res.json());
  }, []);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      const res = await authFetch("/lms/community/channels", { cache: "no-store" });
      if (res.ok && !cancelled) setChannels(await res.json());
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  if (!session) {
    return <div className="min-h-screen bg-[#f4faf7] flex items-center justify-center text-sm text-slate-500">Loading community…</div>;
  }

  const chatChannel = channel === "all" ? "general" : channel;
  const currentChannel = channels.find((c) => c.id === channel);

  return (
    <div className="min-h-screen bg-[#f4faf7] text-slate-800">
      <header className="bg-[#002d25] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-0">
          <Link href="/learn/lms/dashboard" className="text-xs font-bold text-emerald-200 hover:text-white">
            ← Back to dashboard
          </Link>
          <div className="mt-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-emerald-300 font-bold">EEWYLA community</p>
              <h1 className="text-3xl font-black tracking-tight mt-1">Questions &amp; discussion</h1>
              <p className="text-sm text-emerald-100/80 mt-2 max-w-xl">
                Ask your cohort and trainers, share what has worked on your farm, and help others. Answers from
                trainers are marked verified.
              </p>
            </div>
            {tab === "questions" && !asking && (
              <button
                onClick={() => {
                  setAsking(true);
                  setOpenQuestionId(null);
                }}
                className="self-start sm:self-auto rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-3 text-sm font-black text-[#002d25] transition"
              >
                Ask a question
              </button>
            )}
          </div>
          <nav className="mt-6 flex gap-1" aria-label="Community sections">
            {(["questions", "chat"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-t-xl px-5 py-3 text-sm font-bold transition ${
                  tab === t ? "bg-[#f4faf7] text-[#002d25]" : "text-emerald-100 hover:text-white"
                }`}
              >
                {t === "questions" ? "Questions" : "Live chat"}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid gap-6 lg:grid-cols-[230px_1fr]">
        <aside aria-label="Channels">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">Channels</p>
          <div className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
            {tab === "questions" && (
              <ChannelButton active={channel === "all"} onClick={() => { setChannel("all"); setOpenQuestionId(null); }}>
                All channels
              </ChannelButton>
            )}
            {channels.map((c) => (
              <ChannelButton
                key={c.id}
                active={tab === "chat" ? chatChannel === c.id : channel === c.id}
                onClick={() => {
                  setChannel(c.id);
                  setOpenQuestionId(null);
                }}
                count={tab === "questions" ? c.questionCount : undefined}
              >
                {c.name}
              </ChannelButton>
            ))}
          </div>
          {currentChannel && tab === "questions" && (
            <p className="hidden lg:block text-xs text-slate-500 mt-3 px-1">{currentChannel.description}</p>
          )}
        </aside>

        <section className="min-w-0">
          {tab === "chat" ? (
            <ChatRoom key={chatChannel} channelId={chatChannel} channelName={channels.find((c) => c.id === chatChannel)?.name || "General Discussion"} session={session} />
          ) : asking ? (
            <AskForm
              channels={channels}
              defaultChannel={channel === "all" ? "general" : channel}
              onCancel={() => setAsking(false)}
              onPosted={(q) => {
                setAsking(false);
                setOpenQuestionId(q.id);
                loadChannels();
              }}
            />
          ) : openQuestionId ? (
            <QuestionDetail
              id={openQuestionId}
              session={session}
              onBack={() => setOpenQuestionId(null)}
              onDeleted={() => {
                setOpenQuestionId(null);
                loadChannels();
              }}
            />
          ) : (
            <QuestionList channel={channel} onOpen={setOpenQuestionId} onAsk={() => setAsking(true)} />
          )}
        </section>
      </main>
    </div>
  );
}

function ChannelButton({ active, onClick, count, children }: { active: boolean; onClick: () => void; count?: number; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between gap-3 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold text-left transition ${
        active ? "bg-emerald-700 text-white" : "text-slate-600 hover:bg-white"
      }`}
    >
      <span>{children}</span>
      {count !== undefined && <span className={`text-xs ${active ? "text-emerald-100" : "text-slate-400"}`}>{count}</span>}
    </button>
  );
}

function Avatar({ name, url }: { name: string; url?: string | null }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />;
  }
  return (
    <span className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center shrink-0" aria-hidden>
      {initials(name)}
    </span>
  );
}

function AuthorLine({ name, role, url, time }: { name: string; role: string; url?: string | null; time: string }) {
  const badge = ROLE_BADGE[role];
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Avatar name={name} url={url} />
      <div className="min-w-0 text-xs">
        <span className="font-bold text-slate-800">{name}</span>
        {badge && <span className={`ml-1.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${badge.className}`}>{badge.label}</span>}
        <span className="block text-slate-400" title={formatDateTime(time)}>{timeAgo(time)}</span>
      </div>
    </div>
  );
}

function VoteButton({ count, active, onClick, disabled }: { count: number; active: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-label={active ? "Remove helpful vote" : "Mark as helpful"}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
        active ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-500 hover:border-emerald-300"
      }`}
    >
      ▲ {count}
    </button>
  );
}

// ─────────────────────────────────────────────
// Question list
// ─────────────────────────────────────────────
function QuestionList({ channel, onOpen, onAsk }: { channel: string; onOpen: (id: string) => void; onAsk: () => void }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("active");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchPage = useCallback(
    async (nextPage: number) => {
      const params = new URLSearchParams({ channel, filter, sort, page: String(nextPage), limit: "20" });
      if (search) params.set("search", search);
      const res = await authFetch(`/lms/community/questions?${params}`, { cache: "no-store" });
      if (!res.ok) return { error: await readError(res, "Could not load questions.") };
      return { data: (await res.json()) as { questions: Question[]; page: number; totalPages: number } };
    },
    [channel, filter, sort, search],
  );

  const apply = useCallback((result: { error?: string; data?: { questions: Question[]; page: number; totalPages: number } }, append: boolean) => {
    if (result.error) setError(result.error);
    else if (result.data) {
      const { questions: rows, page: p, totalPages: tp } = result.data;
      setError("");
      setQuestions((prev) => (append ? [...prev, ...rows] : rows));
      setPage(p);
      setTotalPages(tp);
    }
    setLoading(false);
  }, []);

  // Reload from page 1 whenever the channel, filter, sort or search changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await fetchPage(1);
      if (!cancelled) apply(result, false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchPage, apply]);

  const loadMore = async () => {
    setLoading(true);
    apply(await fetchPage(page + 1), true);
  };

  const filters: Array<{ id: Filter; label: string }> = [
    { id: "all", label: "All" },
    { id: "unanswered", label: "Unanswered" },
    { id: "solved", label: "Solved" },
    { id: "mine", label: "My questions" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search questions"
          aria-label="Search questions"
          className={`${input} md:max-w-xs`}
        />
        <div className="flex flex-wrap gap-1 items-center">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${filter === f.id ? "bg-[#002d25] text-white" : "text-slate-600 hover:bg-white"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort" className="md:ml-auto rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
          <option value="active">Recently active</option>
          <option value="newest">Newest</option>
          <option value="top">Most helpful</option>
        </select>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {!loading && questions.length === 0 && !error ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
          <p className="font-black text-[#002d25] text-lg">
            {search ? "No questions match your search" : filter === "mine" ? "You haven't asked anything yet" : filter === "unanswered" ? "Every question has an answer" : "No questions yet"}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {search || filter !== "all" ? "Try a different search or filter." : "Be the first to ask — trainers and your cohort will see it."}
          </p>
          {!search && filter !== "unanswered" && (
            <button onClick={onAsk} className="mt-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-5 py-2.5 text-sm font-bold text-white">
              Ask a question
            </button>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {questions.map((q) => {
            const verified = q.answers.some((a) => a.isVerified);
            return (
              <li key={q.id}>
                <button onClick={() => onOpen(q.id)} className="w-full text-left rounded-2xl border border-slate-200 bg-white p-5 hover:border-emerald-300 hover:shadow-sm transition">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {q.isSolved && <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white">✓ Solved</span>}
                    {!q.isSolved && verified && <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Trainer answered</span>}
                    {channel === "all" && <span className="text-[11px] font-semibold text-slate-400">{q.channelName}</span>}
                  </div>
                  <p className="font-black text-[#002d25] text-base">{q.title}</p>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">{q.content}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <AuthorLine name={q.authorName} role={q.authorRole} url={q.authorAvatar} time={q.createdAt} />
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>▲ {q.upvotes}</span>
                      <span className={q.answers.length === 0 ? "text-amber-700 font-bold" : ""}>
                        {q.answers.length} answer{q.answers.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                  {q.tags?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {q.tags.map((t) => (
                        <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">#{t}</span>
                      ))}
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {!loading && page < totalPages && (
        <button onClick={loadMore} className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
          Load more questions
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Ask a question
// ─────────────────────────────────────────────
function AskForm({ channels, defaultChannel, onCancel, onPosted }: { channels: Channel[]; defaultChannel: string; onCancel: () => void; onPosted: (q: Question) => void }) {
  const [channelId, setChannelId] = useState(defaultChannel);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await authFetch("/lms/community/questions", {
        method: "POST",
        body: JSON.stringify({
          channelId,
          title: title.trim(),
          content: content.trim(),
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 5),
        }),
      });
      if (!res.ok) {
        setError(await readError(res, "Your question could not be posted."));
        return;
      }
      onPosted(await res.json());
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-5">
      <div>
        <h2 className="text-xl font-black text-[#002d25]">Ask a question</h2>
        <p className="text-sm text-slate-500 mt-1">Good questions say what you tried and what happened. Include animal age, numbers or symptoms where it helps.</p>
      </div>
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div>
        <label htmlFor="ask-channel" className="block text-sm font-bold text-[#002d25] mb-1.5">Channel</label>
        <select id="ask-channel" className={input} value={channelId} onChange={(e) => setChannelId(e.target.value)}>
          {channels.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="ask-title" className="block text-sm font-bold text-[#002d25] mb-1.5">Your question</label>
        <input id="ask-title" className={input} value={title} onChange={(e) => setTitle(e.target.value)} minLength={8} maxLength={200} required placeholder="e.g. How often should I deworm young goats?" />
      </div>
      <div>
        <label htmlFor="ask-content" className="block text-sm font-bold text-[#002d25] mb-1.5">Details</label>
        <textarea id="ask-content" className={`${input} min-h-[150px]`} value={content} onChange={(e) => setContent(e.target.value)} minLength={15} maxLength={5000} required />
      </div>
      <div>
        <label htmlFor="ask-tags" className="block text-sm font-bold text-[#002d25] mb-1.5">Tags <span className="font-normal text-slate-400">(optional, comma separated)</span></label>
        <input id="ask-tags" className={input} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="feeding, week 3" />
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={busy} className="rounded-xl bg-emerald-700 hover:bg-emerald-800 px-6 py-2.5 text-sm font-bold text-white disabled:opacity-60">
          {busy ? "Posting…" : "Post question"}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────
// One question with answers
// ─────────────────────────────────────────────
function QuestionDetail({ id, session, onBack, onDeleted }: { id: string; session: LmsSession; onBack: () => void; onDeleted: () => void }) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [error, setError] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const isModerator = MODERATOR_ROLES.includes(session.role);

  const load = useCallback(async () => {
    const res = await authFetch(`/lms/community/questions/${id}`, { cache: "no-store" });
    if (!res.ok) {
      setError(await readError(res, "This question could not be found."));
      return;
    }
    setQuestion(await res.json());
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const call = async (path: string, init: RequestInit, failMsg: string) => {
    setBusy(true);
    setError("");
    try {
      const res = await authFetch(path, init);
      if (!res.ok) {
        setError(await readError(res, failMsg));
        return false;
      }
      return true;
    } finally {
      setBusy(false);
    }
  };

  const postAnswer = async (e: FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;
    if (await call(`/lms/community/questions/${id}/answers`, { method: "POST", body: JSON.stringify({ content: answer.trim() }) }, "Your answer could not be posted.")) {
      setAnswer("");
      load();
    }
  };

  if (error && !question) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
        <p className="font-bold text-[#002d25]">{error}</p>
        <button onClick={onBack} className="mt-4 text-sm font-bold text-emerald-700 hover:underline">← Back to questions</button>
      </div>
    );
  }
  if (!question) return <p className="text-sm text-slate-500">Loading question…</p>;

  const canChooseBest = question.authorId === session.userId || STAFF_ROLES.includes(session.role);
  const canDeleteQuestion = question.authorId === session.userId || isModerator;
  // Accepted answer first, then trainer answers, then most helpful
  const answers = [...question.answers].sort((a, b) => {
    if (a.id === question.solvedAnswerId) return -1;
    if (b.id === question.solvedAnswerId) return 1;
    if (a.isVerified !== b.isVerified) return a.isVerified ? -1 : 1;
    return b.upvotes - a.upvotes || a.createdAt.localeCompare(b.createdAt);
  });

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="text-sm font-bold text-emerald-700 hover:underline">← All questions</button>
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <article className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-[11px] font-semibold text-slate-400">{question.channelName}</span>
          {question.isSolved && <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white">✓ Solved</span>}
        </div>
        <h2 className="text-2xl font-black text-[#002d25]">{question.title}</h2>
        <p className="text-sm text-slate-700 whitespace-pre-wrap mt-3 leading-relaxed">{question.content}</p>
        {question.tags?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {question.tags.map((t) => <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">#{t}</span>)}
          </div>
        )}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <AuthorLine name={question.authorName} role={question.authorRole} url={question.authorAvatar} time={question.createdAt} />
          <div className="flex items-center gap-2">
            <VoteButton
              count={question.upvotes}
              active={question.hasUpvoted}
              disabled={busy}
              onClick={async () => {
                if (await call(`/lms/community/questions/${id}/upvote`, { method: "POST" }, "Could not record your vote.")) load();
              }}
            />
            {canDeleteQuestion && (
              <button
                onClick={async () => {
                  if (window.confirm("Delete this question and all its answers?") && (await call(`/lms/community/questions/${id}`, { method: "DELETE" }, "Could not delete the question."))) onDeleted();
                }}
                className="rounded-lg px-2.5 py-1 text-xs font-bold text-slate-400 hover:text-red-600"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </article>

      <h3 className="text-sm font-black uppercase tracking-wider text-[#002d25]">
        {answers.length} answer{answers.length === 1 ? "" : "s"}
      </h3>

      {answers.map((a) => (
        <AnswerCard
          key={a.id}
          answer={a}
          isAccepted={a.id === question.solvedAnswerId}
          canChooseBest={canChooseBest}
          canDelete={a.authorId === session.userId || isModerator}
          session={session}
          busy={busy}
          call={call}
          reload={load}
          questionId={id}
        />
      ))}

      <form onSubmit={postAnswer} className="rounded-3xl border border-slate-200 bg-white p-5">
        <label htmlFor="answer" className="block text-sm font-bold text-[#002d25] mb-2">Your answer</label>
        <textarea id="answer" className={`${input} min-h-[120px]`} value={answer} onChange={(e) => setAnswer(e.target.value)} maxLength={5000} placeholder="Share what you know or what has worked for you" />
        <div className="flex justify-end mt-3">
          <button type="submit" disabled={busy || answer.trim().length < 2} className="rounded-xl bg-emerald-700 hover:bg-emerald-800 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
            Post answer
          </button>
        </div>
      </form>
    </div>
  );
}

function AnswerCard({
  answer,
  isAccepted,
  canChooseBest,
  canDelete,
  session,
  busy,
  call,
  reload,
  questionId,
}: {
  answer: Answer;
  isAccepted: boolean;
  canChooseBest: boolean;
  canDelete: boolean;
  session: LmsSession;
  busy: boolean;
  call: (path: string, init: RequestInit, failMsg: string) => Promise<boolean>;
  reload: () => void;
  questionId: string;
}) {
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState("");

  const sendReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    if (await call(`/lms/community/answers/${answer.id}/replies`, { method: "POST", body: JSON.stringify({ content: reply.trim() }) }, "Your reply could not be posted.")) {
      setReply("");
      setReplying(false);
      reload();
    }
  };

  return (
    <div className={`rounded-3xl border p-5 sm:p-6 ${isAccepted ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200 bg-white"}`}>
      {(isAccepted || answer.isVerified) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {isAccepted && <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white">✓ Best answer</span>}
          {answer.isVerified && <span className="rounded-full bg-white border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Verified by staff</span>}
        </div>
      )}
      <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{answer.content}</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <AuthorLine name={answer.authorName} role={answer.authorRole} url={answer.authorAvatar} time={answer.createdAt} />
        <div className="flex flex-wrap items-center gap-1.5">
          <VoteButton
            count={answer.upvotes}
            active={answer.hasUpvoted}
            disabled={busy}
            onClick={async () => {
              if (await call(`/lms/community/answers/${answer.id}/upvote`, { method: "POST" }, "Could not record your vote.")) reload();
            }}
          />
          {canChooseBest && (
            <button
              disabled={busy}
              onClick={async () => {
                if (await call(`/lms/community/questions/${questionId}/solve`, { method: "PATCH", body: JSON.stringify({ answerId: isAccepted ? null : answer.id }) }, "Could not update the best answer.")) reload();
              }}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600 hover:border-emerald-300"
            >
              {isAccepted ? "Unmark best" : "Mark as best answer"}
            </button>
          )}
          <button onClick={() => setReplying((v) => !v)} className="rounded-lg px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-emerald-700">Reply</button>
          {canDelete && (
            <button
              onClick={async () => {
                if (window.confirm("Delete this answer?") && (await call(`/lms/community/answers/${answer.id}`, { method: "DELETE" }, "Could not delete the answer."))) reload();
              }}
              className="rounded-lg px-2.5 py-1 text-xs font-bold text-slate-400 hover:text-red-600"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {(answer.replies.length > 0 || replying) && (
        <div className="mt-4 ml-4 sm:ml-10 space-y-3 border-l-2 border-slate-100 pl-4">
          {answer.replies.map((r) => (
            <div key={r.id} className="text-sm">
              <div className="flex items-start justify-between gap-2">
                <AuthorLine name={r.authorName} role={r.authorRole} url={r.authorAvatar} time={r.createdAt} />
                {(r.authorId === session.userId || MODERATOR_ROLES.includes(session.role)) && (
                  <button
                    onClick={async () => {
                      if (window.confirm("Delete this reply?") && (await call(`/lms/community/replies/${r.id}`, { method: "DELETE" }, "Could not delete the reply."))) reload();
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-red-600"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="text-slate-700 whitespace-pre-wrap mt-1.5 pl-10">{r.content}</p>
            </div>
          ))}
          {replying && (
            <form onSubmit={sendReply} className="flex gap-2">
              <input className={input} value={reply} onChange={(e) => setReply(e.target.value)} maxLength={5000} placeholder="Write a reply" aria-label="Reply" autoFocus />
              <button type="submit" disabled={busy || !reply.trim()} className="rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white disabled:opacity-50">Send</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Live chat (polls for new messages)
// ─────────────────────────────────────────────
function ChatRoom({ channelId, channelName, session }: { channelId: string; channelName: string; session: LmsSession }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState("");
  const [pin, setPin] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastSeen = useRef<string | null>(null);
  const isModerator = MODERATOR_ROLES.includes(session.role);

  const poll = useCallback(async () => {
    const after = lastSeen.current ? `&after=${encodeURIComponent(lastSeen.current)}` : "";
    const res = await authFetch(`/lms/community/chat/${channelId}?limit=100${after}`, { cache: "no-store" });
    if (!res.ok) return;
    const incoming: ChatMessage[] = await res.json();
    if (incoming.length) {
      lastSeen.current = incoming[incoming.length - 1].createdAt;
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        return [...prev, ...incoming.filter((m) => !ids.has(m.id))];
      });
    }
    setLoaded(true);
  }, [channelId]);

  useEffect(() => {
    poll();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") poll();
    }, CHAT_POLL_MS);
    return () => clearInterval(timer);
  }, [poll]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await authFetch(`/lms/community/chat/${channelId}`, { method: "POST", body: JSON.stringify({ text: text.trim(), isPinned: pin }) });
      if (!res.ok) {
        setError(await readError(res, "Your message could not be sent."));
        return;
      }
      setText("");
      setPin(false);
      await poll();
    } finally {
      setSending(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this message?")) return;
    const res = await authFetch(`/lms/community/chat/messages/${id}`, { method: "DELETE" });
    if (res.ok) setMessages((prev) => prev.filter((m) => m.id !== id));
    else setError(await readError(res, "Could not delete the message."));
  };

  const pinned = messages.filter((m) => m.isPinned);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white flex flex-col h-[70vh] min-h-[420px] overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-3">
        <p className="font-black text-[#002d25]">{channelName}</p>
        <p className="text-xs text-slate-400">Messages update every few seconds. Be respectful — trainers moderate this room.</p>
      </div>
      {pinned.length > 0 && (
        <div className="border-b border-amber-100 bg-amber-50 px-5 py-2 space-y-1">
          {pinned.slice(-2).map((m) => (
            <p key={m.id} className="text-xs text-amber-900"><strong>📌 {m.authorName}:</strong> {m.text}</p>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" aria-live="polite">
        {loaded && messages.length === 0 && (
          <p className="text-center text-sm text-slate-400 mt-10">No messages in this channel yet. Say hello to your cohort.</p>
        )}
        {messages.map((m) => {
          const mine = m.authorId === session.userId;
          const badge = ROLE_BADGE[m.authorRole];
          return (
            <div key={m.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
              {!mine && <Avatar name={m.authorName} url={m.authorAvatar} />}
              <div className={`group max-w-[80%] rounded-2xl px-3.5 py-2 ${mine ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-800"}`}>
                {!mine && (
                  <p className="text-[11px] font-bold mb-0.5">
                    {m.authorName}
                    {badge && <span className={`ml-1.5 rounded px-1 py-0.5 text-[9px] ${badge.className}`}>{badge.label}</span>}
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">{m.text}</p>
                <p className={`text-[10px] mt-0.5 ${mine ? "text-emerald-100" : "text-slate-400"}`}>
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {(mine || isModerator) && (
                    <button onClick={() => remove(m.id)} className="ml-2 underline opacity-70 hover:opacity-100">Delete</button>
                  )}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      {error && <p role="alert" className="px-5 pb-2 text-xs text-red-600">{error}</p>}
      <form onSubmit={send} className="border-t border-slate-100 p-3 flex flex-col gap-2">
        <div className="flex gap-2">
          <input className={input} value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder={`Message ${channelName}`} aria-label="Message" />
          <button type="submit" disabled={sending || !text.trim()} className="rounded-xl bg-emerald-700 hover:bg-emerald-800 px-5 text-sm font-bold text-white disabled:opacity-50">Send</button>
        </div>
        {isModerator && (
          <label className="flex items-center gap-2 text-xs text-slate-500">
            <input type="checkbox" checked={pin} onChange={(e) => setPin(e.target.checked)} /> Pin as announcement
          </label>
        )}
      </form>
    </div>
  );
}
