import { create } from "zustand";
import { authFetch } from "@/lib/api";

export interface Reply {
  id: string;
  answerId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: "trainee" | "trainer" | "lead_trainer" | "coordinator" | "admin";
  authorAvatar?: string;
  createdAt: string;
}

export interface Answer {
  id: string;
  questionId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: "trainee" | "trainer" | "lead_trainer" | "coordinator" | "admin";
  authorAvatar?: string;
  isVerified?: boolean;
  upvotes: number;
  upvotedBy: string[];
  createdAt: string;
  replies?: Reply[];
}

export interface Question {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: "trainee" | "trainer" | "lead_trainer" | "coordinator" | "admin";
  authorAvatar?: string;
  channelId: string;
  channelName: string;
  tags: string[];
  upvotes: number;
  upvotedBy: string[];
  isSolved: boolean;
  solvedAnswerId?: string;
  createdAt: string;
  answers: Answer[];
}

export interface ChatMessage {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorRole: "trainee" | "trainer" | "lead_trainer" | "coordinator" | "admin";
  authorAvatar?: string;
  createdAt: string;
  channelId: string;
  isPinned?: boolean;
}

export interface Channel {
  id: string;
  name: string;
  icon: string;
  description: string;
  badge?: string;
}

export const COMMUNITY_CHANNELS: Channel[] = [
  { id: "all", name: "All Topics", icon: "🌐", description: "View questions across all training subjects" },
  { id: "general", name: "General Discussion", icon: "📢", description: "General cohort banter, news & peer chatter" },
  { id: "poultry", name: "Poultry & Livestock Care", icon: "🐓", description: "Brooding, feeding, housing & health care" },
  { id: "assignments", name: "Assignments & Quizzes", icon: "📝", description: "Clarifications on weekly tasks & exams" },
  { id: "health", name: "Animal Health & Meds", icon: "🏥", description: "Vaccination schedules, diseases & biosecurity" },
  { id: "agribusiness", name: "Agribusiness & Sales", icon: "💼", description: "Cooperative savings, off-taking & market access" },
];

interface CommunityState {
  questions: Question[];
  chatMessages: ChatMessage[];
  questionsCache: Record<string, Question[]>;
  chatCache: Record<string, ChatMessage[]>;
  selectedChannel: string;
  selectedFilter: "all" | "unanswered" | "solved" | "popular" | "my_questions";
  searchQuery: string;
  viewMode: "qna" | "chat";
  loading: boolean;
  error: string | null;

  setSelectedChannel: (channelId: string) => void;
  setSelectedFilter: (filter: "all" | "unanswered" | "solved" | "popular" | "my_questions") => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: "qna" | "chat") => void;

  fetchQuestions: () => Promise<void>;
  fetchChatMessages: (channelId: string) => Promise<void>;

  addQuestionApi: (qData: { title: string; content: string; channelId: string; channelName: string; tags: string[] }) => Promise<Question | null>;
  addAnswerApi: (questionId: string, content: string) => Promise<Answer | null>;
  addReplyApi: (answerId: string, content: string, questionId: string) => Promise<Reply | null>;
  toggleUpvoteQuestionApi: (questionId: string) => Promise<void>;
  toggleUpvoteAnswerApi: (answerId: string, questionId: string) => Promise<void>;
  markBestAnswerApi: (questionId: string, answerId: string) => Promise<void>;
  sendChatMessageApi: (channelId: string, text: string) => Promise<ChatMessage | null>;
}

export const SEED_QUESTIONS: Question[] = [
  {
    id: "seed-q-1",
    title: "How do I prepare the brooding house before day 1 chick arrival?",
    content: "What are the essential temperature and litter requirements for brooding day-old broiler chicks? Should charcoal stoves or gas heaters be set up in advance?",
    authorId: "seed-user-1",
    authorName: "Amina Bello",
    authorRole: "trainee",
    channelId: "poultry",
    channelName: "Poultry & Livestock Care",
    tags: ["#brooding", "#poultry", "#day1chicks", "#temperature"],
    upvotes: 24,
    upvotedBy: [],
    isSolved: true,
    solvedAnswerId: "seed-a-1",
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    answers: [
      {
        id: "seed-a-1",
        questionId: "seed-q-1",
        content: "Pre-heat the brooding area 24 hours before chick arrival (target 32°C–35°C). Use clean wood shavings (3–5 cm deep), ensure clean waterers with glucose/electrolytes ready, and check for draft protection.",
        authorId: "seed-trainer-1",
        authorName: "Dr. K. Ogunleye",
        authorRole: "lead_trainer",
        isVerified: true,
        upvotes: 18,
        upvotedBy: [],
        createdAt: new Date(Date.now() - 3600000 * 24 * 1.8).toISOString(),
        replies: [
          {
            id: "seed-r-1",
            answerId: "seed-a-1",
            content: "Thank you Dr. Ogunleye! Should we also add anti-stress vitamins in the first drinking water?",
            authorId: "seed-user-1",
            authorName: "Amina Bello",
            authorRole: "trainee",
            createdAt: new Date(Date.now() - 3600000 * 24 * 1.5).toISOString(),
          }
        ]
      }
    ]
  },
  {
    id: "seed-q-2",
    title: "What are the requirements for completing the Week 12 physical practical?",
    content: "Where do we get our attendance verified for Week 12 physical check-in? Can we upload our photo on the portal directly?",
    authorId: "seed-user-2",
    authorName: "Emmanuel Chidubem",
    authorRole: "trainee",
    channelId: "assignments",
    channelName: "Assignments & Quizzes",
    tags: ["#week12", "#practical", "#attendance", "#verification"],
    upvotes: 19,
    upvotedBy: [],
    isSolved: true,
    solvedAnswerId: "seed-a-2",
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    answers: [
      {
        id: "seed-a-2",
        questionId: "seed-q-2",
        content: "You can check-in at your assigned physical practical site or upload your geotagged practical photo under the 'Weekly Practical' tab in your LMS dashboard for coordinator approval.",
        authorId: "seed-coord-1",
        authorName: "State Coordinator - Oyo",
        authorRole: "coordinator",
        isVerified: true,
        upvotes: 15,
        upvotedBy: [],
        createdAt: new Date(Date.now() - 3600000 * 24 * 2.5).toISOString(),
        replies: []
      }
    ]
  },
  {
    id: "seed-q-3",
    title: "How do I track my cooperative contributions and loan eligibility?",
    content: "Is there a minimum monthly contribution needed to qualify for the EEWYLA agribusiness off-taker program and equipment grant?",
    authorId: "seed-user-3",
    authorName: "Fatima Ibrahim",
    authorRole: "trainee",
    channelId: "agribusiness",
    channelName: "Agribusiness & Sales",
    tags: ["#cooperative", "#grants", "#agribusiness", "#loans"],
    upvotes: 31,
    upvotedBy: [],
    isSolved: true,
    solvedAnswerId: "seed-a-3",
    createdAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    answers: [
      {
        id: "seed-a-3",
        questionId: "seed-q-3",
        content: "Log into your LMS dashboard and click on the 'Cooperative' tab. Active members who complete minimum 80% attendance and maintain consistent monthly savings become eligible for cooperative grants and off-take contracts.",
        authorId: "seed-admin-1",
        authorName: "Oriyon Admin",
        authorRole: "admin",
        isVerified: true,
        upvotes: 27,
        upvotedBy: [],
        createdAt: new Date(Date.now() - 3600000 * 24 * 3.8).toISOString(),
        replies: []
      }
    ]
  },
  {
    id: "seed-q-4",
    title: "What vaccination schedule is required for broilers in Week 2 and Week 3?",
    content: "When should Gumboro (IBD) vaccine be administered vs Newcastle disease vaccine? Any precautions for water preparation?",
    authorId: "seed-user-4",
    authorName: "Sunday Okon",
    authorRole: "trainee",
    channelId: "health",
    channelName: "Animal Health & Meds",
    tags: ["#vaccination", "#gumboro", "#health", "#biosecurity"],
    upvotes: 14,
    upvotedBy: [],
    isSolved: true,
    solvedAnswerId: "seed-a-4",
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    answers: [
      {
        id: "seed-a-4",
        questionId: "seed-q-4",
        content: "Gumboro 1st dose: Day 9-11. Newcastle LaSota: Day 14-16. Gumboro booster: Day 18-20. Always use non-chlorinated well water or add skimmed milk powder (2g/L) to protect the live vaccine.",
        authorId: "seed-trainer-2",
        authorName: "Dr. A. Sanusi",
        authorRole: "trainer",
        isVerified: true,
        upvotes: 12,
        upvotedBy: [],
        createdAt: new Date(Date.now() - 3600000 * 24 * 4.6).toISOString(),
        replies: []
      }
    ]
  }
];

export const useLmsCommunityStore = create<CommunityState>((set, get) => ({
  questions: SEED_QUESTIONS,
  chatMessages: [],
  questionsCache: {},
  chatCache: {},
  selectedChannel: "all",
  selectedFilter: "all",
  searchQuery: "",
  viewMode: "qna",
  loading: false,
  error: null,

  setSelectedChannel: (selectedChannel) => {
    set({ selectedChannel });
    if (get().viewMode === "chat") {
      get().fetchChatMessages(selectedChannel === "all" ? "general" : selectedChannel);
    } else {
      get().fetchQuestions();
    }
  },
  setSelectedFilter: (selectedFilter) => set({ selectedFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setViewMode: (viewMode) => {
    set({ viewMode });
    if (viewMode === "chat") {
      const channel = get().selectedChannel === "all" ? "general" : get().selectedChannel;
      get().fetchChatMessages(channel);
    } else {
      get().fetchQuestions();
    }
  },

  fetchQuestions: async () => {
    const channel = get().selectedChannel;
    const cached = get().questionsCache[channel];

    if (cached && cached.length > 0) {
      set({ questions: cached, loading: false, error: null });
    } else {
      set({ loading: true, error: null });
    }

    try {
      const res = await authFetch(`/lms/community/questions?channel=${channel}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        const apiList = Array.isArray(data) ? data : data.questions || data.data || [];
        const filteredSeeds = channel === "all" ? SEED_QUESTIONS : SEED_QUESTIONS.filter((s) => s.channelId === channel);
        const questionsList = apiList.length > 0 ? apiList : filteredSeeds;

        set((state) => ({
          questions: questionsList,
          questionsCache: { ...state.questionsCache, [channel]: questionsList },
          loading: false,
          error: null,
        }));
      } else {
        const filteredSeeds = channel === "all" ? SEED_QUESTIONS : SEED_QUESTIONS.filter((s) => s.channelId === channel);
        set({ questions: filteredSeeds, loading: false, error: null });
      }
    } catch (err: any) {
      console.error("[CommunityStore] fetchQuestions error:", err);
      const filteredSeeds = channel === "all" ? SEED_QUESTIONS : SEED_QUESTIONS.filter((s) => s.channelId === channel);
      set({ questions: filteredSeeds, loading: false, error: null });
    }
  },

  fetchChatMessages: async (channelId: string) => {
    try {
      const targetChannel = channelId === "all" ? "general" : channelId;
      const cached = get().chatCache[targetChannel];

      if (cached && cached.length > 0) {
        set({ chatMessages: cached });
      }

      const res = await authFetch(`/lms/community/chat/${targetChannel}?limit=100`);
      if (res.ok) {
        const data = await res.json();
        const msgList = Array.isArray(data) ? data : data.messages || data.data || [];
        set((state) => ({
          chatMessages: msgList,
          chatCache: { ...state.chatCache, [targetChannel]: msgList },
        }));
      }
    } catch (err) {
      console.error("[CommunityStore] fetchChatMessages error:", err);
    }
  },

  addQuestionApi: async (qData) => {
    try {
      const res = await authFetch("/lms/community/questions", {
        method: "POST",
        body: JSON.stringify(qData),
      });
      if (res.ok) {
        const newQuestion = await res.json();
        set((state) => ({ questions: [newQuestion, ...state.questions] }));
        return newQuestion;
      }
    } catch (err) {
      console.error("[CommunityStore] addQuestion error:", err);
    }
    return null;
  },

  addAnswerApi: async (questionId, content) => {
    try {
      const res = await authFetch(`/lms/community/questions/${questionId}/answers`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const newAnswer = await res.json();
        set((state) => ({
          questions: state.questions.map((q) => {
            if (q.id === questionId) {
              return { ...q, answers: [...(q.answers || []), newAnswer] };
            }
            return q;
          }),
        }));
        return newAnswer;
      }
    } catch (err) {
      console.error("[CommunityStore] addAnswer error:", err);
    }
    return null;
  },

  addReplyApi: async (answerId, content, questionId) => {
    try {
      const res = await authFetch(`/lms/community/answers/${answerId}/replies`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const newReply = await res.json();
        set((state) => ({
          questions: state.questions.map((q) => {
            if (q.id === questionId) {
              return {
                ...q,
                answers: (q.answers || []).map((ans) => {
                  if (ans.id === answerId) {
                    return { ...ans, replies: [...(ans.replies || []), newReply] };
                  }
                  return ans;
                }),
              };
            }
            return q;
          }),
        }));
        return newReply;
      }
    } catch (err) {
      console.error("[CommunityStore] addReply error:", err);
    }
    return null;
  },

  toggleUpvoteQuestionApi: async (questionId) => {
    try {
      const res = await authFetch(`/lms/community/questions/${questionId}/upvote`, {
        method: "POST",
      });
      if (res.ok) {
        const updatedQuestion = await res.json();
        set((state) => ({
          questions: state.questions.map((q) => (q.id === questionId ? { ...q, ...updatedQuestion } : q)),
        }));
      }
    } catch (err) {
      console.error("[CommunityStore] toggleUpvoteQuestion error:", err);
    }
  },

  toggleUpvoteAnswerApi: async (answerId, questionId) => {
    try {
      const res = await authFetch(`/lms/community/answers/${answerId}/upvote`, {
        method: "POST",
      });
      if (res.ok) {
        const updatedAnswer = await res.json();
        set((state) => ({
          questions: state.questions.map((q) => {
            if (q.id === questionId) {
              return {
                ...q,
                answers: (q.answers || []).map((ans) => (ans.id === answerId ? { ...ans, ...updatedAnswer } : ans)),
              };
            }
            return q;
          }),
        }));
      }
    } catch (err) {
      console.error("[CommunityStore] toggleUpvoteAnswer error:", err);
    }
  },

  markBestAnswerApi: async (questionId, answerId) => {
    try {
      const res = await authFetch(`/lms/community/questions/${questionId}/solve`, {
        method: "PATCH",
        body: JSON.stringify({ answerId }),
      });
      if (res.ok) {
        const updated = await res.json();
        set((state) => ({
          questions: state.questions.map((q) => (q.id === questionId ? { ...q, ...updated } : q)),
        }));
      }
    } catch (err) {
      console.error("[CommunityStore] markBestAnswer error:", err);
    }
  },

  sendChatMessageApi: async (channelId, text) => {
    try {
      const targetChannel = channelId === "all" ? "general" : channelId;
      const res = await authFetch(`/lms/community/chat/${targetChannel}`, {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const newMsg = await res.json();
        set((state) => ({ chatMessages: [...state.chatMessages, newMsg] }));
        return newMsg;
      }
    } catch (err) {
      console.error("[CommunityStore] sendChatMessage error:", err);
    }
    return null;
  },
}));
