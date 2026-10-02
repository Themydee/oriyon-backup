"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { RefreshCw, Search, X } from "lucide-react";
import { authFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { getPhysicalSiteById } from "@/lib/sitesData";
import {
  Ticket,
  TicketMessage,
  TicketStatus,
  TicketPriority,
  TICKET_CATEGORY_LABELS,
  TICKET_STATUS,
  TICKET_PRIORITY,
  formatDateTime,
  timeAgo,
  readError,
} from "@/lib/tickets";

interface Stats {
  byStatus: Partial<Record<TicketStatus, number>>;
  urgentActive: number;
  unassignedActive: number;
  overdue: number;
  avgFirstResponseHours: number | null;
  avgSatisfaction: number | null;
  byTrainer: Array<{ trainerId: string | null; trainerName: string; total: number; active: number }>;
}
interface Assignee {
  id: string;
  name: string;
}
interface RelatedTicket {
  id: string;
  code: string;
  subject: string;
  status: TicketStatus;
  createdAt: string;
}

const STATUS_TABS: Array<{ id: string; label: string }> = [
  { id: "active", label: "Active" },
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In progress" },
  { id: "awaiting_reporter", label: "Awaiting trainee" },
  { id: "resolved", label: "Resolved" },
  { id: "closed", label: "Closed" },
  { id: "all", label: "All" },
];

const select = "rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none";

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold whitespace-nowrap ${className}`}>{children}</span>;
}

export default function AdminTrainerTicketsPage() {
  const token = useAuthStore((s) => s.accessToken);
  const [stats, setStats] = useState<Stats | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignees, setAssignees] = useState<Assignee[]>([]);

  const [status, setStatus] = useState("active");
  const [priority, setPriority] = useState("all");
  const [category, setCategory] = useState("all");
  const [assignedTo, setAssignedTo] = useState("all");
  const [trainerFilter, setTrainerFilter] = useState<{ id: string; name: string } | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ status, priority, category, page: String(page), limit: "25" });
    if (assignedTo !== "all") params.set("assignedTo", assignedTo);
    if (trainerFilter) params.set("trainerId", trainerFilter.id);
    if (search) params.set("search", search);
    try {
      const [listRes, statsRes] = await Promise.all([
        authFetch(`/tickets?${params}`, { cache: "no-store" }),
        authFetch("/tickets/stats", { cache: "no-store" }),
      ]);
      if (!listRes.ok) throw new Error(await readError(listRes, "Could not load tickets."));
      const list = await listRes.json();
      setTickets(list.tickets || []);
      setTotal(list.total || 0);
      setTotalPages(list.totalPages || 1);
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load tickets.");
    } finally {
      setLoading(false);
    }
  }, [status, priority, category, assignedTo, trainerFilter, search, page]);

  useEffect(() => {
    if (token) loadQueue();
  }, [token, loadQueue]);

  useEffect(() => {
    if (!token) return;
    authFetch("/tickets/assignees", { cache: "no-store" }).then(async (res) => {
      if (res.ok) setAssignees(await res.json());
    });
  }, [token]);

  const activeCount = (stats?.byStatus.open || 0) + (stats?.byStatus.in_progress || 0) + (stats?.byStatus.awaiting_reporter || 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-emerald-600 font-bold">Support</p>
          <h1 className="text-2xl font-black text-slate-900">Trainer tickets</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Reports from trainees about their trainers. Reply, add internal notes, and move each ticket through to resolution.
            Trainers cannot see this page.
          </p>
        </div>
        <button
          onClick={loadQueue}
          className="self-start inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat label="Active tickets" value={activeCount} />
        <Stat label="Urgent & active" value={stats?.urgentActive ?? 0} tone={stats?.urgentActive ? "red" : undefined} />
        <Stat label="Unassigned" value={stats?.unassignedActive ?? 0} tone={stats?.unassignedActive ? "amber" : undefined} />
        <Stat label="No reply after 48 h" value={stats?.overdue ?? 0} tone={stats?.overdue ? "red" : undefined} />
        <Stat
          label="Avg. first response"
          value={stats?.avgFirstResponseHours != null ? `${stats.avgFirstResponseHours} h` : "—"}
          sub={stats?.avgSatisfaction != null ? `Satisfaction ${stats.avgSatisfaction}/5` : undefined}
        />
      </div>

      {stats && stats.byTrainer.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold text-slate-500 mb-3">Trainers with the most tickets (last 90 days) — click to filter</p>
          <div className="flex flex-wrap gap-2">
            {stats.byTrainer.map((t) => (
              <button
                key={`${t.trainerId}-${t.trainerName}`}
                disabled={!t.trainerId}
                onClick={() => {
                  if (t.trainerId) {
                    setTrainerFilter({ id: t.trainerId, name: t.trainerName });
                    setStatus("all");
                    setPage(1);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-xs hover:border-emerald-400 disabled:cursor-default"
              >
                <span className="font-bold text-slate-800">{t.trainerName}</span>
                <span className="text-slate-500">{t.total} total</span>
                {t.active > 0 && <Badge className="bg-amber-50 text-amber-800 border-amber-200">{t.active} active</Badge>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatus(tab.id);
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                status === tab.id ? "bg-emerald-700 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
              {tab.id !== "active" && tab.id !== "all" && stats?.byStatus[tab.id as TicketStatus] ? (
                <span className="ml-1 opacity-70">{stats.byStatus[tab.id as TicketStatus]}</span>
              ) : null}
            </button>
          ))}
        </div>
        <div className="flex flex-col lg:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search code, subject, trainee or trainer"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <select className={select} value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }} aria-label="Priority">
            <option value="all">All priorities</option>
            {(Object.keys(TICKET_PRIORITY) as TicketPriority[]).map((p) => (
              <option key={p} value={p}>{TICKET_PRIORITY[p].label}</option>
            ))}
          </select>
          <select className={select} value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} aria-label="Category">
            <option value="all">All categories</option>
            {Object.entries(TICKET_CATEGORY_LABELS).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
          <select className={select} value={assignedTo} onChange={(e) => { setAssignedTo(e.target.value); setPage(1); }} aria-label="Assignee">
            <option value="all">Anyone</option>
            <option value="me">Assigned to me</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
        {trainerFilter && (
          <button
            onClick={() => setTrainerFilter(null)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-800"
          >
            Trainer: {trainerFilter.name} <X size={12} />
          </button>
        )}
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {/* Queue */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {!loading && tickets.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-bold text-slate-800">No tickets here</p>
            <p className="text-sm text-slate-500 mt-1">
              {status === "active" && !search && !trainerFilter ? "Nothing is waiting on the team right now." : "Try a different filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-bold">Ticket</th>
                  <th className="px-4 py-3 font-bold">Trainer</th>
                  <th className="px-4 py-3 font-bold">Raised by</th>
                  <th className="px-4 py-3 font-bold">Priority</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Assignee</th>
                  <th className="px-4 py-3 font-bold">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((t) => (
                  <tr key={t.id} onClick={() => setOpenId(t.id)} className="cursor-pointer hover:bg-emerald-50/40">
                    <td className="px-4 py-3 max-w-[320px]">
                      <p className="font-mono text-[11px] text-slate-400">{t.code}</p>
                      <p className="font-bold text-slate-900 truncate">{t.subject}</p>
                      <p className="text-xs text-slate-500 truncate">{TICKET_CATEGORY_LABELS[t.category] || t.category}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{t.trainerName}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {t.reporterName}
                      {t.groupName && <span className="block text-xs text-slate-400">{t.groupName}</span>}
                    </td>
                    <td className="px-4 py-3"><Badge className={TICKET_PRIORITY[t.priority].className}>{TICKET_PRIORITY[t.priority].label}</Badge></td>
                    <td className="px-4 py-3"><Badge className={TICKET_STATUS[t.status].className}>{TICKET_STATUS[t.status].label}</Badge></td>
                    <td className="px-4 py-3 text-xs text-slate-600">{t.assignedToName || <span className="text-slate-400">—</span>}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{timeAgo(t.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
            <span>{total} tickets</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold disabled:opacity-40">Previous</button>
              <span className="px-2 py-1.5">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {openId && (
        <TicketPanel
          id={openId}
          assignees={assignees}
          onClose={() => setOpenId(null)}
          onOpenOther={setOpenId}
          onChanged={loadQueue}
        />
      )}
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: number | string; sub?: string; tone?: "red" | "amber" }) {
  const toneClass = tone === "red" ? "border-red-200 bg-red-50" : tone === "amber" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white";
  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-[11px] font-bold text-slate-500">{label}</p>
      <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
      {sub && <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────
// Slide-over: one ticket
// ─────────────────────────────────────────────
function TicketPanel({
  id,
  assignees,
  onClose,
  onOpenOther,
  onChanged,
}: {
  id: string;
  assignees: Assignee[];
  onClose: () => void;
  onOpenOther: (id: string) => void;
  onChanged: () => void;
}) {
  const token = useAuthStore((s) => s.accessToken);
  const myId = userIdFromToken(token);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [related, setRelated] = useState<RelatedTicket[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const [resolveAfterReply, setResolveAfterReply] = useState(false);

  const load = useCallback(async () => {
    const res = await authFetch(`/tickets/${id}`, { cache: "no-store" });
    if (!res.ok) {
      setError(await readError(res, "Could not load this ticket."));
      return;
    }
    const data = await res.json();
    setTicket(data.ticket);
    setMessages(data.messages || []);
    setRelated(data.relatedTickets || []);
  }, [id]);

  useEffect(() => {
    setTicket(null);
    setError("");
    load();
  }, [load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const update = async (patch: Record<string, unknown>) => {
    setBusy(true);
    setError("");
    try {
      const res = await authFetch(`/tickets/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      if (!res.ok) {
        setError(await readError(res, "Could not update the ticket."));
        return false;
      }
      await load();
      onChanged();
      return true;
    } finally {
      setBusy(false);
    }
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await authFetch(`/tickets/${id}/messages`, { method: "POST", body: JSON.stringify({ body: body.trim(), internal }) });
      if (!res.ok) {
        setError(await readError(res, "Could not send."));
        return;
      }
      setBody("");
      if (!internal && resolveAfterReply) await update({ status: "resolved" });
      else {
        await load();
        onChanged();
      }
      setResolveAfterReply(false);
    } finally {
      setBusy(false);
    }
  };

  const site = ticket?.physicalSiteId ? getPhysicalSiteById(ticket.physicalSiteId) : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Ticket details">
      <button className="absolute inset-0 bg-slate-900/40" aria-label="Close" onClick={onClose} />
      <div className="relative h-full w-full max-w-3xl overflow-y-auto bg-[#f8faf9] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="min-w-0">
            <p className="font-mono text-xs text-slate-400">{ticket?.code}</p>
            <p className="font-black text-slate-900 truncate">{ticket?.subject || "Loading…"}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Close ticket">
            <X size={18} />
          </button>
        </div>

        {error && <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {ticket && (
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_240px]">
            <div className="space-y-5 min-w-0">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge className={TICKET_STATUS[ticket.status].className}>{TICKET_STATUS[ticket.status].label}</Badge>
                  <Badge className={TICKET_PRIORITY[ticket.priority].className}>{TICKET_PRIORITY[ticket.priority].label}</Badge>
                  <Badge className="bg-white text-slate-600 border-slate-200">{TICKET_CATEGORY_LABELS[ticket.category] || ticket.category}</Badge>
                </div>
                <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
                {ticket.attachmentUrl && (
                  <a href={ticket.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-3 text-sm font-bold text-emerald-700 hover:underline">
                    📎 {ticket.attachmentName || "Attachment"}
                  </a>
                )}
              </div>

              <div className="space-y-3">
                {messages.map((m) =>
                  m.kind === "event" ? (
                    <p key={m.id} className="text-xs text-slate-500 pl-3 border-l-2 border-slate-200">
                      <strong className="text-slate-600">{m.authorName}</strong> · {m.body} · {formatDateTime(m.createdAt)}
                    </p>
                  ) : (
                    <div
                      key={m.id}
                      className={`rounded-2xl border p-4 ${
                        m.kind === "internal_note"
                          ? "border-amber-200 bg-amber-50"
                          : m.authorId === ticket.reporterId
                            ? "border-slate-200 bg-white"
                            : "border-emerald-100 bg-emerald-50/70"
                      }`}
                    >
                      <p className="text-xs font-bold text-slate-600 mb-1">
                        {m.kind === "internal_note" && <span className="text-amber-700">Internal note · </span>}
                        {m.authorName}
                        {m.authorId === ticket.reporterId ? " (trainee)" : ""}
                        <span className="font-normal text-slate-400"> · {formatDateTime(m.createdAt)}</span>
                      </p>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap">{m.body}</p>
                    </div>
                  ),
                )}
              </div>

              <form onSubmit={send} className={`rounded-2xl border p-4 ${internal ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
                <div className="flex gap-1 mb-3">
                  <button type="button" onClick={() => setInternal(false)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${!internal ? "bg-emerald-700 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                    Reply to trainee
                  </button>
                  <button type="button" onClick={() => setInternal(true)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${internal ? "bg-amber-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                    Internal note
                  </button>
                </div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={5000}
                  placeholder={internal ? "Only staff can see this note" : "The trainee will see this and get an email"}
                  className="w-full min-h-[110px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  {!internal ? (
                    <label className="flex items-center gap-2 text-xs text-slate-600">
                      <input type="checkbox" checked={resolveAfterReply} onChange={(e) => setResolveAfterReply(e.target.checked)} />
                      Mark as resolved after sending
                    </label>
                  ) : <span />}
                  <button type="submit" disabled={busy || !body.trim()} className={`rounded-xl px-5 py-2 text-sm font-bold text-white disabled:opacity-50 ${internal ? "bg-amber-600" : "bg-emerald-700 hover:bg-emerald-800"}`}>
                    {internal ? "Add note" : "Send reply"}
                  </button>
                </div>
              </form>
            </div>

            <aside className="space-y-4 text-sm">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                <Control label="Status">
                  <select className={`${select} w-full`} value={ticket.status} disabled={busy} onChange={(e) => update({ status: e.target.value })}>
                    {(Object.keys(TICKET_STATUS) as TicketStatus[]).map((s) => (
                      <option key={s} value={s}>{TICKET_STATUS[s].label}</option>
                    ))}
                  </select>
                </Control>
                <Control label="Priority">
                  <select className={`${select} w-full`} value={ticket.priority} disabled={busy} onChange={(e) => update({ priority: e.target.value })}>
                    {(Object.keys(TICKET_PRIORITY) as TicketPriority[]).map((p) => (
                      <option key={p} value={p}>{TICKET_PRIORITY[p].label}</option>
                    ))}
                  </select>
                </Control>
                <Control label="Category">
                  <select className={`${select} w-full`} value={ticket.category} disabled={busy} onChange={(e) => update({ category: e.target.value })}>
                    {Object.entries(TICKET_CATEGORY_LABELS).map(([cid, l]) => (
                      <option key={cid} value={cid}>{l}</option>
                    ))}
                  </select>
                </Control>
                <Control label="Assignee">
                  <select
                    className={`${select} w-full`}
                    value={ticket.assignedToId || ""}
                    disabled={busy}
                    onChange={(e) => update({ assignedToId: e.target.value || null })}
                  >
                    <option value="">Unassigned</option>
                    {assignees.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}{a.id === myId ? " (me)" : ""}</option>
                    ))}
                  </select>
                </Control>
                {myId && ticket.assignedToId !== myId && assignees.some((a) => a.id === myId) && (
                  <button onClick={() => update({ assignedToId: myId })} disabled={busy} className="w-full rounded-lg border border-slate-200 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                    Assign to me
                  </button>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Trainee</p>
                <p className="font-bold text-slate-900">{ticket.reporterName}</p>
                <a href={`mailto:${ticket.reporterEmail}`} className="block text-xs text-emerald-700 hover:underline break-all">{ticket.reporterEmail}</a>
                {ticket.reporterPhone && <a href={`tel:${ticket.reporterPhone}`} className="block text-xs text-emerald-700 hover:underline">{ticket.reporterPhone}</a>}
                {ticket.groupName && <p className="text-xs text-slate-500">Group: {ticket.groupName}</p>}
                {site && <p className="text-xs text-slate-500">Site: {site.name}</p>}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-1.5 text-xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Details</p>
                <p><span className="text-slate-400">Trainer:</span> <strong>{ticket.trainerName}</strong>{!ticket.trainerId && <span className="text-slate-400"> (typed by trainee)</span>}</p>
                {ticket.incidentDate && <p><span className="text-slate-400">Happened:</span> {new Date(ticket.incidentDate).toLocaleDateString()}</p>}
                <p><span className="text-slate-400">Opened:</span> {formatDateTime(ticket.createdAt)}</p>
                <p><span className="text-slate-400">First response:</span> {ticket.firstResponseAt ? formatDateTime(ticket.firstResponseAt) : "Not yet"}</p>
                {ticket.resolvedAt && <p><span className="text-slate-400">Resolved:</span> {formatDateTime(ticket.resolvedAt)}</p>}
                {ticket.satisfactionRating && (
                  <p><span className="text-slate-400">Rating:</span> {ticket.satisfactionRating}/5{ticket.satisfactionComment ? ` — "${ticket.satisfactionComment}"` : ""}</p>
                )}
              </div>

              {related.length > 0 && (
                <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-orange-700 mb-2">
                    {related.length} other ticket{related.length > 1 ? "s" : ""} about this trainer
                  </p>
                  <ul className="space-y-1.5">
                    {related.map((r) => (
                      <li key={r.id}>
                        <button onClick={() => onOpenOther(r.id)} className="text-left text-xs hover:underline">
                          <span className="font-mono text-slate-500">{r.code}</span> {r.subject}
                          <span className="text-slate-400"> · {TICKET_STATUS[r.status]?.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

function userIdFromToken(token: string | null): string | undefined {
  if (!token) return undefined;
  try {
    return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).userId;
  } catch {
    return undefined;
  }
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</span>
      {children}
    </label>
  );
}
