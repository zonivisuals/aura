# Aura — Technical Documentation

> AI-powered gamified social learning platform.  
> Students join classes, progress through visual learning tracks, and receive AI-generated quizzes and personalized tutoring.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)  
2. [Tech Stack](#tech-stack)  
3. [Project Structure](#project-structure)  
4. [Database Schema](#database-schema)  
5. [Authentication & Authorization](#authentication--authorization)  
6. [API Reference](#api-reference)  
7. [AI Services](#ai-services)  
8. [Gamification System](#gamification-system)  
9. [Getting Started](#getting-started)  
10. [Environment Variables](#environment-variables)  

---

## Architecture Overview

Aura is a two-service application:

```
┌─────────────────────────────┐       ┌──────────────────────────┐
│       Next.js (web/)        │       │   FastAPI (back/)         │
│                             │       │                          │
│  • React 19 UI              │  HTTP │  • PDF quiz generation   │
│  • Server Components        │◄─────►│  • Recommendations       │
│  • API Routes (/api/*)      │       │  • AI personal tutor     │
│  • NextAuth authentication  │       │  • Google Gemini 2.5     │
│  • Prisma 7 ORM             │       │  • asyncpg direct SQL    │
└──────────┬──────────────────┘       └────────────┬─────────────┘
           │                                       │
           └──────────┐   ┌────────────────────────┘
                      ▼   ▼
              ┌───────────────────┐
              │  PostgreSQL       │
              │  (Supabase)       │
              │  + pgvector ext.  │
              └───────────────────┘
```

- **Next.js** handles all user-facing pages, auth, CRUD operations, and proxies AI requests.  
- **FastAPI** is a dedicated AI microservice — it reads PDFs, queries student data, and calls Google Gemini to generate educational content.  
- Both services share the same **PostgreSQL** database hosted on Supabase.

---

## Tech Stack

| Layer          | Technology                                                    |
|----------------|---------------------------------------------------------------|
| Frontend       | React 19, Next.js (App Router), Tailwind CSS, Framer Motion  |
| UI Components  | Radix UI primitives, shadcn/ui, Recharts                     |
| Auth           | NextAuth v5 (credentials provider), bcryptjs                 |
| ORM            | Prisma 7 with PrismaPg adapter                               |
| Database       | PostgreSQL 14+ (Supabase), pgvector extension                |
| AI Backend     | FastAPI, Google Gemini 2.5 Flash, pypdf                       |
| AI DB Access   | asyncpg (direct connection pooling)                           |
| Design System  | Hand-drawn aesthetic — Kalam + Patrick Hand fonts, wobbly borders, hard offset shadows |

---

## Project Structure

```
aura/
├── back/                          # Python AI microservice
│   └── main.py                    #   FastAPI app — 3 endpoints
│
├── web/                           # Next.js application
│   ├── app/
│   │   ├── api/                   # API route handlers
│   │   │   ├── ai/                #   AI proxy routes (generate-quiz, recommendations, tutor-quiz)
│   │   │   ├── auth/              #   NextAuth + signup
│   │   │   ├── classes/           #   Class CRUD, join by invite code
│   │   │   ├── subjects/          #   Subject, course, track management
│   │   │   ├── tracks/            #   Track lessons CRUD
│   │   │   ├── lessons/           #   Lesson fetch + attempt submission
│   │   │   ├── gamification/      #   Achievements, leaderboard, profile
│   │   │   └── analytics/         #   Student & class performance data
│   │   ├── student/               # Student pages (dashboard, classes, tracks, lessons, performance, profile, achievements)
│   │   ├── teacher/               # Teacher pages (dashboard, classes, tracks, analytics, profile)
│   │   ├── auth/                  # Login, sign-up, error pages
│   │   └── generated/prisma/      # Auto-generated Prisma client
│   │
│   ├── components/                # Shared UI components
│   │   ├── ui/                    #   Base components (Button, Input, Card, etc.)
│   │   ├── track/                 #   Track view (Candy Crush map)
│   │   ├── dashboard-layout.tsx   #   Top-bar navigation
│   │   └── leaderboard-panel.tsx  #   XP leaderboard
│   │
│   ├── lib/
│   │   ├── auth/                  #   NextAuth config + RBAC helpers
│   │   ├── prisma/                #   Prisma client singleton
│   │   ├── gamification.ts        #   XP, levels, streaks, achievement logic
│   │   └── scripts/               #   Database seeding scripts
│   │
│   └── prisma/
│       └── schema.prisma          # Full database schema (18 models)
```

---

## Database Schema

### Entity Relationship Overview

```
User ──1:N──► Class (as teacher)
User ◄─N:M──► Class (via Enrollment, as student)
Class ──1:N──► Subject
Subject ──1:N──► Course (PDF materials)
Subject ──1:N──► Track
Track ──1:N──► Lesson (ordered by position)
Lesson ──1:N──► LessonAttempt
Lesson ──1:N──► LessonCompletion (1 per user)
User ──1:N──► StudentAttribute (1 per class, stores XP/level/streaks/weaknesses)
User ◄─N:M──► Achievement (via UserAchievement)
User ──1:N──► LessonRecommendation
User ──1:N──► ChatMessage
```

### Key Models

| Model              | Purpose                                                     |
|--------------------|-------------------------------------------------------------|
| `User`             | Teachers and students. Email + password hash, role-based.   |
| `Class`            | Created by teachers with unique invite codes.               |
| `Enrollment`       | Links students to classes (type: STUDENT or VISITOR).       |
| `Subject`          | Academic subjects within a class.                           |
| `Course`           | PDF course materials uploaded by teachers.                  |
| `Track`            | Ordered sequence of lessons (publishable).                  |
| `Lesson`           | Individual exercise — QUIZ, YES_NO, or SHORT_ANSWER. Content stored as JSON. |
| `LessonAttempt`    | Every answer submission with score, correctness, and identified weaknesses. |
| `LessonCompletion` | One per user per lesson — created on first correct answer.  |
| `StudentAttribute` | Per-student-per-class stats: XP, level, streaks, weaknesses/strengths, behavior embedding. |
| `Achievement`      | Badge definitions with flexible JSON criteria.              |
| `UserAchievement`  | Earned badges with timestamp.                               |

### Vector Columns (pgvector)

- `lessons.content_embedding` — 384d vector for semantic lesson similarity search.
- `student_attributes.behavior_embedding` — 384d vector for similar-student matching.

---

## Authentication & Authorization

- **Provider**: NextAuth v5 with a Credentials provider (email + password).
- **Password hashing**: bcryptjs (salt rounds ≥ 10).
- **Session strategy**: JWT.
- **Roles**: `TEACHER` and `STUDENT` — enforced at the API route level.

### RBAC Helpers (`lib/auth/rbac.ts`)

| Function          | Description                                        |
|-------------------|----------------------------------------------------|
| `getCurrentUser()`| Returns authenticated user + Prisma profile.       |
| `requireAuth()`   | Redirects to login if unauthenticated.             |
| `requireStudent()`| Redirects if not a student.                        |
| `requireTeacher()`| Redirects if not a teacher.                        |

### API Route Pattern

Every API route follows the same pattern:
1. Call `auth()` to get the session.
2. Check `session.user.id` and `session.user.role`.
3. Verify resource ownership (teacher owns the class) or enrollment (student is enrolled).
4. Return `401`, `403`, or `404` as appropriate.

---

## API Reference

### Authentication

| Method | Endpoint                  | Auth | Description                     |
|--------|---------------------------|------|---------------------------------|
| POST   | `/api/auth/signup`        | —    | Register a new user             |
| POST   | `/api/auth/[...nextauth]` | —    | NextAuth sign-in / sign-out     |

### Classes

| Method | Endpoint               | Auth    | Description                    |
|--------|------------------------|---------|--------------------------------|
| GET    | `/api/classes`         | Any     | List user's classes            |
| POST   | `/api/classes`         | Teacher | Create a new class             |
| GET    | `/api/classes/[id]`    | Any     | Get class details              |
| POST   | `/api/classes/join`    | Student | Join a class via invite code   |

### Subjects, Courses, Tracks

| Method | Endpoint                                | Auth    | Description                       |
|--------|-----------------------------------------|---------|-----------------------------------|
| GET    | `/api/classes/[id]/subjects`            | Any     | List subjects in a class          |
| POST   | `/api/subjects/[subjectId]/courses`     | Teacher | Upload a course PDF               |
| GET    | `/api/subjects/[subjectId]/tracks`      | Any     | List tracks under a subject       |
| POST   | `/api/subjects/[subjectId]/tracks`      | Teacher | Create a track                    |

### Lessons

| Method | Endpoint                                   | Auth    | Description                         |
|--------|--------------------------------------------|---------|-------------------------------------|
| GET    | `/api/tracks/[trackId]/lessons`            | Any     | List lessons in a track             |
| POST   | `/api/tracks/[trackId]/lessons`            | Teacher | Create a lesson                     |
| DELETE | `/api/tracks/[trackId]/lessons/[lessonId]` | Teacher | Delete a lesson                     |
| GET    | `/api/lessons/[lessonId]`                  | Any     | Get lesson content (answers stripped for students) |
| POST   | `/api/lessons/[lessonId]/attempts`         | Student | Submit an answer attempt            |

### AI Services

| Method | Endpoint                    | Auth    | Description                                    |
|--------|-----------------------------|---------|-------------------------------------------------|
| POST   | `/api/ai/generate-quiz`     | Teacher | Upload PDF → AI generates MCQ questions         |
| GET    | `/api/ai/recommendations`   | Student | Get collaborative-filtering track recommendations |
| POST   | `/api/ai/tutor-quiz`        | Student | AI generates personalized practice quiz         |

### Gamification & Analytics

| Method | Endpoint                            | Auth    | Description                      |
|--------|-------------------------------------|---------|----------------------------------|
| GET    | `/api/gamification/profile`         | Any     | Get user's XP, level, streaks    |
| GET    | `/api/gamification/achievements`    | Any     | Get earned achievements          |
| GET    | `/api/gamification/leaderboard`     | Any     | Class XP leaderboard             |
| GET    | `/api/analytics/student/performance`| Student | Full performance dashboard data  |
| GET    | `/api/analytics/class/[classId]`    | Teacher | Class-wide analytics             |

---

## AI Services

The FastAPI backend (`back/main.py`) provides three AI-powered endpoints, proxied through Next.js API routes:

### 1. Quiz Generation (`POST /generate-quiz`)

**Flow:**  
Teacher uploads PDF → `pypdf` extracts text → text chunked → sent to Gemini 2.5 Flash → returns 5 MCQ questions as JSON.

**Response format:**
```json
{
  "questions": [
    {
      "question": "What is the derivative of x²?",
      "options": ["x", "2x", "2", "x²"],
      "correctAnswer": 1
    }
  ]
}
```

### 2. Recommendations (`GET /recommendations/{user_id}`)

**Algorithm (collaborative filtering):**
1. Find all classes the student is enrolled in.
2. Find classmates in those classes.
3. Query tracks that classmates have completed (via `lesson_completions`) but the current student hasn't.
4. Rank by completion count → return top 5.

### 3. AI Personal Tutor (`POST /ai/student-tutor/{user_id}`)

**Flow:**  
1. Fetch student's `identified_weaknesses` from all `lesson_attempts`.
2. Combine weaknesses + subject into a prompt.
3. Gemini generates a personalized practice quiz with difficulty labels and explanations.

**Response format:**
```json
{
  "title": "Algebra Practice",
  "questions": [
    {
      "question": "Solve: 3x + 5 = 20",
      "options": ["3", "5", "7", "15"],
      "correctIndex": 1,
      "explanation": "Subtract 5, then divide by 3: x = 5",
      "difficulty": "easy"
    }
  ]
}
```

---

## Gamification System

Defined in `lib/gamification.ts` and triggered in `POST /api/lessons/[lessonId]/attempts`.

### XP & Leveling

| Difficulty | XP Reward |
|------------|-----------|
| Easy (1)   | 10 XP     |
| Medium (2) | 20 XP     |
| Hard (3)   | 30 XP     |

Level thresholds grow progressively. XP is awarded **once per lesson** (on first correct completion).

### Streaks

- A streak increments when the student completes a lesson on a **new calendar day**.
- If a day is missed, the streak resets to 0.
- `longestStreak` is tracked separately.

### Achievements

12 seeded achievements checked automatically after every successful attempt:

| Achievement        | Criteria                      |
|--------------------|-------------------------------|
| First Steps        | Complete 1 lesson             |
| Getting Started    | Complete 5 lessons            |
| Scholar            | Complete 20 lessons           |
| Master Learner     | Complete 50 lessons           |
| Week Warrior       | 7-day streak                  |
| Month Master       | 30-day streak                 |
| Perfect Score      | Score 100% on any lesson      |
| XP Hunter          | Earn 100 XP                   |
| XP Champion        | Earn 500 XP                   |
| Level 5            | Reach level 5                 |
| Level 10           | Reach level 10                |
| Quick Thinker      | Complete a lesson in < 30s    |

### Lesson Unlocking

Lessons in a track are **sequentially locked**. Lesson N+1 unlocks only after the student has a `LessonCompletion` for lesson N.

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL database (or Supabase account)

### 1. Clone & install

```bash
git clone <repo-url> && cd aura

# Web application
cd web && npm install

# AI backend
cd ../back && pip install fastapi uvicorn pypdf google-generativeai asyncpg pydantic
```

### 2. Configure environment

Create `web/.env.local`:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
AUTH_SECRET="<generate with `npx auth`>"
AI_BACKEND_URL="http://localhost:8000"
```

### 3. Set up the database

```bash
cd web
npx prisma migrate deploy    # Apply migrations
npx prisma generate          # Generate Prisma client
npm run seed                 # Seed achievements + optional mock data
```

### 4. Start both services

```bash
# Terminal 1 — Next.js
cd web && npm run dev        # → http://localhost:3000

# Terminal 2 — AI Backend
cd back && python main.py    # → http://localhost:8000
```

### Test Accounts (after seeding mock data)

| Role    | Email                    | Password     |
|---------|--------------------------|--------------|
| Teacher | prof.adams@aura.school   | Teacher123!  |
| Student | alice.martin@aura.school | Student123!  |
| Student | bob.chen@aura.school     | Student123!  |
| Student | clara.dubois@aura.school | Student123!  |

---

## Environment Variables

| Variable           | Required | Description                              |
|--------------------|----------|------------------------------------------|
| `DATABASE_URL`     | Yes      | PostgreSQL connection (pooled / PgBouncer) |
| `DIRECT_URL`       | Yes      | Direct PostgreSQL connection (migrations)  |
| `AUTH_SECRET`      | Yes      | NextAuth JWT signing secret              |
| `AI_BACKEND_URL`   | No       | FastAPI backend URL (default: `http://localhost:8000`) |
