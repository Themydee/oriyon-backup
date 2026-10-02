// Shared labels and styles for trainer support tickets (backend: user-service /tickets)

export type TicketStatus = "open" | "in_progress" | "awaiting_reporter" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface Ticket {
  id: string;
  code: string;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  reporterPhone?: string | null;
  cohortId?: string | null;
  groupId?: string | null;
  groupName?: string | null;
  physicalSiteId?: string | null;
  trainerId?: string | null;
  trainerName: string;
  category: string;
  priority: TicketPriority;
  subject: string;
  description: string;
  incidentDate?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  status: TicketStatus;
  assignedToId?: string | null;
  assignedToName?: string | null;
  firstResponseAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  satisfactionRating?: number | null;
  satisfactionComment?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  kind: "reply" | "internal_note" | "event";
  body: string;
  createdAt: string;
}

export const TICKET_CATEGORY_LABELS: Record<string, string> = {
  absence: "Absent or late to sessions",
  conduct: "Unprofessional or disrespectful conduct",
  harassment: "Harassment or abuse",
  teaching_quality: "Teaching quality or unclear explanations",
  assessment: "Assessment, grading or attendance records",
  extortion: "Request for money or favours",
  practical_session: "Practical session or site organisation",
  communication: "Unresponsive or hard to reach",
  other: "Something else",
};

export const TICKET_STATUS: Record<TicketStatus, { label: string; reporterLabel: string; className: string }> = {
  open: { label: "Open", reporterLabel: "Received", className: "bg-sky-50 text-sky-700 border-sky-200" },
  in_progress: { label: "In progress", reporterLabel: "Being reviewed", className: "bg-amber-50 text-amber-800 border-amber-200" },
  awaiting_reporter: { label: "Awaiting trainee", reporterLabel: "Needs your reply", className: "bg-violet-50 text-violet-700 border-violet-200" },
  resolved: { label: "Resolved", reporterLabel: "Resolved", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  closed: { label: "Closed", reporterLabel: "Closed", className: "bg-slate-100 text-slate-600 border-slate-200" },
};

export const TICKET_PRIORITY: Record<TicketPriority, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-slate-100 text-slate-600 border-slate-200" },
  medium: { label: "Medium", className: "bg-sky-50 text-sky-700 border-sky-200" },
  high: { label: "High", className: "bg-orange-50 text-orange-700 border-orange-200" },
  urgent: { label: "Urgent", className: "bg-red-50 text-red-700 border-red-200" },
};

export const ACTIVE_STATUSES: TicketStatus[] = ["open", "in_progress", "awaiting_reporter"];

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function timeAgo(value?: string | null) {
  if (!value) return "";
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export async function readError(res: Response, fallback: string) {
  try {
    const data = await res.json();
    return typeof data.error === "string" ? data.error : fallback;
  } catch {
    return fallback;
  }
}
