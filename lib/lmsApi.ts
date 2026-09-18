import { authFetch } from "./api";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Lesson {
  id: string;
  weekId: string;
  title: string;
  type: string;
  content: string;
  hours: number;
  location: string;
  videoUrl?: string;
  audioUrl?: string;
  body?: string;
}

export interface ProgressRecord {
  lessonId: string;
  completedAt: string;
  durationLogged: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number; // Only returned on results page or internal
}

export interface ExamQuestion {
  id: string;
  type: "mcq" | "short_answer" | "essay";
  questionText: string;
  options: string[];
  correctOptionIndex?: number; // Only for MCQ
  marks: number;
  orderIndex: number;
}

export interface QuizResult {
  score: number;
  passed: boolean;
  correctAnswers: Record<string, number>;
}

// ─── API Service ─────────────────────────────────────────────────────────────

export const lmsApi = {
  /**
   * Fetch a specific lesson's content and metadata
   */
  async getLesson(lessonId: string): Promise<Lesson> {
    const res = await authFetch(`/lms/lessons/${lessonId}`);
    if (!res.ok) throw new Error(`Failed to fetch lesson: ${res.statusText}`);
    return res.json();
  },

  /**
   * Mark a lesson as complete in the backend
   */
  async markLessonComplete(lessonId: string): Promise<{ status: string }> {
    const res = await authFetch(`/lms/progress`, {
      method: "POST",
      body: JSON.stringify({ lessonId }),
    });
    if (!res.ok) throw new Error(`Failed to mark progress: ${res.statusText}`);
    return res.json();
  },

  /**
   * Fetch the quiz questions for a given week
   */
  async getWeeklyQuiz(weekId: string): Promise<QuizQuestion[]> {
    const res = await authFetch(`/lms/weeks/${weekId}/quiz`);
    if (!res.ok) throw new Error(`Failed to fetch quiz: ${res.statusText}`);
    return res.json();
  },

  /**
   * Submit quiz answers for evaluation
   */
  async submitQuiz(weekId: string, answers: Record<string, string>): Promise<QuizResult> {
    const res = await authFetch(`/lms/quiz/submit`, {
      method: "POST",
      body: JSON.stringify({ weekId, answers }),
    });
    if (!res.ok) throw new Error(`Failed to submit quiz: ${res.statusText}`);
    return res.json();
  },

  /**
   * Get current user's overall LMS progress
   */
  async getUserProgress(userId: string): Promise<ProgressRecord[]> {
    const res = await authFetch(`/lms/progress/${userId}`);
    if (!res.ok) throw new Error(`Failed to fetch progress: ${res.statusText}`);
    return res.json();
  },

  /**
   * Get all questions for an exam
   */
  async getExamQuestions(examId: string): Promise<ExamQuestion[]> {
    const res = await authFetch(`/lms/exams/${examId}/questions`);
    if (!res.ok) throw new Error(`Failed to fetch exam questions: ${res.statusText}`);
    return res.json();
  },

  /**
   * Add a new question to an exam
   */
  async addExamQuestion(examId: string, question: {
    type: "mcq" | "short_answer" | "essay";
    questionText: string;
    options?: string[];
    correctOptionIndex?: number;
    marks: number;
    orderIndex: number;
  }): Promise<ExamQuestion> {
    const res = await authFetch(`/lms/exams/${examId}/questions`, {
      method: "POST",
      body: JSON.stringify(question),
    });
    if (!res.ok) throw new Error(`Failed to add question: ${res.statusText}`);
    return res.json();
  },

  /**
   * Update an existing exam question
   */
  async updateExamQuestion(questionId: string, updates: Partial<{
    type: "mcq" | "short_answer" | "essay";
    questionText: string;
    options: string[];
    correctOptionIndex: number;
    marks: number;
    orderIndex: number;
  }>): Promise<ExamQuestion> {
    const res = await authFetch(`/lms/exams/questions/${questionId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error(`Failed to update question: ${res.statusText}`);
    return res.json();
  },

  /**
   * Delete an exam question
   */
  async deleteExamQuestion(questionId: string): Promise<void> {
    const res = await authFetch(`/lms/exams/questions/${questionId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error(`Failed to delete question: ${res.statusText}`);
  },
};
