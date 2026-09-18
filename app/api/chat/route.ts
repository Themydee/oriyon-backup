import { NextResponse } from "next/server";

export interface ChatMessage {
  id: string;
  sessionId: string;
  sender: "visitor" | "agent" | "system";
  senderName: string;
  text: string;
  timestamp: string;
  isRead?: boolean;
}

export interface ChatThread {
  sessionId: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
  updatedAt: string;
  lastMessage: string;
  unreadCount: number;
  messages: ChatMessage[];
}

// Global in-memory store for development/live session simulation
const globalChatStore: {
  threads: Record<string, ChatThread>;
} = (global as any).__ORIYON_CHAT_STORE__ || {
  threads: {
    "session-demo-1": {
      sessionId: "session-demo-1",
      visitorName: "Amina Bello",
      visitorEmail: "amina.bello@example.com",
      visitorPhone: "+234 803 123 4567",
      status: "open",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
      lastMessage: "Is the EEWYLA Oyo state cohort registration still open?",
      unreadCount: 1,
      messages: [
        {
          id: "msg-1",
          sessionId: "session-demo-1",
          sender: "system",
          senderName: "Oriyon Bot",
          text: "Welcome to Oriyon International support! An agent will respond shortly.",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "msg-2",
          sessionId: "session-demo-1",
          sender: "visitor",
          senderName: "Amina Bello",
          text: "Is the EEWYLA Oyo state cohort registration still open?",
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          isRead: false,
        },
      ],
    },
    "session-demo-2": {
      sessionId: "session-demo-2",
      visitorName: "Chidi Okafor",
      visitorEmail: "chidi.okafor@example.com",
      status: "in_progress",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
      lastMessage: "Thank you for the guidance regarding week 4 practicals.",
      unreadCount: 0,
      messages: [
        {
          id: "msg-201",
          sessionId: "session-demo-2",
          sender: "visitor",
          senderName: "Chidi Okafor",
          text: "Hello, where do I view my attendance record for week 4 practicals?",
          timestamp: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "msg-202",
          sessionId: "session-demo-2",
          sender: "agent",
          senderName: "Oriyon Support Team",
          text: "Hello Chidi! You can log into your LMS dashboard at /learn/lms and click on 'My Progress' to check attendance records.",
          timestamp: new Date(Date.now() - 80000000).toISOString(),
        },
        {
          id: "msg-203",
          sessionId: "session-demo-2",
          sender: "visitor",
          senderName: "Chidi Okafor",
          text: "Thank you for the guidance regarding week 4 practicals.",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
      ],
    },
  },
};

(global as any).__ORIYON_CHAT_STORE__ = globalChatStore;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const sessionId = searchParams.get("sessionId");

  if (action === "threads") {
    const threadList = Object.values(globalChatStore.threads).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    return NextResponse.json({ threads: threadList });
  }

  if (sessionId) {
    const thread = globalChatStore.threads[sessionId];
    if (!thread) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    // Mark messages as read when fetched
    thread.unreadCount = 0;
    thread.messages.forEach((m) => {
      if (m.sender === "visitor") m.isRead = true;
    });
    return NextResponse.json({ thread });
  }

  return NextResponse.json({ threads: Object.values(globalChatStore.threads) });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, sessionId, visitorName, visitorEmail, visitorPhone, text, sender, senderName, status } = body;

    // Action: Start new session
    if (action === "start") {
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();

      const initialSysMsg: ChatMessage = {
        id: `msg-${Date.now()}-sys`,
        sessionId: newSessionId,
        sender: "system",
        senderName: "Oriyon Support",
        text: `Welcome ${visitorName || "Guest"}! Thank you for connecting with Oriyon International. An agent will reply to you shortly.`,
        timestamp: now,
      };

      const messages: ChatMessage[] = [initialSysMsg];

      if (text && text.trim()) {
        messages.push({
          id: `msg-${Date.now()}-vis`,
          sessionId: newSessionId,
          sender: "visitor",
          senderName: visitorName || "Guest User",
          text: text.trim(),
          timestamp: now,
          isRead: false,
        });
      }

      const newThread: ChatThread = {
        sessionId: newSessionId,
        visitorName: visitorName || "Guest Visitor",
        visitorEmail: visitorEmail || "guest@oriyoninternational.com",
        visitorPhone: visitorPhone || "",
        status: "open",
        createdAt: now,
        updatedAt: now,
        lastMessage: text || "Session started",
        unreadCount: text ? 1 : 0,
        messages,
      };

      globalChatStore.threads[newSessionId] = newThread;
      return NextResponse.json({ success: true, thread: newThread });
    }

    // Action: Send message in existing session
    if (action === "send") {
      if (!sessionId || !globalChatStore.threads[sessionId]) {
        return NextResponse.json({ error: "Invalid session ID" }, { status: 404 });
      }

      const thread = globalChatStore.threads[sessionId];
      const now = new Date().toISOString();

      const newMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sessionId,
        sender: sender || "visitor",
        senderName: senderName || (sender === "agent" ? "Oriyon Support Rep" : thread.visitorName),
        text: text.trim(),
        timestamp: now,
        isRead: sender === "agent",
      };

      thread.messages.push(newMsg);
      thread.updatedAt = now;
      thread.lastMessage = text.trim();

      if (sender === "visitor") {
        thread.unreadCount += 1;
        if (thread.status === "resolved") {
          thread.status = "open"; // Re-open thread on new visitor message
        }
      } else if (sender === "agent") {
        thread.unreadCount = 0;
        if (thread.status === "open") {
          thread.status = "in_progress";
        }
      }

      return NextResponse.json({ success: true, message: newMsg, thread });
    }

    // Action: Update thread status (open, in_progress, resolved)
    if (action === "update_status") {
      if (!sessionId || !globalChatStore.threads[sessionId]) {
        return NextResponse.json({ error: "Invalid session ID" }, { status: 404 });
      }

      const thread = globalChatStore.threads[sessionId];
      thread.status = status || thread.status;
      thread.updatedAt = new Date().toISOString();

      if (status === "resolved") {
        thread.messages.push({
          id: `msg-${Date.now()}-sys`,
          sessionId,
          sender: "system",
          senderName: "Oriyon System",
          text: "This support conversation has been marked as resolved. Feel free to send a message anytime if you need further assistance!",
          timestamp: new Date().toISOString(),
        });
      }

      return NextResponse.json({ success: true, thread });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
