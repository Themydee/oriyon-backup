"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { LifeBuoy, Search, Filter, CheckCircle2, Clock, AlertTriangle, ShieldAlert, Edit, Save, RefreshCw, MessageSquare, ChevronRight } from "lucide-react";

interface TrainerTicket {
  id: string;
  ticketCode: string;
  traineeName: string;
  traineeEmail: string;
  traineePhone: string;
  cohortOrLga: string;
  trainerName: string;
  incidentDate: string;
  category: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  description: string;
  status: "Open" | "In Review" | "Resolved" | "Escalated";
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

function AdminTrainerTicketsContent() {
  const [tickets, setTickets] = useState<TrainerTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Edit ticket modal state
  const [selectedTicket, setSelectedTicket] = useState<TrainerTicket | null>(null);
  const [editStatus, setEditStatus] = useState<"Open" | "In Review" | "Resolved" | "Escalated">("In Review");
  const [editAdminResponse, setEditAdminResponse] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");

  const fetchTickets = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/trainer-tickets");
      if (!res.ok) throw new Error("Failed to load trainer tickets.");
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleOpenEdit = (ticket: TrainerTicket) => {
    setSelectedTicket(ticket);
    setEditStatus(ticket.status);
    setEditAdminResponse(ticket.adminResponse || "");
    setSaveSuccess("");
  };

  const handleSaveResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setSaving(true);
    setSaveSuccess("");

    try {
      const res = await fetch("/api/trainer-tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          ticketCode: selectedTicket.ticketCode,
          status: editStatus,
          adminResponse: editAdminResponse,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update ticket.");

      setSaveSuccess("Ticket resolution updated successfully!");
      fetchTickets();
      setTimeout(() => setSelectedTicket(null), 1200);
    } catch (err: any) {
      setError(err.message || "Failed to update ticket.");
    } finally {
      setSaving(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = statusFilter === "All" || t.status === statusFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      t.ticketCode.toLowerCase().includes(query) ||
      t.trainerName.toLowerCase().includes(query) ||
      t.traineeName.toLowerCase().includes(query) ||
      t.traineeEmail.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-bold text-[11px] rounded-full uppercase">Open</span>;
      case "In Review":
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-900 font-bold text-[11px] rounded-full uppercase">In Review</span>;
      case "Resolved":
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 font-bold text-[11px] rounded-full uppercase">Resolved ✅</span>;
      case "Escalated":
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-900 font-bold text-[11px] rounded-full uppercase">Escalated ⚠️</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-100 text-gray-800 font-bold text-[11px] rounded-full uppercase">{status}</span>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "Critical":
        return <span className="px-2 py-0.5 bg-red-100 text-red-800 font-extrabold text-[10px] rounded uppercase">Critical</span>;
      case "High":
        return <span className="px-2 py-0.5 bg-orange-100 text-orange-800 font-extrabold text-[10px] rounded uppercase">High</span>;
      case "Medium":
        return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 font-semibold text-[10px] rounded uppercase">Medium</span>;
      default:
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-700 font-semibold text-[10px] rounded uppercase">Low</span>;
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto font-sans text-slate-900 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
            <LifeBuoy size={16} /> EEWYLA Administration
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Trainer Issues & Grievance Tickets
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Monitor, investigate, and resolve trainer performance and conduct reports from trainees across all cohorts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTickets}
            className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition shadow-2xs flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <Link
            href="/trainer-issues"
            target="_blank"
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-2xs flex items-center gap-1.5"
          >
            <span>View Trainee Portal</span> <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-bold block mb-1">Total Tickets</span>
          <span className="text-2xl font-black text-slate-900">{tickets.length}</span>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-xs text-amber-800 font-bold block mb-1">Open Tickets</span>
          <span className="text-2xl font-black text-amber-950">
            {tickets.filter((t) => t.status === "Open").length}
          </span>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-xs text-blue-800 font-bold block mb-1">In Review</span>
          <span className="text-2xl font-black text-blue-950">
            {tickets.filter((t) => t.status === "In Review").length}
          </span>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-2xs">
          <span className="text-xs text-emerald-800 font-bold block mb-1">Resolved</span>
          <span className="text-2xl font-black text-emerald-950">
            {tickets.filter((t) => t.status === "Resolved").length}
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code, trainer, trainee..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-800 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={14} className="text-slate-400 shrink-0" />
          <span className="text-xs text-slate-500 font-bold shrink-0">Status Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Review">In Review</option>
            <option value="Resolved">Resolved</option>
            <option value="Escalated">Escalated</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Ticket Code</th>
                <th className="px-4 py-3.5">Assigned Trainer</th>
                <th className="px-4 py-3.5">Category & Severity</th>
                <th className="px-4 py-3.5">Trainee / Center</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Loading trainer tickets...
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No trainer tickets found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-4 font-mono font-bold text-slate-900">
                      {t.ticketCode}
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-bold text-slate-900 block">{t.trainerName}</span>
                      <span className="text-[11px] text-slate-500">Incident: {t.incidentDate}</span>
                    </td>
                    <td className="px-4 py-4 space-y-1">
                      <div className="font-semibold text-slate-900">{t.category}</div>
                      <div>{getSeverityBadge(t.severity)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-slate-900 block">{t.traineeName}</span>
                      <span className="text-[11px] text-slate-500 block">{t.cohortOrLga}</span>
                      <span className="text-[10px] text-emerald-700">{t.traineeEmail}</span>
                    </td>
                    <td className="px-4 py-4">{getStatusBadge(t.status)}</td>
                    <td className="px-4 py-4 text-slate-500 text-[11px]">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(t)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit size={12} /> Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RESOLUTION MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">
                  Manage Resolution
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedTicket.ticketCode} — {selectedTicket.trainerName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Reported By:</span>
                <span className="font-semibold text-slate-900">{selectedTicket.traineeName} ({selectedTicket.traineePhone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Training Site:</span>
                <span className="font-semibold text-slate-900">{selectedTicket.cohortOrLga}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block mb-1">Issue Description:</span>
                <p className="text-slate-800 bg-white p-3 rounded-lg border border-slate-200 text-xs leading-relaxed">
                  {selectedTicket.description}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveResolution} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Update Ticket Status *
                </label>
                <select
                  value={editStatus}
                  onChange={(e: any) => setEditStatus(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="Open">Open</option>
                  <option value="In Review">In Review</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Escalated">Escalated</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Program Coordinator Resolution / Response Note *
                </label>
                <textarea
                  required
                  rows={4}
                  value={editAdminResponse}
                  onChange={(e) => setEditAdminResponse(e.target.value)}
                  placeholder="Record investigative actions, feedback to trainee, or resolution outcome..."
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {saveSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} /> {saveSuccess}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="flex-1 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Resolution →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminTrainerTicketsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500 text-sm">Loading admin dashboard...</div>}>
      <AdminTrainerTicketsContent />
    </Suspense>
  );
}
