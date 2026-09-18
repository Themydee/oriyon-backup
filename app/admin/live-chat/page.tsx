"use client";

import { useEffect, useRef, useState } from "react";
import {
  MessageSquare,
  Search,
  Send,
  User,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  Filter,
  Sparkles,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { ChatThread, ChatMessage } from "@/store/chatStore";

const QUICK_REPLIES = [
  {
    title: "EEWYLA Application",
    text: "Hello! You can apply for the EEWYLA training program directly by visiting https://oriyoninternational.com/apply and submitting your details.",
  },
  {
    title: "LMS Portal Login",
    text: "You can log into your LMS account at https://oriyoninternational.com/learn/lms using the email address and password created during onboarding.",
  },
  {
    title: "Training Schedule",
    text: "EEWYLA training consists of weekly online modules combined with practical livestock farm sessions. You can view your session calendar inside your LMS portal dashboard.",
  },
  {
    title: "Official Contact",
    text: "If you require formal assistance, you can also email our support team directly at eewyla@oriyoninternational.com.",
  },
];

export default function AdminLiveChatPage() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [replyText, setReplyText] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "in_progress" | "resolved">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch threads on mount and set interval for polling
  useEffect(() => {
    fetchThreads();
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchThreads();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Sync active thread whenever activeSessionId or threads change
  useEffect(() => {
    if (activeSessionId) {
      const current = threads.find((t) => t.sessionId === activeSessionId);
      if (current) {
        setActiveThread(current);
      }
    } else if (threads.length > 0) {
      setActiveSessionId(threads[0].sessionId);
      setActiveThread(threads[0]);
    }
  }, [threads, activeSessionId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages]);

  const fetchThreads = async () => {
    try {
      const res = await fetch("/api/chat?action=threads");
      if (res.ok) {
        const data = await res.json();
        setThreads(data.threads || []);
      }
    } catch (error) {
      console.error("Failed to fetch chat threads:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectThread = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    try {
      const res = await fetch(`/api/chat?sessionId=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.thread) {
          setActiveThread(data.thread);
          // Refresh list to update unread badge count
          fetchThreads();
        }
      }
    } catch (error) {
      console.error("Failed to fetch thread detail:", error);
    }
  };

  const handleSendReply = async (textToSend?: string) => {
    const text = textToSend || replyText;
    if (!text.trim() || !activeSessionId) return;

    if (!textToSend) setReplyText("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          sessionId: activeSessionId,
          sender: "agent",
          senderName: "Oriyon Support Team",
          text: text.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.thread) {
          setActiveThread(data.thread);
          fetchThreads();
        }
      }
    } catch (error) {
      console.error("Failed to send reply:", error);
    }
  };

  const handleUpdateStatus = async (newStatus: "open" | "in_progress" | "resolved") => {
    if (!activeSessionId) return;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          sessionId: activeSessionId,
          status: newStatus,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.thread) {
          setActiveThread(data.thread);
          fetchThreads();
        }
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  // Filtered threads list
  const filteredThreads = threads.filter((t) => {
    const matchesStatus = filterStatus === "all" || t.status === filterStatus;
    const matchesSearch =
      t.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.visitorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalOpen = threads.filter((t) => t.status === "open").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-[#1E3A2B] rounded-xl font-bold">💬</span>
            <h1 className="text-2xl font-bold text-stone-900">Live Customer Support</h1>
          </div>
          <p className="text-stone-500 text-sm mt-1">
            Answer questions live from visitors and trainees asking on behalf of Oriyon International.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 rounded-xl text-xs font-medium text-stone-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{totalOpen} Open Inquiry{totalOpen === 1 ? "" : "s"}</span>
          </div>

          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border shadow-sm ${
              isOnline
                ? "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                : "bg-stone-100 border-stone-300 text-stone-600 hover:bg-stone-200"
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-stone-400"}`}></span>
            {isOnline ? "Rep Status: Online" : "Rep Status: Offline"}
          </button>
        </div>
      </div>

      {/* Main Support Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[680px]">
        {/* Left Column: Threads Sidebar (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col overflow-hidden">
          {/* Search & Filter */}
          <div className="p-4 border-b border-stone-200 space-y-3 bg-stone-50/50">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search visitor name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-[#1E3A2B]"
              />
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-stone-200/60 p-1 rounded-xl text-xs font-medium">
              {(["all", "open", "in_progress", "resolved"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`flex-1 py-1 rounded-lg capitalize transition-all text-center ${
                    filterStatus === st
                      ? "bg-white text-[#1E3A2B] shadow-sm font-semibold"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
            {loading ? (
              <div className="p-8 text-center text-xs text-stone-400">Loading support conversations...</div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400 space-y-1">
                <MessageSquare className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                <p className="font-medium text-stone-600">No conversations found</p>
                <p>Visitor inquiries will appear here live.</p>
              </div>
            ) : (
              filteredThreads.map((t) => {
                const isActive = t.sessionId === activeSessionId;
                return (
                  <button
                    key={t.sessionId}
                    onClick={() => handleSelectThread(t.sessionId)}
                    className={`w-full text-left p-4 transition-all hover:bg-stone-50 flex items-start gap-3 relative ${
                      isActive ? "bg-emerald-50/60 border-l-4 border-[#1E3A2B]" : ""
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#1E3A2B] text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
                      {t.visitorName.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-semibold text-xs text-stone-900 truncate">
                          {t.visitorName}
                        </span>
                        <span className="text-[10px] text-stone-400 flex-shrink-0">
                          {new Date(t.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      <p className="text-[11px] text-stone-500 truncate mb-1.5">{t.lastMessage}</p>

                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${
                            t.status === "open"
                              ? "bg-amber-100 text-amber-800"
                              : t.status === "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-stone-100 text-stone-600"
                          }`}
                        >
                          {t.status.replace("_", " ")}
                        </span>

                        {t.unreadCount > 0 && (
                          <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {t.unreadCount} new
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Workspace (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col overflow-hidden">
          {activeThread ? (
            <>
              {/* Workspace Header */}
              <div className="p-4 border-b border-stone-200 bg-stone-50/50 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1E3A2B] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {activeThread.visitorName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-stone-900 leading-tight">
                      {activeThread.visitorName}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-stone-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {activeThread.visitorEmail}
                      </span>
                      {activeThread.visitorPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {activeThread.visitorPhone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Switcher */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500 font-medium">Status:</span>
                  <select
                    value={activeThread.status}
                    onChange={(e) => handleUpdateStatus(e.target.value as any)}
                    className="px-2.5 py-1 text-xs border border-stone-300 rounded-lg bg-white font-medium text-stone-800 outline-none focus:ring-2 focus:ring-[#1E3A2B]"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>

              {/* Message Timeline */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-stone-50">
                {activeThread.messages.map((msg) => {
                  if (msg.sender === "system") {
                    return (
                      <div key={msg.id} className="text-center my-2">
                        <span className="inline-block text-xs bg-stone-200 text-stone-700 px-3 py-1 rounded-full">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  const isAgent = msg.sender === "agent";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAgent ? "items-end" : "items-start"}`}
                    >
                      <span className="text-[11px] text-stone-500 mb-1 px-1">
                        {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <div
                        className={`max-w-[78%] px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                          isAgent
                            ? "bg-[#1E3A2B] text-white rounded-br-none"
                            : "bg-white border border-stone-200 text-stone-800 rounded-bl-none"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Template Replies */}
              <div className="px-4 py-2 bg-white border-t border-stone-200 overflow-x-auto flex items-center gap-2">
                <span className="text-[11px] font-semibold text-stone-500 flex items-center gap-1 flex-shrink-0">
                  <Sparkles className="w-3 h-3 text-amber-500" /> FAQ Shortcuts:
                </span>
                {QUICK_REPLIES.map((qr, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendReply(qr.text)}
                    className="px-2.5 py-1 text-xs bg-stone-100 hover:bg-emerald-50 hover:text-[#1E3A2B] border border-stone-200 rounded-lg whitespace-nowrap transition-colors"
                  >
                    + {qr.title}
                  </button>
                ))}
              </div>

              {/* Reply Input */}
              <div className="p-4 bg-white border-t border-stone-200 flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Type your reply on behalf of Oriyon International..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 bg-stone-100 border border-stone-300 rounded-xl outline-none focus:ring-2 focus:ring-[#1E3A2B]"
                />
                <button
                  onClick={() => handleSendReply()}
                  disabled={!replyText.trim()}
                  className="px-4 py-2.5 bg-[#1E3A2B] hover:bg-[#15281E] text-white font-medium text-xs sm:text-sm rounded-xl disabled:opacity-40 transition-colors shadow-sm flex items-center gap-2"
                >
                  Send Reply
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-400">
              <MessageSquare className="w-12 h-12 mb-3 text-stone-300" />
              <h3 className="font-semibold text-stone-700 text-base">Select a live conversation</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm">
                Choose a visitor thread from the sidebar to view messages and respond live on behalf of Oriyon International.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
