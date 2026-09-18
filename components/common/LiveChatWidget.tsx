"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, X, Send, User, CheckCircle2, RefreshCw } from "lucide-react";
import { useChatStore, ChatMessage, ChatThread } from "@/store/chatStore";

export default function LiveChatWidget() {
  const pathname = usePathname();

  // Hide live chat widget on dashboards, portals, auth, and application forms
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/cooperative") ||
    pathname.startsWith("/learn/lms") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/setup-password") ||
    pathname.startsWith("/apply")
  ) {
    return null;
  }

  const {
    isOpen,
    toggleOpen,
    setIsOpen,
    activeSessionId,
    setActiveSessionId,
    visitorName,
    visitorEmail,
    setVisitorInfo,
    currentMessages,
    setMessages,
    appendMessage,
  } = useChatStore();

  const [inputName, setInputName] = useState("");
  const [inputEmail, setInputEmail] = useState("");
  const [textMessage, setTextMessage] = useState("");
  const [initialQuestion, setInitialQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [threadStatus, setThreadStatus] = useState<string>("open");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Restore stored session from localStorage on mount
  useEffect(() => {
    const storedSession = localStorage.getItem("oriyon_chat_session_id");
    const storedName = localStorage.getItem("oriyon_chat_visitor_name");
    const storedEmail = localStorage.getItem("oriyon_chat_visitor_email");

    if (storedName && storedEmail) {
      setVisitorInfo(storedName, storedEmail);
      setInputName(storedName);
      setInputEmail(storedEmail);
    }

    if (storedSession) {
      setActiveSessionId(storedSession);
      fetchSessionMessages(storedSession);
    }
  }, []);

  // Poll for new messages every 4 seconds when widget is open and session is active
  useEffect(() => {
    if (!isOpen || !activeSessionId) return;

    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchSessionMessages(activeSessionId, true);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, activeSessionId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentMessages, isOpen]);

  const fetchSessionMessages = async (sessionId: string, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch(`/api/chat?sessionId=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.thread) {
          setMessages(data.thread.messages || []);
          setThreadStatus(data.thread.status);
        }
      }
    } catch (error) {
      console.error("Failed to fetch chat messages:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim() || !inputEmail.trim() || !initialQuestion.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          visitorName: inputName.trim(),
          visitorEmail: inputEmail.trim(),
          text: initialQuestion.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const thread: ChatThread = data.thread;

        setVisitorInfo(inputName.trim(), inputEmail.trim());
        setActiveSessionId(thread.sessionId);
        setMessages(thread.messages || []);
        setThreadStatus(thread.status);

        localStorage.setItem("oriyon_chat_session_id", thread.sessionId);
        localStorage.setItem("oriyon_chat_visitor_name", inputName.trim());
        localStorage.setItem("oriyon_chat_visitor_email", inputEmail.trim());

        setInitialQuestion("");
      }
    } catch (error) {
      console.error("Failed to start chat session:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textMessage.trim() || !activeSessionId) return;

    const messageText = textMessage.trim();
    setTextMessage("");

    // Optimistic local add
    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sessionId: activeSessionId,
      sender: "visitor",
      senderName: visitorName || inputName || "You",
      text: messageText,
      timestamp: new Date().toISOString(),
    };
    appendMessage(tempMsg);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          sessionId: activeSessionId,
          sender: "visitor",
          senderName: visitorName || inputName || "Visitor",
          text: messageText,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.thread) {
          setMessages(data.thread.messages);
          setThreadStatus(data.thread.status);
        }
      }
    } catch (error) {
      console.error("Failed to send chat message:", error);
    }
  };

  const handleResetSession = () => {
    localStorage.removeItem("oriyon_chat_session_id");
    setActiveSessionId("");
    setMessages([]);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Expanded Chat Drawer */}
      {isOpen && (
        <div className="mb-3 w-[360px] sm:w-[400px] h-[530px] bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-[#1E3A2B] text-white p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-700/60 border border-emerald-400/30 flex items-center justify-center font-bold text-lg text-emerald-200 shadow-inner">
                O
              </div>
              <div>
                <h3 className="font-semibold text-base leading-tight">Oriyon Support</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <p className="text-xs text-stone-200">Online | We reply fast</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {activeSessionId && (
                <button
                  onClick={handleResetSession}
                  title="New Conversation"
                  className="p-1.5 text-stone-300 hover:text-white hover:bg-emerald-800/50 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-stone-300 hover:text-white hover:bg-emerald-800/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body content */}
          {!activeSessionId ? (
            /* Visitor Intake Form */
            <form onSubmit={handleStartChat} className="p-5 flex-1 flex flex-col justify-between overflow-y-auto bg-stone-50">
              <div className="space-y-4">
                <div className="text-center pt-2 pb-1">
                  <div className="inline-flex p-3 rounded-full bg-emerald-100/80 text-[#1E3A2B] mb-2">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-stone-900 text-base">How can we help you?</h4>
                  <p className="text-xs text-stone-500 mt-1">
                    Ask us anything about EEWYLA programs, applications, or LMS access.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    placeholder="e.g. Amina Bello"
                    className="w-full px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#1E3A2B] focus:border-[#1E3A2B] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Your Email Address *</label>
                  <input
                    type="email"
                    required
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#1E3A2B] focus:border-[#1E3A2B] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">Your Question *</label>
                  <textarea
                    required
                    rows={3}
                    value={initialQuestion}
                    onChange={(e) => setInitialQuestion(e.target.value)}
                    placeholder="What would you like to ask our team?"
                    className="w-full px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-[#1E3A2B] focus:border-[#1E3A2B] outline-none resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-2.5 px-4 bg-[#1E3A2B] hover:bg-[#15281E] text-white font-medium rounded-xl text-sm transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? "Starting Chat..." : "Start Live Chat"}
                {!loading && <Send className="w-4 h-4" />}
              </button>
            </form>
          ) : (
            /* Active Message Thread */
            <div className="flex-1 flex flex-col justify-between overflow-hidden bg-stone-50">
              {/* Message List */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {currentMessages.map((msg) => {
                  if (msg.sender === "system") {
                    return (
                      <div key={msg.id} className="text-center my-2">
                        <span className="inline-block text-[11px] bg-stone-200 text-stone-700 px-3 py-1 rounded-full">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  const isVisitor = msg.sender === "visitor";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isVisitor ? "items-end" : "items-start"}`}
                    >
                      <span className="text-[10px] text-stone-500 mb-1 px-1">
                        {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <div
                        className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                          isVisitor
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

              {/* Status Notice if resolved */}
              {threadStatus === "resolved" && (
                <div className="bg-emerald-50 border-t border-b border-emerald-100 p-2.5 text-center text-xs text-emerald-800 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>This thread is marked resolved. Send a message to reopen.</span>
                </div>
              )}

              {/* Message Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-stone-200 flex items-center gap-2">
                <input
                  type="text"
                  value={textMessage}
                  onChange={(e) => setTextMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 bg-stone-100 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#1E3A2B]"
                />
                <button
                  type="submit"
                  disabled={!textMessage.trim()}
                  className="p-2.5 bg-[#1E3A2B] hover:bg-[#15281E] text-white rounded-xl disabled:opacity-40 transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={toggleOpen}
        aria-label="Live Chat Support"
        className="w-14 h-14 rounded-full bg-[#1E3A2B] hover:bg-[#15281E] text-white shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 border-2 border-emerald-500/30 group"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <div className="relative">
            <MessageSquare className="w-6 h-6 text-emerald-100 group-hover:text-white transition-colors" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#1E3A2B] animate-ping" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#1E3A2B]" />
          </div>
        )}
      </button>
    </div>
  );
}
