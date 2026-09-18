"use client";

import { useEffect, useState, useMemo } from "react";
import { authFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { popup } from "@/components/layout/PopupProvider";
import { getMemberPaymentMethod } from "../coordinator/page";

interface CooperativeMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cooperativeName: string | null;
  lga: string | null;
  zoneCluster: string | null;
  registrationFeePaid: string | null;
  paymentMethod?: string | null;
  paymentChannel?: string | null;
  paymentRef?: string | null;
  isExistingMember?: boolean;
  alreadyMember?: boolean;
  status: "active" | "inactive";
  joinedAt: string;
  remarks: string | null;
}

export default function StateCoordinatorPage() {
  const [members, setMembers]     = useState<CooperativeMember[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [search, setSearch]       = useState("");
  const [lgaFilter, setLgaFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"members" | "announcements">("members");
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    level: "state" as const,
    postedBy: "",
  });
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);
  const [announcementError, setAnnouncementError] = useState("");
  const [announcementSuccess, setAnnouncementSuccess] = useState("");

  const token = useAuthStore((s) => s.accessToken);

  const assignedState = useMemo(() => {
    if (!token) return null;
    try { return JSON.parse(atob(token.split(".")[1])).assignedState || null; }
    catch { return null; }
  }, [token]);

  useEffect(() => {
    if (assignedState) {
      setAnnouncementForm((prev) => ({
        ...prev,
        postedBy: `${assignedState} Coordinator`,
      }));
    } else {
      setAnnouncementForm((prev) => ({
        ...prev,
        postedBy: `State Coordinator`,
      }));
    }
  }, [assignedState]);

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await authFetch("/cooperative/members");
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to load members"); return; }
      setMembers(data);
    } catch {
      setError("Failed to fetch cooperative members.");
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (memberId: string) => {
    if (!(await popup.confirm("Are you sure you want to manually mark this member as Paid?"))) return;
    setUpdatingId(memberId);
    try {
      const res = await authFetch(`/cooperative/members/${memberId}`, {
        method: "PATCH",
        body: JSON.stringify({ registrationFeePaid: "YES" }),
      });
      const data = await res.json();
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, registrationFeePaid: "YES" } : m))
        );
      } else {
        await popup.alert(data.error || "Failed to update payment status");
      }
    } catch {
      await popup.alert("Failed to connect to the server.");
    } finally {
      setUpdatingId(null);
    }
  };

  const declineMember = async (memberId: string) => {
    if (!(await popup.confirm("Are you sure you want to decline this registration and delete the member?"))) return;
    setUpdatingId(memberId);
    try {
      const res = await authFetch(`/cooperative/members/${memberId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      } else {
        await popup.alert(data.error || "Failed to decline member");
      }
    } catch {
      await popup.alert("Failed to connect to the server.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.content.trim() || !announcementForm.postedBy.trim()) {
      setAnnouncementError("All fields are required.");
      return;
    }

    setPostingAnnouncement(true);
    setAnnouncementError("");
    setAnnouncementSuccess("");

    try {
      const res = await authFetch("/cooperative/announcements/broadcast", {
        method: "POST",
        body: JSON.stringify(announcementForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setAnnouncementError(data.error || "Failed to send announcement");
        return;
      }

      setAnnouncementSuccess(
        `Announcement successfully sent to members in ${assignedState || "your State"}!`
      );
      setAnnouncementForm((prev) => ({
        ...prev,
        title: "",
        content: "",
      }));
    } catch {
      setAnnouncementError("Failed to connect to the server.");
    } finally {
      setPostingAnnouncement(false);
    }
  };

  // Filter to only members whose cooperative is in this coordinator's state
  const stateMembers = useMemo(() => {
    if (!assignedState) return [];
    const safeMembers = Array.isArray(members) ? members : [];
    return safeMembers.filter((m) => {
      // cooperative name often encodes the state; we rely on lga/zone matching
      // Primary: filter by state if returned; fallback: show all (admin controls backend)
      return true; // All members returned by /cooperative/members are already scoped by backend for coordinators
    });
  }, [members, assignedState]);

  // Unique LGAs within the state's members for the sub-filter
  const lgas = useMemo(() => {
    const safeStateMembers = Array.isArray(stateMembers) ? stateMembers : [];
    const set = new Set(safeStateMembers.map((m) => m.lga).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [stateMembers]);

  const filtered = useMemo(() => {
    const safeStateMembers = Array.isArray(stateMembers) ? stateMembers : [];
    return safeStateMembers
      .filter((m) => lgaFilter === "all" || m.lga === lgaFilter)
      .filter((m) =>
        search === "" ||
        `${m.firstName} ${m.lastName} ${m.email} ${m.phone}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
  }, [stateMembers, lgaFilter, search]);

  const activeCount   = filtered.filter((m) => m.status === "active").length;
  const paidCount     = filtered.filter((m) => m.registrationFeePaid === "YES").length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">🏛️</span>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              State Coordinator
            </h1>
            {assignedState && (
              <p className="text-green-400 text-sm font-semibold mt-0.5">
                {assignedState} State — All Cooperatives
              </p>
            )}
          </div>
        </div>
        <p className="text-slate-500 text-sm mt-2">
          View all cooperative members across every LGA in {assignedState || "your state"}.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-px mb-6">
        <button
          onClick={() => setActiveTab("members")}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === "members"
              ? "border-green-500 text-green-400"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          Cooperative Members
        </button>
        <button
          onClick={() => setActiveTab("announcements")}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
            activeTab === "announcements"
              ? "border-green-500 text-green-400"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          Send Announcements
        </button>
      </div>

      {activeTab === "members" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Members",  value: stateMembers.length, color: "text-blue-400" },
              { label: "Filtered View",  value: filtered.length,     color: "text-white" },
              { label: "Active",         value: activeCount,          color: "text-green-400" },
              { label: "Fees Paid",      value: paidCount,            color: "text-yellow-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="text"
              placeholder="Search by name, email or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-green-600 transition"
            />
            <select
              value={lgaFilter}
              onChange={(e) => setLgaFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-green-600 transition"
            >
              <option value="all">All LGAs</option>
              {lgas.map((lga) => (
                <option key={lga} value={lga}>{lga}</option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-700/30 rounded-xl p-4 text-red-400 text-sm mb-6">
              {error}
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="text-center text-slate-500 py-20 text-sm">Loading members…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-slate-500 py-20 text-sm">No members found.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase tracking-widest text-slate-500">
                    <th className="text-left px-4 py-3">Member</th>
                    <th className="text-left px-4 py-3">Phone</th>
                    <th className="text-left px-4 py-3">LGA</th>
                    <th className="text-left px-4 py-3">Zone</th>
                    <th className="text-left px-4 py-3">Cooperative</th>
                    <th className="text-left px-4 py-3">Payment Method</th>
                    <th className="text-left px-4 py-3">Fee Paid</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => {
                    const payInfo = getMemberPaymentMethod(m);
                    return (
                      <tr
                        key={m.id}
                        className="border-b border-slate-800/50 hover:bg-slate-800/30 transition"
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-white">{m.firstName} {m.lastName}</p>
                          <p className="text-xs text-slate-500">{m.email}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{m.phone}</td>
                        <td className="px-4 py-3 text-slate-300">{m.lga || "—"}</td>
                        <td className="px-4 py-3 text-slate-300 text-xs">{m.zoneCluster || "—"}</td>
                        <td className="px-4 py-3 text-slate-300 text-xs">{m.cooperativeName || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${payInfo.badgeClass}`}>
                            <span>{payInfo.icon}</span>
                            <span>{payInfo.label}</span>
                          </span>
                        </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            m.registrationFeePaid === "YES"
                              ? "bg-green-500/15 text-green-400 border border-green-700/30"
                              : "bg-red-500/10 text-red-400 border border-red-700/30"
                          }`}>
                            {m.registrationFeePaid === "YES" ? "Paid" : "Unpaid"}
                          </span>
                          {m.registrationFeePaid !== "YES" && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => markAsPaid(m.id)}
                                disabled={updatingId === m.id}
                                className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/20 px-2 py-0.5 rounded transition disabled:opacity-50 font-semibold"
                                title="Mark as paid manually"
                              >
                                Verify Payment
                              </button>
                              <button
                                onClick={() => declineMember(m.id)}
                                disabled={updatingId === m.id}
                                className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 px-2 py-0.5 rounded transition disabled:opacity-50 font-semibold"
                                title="Decline and remove registration"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          m.status === "active"
                            ? "bg-green-500/15 text-green-400 border border-green-700/30"
                            : "bg-slate-700/50 text-slate-400 border border-slate-600/30"
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {new Date(m.joinedAt).toLocaleDateString("en-GB", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer count */}
          {!loading && filtered.length > 0 && (
            <p className="text-xs text-slate-600 mt-4 text-right">
              Showing {filtered.length} of {stateMembers.length} members
              {lgaFilter !== "all" ? ` in ${lgaFilter}` : ` across all LGAs`}
              {assignedState ? ` · ${assignedState} State` : ""}
            </p>
          )}
        </>
      )}

      {activeTab === "announcements" && (
        <div className="max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-white font-bold text-lg mb-1">New Announcement</h3>
            <p className="text-slate-500 text-xs">
              This announcement will be published to all cooperative members in your assigned State ({assignedState || "All States"}).
            </p>
          </div>

          {announcementError && (
            <div className="bg-red-950/40 border border-red-700/30 text-red-400 text-xs px-4 py-3 rounded-xl">
              {announcementError}
            </div>
          )}

          {announcementSuccess && (
            <div className="bg-green-950/40 border border-green-700/30 text-green-400 text-xs px-4 py-3 rounded-xl">
              {announcementSuccess}
            </div>
          )}

          <form onSubmit={handlePostAnnouncement} className="space-y-4">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 font-bold">
                Announcement Title
              </label>
              <input
                type="text"
                placeholder="e.g. State Cooperative Welfare Notice"
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-[#0a0f1a] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-green-600 transition"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 font-bold">
                Content / Message Body
              </label>
              <textarea
                placeholder="Type your message here for members..."
                value={announcementForm.content}
                onChange={(e) => setAnnouncementForm(prev => ({ ...prev, content: e.target.value }))}
                rows={6}
                className="w-full bg-[#0a0f1a] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-green-600 transition resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Scope / Level</label>
                <input
                  type="text"
                  value="State Level"
                  disabled
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed font-medium"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 font-bold">Sender Label</label>
                <input
                  type="text"
                  placeholder="e.g. State Coordinator"
                  value={announcementForm.postedBy}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, postedBy: e.target.value }))}
                  className="w-full bg-[#0a0f1a] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-655 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={postingAnnouncement || !announcementForm.title.trim() || !announcementForm.content.trim()}
              className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-green-950/20"
            >
              {postingAnnouncement ? "Sending..." : "Send Announcement"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
