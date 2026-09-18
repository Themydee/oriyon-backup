# Oriyon International — Frontend

This repository is the Next.js frontend for the Oriyon International learning platform.
It is built with React, the App Router, and connects to the backend via the API gateway in `../oriyon-backend/services/api-gateway`.

## Project Structure

- `app/learn/lms/dashboard/page.tsx` — student dashboard
- `app/learn/lms/week12/page.tsx` — week 12 learning page
- `app/learn/lms/exam/[examId]/page.tsx` — dedicated exam attempt page
- `app/learn/lms/exam/session/[sessionId]/result/page.tsx` — exam result page
- `app/admin/curriculum/page.tsx` — admin curriculum overview
- `app/admin/curriculum/[weekId]/lessons` — lesson management
- `app/admin/curriculum/[weekId]/quiz` — quiz management

## Key Features

- Authenticated student portal using JWT access and refresh tokens
- Weekly curriculum with lessons and progress tracking
- Dedicated exam experience separate from weekly lesson flow
- Exam sessions with autosave, timer, submission, and result pages
- Admin curriculum management links for lessons, quizzes, and exams

## Environment

The frontend expects the backend gateway URL in:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
```

## Useful Commands

```bash
npm run lint
npm run type-check
npm run dev
```

## Exam Flow

Exams are exposed on their own route and not mixed into the weekly lesson pages.
The learner experience includes:

- `GET /learn/lms/exam/[examId]` — exam rules, start button, timer, and question UI
- `POST /learn/lms/exams/:id/sessions/start` — start an exam session
- `PATCH /learn/lms/exams/sessions/:id/autosave` — autosave answers every 30 seconds
- `POST /learn/lms/exams/sessions/:id/submit` — submit answers and receive MCQ/pending status
- `GET /learn/lms/exam/session/[sessionId]/result` — view exam submission status and scores

## Notes

- The exam is designed to occur after the main weekly curriculum, separate from lesson progress.
- The frontend uses a dedicated exam page rather than embedding the exam flow in a weekly page.
- This README is paired with the backend README in `../oriyon-backend/README.md`.
