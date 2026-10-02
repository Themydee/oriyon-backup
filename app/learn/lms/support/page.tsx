"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { authFetch } from "@/lib/api";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useLmsSession } from "@/hooks/useLmsSession";
import {
  Ticket,
  TicketMessage,
  TICKET_CATEGORY_LABELS,
  TICKET_STATUS,
  TICKET_PRIORITY,
  formatDateTime,
  timeAgo,
  readError,
} from "@/lib/tickets";

interface TrainerOption {
  id: string;
  name: string;
  groupName: string;
}
interface CategoryOption {
  id: string;
  label: string;
}

type View = { name: "list" } | { name: "new" } | { name: "ticket"; id: string; justCreated?: boolean };

const MAX_ATTACHMENT_MB = 5;
const OTHER_TRAINER = "__other__";

const input =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";
const label = "block text-sm font-bold text-[#002d25] mb-1.5";

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${className}`}>{children}</span>;
}

export default function SupportPage() {
  const session = useLmsSession();
  // Deep link: /learn/lms/support?ticket=<id>
  const [view, setView] = useState<View>(() => {
    const id = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("ticket") : null;
    return id ? { name: "ticket", id } : { name: "list" };
  });

  const go = (next: View) => {
    setView(next);
    const url = next.name === "ticket" ? `?ticket=${next.id}` : window.location.pathname;
    window.history.replaceState(null, "", url);
    window.scrollTo(0, 0);
  };

  if (!session) {
    return <div className="min-h-screen bg-[#f4faf7] flex items-center justify-center text-sm text-slate-500">Loading support…</div>;
  }

  return (
    <div className="min-h-screen bg-[#f4faf7] text-slate-800">
      <header className="bg-[#002d25] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <Link href="/learn/lms/dashboard" className="text-xs font-bold text-emerald-200 hover:text-white">
            ← Back to dashboard
          </Link>
          <div className="mt-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-emerald-300 font-bold">Support</p>
              <h1 className="text-3xl font-black tracking-tight mt-1">Trainer support tickets</h1>
              <p className="text-sm text-emerald-100/80 mt-2 max-w-xl">
                Report a problem with a trainer and follow it until it is resolved. Your report goes only to the
                Oriyon programme team — the trainer never sees it.
              </p>
            </div>
            {view.name !== "new" && (
              <button
                onClick={() => go({ name: "new" })}
                className="self-start sm:self-auto rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-3 text-sm font-black text-[#002d25] transition"
              >
                + New ticket
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {view.name === "list" && <TicketList onOpen={(id) => go({ name: "ticket", id })} onNew={() => go({ name: "new" })} />}
        {view.name === "new" && (
          <NewTicketForm
            onCancel={() => go({ name: "list" })}
            onCreated={(id) => go({ name: "ticket", id, justCreated: true })}
          />
        )}
        {view.name === "ticket" && (
          <TicketDetail id={view.id} justCreated={view.justCreated} userId={session.userId} onBack={() => go({ name: "list" })} />
        )}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────
// List of the trainee's tickets
// ─────────────────────────────────────────────
function TicketList({ onOpen, onNew }: { onOpen: (id: string) => void; onNew: () => void }) {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const res = await authFetch("/tickets/mine", { cache: "no-store" });
      if (!res.ok) {
        setError(await readError(res, "Could not load your tickets."));
        setTickets([]);
        return;
      }
      setTickets(await res.json());
    })();
  }, []);

  if (tickets === null) return <p className="text-sm text-slate-500">Loading your tickets…</p>;

  return (
    <div className="space-y-6">
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {tickets.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm">
          <h2 className="text-xl font-black text-[#002d25]">You have no tickets</h2>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl">
            A ticket is a private report to the programme team. Use one if a trainer misses sessions, behaves
            unprofessionally, asks you for money, marks your attendance or scores wrongly, or anything else about
            how you are being trained. Each ticket gets a reference code, and you can follow every reply and update here.
          </p>
          <button onClick={onNew} className="mt-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-5 py-3 text-sm font-bold text-white transition">
            Report a trainer issue
          </button>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100 overflow-hidden">
          {tickets.map((t) => (
            <button
              key={t.id}
              onClick={() => onOpen(t.id)}
              className="w-full text-left px-5 sm:px-6 py-5 hover:bg-emerald-50/40 transition flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-slate-500">{t.code}</span>
                  <Badge className={TICKET_STATUS[t.status].className}>{TICKET_STATUS[t.status].reporterLabel}</Badge>
                </div>
                <p className="font-bold text-[#002d25] truncate">{t.subject}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t.trainerName} · {TICKET_CATEGORY_LABELS[t.category] || t.category}
                </p>
              </div>
              <span className="text-xs text-slate-400 whitespace-nowrap">Updated {timeAgo(t.updatedAt)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// New ticket form
// ─────────────────────────────────────────────
function NewTicketForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: (id: string) => void }) {
  const [trainers, setTrainers] = useState<TrainerOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [trainerId, setTrainerId] = useState("");
  const [otherTrainerName, setOtherTrainerName] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");
  const [incidentDate, setIncidentDate] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const res = await authFetch("/tickets/options", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setTrainers(data.trainers || []);
        setCategories(data.categories || []);
        if ((data.trainers || []).length === 1) setTrainerId(data.trainers[0].id);
        if ((data.trainers || []).length === 0) setTrainerId(OTHER_TRAINER);
      } else {
        setError(await readError(res, "Could not load the form. Please refresh the page."));
      }
      setLoadingOptions(false);
    })();
  }, []);

  const seriousCategory = category === "harassment" || category === "extortion";
  const today = new Date().toISOString().slice(0, 10);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!trainerId) return setError("Choose the trainer this ticket is about.");
    if (trainerId === OTHER_TRAINER && otherTrainerName.trim().length < 2) return setError("Enter the trainer's name.");
    if (!category) return setError("Choose what the issue is about.");
    if (file && file.size > MAX_ATTACHMENT_MB * 1024 * 1024) return setError(`Attachments must be ${MAX_ATTACHMENT_MB} MB or smaller.`);

    setSubmitting(true);
    try {
      let attachmentUrl: string | undefined;
      if (file) {
        try {
          attachmentUrl = await uploadToCloudinary(file, file.type.startsWith("image/") ? "image" : "auto");
        } catch {
          setError("Your attachment could not be uploaded. Try a smaller file, or submit without it.");
          setSubmitting(false);
          return;
        }
      }

      const res = await authFetch("/tickets", {
        method: "POST",
        body: JSON.stringify({
          ...(trainerId === OTHER_TRAINER ? { trainerName: otherTrainerName.trim() } : { trainerId }),
          category,
          priority,
          subject: subject.trim(),
          description: description.trim(),
          incidentDate: incidentDate || undefined,
          attachmentUrl,
          attachmentName: file?.name,
        }),
      });
      if (!res.ok) {
        setError(await readError(res, "Your ticket could not be submitted. Please try again."));
        return;
      }
      const ticket: Ticket = await res.json();
      onCreated(ticket.id);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingOptions) return <p className="text-sm text-slate-500">Loading form…</p>;

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-black text-[#002d25]">Report a trainer issue</h2>
          <p className="text-sm text-slate-500 mt-1">Be as specific as you can — dates, what happened, and who was there.</p>
        </div>

        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <div>
          <label className={label} htmlFor="trainer">Which trainer is this about? *</label>
          <select id="trainer" className={input} value={trainerId} onChange={(e) => setTrainerId(e.target.value)} required>
            <option value="">Select a trainer</option>
            {trainers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}{t.groupName ? ` — ${t.groupName}` : ""}
              </option>
            ))}
            <option value={OTHER_TRAINER}>A trainer not listed here</option>
          </select>
          {trainers.length === 0 && (
            <p className="text-xs text-slate-500 mt-1.5">You have not been placed in a training group yet, so type the trainer&apos;s name below.</p>
          )}
          {trainerId === OTHER_TRAINER && (
            <input
              className={`${input} mt-2`}
              placeholder="Trainer's full name"
              value={otherTrainerName}
              onChange={(e) => setOtherTrainerName(e.target.value)}
              maxLength={255}
              required
            />
          )}
        </div>

        <div>
          <label className={label} htmlFor="category">What is the issue about? *</label>
          <select id="category" className={input} value={category} onChange={(e) => setCategory(e.target.value)} required>
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          {seriousCategory && (
            <p className="text-xs text-red-700 mt-1.5 font-semibold">
              This will be treated as urgent and reviewed first. If you are in immediate danger, contact local authorities.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="date">When did it happen?</label>
            <input id="date" type="date" max={today} className={input} value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} />
          </div>
          {!seriousCategory && (
            <div>
              <label className={label} htmlFor="priority">How much is it affecting you?</label>
              <select id="priority" className={input} value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="low">A little — no rush</option>
                <option value="medium">Noticeably</option>
                <option value="high">A lot — it stops me learning</option>
              </select>
            </div>
          )}
        </div>

        <div>
          <label className={label} htmlFor="subject">Short title *</label>
          <input
            id="subject"
            className={input}
            placeholder="e.g. Trainer missed two practical sessions"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            minLength={5}
            maxLength={200}
            required
          />
        </div>

        <div>
          <label className={label} htmlFor="description">What happened? *</label>
          <textarea
            id="description"
            className={`${input} min-h-[160px]`}
            placeholder="Describe what happened, when and where, and anyone who saw it."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            minLength={20}
            maxLength={5000}
            required
          />
          <p className="text-[11px] text-slate-400 mt-1 text-right">{description.length}/5000</p>
        </div>

        <div>
          <label className={label} htmlFor="file">Evidence (optional)</label>
          <input
            id="file"
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-bold file:text-emerald-800 hover:file:bg-emerald-100"
          />
          <p className="text-xs text-slate-400 mt-1">A photo, screenshot or PDF, up to {MAX_ATTACHMENT_MB} MB.</p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-2">
          <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 px-6 py-3 text-sm font-bold text-white transition disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit ticket"}
          </button>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5">
          <p className="text-sm font-black text-[#002d25] mb-2">🔒 Confidential</p>
          <p className="text-xs text-slate-600 leading-relaxed">
            Only the Oriyon programme team can read your ticket. The trainer is never shown it or told who reported them.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-black text-[#002d25] mb-2">What happens next</p>
          <ol className="text-xs text-slate-600 space-y-2 list-decimal pl-4 leading-relaxed">
            <li>You get a reference code and an email confirmation.</li>
            <li>The team reviews it, usually within 2 working days.</li>
            <li>They reply here and by email. You can reply back.</li>
            <li>When it is resolved, you can close it or reopen it if the problem continues.</li>
          </ol>
        </div>
      </aside>
    </form>
  );
}

// ─────────────────────────────────────────────
// Ticket detail + conversation
// ─────────────────────────────────────────────
function TicketDetail({ id, justCreated, userId, onBack }: { id: string; justCreated?: boolean; userId: string; onBack: () => void }) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");

  const load = useCallback(async () => {
    const res = await authFetch(`/tickets/${id}`, { cache: "no-store" });
    if (!res.ok) {
      setError(await readError(res, "This ticket could not be found."));
      return;
    }
    const data = await res.json();
    setTicket(data.ticket);
    setMessages(data.messages || []);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (path: string, init: RequestInit, failMsg: string) => {
    setBusy(true);
    setError("");
    try {
      const res = await authFetch(path, init);
      if (!res.ok) {
        setError(await readError(res, failMsg));
        return false;
      }
      await load();
      return true;
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    if (await act(`/tickets/${id}/messages`, { method: "POST", body: JSON.stringify({ body: reply.trim() }) }, "Your reply could not be sent.")) {
      setReply("");
    }
  };

  if (error && !ticket) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
        <p className="font-bold text-[#002d25]">{error}</p>
        <button onClick={onBack} className="mt-4 text-sm font-bold text-emerald-700 hover:underline">← Back to your tickets</button>
      </div>
    );
  }
  if (!ticket) return <p className="text-sm text-slate-500">Loading ticket…</p>;

  const status = TICKET_STATUS[ticket.status];
  const canReply = ticket.status !== "closed";
  const canRate = ["resolved", "closed"].includes(ticket.status) && !ticket.satisfactionRating;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm font-bold text-emerald-700 hover:underline">← All tickets</button>

      {justCreated && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="font-black text-emerald-900">Ticket submitted — reference {ticket.code}</p>
          <p className="text-sm text-emerald-800 mt-1">We&apos;ve emailed you a confirmation. You&apos;ll get an email when the team replies.</p>
        </div>
      )}

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="font-mono text-xs font-bold text-slate-500">{ticket.code}</span>
              <Badge className={status.className}>{status.reporterLabel}</Badge>
            </div>
            <h2 className="text-2xl font-black text-[#002d25]">{ticket.subject}</h2>
            <p className="text-sm text-slate-700 whitespace-pre-wrap mt-4 leading-relaxed">{ticket.description}</p>
            {ticket.attachmentUrl && (
              <a href={ticket.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex mt-4 text-sm font-bold text-emerald-700 hover:underline">
                📎 {ticket.attachmentName || "View attachment"}
              </a>
            )}
          </div>

          <section aria-label="Conversation" className="space-y-3">
            <h3 className="text-sm font-black text-[#002d25] uppercase tracking-wider">Updates</h3>
            {messages.map((m) =>
              m.kind === "event" ? (
                <p key={m.id} className="text-xs text-slate-500 pl-4 border-l-2 border-slate-200 py-1">
                  {m.body} · {formatDateTime(m.createdAt)}
                </p>
              ) : (
                <div
                  key={m.id}
                  className={`rounded-2xl border p-4 ${m.authorId === userId ? "bg-white border-slate-200" : "bg-emerald-50/60 border-emerald-100"}`}
                >
                  <p className="text-xs font-bold text-slate-600 mb-1.5">
                    {m.authorId === userId ? "You" : `${m.authorName} · Oriyon programme team`}
                    <span className="font-normal text-slate-400"> · {formatDateTime(m.createdAt)}</span>
                  </p>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">{m.body}</p>
                </div>
              ),
            )}

            {canReply ? (
              <form onSubmit={sendReply} className="rounded-2xl border border-slate-200 bg-white p-4">
                <label htmlFor="reply" className="sr-only">Reply</label>
                <textarea
                  id="reply"
                  className={`${input} min-h-[100px]`}
                  placeholder={ticket.status === "awaiting_reporter" ? "The team is waiting for your reply…" : "Add more information or reply to the team"}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  maxLength={5000}
                />
                <div className="flex justify-end mt-3">
                  <button type="submit" disabled={busy || !reply.trim()} className="rounded-xl bg-emerald-700 hover:bg-emerald-800 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                    Send reply
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-slate-500">This ticket is closed. If the problem continues, open a new ticket.</p>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm space-y-3">
            <Row k="Trainer" v={ticket.trainerName} />
            <Row k="Category" v={TICKET_CATEGORY_LABELS[ticket.category] || ticket.category} />
            <Row k="Priority" v={TICKET_PRIORITY[ticket.priority]?.label || ticket.priority} />
            {ticket.incidentDate && <Row k="Happened on" v={new Date(ticket.incidentDate).toLocaleDateString()} />}
            <Row k="Opened" v={formatDateTime(ticket.createdAt)} />
            {ticket.resolvedAt && <Row k="Resolved" v={formatDateTime(ticket.resolvedAt)} />}
          </div>

          {ticket.status === "resolved" && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-2">
              <p className="text-sm font-black text-[#002d25]">Is this sorted?</p>
              <button
                disabled={busy}
                onClick={() => act(`/tickets/${id}`, { method: "PATCH", body: JSON.stringify({ status: "closed" }) }, "Could not close the ticket.")}
                className="w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                Yes, close ticket
              </button>
              <button
                disabled={busy}
                onClick={() => act(`/tickets/${id}`, { method: "PATCH", body: JSON.stringify({ status: "in_progress" }) }, "Could not reopen the ticket.")}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                No, reopen it
              </button>
            </div>
          )}

          {["open", "in_progress", "awaiting_reporter"].includes(ticket.status) && (
            <button
              disabled={busy}
              onClick={() => {
                if (window.confirm("Close this ticket? Only do this if you no longer need help.")) {
                  act(`/tickets/${id}`, { method: "PATCH", body: JSON.stringify({ status: "closed" }) }, "Could not close the ticket.");
                }
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50"
            >
              I no longer need help — close ticket
            </button>
          )}

          {canRate && (
            <div className="rounded-3xl border border-amber-100 bg-amber-50/60 p-5">
              <p className="text-sm font-black text-[#002d25] mb-2">How well was this handled?</p>
              <div className="flex gap-1 mb-3" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={rating === n}
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    onClick={() => setRating(n)}
                    className={`text-2xl ${n <= rating ? "text-amber-500" : "text-slate-300"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                className={`${input} min-h-[70px] text-xs`}
                placeholder="Anything we could do better? (optional)"
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                maxLength={1000}
              />
              <button
                disabled={busy || !rating}
                onClick={() =>
                  act(`/tickets/${id}/rating`, { method: "POST", body: JSON.stringify({ rating, comment: ratingComment.trim() || undefined }) }, "Could not save your rating.")
                }
                className="mt-3 w-full rounded-xl bg-[#002d25] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                Submit rating
              </button>
            </div>
          )}
          {ticket.satisfactionRating && (
            <p className="text-xs text-slate-500 text-center">You rated this {ticket.satisfactionRating}/5. Thank you.</p>
          )}
        </aside>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-400">{k}</span>
      <span className="font-semibold text-slate-700 text-right">{v}</span>
    </div>
  );
}
