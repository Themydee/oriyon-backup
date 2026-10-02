// Types and helpers for the LMS community (backend: lms-service /lms/community)

export interface Reply {
  id: string;
  answerId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string | null;
  createdAt: string;
}

export interface Answer {
  id: string;
  questionId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string | null;
  isVerified: boolean;
  upvotes: number;
  hasUpvoted: boolean;
  createdAt: string;
  replies: Reply[];
}

export interface Question {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string | null;
  channelId: string;
  channelName: string;
  tags: string[];
  upvotes: number;
  hasUpvoted: boolean;
  isSolved: boolean;
  solvedAnswerId?: string | null;
  createdAt: string;
  updatedAt: string;
  answers: Answer[];
}

export interface ChatMessage {
  id: string;
  channelId: string;
  text: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string | null;
  isPinned?: boolean | null;
  createdAt: string;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  questionCount: number;
}

export const STAFF_ROLES = ["trainer", "lead_trainer", "coordinator", "admin", "sub_admin"];
export const MODERATOR_ROLES = ["trainer", "lead_trainer", "admin", "sub_admin"];

export const ROLE_BADGE: Record<string, { label: string; className: string } | undefined> = {
  trainer: { label: "Trainer", className: "bg-emerald-100 text-emerald-800" },
  lead_trainer: { label: "Lead trainer", className: "bg-emerald-100 text-emerald-800" },
  coordinator: { label: "Coordinator", className: "bg-sky-100 text-sky-800" },
  admin: { label: "Oriyon team", className: "bg-[#002d25] text-white" },
  sub_admin: { label: "Oriyon team", className: "bg-[#002d25] text-white" },
};

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";
}
