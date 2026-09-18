"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { refreshAccessToken } from "@/lib/api";
import {
  useLmsCommunityStore,
  COMMUNITY_CHANNELS,
  Question,
  Answer,
  ChatMessage,
} from "@/store/lmsCommunityStore";

export default function LmsCommunityPage() {
  const router = useRouter();

  // Auth User state
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("Trainee");
  const [userRole, setUserRole] = useState<"trainee" | "trainer" | "lead_trainer" | "coordinator" | "admin">("trainee");
  const [userAvatar, setUserAvatar] = useState<string>("");
  const [ready, setReady] = useState(false);

  // Store state
  const {
    questions,
    chatMessages,
    selectedChannel,
    selectedFilter,
    searchQuery,
    viewMode,
    loading,
    setSelectedChannel,
    setSelectedFilter,
    setSearchQuery,
    setViewMode,
    fetchQuestions,
    fetchChatMessages,
    addQuestionApi,
    addAnswerApi,
    addReplyApi,
    toggleUpvoteQuestionApi,
    toggleUpvoteAnswerApi,
    markBestAnswerApi,
    sendChatMessageApi,
  } = useLmsCommunityStore();

  // Local UI state
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [showAskModal, setShowAskModal] = useState(false);

  // Form states for new question
  const [askTitle, setAskTitle] = useState("");
  const [askContent, setAskContent] = useState("");
  const [askChannel, setAskChannel] = useState("poultry");
  const [askTags, setAskTags] = useState("");
  const [askError, setAskError] = useState("");

  // Form state for new answer
  const [answerInput, setAnswerInput] = useState("");
  const [replyInputMap, setReplyInputMap] = useState<Record<string, string>>({});
  const [activeReplyAnswerId, setActiveReplyAnswerId] = useState<string | null>(null);

  // Live chat input state
  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Guest modal state
  const [showGuestModal, setShowGuestModal] = useState(false);

  const isGuest = !userId || userId === "guest-id";

  // Authenticate on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const refresh = localStorage.getItem("refreshToken");
        if (!refresh) {
          setUserId("");
          setReady(true);
          return;
        }

        let token =
          useAuthStore.getState().accessToken ||
          (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null);

        if (!token && refresh) {
          try {
            token = await refreshAccessToken();
          } catch {
            setUserId("");
            setReady(true);
            return;
          }
        }

        if (!token) {
          setUserId("");
          setReady(true);
          return;
        }

        const payload = JSON.parse(atob(token.split(".")[1]));
        const uid = payload.userId || payload.sub || payload.id;
        const name = payload.firstName
          ? `${payload.firstName} ${payload.lastName || ""}`.trim()
          : payload.name || "Trainee";
        const role = payload.role || "trainee";

        setUserId(uid || "guest-id");
        setUserName(name);
        setUserRole(
          role === "trainer" || role === "lead_trainer" || role === "coordinator" || role === "admin"
            ? role
            : "trainee"
        );
        setUserAvatar(payload.passportPicture || payload.avatarUrl || "");
        setReady(true);
      } catch {
        setUserId("");
        setReady(true);
      }
    };

    initAuth();
  }, [router]);

  // Initial fetch and real-time polling
  useEffect(() => {
    if (!ready) return;

    if (viewMode === "chat") {
      fetchChatMessages(selectedChannel);
      const interval = setInterval(() => {
        if (!document.hidden) {
          fetchChatMessages(selectedChannel);
        }
      }, 3000);
      return () => clearInterval(interval);
    } else {
      fetchQuestions();
      const interval = setInterval(() => {
        if (!document.hidden) {
          fetchQuestions();
        }
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [ready, viewMode, selectedChannel, fetchQuestions, fetchChatMessages]);

  // Scroll to bottom when new chat message arrives
  useEffect(() => {
    if (viewMode === "chat") {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, viewMode]);

  // Keep activeQuestion in sync with store
  useEffect(() => {
    if (activeQuestion) {
      const updated = questions.find((q) => q.id === activeQuestion.id);
      if (updated) setActiveQuestion(updated);
    }
  }, [questions, activeQuestion?.id]);

  // Filter questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Channel filter
      if (selectedChannel !== "all" && q.channelId !== selectedChannel) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = q.title.toLowerCase().includes(query);
        const matchesContent = q.content.toLowerCase().includes(query);
        const matchesAuthor = q.authorName.toLowerCase().includes(query);
        const matchesTags = (q.tags || []).some((t) => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesContent && !matchesAuthor && !matchesTags) {
          return false;
        }
      }
      // Filter tab
      if (selectedFilter === "unanswered") return (q.answers || []).length === 0;
      if (selectedFilter === "solved") return q.isSolved;
      if (selectedFilter === "my_questions") return q.authorId === userId;
      return true;
    }).sort((a, b) => {
      if (selectedFilter === "popular") return b.upvotes - a.upvotes;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [questions, selectedChannel, selectedFilter, searchQuery, userId]);

  // Handle asking question
  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!askTitle.trim() || !askContent.trim()) {
      setAskError("Please provide both a title and details for your question.");
      return;
    }

    const channelObj = COMMUNITY_CHANNELS.find((c) => c.id === askChannel);
    const parsedTags = askTags
      .split(/[\s,]+/)
      .filter((t) => t.trim().length > 0)
      .map((t) => (t.startsWith("#") ? t : `#${t}`));

    const created = await addQuestionApi({
      title: askTitle.trim(),
      content: askContent.trim(),
      channelId: askChannel,
      channelName: channelObj?.name || "General Discussion",
      tags: parsedTags.length > 0 ? parsedTags : ["#PeerQA"],
    });

    setAskTitle("");
    setAskContent("");
    setAskTags("");
    setAskError("");
    setShowAskModal(false);
    if (created) {
      setActiveQuestion(created);
    }
  };

  // Handle submitting answer
  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    if (!activeQuestion || !answerInput.trim()) return;

    await addAnswerApi(activeQuestion.id, answerInput.trim());
    setAnswerInput("");
  };

  // Handle reply submit
  const handleSubmitReply = async (answerId: string) => {
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    if (!activeQuestion) return;
    const text = replyInputMap[answerId];
    if (!text || !text.trim()) return;

    await addReplyApi(answerId, text.trim(), activeQuestion.id);
    setReplyInputMap((prev) => ({ ...prev, [answerId]: "" }));
    setActiveReplyAnswerId(null);
  };

  // Handle sending chat message
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest) {
      setShowGuestModal(true);
      return;
    }
    if (!chatInput.trim()) return;

    const channel = selectedChannel === "all" ? "general" : selectedChannel;
    await sendChatMessageApi(channel, chatInput.trim());
    setChatInput("");
  };

  const formatRoleBadge = (role: string) => {
    switch (role) {
      case "lead_trainer":
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-100 text-purple-800 border border-purple-200">⭐ Lead Trainer</span>;
      case "trainer":
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200">🎓 Trainer</span>;
      case "coordinator":
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-200">🛡️ Coordinator</span>;
      case "admin":
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-100 text-rose-800 border border-rose-200">👑 Admin</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">🌱 Trainee</span>;
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] text-slate-800 font-sora selection:bg-emerald-500/20">
      {/* HEADER BAR */}
      <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => router.push("/learn/lms/dashboard")}
            className="text-xs font-bold text-slate-500 hover:text-emerald-900 transition flex items-center gap-1.5 cursor-pointer"
          >
            ← <span className="hidden sm:inline">Back to</span> LMS Dashboard
          </button>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black text-slate-900">Oriyon Trainee Peer Q&A & Live Section</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* VIEW MODE TOGGLE */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1">
            <button
              onClick={() => setViewMode("qna")}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === "qna"
                  ? "bg-emerald-700 text-white shadow-2xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>💬 Q&A Board</span>
            </button>
            <button
              onClick={() => {
                if (isGuest) {
                  setShowGuestModal(true);
                } else {
                  setViewMode("chat");
                }
              }}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === "chat"
                  ? "bg-emerald-700 text-white shadow-2xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>⚡ Live Chat</span>
            </button>
          </div>

          <button
            onClick={() => (isGuest ? setShowGuestModal(true) : setShowAskModal(true))}
            className="px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>➕ Ask Question</span>
          </button>
        </div>
      </header>

      {/* HERO BANNER */}
      <div className="bg-[#002d25] text-white border-b border-emerald-950 px-4 sm:px-8 py-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Peer Learning & Support Hub
              </span>
              <span className="text-[11px] text-emerald-200 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                42 Trainees & Trainers Active
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight leading-tight">
              Trainee Q&A & Live Knowledge Room
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-1">
              Ask questions on brooding, livestock health, exams, or agribusiness. Help your fellow trainees and earn verified solution badges!
            </p>

            {/* POPULAR TOPIC CHIPS */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              <span className="text-[11px] text-emerald-200/80 font-bold mr-1">Popular Topics:</span>
              {["#brooding", "#assignments", "#exams", "#health", "#cooperative", "#login-help"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(searchQuery === tag ? "" : tag)}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    searchQuery === tag
                      ? "bg-emerald-400 text-emerald-950 font-black shadow-xs"
                      : "bg-emerald-800/60 hover:bg-emerald-700/80 text-emerald-100 border border-emerald-700/60"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* SEARCH BOX */}
          <div className="w-full md:w-80">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions, solutions or tags..."
                className="w-full bg-white/10 border border-emerald-600/40 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-emerald-200/60 focus:outline-none focus:bg-white/20 transition font-medium"
              />
              <span className="absolute left-3 top-2.5 text-slate-300 text-sm">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-slate-300 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT SIDEBAR: TOPIC CHANNELS */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 px-2">
                Topic Channels
              </h2>
              <nav className="space-y-1">
                {COMMUNITY_CHANNELS.map((channel) => {
                  const active = selectedChannel === channel.id;
                  const count =
                    channel.id === "all"
                      ? questions.length
                      : questions.filter((q) => q.channelId === channel.id).length;

                  return (
                    <button
                      key={channel.id}
                      onClick={() => setSelectedChannel(channel.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                        active
                          ? "bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-base">{channel.icon}</span>
                        <span className="truncate">{channel.name}</span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                          active
                            ? "bg-emerald-700 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* PEER REWARD BADGES INFO */}
            <div className="bg-emerald-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <h3 className="font-extrabold text-sm text-emerald-100">Verified Peer Contributor</h3>
              </div>
              <p className="text-xs text-emerald-200/90 leading-relaxed font-medium">
                Answer your peers&apos; questions accurately! Answers marked as <strong className="text-white">Verified Solution</strong> earn recognition on your LMS practical record.
              </p>
              <div className="pt-2 border-t border-emerald-800/80 flex items-center justify-between text-[11px] font-bold text-emerald-300">
                <span>Top Answerer This Week:</span>
                <span className="text-white font-black">Dr. Kemi & Amina B.</span>
              </div>
            </div>

            {/* REPORT ISSUES & TECHNICAL SUPPORT */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xs">
                <span>🛠️</span>
                <span>Having Technical Issues?</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                Experiencing login, exam loading, or portal verification issues? Reach out to support directly.
              </p>
              <Link
                href="/complaints"
                className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 hover:text-emerald-900 transition"
              >
                Report an Issue / Technical Help →
              </Link>
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="lg:col-span-9">
            {viewMode === "qna" ? (
              /* Q&A BOARD VIEW */
              <div className="space-y-6">
                {/* FILTER TABS */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl p-3 shadow-2xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: "all", label: "All Questions" },
                      { id: "unanswered", label: "❓ Unanswered" },
                      { id: "solved", label: "✅ Verified Solutions" },
                      { id: "popular", label: "🔥 Most Upvoted" },
                      { id: "my_questions", label: "👤 My Questions" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          if (tab.id === "my_questions" && isGuest) {
                            setShowGuestModal(true);
                          } else {
                            setSelectedFilter(tab.id as any);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          selectedFilter === tab.id
                            ? "bg-emerald-700 text-white shadow-2xs"
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <span className="text-xs font-extrabold text-slate-400 px-2">
                    Showing {filteredQuestions.length} questions
                  </span>
                </div>

                {/* QUESTIONS LIST */}
                {filteredQuestions.length === 0 ? (
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-2xs">
                    <div className="text-4xl mb-3">💬</div>
                    <h3 className="text-base font-black text-slate-800">No questions found</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-medium">
                      Be the first trainee to post a question under this topic or filter!
                    </p>
                    <button
                      onClick={() => (isGuest ? setShowGuestModal(true) : setShowAskModal(true))}
                      className="mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      ➕ Ask a Question Now
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredQuestions.map((q) => {
                      const hasUpvoted = q.upvotedBy.includes(userId);

                      return (
                        <div
                          key={q.id}
                          className={`bg-white border rounded-2xl p-5 transition shadow-2xs hover:shadow-xs group ${
                            q.isSolved ? "border-emerald-200/90 bg-emerald-50/10" : "border-slate-200/80"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            {/* UPVOTE BUTTON */}
                            <button
                              onClick={() => (isGuest ? setShowGuestModal(true) : toggleUpvoteQuestionApi(q.id))}
                              className={`flex flex-col items-center justify-center min-w-12 h-14 rounded-xl border transition cursor-pointer ${
                                hasUpvoted
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs font-black"
                                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              <span className="text-xs font-bold leading-none">▲</span>
                              <span className="text-xs font-black mt-1">{q.upvotes}</span>
                            </button>

                            {/* QUESTION MAIN */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-slate-900">{q.authorName}</span>
                                  {formatRoleBadge(q.authorRole)}
                                  <span className="text-[10px] text-slate-400 font-semibold">• {timeAgo(q.createdAt)}</span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                                    {q.channelName}
                                  </span>
                                  {q.isSolved && (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                      ✓ Verified Solution
                                    </span>
                                  )}
                                </div>
                              </div>

                              <h3
                                onClick={() => setActiveQuestion(q)}
                                className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition cursor-pointer leading-snug mb-2"
                              >
                                {q.title}
                              </h3>

                              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium mb-3">
                                {q.content}
                              </p>

                              {/* TAGS & ANSWERS FOOTER */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {q.tags.map((tag, idx) => (
                                    <span
                                      key={idx}
                                      onClick={() => setSearchQuery(tag)}
                                      className="text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md cursor-pointer transition"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>

                                <button
                                  onClick={() => setActiveQuestion(q)}
                                  className="text-xs font-extrabold text-emerald-700 hover:text-emerald-900 transition flex items-center gap-1 cursor-pointer"
                                >
                                  <span>💬 {q.answers.length} {q.answers.length === 1 ? "Answer" : "Answers"}</span>
                                  <span>→</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* LIVE CHAT STREAM VIEW */
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs flex flex-col h-[700px] overflow-hidden">
                {/* CHAT HEADER */}
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        Live Trainee Chat Stream
                      </h3>
                      <p className="text-[11px] text-slate-500 font-semibold">
                        Real-time peer chat for general questions, practical day info & cohort updates
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full">
                    🟢 Live Stream Active
                  </span>
                </div>

                {/* MESSAGES CONTAINER */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar bg-[#fbfdfc]">
                  {chatMessages.map((msg) => {
                    const isMe = msg.authorId === userId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex items-start gap-3 ${isMe ? "flex-row-reverse" : ""}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 text-white ${
                            isMe ? "bg-emerald-600" : "bg-slate-700"
                          }`}
                        >
                          {msg.authorName[0]}
                        </div>

                        <div
                          className={`max-w-[75%] rounded-2xl p-4 shadow-2xs space-y-1 ${
                            isMe
                              ? "bg-emerald-700 text-white rounded-tr-none"
                              : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 text-[10px]">
                            <div className="flex items-center gap-1.5 font-black">
                              <span className={isMe ? "text-emerald-100" : "text-slate-900"}>
                                {msg.authorName}
                              </span>
                              {formatRoleBadge(msg.authorRole)}
                            </div>
                            <span className={isMe ? "text-emerald-200" : "text-slate-400"}>
                              {timeAgo(msg.createdAt || (msg as any).timestamp)}
                            </span>
                          </div>

                          <p className="text-xs leading-relaxed font-medium whitespace-pre-wrap">
                            {msg.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatBottomRef} />
                </div>

                {/* CHAT INPUT FORM */}
                <form onSubmit={handleSendChat} className="p-4 bg-white border-t border-slate-200 flex items-center gap-3">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={isGuest ? "Sign in to post live chat messages..." : "Type your message to cohort peers..."}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition shadow-2xs cursor-pointer shrink-0"
                  >
                    Send 🚀
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* QUESTION DETAIL MODAL */}
      {activeQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
            {/* MODAL HEADER */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-200 text-slate-800">
                  {activeQuestion.channelName}
                </span>
                {activeQuestion.isSolved && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                    ✓ Verified Solution
                  </span>
                )}
              </div>

              <button
                onClick={() => setActiveQuestion(null)}
                className="text-slate-400 hover:text-slate-700 text-2xl transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar">
              {/* QUESTION DETAILS */}
              <div className="space-y-3 pb-6 border-b border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">{activeQuestion.authorName}</span>
                    {formatRoleBadge(activeQuestion.authorRole)}
                    <span className="text-[10px] text-slate-400 font-semibold">• {timeAgo(activeQuestion.createdAt)}</span>
                  </div>
                  <button
                    onClick={() => (isGuest ? setShowGuestModal(true) : toggleUpvoteQuestionApi(activeQuestion.id))}
                    className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>▲ Upvote</span>
                    <span>{activeQuestion.upvotes}</span>
                  </button>
                </div>

                <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                  {activeQuestion.title}
                </h2>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                  {activeQuestion.content}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {activeQuestion.tags.map((tag, idx) => (
                    <span key={idx} className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* ANSWERS SECTION */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  {activeQuestion.answers.length} {activeQuestion.answers.length === 1 ? "Answer" : "Answers"}
                </h3>

                {activeQuestion.answers.length === 0 ? (
                  <div className="p-6 bg-slate-50 border border-slate-200/60 rounded-2xl text-center text-xs text-slate-500 font-medium">
                    No answers posted yet. Be the first to help answer this question!
                  </div>
                ) : (
                  activeQuestion.answers.map((ans) => {
                    const isAuthorOrTrainer =
                      userRole === "trainer" ||
                      userRole === "lead_trainer" ||
                      userRole === "admin" ||
                      activeQuestion.authorId === userId;

                    const hasUpvotedAns = ans.upvotedBy.includes(userId);

                    return (
                      <div
                        key={ans.id}
                        className={`rounded-2xl p-5 border transition space-y-3 ${
                          ans.isVerified
                            ? "bg-emerald-50/50 border-emerald-300 shadow-2xs"
                            : "bg-white border-slate-200/80"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center">
                              {ans.authorName[0]}
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-900">{ans.authorName}</p>
                              {formatRoleBadge(ans.authorRole)}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {ans.isVerified && (
                              <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
                                ✓ Verified Solution
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-semibold">{timeAgo(ans.createdAt)}</span>
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                          {ans.content}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleUpvoteAnswerApi(ans.id, activeQuestion.id)}
                              className={`text-xs font-extrabold cursor-pointer flex items-center gap-1 px-2.5 py-1 rounded-lg border ${
                                hasUpvotedAns
                                  ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                                  : "bg-slate-50 border-slate-200 text-slate-600"
                              }`}
                            >
                              <span>▲ Helpful</span>
                              <span>({ans.upvotes})</span>
                            </button>

                            <button
                              onClick={() => setActiveReplyAnswerId(activeReplyAnswerId === ans.id ? null : ans.id)}
                              className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                            >
                              Reply ({ans.replies?.length || 0})
                            </button>
                          </div>

                          {isAuthorOrTrainer && !ans.isVerified && (
                            <button
                              onClick={() => markBestAnswerApi(activeQuestion.id, ans.id)}
                              className="text-[11px] font-black text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition cursor-pointer"
                            >
                              ✓ Mark as Best Answer
                            </button>
                          )}
                        </div>

                        {/* NESTED REPLIES */}
                        {ans.replies && ans.replies.length > 0 && (
                          <div className="pl-4 border-l-2 border-slate-200 space-y-2 pt-2">
                            {ans.replies.map((rep) => (
                              <div key={rep.id} className="bg-slate-50 p-3 rounded-xl space-y-1">
                                <div className="flex items-center justify-between text-[10px]">
                                  <div className="flex items-center gap-1.5 font-black text-slate-800">
                                    <span>{rep.authorName}</span>
                                    {formatRoleBadge(rep.authorRole)}
                                  </div>
                                  <span className="text-slate-400">{timeAgo(rep.createdAt)}</span>
                                </div>
                                <p className="text-xs text-slate-700 font-medium">{rep.content}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* REPLY FORM */}
                        {activeReplyAnswerId === ans.id && (
                          <div className="pt-2 flex gap-2">
                            <input
                              type="text"
                              value={replyInputMap[ans.id] || ""}
                              onChange={(e) =>
                                setReplyInputMap((prev) => ({ ...prev, [ans.id]: e.target.value }))
                              }
                              placeholder="Write a reply comment..."
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                            />
                            <button
                              onClick={() => handleSubmitReply(ans.id)}
                              className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 cursor-pointer"
                            >
                              Post Reply
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* POST ANSWER FORM */}
              <form onSubmit={handleSubmitAnswer} className="space-y-3 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Your Answer / Fellow Trainee Solution
                </h4>
                <textarea
                  rows={3}
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  placeholder="Share your knowledge or experience to answer this question..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition font-medium"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition shadow-2xs cursor-pointer"
                  >
                    Submit Answer 🚀
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ASK QUESTION MODAL */}
      {showAskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden font-sora">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Post to Community
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">Ask Your Fellow Trainees</h3>
              </div>
              <button
                onClick={() => setShowAskModal(false)}
                className="text-slate-400 hover:text-slate-700 text-2xl transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="p-6 space-y-4">
              {askError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold">
                  {askError}
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Question Title *
                </label>
                <input
                  type="text"
                  value={askTitle}
                  onChange={(e) => setAskTitle(e.target.value)}
                  placeholder="e.g. What is the feeding ratio for broiler finisher feed in Week 5?"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Topic Channel *
                </label>
                <select
                  value={askChannel}
                  onChange={(e) => setAskChannel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
                >
                  {COMMUNITY_CHANNELS.filter((c) => c.id !== "all").map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Detailed Question Description *
                </label>
                <textarea
                  rows={4}
                  value={askContent}
                  onChange={(e) => setAskContent(e.target.value)}
                  placeholder="Provide background details so trainees and trainers can give accurate answers..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Tags (Optional)
                </label>
                <input
                  type="text"
                  value={askTags}
                  onChange={(e) => setAskTags(e.target.value)}
                  placeholder="e.g. Week5, BroilerFeed, Health (separated by space or comma)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-semibold">
                  Posted live to all cohort trainees
                </span>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition shadow-2xs cursor-pointer"
                >
                  Post Question Now 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
