"use client";

import { useEffect, useState, useMemo } from "react";
import { authFetch } from "@/lib/api";
import { popup } from "@/components/layout/PopupProvider";

interface UserRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
}

interface LogEntry {
  id: string;
  email: string;
  type: string;
  status: "success" | "failed";
  message: string;
  time: string;
}

export default function AdminResendLinkPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [customEmailInput, setCustomEmailInput] = useState("");
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; currentEmail: string } | null>(null);

  // Email Log History
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const results = await Promise.allSettled([
        authFetch("/cooperative/members?limit=100").then((r) => (r.ok ? r.json() : null)),
        authFetch("/applications?limit=100").then((r) => (r.ok ? r.json() : null)),
        authFetch("/users?limit=100").then((r) => (r.ok ? r.json() : null)),
      ]);

      const mergedMap = new Map<string, UserRecord>();

      // 1. Cooperative Members
      if (results[0].status === "fulfilled" && results[0].value) {
        const coopData = Array.isArray(results[0].value)
          ? results[0].value
          : results[0].value.members || results[0].value.data || [];
        coopData.forEach((m: any) => {
          if (m.email) {
            const key = m.email.toLowerCase().trim();
            const isActive = Boolean(m.isActive ?? m.is_active ?? m.hasPassword ?? false);
            mergedMap.set(key, {
              id: m.id || key,
              firstName: m.firstName || m.first_name || "Cooperative",
              lastName: m.lastName || m.last_name || "Member",
              email: key,
              phone: m.phone,
              role: "cooperative_member",
              isActive,
              createdAt: m.joinedAt || m.created_at,
            });
          }
        });
      }

      // 2. Applications (Only APPROVED applications have been issued setup links)
      if (results[1].status === "fulfilled" && results[1].value) {
        const appData = Array.isArray(results[1].value)
          ? results[1].value
          : results[1].value.applications || results[1].value.data || [];
        appData.forEach((a: any) => {
          if (a.email) {
            // Pending setup is strictly for APPROVED applicants who have been sent setup links
            if (a.status !== "approved") return;

            const key = a.email.toLowerCase().trim();
            if (!mergedMap.has(key)) {
              mergedMap.set(key, {
                id: a.id || key,
                firstName: a.firstName || a.first_name || "Applicant",
                lastName: a.lastName || a.last_name || "",
                email: key,
                phone: a.phone,
                role: a.approvedRole || "applicant",
                isActive: false, // Approved but pending initial password setup
                createdAt: a.createdAt || a.submitted_at,
              });
            }
          }
        });
      }

      // 3. Registered Users (Primary source for password/activation status)
      if (results[2].status === "fulfilled" && results[2].value) {
        const userData = Array.isArray(results[2].value)
          ? results[2].value
          : results[2].value.users || results[2].value.data || results[2].value.items || [];
        userData.forEach((u: any) => {
          if (u.email) {
            const key = u.email.toLowerCase().trim();
            const existing = mergedMap.get(key);
            // Check if user has activated account or set password
            const isUserActive = Boolean(u.isActive ?? u.is_active ?? u.hasPassword ?? (u.passwordHash ? true : false));

            mergedMap.set(key, {
              id: u.id || existing?.id || key,
              firstName: u.firstName || u.first_name || existing?.firstName || "User",
              lastName: u.lastName || u.last_name || existing?.lastName || "",
              email: key,
              phone: u.phone || existing?.phone,
              role: u.role || existing?.role || "user",
              isActive: isUserActive,
              createdAt: u.createdAt || existing?.createdAt,
            });
          }
        });
      }

      setUsers(Array.from(mergedMap.values()));
    } catch (err) {
      console.error("Failed to load users registry:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Derived counts
  const pendingUsers = useMemo(() => users.filter((u) => !u.isActive), [users]);
  const completedUsers = useMemo(() => users.filter((u) => u.isActive), [users]);

  // Roles list
  const availableRoles = useMemo(() => {
    const rolesSet = new Set<string>();
    users.forEach((u) => {
      if (u.role) rolesSet.add(u.role);
    });
    return Array.from(rolesSet);
  }, [users]);

  // Filtering
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Status filter
      if (statusFilter === "pending" && u.isActive) return false;
      if (statusFilter === "completed" && !u.isActive) return false;

      // Role filter
      if (roleFilter !== "all" && u.role !== roleFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
        const matchesName = fullName.includes(q);
        const matchesEmail = u.email && u.email.toLowerCase().includes(q);
        const matchesPhone = u.phone && u.phone.includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone) return false;
      }

      return true;
    });
  }, [users, statusFilter, roleFilter, searchQuery]);

  const toggleSelectEmail = (email: string) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const selectAllFiltered = () => {
    const emails = filteredUsers.map((u) => u.email).filter(Boolean);
    setSelectedEmails(emails);
  };

  const selectAllPending = () => {
    setStatusFilter("pending");
    const emails = pendingUsers.map((u) => u.email).filter(Boolean);
    setSelectedEmails(emails);
  };

  const clearSelection = () => {
    setSelectedEmails([]);
  };

  const addCustomEmail = () => {
    const email = customEmailInput.toLowerCase().trim();
    if (!email || !email.includes("@")) {
      popup.alert("Please enter a valid email address.");
      return;
    }
    if (!selectedEmails.includes(email)) {
      setSelectedEmails((prev) => [...prev, email]);
    }
    setCustomEmailInput("");
  };

  // Send Direct Setup Token via native /auth/resend-setup endpoint
  const sendSetupLinkToEmail = async (targetEmail: string) => {
    try {
      const res = await authFetch("/auth/resend-setup", {
        method: "POST",
        body: JSON.stringify({ email: targetEmail }),
      });
      let data: any = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (res.ok) {
        addLog(targetEmail, "Account Setup Link", "success", data.message || "Setup email sent successfully!");
        return true;
      } else {
        addLog(targetEmail, "Account Setup Link", "failed", data.error || data.message || "Failed to send setup email");
        return false;
      }
    } catch {
      addLog(targetEmail, "Account Setup Link", "failed", "Connection error");
      return false;
    }
  };

  const handleSendSingle = async (email: string, name: string) => {
    setSending(true);
    setProgress({ current: 1, total: 1, currentEmail: email });
    const success = await sendSetupLinkToEmail(email);
    setSending(false);
    setProgress(null);
    if (success) {
      await popup.alert(`✓ Account setup link sent successfully to ${name} (${email})!`);
    } else {
      await popup.alert(`Failed to send setup link to ${email}. Please check backend logs.`);
    }
  };

  const handleSendBulk = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let recipients = [...selectedEmails];
    if (recipients.length === 0 && customEmailInput.trim().includes("@")) {
      recipients = [customEmailInput.trim().toLowerCase()];
    }

    if (recipients.length === 0) {
      await popup.alert("Please select at least one user or type a recipient email.");
      return;
    }

    const confirmed = await popup.confirm(
      `Are you sure you want to send account setup email links to ${recipients.length} user(s)?`
    );
    if (!confirmed) return;

    setSending(true);
    let successCount = 0;

    for (let i = 0; i < recipients.length; i++) {
      const email = recipients[i];
      setProgress({ current: i + 1, total: recipients.length, currentEmail: email });
      const ok = await sendSetupLinkToEmail(email);
      if (ok) successCount++;
    }

    setSending(false);
    setProgress(null);
    setSelectedEmails([]);
    setCustomEmailInput("");

    await popup.alert(
      `✓ Account setup links dispatched to ${successCount} of ${recipients.length} recipient(s)!`
    );
  };

  // Dedicated action to send emails to all users who haven't set up accounts
  const handleSendAllPending = async () => {
    const pendingEmails = pendingUsers.map((u) => u.email).filter(Boolean);
    if (pendingEmails.length === 0) {
      await popup.alert("No pending setup users found!");
      return;
    }

    const confirmed = await popup.confirm(
      `🚨 BULK RESEND ACTION\n\nThis will send first-time account setup links to ALL ${pendingEmails.length} user(s) who haven't set up their accounts yet.\n\nDo you wish to proceed?`
    );
    if (!confirmed) return;

    setSending(true);
    let successCount = 0;

    for (let i = 0; i < pendingEmails.length; i++) {
      const email = pendingEmails[i];
      setProgress({ current: i + 1, total: pendingEmails.length, currentEmail: email });
      const ok = await sendSetupLinkToEmail(email);
      if (ok) successCount++;
    }

    setSending(false);
    setProgress(null);
    setSelectedEmails([]);

    await popup.alert(
      `🎉 Bulk dispatch complete!\n\nSuccessfully sent setup links to ${successCount} of ${pendingEmails.length} pending account user(s).`
    );
  };

  const addLog = (email: string, type: string, status: "success" | "failed", message: string) => {
    setLogs((prev) => [
      {
        id: Math.random().toString(),
        email,
        type,
        status,
        message,
        time: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="font-sans max-w-7xl mx-auto space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">🔑</span>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Resend Account Setup Links
            </h1>
          </div>
          <p className="text-slate-400 text-sm">
            Bulk dispatch setup & password invitation links to users who haven't configured their accounts yet.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-full font-bold">
            ● Setup Email Service Active
          </span>
        </div>
      </div>

      {/* Feature Banner: Dedicated Bulk Email to Pending Setup Accounts */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-emerald-950/30 border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
                ⚡ Bulk Action Section
              </span>
              <span className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                {pendingUsers.length} Unset Account(s) Found
              </span>
            </div>
            <h2 className="text-xl font-black text-white">
              Send Resend Links to Pending Accounts
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Target all users, applicants, or cooperative members who haven't set up their password yet.
              Each recipient receives an email with a secure, 7-day single-use link to activate their portal account.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
            <button
              onClick={selectAllPending}
              disabled={sending || pendingUsers.length === 0}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 px-4 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
            >
              <span>📋</span>
              <span>Select All Unset ({pendingUsers.length})</span>
            </button>

            <button
              onClick={handleSendAllPending}
              disabled={sending || pendingUsers.length === 0}
              className="bg-gradient-to-r from-amber-600 via-orange-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white font-black text-xs px-5 py-3.5 rounded-xl transition shadow-lg shadow-amber-950/50 disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <span className="animate-spin">🌀</span>
                  <span>Dispatching Emails...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Resend Setup to ALL ({pendingUsers.length}) Pending Users</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Progress Bar during Bulk Dispatch */}
        {progress && (
          <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-amber-400 flex items-center gap-2">
                <span className="animate-spin text-sm">🌀</span>
                <span>Sending setup email to: <code className="text-white font-mono">{progress.currentEmail}</code></span>
              </span>
              <span className="text-slate-300 font-mono">
                {progress.current} / {progress.total} ({Math.round((progress.current / progress.total) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: User Selection Table & Email Dispatcher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Users Registry Selector */}
        <div className="lg:col-span-7 bg-[#020617] border border-slate-850 rounded-2xl p-5 shadow-xl space-y-4">
          {/* Header & Filter Controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-base font-bold text-white">Select Users</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedEmails.length} user(s) currently selected for link resend
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={selectAllFiltered}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg transition"
                >
                  Select Filtered ({filteredUsers.length})
                </button>
                {selectedEmails.length > 0 && (
                  <button
                    onClick={clearSelection}
                    className="text-xs text-slate-400 hover:text-white font-medium bg-slate-800 px-3 py-1.5 rounded-lg transition"
                  >
                    Clear ({selectedEmails.length})
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs: Status & Role Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
              {/* Account Setup Status Tabs */}
              <div className="flex items-center gap-1 bg-[#080c15] p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    statusFilter === "all"
                      ? "bg-slate-700 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  All ({users.length})
                </button>
                <button
                  onClick={() => setStatusFilter("pending")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                    statusFilter === "pending"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                      : "text-amber-400/80 hover:text-amber-300"
                  }`}
                >
                  <span>⏳ Pending Setup</span>
                  <span className="bg-amber-500/30 text-amber-200 text-[10px] px-1.5 py-0.2 rounded-full">
                    {pendingUsers.length}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter("completed")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                    statusFilter === "completed"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                      : "text-emerald-400/80 hover:text-emerald-300"
                  }`}
                >
                  <span>✓ Completed</span>
                  <span className="bg-emerald-500/30 text-emerald-200 text-[10px] px-1.5 py-0.2 rounded-full">
                    {completedUsers.length}
                  </span>
                </button>
              </div>

              {/* Role Dropdown Filter */}
              {availableRoles.length > 0 && (
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-[#080c15] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition"
                >
                  <option value="all">All Roles</option>
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role.replace("_", " ").toUpperCase()}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Search bar */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by user name, email, or phone number..."
            className="w-full bg-[#080c15] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />

          {/* Custom Email Direct Add Input */}
          <div className="flex gap-2 items-center">
            <input
              type="email"
              value={customEmailInput}
              onChange={(e) => setCustomEmailInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomEmail();
                }
              }}
              placeholder="Or type any custom recipient email address..."
              className="flex-1 bg-[#080c15] border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-mono"
            />
            <button
              type="button"
              onClick={addCustomEmail}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow-md cursor-pointer whitespace-nowrap"
            >
              + Add Email
            </button>
          </div>

          {/* Users List Table */}
          {loadingUsers ? (
            <div className="py-12 text-center text-slate-500 text-xs font-semibold">
              Loading users registry...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No matching users found for this filter criteria.
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto border border-slate-800/80 rounded-xl">
              <table className="w-full text-left text-xs text-slate-400">
                <thead className="bg-[#080c15] text-[10px] uppercase font-bold text-slate-400 sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="p-3 w-10 text-center">Select</th>
                    <th className="p-3">User Name</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 bg-[#020617]">
                  {filteredUsers.map((u) => {
                    const isSelected = selectedEmails.includes(u.email);
                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-slate-900/40 transition ${
                          isSelected ? "bg-emerald-950/20" : ""
                        }`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectEmail(u.email)}
                            className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-white">
                              {u.firstName} {u.lastName}
                            </span>
                            <span
                              className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md border ${
                                u.isActive
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              }`}
                            >
                              {u.isActive ? "✓ Setup Complete" : "⏳ Pending Setup"}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 font-mono text-slate-300">{u.email}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleSendSingle(u.email, `${u.firstName} ${u.lastName}`)}
                            disabled={sending}
                            className="text-[11px] bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-lg font-bold transition disabled:opacity-50 cursor-pointer whitespace-nowrap"
                            title="Resend account setup link email directly"
                          >
                            🔑 Send Link
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Dispatcher Summary Form */}
        <div className="lg:col-span-5 bg-[#020617] border border-slate-850 rounded-2xl p-5 shadow-xl space-y-4">
          <div>
            <h2 className="text-base font-bold text-white">Send Setup Links</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Triggers password & account setup email links to selected recipients.
            </p>
          </div>

          <form onSubmit={handleSendBulk} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Selected Recipients ({selectedEmails.length})
              </label>
              {selectedEmails.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2.5 bg-[#080c15] border border-slate-700 rounded-xl text-xs">
                  {selectedEmails.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md font-mono text-[11px]"
                    >
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => toggleSelectEmail(email)}
                        className="hover:text-red-400 cursor-pointer ml-1 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-[#080c15] border border-slate-800 rounded-xl text-xs text-slate-500">
                  Select users from the table on the left or click "Select All Unset" above.
                </div>
              )}
            </div>

            <div className="bg-[#080c15] border border-slate-800 rounded-xl p-4 text-xs text-slate-400 space-y-2">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <span>🔑</span>
                <span>What happens when you click send:</span>
              </div>
              <p>
                The system calls the native setup endpoint (<code>/auth/resend-setup</code>) which generates a secure, 7-day password setup link and emails it directly to the recipient’s inbox.
              </p>
            </div>

            <button
              type="submit"
              disabled={sending || (selectedEmails.length === 0 && !customEmailInput.trim().includes("@"))}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-emerald-950/40 disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <span className="animate-spin">🌀</span>
                  <span>Sending Setup Links...</span>
                </>
              ) : (
                <>
                  <span>🔑</span>
                  <span>Send Setup Link to {selectedEmails.length || 1} User(s)</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Email Dispatch History Log */}
      {logs.length > 0 && (
        <div className="bg-[#020617] border border-slate-850 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Recent Setup Email Dispatch Logs ({logs.length})</h2>
            <button
              onClick={clearLogs}
              className="text-xs text-slate-400 hover:text-white bg-slate-800 px-3 py-1 rounded-lg transition"
            >
              Clear Logs
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-400">
              <thead className="bg-[#080c15] text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">Recipient Email</th>
                  <th className="p-3">Email Type</th>
                  <th className="p-3">Response Message</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="p-3 font-mono text-slate-500">{log.time}</td>
                    <td className="p-3 font-mono text-white">{log.email}</td>
                    <td className="p-3 text-slate-300 font-semibold">{log.type}</td>
                    <td className="p-3 text-slate-400">{log.message}</td>
                    <td className="p-3 text-right font-bold">
                      {log.status === "success" ? (
                        <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px]">
                          SENT ✓
                        </span>
                      ) : (
                        <span className="text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full text-[10px]">
                          FAILED ✕
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

