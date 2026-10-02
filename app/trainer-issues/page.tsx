"use client";

import React, { useState, FormEvent } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, ShieldAlert, LifeBuoy, Search, FileText, User, Calendar, MessageSquare, Clock, ArrowRight, Tag } from "lucide-react";

interface Ticket {
  id: string;
  ticketCode: string;
  traineeName: string;
  traineeEmail: string;
  traineePhone: string;
  cohortOrLga: string;
  trainerName: string;
  incidentDate: string;
  category: string;
  severity: string;
  description: string;
  status: "Open" | "In Review" | "Resolved" | "Escalated";
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export default function TrainerIssuesPage() {
  const [activeTab, setActiveTab] = useState<"submit" | "track">("submit");

  // Submit form state
  const [traineeName, setTraineeName] = useState("");
  const [traineeEmail, setTraineeEmail] = useState("");
  const [traineePhone, setTraineePhone] = useState("");
  const [cohortOrLga, setCohortOrLga] = useState("");
  const [trainerName, setTrainerName] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("Medium");
  const [description, setDescription] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Submission result state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [createdTicketCode, setCreatedTicketCode] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Track ticket state
  const [searchCode, setSearchCode] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackedTicket, setTrackedTicket] = useState<Ticket | null>(null);
  const [trackError, setTrackError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!agreedToTerms) {
      setSubmitError("Please confirm that the information provided is honest and accurate.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/trainer-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          traineeName,
          traineeEmail,
          traineePhone,
          cohortOrLga,
          trainerName,
          incidentDate,
          category,
          severity,
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit trainer issue ticket.");
      }

      setCreatedTicketCode(data.ticketCode);
      setSubmitSuccess(true);

      // Reset form
      setTraineeName("");
      setTraineeEmail("");
      setTraineePhone("");
      setCohortOrLga("");
      setTrainerName("");
      setIncidentDate("");
      setCategory("");
      setSeverity("Medium");
      setDescription("");
      setAgreedToTerms(false);
    } catch (err: any) {
      setSubmitError(err.message || "An error occurred while submitting your ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrackTicket = async (e: FormEvent) => {
    e.preventDefault();
    setTrackError("");
    setTrackedTicket(null);

    if (!searchCode.trim()) {
      setTrackError("Please enter a valid Ticket Tracking Code (e.g. TRN-2026-4819).");
      return;
    }

    setTrackingLoading(true);

    try {
      const response = await fetch(`/api/trainer-tickets?code=${encodeURIComponent(searchCode.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch ticket.");
      }

      const ticketsList: Ticket[] = data.tickets || [];
      if (ticketsList.length === 0) {
        setTrackError("No ticket found with that tracking code. Please verify the code and try again.");
      } else {
        setTrackedTicket(ticketsList[0]);
      }
    } catch (err: any) {
      setTrackError(err.message || "Unable to retrieve ticket status.");
    } finally {
      setTrackingLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
        return <span className="px-3 py-1 bg-amber-100 text-amber-900 font-bold text-xs rounded-full uppercase tracking-wider">Open</span>;
      case "In Review":
        return <span className="px-3 py-1 bg-blue-100 text-blue-900 font-bold text-xs rounded-full uppercase tracking-wider">In Review</span>;
      case "Resolved":
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-900 font-bold text-xs rounded-full uppercase tracking-wider">Resolved ✅</span>;
      case "Escalated":
        return <span className="px-3 py-1 bg-rose-100 text-rose-900 font-bold text-xs rounded-full uppercase tracking-wider">Escalated ⚠️</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 font-bold text-xs rounded-full uppercase tracking-wider">{status}</span>;
    }
  };

  return (
    <div className="bg-[#f9f6f0] min-h-screen font-sans text-gray-900">
      {/* Header */}
      <div className="bg-[#061e1a] text-white pt-28 pb-16 px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <span className="text-[#00D1C1] text-xs font-bold tracking-widest uppercase mb-3 inline-block">
            EEWYLA Programme Quality & Ethics Portal
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">
            Trainer Issue & Resolution System
          </h1>
          <p className="text-gray-300 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
            Report any concerns, conduct issues, scheduling conflicts, or training delivery gaps regarding assigned EEWYLA trainers. Every report receives a confidential Ticket ID and is reviewed by program management.
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        
        {/* Navigation Tabs */}
        <div className="flex rounded-2xl bg-white border border-gray-200 p-1.5 shadow-sm mb-8">
          <button
            onClick={() => {
              setActiveTab("submit");
              setSubmitSuccess(false);
            }}
            className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "submit"
                ? "bg-[#061e1a] text-[#00D1C1] shadow"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <LifeBuoy size={16} /> Report Trainer Issue
          </button>

          <button
            onClick={() => setActiveTab("track")}
            className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "track"
                ? "bg-[#061e1a] text-[#00D1C1] shadow"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Search size={16} /> Track Ticket Status
          </button>
        </div>

        {/* TAB 1: SUBMIT TRAINER ISSUE */}
        {activeTab === "submit" && (
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
            {submitSuccess ? (
              <div className="text-center py-8 space-y-6">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={36} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-emerald-950">Trainer Issue Ticket Logged!</h3>
                  <p className="text-gray-600 text-sm max-w-md mx-auto">
                    Your issue report has been successfully assigned to the EEWYLA Program Management team. Keep your ticket code safe to track resolution progress.
                  </p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 max-w-sm mx-auto space-y-2">
                  <span className="text-xs text-emerald-800 uppercase tracking-widest font-semibold">
                    Ticket Tracking Reference
                  </span>
                  <strong className="text-2xl font-mono text-emerald-950 block select-all">
                    {createdTicketCode}
                  </strong>
                  <p className="text-[11px] text-emerald-700 pt-2 border-t border-emerald-200">
                    Use this code under the "Track Ticket Status" tab at any time to see admin comments.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                  <button
                    onClick={() => setSubmitSuccess(false)}
                    className="px-6 py-3 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                  >
                    Submit Another Report
                  </button>
                  <button
                    onClick={() => {
                      setSearchCode(createdTicketCode);
                      setActiveTab("track");
                    }}
                    className="px-6 py-3 bg-[#061e1a] text-[#00D1C1] rounded-xl text-xs font-bold transition shadow cursor-pointer"
                  >
                    Track Status Now →
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="border-b border-gray-100 pb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <ShieldAlert className="text-amber-600" size={22} /> Trainer Issue Submission Form
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Please provide full details so program coordinators can investigate and take swift action.
                  </p>
                </div>

                {submitError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-4 rounded-xl flex items-start gap-2">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Trainee Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Your Full Name *
                    </label>
                    <input
                      required
                      type="text"
                      value={traineeName}
                      onChange={(e) => setTraineeName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00D1C1] text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Your Email Address *
                    </label>
                    <input
                      required
                      type="email"
                      value={traineeEmail}
                      onChange={(e) => setTraineeEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00D1C1] text-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      required
                      type="tel"
                      value={traineePhone}
                      onChange={(e) => setTraineePhone(e.target.value)}
                      placeholder="e.g. 08012345678"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00D1C1] text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Training Site / Cohort LGA *
                    </label>
                    <input
                      required
                      type="text"
                      value={cohortOrLga}
                      onChange={(e) => setCohortOrLga(e.target.value)}
                      placeholder="e.g. Oyo Town Center / Oyo Central"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00D1C1] text-gray-900"
                    />
                  </div>
                </div>

                {/* Trainer & Incident Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Name of Assigned Trainer *
                    </label>
                    <input
                      required
                      type="text"
                      value={trainerName}
                      onChange={(e) => setTrainerName(e.target.value)}
                      placeholder="Trainer's name"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00D1C1] text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Date of Incident *
                    </label>
                    <input
                      required
                      type="date"
                      value={incidentDate}
                      onChange={(e) => setIncidentDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00D1C1] text-gray-900 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Nature / Category of Issue *
                    </label>
                    <select
                      required
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00D1C1] bg-white text-gray-900"
                    >
                      <option value="">Select Category</option>
                      <option value="Trainer Absenteeism">Trainer Absenteeism / Late Arrival</option>
                      <option value="Unprofessional Conduct">Unprofessional Conduct or Behavior</option>
                      <option value="Course Content / Explanation Issue">Course Content / Inadequate Explanation</option>
                      <option value="Assessment & Grading Concern">Assessment / Test Grading Dispute</option>
                      <option value="Facility / Practical Session Issue">Practical Demonstration / Equipment Issue</option>
                      <option value="Other Trainer Concern">Other Trainer Concern</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Urgency / Severity Level *
                    </label>
                    <select
                      required
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00D1C1] bg-white text-gray-900"
                    >
                      <option value="Low">Low — Minor inquiry or feedback</option>
                      <option value="Medium">Medium — Moderately affects session learning</option>
                      <option value="High">High — Serious impact on training schedule</option>
                      <option value="Critical">Critical — Immediate intervention needed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Detailed Description of the Issue *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Clearly explain what happened, including specific session dates, topic covered, and what outcome you are requesting."
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00D1C1] text-gray-900"
                  />
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1 accent-amber-700"
                    />
                    <span className="text-xs text-amber-900 leading-relaxed">
                      I confirm that the details provided in this ticket are true, accurate, and submitted in good faith to assist in maintaining EEWYLA training quality.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !agreedToTerms}
                  className="w-full bg-[#061e1a] hover:bg-[#092b25] text-[#00D1C1] rounded-xl py-4 font-bold text-sm transition shadow disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? "Submitting Ticket..." : "Submit Trainer Issue Ticket →"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: TRACK TICKET STATUS */}
        {activeTab === "track" && (
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Search className="text-[#00D1C1]" size={22} /> Track Your Ticket Status
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Enter your Ticket Tracking Reference Code (e.g., TRN-2026-4819) to view investigation updates.
              </p>
            </div>

            <form onSubmit={handleTrackTicket} className="flex gap-3">
              <input
                required
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Enter Ticket Code (e.g. TRN-2026-4819)"
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00D1C1] font-mono font-bold text-gray-900 uppercase"
              />
              <button
                type="submit"
                disabled={trackingLoading}
                className="px-6 py-3 bg-[#061e1a] text-[#00D1C1] rounded-xl text-xs font-bold hover:bg-[#092b25] transition cursor-pointer shadow disabled:opacity-60"
              >
                {trackingLoading ? "Searching..." : "Track →"}
              </button>
            </form>

            {trackError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-4 rounded-xl flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{trackError}</span>
              </div>
            )}

            {trackedTicket && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-5 mt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
                  <div>
                    <span className="text-xs text-gray-500 font-medium block">Ticket Reference</span>
                    <h3 className="text-xl font-mono font-bold text-gray-900">{trackedTicket.ticketCode}</h3>
                  </div>
                  <div>{getStatusBadge(trackedTicket.status)}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500 font-bold block mb-0.5">Assigned Trainer</span>
                    <p className="text-gray-900 font-semibold">{trackedTicket.trainerName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 font-bold block mb-0.5">Category</span>
                    <p className="text-gray-900 font-semibold">{trackedTicket.category}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 font-bold block mb-0.5">Training Center / LGA</span>
                    <p className="text-gray-900 font-semibold">{trackedTicket.cohortOrLga}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 font-bold block mb-0.5">Reported On</span>
                    <p className="text-gray-900 font-semibold">{new Date(trackedTicket.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 text-xs">
                  <span className="text-gray-500 font-bold block mb-1">Issue Description:</span>
                  <p className="text-gray-800 leading-relaxed">{trackedTicket.description}</p>
                </div>

                {/* Admin Resolution Section */}
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-5 space-y-2">
                  <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-emerald-700" /> Program Coordinator Resolution Note:
                  </span>
                  {trackedTicket.adminResponse ? (
                    <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                      {trackedTicket.adminResponse}
                    </p>
                  ) : (
                    <p className="text-xs text-emerald-700 italic">
                      Your ticket is currently under review by program management. Update notes will appear here once investigation completes.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
