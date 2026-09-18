"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  AppealRecord,
  AppealType,
  AppealStatus,
  getStoredAppeals,
  updateStoredAppealStatus,
} from "@/lib/appealsData";

export default function AdminAppealsPage() {
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);

  const [appeals, setAppeals]           = useState<AppealRecord[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [success, setSuccess]           = useState("");

  // Filters
  const [typeFilter, setTypeFilter]     = useState<"all" | AppealType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | AppealStatus>("all");

  // Review Modal State
  const [selectedAppeal, setSelectedAppeal] = useState<AppealRecord | null>(null);
  const [adminNotes, setAdminNotes]         = useState("");
  const [reviewing, setReviewing]           = useState(false);

  // Check role authorization (Admin, Trainer, Lead Trainer only)
  const userPayload = token ? (() => {
    try { return JSON.parse(atob(token.split(".")[1])); } catch { return null; }
  })() : null;
  const userRole = userPayload?.role || user?.role || "";
  const isAuthorized = ["admin", "trainer", "lead_trainer"].includes(userRole);

  useEffect(() => {
    if (!isAuthorized) {
      setLoading(false);
      return;
    }
    fetchAppeals();
  }, [isAuthorized]);

  const fetchAppeals = async () => {
    setLoading(true);
    setError("");
    try {
      // Try backend API first, fallback to local storage
      const res = await authFetch("/lms/appeals");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.appeals || data?.data || [];
        setAppeals(list);
      } else {
        const local = getStoredAppeals();
        setAppeals(local);
      }
    } catch {
      const local = getStoredAppeals();
      setAppeals(local);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: AppealStatus) => {
    if (!selectedAppeal) return;
    setReviewing(true);
    setError("");
    setSuccess("");

    try {
      // API call with local fallback
      await authFetch(`/lms/appeals/${selectedAppeal.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: newStatus,
          adminNotes,
          reviewedBy: user?.id || "admin",
        }),
      });

      updateStoredAppealStatus(selectedAppeal.id, newStatus, adminNotes, user?.id || "admin");

      setSuccess(`✅ Appeal by ${selectedAppeal.userName} has been ${newStatus.toUpperCase()}.`);
      setSelectedAppeal(null);
      setAdminNotes("");
      fetchAppeals();
    } catch {
      updateStoredAppealStatus(selectedAppeal.id, newStatus, adminNotes, user?.id || "admin");
      setSuccess(`✅ Appeal by ${selectedAppeal.userName} has been ${newStatus.toUpperCase()}.`);
      setSelectedAppeal(null);
      setAdminNotes("");
      fetchAppeals();
    } finally {
      setReviewing(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-8 rounded-2xl text-center font-sora">
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-xs text-rose-600 font-medium">
          Only Admins, Lead Trainers, and Trainers have permission to access the Appeals Management portal.
        </p>
      </div>
    );
  }

  const filteredAppeals = appeals.filter((a) => {
    if (typeFilter !== "all" && a.appealType !== typeFilter) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    return true;
  });

  const pendingCount  = appeals.filter((a) => a.status === "pending").length;
  const approvedCount = appeals.filter((a) => a.status === "approved").length;
  const rejectedCount = appeals.filter((a) => a.status === "rejected").length;

  return (
    <div className="font-sora">
      {/* Title */}
      <div className="mb-6">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
          Admin & Trainer Review Panel
        </span>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 mt-2 mb-1">
          Appeals Management Portal
        </h1>
        <p className="text-slate-500 text-xs font-medium">
          Review and process trainee appeals for Exam Results and Week 12 Physical Attendance.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-4 py-3 rounded-xl mb-6 font-semibold">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl mb-6 font-semibold">
          {success}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center shadow-xs">
          <p className="text-2xl font-black text-slate-900">{appeals.length}</p>
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">Total Appeals</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center shadow-xs">
          <p className="text-2xl font-black text-amber-600">{pendingCount}</p>
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">Pending Review</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center shadow-xs">
          <p className="text-2xl font-black text-emerald-600">{approvedCount}</p>
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">Approved</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center shadow-xs">
          <p className="text-2xl font-black text-rose-600">{rejectedCount}</p>
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">Rejected</p>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 mb-6 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        {/* Type Filter Tabs */}
        <div className="flex gap-2">
          {(
            [
              { id: "all", label: "All Appeals" },
              { id: "exam_score", label: "📝 Exam Score" },
              { id: "week12_attendance", label: "🗓️ Week 12 Attendance (1 Day Missed)" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(t.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                typeFilter === t.id
                  ? "bg-emerald-900 text-white shadow-2xs font-extrabold"
                  : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
            Status:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Appeals List / Table */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs font-medium">Loading appeals...</div>
      ) : filteredAppeals.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
          No appeals found matching the selected filters.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredAppeals.map((a) => (
            <div
              key={a.id}
              className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-extrabold text-slate-900 text-base">{a.userName}</span>
                    <span className="text-xs text-slate-400">({a.userEmail})</span>
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full border ${
                        a.appealType === "exam_score"
                          ? "bg-purple-50 text-purple-800 border-purple-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {a.appealType === "exam_score"
                        ? `Exam Score Appeal (${a.score !== undefined ? a.score + "%" : "Score"})`
                        : `Week 12 Attendance Appeal (${a.daysAttended}/5 Days Attended)`}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 font-medium">
                    Submitted: {new Date(a.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Status Badge & Action */}
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full border ${
                      a.status === "approved"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : a.status === "rejected"
                        ? "bg-rose-50 text-rose-800 border-rose-200"
                        : "bg-amber-50 text-amber-800 border-amber-200 animate-pulse"
                    }`}
                  >
                    {a.status.toUpperCase()}
                  </span>

                  <button
                    onClick={() => {
                      setSelectedAppeal(a);
                      setAdminNotes(a.adminNotes || "");
                    }}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition shadow-2xs cursor-pointer"
                  >
                    Review Appeal →
                  </button>
                </div>
              </div>

              {/* Ground Reason Text Box */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">
                  Trainee Ground Reasons:
                </p>
                <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60 whitespace-pre-wrap">
                  "{a.reason}"
                </p>
              </div>

              {/* Admin Feedback Notes */}
              {a.adminNotes && (
                <div className="mt-3 pt-2">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 mb-0.5">
                    Admin Feedback Note:
                  </p>
                  <p className="text-xs text-emerald-900 font-semibold italic">"{a.adminNotes}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedAppeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative font-sora">
            <button
              onClick={() => setSelectedAppeal(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-sm font-bold"
            >
              ✕
            </button>

            <h2 className="text-xl font-black text-slate-900 mb-1">Review Trainee Appeal</h2>
            <p className="text-xs text-slate-500 mb-4 font-medium">
              Applicant: <strong className="text-slate-800">{selectedAppeal.userName}</strong> ({selectedAppeal.userEmail})
            </p>

            {/* Appeal Context Details */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 text-xs space-y-2">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Type:</span>{" "}
                <span className="font-bold text-slate-800">
                  {selectedAppeal.appealType === "exam_score"
                    ? `Exam Score Appeal (${selectedAppeal.score ?? "N/A"}%)`
                    : `Week 12 Attendance Appeal (${selectedAppeal.daysAttended}/5 Days Attended)`}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px]">Ground Reasons:</span>
                <p className="text-slate-800 font-medium italic mt-1 bg-white p-2.5 rounded-xl border border-slate-200">
                  "{selectedAppeal.reason}"
                </p>
              </div>
            </div>

            {/* Admin Notes Input */}
            <div className="mb-6">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                Admin Feedback Note (Included in notification)
              </label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="e.g. Approved: Granted retake permission / Attendance exception granted due to medical excuse."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium transition"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleUpdateStatus("rejected")}
                disabled={reviewing}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                Reject Appeal
              </button>
              <button
                onClick={() => handleUpdateStatus("approved")}
                disabled={reviewing}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                Approve Appeal ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
