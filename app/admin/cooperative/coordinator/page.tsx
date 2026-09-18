"use client";

import { useEffect, useState, useMemo } from "react";
import { authFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { COORDINATOR_LGA_MAP } from "@/lib/coordinators";
import { popup } from "@/components/layout/PopupProvider";

interface CooperativeMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cooperativeName: string | null;
  lga: string | null;
  registrationFeePaid: string | null; // "YES" or "NO"
  paymentMethod?: string | null;       // "paystack" | "existing_member" | "manual"
  paymentChannel?: string | null;
  paymentRef?: string | null;
  isExistingMember?: boolean;
  alreadyMember?: boolean;
  remarks: string | null; // Used to track WhatsApp status: "Joined WhatsApp" or other values
  joinedAt: string;
}

export function getMemberPaymentMethod(member: any): {
  type: "paystack" | "existing" | "pending";
  label: string;
  icon: string;
  badgeClass: string;
} {
  if (!member) {
    return { type: "pending", label: "Pending Verification", icon: "⏳", badgeClass: "text-amber-400 bg-amber-500/10 border-amber-500/30 font-bold" };
  }

  const rawMethod = String(member.paymentMethod || member.method || "").toLowerCase().trim();
  const isPaid = member.registrationFeePaid === "YES";

  if (member.isExistingMember || member.alreadyMember || rawMethod === "existing_member" || rawMethod === "manual" || rawMethod === "existing") {
    return {
      type: "existing",
      label: "Manually Verified (Existing)",
      icon: "🤝",
      badgeClass: "text-[#00D1C1] bg-[#00D1C1]/10 border-[#00D1C1]/30 font-bold",
    };
  }

  if (isPaid) {
    return {
      type: "paystack",
      label: "Paystack (Online 💳)",
      icon: "💳",
      badgeClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 font-bold",
    };
  }

  return {
    type: "pending",
    label: "Pending Verification",
    icon: "⏳",
    badgeClass: "text-amber-400 bg-amber-500/10 border-amber-500/30 font-bold",
  };
}

export default function CoordinatorCooperativePage() {
  const [members, setMembers] = useState<CooperativeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [lgaFilter, setLgaFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const [activeTab, setActiveTab] = useState<"members" | "announcements">("members");
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    targetLga: "all",
  });
  const [announcementSending, setAnnouncementSending] = useState(false);

  const { user } = useAuthStore();

  const userEmail = (user?.email || "").toLowerCase().trim();
  const assignedLga = COORDINATOR_LGA_MAP[userEmail] || null;

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authFetch("/cooperative/members");
      const data = await res.json();
      if (res.ok) {
        setMembers(Array.isArray(data) ? data : data.members || []);
      } else {
        setError(data.error || "Failed to load cooperative registry.");
      }
    } catch {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (memberId: string) => {
    if (!(await popup.confirm("Verify this member as a pre-existing member who paid offline?"))) return;
    setUpdatingId(memberId);
    try {
      const res = await authFetch(`/cooperative/members/${memberId}`, {
        method: "PATCH",
        body: JSON.stringify({
          registrationFeePaid: "YES",
          paymentMethod: "existing_member",
          isExistingMember: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === memberId
              ? {
                  ...m,
                  registrationFeePaid: "YES",
                  paymentMethod: "existing_member",
                  isExistingMember: true,
                }
              : m
          )
        );
      } else {
        await popup.alert(data.error || "Failed to update member status");
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
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      } else {
        await popup.alert("Failed to decline member");
      }
    } catch {
      await popup.alert("Failed to connect to the server.");
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleWhatsAppStatus = async (memberId: string, currentRemarks: string | null) => {
    const isJoined = currentRemarks === "Joined WhatsApp";
    const newRemarks = isJoined ? null : "Joined WhatsApp";
    setUpdatingId(memberId);
    try {
      const res = await authFetch(`/cooperative/members/${memberId}`, {
        method: "PATCH",
        body: JSON.stringify({ remarks: newRemarks }),
      });
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, remarks: newRemarks } : m))
        );
      } else {
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, remarks: newRemarks } : m))
        );
      }
    } catch {
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, remarks: newRemarks } : m))
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title || !announcementForm.content) {
      await popup.alert("Please fill in both title and content.");
      return;
    }
    setAnnouncementSending(true);
    try {
      const res = await authFetch("/cooperative/announcements/broadcast", {
        method: "POST",
        body: JSON.stringify({
          title: announcementForm.title,
          content: announcementForm.content,
          postedBy: assignedLga ? `${assignedLga} Coordinator` : "LGA Coordinator",
          targetLga: assignedLga || announcementForm.targetLga,
        }),
      });
      if (res.ok) {
        await popup.alert("✓ Announcement sent successfully to all members!");
        setAnnouncementForm({ title: "", content: "", targetLga: "all" });
        setActiveTab("members");
      } else {
        const data = await res.json();
        await popup.alert(data.error || "Failed to send announcement.");
      }
    } catch {
      await popup.alert("Failed to connect to the server.");
    } finally {
      setAnnouncementSending(false);
    }
  };

  const uniqueLgas = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => {
      const name = m.lga || m.cooperativeName;
      if (name) set.add(name);
    });
    return Array.from(set).sort();
  }, [members]);

  const scopedMembers = useMemo(() => {
    let result = [...members];
    if (assignedLga) {
      result = result.filter(
        (m) =>
          (m.lga && m.lga.toLowerCase() === assignedLga.toLowerCase()) ||
          (m.cooperativeName && m.cooperativeName.toLowerCase().includes(assignedLga.toLowerCase()))
      );
    } else if (lgaFilter !== "all") {
      result = result.filter(
        (m) =>
          (m.lga && m.lga.toLowerCase() === lgaFilter.toLowerCase()) ||
          (m.cooperativeName && m.cooperativeName.toLowerCase().includes(lgaFilter.toLowerCase()))
      );
    }
    return result;
  }, [members, assignedLga, lgaFilter]);

  const filteredMembers = useMemo(() => {
    let result = [...scopedMembers];

    if (paymentFilter !== "all") {
      result = result.filter((m) => getMemberPaymentMethod(m).type === paymentFilter);
    }

    if (search.trim() !== "") {
      const query = search.toLowerCase();
      result = result.filter(
        (m) =>
          `${m.firstName} ${m.lastName}`.toLowerCase().includes(query) ||
          (m.email && m.email.toLowerCase().includes(query)) ||
          (m.phone && m.phone.includes(query))
      );
    }

    return result;
  }, [scopedMembers, paymentFilter, search]);

  const stats = useMemo(() => {
    const total = scopedMembers.length;
    let paystackPaid = 0;
    let existingCount = 0;
    let pendingCount = 0;
    let joinedWhatsapp = 0;

    scopedMembers.forEach((m) => {
      const payInfo = getMemberPaymentMethod(m);
      if (payInfo.type === "paystack") paystackPaid++;
      else if (payInfo.type === "existing") existingCount++;
      else pendingCount++;

      if (m.remarks === "Joined WhatsApp") joinedWhatsapp++;
    });

    return {
      total,
      paystackPaid,
      existingCount,
      pendingCount,
      joinedWhatsapp,
    };
  }, [scopedMembers]);

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-1">
            LGA Coordinator View
          </h1>
          <p className="text-slate-500 text-sm">
            {assignedLga
              ? `Viewing members for cooperative in ${assignedLga}`
              : "Super Admin view — inspect cooperative registries across all LGAs"}
          </p>
        </div>
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
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <div className="bg-[#020617] border border-slate-800 rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-white">{stats.total}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Total Members</p>
            </div>
            <div className="bg-[#020617] border border-slate-800 rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-emerald-400">{stats.paystackPaid}</p>
              <p className="text-xs text-slate-400 font-medium mt-1">💳 Paid Online (Paystack)</p>
            </div>
            <div className="bg-[#020617] border border-slate-800 rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-[#00D1C1]">{stats.existingCount}</p>
              <p className="text-xs text-slate-400 font-medium mt-1">🤝 Existing Members</p>
            </div>
            <div className="bg-[#020617] border border-slate-800 rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-sky-400">{stats.joinedWhatsapp}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Joined WhatsApp</p>
            </div>
          </div>

          {/* Filters bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6 items-start sm:items-center justify-between">
            <div className="flex flex-1 gap-3 w-full sm:w-auto flex-wrap">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email or phone..."
                className="w-full sm:max-w-xs bg-[#020617] border border-slate-700 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-green-600 transition"
              />

              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="bg-[#020617] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-green-600 transition font-medium"
              >
                <option value="all">All Payment Methods</option>
                <option value="paystack">💳 Paystack (Online)</option>
                <option value="existing">🤝 Existing Member</option>
                <option value="pending">⏳ Pending Verification</option>
              </select>

              {!assignedLga && (
                <select
                  value={lgaFilter}
                  onChange={(e) => setLgaFilter(e.target.value)}
                  className="bg-[#020617] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-green-600 transition"
                >
                  <option value="all">All LGAs / Cooperatives</option>
                  {uniqueLgas.map((lga) => (
                    <option key={lga} value={lga}>
                      {lga}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* List */}
          {loading ? (
            <div className="text-center py-20 text-slate-500">Loading registry...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-20 bg-[#020617]/20 rounded-2xl border border-slate-800 text-slate-500">
              No members found
            </div>
          ) : (
            <div className="bg-[#020617] border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-[#080c15] text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                  <tr>
                    <th scope="col" className="px-6 py-4">Trainee</th>
                    <th scope="col" className="px-6 py-4">Phone</th>
                    <th scope="col" className="px-6 py-4">Cooperative / LGA</th>
                    <th scope="col" className="px-6 py-4">Payment Method</th>
                    <th scope="col" className="px-6 py-4">Registration Status</th>
                    <th scope="col" className="px-6 py-4 text-center">WhatsApp Group</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredMembers.map((member) => {
                    const joined = member.remarks === "Joined WhatsApp";
                    const paid = member.registrationFeePaid === "YES";
                    const payInfo = getMemberPaymentMethod(member);

                    return (
                      <tr key={member.id} className="hover:bg-slate-900/30">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">{member.firstName} {member.lastName}</div>
                          <div className="text-xs text-slate-500">{member.email}</div>
                        </td>
                        <td className="px-6 py-4">{member.phone}</td>
                        <td className="px-6 py-4">{member.lga || member.cooperativeName}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] border ${payInfo.badgeClass}`}>
                            {payInfo.icon} {payInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${paid ? "text-green-400 bg-green-500/10 border-green-700/30" : "text-amber-500 bg-amber-500/5 border-amber-500/20"}`}>
                              {paid ? "PAID" : "PENDING"}
                            </span>
                            {!paid && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => markAsPaid(member.id)}
                                  disabled={updatingId === member.id}
                                  className="text-[10px] text-[#00D1C1] border border-[#00D1C1]/30 px-2 py-1 rounded hover:bg-[#00D1C1]/10"
                                >
                                  Verify
                                </button>
                                <button
                                  onClick={() => declineMember(member.id)}
                                  disabled={updatingId === member.id}
                                  className="text-[10px] text-red-400 border border-red-500/30 px-2 py-1 rounded hover:bg-red-500/10"
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => toggleWhatsAppStatus(member.id, member.remarks)}
                            disabled={updatingId === member.id}
                            className={`w-28 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 mx-auto border ${
                              joined
                                ? "bg-green-500/10 text-green-400 border-green-500/30"
                                : "bg-slate-800/40 text-slate-400 border-slate-700/60"
                            }`}
                          >
                            {updatingId === member.id ? (
                              <span className="animate-spin text-xs">🌀</span>
                            ) : joined ? (
                              <>
                                <span>Joined</span>
                                <span>✓</span>
                              </>
                            ) : (
                              <>
                                <span>Not Joined</span>
                                <span>✕</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === "announcements" && (
        <div className="bg-[#020617] border border-slate-800 rounded-2xl p-6 md:p-8 max-w-2xl">
          <h2 className="text-lg font-bold text-white mb-2">Send Broadcast Announcement</h2>
          <p className="text-slate-400 text-xs mb-6">
            Broadcast an announcement to members in your assigned LGA.
          </p>

          <form onSubmit={handleSendAnnouncement} className="space-y-4">
            {!assignedLga && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target LGA / Cooperative
                </label>
                <select
                  value={announcementForm.targetLga}
                  onChange={(e) =>
                    setAnnouncementForm({ ...announcementForm, targetLga: e.target.value })
                  }
                  className="w-full bg-[#080c15] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-600 transition"
                >
                  <option value="all">All LGAs / Cooperatives</option>
                  {uniqueLgas.map((lga) => (
                    <option key={lga} value={lga}>
                      {lga}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Title *
              </label>
              <input
                required
                type="text"
                value={announcementForm.title}
                onChange={(e) =>
                  setAnnouncementForm({ ...announcementForm, title: e.target.value })
                }
                placeholder="e.g. Mandatory Cooperative Meeting"
                className="w-full bg-[#080c15] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-green-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Content *
              </label>
              <textarea
                required
                rows={5}
                value={announcementForm.content}
                onChange={(e) =>
                  setAnnouncementForm({ ...announcementForm, content: e.target.value })
                }
                placeholder="Write your announcement details here..."
                className="w-full bg-[#080c15] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-green-600 transition resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={announcementSending}
              className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-sm rounded-xl hover:from-green-500 hover:to-emerald-500 transition shadow-lg disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {announcementSending ? (
                <>
                  <span className="animate-spin">🌀</span>
                  <span>Sending Announcement...</span>
                </>
              ) : (
                <>
                  <span>📢</span>
                  <span>Broadcast Announcement</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
