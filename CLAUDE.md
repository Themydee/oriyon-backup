# CLAUDE.md — Oriyon International Frontend Integration Guide

This file gives Claude full context about the Oriyon International backend and frontend design system so it can generate accurate, on-brand integration code for the Next.js frontend.

---

## Project Overview

**Oriyon International** is a livestock training platform. The main programme is called **EEWYLA** (Economic Empowerment of Women and Youth in Livestock Agriculture). The backend is a Node.js/TypeScript microservices system. The frontend is **Next.js** and communicates exclusively through the **API Gateway** on port `3000` (or `https://api.oriyoninternational.com` in production).

Never call individual services directly. All requests go through the gateway.

---

## Base URL

```ts
// Development
const API_BASE = "http://localhost:3000/api";

// Production
const API_BASE = "https://api.oriyoninternational.com/api";
```

Use an environment variable:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

---

## Design System

### Brand Identity

Oriyon is a serious, mission-driven agribusiness. The visual language is **clean, grounded, and agricultural** — not flashy or tech-startup generic. Think institutional credibility with African context.

### Color Palette

Derive exact values from the existing Tailwind config. Based on the live site, the palette is:

| Role | Description |
|---|---|
| Primary green | Deep forest/olive green — used for CTAs, headings, accents |
| Off-white / cream | Page backgrounds, card surfaces |
| Dark text | Near-black for body copy |
| White | Used inside dark/green sections |
| Subtle border | Light grey for dividers and input borders |

When generating new UI, always use CSS variables and reference the existing Tailwind config. Do **not** introduce new arbitrary colors — match what is already in the codebase.

### Typography

- **Headings**: Large, confident — hero headings are bold and multi-line
- **Body**: Clean, readable sans-serif
- **Labels / Tags**: Uppercase tracking for section labels (e.g. "The Problem", "Our Solutions")
- Do **not** introduce new font families — use whatever is already configured in the project

### Layout Patterns

Observed across the live site:

- **Full-bleed hero sections** with background images and overlaid text + CTA buttons
- **Two-column splits**: image left / content right (or reversed) for feature/solution sections
- **Card grids**: used for "Who we work with", testimonials, programme step cards
- **Numbered step lists**: used on the EEWYLA page for the training journey (1 → 5 steps)
- **Marquee / ticker**: scrolling "Trace it. Track it. Trust it. Trade it." strip between sections
- **Orbit/radial graphic**: decorative concentric circle diagram on homepage
- **Full-width footer**: 4-column link grid + newsletter subscription form

### Component Conventions

- **CTA buttons**: two variants — primary (green filled) and secondary (outline/ghost). Text is action-oriented: "Apply for EEWYLA Training", "Learn How Our Model Works"
- **Section labels**: small uppercase text above the main section heading (e.g. "The Problem" sits above "Why the livestock system isn't working")
- **Hero CTAs**: always appear in pairs — one primary action, one secondary/informational
- **Images**: real photography — farmers, livestock, training sessions. Never placeholder illustrations
- **Forms**: minimal, clean. Labels above inputs. No floating labels. Submit button is green

### LMS Portal Design (`/learn/lms`)

The LMS portal has its **own distinct visual identity** — it is a standalone app within the site:

- Dark/branded background with the Oriyon footer logo
- A hero image of livestock training at the top
- Centered login card with: email input, password input (with visibility toggle 👁), "Sign In" button
- Cohort context shown above form: "Oyo State Programme • Cohort A"
- Support email link: `eewyla@oriyoninternational.com`
- Copyright line: "© Oriyon International"

When building LMS portal pages (dashboard, lessons, progress), maintain this **separate visual identity** — do **not** use the main marketing site's nav/header. The LMS is a portal, not a marketing page.

---

## Page Map & Route Conventions

### Marketing / Public Pages

| Page | Route | Backend connection |
|---|---|---|
| Homepage | `/` | None (static) |
| What We Do | `/about` | None (static) |
| Our Model | `/model` | None (static) |
| EEWYLA | `/eewyla` | Links to application form |
| Training Program | `/learn/training` | None (static) |
| Blog | `/learn/blog` | None |
| Contact | `/contact` | `POST /api/contact` |
| Newsletter (footer) | — | `POST /api/newsletter/subscribe` |

### Auth Pages

| Page | Route | Backend connection |
|---|---|---|
| LMS Login | `/learn/lms` | `POST /api/auth/login` |
| First-time setup | `/auth/setup` | `POST /api/auth/set-password` |
| Forgot password | `/auth/forgot-password` | `POST /api/auth/forgot-password` |
| Reset password | `/auth/reset-password` | `POST /api/auth/reset-password` |

### Application Flow

| Page | Route | Backend connection |
|---|---|---|
| Apply for EEWYLA | `/apply` | `POST /api/applications` |

### LMS Portal (authenticated)

| Page | Route | Backend connection |
|---|---|---|
| Dashboard | `/learn/lms/dashboard` | `GET /api/lms/stats/summary` |
| Weeks / Curriculum | `/learn/lms/weeks` | `GET /api/lms/weeks` |
| Lesson view | `/learn/lms/lessons/:id` | `GET /api/lms/lessons/:id`, `POST /api/lms/progress` |
| My Progress | `/learn/lms/progress` | `GET /api/lms/progress/:userId` |
| Sessions | `/learn/lms/sessions` | `GET /api/lms/sessions?cohortId=&weekId=` |

### Admin Dashboard (authenticated, admin role)

| Page | Route | Backend connection |
|---|---|---|
| Applications list | `/admin/applications` | `GET /api/applications` |
| Application detail | `/admin/applications/:id` | `GET /api/applications/:id`, `PATCH /api/applications/:id` |
| Users | `/admin/users` | `GET /api/users` |
| Cohorts | `/admin/cohorts` | `GET /api/cohorts` |

---

## Authentication

The platform uses **JWT-based auth** with two tokens:

| Token | Expiry | Storage |
|---|---|---|
| Access token | 15 minutes | JS memory (React state or Zustand store) — **never localStorage** |
| Refresh token | 7 days | `localStorage` |

### Login flow

```ts
const res = await fetch(`${API_BASE}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const { accessToken, refreshToken } = await res.json();

localStorage.setItem("refreshToken", refreshToken);
useAuthStore.setState({ accessToken });
```

### Attaching the access token

```ts
const authFetch = async (url: string, options: RequestInit = {}) => {
  const accessToken = useAuthStore.getState().accessToken;
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
};
```

### Silent token refresh on 401

```ts
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) throw new Error("No refresh token");

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    localStorage.removeItem("refreshToken");
    useAuthStore.setState({ accessToken: null });
    throw new Error("Session expired");
  }

  const { accessToken } = await res.json();
  useAuthStore.setState({ accessToken });
  return accessToken;
};
```

### Logout

```ts
await fetch(`${API_BASE}/auth/logout`, {
  method: "POST",
  body: JSON.stringify({ refreshToken: localStorage.getItem("refreshToken") }),
});
localStorage.removeItem("refreshToken");
useAuthStore.setState({ accessToken: null });
```

---

## User Journey — How Accounts Are Created

**Users cannot self-register.** There is no sign-up page. The full onboarding flow is:

```
1. Applicant fills out EEWYLA application form  →  POST /api/applications
2. Admin approves application in dashboard       →  PATCH /api/applications/:id
3. Backend auto-creates user profile + auth record
4. System emails user a one-time setup link (24hr expiry)
5. User clicks link → /auth/setup?token=xxx      →  POST /api/auth/set-password
6. User is logged in automatically → redirect to /learn/lms/dashboard
```

---

## Auth Routes (Public — no Bearer token)

### Submit EEWYLA application
```ts
POST /api/applications
Body: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  // ...other programme-specific fields
}
```

### First-time password setup
```ts
POST /api/auth/set-password
Body: { token: string; password: string }
// Response: { accessToken, refreshToken }
// Immediately store tokens and redirect to /learn/lms/dashboard
```

### Login
```ts
POST /api/auth/login
Body: { email: string; password: string }
// Response: { accessToken, refreshToken }
```

### Forgot / Reset password
```ts
POST /api/auth/forgot-password  Body: { email: string }
POST /api/auth/reset-password   Body: { token: string; password: string }
POST /api/auth/refresh          Body: { refreshToken: string }
POST /api/auth/logout           Body: { refreshToken: string }
```

---

## Protected Routes (Bearer token required)

```ts
PATCH  /api/auth/change-password   Body: { currentPassword, newPassword }

GET    /api/users
GET    /api/users/:id
PATCH  /api/users/:id

POST   /api/cohorts/:id/enrol

GET    /api/lms/weeks
GET    /api/lms/weeks/:id
GET    /api/lms/lessons/:id
POST   /api/lms/progress              // mark lesson complete
GET    /api/lms/progress/:userId
GET    /api/lms/sessions?cohortId=xxx&weekId=yyy
GET    /api/lms/stats/summary

GET    /api/applications              // admin only
PATCH  /api/applications/:id          // admin only — { status: "approved" | "rejected" }
```

---

## Newsletter & Contact (Public)

```ts
// Newsletter — collect all three fields, not just email
POST /api/newsletter/subscribe
Body: { firstName: string; lastName: string; email: string }

DELETE /api/newsletter/unsubscribe
Body: { email: string }

// Contact — includes phone field
POST /api/contact
Body: { firstName: string; lastName: string; phone: string; email: string; message: string }
```

---

## Error Handling Convention

| Status | Meaning | UI Action |
|---|---|---|
| `400` | Validation error | Show field-level errors from `error` in response body |
| `401` | Unauthorized | Attempt silent refresh; if that fails, redirect to `/learn/lms` |
| `403` | Forbidden | Show "access denied" message |
| `404` | Not found | Show empty state or redirect |
| `409` | Conflict (e.g. duplicate email) | Show specific message |
| `500` | Server error | Show generic error toast |

Standard error shape: `{ "error": "Human-readable message" }`

---

## Recommended Frontend State Architecture

```
/store
  authStore.ts      ← accessToken (memory only), user info, role
  uiStore.ts        ← modals, toasts, loading states

/lib
  api.ts            ← base authFetch wrapper with silent refresh logic
  constants.ts      ← API_BASE_URL

/hooks
  useAuth.ts
  useApplications.ts
  useCohorts.ts
  useLMS.ts
```

---

## Known Mismatches — Fix These

These are confirmed gaps between the live site and what the backend expects. Claude should flag and fix these whenever it encounters them in the codebase.

### 🔴 1. "Register" button in the nav is unwired
The main site nav has a **"Register" button** visible on every marketing page. It should link to `/apply`. Confirm it routes there and not to a dead href or `#`.

### 🔴 2. "Apply for EEWYLA Training" CTAs are unwired
This CTA appears on the homepage hero, EEWYLA page, and other sections. Every instance must link to `/apply`. Audit all occurrences.

### 🔴 3. LMS demo access buttons bypass real auth
The LMS login page at `/learn/lms` has hardcoded **"Demo Access" buttons** (trainee / trainer). These must either:
- Be removed in production, or
- Be wired to real login credentials via `POST /api/auth/login`

Never bypass authentication. Do not use them to mock a logged-in state client-side.

### 🟡 4. Newsletter form must send firstName + lastName
The footer newsletter form collects First Name, Last Name, and Email. The `POST /api/newsletter/subscribe` payload must include all three. If only email is currently being sent, fix the form handler.

### 🟡 5. Contact form must include phone
The live contact form collects First Name, Last Name, **Phone Number**, Email, and Message. Ensure `POST /api/contact` includes the `phone` field. If it is missing from the request body, add it.

### 🟡 6. No post-login redirect in the LMS
After `POST /api/auth/login` succeeds, the user must be redirected to `/learn/lms/dashboard`. If this redirect is missing or goes to the wrong route, fix it.

### 🔴 7. Password setup page may not exist
The backend sends a setup email with a link to `/auth/setup?token=xxx`. If this page does not exist, create it. It must:
- Read `token` from the URL query string
- Show a "Set your password" form (password + confirm password)
- Call `POST /api/auth/set-password` with `{ token, password }`
- On success, store tokens and redirect to `/learn/lms/dashboard`
- Use the **LMS portal visual style** (not the marketing nav/header)

### 🟡 8. Admin approval UI should update without full page reload
After `PATCH /api/applications/:id` resolves (approved or rejected), the admin UI should update the application status optimistically or refetch the list. The backend handles all downstream work (user creation, emails) automatically — the frontend only needs to reflect the new status.

---

## Key Rules for Code Generation

1. **Never store the access token in localStorage** — JS memory only.
2. **Never call service ports directly** (`:3001`, `:3002`, etc.) — always use the gateway on `:3000`.
3. **Refresh silently on 401** before redirecting to login.
4. **There is no self-registration** — do not generate a sign-up page or route.
5. **Application approval triggers all user setup automatically** — the frontend only calls `PATCH /api/applications/:id`.
6. **Sessions must always be queried with both `cohortId` and `weekId`** as query params.
7. **Progress records are seeded automatically on enrolment** — only POST to mark completion, never to create from scratch.
8. **LMS portal pages use a separate layout** — no main marketing nav/header inside `/learn/lms/*` routes.
9. **All new UI must match the existing design system** — deep green primary, off-white backgrounds, real photography, no generic gradients or stock icons.
10. **CTAs always come in pairs on marketing pages** — primary (filled green) + secondary (outline/ghost).
11. **Whenever you see a dead CTA, unwired button, or mismatched form field, fix it** — do not leave broken UI in place.