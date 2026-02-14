# Gamified Social Learning Platform - Project Context

## Project Overview

A modern AI-powered educational web platform that combines personalized learning with social engagement and game mechanics. Think **Duolingo meets Notion** - beautiful design, intelligent content generation, and collaborative learning experiences.

### Core Concept
Students join classes using invite codes, progress through visual "learning tracks" (Candy Crush-style level maps), and see their classmates' progress in real-time. Teachers upload course materials (PDFs), and AI automatically generates personalized quizzes and exercises. The platform tracks performance, identifies weaknesses, and recommends lessons based on both individual needs and similar students' success patterns.

---

## Key Features

### 1. **User Management & Authentication**
- **Dual Roles**: Teachers and Students with role-based access
- **Secure Authentication**: JWT-based auth with bcrypt password hashing
- **User Profiles**: Avatars, stats, achievements, XP levels
- **Social Features**: See classmates, follow learners, compare progress

### 2. **Class System (Google Classroom Style)**
- Teachers create classes with unique invite codes (e.g., "MATH2025")
- Students join as either **Students** or **Visitors**
- Multiple students per class, multiple classes per student
- Teacher dashboard to monitor entire class performance

### 3. **Course Management**
- Teachers upload PDF course materials
- Files stored in cloud (AWS S3 / Cloudinary)
- Organized by Subject → Track → Lessons hierarchy
- AI parses PDFs to generate lesson content

### 4. **Learning Tracks (Main Feature)**
**Visual Design**: Animated, winding path like Candy Crush level selection
- **Nodes/Pins**: Represent individual lessons
- **Sequential Unlocking**: Complete lesson N to unlock lesson N+1
- **Progress Indicators**: Stars, checkmarks, completion percentage
- **Real-time Social**: Student avatars appear on nodes showing where classmates are
- **Smooth Animations**: Parallax scrolling, hover effects, animated transitions
- **Leaderboard Sidebar**: See class rankings and friend positions

### 5. **AI-Powered Lesson Generation**
**Three Lesson Types**:
- **Multiple Choice Quizzes**: AI-generated questions with 4 options
- **Yes/No Questions**: True/false with explanations
- **Short Answer**: Open-ended questions with keyword matching

**AI Capabilities**:
- Auto-generate lessons from course PDFs
- Adjust difficulty dynamically (1=easy, 2=medium, 3=hard)
- Regenerate questions based on student mistakes
- Semantic understanding of student answers

### 6. **Performance Analytics & Progress Tracking**
- **Attempt History**: All student attempts with identified weaknesses
- **Completion Records**: Final scores, attempts count, time spent
- **Performance Trends**: Visual charts showing progress over time
- **Weakness Detection**: AI identifies struggling topics (e.g., "algebra", "derivatives")
- **Strength Recognition**: Highlights areas of mastery

### 7. **Personalized Recommendations**
**Powered by Vector Similarity Search (pgvector)**:
- **Weakness-Based**: Recommend lessons targeting identified weak areas
- **Collaborative Filtering**: Suggest lessons that similar students succeeded on
- **Content Similarity**: Find related lessons based on semantic content
- **AI Chatbot**: Personalized learning path suggestions

### 8. **Gamification System**
- **XP & Levels**: Earn points for completing lessons, unlock levels
- **Achievements/Badges**: "First Steps", "Week Warrior", "Perfect Score"
- **Streaks**: Daily activity tracking (current & longest streak)
- **Leaderboards**: Class-wide and friend-based rankings
- **Difficulty Multipliers**: Harder lessons = more XP

### 9. **AI Learning Assistant (Chatbot)**
- Conversational AI for academic support
- Explains concepts from course material
- Answers questions about lessons
- Provides study strategy guidance
- Context-aware (knows student's progress and weaknesses)

### 10. **Teacher Dashboard**
- Class performance overview
- Individual student analytics
- Identify at-risk students early
- Generate custom lesson sequences
- Track engagement metrics

---

## Technology Stack

Always follow the best practices for each technology based on its official documentation.
Supabase: https://supabase.com/docs
NextJst: https://nextjs.org/docs
Tailwind CSS: https://tailwindcss.com/docs
Prisma: https://www.prisma.io/docs
NextAuth: https://next-auth.js.org/getting-started

### **Frontend**
```
Framework: React.js 18+ (Functional Components, Hooks)
Styling: Tailwind CSS (utility-first, minimal @apply)
Animations: Framer Motion / React Spring
Routing: React Router v6
State Management: Zustand or Context API
API Client: Axios
Form Validation: React Hook Form + Joi/Zod
Charts: Recharts / Chart.js
Icons: Lucide React (minimal usage)
```

### **Backend**
```
Runtime: Node.js 18+
Framework: Express.js or FastAPI (Python)
Database ORM: Prisma (TypeScript-first)
Database: PostgreSQL 14+ with pgvector extension
Authentication: JWT (jsonwebtoken)
Password Hashing: bcryptjs (salt rounds >= 10)
File Upload: Multer + AWS S3 / Cloudinary
PDF Parsing: pdf-parse
Validation: Joi
```

### **AI & Machine Learning**
```
LLM API: OpenAI GPT-4o-mini / GPT-4o
Embeddings: OpenAI text-embedding-3-small (384 dimensions)
Vector Database: pgvector (PostgreSQL extension)
Vector Indexes: IVFFLAT for similarity search
NLP Tasks: Quiz generation, answer analysis, chatbot
Recommendation Engine: Collaborative filtering + content-based
```

### **Database Schema**
```
Primary: PostgreSQL with Prisma ORM
Extensions: pgvector for vector similarity
Vector Columns:
  - lessons.contentEmbedding (384d) → similar lesson search
  - studentAttributes.behaviorEmbedding (384d) → similar student matching
Key Tables:
  - users (teachers + students)
  - classes, enrollments
  - subjects, courses, tracks, lessons
  - lessonAttempts, lessonCompletions
  - studentAttributes (weaknesses, strengths, XP, streaks)
  - achievements, userAchievements
  - lessonRecommendations
  - chatMessages
```

### **File Storage**
```
Options: AWS S3 or Cloudinary
Stored: PDF course materials, user avatars, achievement badges
Access: Pre-signed URLs for secure access
```

### **Development Tools**
```
Package Manager: npm
Database Management: Prisma Studio, psql CLI
API Testing: Postman / Thunder Client
Version Control: Git
Environment: dotenv
```

---

## Design Requirements (CRITICAL)

### **Design Philosophy: Modern & Clean**
- **Inspiration**: Notion, Linear, Stripe, Duolingo
- **NOT**: Generic AI designs with excessive cards, gradients, and icons

### **Visual Style**
```css
Color Palette:
  - Primary: Modern blues (#2563EB, #3B82F6) or purples (#7C3AED, #8B5CF6)
  - Neutral: Clean grays (#F9FAFB → #111827)
  - Accent: Success #10B981, Warning #F59E0B, Error #EF4444
  
Typography:
  - Fonts: Inter, SF Pro, Segoe UI (system fonts)
  - Clear hierarchy with weights (400, 500, 600, 700)
  
Spacing:
  - Consistent 4px/8px grid system
  
Borders & Shadows:
  - 1px solid with low opacity (#E5E7EB)
  - Subtle shadows (shadow-sm, shadow-md)
  - Rounded corners: 6-8px (rounded-md, rounded-lg)
  
Interactions:
  - Smooth transitions (200-300ms)
  - Subtle hover states
  - Loading skeletons (not spinners)
```

### **Component Guidelines**
**DO**:
- Use subtle borders and background color shifts instead of cards
- Typography-driven layouts with smart spacing
- Selective icon usage (only where they add clarity)
- White space for breathing room
- Smooth animations on Track View

**DON'T**:
- Overuse cards (max 1-2 per view)
- Heavy gradients (unless extremely subtle)
- Icon spam (avoid decorative icons)
- Crowded interfaces
- Basic AI aesthetics

### **Track View Design (Centerpiece)**
```
Layout: Vertical or diagonal winding path
Nodes: Circular pins (soft shadows, hover animations)
Background: Subtle texture or very light gradient (sky→ground)
Student Avatars: Small circles (32-40px) around active nodes
Animations:
  - Floating animation on nodes
  - Smooth scroll transitions
  - Path reveal animation on load
  - Confetti on lesson completion
Progress: Clean progress bar (not overly decorative)
```

---

## Database Schema Highlights

### **Key Tables & Relationships**

```
User (1) ────→ (N) Class [as Teacher]
User (N) ←───→ (N) Class [via Enrollments, as Student]
Class (1) ────→ (N) Subject
Subject (1) ───→ (N) Track
Track (1) ─────→ (N) Lesson [ordered by position]
Lesson (1) ────→ (N) LessonAttempt
Lesson (1) ────→ (N) LessonCompletion [1 per user]
User (1) ──────→ (N) StudentAttribute [1 per class]
```

### **JSON Field Structures**

**Lesson Content** (varies by type):
```json
// Quiz
{
  "question": "What is 2+2?",
  "options": ["2", "3", "4", "5"],
  "correctAnswer": 2,
  "explanation": "2 plus 2 equals 4"
}

// Yes/No
{
  "question": "Is Earth flat?",
  "correctAnswer": false,
  "explanation": "Earth is an oblate spheroid"
}

// Short Answer
{
  "question": "Explain photosynthesis",
  "sampleAnswers": ["Plants convert sunlight..."],
  "keywords": ["chlorophyll", "sunlight", "glucose"]
}
```

**Student Weaknesses/Strengths**:
```json
{
  "weaknesses": [
    {
      "attribute": "algebra",
      "severity": 0.8,
      "lastSeen": "2025-02-13T10:30:00Z",
      "occurrences": 5
    }
  ],
  "strengths": [
    {
      "attribute": "geometry",
      "confidence": 0.9,
      "demonstratedIn": ["lesson-123", "lesson-456"]
    }
  ]
}
```

---

## AI-Powered Features (Technical Detail)

### **1. Quiz Generation Flow**
```
1. Teacher uploads PDF course material
2. Backend extracts text with pdf-parse
3. Send chunks to OpenAI GPT-4o-mini with prompt:
   "Generate 5 multiple choice questions from this content..."
4. Parse JSON response
5. Store lessons with difficulty levels
6. Generate embeddings for semantic search
```

### **2. Vector Similarity Search**
```sql
-- Find similar lessons
SELECT 
  l.id, l.title,
  l.content_embedding <=> $1::vector AS distance
FROM lessons l
WHERE l.content_embedding IS NOT NULL
ORDER BY distance
LIMIT 5;

-- Find students with similar learning behavior
SELECT 
  sa.user_id, u.first_name,
  sa.behavior_embedding <=> $1::vector AS distance
FROM student_attributes sa
JOIN users u ON u.id = sa.user_id
WHERE sa.class_id = $2
ORDER BY distance
LIMIT 5;
```

### **3. Personalized Recommendation Algorithm**
```javascript
function recommendLessons(userId, classId) {
  // Step 1: Get student weaknesses
  const weaknesses = getStudentWeaknesses(userId, classId);
  
  // Step 2: Find lessons targeting weaknesses
  const weaknessLessons = findLessonsByAttributes(weaknesses);
  
  // Step 3: Find similar students via vector search
  const similarStudents = findSimilarStudents(userId, classId);
  
  // Step 4: Get lessons they succeeded on
  const collaborativeLessons = getLessonsFromSimilarStudents(similarStudents);
  
  // Step 5: Merge and rank recommendations
  return rankRecommendations([...weaknessLessons, ...collaborativeLessons]);
}
```

### **4. Weakness Detection**
```javascript
// After each lesson attempt
function detectWeaknesses(lessonAttempt) {
  if (!lessonAttempt.isCorrect) {
    const lessonAttributes = lessonAttempt.lesson.targetAttributes;
    
    // Increment weakness severity
    updateStudentWeaknesses(
      userId, 
      lessonAttributes,
      severity: calculateSeverity(attemptHistory)
    );
    
    // Update behavior embedding
    regenerateBehaviorEmbedding(userId, classId);
  }
}
```

---

## Key User Flows

### **Student Journey**
```
1. Register → Select role (Student)
2. Enter class invite code → Join class
3. Browse available tracks (Candy Crush UI)
4. Click first unlocked lesson
5. Complete quiz/exercise
6. Receive XP, unlock next lesson
7. See classmates' progress on track
8. Get personalized recommendations
9. Ask AI chatbot for help
10. Check leaderboard, earn badges
```

### **Teacher Journey**
```
1. Register → Select role (Teacher)
2. Create class → Get invite code
3. Create subject (e.g., "Calculus I")
4. Upload PDF course material
5. AI generates lesson suggestions
6. Customize lessons, adjust difficulty
7. Arrange lessons in track (drag-drop)
8. Publish track
9. Monitor student progress via dashboard
10. Identify struggling students, intervene
```

---

## Project Structure

```
/learning-platform
├── /frontend                    # React application
│   ├── /src
│   │   ├── /components
│   │   │   ├── /common          # Button, Input, Modal, Card
│   │   │   ├── /layout          # Navbar, Sidebar, Footer
│   │   │   ├── /track           # TrackView, TrackNode, StudentAvatar
│   │   │   ├── /quiz            # QuizCard, QuestionDisplay, AnswerInput
│   │   │   ├── /dashboard       # PerformanceChart, StatsCard, Leaderboard
│   │   │   └── /chat            # ChatBot, MessageBubble
│   │   ├── /pages
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── TeacherDashboard.jsx
│   │   │   ├── TrackView.jsx     # MAIN FEATURE
│   │   │   ├── LessonPage.jsx
│   │   │   ├── QuizPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   ├── /hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useQuiz.js
│   │   │   ├── useTrack.js
│   │   │   └── useRecommendations.js
│   │   ├── /utils
│   │   │   ├── api.js            # Axios instance
│   │   │   └── helpers.js
│   │   ├── /styles
│   │   │   └── global.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── /backend                      # Node.js/Express API
│   ├── /routes
│   │   ├── auth.js               # Login, register, JWT
│   │   ├── classes.js            # Create, join, invite codes
│   │   ├── courses.js            # Upload PDFs, manage materials
│   │   ├── tracks.js             # CRUD tracks
│   │   ├── lessons.js            # Get lessons, attempt, complete
│   │   ├── recommendations.js    # AI-powered suggestions
│   │   ├── users.js              # Profile, stats, achievements
│   │   └── chat.js               # AI chatbot endpoints
│   ├── /controllers
│   │   ├── authController.js
│   │   ├── lessonController.js
│   │   └── ...
│   ├── /models                   # Prisma models (auto-generated)
│   ├── /middleware
│   │   ├── auth.js               # JWT verification
│   │   └── validation.js         # Joi schemas
│   ├── /services
│   │   ├── aiService.js          # OpenAI API wrapper
│   │   ├── quizGenerator.js      # PDF → Quiz logic
│   │   ├── vectorService.js      # Embedding generation
│   │   └── recommendationEngine.js
│   ├── /utils
│   │   ├── vectorUtils.js        # pgvector helpers
│   │   ├── pdfParser.js
│   │   └── fileUpload.js         # S3/Cloudinary
│   ├── /config
│   │   ├── database.js
│   │   └── env.js
│   ├── server.js
│   └── package.json
│
├── /prisma
│   ├── schema.prisma             # Database schema
│   └── seed.js                   # Sample data
│
├── /database
│   └── database-setup.sql        # pgvector initialization
│
├── .env.example
├── .gitignore
└── README.md
```

---

## Security Considerations

1. **Authentication**:
   - JWT tokens with 7-day expiration
   - HttpOnly cookies for token storage
   - Refresh token rotation
   - Password requirements: min 8 chars, complexity

2. **Authorization**:
   - Role-based access control (RBAC)
   - Teachers can only modify their own classes
   - Students can only access enrolled classes

3. **Input Validation**:
   - Joi/Zod schemas for all endpoints
   - SQL injection protection (Prisma ORM)
   - XSS prevention (React auto-escaping)
   - File upload validation (type, size limits)

4. **Rate Limiting**:
   - AI endpoints: 10 requests/minute
   - Login: 5 attempts/15 minutes
   - File uploads: 5 files/hour

5. **Data Privacy**:
   - Encrypt passwords with bcrypt (salt rounds = 10)
   - Sanitize user inputs
   - CORS configuration (whitelist frontend domain)
   - Don't expose sensitive data in API responses

---

## Performance Optimization

1. **Database**:
   - Proper indexing (user lookups, track navigation)
   - Connection pooling (max 10 connections)
   - Query optimization (use `select`, avoid `include` nesting)
   - Vector index: IVFFLAT with 100 lists

2. **Frontend**:
   - Code splitting (React.lazy)
   - Memoization (React.memo, useMemo)
   - Virtual scrolling for long lesson lists
   - Optimistic UI updates
   - Image lazy loading

3. **API**:
   - Response compression (gzip)
   - Caching (Redis for frequent queries)
   - Batch API calls
   - Pagination (limit 20 items per page)

4. **AI**:
   - Cache embeddings (don't regenerate)
   - Batch embedding generation
   - Use smaller models (GPT-4o-mini vs GPT-4o)

---

## Testing Strategy

1. **Unit Tests**: Jest for business logic
2. **Integration Tests**: Supertest for API endpoints
3. **E2E Tests**: Playwright for critical user flows
4. **Database Tests**: Separate test database
5. **AI Tests**: Mock OpenAI responses

---

## Deployment

**Frontend**: Vercel / Netlify
**Backend**: Railway / Render / DigitalOcean
**Database**: Supabase / Neon / AWS RDS
**File Storage**: AWS S3 / Cloudinary
**CI/CD**: GitHub Actions

---

## Success Criteria

✅ Fully functional auth system
✅ Beautiful, animated Track View (Candy Crush style)
✅ AI quiz generation from PDFs works
✅ Real-time student progress visibility
✅ Vector-based recommendations accurate
✅ Responsive design (desktop, tablet, mobile)
✅ Clean, modern UI (no generic AI look)
✅ Performance optimized (<2s page loads)
✅ Production-ready code (error handling, validation)

---

## MVP vs Full Feature Set

**MVP (12-hour hackathon scope)**:
- Core auth (login, register)
- Simple class creation & join
- Basic track view (static, not fully animated)
- Manual lesson creation (no AI yet)
- Quiz taking & scoring
- Basic progress tracking

**Full Platform** (production-ready):
- AI quiz generation from PDFs
- Vector-based recommendations
- Full gamification (XP, badges, streaks)
- AI chatbot assistant
- Advanced analytics dashboard
- Animated Candy Crush track
- Real-time social features

---

This context document provides everything needed to build the platform. Focus on clean design, solid architecture, and making the Track View absolutely stunning!

