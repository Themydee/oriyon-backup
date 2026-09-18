"use client";

import { useState, useEffect } from "react";
import { authFetch, getApiBase } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { popup } from "@/components/layout/PopupProvider";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  level: "global" | "state" | "zone" | "cooperative" | "trainers" | "trainees";
  targetAudience?: "all" | "trainers" | "trainees";
  isPinned?: boolean;
  imageUrl?: string;
  postedBy: string;
  createdAt: string;
}

const STORAGE_KEY = "oriyon_broadcast_announcements_v1";

export default function AdminAnnouncementsPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);

  const userPayload = token ? (() => {
    try { return JSON.parse(atob(token.split(".")[1])); } catch { return null; }
  })() : null;

  const currentRole = userPayload?.role || user?.role || "";
  const canPublish = currentRole === "admin" || currentRole === "sub_admin" || currentRole === "corper" || currentRole === "coordinator";
  const isTrainerRole = currentRole === "trainer" || currentRole === "lead_trainer";

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [level, setLevel] = useState<"global" | "trainers" | "trainees" | "state" | "zone" | "cooperative">("global");
  const [isPinned, setIsPinned] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError("");

    let serverList: Announcement[] = [];
    let serverOk = false;

    try {
      const res = await authFetch("/cooperative/announcements/broadcast");
      if (res.ok) {
        const data = await res.json();
        serverList = Array.isArray(data) ? data : data.announcements || data.data || [];
        serverOk = true;
      }
    } catch {
      // Endpoint fallback
    }

    if (serverOk) {
      // Sort pinned announcements first, then newest first
      serverList.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });

      setAnnouncements(serverList);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(serverList)); } catch {}
    } else {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          setAnnouncements(JSON.parse(raw));
        } else {
          setAnnouncements([]);
        }
      } catch {
        setAnnouncements([]);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleEdit = (ann: Announcement) => {
    if (!canPublish) return;
    setEditingId(ann.id);
    setTitle(ann.title);
    setContent(ann.content);
    setLevel(ann.level || "global");
    setIsPinned(!!ann.isPinned);
    setImageUrl(ann.imageUrl || "");
    setError("");
    setSuccess("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setLevel("global");
    setIsPinned(false);
    setImageUrl("");
  };

  const [sendAsTrainerEmail, setSendAsTrainerEmail] = useState(false);

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPublish) {
      setError("Only Super Admins and Sub Admins are authorized to publish announcements.");
      return;
    }

    setError("");
    setSuccess("");

    if (!title.trim() || !content.trim()) {
      setError("Please fill out both the title and announcement content.");
      return;
    }

    setSubmitting(true);

    const posterName = userPayload?.firstName
      ? `${userPayload.firstName} ${userPayload.lastName || ""}`.trim()
      : userPayload?.email || user?.email || "EEWYLA Admin";

    const targetAudienceVal: "all" | "trainers" | "trainees" =
      level === "trainers" ? "trainers" : level === "trainees" ? "trainees" : "all";

    const payload = {
      title: title.trim(),
      content: content.trim(),
      level,
      targetAudience: targetAudienceVal,
      postedBy: posterName,
      isPinned,
      imageUrl: imageUrl.trim() || undefined,
    };

    if (editingId) {
      // Update existing announcement
      try {
        await authFetch(`/cooperative/announcements/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.warn("Update error:", err);
      }

      const updated = announcements.map((a) => (a.id === editingId ? { ...a, ...payload } : a));
      setAnnouncements(updated);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}

      setSuccess("Announcement updated successfully!");
      handleCancelEdit();
      setSubmitting(false);
      return;
    }

    // Create new announcement
    try {
      const res = await authFetch("/cooperative/announcements/broadcast", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.warn("Backend broadcast warning:", errData);
      }
    } catch (err: any) {
      console.warn("Server connection issue, saving broadcast locally", err);
    }

    // Dispatch customized email to all trainers if targeted or option checked
    let emailStatus = "";
    if (level === "trainers" || sendAsTrainerEmail) {
      try {
        const emailRes = await authFetch("/users/trainers/email", {
          method: "POST",
          body: JSON.stringify({
            subject: title.trim(),
            body: content.trim(),
          }),
        });
        const emailData = await emailRes.json();
        if (emailRes.ok) {
          emailStatus = ` & email dispatched to ${emailData.count || "all"} trainers!`;
        }
      } catch (e) {
        console.warn("Trainer direct email error:", e);
      }
    }

    const newBroadcast: Announcement = {
      id: `anc-${Date.now()}`,
      ...payload,
      createdAt: new Date().toISOString(),
    };

    const updated = [newBroadcast, ...announcements];
    setAnnouncements(updated);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}

    setSuccess(`Announcement broadcast published successfully${emailStatus}`);
    handleCancelEdit();
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!canPublish) return;
    const confirmed = await popup.confirm("Are you sure you want to delete this broadcast announcement?");
    if (!confirmed) return;

    try {
      await authFetch(`/cooperative/announcements/${id}`, { method: "DELETE" }).catch(() => {});
    } catch {}

    const updated = announcements.filter((a) => a.id !== id);
    setAnnouncements(updated);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
    popup.alert("Announcement deleted.");
  };

  // Filter visible announcements based on role
  const visibleAnnouncements = announcements.filter((a) => {
    if (canPublish) return true; // Super Admin & Sub Admin see all broadcasts
    if (isTrainerRole) {
      // Trainers only see announcements for trainers OR global/all
      return (
        a.level === "trainers" ||
        a.targetAudience === "trainers" ||
        a.level === "global" ||
        a.targetAudience === "all" ||
        !a.targetAudience
      );
    }
    // Trainees only see non-trainer announcements
    return a.level !== "trainers" && a.targetAudience !== "trainers";
  });

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="px-3 py-1 bg-green-100 text-green-800 text-[10px] font-black uppercase tracking-wider rounded-full">
            {canPublish ? "Admin Communications" : "Trainer Noticeboard"}
          </span>
          <h1 className="text-3xl font-extrabold text-[#002d25] mt-2">
            {canPublish ? "Announcements & Broadcast Publisher" : "Trainer Announcements Feed"}
          </h1>
          <p className="text-slate-500 text-xs mt-1 font-semibold">
            {canPublish
              ? "Post news updates, target announcements for Trainers View Alone or global broadcasts across the EEWYLA platform."
              : "View official notices, technical guidelines, and announcements issued specifically for Trainers & Lead Trainers."}
          </p>
        </div>

        <button
          onClick={fetchAnnouncements}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          🔄 Refresh Feed
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form / Role Info Column */}
        {canPublish ? (
          <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5 h-fit">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-[#002d25]">
                {editingId ? "✏️ Edit Announcement" : "📢 Publish New Announcement"}
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 leading-relaxed font-semibold">
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 leading-relaxed font-semibold">
                ✅ {success}
              </div>
            )}

            <form onSubmit={handlePostAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Official EEWYLA Trainer Briefing & Guidelines"
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-green-600 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Target Broadcast Audience *
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-green-600 bg-white font-semibold"
                >
                  <option value="global">🌐 All Users (Global Broadcast)</option>
                  <option value="trainers">🎓 Trainers Only (Trainers View Alone)</option>
                  <option value="trainees">👥 Trainees Only</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1 font-medium">
                  {level === "trainers"
                    ? "🔒 Select 'Trainers Only' so only Trainers & Lead Trainers can view this notice."
                    : "Visible to selected users across the portal."}
                </p>

                <label className="flex items-center gap-2 mt-2 cursor-pointer bg-purple-50 p-2.5 rounded-xl border border-purple-200">
                  <input
                    type="checkbox"
                    checked={sendAsTrainerEmail || level === "trainers"}
                    onChange={(e) => setSendAsTrainerEmail(e.target.checked)}
                    className="accent-purple-700 w-4 h-4 rounded"
                  />
                  <span className="text-xs font-bold text-purple-900">
                    📧 Dispatch customized email directly to all Trainers
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Announcement Message *
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  placeholder="Write message content here..."
                  className="w-full border border-slate-300 rounded-xl p-4 text-xs text-slate-900 focus:outline-none focus:border-green-600 bg-white leading-relaxed"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Optional Image Attachment URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... image link or /eewyla/launch.jpg"
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-green-600 bg-white"
                />
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="accent-green-700 w-4 h-4 rounded"
                />
                <span className="text-xs font-bold text-slate-800">
                  Pin to top of announcement feed
                </span>
              </label>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-green-800 hover:bg-green-900 text-white rounded-xl text-xs font-bold shadow transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting ? "Saving..." : editingId ? "Update Announcement ✏️" : "Publish Announcement Broadcast 📢"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="lg:col-span-1 bg-purple-50/80 border border-purple-200 rounded-3xl p-6 space-y-4 h-fit">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-purple-100 text-purple-900 rounded-xl font-bold">🎓</span>
              <h2 className="text-sm font-black uppercase tracking-wider text-purple-950">
                Trainer Announcement Inbox
              </h2>
            </div>
            <p className="text-xs text-purple-900 leading-relaxed font-medium">
              As a Trainer / Lead Trainer, you receive announcements targeted specifically to Trainers, as well as global notices from Super Admins and Sub Admins.
            </p>
            <div className="p-3 bg-white rounded-2xl border border-purple-100 text-[11px] text-purple-800 font-semibold space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-700">
                <span>✓</span> View official trainer notices & field guidelines
              </div>
              <div className="flex items-center gap-1.5 text-amber-700">
                <span>🔒</span> Announcement creation is reserved for Super & Sub Admins
              </div>
            </div>
          </div>
        )}

        {/* Listings Column */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-[#002d25]">
              Active Broadcast Announcements ({visibleAnnouncements.length})
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-16 text-xs text-slate-400 animate-pulse">
              Loading announcements...
            </div>
          ) : visibleAnnouncements.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs italic">
              No active announcements found for your role feed.
            </div>
          ) : (
            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
              {visibleAnnouncements.map((a) => {
                const levelColors: Record<string, string> = {
                  global: "bg-emerald-100 text-emerald-800 border-emerald-200",
                  trainers: "bg-purple-100 text-purple-800 border-purple-200 font-black",
                  trainees: "bg-teal-100 text-teal-800 border-teal-200",
                  state: "bg-blue-100 text-blue-800 border-blue-200",
                  zone: "bg-indigo-100 text-indigo-800 border-indigo-200",
                  cooperative: "bg-slate-100 text-slate-700 border-slate-200",
                };

                const isTrainersOnly = a.level === "trainers" || a.targetAudience === "trainers";
                const isTraineesOnly = a.targetAudience === "trainees";

                return (
                  <div
                    key={a.id}
                    className={`p-5 rounded-2xl space-y-3 transition relative border ${
                      isTrainersOnly
                        ? "bg-purple-50/40 border-purple-200 hover:border-purple-300"
                        : "bg-slate-50 border-slate-200 hover:border-slate-350"
                    }`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 border rounded-full text-[9px] font-black uppercase tracking-wider ${
                          levelColors[a.level] || levelColors.global
                        }`}>
                          {isTrainersOnly
                            ? "🎓 TRAINERS VIEW ALONE"
                            : isTraineesOnly
                            ? "👥 TRAINEES ONLY"
                            : `${a.level.toUpperCase()} BROADCAST`}
                        </span>

                        {a.isPinned && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-black rounded-full uppercase tracking-wider">
                            📌 PINNED
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        🗓️ {new Date(a.createdAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric"
                        })}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{a.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {a.content}
                    </p>

                    {a.imageUrl && (
                      <div className="rounded-xl overflow-hidden max-h-48 bg-slate-100 border border-slate-200">
                        <img src={a.imageUrl} alt={a.title} className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Posted by: <strong>{a.postedBy}</strong></span>
                      {canPublish && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(a)}
                            className="text-blue-600 hover:text-blue-800 font-bold px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(a.id)}
                            className="text-red-600 hover:text-red-800 font-bold px-2 py-1 bg-red-50 hover:bg-red-100 rounded-lg transition"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
