"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { authFetch } from "@/lib/api";
import { useNavigationHistory } from "@/components/NavigationHistoryProvider";
import { popup } from "@/components/layout/PopupProvider";

interface Cooperative {
  id: string;
  name: string;
  state: string;
  description: string;
  isActive: boolean;
  locationId?: string | null;
  regionId?: string | null;
  zone?: string | null;
  lga?: string | null;
  whatsappLink?: string | null;
  registrationFee?: number | null;
  registrationStatus?: "formal" | "pending";
}

interface CooperativeMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: "active" | "inactive";
  joinedAt: string;
}

export default function CooperativeDetailPage() {
  const { id } = useParams();
  const { goBack } = useNavigationHistory();

  const [cooperative, setCooperative] = useState<Cooperative | null>(null);
  const [members, setMembers] = useState<CooperativeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    level: "cooperative",
    postedBy: "Admin",
  });
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [announcementError, setAnnouncementError] = useState("");

  const fetchAnnouncements = async () => {
    setLoadingAnnouncements(true);
    try {
      const res = await authFetch(`/cooperative/${id}/announcements`);
      if (res.ok) setAnnouncements(await res.json());
    } catch {}
    finally { setLoadingAnnouncements(false); }
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.content.trim() || !announcementForm.postedBy.trim()) {
      setAnnouncementError("All fields are required.");
      return;
    }

    setPostingAnnouncement(true);
    setAnnouncementError("");

    try {
      const res = await authFetch(`/cooperative/${id}/announcements`, {
        method: "POST",
        body: JSON.stringify(announcementForm),
      });

      if (!res.ok) {
        const data = await res.json();
        setAnnouncementError(data.error || "Failed to post announcement");
        return;
      }

      setAnnouncementForm({
        title: "",
        content: "",
        level: "cooperative",
        postedBy: "Admin",
      });
      await fetchAnnouncements();
    } catch {
      setAnnouncementError("An error occurred while posting.");
    } finally {
      setPostingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!(await popup.confirm("Are you sure you want to delete this announcement?"))) return;

    try {
      const res = await authFetch(`/cooperative/${id}/announcements/${announcementId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchAnnouncements();
      } else {
        const data = await res.json();
        setAnnouncementError(data.error || "Failed to delete announcement");
      }
    } catch {
      setAnnouncementError("Failed to delete announcement.");
    }
  };

  useEffect(() => {
    if (!id) return;

    const fetchCooperativeDetails = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await authFetch(`/cooperative/${id}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load cooperative details");
          return;
        }

        setCooperative(data.cooperative);
        setMembers(data.members || []);
        await fetchAnnouncements();
      } catch (err) {
        setError("Failed to load cooperative details.");
      } finally {
        setLoading(false);
      }
    };

    fetchCooperativeDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 text-sm">
        Loading cooperative details...
      </div>
    );
  }

  if (error || !cooperative) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-sm font-semibold">{error || "Cooperative not found"}</p>
        <button
          onClick={() => goBack("/admin/cooperative")}
          className="text-green-400 text-sm mt-4 hover:underline"
        >
          ← Back to Cooperatives
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => goBack("/admin/cooperative")}
          className="text-xs text-slate-500 hover:text-slate-300 transition mb-2 inline-block"
        >
          ← Back to Cooperatives
        </button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-1 text-white">
              {cooperative.name}
            </h1>
            <p className="text-slate-500 text-sm">
              State: <span className="text-slate-300 font-semibold">{cooperative.state}</span>
              {cooperative.lga && (
                <>
                  {" "}
                  · LGA: <span className="text-slate-300 font-semibold">{cooperative.lga}</span>
                </>
              )}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <span
              className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${
                cooperative.registrationStatus === "pending"
                  ? "text-yellow-400 bg-yellow-500/10 border-yellow-700/30"
                  : "text-green-400 bg-green-500/10 border-green-700/30"
              }`}
            >
              {cooperative.registrationStatus === "pending" ? "Pending" : "Formally Registered"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cooperative Info Card */}
        <div className="lg:col-span-1">
          <div className="bg-[#020617] border border-slate-800 rounded-2xl p-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">
              Cooperative Info
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                  Description
                </p>
                <p className="text-sm text-white font-medium leading-relaxed">
                  {cooperative.description || "—"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                    Status
                  </p>
                  <p className="text-sm text-white font-medium">
                    {cooperative.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                    Registration Fee
                  </p>
                  <p className="text-sm text-white font-medium">
                    {cooperative.registrationFee !== null && cooperative.registrationFee !== undefined
                      ? `₦${cooperative.registrationFee}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Zone</p>
                  <p className="text-sm text-white font-medium">{cooperative.zone || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                    Location ID
                  </p>
                  <p className="text-sm text-white font-medium">{cooperative.locationId || "—"}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                  WhatsApp Group
                </p>
                {cooperative.whatsappLink ? (
                  <a
                    href={cooperative.whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-400 hover:underline break-all"
                  >
                    {cooperative.whatsappLink}
                  </a>
                ) : (
                  <p className="text-sm text-slate-500">—</p>
                )}
              </div>
            </div>
          </div>

          {/* Announcements Card */}
          <div className="bg-[#020617] border border-slate-800 rounded-2xl p-6 space-y-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 pb-2 border-b border-slate-800">
              Cooperative Announcements
            </h3>

            {announcementError && (
              <div className="bg-red-950/40 border border-red-700/30 text-red-400 text-xs px-3 py-2 rounded-xl">
                {announcementError}
              </div>
            )}

            {/* Post Announcement Form */}
            <form onSubmit={handlePostAnnouncement} className="space-y-3.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Post New Announcement
              </p>
              
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Announcement Title..."
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-[#0a0f1a] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-green-600 transition"
                />

                <textarea
                  placeholder="Write your announcement content here..."
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  className="w-full bg-[#0a0f1a] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-green-600 transition resize-none"
                />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] text-slate-500 uppercase tracking-widest mb-1">Scope Level</label>
                    <select
                      value={announcementForm.level}
                      onChange={(e) => setAnnouncementForm(prev => ({ ...prev, level: e.target.value }))}
                      className="w-full bg-[#0a0f1a] border border-slate-800 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-green-600 transition"
                    >
                      <option value="cooperative">Coop Level</option>
                      <option value="lga">LGA Level</option>
                      <option value="zone">Zonal Level</option>
                      <option value="state">State Level</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 uppercase tracking-widest mb-1">Posted By</label>
                    <input
                      type="text"
                      placeholder="e.g. State Coordinator"
                      value={announcementForm.postedBy}
                      onChange={(e) => setAnnouncementForm(prev => ({ ...prev, postedBy: e.target.value }))}
                      className="w-full bg-[#0a0f1a] border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-green-600 transition"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={postingAnnouncement || !announcementForm.title.trim() || !announcementForm.content.trim()}
                className="w-full py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
              >
                {postingAnnouncement ? "Posting..." : "Post Announcement"}
              </button>
            </form>

            {/* List of Existing Announcements */}
            <div className="border-t border-slate-800 pt-4 space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Posted Announcements ({announcements.length})
              </p>

              {loadingAnnouncements ? (
                <div className="text-center py-4 text-xs text-slate-600 animate-pulse">Loading announcements...</div>
              ) : announcements.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-600 italic">No announcements posted.</div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {announcements.map((a: any) => {
                    const levelColors: Record<string, string> = {
                      state: "text-emerald-400 bg-emerald-500/10 border-emerald-700/30",
                      zone: "text-blue-400 bg-blue-500/10 border-blue-700/30",
                      lga: "text-indigo-400 bg-indigo-500/10 border-indigo-700/30",
                      cooperative: "text-slate-400 bg-slate-500/10 border-slate-700/30",
                    };
                    return (
                      <div key={a.id} className="p-3 bg-[#0a0f1a] border border-slate-800 rounded-xl space-y-2 relative group">
                        <button
                          onClick={() => handleDeleteAnnouncement(a.id)}
                          className="absolute top-2.5 right-2.5 text-slate-500 hover:text-red-400 text-xs transition duration-150 p-1 rounded-lg hover:bg-red-950/20"
                          title="Delete announcement"
                        >
                          🗑️
                        </button>
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            levelColors[a.level] || levelColors.cooperative
                          }`}>
                            {a.level}
                          </span>
                          <span className="text-[9px] text-slate-600">
                            {new Date(a.createdAt).toLocaleDateString("en-GB", {
                              day: "numeric", month: "short"
                            })}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white pr-6">{a.title}</h4>
                        <p className="text-[10px] text-slate-400 leading-normal whitespace-pre-wrap">{a.content}</p>
                        <p className="text-[8px] text-slate-500 italic">By {a.postedBy}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Members List */}
        <div className="lg:col-span-2">
          <div className="bg-[#020617] border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-white font-bold text-lg">Members</h3>
                <p className="text-xs text-slate-500">
                  Total of {members.length} member{members.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-400 whitespace-nowrap">
                <thead className="text-xs text-slate-500 bg-[#0a0f1a] uppercase border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-4 font-bold tracking-wider">Member Name</th>
                    <th className="px-5 py-4 font-bold tracking-wider">Contact</th>
                    <th className="px-5 py-4 font-bold tracking-wider">Status</th>
                    <th className="px-5 py-4 font-bold tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-slate-500">
                        No members found in this cooperative.
                      </td>
                    </tr>
                  ) : (
                    members.map((member) => (
                      <tr
                        key={member.id}
                        className="border-b border-slate-800/50 hover:bg-[#080c15] transition"
                      >
                        <td className="px-5 py-4">
                          <p className="text-white font-semibold">
                            {member.firstName} {member.lastName}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-slate-300">{member.email || "—"}</p>
                          <p className="text-xs text-slate-500">{member.phone}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              member.status === "active"
                                ? "text-green-400 bg-green-500/10 border-green-700/30"
                                : "text-red-400 bg-red-500/10 border-red-700/30"
                            }`}
                          >
                            {member.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500">
                          {new Date(member.joinedAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
