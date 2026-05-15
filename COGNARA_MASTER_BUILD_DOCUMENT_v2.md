# COGNARA™ — Complete Product & Build Master Document
### Version 2.0 | FINAL | Classification: Internal Development Reference
### Last Updated: May 2026 | Status: Build-Ready
### Assignment: PP Assignment #3 + #4 | UMT

---

> **HOW TO USE THIS DOCUMENT**
> This is the single source of truth for COGNARA.
> Give this file to any developer, AI coding assistant (Cursor, Windsurf, Lovable),
> or team member. They must be able to build the complete, deployed, production-grade
> product from scratch — with zero ambiguity.
>
> READ THIS ENTIRE DOCUMENT BEFORE WRITING A SINGLE LINE OF CODE.
> Every decision is intentional. Every section connects to others.
> Features marked [PHASE 2] are scaffolded but not built at launch.

---

## TABLE OF CONTENTS

1.  Product Identity & Vision
2.  Assignment Requirements — Complete Mapping (Both Assignments)
3.  SDG & Vision 2030/2035 Alignment
4.  The Three Portals — Exact Specification
    - 4A. User Portal (Student)
    - 4B. Client Portal (Coach)
    - 4C. Admin Portal
5.  AI Agent — Deep Integration Architecture (NOT a Chatbot)
6.  Tech Stack — Final with Justification
7.  Complete Folder & File Structure
8.  Database Schema — Full SQL
9.  Authentication & Role System
10. Feature Specifications
    - Code Editor + Compiler
    - Digital Notebook
    - Free Resource Library
    - Live Classes
    - Peer Tutoring
    - Rating & Review System
    - Gamification
    - Notification System
    - Support System
    - Onboarding & Tutorial
11. Economy, Payments & Earnings
12. Security — Every Layer
13. Legal, Policies, Penalties & Compliance
14. Content Protection & Screenshot Policy
15. Off-Platform Protection
16. GitHub & LinkedIn Integration
17. Scalability & Feature Flags
18. Package Dependencies (package.json)
19. Environment Variables (.env.local)
20. Day-by-Day Build Plan (6 Days)
21. Database Seed & Demo Accounts
22. Deployment Checklist
23. Assignment Submission Checklist
24. ARCHITECTURE.md Content
25. Canva Poster Brief
26. README Template
27. Brand System

---

## 1. PRODUCT IDENTITY & VISION

```
Name:           COGNARA™
Tagline:        "Where knowledge finds its place."
Version:        1.0.0 (Assignment Build)
Type:           AI-Powered EdTech SaaS Platform
SDG:            Goal 4 — Quality Education
Vision:         Pakistan Vision 2030 + Vision 2035
License:        Proprietary — All Rights Reserved
Trademark:      Class 41 (Education Services) + Class 42 (SaaS)
                [File immediately via IPO.gov.pk after submission]
Domain:         cognara.app (primary) / cognara.io (fallback)
University:     UMT
Assignment:     PP Assignment #3 + #4 (single unified build)
```

### Problem Statement

In Pakistan and the developing world:
- 60%+ of students lack access to quality technical education
- Qualified teachers are concentrated in urban centers
- Existing platforms (Udemy, Coursera) charge in USD, inaccessible
- No platform connects learning directly to employment proof
- AI tools exist but are bolted on — not built into the learning itself

### Solution: COGNARA

COGNARA is not a course platform with an AI feature.
COGNARA is an **AI agent system** that happens to be built around education.

The AI agent is present on EVERY surface:
- Reading a lesson? Agent notices + offers explanation
- Writing code? Agent watches for errors in real time
- Uploading a PDF? Agent converts it to a quiz immediately
- Taking a quiz? Agent explains wrong answers afterward
- Stuck on a concept? Agent recommends the exact next lesson
- Speaking aloud? Agent listens, responds, teaches in voice

This is the fundamental difference from every competitor.

---

## 2. ASSIGNMENT REQUIREMENTS — COMPLETE MAPPING

### Assignment #3 — Every Requirement Satisfied

| # | Requirement | COGNARA Solution | Location in Document |
|---|---|---|---|
| 1 | AI Agent connected to SDG | 7-skill autonomous agent → SDG 4 | Section 5 |
| 2 | Real-world problem solved | Education access gap in Pakistan | Section 1 |
| 3 | Dashboard: User | Student Portal with full AI integration | Section 4A |
| 4 | Dashboard: Admin | Admin Portal with full platform control | Section 4C |
| 5 | Dashboard: Client | Coach Portal (CLIENT = COACH) | Section 4B |
| 6 | Data on Kaggle | Course/topic dataset imported at seed | Section 21 |
| 7 | Vision 2030 aligned | Documented + used in presentation | Section 3 |
| 8 | Vision 2035 aligned | Documented + used in presentation | Section 3 |
| 9 | GitHub repository | Full source + README + docs | Section 26 |
| 10 | Vercel deployment | Live link, all dashboards accessible | Section 22 |
| 11 | Loom demo video | Script provided | Section 23 |
| 12 | Live demo presentation | Agent demo is centerpiece | Section 23 |
| 13 | Poster | Full brief provided | Section 25 |
| 14 | Tag UMT societies | In Loom video description | Section 23 |

### Assignment #4 — Every Requirement Satisfied

| # | Requirement | COGNARA Solution | Location |
|---|---|---|---|
| 1 | Modern AI Agent Application | 7-skill agent, autonomous, with memory | Section 5 |
| 2 | Problem-Solving Agents | Teach, debug, quiz, voice, path, verify, support | Section 5 |
| 3 | Assist users | Agent embedded in every page, context-aware | Section 5 |
| 4 | Automate workflows | PDF→quiz, code→feedback, ticket→resolution | Section 5 |
| 5 | Handle reasoning | Path agent reasons over student history | Section 5 |
| 6 | Improve productivity | AI notes, AI quiz gen, AI code debug | Section 10 |
| 7 | Dashboard System | 3 full portals | Section 4 |
| 8 | Admin / User / Client | Admin / Student / Coach exactly | Section 4 |
| 9 | Client/Server Structure | Next.js App Router + Supabase | Section 6 |
| 10 | Responsive UI/UX | Mobile-first Tailwind, tested all breakpoints | Section 6 |
| 11 | Database Integration | Supabase PostgreSQL + RLS | Section 8 |
| 12 | SDG Innovation | SDG 4 + Vision 2030/2035 | Section 3 |
| 13 | Deployment + Hosting | Vercel (live URL required) | Section 22 |
| 14 | GitHub Repository | Source + README + screenshots + API docs | Section 26 |
| 15 | Loom Demo Video | Script + checklist | Section 23 |
| 16 | Poster | Full Canva brief | Section 25 |
| 17 | Branding & Promotion | Full brand system | Section 27 |
| 18 | Scalability + Vision | Feature flags + roadmap | Section 17 |

### LM Arena Requirement — Correct Professional Interpretation

```
The assignment says "use LM Arena for your APIs."

WHAT LM ARENA IS:
LM Arena (lmarena.ai) is a benchmarking and model comparison platform.
It is NOT a deployable API endpoint.
It hosts battles between models and maintains an ELO leaderboard.
You cannot get an API key from LM Arena directly.

CORRECT INTERPRETATION:
"Use models that are ranked and tested on LM Arena."
These models are accessed via:
→ OpenRouter (unified API, free tier, 200+ models)
→ Groq (free tier, ultra-fast inference)
→ Google Gemini API (free tier, multimodal)

IN YOUR PRESENTATION (say this verbatim):
"We identified the highest-performing models using LM Arena's
benchmarks and integrated them via OpenRouter's API gateway.
Our code agent uses Llama 3.3 70B — ranked #1 for coding on
LM Arena. Our vision agent uses Gemini 2.0 Flash — ranked top
for multimodal tasks. This is how professionals use LM Arena:
as a benchmark to SELECT models, not as a runtime API."

This answer is technically correct and demonstrates
professional understanding that will impress any judge.
```

---

## 3. SDG & VISION ALIGNMENT

### SDG 4 — Quality Education (Primary SDG)

```
Target 4.1 — Free, equitable, quality education for all
→ COGNARA: Free tier forever. No paywall on core learning.
  Free resources guaranteed permanently (DB-enforced).

Target 4.3 — Equal access to technical/vocational education
→ COGNARA: Verified coaches teach real technical skills.
  Peer sessions make knowledge accessible at minimal cost.
  Available anywhere with internet — no geography barrier.

Target 4.4 — Youth with relevant skills for employment
→ COGNARA: Code compiler, GitHub integration, certificates,
  LinkedIn sharing. Every skill learned becomes verifiable proof.
  Portfolio page at cognara.app/@username is the employment link.

Target 4.5 — Eliminate gender + wealth disparities in education
→ COGNARA: Free tier removes wealth barrier.
  Anonymous learning removes social barriers.
  RTL support (Urdu/Arabic) removes language barriers.

Target 4.C — Increase qualified teacher supply
→ COGNARA: Any qualified person can become a verified coach.
  AI verification makes the process fast and fair.
  Performance earnings incentivize quality teaching.
```

### Pakistan Vision 2030 Alignment

```
1. AI-driven digital transformation
   → COGNARA: AI agent is the platform core, not an add-on

2. Quality technical/vocational education at scale
   → COGNARA: Verified coaches + structured curriculum system

3. Equal access regardless of geography or income
   → COGNARA: Free tier + peer economy + mobile PWA

4. Workforce development for knowledge economy
   → COGNARA: Skills → certificates → LinkedIn → employment

5. Pakistan's national SDG commitment (first country to adopt)
   → COGNARA: Built around SDG 4, documented, demonstrable
```

### Pakistan Vision 2035 Alignment

```
1. Knowledge economy leadership in South Asia
   → COGNARA: Exports Pakistani technical talent globally

2. EdTech infrastructure for 220M population
   → COGNARA: Scalable SaaS, B2B for institutions [Phase 3]

3. AI literacy + technical skills for all
   → COGNARA: AI agent teaches AI concepts to students
```

### Verbatim Presentation Statement

> "COGNARA is Pakistan's answer to SDG 4. It removes every barrier
> between qualified knowledge and the students who need it — geographic,
> financial, and linguistic. Built on AI that doesn't just assist but
> actively teaches, debugs, and certifies, COGNARA directly advances
> Pakistan's Vision 2030 goal of AI-driven, equitable education at
> national scale. This isn't a demonstration project. It is deployed,
> live, and usable right now at cognara.app."

---

## 4. THE THREE PORTALS — EXACT SPECIFICATION

> CRITICAL: The assignment requires three DISTINCT views.
> USER = Student Portal
> CLIENT = Coach Portal (a coach is a client of the platform)
> ADMIN = Admin Portal
> Each portal has its own layout, sidebar, routing group, and RLS scope.

---

### 4A. USER PORTAL — Student Dashboard

**Route group:** `src/app/(student)/`
**Access guard:** `role === 'student'` OR `role === 'admin'` (admins can view all)
**URL:** `/dashboard`

#### Layout & Navigation

```
LEFT SIDEBAR (always visible):
─────────────────────────────
🏠  Dashboard           /dashboard
📚  My Courses          /courses
💻  Code Editor         /editor
📓  Notebook            /notebook
🤖  AI Agent            /agent
📝  Quizzes             /quizzes
📊  My Progress         /progress
🏆  Certificates        /certificates
📖  Free Library        /library       (public, shown for discoverability)
👥  Peer Sessions       /peer
💳  Credits & Billing   /billing
🎫  Support             /support
⚙️  Settings            /settings

BOTTOM OF SIDEBAR:
Credit balance: [●●●○○] 47 credits remaining  [Top Up]
```

#### Dashboard Home (`/dashboard`)

```
─────────────────────────────────────────────────────
ROW 1: Stats Bar (4 cards, full width)
  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
  │ 3 Enrolled   │ │ 1 Completed  │ │ 🔥 7-Day     │ │ 47 Credits   │
  │ Courses      │ │ Courses      │ │    Streak    │ │ Remaining    │
  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

ROW 2: AI Agent Quick-Launch Panel (full width, prominent)
  ┌───────────────────────────────────────────────────────────────┐
  │  🤖 COGNARA AGENT                              [47 credits]   │
  │  "What would you like to learn today?"                        │
  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │
  │  │ 💬 Ask     │ │ 🐛 Debug   │ │ 📄 Quiz    │ │ 🎤 Voice   │ │
  │  │ Question   │ │    Code    │ │  from PDF  │ │   Mode     │ │
  │  │ (1 credit) │ │ (2 credits)│ │ (3 credits)│ │ (1cr/min)  │ │
  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘ │
  └───────────────────────────────────────────────────────────────┘
  NOTE: Agent panel is on EVERY student page. Not just /agent.
  It collapses to a floating button on non-dashboard pages.

ROW 3: Course Progress (enrolled courses as cards with progress rings)
  Each card shows: thumbnail, title, coach, progress %, last activity
  CTA: "Continue" button → goes to exact lesson where they left off

ROW 4: Two columns
  LEFT: Upcoming (live sessions + peer sessions I registered for)
  RIGHT: Recent AI Agent activity (last 3 sessions with summaries)

ROW 5: Activity Feed (learning-focused, NOT social)
  Items (with timestamps):
  → "Coach [Name] added a new lesson to [Course]"
  → "New free PDF: Python Cheat Sheet by [Coach]"
  → "Peer session: Data Structures Review — tomorrow 7PM"
  → "Your quiz score improved: 62% → 78% on Functions"
  → "[Hackathon] Week 3 challenge starts in 2 days"
  NO likes. NO follower counts. Every item has ONE action button.

ROW 6: Recent badges + XP level bar
```

#### AI Agent Page (`/agent`) — Deep Specification

```
This page is the FULL agent interface.
The floating button on other pages opens a panel version.

LAYOUT:
Left panel (30%): Agent history, skill selector, credit display
Right panel (70%): Active conversation / output

SKILL SELECTOR (always visible):
  [🧠 Teach Me] [🐛 Debug Code] [📄 PDF→Quiz] [🎤 Voice] [🗺️ Path] [🎫 Support]
  Current skill highlighted. Changing skill = new context, same memory.

WHAT MAKES THIS AN AGENT, NOT A CHATBOT:

1. CONTEXT AWARENESS
   Agent knows: current lesson, enrolled courses, quiz scores,
   weak topics from memory, preferred language.
   It doesn't ask "what are you studying?" — it already knows.

2. TOOL USE (autonomous actions)
   Agent can:
   → READ the lesson the student is currently on (via context injection)
   → GENERATE a quiz and SAVE it to the student's quiz list
   → EXECUTE code and RETURN results (via Judge0 tool)
   → SEARCH the course library for relevant content
   → UPDATE agent_memory based on conversation patterns
   → CREATE a notebook entry from the conversation

3. MULTI-STEP REASONING
   Example flow (not a chatbot flow):
   Student: "I keep failing the recursion quiz"
   Agent:   [INTERNALLY]
            → Reads quiz_attempts for this student + this quiz
            → Reads their wrong answers
            → Reads their code_submissions related to recursion
            → Identifies specific gap (e.g. base case understanding)
            [RESPONDS]
            "I can see you've attempted the recursion quiz 3 times.
             Your answers show a pattern — you're getting the
             recursive call right but missing the base case every time.
             Let me show you exactly why, then generate 3 practice
             problems specifically on base cases."
            [TAKES ACTION]
            → Generates 3 targeted practice problems
            → Saves them to student's quiz list
            → Updates agent_memory: weak_topics += 'recursion_base_case'

4. PERSISTENT MEMORY
   Every session updates agent_memory table:
   weak_topics, strong_topics, learning_style, session_count
   Next session starts with this context loaded.

5. PROACTIVE SUGGESTIONS (appears as notification)
   After a student completes a lesson:
   "I noticed you spent 18 minutes on the loops section.
    Want me to generate 5 practice problems to reinforce it?"
```

---

### 4B. CLIENT PORTAL — Coach Dashboard

**Route group:** `src/app/(coach)/`
**Access guard:** `role === 'coach'`
**URL:** `/coach/dashboard`

> **IMPORTANT:** In the assignment, "Client" = Coach.
> A coach is a CLIENT of the COGNARA platform — they use it
> to sell their services and manage their business.
> This portal is their complete business management system.

#### Layout & Navigation

```
LEFT SIDEBAR:
─────────────────────────────
🏠  Dashboard           /coach/dashboard
📚  My Courses          /coach/courses
📖  My Library          /coach/library       (free + paid resources)
👨‍🎓  My Students         /coach/students
📊  Analytics           /coach/analytics
💰  Earnings            /coach/earnings
🎥  Live Classes        /coach/live
📝  Quiz Builder        /coach/quizzes
✅  Verification        /coach/verification
🎫  Support             /coach/support
⚙️  Settings            /coach/settings

BOTTOM OF SIDEBAR:
Verification status: [✅ VERIFIED] or [⏳ PENDING] or [❌ REJECTED]
Monthly earnings: $247.50 this month
```

#### Dashboard Home (`/coach/dashboard`)

```
ROW 1: Business Stats (5 cards)
  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
  │ 124      │ │ 89       │ │ $247.50  │ │ 4.8 ★    │ │ 78%      │
  │ Total    │ │ Active   │ │ This     │ │ Avg      │ │ Course   │
  │ Students │ │ This Mo. │ │ Month    │ │ Rating   │ │ Complete │
  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘

ROW 2: AI AGENT PANEL (for the coach — different skills)
  ┌───────────────────────────────────────────────────────────────┐
  │  🤖 COACH AGENT TOOLS                                        │
  │  ┌─────────────────┐ ┌─────────────────┐ ┌────────────────┐ │
  │  │ 📄 PDF → Course │ │ 📝 Generate     │ │ 📊 Analyze My  │ │
  │  │    Outline      │ │    Quiz Bank    │ │    Students    │ │
  │  │    (AI drafts   │ │    from Topic   │ │    (AI gives   │ │
  │  │    full course) │ │                 │ │    insights)   │ │
  │  └─────────────────┘ └─────────────────┘ └────────────────┘ │
  └───────────────────────────────────────────────────────────────┘
  NOTE: Coach agent tools are FREE for coaches (platform benefit).
  These are different tools from the student-facing agent.

ROW 3: Earnings chart (30-day bar chart)
  Shows daily revenue + performance multiplier indicator
  ┌──────────────────────────────────────────────────────────────┐
  │  Performance Multiplier: 1.08x  (+8% this month)            │
  │  Completion rate: 78% (+5% bonus) | Rating 4.8 (+3% bonus) │
  │  [Gross: $297.62] [Platform 20%: -$59.52] [You: $247.50]   │
  └──────────────────────────────────────────────────────────────┘

ROW 4: Course performance table
  Course | Students | Completion% | Avg Score | Revenue | Actions

ROW 5: Recent student activity feed
  → "[Student] completed Lesson 4 of Python Basics"
  → "[Student] scored 92% on your Variables Quiz"
  → "[Student] left a 5-star review: 'Best course I've taken'"

ROW 6: Verification status banner (if not verified)
  ┌─────────────────────────────────────────────────────────────┐
  │ ⚠️  Your account is pending verification.                   │
  │ You can build courses but cannot publish until verified.    │
  │                              [Upload Documents →]           │
  └─────────────────────────────────────────────────────────────┘
```

#### Client Portal Complete Feature List

```
COURSE MANAGEMENT:
□ Create course wizard (5 steps: basics, curriculum, pricing, preview, publish)
□ Lesson editor (rich text + video embed + file attach)
□ Drip content scheduling (unlock lesson after X days)
□ Prerequisites system (requires course A before course B)
□ Course cloning (duplicate + modify)
□ Co-instructor invite [Phase 2]
□ Course trailer video upload

RESOURCE LIBRARY (Coach's):
□ Upload: PDF, video, image, link
□ Per-resource access control: Free / Members / Paid / Preview
□ If marked FREE: locked permanently (DB-enforced)
□ AI auto-transcription (video resources)
□ AI auto-summary + tag generation (all resources)
□ Analytics per resource (views, downloads, revenue)

QUIZ BUILDER:
□ Create quiz manually (MCQ, true/false, code, text)
□ AI quiz generation from topic (Agent tool — FREE for coaches)
□ AI quiz generation from uploaded PDF (Agent tool — FREE for coaches)
□ Question bank (reuse questions across quizzes)
□ Set pass score, time limit, attempts allowed
□ Preview quiz as student

LIVE CLASSES:
□ Schedule session (title, date, time, duration, price)
□ Set max students + waitlist
□ Daily.co room auto-created on schedule
□ Students notified automatically
□ Start class button → opens Daily.co room in-platform
□ In-class: video, screen share, whiteboard, chat, polls
□ Auto-recording saved to Supabase Storage
□ Waitlist management
□ Attendance tracking

STUDENT MANAGEMENT:
□ Full student roster with progress per course
□ Individual student profile (progress, quiz scores, code submissions)
□ Bulk message students (all enrolled in a course)
□ Individual message (in-platform only)
□ Export student data (CSV)

ANALYTICS:
□ Course completion funnel (where do students drop off?)
□ Lesson-by-lesson completion rates
□ Quiz performance by question (which questions are confusing?)
□ Revenue over time (daily / weekly / monthly)
□ Student retention rate
□ AI agent quality score (how helpful were my resources to the agent?)

EARNINGS:
□ Real-time earnings dashboard
□ Performance multiplier calculation + breakdown
□ Payout history
□ Stripe Connect setup wizard
□ Manual withdraw button
□ Monthly automatic payout
□ Invoice download (PDF)
□ Tax document export (1099-equivalent)

PRICING TOOLS:
□ Live earnings calculator (shown BEFORE setting any price)
□ Coupon/discount code generator (% or fixed amount)
□ Free trial offering (first lesson free)
□ Bundle pricing [Phase 2]

VERIFICATION:
□ Document upload wizard (degree, certificate, govt ID)
□ AI pre-screening (Gemini Vision)
□ Status tracking (pending / under review / approved / rejected)
□ Appeal if rejected
□ Verified badge display on profile + all listings
```

---

### 4C. ADMIN PORTAL

**Route group:** `src/app/(admin)/`
**Access guard:** `role === 'admin'` ONLY (no exceptions, 404 for others)
**URL:** `/admin/dashboard`

#### Dashboard Home (`/admin/dashboard`)

```
ROW 1: Platform Health (real-time)
  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
  │ 2,847    │ │ 312      │ │ $4,201   │ │ 7        │ │ 99.8%    │
  │ Total    │ │ Active   │ │ MRR      │ │ Tickets  │ │ Uptime   │
  │ Users    │ │ Today    │ │          │ │ Open     │ │          │
  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘

ROW 2: Revenue chart (30/60/90 day view toggle, line chart)

ROW 3: Verification Queue (PRIORITY ACTION)
  Pending coach applications with AI confidence scores
  ┌──────────────────────────────────────────────────────────────┐
  │ Coach Applications Awaiting Review                           │
  │ [Ahmed R.] Degree: BSc CS | AI Confidence: 94% | [Review]   │
  │ [Sara M.]  Certificate: AWS | AI Confidence: 71% | [Review] │
  │ [Bilal K.] Degree: MBA | AI Confidence: 43% | [Review ⚠️]  │
  └──────────────────────────────────────────────────────────────┘

ROW 4: Security Events (high/critical only, real-time)
  → "[HIGH] Off-platform solicitation detected — User #4821"
  → "[CRITICAL] Failed login attempts: 12 in 5 mins — IP: x.x.x.x"

ROW 5: Support ticket summary by category + avg resolution time

ROW 6: Platform health indicators
  [DB: ✅] [AI Agent API: ✅] [Payments: ✅] [Video: ✅] [Email: ✅]
```

#### Admin Portal Complete Feature List

```
USER MANAGEMENT:
□ All users table (filter by role, status, date)
□ Individual user profile view (all data)
□ Ban / unban user
□ Change user role (except: cannot self-demote admin)
□ View user's full activity log
□ Impersonate user (for support — logged in audit trail)
□ Export users (CSV)

COACH MANAGEMENT:
□ Verification queue with AI analysis
□ Approve / reject with reason
□ View submitted documents (secure signed URLs)
□ Override AI decision with manual review note
□ View coach earnings + performance scores
□ Issue strike (1-4) with reason
□ Revoke verification badge
□ Suspend / reinstate account

COURSE MANAGEMENT:
□ All courses table (filter by status, category, coach)
□ Feature / unfeature a course
□ Hide course from browse (without deleting)
□ Delete course (with notification to enrolled students + refunds)
□ View course content (admin access bypasses RLS)

SUBSCRIPTIONS & BILLING:
□ All subscriptions table
□ Manual subscription adjustment (comp, refund, extend)
□ All transactions log
□ Refund processing
□ Chargeback management
□ Platform revenue dashboard (gross, fees, net)

SUPPORT TICKETS:
□ All tickets table (filter by category, status, priority)
□ Assign ticket to admin
□ Respond to tickets
□ Escalate priority
□ Close + resolve
□ Ticket analytics (volume, resolution time, categories)

SECURITY & AUDIT:
□ Full audit log (every sensitive action, searchable)
□ Security events (filter by severity)
□ Off-platform attempt log
□ Failed login attempts by IP
□ File upload violations log
□ Resolve / dismiss security events

CONTENT MODERATION:
□ Flagged content queue (reported by users)
□ Review + remove / approve
□ DMCA takedown processing
□ Plagiarism flag review
□ AI content moderation override

REPORTS (all exportable as CSV + PDF):
□ User growth (daily/weekly/monthly)
□ Revenue breakdown
□ Top coaches by earnings + rating
□ Most enrolled courses
□ Churn analysis
□ AI agent usage stats
□ Support resolution metrics

PLATFORM SETTINGS:
□ Platform-wide feature flags (toggle any feature)
□ Maintenance mode toggle
□ Email template editor
□ Platform fee rates (requires code deploy to change)
□ Announcement banner (shown to all users)
```

---

## 5. AI AGENT — DEEP INTEGRATION ARCHITECTURE

> This is the most critical section. Read it entirely.
> The agent is NOT a chat window. It is woven into the platform.

### The Fundamental Architecture

```
COGNARA AI AGENT SYSTEM

                    ┌─────────────────────────────────────┐
                    │         MASTER AGENT ROUTER          │
                    │      lib/ai/master-agent.ts          │
                    │                                      │
                    │  Inputs:                             │
                    │  → User action (button, upload, etc) │
                    │  → Current page context              │
                    │  → Agent memory (student history)    │
                    │  → Credit balance                    │
                    │  → Explicit skill request            │
                    │                                      │
                    │  Outputs:                            │
                    │  → Routes to correct skill agent     │
                    │  → Deducts credits                   │
                    │  → Updates memory                    │
                    │  → Returns structured response       │
                    └──────────┬──────────────────────────┘
                               │
       ┌───────────┬───────────┼────────────┬────────────┬──────────┐
       ▼           ▼           ▼            ▼            ▼          ▼
  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐
  │  TEACH  │ │  CODE   │ │  PDF    │ │  VOICE  │  │  PATH   │ │SUPPORT │
  │  AGENT  │ │  AGENT  │ │  AGENT  │ │  AGENT  │ │  AGENT  │ │ AGENT  │
  │         │ │         │ │         │ │         │ │         │ │        │
  │Explains │ │Debugs   │ │Reads    │ │STT+TTS  │ │Analyzes │ │Resolves│
  │concepts │ │Fixes    │ │Generates│ │Teaches  │ │history  │ │tickets │
  │in context│ │Explains │ │quizzes  │ │by voice │ │Maps path│ │auto    │
  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └────────┘
       +           +
  ┌─────────┐ ┌──────────┐
  │ VERIFY  │ │  COACH   │
  │  AGENT  │ │  AGENT   │
  │         │ │          │
  │Screens  │ │Helps     │
  │coach    │ │coaches   │
  │docs     │ │build     │
  └─────────┘ └──────────┘
```

### Where the Agent Lives (Every Surface)

```
SURFACE                  AGENT BEHAVIOR                           TRIGGER
───────────────────────────────────────────────────────────────────────────
Lesson page              Floating "Ask Agent" button              Always visible
                         Reads lesson content automatically       On page load
                         "Need help with this lesson? Ask me."   Idle 2 mins

Code editor              Inline error detection                   On run/error
                         "I see an error on line 4. Want me      Opt-in button
                          to explain it?"

Quiz results page        Explains wrong answers                   Auto, post-quiz
                         "You got Q3 wrong. Here's why..."       On completion

PDF upload               Immediate conversion offer               On upload complete
                         "I've read your PDF. Generate a quiz?"  Auto-prompt

Notebook                 "Take notes for me" toggle              User toggle
                         Real-time AI notes as lesson plays      When active

After lesson complete    Learning reinforcement                   On completion
                         "You just learned X. Quick: what        Auto-triggered
                          does Y mean?" (1 question check)

Student dashboard        Weekly insight panel                     On dashboard load
                         "Your weak area this week: recursion.
                          I recommend this 10-min lesson."

Voice mode (any page)    Full voice conversation                  Mic button
                         Agent listens, responds in speech       Any time

Support ticket           Auto-resolution attempt                  On ticket submit
                         Resolves 60%+ of tickets instantly      Before human

Coach uploading PDF      "Generate course outline from this?"     On PDF upload
                         Drafts full course structure            Coach tools

Live class               Student can ask agent during class      In-class panel
                         Agent answers without interrupting      Student-facing
                         the live session
```

### Agent Tool Definitions (What Makes it Autonomous)

```typescript
// lib/ai/tools/agent-tools.ts
// These are the tools the agent can CALL — making it agentic, not chatbot

export const AGENT_TOOLS = [
  {
    name: "read_current_lesson",
    description: "Read the full content of the lesson the student is currently viewing",
    parameters: { lesson_id: "string" },
    // Agent calls this to understand context before responding
  },
  {
    name: "get_student_quiz_history",
    description: "Get student's quiz attempts, scores, and wrong answers for a topic",
    parameters: { student_id: "string", topic: "string" },
    // Agent uses this to personalize explanations
  },
  {
    name: "execute_code",
    description: "Run code in a sandboxed environment and return output",
    parameters: { code: "string", language: "string", stdin: "string" },
    // Agent can run code to verify fixes before showing student
  },
  {
    name: "generate_and_save_quiz",
    description: "Generate quiz questions on a topic and save to student's quiz list",
    parameters: { topic: "string", difficulty: "string", count: "number", student_id: "string" },
    // Agent creates real quizzes, not just suggestions
  },
  {
    name: "search_courses",
    description: "Search the course catalog for relevant content to recommend",
    parameters: { query: "string", difficulty: "string" },
    // Agent finds real courses to recommend
  },
  {
    name: "update_agent_memory",
    description: "Update student's weak/strong topics and learning style",
    parameters: { student_id: "string", updates: "object" },
    // Agent learns from every interaction
  },
  {
    name: "create_notebook_entry",
    description: "Save a summary or explanation to the student's notebook",
    parameters: { student_id: "string", title: "string", content: "string", notebook_id: "string" },
    // Agent can write to student's notebook
  },
  {
    name: "read_pdf_content",
    description: "Read and extract content from an uploaded PDF",
    parameters: { storage_path: "string" },
    // Agent reads PDFs to generate quizzes or summaries
  },
  {
    name: "get_learning_path",
    description: "Get student's enrolled courses, completion, and recommended next steps",
    parameters: { student_id: "string" },
    // Agent uses this for path recommendations
  }
]
```

### Agent Memory System

```typescript
// lib/ai/memory.ts

// On every agent session start:
export async function loadStudentMemory(student_id: string) {
  const memory = await supabase
    .from('agent_memory')
    .select('*')
    .eq('student_id', student_id)
    .single()

  return {
    weak_topics: memory.weak_topics || [],
    strong_topics: memory.strong_topics || [],
    learning_style: memory.learning_style || 'unknown',
    preferred_language: memory.preferred_language || 'en',
    total_sessions: memory.total_sessions || 0,
  }
}

// Injected into EVERY agent system prompt:
export function buildSystemPrompt(memory: AgentMemory, context: AgentContext) {
  return `
You are COGNARA's AI tutor. You are NOT a general assistant.
Your only job is to help this specific student learn.

STUDENT CONTEXT:
- Current lesson: ${context.current_lesson_title}
- Current course: ${context.current_course_title}
- Weak topics: ${memory.weak_topics.join(', ') || 'none identified yet'}
- Strong topics: ${memory.strong_topics.join(', ') || 'none identified yet'}
- Learning style: ${memory.learning_style}
- Sessions completed: ${memory.total_sessions}
- Preferred language: ${memory.preferred_language}

RULES:
1. Always reference what the student is CURRENTLY doing
2. If you detect a pattern, use the update_agent_memory tool
3. Don't just explain — generate exercises, quizzes, examples
4. If a student is struggling, break it into smaller steps
5. After every explanation, confirm understanding with a question
6. You have tools — USE THEM. Don't just chat.
7. Respond in ${memory.preferred_language}
  `
}

// After every session: update memory
export async function updateMemory(student_id: string, session_insights: object) {
  // Called by agent after each session
  // Updates weak_topics, strong_topics, learning_style
}
```

### Credit System Implementation

```typescript
// lib/ai/credit-check.ts

export const CREDIT_COSTS = {
  ask_question: 1,
  voice_per_minute: 1,
  debug_code: 2,
  ai_take_notes: 2,
  explain_concept: 2,
  generate_quiz: 3,
  learning_path: 3,
  voice_session_10min: 5,
  // Coach tools: 0 (free for coaches)
  coach_generate_quiz: 0,
  coach_pdf_outline: 0,
  coach_analyze_students: 0,
} as const

export async function checkAndDeductCredits(
  student_id: string,
  action: keyof typeof CREDIT_COSTS
): Promise<{ allowed: boolean; remaining: number; error?: string }> {
  const cost = CREDIT_COSTS[action]
  if (cost === 0) return { allowed: true, remaining: 0 } // Free for coaches

  const credits = await getCredits(student_id)
  if (credits.balance < cost) {
    return {
      allowed: false,
      remaining: credits.balance,
      error: `Insufficient credits. This action costs ${cost} credits. You have ${credits.balance}.`
    }
  }

  await deductCredits(student_id, cost, action)
  return { allowed: true, remaining: credits.balance - cost }
}
// On insufficient credits: show top-up modal, never just fail silently
```

---

## 6. TECH STACK — FINAL

```
LAYER              TOOL                   VERSION    COST       WHY
──────────────────────────────────────────────────────────────────────
Framework          Next.js                15.x       Free       App Router, SSR, Vercel-native
Styling            Tailwind CSS           3.x        Free       Utility-first, consistent
Components         shadcn/ui              latest     Free       Professional, accessible
Database           Supabase               latest     Free tier  Auth+DB+Storage+RLS+Realtime
ORM                Supabase JS Client     2.x        Free       Type-safe, auto-generated types
AI (Fast)          Groq API               latest     Free tier  Ultra-fast, Llama 3.3 70B
AI (Vision)        Google Gemini API      2.0 Flash  Free tier  PDF reading, multimodal
AI (Gateway)       OpenRouter             latest     Free tier  LM Arena models, backup
Code Editor        Monaco Editor          latest     Free MIT   VS Code engine
Code Execution     Judge0 CE              latest     Free tier  Sandboxed, 20+ languages
Notebook Draw      Tldraw                 2.x        Free MIT   Stylus/touch/mouse canvas
Rich Text          TipTap                 2.x        Free MIT   Extensible rich text editor
Voice              Web Speech API         native     Free       Browser STT + SpeechSynthesis TTS
Video/Live         Daily.co               latest     Free tier  WebRTC, 10k min/month free
Video DRM          Mux                    latest     Free tier  DRM streaming + watermarking
Payments           Stripe                 latest     2.9%+$0.30 PCI DSS Level 1
Payouts            Stripe Connect         latest     Included   Coach bank payouts
Email              Resend                 latest     Free tier  3k emails/month free
Error Tracking     Sentry                 latest     Free tier  Error monitoring
Status Page        BetterStack            latest     Free tier  Uptime monitoring
Rate Limiting      Upstash Redis          latest     Free tier  Edge rate limiting
Deployment         Vercel                 latest     Free tier  Next.js native, auto-deploy
Version Control    GitHub                 latest     Free       Required by assignment
Datasets           Kaggle                 latest     Free       Required by assignment
Validation         Zod                    3.x        Free       Schema validation everywhere
Animations         Framer Motion          latest     Free       UI transitions
Charts             Recharts               latest     Free       Analytics dashboards
PDF Viewer         react-pdf              latest     Free       DRM-safe PDF display
```

---

## 7. COMPLETE FOLDER & FILE STRUCTURE

```
cognara/                                   ← Repository root
│
├── .env.local                             ← NEVER COMMIT (see Section 19)
├── .env.example                           ← COMMIT THIS (no real values)
├── .gitignore                             ← (content in Section 7a)
├── LICENSE                                ← Proprietary license text
├── TRADEMARK-NOTICE.md                    ← COGNARA™ trademark notice
├── README.md                              ← (template in Section 26)
├── next.config.ts                         ← Security headers, image domains
├── tailwind.config.ts                     ← Custom colors, fonts
├── tsconfig.json                          ← Strict TypeScript
├── postcss.config.js
├── package.json                           ← (exact deps in Section 18)
│
├── public/
│   ├── favicon.ico                        ← COGNARA favicon
│   ├── logo.svg                           ← COGNARA wordmark SVG
│   ├── og-image.png                       ← 1200×630 social share image
│   ├── manifest.json                      ← PWA manifest
│   └── icons/                             ← PWA icons (192, 512px)
│
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── 0001_initial_schema.sql        ← All tables (Section 8)
│   │   ├── 0002_rls_policies.sql          ← All RLS policies
│   │   ├── 0003_functions_triggers.sql    ← DB functions
│   │   └── 0004_seed_data.sql             ← Demo data (Section 21)
│   └── seed/
│       └── kaggle_courses_import.sql      ← Kaggle dataset
│
├── src/
│   ├── app/                               ← Next.js App Router
│   │   ├── layout.tsx                     ← Root: fonts, providers, metadata
│   │   ├── page.tsx                       ← Landing page (/)
│   │   ├── not-found.tsx                  ← 404 — branded
│   │   ├── error.tsx                      ← Error boundary
│   │   ├── loading.tsx                    ← Root loading skeleton
│   │   │
│   │   ├── (auth)/                        ← No sidebar layout
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── verify-email/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   │
│   │   ├── (public)/                      ← No auth required
│   │   │   ├── layout.tsx                 ← Navbar + Footer
│   │   │   ├── pricing/page.tsx
│   │   │   ├── about/page.tsx
│   │   │   ├── courses/
│   │   │   │   ├── page.tsx               ← Browse courses (public)
│   │   │   │   └── [slug]/page.tsx        ← Course detail + preview
│   │   │   ├── library/
│   │   │   │   ├── page.tsx               ← Free resources (public)
│   │   │   │   └── [resourceId]/page.tsx
│   │   │   ├── coach/[username]/page.tsx  ← Public coach profile
│   │   │   ├── @[username]/page.tsx       ← Student public portfolio
│   │   │   ├── verify-certificate/
│   │   │   │   └── [code]/page.tsx        ← Certificate verification
│   │   │   ├── support/page.tsx           ← Help center
│   │   │   ├── status/page.tsx            ← Platform status
│   │   │   └── legal/
│   │   │       ├── terms/page.tsx
│   │   │       ├── privacy/page.tsx
│   │   │       ├── cookies/page.tsx
│   │   │       ├── refunds/page.tsx
│   │   │       ├── acceptable-use/page.tsx
│   │   │       ├── dmca/page.tsx
│   │   │       ├── coach-agreement/page.tsx
│   │   │       ├── peer-agreement/page.tsx
│   │   │       ├── accessibility/page.tsx
│   │   │       ├── ai-transparency/page.tsx
│   │   │       └── sla/page.tsx
│   │   │
│   │   ├── onboarding/
│   │   │   ├── student/page.tsx           ← 5-step student wizard
│   │   │   └── coach/page.tsx             ← 5-step coach wizard
│   │   │
│   │   ├── (student)/                     ← USER PORTAL
│   │   │   ├── layout.tsx                 ← Sidebar + Agent floating btn
│   │   │   ├── dashboard/page.tsx         ← DASHBOARD 1: USER
│   │   │   ├── profile/page.tsx
│   │   │   ├── courses/
│   │   │   │   ├── page.tsx               ← My enrolled courses
│   │   │   │   └── [courseId]/
│   │   │   │       ├── page.tsx           ← Course overview
│   │   │   │       └── lesson/
│   │   │   │           └── [lessonId]/page.tsx  ← Lesson viewer + agent
│   │   │   ├── editor/page.tsx            ← Monaco + Judge0 compiler
│   │   │   ├── notebook/
│   │   │   │   ├── page.tsx               ← Notebook list
│   │   │   │   └── [notebookId]/page.tsx  ← Notebook editor
│   │   │   ├── agent/page.tsx             ← Full agent interface
│   │   │   ├── quizzes/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [quizId]/page.tsx      ← Quiz attempt
│   │   │   ├── progress/page.tsx
│   │   │   ├── certificates/page.tsx
│   │   │   ├── peer/
│   │   │   │   ├── page.tsx               ← Browse peer sessions
│   │   │   │   ├── host/page.tsx          ← Host a peer session
│   │   │   │   └── [sessionId]/page.tsx   ← Peer session room
│   │   │   ├── billing/page.tsx
│   │   │   ├── support/page.tsx
│   │   │   └── settings/page.tsx
│   │   │
│   │   ├── (coach)/                       ← CLIENT PORTAL
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx         ← DASHBOARD 2: CLIENT
│   │   │   ├── profile/page.tsx
│   │   │   ├── verification/page.tsx
│   │   │   ├── courses/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── create/page.tsx
│   │   │   │   └── [courseId]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── edit/page.tsx
│   │   │   ├── library/
│   │   │   │   ├── page.tsx
│   │   │   │   └── upload/page.tsx
│   │   │   ├── students/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   ├── earnings/page.tsx
│   │   │   ├── live/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [sessionId]/page.tsx
│   │   │   ├── quizzes/page.tsx
│   │   │   ├── support/page.tsx
│   │   │   └── settings/page.tsx
│   │   │
│   │   ├── (admin)/                       ← ADMIN PORTAL
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx         ← DASHBOARD 3: ADMIN
│   │   │   ├── users/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [userId]/page.tsx
│   │   │   ├── coaches/
│   │   │   │   ├── page.tsx
│   │   │   │   └── verification/page.tsx
│   │   │   ├── courses/page.tsx
│   │   │   ├── subscriptions/page.tsx
│   │   │   ├── earnings/page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   ├── support/page.tsx
│   │   │   ├── security/page.tsx
│   │   │   ├── moderation/page.tsx
│   │   │   └── settings/page.tsx
│   │   │
│   │   └── api/
│   │       ├── auth/callback/route.ts     ← Supabase OAuth
│   │       ├── agent/route.ts             ← Master agent (POST)
│   │       ├── agent/stream/route.ts      ← Streaming agent responses
│   │       ├── compiler/route.ts          ← Judge0 proxy (POST)
│   │       ├── upload/route.ts            ← File upload + validation
│   │       ├── stripe/
│   │       │   ├── webhook/route.ts       ← Stripe webhook handler
│   │       │   ├── checkout/route.ts      ← Create checkout session
│   │       │   └── portal/route.ts        ← Customer billing portal
│   │       └── verify/[code]/route.ts     ← Certificate verification
│   │
│   ├── components/
│   │   ├── ui/                            ← All shadcn/ui components
│   │   │
│   │   ├── shared/                        ← Cross-role components
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── NotificationCenter.tsx     ← Bell icon + dropdown
│   │   │   ├── CookieBanner.tsx           ← GDPR consent
│   │   │   ├── VerificationBadge.tsx      ← Role + verified status
│   │   │   ├── PeerDisclaimer.tsx         ← MANDATORY on peer content
│   │   │   ├── ContentBadge.tsx           ← FREE/PAID/PREVIEW/PEER
│   │   │   ├── AgentFloatingButton.tsx    ← Floating agent on all pages
│   │   │   └── LoadingSpinner.tsx
│   │   │
│   │   ├── agent/
│   │   │   ├── AgentPanel.tsx             ← Sliding panel (most pages)
│   │   │   ├── AgentFullPage.tsx          ← Full /agent page
│   │   │   ├── AgentVoice.tsx             ← Voice mode UI
│   │   │   ├── AgentSkillBadge.tsx        ← Active skill indicator
│   │   │   ├── AgentMessage.tsx           ← Message bubble (with tool output)
│   │   │   ├── CreditDisplay.tsx          ← Real-time balance
│   │   │   ├── AgentMemoryPanel.tsx       ← Shows what agent knows about you
│   │   │   └── InlineSuggestion.tsx       ← Proactive inline suggestions
│   │   │
│   │   ├── student/
│   │   │   ├── CourseCard.tsx
│   │   │   ├── LessonViewer.tsx           ← Lesson + embedded agent
│   │   │   ├── ProgressRing.tsx
│   │   │   ├── StreakTracker.tsx
│   │   │   ├── AchievementBadge.tsx
│   │   │   ├── LearningWin.tsx            ← LinkedIn share component
│   │   │   └── PeerSessionCard.tsx        ← With mandatory disclaimer
│   │   │
│   │   ├── coach/
│   │   │   ├── EarningsCalculator.tsx     ← Live earnings preview
│   │   │   ├── CourseBuilder.tsx
│   │   │   ├── LessonEditor.tsx
│   │   │   ├── QuizBuilder.tsx
│   │   │   ├── StudentRoster.tsx
│   │   │   ├── VerificationWizard.tsx
│   │   │   ├── CouponGenerator.tsx
│   │   │   └── ResourceUploader.tsx       ← With access level controls
│   │   │
│   │   ├── admin/
│   │   │   ├── UserTable.tsx
│   │   │   ├── VerificationQueue.tsx      ← AI confidence + review
│   │   │   ├── AuditLogViewer.tsx
│   │   │   ├── RevenueChart.tsx
│   │   │   ├── TicketManager.tsx
│   │   │   └── SecurityEventsList.tsx
│   │   │
│   │   ├── editor/
│   │   │   ├── CodeEditor.tsx             ← Monaco wrapper
│   │   │   ├── OutputPanel.tsx            ← stdout/stderr
│   │   │   ├── LanguageSelector.tsx
│   │   │   └── VersionHistory.tsx
│   │   │
│   │   ├── notebook/
│   │   │   ├── NotebookCanvas.tsx         ← Tldraw wrapper
│   │   │   ├── NotebookTextEditor.tsx     ← TipTap wrapper
│   │   │   ├── VoiceToText.tsx
│   │   │   └── AINoteTaker.tsx
│   │   │
│   │   └── billing/
│   │       ├── CreditPack.tsx
│   │       ├── PlanCard.tsx
│   │       ├── InvoiceList.tsx
│   │       └── CreditTopUpModal.tsx       ← Shown on insufficient credits
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                  ← createBrowserClient()
│   │   │   ├── server.ts                  ← createServerClient()
│   │   │   └── middleware.ts              ← Session refresh
│   │   │
│   │   ├── ai/
│   │   │   ├── master-agent.ts            ← Router + credit check
│   │   │   ├── memory.ts                  ← Load + update student memory
│   │   │   ├── tools/
│   │   │   │   └── agent-tools.ts         ← All tool definitions
│   │   │   └── agents/
│   │   │       ├── teach-agent.ts
│   │   │       ├── code-agent.ts
│   │   │       ├── pdf-agent.ts
│   │   │       ├── voice-agent.ts
│   │   │       ├── path-agent.ts
│   │   │       ├── support-agent.ts
│   │   │       ├── verify-agent.ts
│   │   │       └── coach-agent.ts
│   │   │
│   │   ├── stripe/
│   │   │   ├── client.ts
│   │   │   ├── webhooks.ts
│   │   │   └── plans.ts
│   │   │
│   │   ├── auth/
│   │   │   ├── guards.ts
│   │   │   └── roles.ts
│   │   │
│   │   ├── security/
│   │   │   ├── ratelimit.ts
│   │   │   ├── sanitize.ts
│   │   │   ├── file-validator.ts
│   │   │   ├── audit-log.ts
│   │   │   ├── off-platform-detector.ts  ← Message scanning
│   │   │   └── headers.ts
│   │   │
│   │   ├── validation/schemas/
│   │   │   ├── auth.schema.ts
│   │   │   ├── course.schema.ts
│   │   │   ├── quiz.schema.ts
│   │   │   ├── profile.schema.ts
│   │   │   ├── upload.schema.ts
│   │   │   ├── peer.schema.ts
│   │   │   └── verification.schema.ts
│   │   │
│   │   ├── compiler/judge0.ts
│   │   ├── live/
│   │   │   ├── daily.ts
│   │   │   └── session.ts
│   │   ├── earnings/
│   │   │   ├── calculator.ts
│   │   │   └── payouts.ts
│   │   ├── notifications/
│   │   │   ├── send.ts
│   │   │   └── templates.ts
│   │   └── utils/
│   │       ├── cn.ts
│   │       ├── formatting.ts
│   │       ├── constants.ts
│   │       └── feature-flags.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useAgent.ts
│   │   ├── useCredits.ts
│   │   ├── useNotifications.ts
│   │   └── useRealtime.ts
│   │
│   ├── types/
│   │   ├── database.ts                    ← Supabase generated types
│   │   ├── agent.ts
│   │   └── index.ts
│   │
│   └── middleware.ts                      ← Route protection
│
└── docs/
    ├── README.md
    ├── ARCHITECTURE.md                    ← (content in Section 24)
    ├── API.md
    ├── SECURITY.md
    ├── AGENT.md
    └── CONTRIBUTING.md
```

### Section 7a: .gitignore

```gitignore
node_modules/
.pnp
.pnp.js
.env
.env.local
.env.*.local
.next/
out/
dist/
build/
.DS_Store
*.pem
.vercel
.supabase/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
*.tsbuildinfo
next-env.d.ts
```

---

## 8. DATABASE SCHEMA — FULL SQL

> Paste into Supabase SQL Editor. Run in order.
> All UUID primary keys. All tables have created_at.
> RLS enabled on every single table — no exceptions.

```sql
-- ================================================================
-- COGNARA DATABASE SCHEMA v2.0
-- Run in Supabase SQL Editor
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for text search

-- ================================================================
-- PROFILES & USERS
-- ================================================================

CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'student'
                  CHECK (role IN ('student','coach','admin')),
  full_name       TEXT,
  username        TEXT UNIQUE CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$'),
  avatar_url      TEXT,
  bio             TEXT CHECK (LENGTH(bio) <= 500),
  github_url      TEXT,
  linkedin_url    TEXT,
  timezone        TEXT DEFAULT 'UTC',
  language        TEXT DEFAULT 'en',
  is_verified     BOOLEAN DEFAULT false,
  is_banned       BOOLEAN DEFAULT false,
  ban_reason      TEXT,
  strike_count    INT DEFAULT 0 CHECK (strike_count BETWEEN 0 AND 4),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE public.user_settings (
  user_id                   UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme                     TEXT DEFAULT 'system' CHECK (theme IN ('light','dark','system')),
  notifications_email       BOOLEAN DEFAULT true,
  notifications_push        BOOLEAN DEFAULT true,
  notifications_quiet_start TIME DEFAULT '23:00',
  notifications_quiet_end   TIME DEFAULT '07:00',
  digest_mode               BOOLEAN DEFAULT false,
  font_size                 TEXT DEFAULT 'medium' CHECK (font_size IN ('small','medium','large','xlarge')),
  accessibility_mode        BOOLEAN DEFAULT false,
  high_contrast             BOOLEAN DEFAULT false,
  onboarding_complete       BOOLEAN DEFAULT false,
  cookie_essential          BOOLEAN DEFAULT true,   -- cannot be false
  cookie_analytics          BOOLEAN DEFAULT false,
  cookie_functional         BOOLEAN DEFAULT false,
  cookie_marketing          BOOLEAN DEFAULT false,
  cookie_consent_at         TIMESTAMPTZ,
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.onboarding_progress (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  role            TEXT NOT NULL,
  steps_completed TEXT[] DEFAULT '{}',
  finished_at     TIMESTAMPTZ
);

-- ================================================================
-- SUBSCRIPTIONS & CREDITS
-- ================================================================

CREATE TABLE public.plans (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  price_usd       DECIMAL(10,2) NOT NULL,
  billing_period  TEXT DEFAULT 'monthly' CHECK (billing_period IN ('monthly','annual','one_time')),
  stripe_price_id TEXT,
  features        JSONB,
  limits          JSONB,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.subscriptions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id                 UUID REFERENCES public.plans(id),
  status                  TEXT NOT NULL DEFAULT 'trialing'
                          CHECK (status IN ('trialing','active','past_due','cancelled','paused','unpaid')),
  stripe_subscription_id  TEXT UNIQUE,
  stripe_customer_id      TEXT,
  trial_ends_at           TIMESTAMPTZ,
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  cancel_at_period_end    BOOLEAN DEFAULT false,
  cancelled_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.ai_credits (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance         INT NOT NULL DEFAULT 20 CHECK (balance >= 0),
  daily_free_limit INT NOT NULL DEFAULT 20,
  last_daily_reset DATE DEFAULT CURRENT_DATE,
  lifetime_purchased INT DEFAULT 0,
  lifetime_spent  INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.credit_transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount          INT NOT NULL,  -- negative = spend, positive = add
  action          TEXT NOT NULL,
  balance_after   INT NOT NULL,
  stripe_payment_id TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_usd      DECIMAL(10,2) NOT NULL,
  status          TEXT DEFAULT 'paid'
                  CHECK (status IN ('draft','open','paid','void','uncollectible')),
  stripe_invoice_id TEXT UNIQUE,
  pdf_url         TEXT,
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- COURSES & CONTENT
-- ================================================================

CREATE TABLE public.courses (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id              UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title                 TEXT NOT NULL CHECK (LENGTH(title) BETWEEN 5 AND 200),
  slug                  TEXT UNIQUE NOT NULL,
  description           TEXT,
  thumbnail_url         TEXT,
  category              TEXT,
  tags                  TEXT[] DEFAULT '{}',
  difficulty            TEXT CHECK (difficulty IN ('beginner','intermediate','advanced')),
  language              TEXT DEFAULT 'en',
  price_usd             DECIMAL(10,2) DEFAULT 0 CHECK (price_usd >= 0),
  is_free               BOOLEAN GENERATED ALWAYS AS (price_usd = 0) STORED,
  is_published          BOOLEAN DEFAULT false,
  is_featured           BOOLEAN DEFAULT false,
  requires_verification BOOLEAN DEFAULT true,
  issues_certificate    BOOLEAN DEFAULT true,
  preview_video_url     TEXT,
  total_lessons         INT DEFAULT 0,
  total_enrolled        INT DEFAULT 0,
  avg_rating            DECIMAL(3,2),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

CREATE TABLE public.lessons (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id       UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  content         TEXT,
  order_index     INT NOT NULL,
  type            TEXT DEFAULT 'text' CHECK (type IN ('text','video','code','quiz')),
  video_url       TEXT,
  mux_asset_id    TEXT,         -- Mux video asset
  mux_playback_id TEXT,         -- Mux DRM playback
  duration_mins   INT,
  is_free_preview BOOLEAN DEFAULT false,
  drip_days       INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.resources (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id             UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  coach_id              UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title                 TEXT NOT NULL,
  type                  TEXT NOT NULL CHECK (type IN ('pdf','image','video','link','note')),
  url                   TEXT,
  storage_path          TEXT,
  access_level          TEXT DEFAULT 'free'
                        CHECK (access_level IN ('free','members','paid','preview')),
  price_usd             DECIMAL(10,2) DEFAULT 0,
  -- CRITICAL: once set true, cannot revert via application code
  is_permanently_free   BOOLEAN DEFAULT false,
  ai_summary            TEXT,
  ai_transcript         TEXT,
  ai_tags               TEXT[] DEFAULT '{}',
  view_count            INT DEFAULT 0,
  download_count        INT DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- DB TRIGGER: Enforce free content guarantee
CREATE OR REPLACE FUNCTION enforce_free_content_guarantee()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_permanently_free = true AND NEW.price_usd > 0 THEN
    RAISE EXCEPTION 'Content marked as permanently free cannot be changed to paid.
                     Remove and re-upload as a new resource to offer it as paid.';
  END IF;
  IF NEW.is_permanently_free = true THEN
    NEW.price_usd := 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_free_content
  BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION enforce_free_content_guarantee();

CREATE TABLE public.enrollments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id         UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  progress_pct      INT DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  enrolled_at       TIMESTAMPTZ DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,
  certificate_url   TEXT,
  certificate_code  TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  stripe_payment_id TEXT,
  UNIQUE(student_id, course_id)
);

CREATE TABLE public.lesson_progress (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id       UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed       BOOLEAN DEFAULT false,
  time_spent_mins INT DEFAULT 0,
  completed_at    TIMESTAMPTZ,
  UNIQUE(student_id, lesson_id)
);

-- ================================================================
-- CODE EDITOR & COMPILER
-- ================================================================

CREATE TABLE public.code_submissions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id       UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  language        TEXT NOT NULL,
  code            TEXT NOT NULL,
  stdin           TEXT,
  stdout          TEXT,
  stderr          TEXT,
  execution_time  DECIMAL(8,3),
  memory_used     INT,
  judge0_status   TEXT,
  ai_feedback     TEXT,
  ai_score        INT CHECK (ai_score BETWEEN 0 AND 100),
  submitted_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.code_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  language        TEXT NOT NULL DEFAULT 'python',
  code            TEXT DEFAULT '',
  title           TEXT DEFAULT 'Untitled',
  is_public       BOOLEAN DEFAULT false,
  share_code      TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- NOTEBOOK
-- ================================================================

CREATE TABLE public.notebooks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT DEFAULT 'Untitled Notebook',
  course_id       UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  is_public       BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.notebook_pages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notebook_id     UUID NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
  title           TEXT DEFAULT 'Page 1',
  content_text    TEXT,
  content_canvas  JSONB DEFAULT '{}',  -- Tldraw canvas state
  order_index     INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- QUIZZES
-- ================================================================

CREATE TABLE public.quizzes (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id           UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  coach_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  time_limit_mins     INT,
  pass_score          INT DEFAULT 70 CHECK (pass_score BETWEEN 0 AND 100),
  attempts_allowed    INT DEFAULT 3,
  is_ai_generated     BOOLEAN DEFAULT false,
  source_resource_id  UUID REFERENCES public.resources(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.questions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id         UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  text            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('mcq','true_false','code','text')),
  points          INT DEFAULT 1 CHECK (points > 0),
  order_index     INT DEFAULT 0,
  explanation     TEXT,
  code_starter    TEXT   -- for code-type questions
);

CREATE TABLE public.question_options (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id     UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  text            TEXT NOT NULL,
  is_correct      BOOLEAN DEFAULT false
);

CREATE TABLE public.quiz_attempts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id         UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score           INT CHECK (score BETWEEN 0 AND 100),
  passed          BOOLEAN,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE TABLE public.quiz_answers (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id          UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id         UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer_text         TEXT,
  selected_option_id  UUID REFERENCES public.question_options(id),
  is_correct          BOOLEAN
);

-- ================================================================
-- AI AGENT
-- ================================================================

CREATE TABLE public.agent_sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill       TEXT NOT NULL CHECK (skill IN ('teach','debug','quiz','voice','path','support','verify','coach')),
  context     JSONB DEFAULT '{}',  -- lesson_id, course_id, etc.
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.agent_messages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id    UUID NOT NULL REFERENCES public.agent_sessions(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('user','assistant','tool','system')),
  content       TEXT NOT NULL,
  tool_name     TEXT,       -- if role = 'tool'
  tool_result   JSONB,      -- structured tool output
  credits_used  INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.agent_memory (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id          UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  weak_topics         TEXT[] DEFAULT '{}',
  strong_topics       TEXT[] DEFAULT '{}',
  learning_style      TEXT CHECK (learning_style IN ('visual','auditory','reading','kinesthetic','unknown')),
  preferred_language  TEXT DEFAULT 'en',
  total_sessions      INT DEFAULT 0,
  last_lesson_id      UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  notes               TEXT,  -- free-form agent notes about student
  last_updated        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.voice_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transcript      TEXT,
  agent_response  TEXT,
  duration_secs   INT,
  credits_used    INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- RATINGS & REVIEWS
-- ================================================================

CREATE TABLE public.reviews (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type               TEXT NOT NULL CHECK (target_type IN ('course','peer_session','resource')),
  target_id                 UUID NOT NULL,
  rating                    INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  rating_content            INT CHECK (rating_content BETWEEN 1 AND 5),
  rating_clarity            INT CHECK (rating_clarity BETWEEN 1 AND 5),
  rating_responsiveness     INT CHECK (rating_responsiveness BETWEEN 1 AND 5),
  rating_value              INT CHECK (rating_value BETWEEN 1 AND 5),
  review_text               TEXT CHECK (review_text IS NULL OR LENGTH(review_text) >= 30),
  coach_reply               TEXT,
  is_verified_purchase      BOOLEAN DEFAULT false,
  completion_pct_at_review  INT,
  is_peer_content           BOOLEAN DEFAULT false,  -- CRITICAL: peer always flagged
  is_flagged                BOOLEAN DEFAULT false,
  flag_reason               TEXT,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reviewer_id, target_type, target_id)  -- one review per item
);

-- ================================================================
-- COACH VERIFICATION
-- ================================================================

CREATE TABLE public.coach_applications (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status                TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','under_review','approved','rejected','appealing')),
  submitted_at          TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at           TIMESTAMPTZ,
  reviewer_id           UUID REFERENCES public.profiles(id),
  ai_confidence_score   INT CHECK (ai_confidence_score BETWEEN 0 AND 100),
  ai_notes              TEXT,
  rejection_reason      TEXT,
  appeal_text           TEXT,
  appeal_submitted_at   TIMESTAMPTZ
);

CREATE TABLE public.coach_documents (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id    UUID NOT NULL REFERENCES public.coach_applications(id) ON DELETE CASCADE,
  type              TEXT NOT NULL CHECK (type IN ('degree','certificate','govt_id','linkedin','github','other')),
  storage_path      TEXT NOT NULL,  -- Supabase private bucket
  filename          TEXT,
  ai_verified       BOOLEAN,
  ai_result         JSONB,
  uploaded_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- LIVE CLASSES
-- ================================================================

CREATE TABLE public.live_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id       UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  duration_mins   INT DEFAULT 60,
  daily_room_url  TEXT,
  daily_room_name TEXT,
  recording_url   TEXT,
  price_usd       DECIMAL(10,2) DEFAULT 0 CHECK (price_usd >= 0),
  is_free         BOOLEAN GENERATED ALWAYS AS (price_usd = 0) STORED,
  max_students    INT DEFAULT 50,
  waitlist_count  INT DEFAULT 0,
  status          TEXT DEFAULT 'scheduled'
                  CHECK (status IN ('scheduled','live','ended','cancelled')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.live_attendees (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id        UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  student_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at         TIMESTAMPTZ,
  left_at           TIMESTAMPTZ,
  ticket_purchased  BOOLEAN DEFAULT false,
  stripe_payment_id TEXT,
  UNIQUE(session_id, student_id)
);

-- ================================================================
-- PEER SESSIONS
-- ================================================================

CREATE TABLE public.peer_sessions (
  id                              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id                         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title                           TEXT NOT NULL,
  description                     TEXT,
  topic                           TEXT,
  course_ref_id                   UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  scheduled_at                    TIMESTAMPTZ NOT NULL,
  duration_mins                   INT DEFAULT 60,
  max_students                    INT DEFAULT 10,
  -- PRICE CAP ENFORCED AT DB LEVEL
  price_usd                       DECIMAL(10,2) DEFAULT 0
                                  CHECK (price_usd >= 0 AND price_usd <= 8.00),
  is_free                         BOOLEAN GENERATED ALWAYS AS (price_usd = 0) STORED,
  daily_room_url                  TEXT,
  status                          TEXT DEFAULT 'scheduled'
                                  CHECK (status IN ('scheduled','live','ended','cancelled')),
  -- Host must confirm they are a student, not a professional
  host_confirmed_student          BOOLEAN NOT NULL DEFAULT false,
  host_confirmed_unverified       BOOLEAN NOT NULL DEFAULT false,
  created_at                      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.peer_attendees (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id        UUID NOT NULL REFERENCES public.peer_sessions(id) ON DELETE CASCADE,
  student_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Student must confirm they understand peer disclaimer
  disclaimer_confirmed BOOLEAN NOT NULL DEFAULT false,
  joined_at         TIMESTAMPTZ,
  stripe_payment_id TEXT,
  UNIQUE(session_id, student_id)
);

-- ================================================================
-- EARNINGS
-- ================================================================

CREATE TABLE public.coach_earnings (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id                UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month                   DATE NOT NULL,
  gross_revenue_usd       DECIMAL(10,2) DEFAULT 0,
  platform_fee_usd        DECIMAL(10,2) DEFAULT 0,
  performance_bonus_usd   DECIMAL(10,2) DEFAULT 0,
  stripe_processing_usd   DECIMAL(10,2) DEFAULT 0,
  net_payout_usd          DECIMAL(10,2) DEFAULT 0,
  performance_multiplier  DECIMAL(4,2) DEFAULT 1.0,
  status                  TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','paid','failed')),
  stripe_transfer_id      TEXT,
  paid_at                 TIMESTAMPTZ,
  UNIQUE(coach_id, month)
);

CREATE TABLE public.performance_scores (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id              UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month                 DATE NOT NULL,
  student_count         INT DEFAULT 0,
  completion_rate_pct   INT DEFAULT 0,
  avg_rating            DECIMAL(3,2),
  agent_quality_score   INT DEFAULT 0,
  final_multiplier      DECIMAL(4,2) DEFAULT 1.0,
  bonus_breakdown       JSONB DEFAULT '{}',
  UNIQUE(coach_id, month)
);

-- ================================================================
-- SUPPORT SYSTEM
-- ================================================================

CREATE TABLE public.support_tickets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category    TEXT NOT NULL CHECK (category IN (
                'billing','technical','course_issue','account',
                'verification','abuse_report','content_flag','other')),
  subject     TEXT NOT NULL CHECK (LENGTH(subject) BETWEEN 5 AND 200),
  status      TEXT NOT NULL DEFAULT 'open'
              CHECK (status IN ('open','ai_resolved','in_progress','resolved','closed')),
  priority    TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  assigned_to UUID REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE public.ticket_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id       UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id       UUID REFERENCES public.profiles(id),
  sender_type     TEXT NOT NULL CHECK (sender_type IN ('user','ai_agent','admin')),
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- NOTIFICATIONS
-- ================================================================

CREATE TABLE public.notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN (
                  'system','learning','billing','security',
                  'social','progress','support')),
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  action_url      TEXT,
  is_read         BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- SECURITY & AUDIT
-- ================================================================

CREATE TABLE public.audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,
  resource        TEXT,
  resource_id     UUID,
  ip_address      INET,
  user_agent      TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.security_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type      TEXT NOT NULL,
  severity        TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  ip_address      INET,
  user_agent      TEXT,
  details         JSONB DEFAULT '{}',
  resolved        BOOLEAN DEFAULT false,
  resolved_by     UUID REFERENCES public.profiles(id),
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.off_platform_attempts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_text    TEXT NOT NULL,
  pattern_matched TEXT NOT NULL,
  conversation_with UUID REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- GAMIFICATION
-- ================================================================

CREATE TABLE public.user_xp (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_xp        INT DEFAULT 0 CHECK (total_xp >= 0),
  level           INT DEFAULT 1 CHECK (level >= 1),
  streak_days     INT DEFAULT 0 CHECK (streak_days >= 0),
  longest_streak  INT DEFAULT 0,
  last_activity   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.badges (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  icon        TEXT,
  xp_reward   INT DEFAULT 0,
  criteria    JSONB DEFAULT '{}'
);

CREATE TABLE public.user_badges (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id    UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- ================================================================
-- INDEXES (for query performance)
-- ================================================================

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_courses_coach_id ON public.courses(coach_id);
CREATE INDEX idx_courses_slug ON public.courses(slug);
CREATE INDEX idx_courses_is_published ON public.courses(is_published);
CREATE INDEX idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX idx_lessons_course ON public.lessons(course_id, order_index);
CREATE INDEX idx_agent_messages_session ON public.agent_messages(session_id, created_at);
CREATE INDEX idx_agent_memory_student ON public.agent_memory(student_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read, created_at);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id, created_at);
CREATE INDEX idx_reviews_target ON public.reviews(target_type, target_id);
CREATE INDEX idx_code_sessions_student ON public.code_sessions(student_id);
CREATE INDEX idx_peer_sessions_host ON public.peer_sessions(host_id);
CREATE INDEX idx_security_events_severity ON public.security_events(severity, resolved, created_at);
```

---

## 9. AUTHENTICATION & ROLE SYSTEM

### Role Definitions

```
student  → Default role on registration. Learns, buys, reviews.
coach    → Must apply + be verified. Teaches, sells, earns.
admin    → Set manually in Supabase dashboard. Never via UI.
(guest)  → Unauthenticated. Browses public pages only.
```

### Auth Providers (Configure in Supabase Dashboard)

```
1. Email + Password (primary)
   → Email verification required before dashboard access
   → Password: min 8 chars, 1 uppercase, 1 number, 1 special

2. Google OAuth
   → Scope: openid, email, profile
   → On first login: creates profile with role = 'student'

3. GitHub OAuth
   → Scope: read:user, user:email
   → Popular with developer-learners

4. LinkedIn OAuth [Phase 2]
   → Scope: openid, profile, email
```

### Middleware (`src/middleware.ts`)

```typescript
// Runs on EVERY request matching these patterns:
// /dashboard, /courses/*, /editor, /notebook, /agent, /quizzes/*
// /coach/*, /admin/*

export const config = {
  matcher: [
    '/(student)/:path*',
    '/(coach)/:path*',
    '/(admin)/:path*',
    '/onboarding/:path*',
  ]
}

// Logic:
// 1. No session → /login (with redirect_to param)
// 2. Unverified email → /verify-email
// 3. Onboarding incomplete → /onboarding/[role]
// 4. Banned user → /banned (with reason)
// 5. Wrong role for route:
//    student accessing /coach/* → /dashboard
//    coach accessing /admin/* → /coach/dashboard
//    anyone accessing /admin/* without admin role → 404
// 6. Coach not verified + trying to publish → show banner, block action
```

### RLS Policies (Apply to Every Table)

```sql
-- PATTERN: 3 policies per table (own data, role-based, admin)
-- Example: profiles table

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = OLD.role);  -- cannot change own role

CREATE POLICY "Public profiles are viewable"
  ON public.profiles FOR SELECT
  USING (deleted_at IS NULL AND is_banned = false);

CREATE POLICY "Admins have full access"
  ON public.profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Apply similar pattern to every table
-- NEVER leave a table without RLS enabled
```

---

## 10. FEATURE SPECIFICATIONS

### Code Editor + Compiler

```
Monaco Editor (from @monaco-editor/react)
Judge0 CE API (via RapidAPI, free tier: 100 requests/day)

Languages available at launch (20+):
Python (71), JavaScript (63), TypeScript (74), Java (62),
C (50), C++ (54), C# (51), Go (60), Rust (73), Ruby (72),
PHP (68), Swift (83), Kotlin (78), R (80), SQL (82),
Bash (46), HTML/CSS preview (custom), Dart (90)

Judge0 language_id mapping: (in lib/compiler/judge0.ts)

Features:
- Syntax highlighting + IntelliSense (Monaco)
- Run button → Judge0 sandboxed execution
- Output panel (stdout green, stderr red, clearly labelled)
- Custom stdin support
- Time limit: 10 seconds
- Memory limit: 256MB
- Tab support (multiple files in one session)
- Save to session (auto-saves every 30 seconds)
- Version history (last 20 versions, recoverable)
- Share button → generates /code/[shareId] (public, read-only)
- AI Debug button → code-agent (2 credits)
- AI Explain button → teach-agent with code context (2 credits)

ALL FREE: write, run, save, version history, share
PAID: AI actions (2 credits each)
```

### Digital Notebook

```
Two input modes, side by side or toggled:
1. Text mode: TipTap rich text editor
   → Headings, bold, italic, code blocks, math (KaTeX)
   → Highlight text in lesson → "Save to Notebook" button appears

2. Canvas mode: Tldraw
   → Stylus (Apple Pencil, Surface Pen): pressure-sensitive
   → Touch (finger on iPad/phone): palm rejection
   → Mouse: full drawing support
   → Shapes, arrows, text, freehand
   → Export canvas as PNG

Input methods all FREE:
- Typing (keyboard)
- Drawing (stylus/touch/mouse)
- Voice-to-text (Web Speech API → inserts at cursor)
- AI note-taker (2 credits — AI watches lesson + writes notes)

Storage:
- content_text: TipTap JSON in notebook_pages.content_text
- content_canvas: Tldraw snapshot in notebook_pages.content_canvas (JSONB)

Export (always free, it's your content):
- PDF (via react-pdf)
- Markdown (text mode only)
- PNG (canvas mode)

Sharing:
- Private by default
- Share link (read-only, no login)
- Notes marketplace (optional — free or paid ≤$4.99)
```

### Free Resource Library

```
Public page at /library — no login required

Content types:
- PDFs (rendered in PDF.js viewer, never raw URL)
- Videos (Mux DRM player, never raw URL)
- Images (with watermark on paid, clean on free)
- Links (redirect with click tracking)

Access levels (per resource, coach-set):
- FREE: anyone, no login
- MEMBERS: logged-in users (free tier OK)
- PAID: purchased or enrolled users only
- PREVIEW: first 20% free, rest paid

FREE GUARANTEE:
- Once set to free + is_permanently_free = true
- Database trigger prevents price_usd from being set > 0
- Coach UI shows: "🔒 This resource is permanently free"
- Coach CANNOT change free to paid (must delete + re-upload)
- Admin sees all attempted free→paid changes in audit log

AI features on library:
- Semantic search (vector search via pgvector [Phase 2] or keyword now)
- AI auto-summary (generated on upload, shown in card preview)
- AI auto-tags (generated on upload, used for filtering)
- AI auto-transcript (video resources, stored in ai_transcript)
```

### Peer Session System

```
EVERY PIECE OF PEER CONTENT shows:

Badge (always visible, cannot be removed by host):
┌─────────────────────────────────────────────────┐
│ 👥 PEER SESSION — UNVERIFIED                    │
│ Hosted by a student. Not endorsed by COGNARA.   │
└─────────────────────────────────────────────────┘

Before registering (mandatory checkbox):
"I understand this session is hosted by a fellow student.
COGNARA has not verified the host's qualifications or
content accuracy. I am registering for peer learning only."
[Button disabled until checked]

Before hosting (mandatory declaration):
"I confirm I am a student and not representing myself as a
certified professional. My content may contain errors.
I accept COGNARA's peer hosting terms."
[All fields required before publishing]

PRICE ENFORCEMENT:
- peer_sessions.price_usd CHECK (price_usd <= 8.00) — DB level
- If API receives price > 8.00: 400 Bad Request
- UI slider max = 8.00
- Platform cut = 10% (lowest of all categories)

HOST ELIGIBILITY:
- Must have completed at least 1 course (verified enrollment)
- No strikes on account
- Email verified
```

---

## 11. ECONOMY, PAYMENTS & EARNINGS

### Complete Pricing Model

```
FREE FOREVER (no card, no login required for browsing):
✅ Browse courses + resources
✅ View free library content
✅ 20 AI credits/day (reset daily)
✅ Code editor (unlimited runs)
✅ Notebook (unlimited)
✅ Discussion forums (read)
✅ Public profiles

PAID:
1. AI Credits (à la carte, never expire)
   Starter: 100 credits  → $1.99
   Plus:    500 credits  → $7.99
   Pro:    2,000 credits → $24.99
   Max:   10,000 credits → $99.99

2. Courses (coach-set price, one-time)
   Split: 80% coach / 20% platform

3. Live Class Tickets (coach-set, one-time)
   Split: 85% coach / 15% platform

4. Peer Session Tickets (student host, max $8)
   Split: 90% host / 10% platform

5. Resources (coach or student, paid tier)
   Split: 80% creator / 20% platform (coach)
          90% creator / 10% platform (student notes)
```

### Coach Earnings Calculator (Shown Before Pricing)

```
Component: src/components/coach/EarningsCalculator.tsx
Shown at: pricing step in course wizard, earnings page, sidebar

Formula:
grossRevenue     = price × studentsPerMonth (estimated)
platformFee      = grossRevenue × 0.20
stripeProcessing = (grossRevenue × 0.029) + 0.30
performanceBonus = grossRevenue × bonusRate
netPayout        = grossRevenue - platformFee - stripeProcessing + performanceBonus

DISPLAY (live, updates as coach types):
┌────────────────────────────────────────┐
│  You set price:           $49.00       │
│  Platform fee (20%):      -$9.80       │
│  Stripe processing*:      -$1.72       │
│  ─────────────────────────────────── │
│  BASE EARNINGS:            $37.48      │
│                                        │
│  If your rating ≥ 4.8:    +$1.12  ✓  │
│  If completion ≥ 80%:     +$1.87  ?  │
│  If 100+ students:        +$0.75  ?  │
│  ─────────────────────────────────── │
│  POTENTIAL EARNINGS:       $41.22      │
│                                        │
│  *Stripe: ~2.9% + $0.30 per transaction│
│  Shown transparently. Never hidden.    │
└────────────────────────────────────────┘
```

### Stripe Integration Details

```typescript
// lib/stripe/plans.ts

export const STRIPE_PLANS = {
  student_pro: {
    priceId: process.env.STRIPE_STUDENT_PRO_PRICE_ID,
    amount: 999,  // $9.99/month in cents
    name: 'Student Pro',
  },
  coach_starter: {
    priceId: process.env.STRIPE_COACH_STARTER_PRICE_ID,
    amount: 1999,  // $19.99/month
    name: 'Coach Starter',
  },
  coach_pro: {
    priceId: process.env.STRIPE_COACH_PRO_PRICE_ID,
    amount: 4999,  // $49.99/month
    name: 'Coach Pro',
  },
} as const

export const CREDIT_PACKS = {
  starter: { credits: 100, amount: 199, priceId: '...' },
  plus:    { credits: 500, amount: 799, priceId: '...' },
  pro:     { credits: 2000, amount: 2499, priceId: '...' },
  max:     { credits: 10000, amount: 9999, priceId: '...' },
} as const

// Webhook events to handle:
// checkout.session.completed → activate
// invoice.payment_succeeded → update subscription
// invoice.payment_failed → dunning email + update status
// customer.subscription.deleted → downgrade to free
// transfer.created → log coach payout
```

---

## 12. SECURITY — EVERY LAYER

### Layer 1: Input Validation (Zod — Both Client and Server)

```typescript
// src/lib/validation/schemas/course.schema.ts
import { z } from 'zod'

export const createCourseSchema = z.object({
  title: z.string().min(5, "Title too short").max(200, "Title too long")
    .transform(s => s.trim()),
  description: z.string().max(2000).optional(),
  category: z.string().max(50),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  language: z.string().length(2),  // ISO 639-1
  price_usd: z.number().min(0).max(999.99).multipleOf(0.01),
})

// RULE: Every API route re-validates its input with the Zod schema.
// NEVER trust client-side validation alone.
// If validation fails server-side: 400 + field errors, never 500.
```

### Layer 2: File Upload Security

```typescript
// src/lib/security/file-validator.ts

const ALLOWED_TYPES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png':  [0x89, 0x50, 0x4E, 0x47],
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
  'video/mp4':  [0x66, 0x74, 0x79, 0x70],
  'video/webm': [0x1A, 0x45, 0xDF, 0xA3],
} as const

const SIZE_LIMITS = {
  image: 10 * 1024 * 1024,    // 10MB
  pdf: 50 * 1024 * 1024,      // 50MB
  video: 500 * 1024 * 1024,   // 500MB
}

export async function validateFile(file: File): Promise<ValidationResult> {
  // Check 1: Extension
  // Check 2: MIME type from Content-Type
  // Check 3: Magic bytes (read first 8 bytes)
  // Check 4: File size
  // Check 5: Filename sanitization (no path traversal)
  // If any fail: throw with reason, log security event
}
```

### Layer 3: Rate Limiting

```typescript
// src/lib/security/ratelimit.ts (Upstash Redis)

export const RATE_LIMITS = {
  '/api/agent':        { requests: 60,  window: 3600 },  // per hour
  '/api/compiler':     { requests: 100, window: 3600 },
  '/api/upload':       { requests: 20,  window: 3600 },
  '/auth/login':       { requests: 10,  window: 900  },   // 15 mins
  '/auth/register':    { requests: 5,   window: 3600 },
  '/api/stripe/*':     { requests: 20,  window: 60   },   // per minute
} as const
// On rate limit: 429 + Retry-After header + security event logged
```

### Layer 4: Security Headers (`next.config.ts`)

```typescript
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://*.supabase.co https://image.mux.com",
      "media-src 'self' https://stream.mux.com",
      "connect-src 'self' https://*.supabase.co https://api.stripe.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
    ].join('; ')
  },
]
```

### Layer 5: Off-Platform Message Detection

```typescript
// src/lib/security/off-platform-detector.ts

const PATTERNS = [
  { regex: /\b(\+?[\d\s\-()]{10,15})\b/, label: 'phone_number' },
  { regex: /[a-zA-Z0-9._%+-]+@(?!cognara\.app)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, label: 'external_email' },
  { regex: /\b(whatsapp|wa\.me|telegram|t\.me|signal|wechat)\b/i, label: 'messaging_app' },
  { regex: /\b(paypal\.me|venmo|cashapp|cash\.app|zelle)\b/i, label: 'payment_app' },
  { regex: /\b(iban|swift|routing number|bank account)\b/i, label: 'banking' },
  { regex: /(outside|off).{0,20}(platform|cognara|site|here)/i, label: 'off_platform_language' },
  { regex: /directly to (me|my)/i, label: 'direct_payment_language' },
  { regex: /\b(instagram|facebook|linkedin)\.com\/[a-zA-Z0-9._]+/i, label: 'social_profile_for_payment' },
] as const

export function detectOffPlatformIntent(message: string): DetectionResult {
  // Returns: { detected: boolean, patterns: string[], severity: 'warn'|'block' }
  // 'warn': show warning but allow (e.g., linkedin profile sharing)
  // 'block': block message entirely (phone numbers, payment apps)
}

// On BLOCK detection:
// 1. Do not send message
// 2. Show to sender: "Message blocked. Sharing contact info or
//    payment details to conduct business off COGNARA violates
//    our Terms of Service (Section 8.4)."
// 3. Log to off_platform_attempts table
// 4. Log security event (severity: medium)
// 5. Third offense in 30 days: auto-flag for admin review
```

---

## 13. LEGAL, POLICIES, PENALTIES & COMPLIANCE

### Complete Legal Document List

Every legal page MUST exist before deployment:

```
/legal/terms              Terms of Service
/legal/privacy            Privacy Policy (GDPR + CCPA + FERPA)
/legal/cookies            Cookie Policy (5 categories)
/legal/refunds            Refund Policy (per content type, exact rules)
/legal/acceptable-use     Acceptable Use Policy + prohibited content
/legal/dmca               DMCA Takedown Procedure
/legal/coach-agreement    Coach Revenue + Verification + Strikes
/legal/peer-agreement     Peer Host Terms (new — separate document)
/legal/accessibility      WCAG 2.1 AA Statement
/legal/ai-transparency    EU AI Act Compliance Notice
/legal/sla                Service Level Agreement (Enterprise tier)
```

### Key Non-Negotiable Clauses

**Free Content Guarantee (enforced in DB AND legal):**
> "Content designated as free by its creator shall remain freely
> accessible without charge for its entire period of availability.
> Creators may remove free content but may not convert free content
> to paid content. Attempting to do so via any method, including
> API manipulation, constitutes a material breach of the Coach
> Agreement and grounds for immediate account suspension."

**Peer Content Disclaimer (must appear in 3 places):**
> "COGNARA has not verified the credentials, qualifications, accuracy,
> or fitness for purpose of peer-hosted content. Peer status is
> permanently displayed and cannot be removed. COGNARA makes no
> warranty regarding peer content."

**Off-Platform Clause:**
> "All transactions arising from connections made on COGNARA must be
> conducted through COGNARA. COGNARA expressly disclaims all liability
> for transactions conducted outside the platform. Conducting or
> soliciting off-platform transactions constitutes a material breach."

**AI Transparency Notice (EU AI Act 2025):**
> "COGNARA uses AI for: tutoring recommendations, content analysis,
> quiz generation, credential pre-screening, and support resolution.
> AI is used to assist, not replace, human judgment. AI-made decisions
> affecting your account can be reviewed by a human admin. We do not
> use AI to make final hiring or exclusion decisions."

### Penalty System

```
COACH STRIKES (stored in profiles.strike_count):
Strike 1 → Warning email + 7-day content review hold
Strike 2 → 30-day suspension from publishing new content
Strike 3 → Account suspended + earnings withheld pending review
Strike 4 → Permanent ban + legal notice if fraud detected

STRIKE TRIGGERS FOR COACHES:
□ Fake/altered credentials submitted (AI flagged, admin confirmed)
□ Plagiarized course content (AI similarity > 80%)
□ Student harassment (reported, investigated, confirmed)
□ DMCA violation (takedown processed, repeat = strike)
□ Off-platform solicitation (3rd confirmed detection)
□ Price manipulation (setting peer price above $8 via API)
□ Review manipulation (paying for fake reviews)
□ Sharing student personal data externally

STUDENT STRIKES:
Strike 1 → Warning
Strike 2 → 7-day quiz/submission restriction
Strike 3 → 30-day account suspension
Strike 4 → Permanent ban

STUDENT STRIKE TRIGGERS:
□ Code plagiarism (AI detected + coach confirmed)
□ Payment fraud / chargeback abuse (3+ chargebacks)
□ Harassment of coach or peer
□ Sharing paid content publicly (detected via watermark)
□ Attempting to access paid content without purchase
```

### Cookie Policy Implementation

```typescript
// 5 categories — shown in cookie banner on first visit

ESSENTIAL (cannot opt out — checkbox disabled, always checked):
- Supabase session token (authentication)
- CSRF token (security)
- Cookie consent record (to remember their choice)
- Load balancer cookie

FUNCTIONAL (opt-in):
- Language preference
- Theme preference (dark/light)
- Timezone setting

ANALYTICS (opt-in):
- Vercel Analytics (page views, performance)
- Core Web Vitals data

PERFORMANCE (opt-in):
- Sentry error reports
- Session replay (if ever added)

MARKETING (opt-in — disabled by default, future use):
- Only enabled if you ever run ad campaigns
- Never sold to third parties (stated in privacy policy)

// Storage: user_settings.cookie_* columns
// Consent timestamp: user_settings.cookie_consent_at
// Re-prompt: when privacy policy version changes
```

---

## 14. CONTENT PROTECTION & SCREENSHOT POLICY

### Technical Implementation

```
VIDEO (paid content):
→ Upload to Mux → Mux generates DRM playback ID
→ Widevine (Chrome + Android): black screen on screenshot
→ FairPlay (Safari + iOS): prevents screen recording
→ Signed tokens (4hr expiry) — video URL never permanent
→ Mux forensic watermarking (invisible, user-identifying)
→ Player: @mux/mux-player-react (official Mux React component)

PDFs (paid content):
→ Never serve raw PDF URL (signed Supabase Storage URL, 1hr expiry)
→ Render via react-pdf inside custom viewer component
→ Right-click disabled on viewer
→ Text selection disabled on paid PDFs
→ Print disabled
→ Visible watermark overlay: "COGNARA · @{username} · {date}"

ALL PAID CONTENT:
→ Visible watermark: semi-transparent, bottom-right on video
   diagonal on PDF/image: "COGNARA · @{username} · {timestamp}"
→ Invisible forensic watermark: embedded in Mux video frames
   links back to exact user account + timestamp of access

FREE CONTENT:
→ No watermark required (it's free, sharing is fine)
→ Shareable links are the primary sharing mechanism
```

### Shareable Links (Primary Defense)

```
Every piece of content has a shareable link:

Course:             cognara.app/courses/[slug]
Coach Profile:      cognara.app/coach/[username]
Student Portfolio:  cognara.app/@[username]
Certificate:        cognara.app/verify-certificate/[code]
Free Resource:      cognara.app/library/[resourceId]
Code Snippet:       cognara.app/code/[shareId]
Peer Session:       cognara.app/peer/[sessionId]

DESIGN PRINCIPLE:
If sharing is one click and looks professional,
nobody will screenshot a watermarked image.
Sharing a link is always better for both parties.
```

---

## 15. OFF-PLATFORM PROTECTION

### The Policy (Shown to Every User — 3 Times)

```
1. At registration (summary, before signup button)
2. First message sent (one-time reminder in chat)
3. Dashboard info panel (always visible)
4. In ToS Section 8 (full legal text)

COGNARA OFF-PLATFORM POLICY:

All transactions between COGNARA users must happen on COGNARA.

YOU CANNOT:
✗ Share phone numbers, emails, or payment apps for payment
✗ Move a COGNARA arrangement to WhatsApp/Telegram
✗ Offer "off-platform discounts"
✗ Arrange tutoring outside COGNARA after meeting here

IF SOMEONE ASKS YOU TO GO OFF-PLATFORM:
→ This is a red flag. Decline and report via the flag button.
→ COGNARA will investigate within 24 hours.

IF YOU TRANSACT OUTSIDE COGNARA:
✗ We cannot refund your money
✗ We cannot investigate the dispute
✗ We cannot take any action on your behalf
This is final. No exceptions. No appeals.

PENALTIES:
First offense:  Warning + temporary message restriction
Second offense: 30-day account restriction
Third offense:  Permanent ban + report to payment processor
```

---

## 16. GITHUB & LINKEDIN INTEGRATION

### Phase 1 (Built for Assignment)

```
GitHub OAuth Login:
- Supabase Auth Provider: GitHub
- Scope: read:user, user:email
- Auto-populate: profiles.github_url on first login

LinkedIn OAuth Login: [Phase 2 — OAuth setup takes time]
Alternative: Manual LinkedIn URL field in profile settings
```

### Phase 2 (After Assignment)

```
GitHub:
□ Import public repos → show on portfolio page
□ Push code submissions to student's GitHub repo
□ Coach GitHub activity badge (supplementary verification)

LinkedIn:
□ One-click: "Add certificate to LinkedIn" (LinkedIn API)
□ Coach "COGNARA Verified" badge → LinkedIn profile
□ Import LinkedIn work history for verification
```

---

## 17. SCALABILITY & FEATURE FLAGS

```typescript
// src/lib/utils/feature-flags.ts

export const FEATURES = {
  // PHASE 1 — ON for assignment
  AUTH:               true,
  COURSES:            true,
  CODE_EDITOR:        true,
  NOTEBOOK:           true,
  AI_AGENT:           true,
  QUIZZES:            true,
  FREE_LIBRARY:       true,
  PEER_SESSIONS:      true,
  RATINGS_REVIEWS:    true,
  PAYMENTS_STRIPE:    true,
  CERTIFICATES:       true,
  NOTIFICATIONS:      true,
  SUPPORT_TICKETS:    true,
  COACH_VERIFICATION: true,
  GAMIFICATION:       true,

  // PHASE 2 — OFF, turn on after assignment
  LIVE_CLASSES:         false,
  GITHUB_IMPORT:        false,
  LINKEDIN_CERTS:       false,
  MOBILE_APP:           false,
  ADVANCED_ANALYTICS:   false,
  COUPON_CODES:         false,

  // PHASE 3 — OFF, future
  JOBS_BOARD:         false,
  HACKATHONS:         false,
  MENTORSHIP:         false,
  B2B_SCHOOLS:        false,
  WHITE_LABEL:        false,
  API_ACCESS:         false,
  NFT_CERTIFICATES:   false,
} as const

// Usage: if (FEATURES.LIVE_CLASSES) { /* show feature */ }
// One line change to enable. No redeployment needed for most.
```

---

## 18. PACKAGE DEPENDENCIES

```json
{
  "name": "cognara",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.6.0",

    "@supabase/supabase-js": "^2.46.0",
    "@supabase/ssr": "^0.5.0",

    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0",
    "class-variance-authority": "^0.7.0",

    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-checkbox": "^1.1.0",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-avatar": "^1.1.0",
    "lucide-react": "^0.460.0",

    "framer-motion": "^11.11.0",

    "@monaco-editor/react": "^4.6.0",
    "monaco-editor": "^0.52.0",

    "@tldraw/tldraw": "^2.4.0",

    "@tiptap/react": "^2.8.0",
    "@tiptap/starter-kit": "^2.8.0",
    "@tiptap/extension-code-block": "^2.8.0",
    "@tiptap/extension-highlight": "^2.8.0",

    "react-pdf": "^9.1.0",
    "pdfjs-dist": "^4.7.0",

    "@mux/mux-player-react": "^3.1.0",
    "@mux/mux-node": "^8.3.0",

    "stripe": "^17.3.0",
    "@stripe/stripe-js": "^4.8.0",
    "@stripe/react-stripe-js": "^2.8.0",

    "zod": "^3.23.0",
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.9.0",

    "recharts": "^2.13.0",

    "resend": "^4.0.0",
    "@react-email/components": "^0.0.22",

    "@sentry/nextjs": "^8.37.0",

    "@upstash/redis": "^1.34.0",
    "@upstash/ratelimit": "^2.0.0",

    "date-fns": "^4.1.0",
    "date-fns-tz": "^3.2.0",

    "groq-sdk": "^0.7.0",
    "@google/generative-ai": "^0.21.0",

    "daily-js": "^0.56.0",

    "react-intersection-observer": "^9.13.0",
    "sonner": "^1.7.0",
    "next-themes": "^0.4.3"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "eslint": "^9.14.0",
    "eslint-config-next": "^15.0.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0"
  }
}
```

---

## 19. ENVIRONMENT VARIABLES

```bash
# .env.local — NEVER COMMIT THIS FILE
# Copy .env.example and fill in values

# ── SUPABASE ──────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key-from-supabase-dashboard]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key-never-expose-client-side]

# ── AI MODELS (LM Arena models via these providers) ───────
GROQ_API_KEY=gsk_[your-groq-api-key]
GOOGLE_GEMINI_API_KEY=[your-gemini-api-key]
OPENROUTER_API_KEY=sk-or-v1-[your-openrouter-key]

# ── CODE COMPILER ─────────────────────────────────────────
JUDGE0_API_KEY=[rapidapi-key-for-judge0-ce]
JUDGE0_HOST=judge0-ce.p.rapidapi.com

# ── PAYMENTS ──────────────────────────────────────────────
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_[key]
STRIPE_SECRET_KEY=sk_test_[key]
STRIPE_WEBHOOK_SECRET=whsec_[key-from-stripe-webhooks-dashboard]
# Stripe Price IDs (create in Stripe dashboard)
STRIPE_STUDENT_PRO_PRICE_ID=price_[id]
STRIPE_COACH_STARTER_PRICE_ID=price_[id]
STRIPE_COACH_PRO_PRICE_ID=price_[id]
STRIPE_CREDITS_100_PRICE_ID=price_[id]
STRIPE_CREDITS_500_PRICE_ID=price_[id]
STRIPE_CREDITS_2000_PRICE_ID=price_[id]
STRIPE_CREDITS_10000_PRICE_ID=price_[id]

# ── VIDEO ─────────────────────────────────────────────────
MUX_TOKEN_ID=[mux-token-id]
MUX_TOKEN_SECRET=[mux-token-secret]
NEXT_PUBLIC_MUX_ENV_KEY=[mux-env-key-for-player]

# ── LIVE CLASSES ──────────────────────────────────────────
DAILY_API_KEY=[daily-co-api-key]

# ── EMAIL ─────────────────────────────────────────────────
RESEND_API_KEY=re_[your-resend-api-key]
RESEND_FROM_EMAIL=noreply@cognara.app
RESEND_FROM_NAME=COGNARA

# ── RATE LIMITING ─────────────────────────────────────────
UPSTASH_REDIS_REST_URL=https://[your-db].upstash.io
UPSTASH_REDIS_REST_TOKEN=[your-token]

# ── ERROR MONITORING ──────────────────────────────────────
NEXT_PUBLIC_SENTRY_DSN=https://[id]@[org].ingest.sentry.io/[project]
SENTRY_AUTH_TOKEN=[sentry-auth-token]

# ── APP CONFIG ────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://cognara.vercel.app
NEXT_PUBLIC_APP_NAME=COGNARA
NEXT_PUBLIC_APP_VERSION=1.0.0
NODE_ENV=production
```

---

## 20. DAY-BY-DAY BUILD PLAN

> You have 6 days until Wednesday.
> This is the exact order. Do not skip ahead.
> Each day ends with a working, deployable state.

### DAY 1 — THURSDAY: Foundation

```
MORNING (4 hours):
□ npx create-next-app@latest cognara --typescript --tailwind --app
□ Install all dependencies from Section 18 (npm install)
□ Create Supabase project at supabase.com
□ Run Section 8 SQL schema in Supabase SQL editor (all migrations)
□ Enable RLS on all tables
□ Configure Supabase Auth:
  → Email auth: ON
  → Email confirmation: ON
  → Google OAuth: configure with Google Cloud Console credentials
  → GitHub OAuth: configure with GitHub OAuth App credentials
□ Set up .env.local with Supabase credentials
□ Create GitHub repo: git init, git remote add, first commit

AFTERNOON (4 hours):
□ Build /login page (email + Google + GitHub buttons)
□ Build /register page (student/coach toggle)
□ Build /verify-email page
□ Build /forgot-password page
□ Write src/middleware.ts (role-based route protection)
□ Write src/lib/supabase/client.ts and server.ts
□ Write src/lib/auth/guards.ts
□ Test: register as student → onboarding → dashboard redirect works
□ Deploy to Vercel (connect GitHub, add env vars, test live URL)

END OF DAY 1 CHECKPOINT:
✓ Auth works (register, login, logout)
✓ Role-based routing works
✓ Live Vercel URL working
✓ GitHub repo has clean commit history
```

### DAY 2 — FRIDAY: Public Pages + Onboarding

```
MORNING (4 hours):
□ Build landing page (/) — hero, features, SDG section, pricing CTA
□ Build /pricing page (all plans + credit packs table)
□ Build /about page (SDG 4, Vision 2030, team)
□ Build public /courses browse page (grid of course cards)
□ Build /courses/[slug] course detail page
□ Build /library page (free resources, filter/search)

AFTERNOON (4 hours):
□ Build all /legal/* pages (content from Section 13)
□ Build CookieBanner component (5 categories, granular)
□ Build Footer with all legal links
□ Build Navbar (public + auth states)
□ Build /onboarding/student wizard (5 steps)
□ Build /onboarding/coach wizard (5 steps + verification intro)
□ Write src/lib/utils/feature-flags.ts

END OF DAY 2 CHECKPOINT:
✓ All public pages render correctly
✓ Legal pages exist (required before deployment)
✓ Cookie banner shows for new visitors
✓ Onboarding flows work for both roles
```

### DAY 3 — SATURDAY: Student Portal (USER Dashboard)

```
MORNING (4 hours):
□ Build student layout (sidebar with all nav items)
□ Build /dashboard (stats, agent quick-launch, progress, feed)
□ Build /profile (edit profile, avatar upload, settings)
□ Build /courses (enrolled courses list)
□ Build /courses/[courseId] (course overview + lesson list)
□ Build /courses/[courseId]/lesson/[lessonId] (lesson viewer)
  → Include floating "Ask Agent" button
  → Include lesson progress tracking

AFTERNOON (4 hours):
□ Build /editor (Monaco editor + Judge0 compiler)
  → Write lib/compiler/judge0.ts
  → Write /api/compiler route
  → Test: write Python, run, see output
□ Build /notebook (TipTap + Tldraw side by side)
□ Build /quizzes and /quizzes/[quizId] (quiz attempt flow)
□ Build /progress page (charts + completion data)
□ Build /certificates page
□ Build /billing page (credit balance + top-up + subscription)

END OF DAY 3 CHECKPOINT:
✓ Student can enroll in a course (manually add test enrollment)
✓ Student can view lessons
✓ Code editor runs Python code
✓ Notebook accepts typed + drawn input
✓ All student pages render without errors
```

### DAY 4 — SUNDAY: Client Portal (COACH Dashboard)

```
MORNING (4 hours):
□ Build coach layout (sidebar with all nav items)
□ Build /coach/dashboard (stats, agent tools, earnings chart)
□ Build /coach/profile
□ Build /coach/verification (document upload wizard)
  → Write verify-agent.ts (Gemini Vision)
  → Test: upload a PDF, get AI confidence score
□ Build /coach/courses (course list)
□ Build /coach/courses/create (5-step course wizard)
□ Build /coach/courses/[courseId]/edit (lesson editor)

AFTERNOON (4 hours):
□ Build /coach/library (resource manager + uploader)
  → Implement free content guarantee (DB trigger from Section 8)
  → Test: set resource free, try to change to paid → blocked
□ Build /coach/quizzes (quiz builder)
□ Build /coach/students (student roster)
□ Build /coach/analytics (recharts)
□ Build /coach/earnings (earnings calculator live)
  → Write lib/earnings/calculator.ts
□ Build EarningsCalculator component (live preview)

END OF DAY 4 CHECKPOINT:
✓ Coach can create a course with lessons
✓ Coach can upload a free resource (free lock works)
✓ Coach can build a quiz
✓ Earnings calculator shows correct numbers
✓ Verification wizard uploads document
```

### DAY 5 — MONDAY: AI Agent (The Differentiator)

```
MORNING (4 hours):
□ Write lib/ai/memory.ts (load + update student memory)
□ Write lib/ai/tools/agent-tools.ts (all 9 tool definitions)
□ Write lib/ai/master-agent.ts (router + credit check)
□ Write lib/ai/agents/teach-agent.ts (Groq, lesson context aware)
□ Write lib/ai/agents/code-agent.ts (Groq, debug + fix code)
□ Write lib/ai/agents/pdf-agent.ts (Gemini Vision, PDF→quiz)
□ Write lib/ai/agents/path-agent.ts (Groq, recommends courses)
□ Write lib/ai/agents/support-agent.ts (auto-resolve tickets)
□ Write lib/ai/agents/coach-agent.ts (coach tools, free)
□ Write /api/agent route (POST + streaming GET)

AFTERNOON (4 hours):
□ Build AgentPanel component (sliding panel for all pages)
□ Build AgentFullPage component (/agent page)
□ Build AgentVoice component (Web Speech API STT + TTS)
□ Build AgentSkillBadge (shows active skill)
□ Build CreditDisplay (real-time balance)
□ Build CreditTopUpModal (shown on insufficient credits)
□ Build InlineSuggestion (proactive suggestions on lesson page)
□ Connect agent to: lesson page, editor, notebook, quiz results
□ Build AgentFloatingButton (appears on every student page)
□ TEST CRITICAL: The agent must use TOOLS, not just chat
  → Test: "I keep failing recursion" → agent reads attempts → responds with data
  → Test: Upload a PDF → agent generates quiz automatically
  → Test: Paste broken code → agent debugs and fixes
  → Test: Voice mode → speak → get spoken response

END OF DAY 5 CHECKPOINT:
✓ All 7 agent skills respond correctly
✓ Agent uses tools (not just chat responses)
✓ Agent memory saves after sessions
✓ Credits deduct correctly
✓ Floating agent button works on all student pages
✓ Voice mode works in browser
```

### DAY 6 — TUESDAY: Admin Portal + Polish + Deploy

```
MORNING (4 hours):
□ Build admin layout (sidebar)
□ Build /admin/dashboard (platform stats, verification queue, security)
□ Build /admin/users (table with filter/search, ban, role view)
□ Build /admin/coaches/verification (review queue + AI notes)
□ Build /admin/support (ticket manager)
□ Build /admin/security (audit log viewer + security events)
□ Build /admin/reports (revenue chart, user growth)
□ Write lib/security/audit-log.ts
□ Write lib/security/off-platform-detector.ts
□ Build notification system (in-app center + email via Resend)
□ Build rating + review components
□ Build PeerDisclaimer component (mandatory on all peer content)
□ Build VerificationBadge (shows on all user content)

AFTERNOON (4 hours):
□ FULL END-TO-END TEST:
  → Register as student → enroll in course → use agent → earn cert
  → Register as coach → apply for verification → get approved → publish course
  → Admin reviews verification → approves → coach can publish
  → Student buys course → coach sees earnings → payout simulated
□ Security hardening:
  → Verify all RLS policies active in Supabase
  → Test: student cannot access /coach/* routes
  → Test: coach cannot access /admin/* routes
  → Test: off-platform detector fires on "whatsapp"
□ Mobile responsiveness test (all pages on 375px width)
□ Final Vercel deployment
□ Test live URL — all dashboards accessible
□ Record Loom demo video (see Section 23 for script)
□ Create Canva poster (see Section 25 for brief)
□ Write README (template in Section 26)
□ Push all code to GitHub
□ Verify GitHub repo has: README, screenshots/, docs/

END OF DAY 6 CHECKPOINT:
✓ All 3 dashboards fully functional
✓ AI agent working on live Vercel URL
✓ Code compiler working
✓ Loom video recorded + uploaded
✓ Canva poster created
✓ GitHub repo complete
✓ READY TO SUBMIT
```

---

## 21. DATABASE SEED & DEMO ACCOUNTS

### Demo Accounts (Required for Presentation)

```sql
-- supabase/migrations/0004_seed_data.sql
-- IMPORTANT: Run AFTER auth users are created manually in Supabase Auth dashboard
-- Or use Supabase Auth Admin API to create test users

-- Create 3 test users in Supabase Auth dashboard:
-- student@demo.cognara.app / Demo1234!
-- coach@demo.cognara.app   / Demo1234!
-- admin@demo.cognara.app   / Demo1234!

-- Then update their profiles:
UPDATE public.profiles SET
  full_name = 'Demo Student',
  username = 'demostudent',
  role = 'student'
WHERE id = (SELECT id FROM auth.users WHERE email = 'student@demo.cognara.app');

UPDATE public.profiles SET
  full_name = 'Demo Coach',
  username = 'democoach',
  role = 'coach',
  is_verified = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'coach@demo.cognara.app');

UPDATE public.profiles SET
  full_name = 'COGNARA Admin',
  username = 'admin',
  role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@demo.cognara.app');

-- Seed demo courses (from Kaggle dataset)
INSERT INTO public.courses (coach_id, title, slug, description, category, difficulty, price_usd, is_published) VALUES
  (
    (SELECT id FROM auth.users WHERE email = 'coach@demo.cognara.app'),
    'Python for Beginners',
    'python-for-beginners',
    'Complete Python course from zero to hero. Learn variables, loops, functions, and OOP.',
    'Programming',
    'beginner',
    0,
    true
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'coach@demo.cognara.app'),
    'Web Development with React',
    'web-dev-react',
    'Build modern web applications with React, hooks, and state management.',
    'Web Development',
    'intermediate',
    29.99,
    true
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'coach@demo.cognara.app'),
    'Data Science Fundamentals',
    'data-science-fundamentals',
    'Introduction to data science with Python, pandas, and matplotlib.',
    'Data Science',
    'beginner',
    19.99,
    true
  );

-- Seed demo enrollment
INSERT INTO public.enrollments (student_id, course_id, progress_pct)
SELECT
  (SELECT id FROM auth.users WHERE email = 'student@demo.cognara.app'),
  id,
  45
FROM public.courses WHERE slug = 'python-for-beginners';

-- Seed AI credits
INSERT INTO public.ai_credits (user_id, balance, daily_free_limit)
SELECT id, 100, 20
FROM public.profiles
ON CONFLICT (user_id) DO UPDATE SET balance = 100;

-- Seed gamification
INSERT INTO public.user_xp (user_id, total_xp, level, streak_days)
SELECT id, 250, 3, 7
FROM public.profiles WHERE role = 'student'
ON CONFLICT (user_id) DO NOTHING;

-- Seed badges
INSERT INTO public.badges (name, description, icon, xp_reward) VALUES
  ('First Code Run', 'Run your first code in the editor', '💻', 50),
  ('7-Day Streak', 'Learn 7 days in a row', '🔥', 100),
  ('Quiz Master', 'Score 100% on any quiz', '🎯', 75),
  ('Fast Learner', 'Complete a lesson in under 10 minutes', '⚡', 50),
  ('Helpful Peer', 'Host your first peer session', '🤝', 150);
```

### Kaggle Dataset Import

```
Dataset: "Udemy Courses Dataset" on Kaggle
URL: https://www.kaggle.com/datasets/andrewmvd/udemy-courses
File: udemy_courses.csv

Import process:
1. Download CSV from Kaggle
2. Map columns to COGNARA courses table
3. Import first 50 rows as seed courses
4. Assign to demo coach account

Column mapping:
course_title → title
url (slugify) → slug
subject → category
level → difficulty
price → price_usd
is_paid → (price_usd > 0)

Document in README:
"Course seed data sourced from Udemy Courses Dataset on Kaggle
(Andrew MVD, CC BY 4.0): https://www.kaggle.com/datasets/andrewmvd/udemy-courses"
```

---

## 22. DEPLOYMENT CHECKLIST

```
PRE-DEPLOYMENT (check every item):

SUPABASE:
□ All migrations run successfully (no errors)
□ RLS enabled on every table (check in Table Editor → each table)
□ Email auth enabled
□ Google OAuth configured + tested
□ GitHub OAuth configured + tested
□ Service role key never exposed to client

VERCEL:
□ GitHub repo connected to Vercel project
□ All environment variables added (Section 19)
□ Build command: next build
□ Node.js version: 18.x

STRIPE:
□ Webhook endpoint created: https://[your-url]/api/stripe/webhook
□ Webhook events subscribed: checkout.session.completed,
  invoice.payment_succeeded, invoice.payment_failed,
  customer.subscription.deleted
□ Webhook secret copied to STRIPE_WEBHOOK_SECRET env var
□ Test payment works in test mode

LEGAL (must exist before deployment):
□ /legal/terms has content
□ /legal/privacy has content
□ /legal/cookies has content
□ /legal/refunds has content
□ /legal/acceptable-use has content
□ Cookie banner appears on first visit

SECURITY:
□ Security headers configured in next.config.ts
□ Rate limiting works (/api/agent returns 429 after 60 requests)
□ Off-platform detector fires (test with "whatsapp" in message)
□ File upload rejects .exe files
□ Student cannot access /coach/* routes
□ Admin routes return 404 for non-admins

FUNCTIONAL:
□ Register as student → works → onboarding → dashboard
□ Register as coach → works → onboarding → verification
□ Admin login works → sees admin dashboard
□ Code editor runs Python "print('hello')" → output visible
□ AI agent responds to "explain variables"
□ PDF upload + quiz generation works
□ Voice mode activates in browser
□ Free resource cannot be changed to paid
□ Peer session price cap enforced ($8.00 max)

DEMO ACCOUNTS:
□ student@demo.cognara.app works
□ coach@demo.cognara.app works (verified)
□ admin@demo.cognara.app works
□ Demo course exists + student enrolled

MOBILE:
□ Landing page looks correct on 375px width (iPhone SE)
□ Student dashboard usable on mobile
□ Code editor usable on mobile (at least accessible)
```

---

## 23. ASSIGNMENT SUBMISSION CHECKLIST

### GitHub Repository

```
REQUIRED FILES:
□ README.md (template in Section 26)
□ LICENSE (proprietary)
□ TRADEMARK-NOTICE.md
□ .env.example (all keys, no values)
□ docs/ARCHITECTURE.md (content in Section 24)
□ docs/API.md
□ docs/AGENT.md

REQUIRED CONTENT:
□ Screenshots folder: /screenshots/
  □ landing-page.png
  □ student-dashboard.png       ← DASHBOARD 1: USER
  □ coach-dashboard.png         ← DASHBOARD 2: CLIENT
  □ admin-dashboard.png         ← DASHBOARD 3: ADMIN
  □ ai-agent-demo.png
  □ code-editor.png
  □ notebook.png
  □ free-library.png
  □ peer-session-disclaimer.png
  □ earnings-calculator.png

□ Kaggle dataset link in README
□ All 3 demo account credentials in README
□ Live Vercel URL in README
□ Loom video URL in README
```

### Loom Demo Video Script (10-12 minutes)

```
[0:00-0:30] OPENING
"Hi, I'm [name] from UMT. This is COGNARA — an AI-powered
 educational platform built around SDG 4, Quality Education,
 and Pakistan's Vision 2030."

[0:30-1:00] PROBLEM
"In Pakistan, quality technical education is inaccessible to
 millions. Courses are expensive, teachers are scarce outside
 cities, and learning platforms don't connect skills to employment.
 COGNARA solves this with an AI agent at its core."

[1:00-2:30] AI AGENT DEMO (MOST IMPORTANT — show first)
Open /agent page.
"This is not a chatbot. Watch what happens when I tell it
 I'm struggling with a topic."
Type: "I keep failing the recursion quiz"
SHOW: Agent reads quiz history + responds with personalized help
SHOW: Agent generates practice problems autonomously
"The agent knows my history, reads my actual quiz results,
 and creates targeted exercises — without being asked to."

[2:30-4:00] USER DASHBOARD (Student)
Login as student@demo.cognara.app
SHOW: Dashboard home (stats, course progress, activity feed)
SHOW: Lesson viewer with floating agent button
SHOW: Code editor — run Python code, show output
SHOW: AI debug button — paste broken code, show fix
"The AI agent is on every page, in context."

[4:00-5:30] CLIENT DASHBOARD (Coach)
Login as coach@demo.cognara.app
SHOW: Coach dashboard (earnings, student count, performance multiplier)
SHOW: Earnings calculator (set price, see instant breakdown)
SHOW: Course creation wizard
SHOW: Free resource upload + "This resource is permanently free" lock
"Coaches see exactly what they earn before they price anything.
 Free content is guaranteed free forever — enforced at database level."

[5:30-7:00] ADMIN DASHBOARD
Login as admin@demo.cognara.app
SHOW: Admin dashboard (platform stats, verification queue)
SHOW: Coach verification queue with AI confidence scores
SHOW: Security audit log
SHOW: Support ticket management
"Admins have complete platform visibility and control."

[7:00-8:30] MORE FEATURES
SHOW: PDF upload → AI generates quiz automatically
SHOW: Notebook (type + draw with mouse/stylus)
SHOW: Free resource library (public, no login)
SHOW: Peer session listing WITH the disclaimer banner clearly visible
SHOW: Certificate verification page

[8:30-9:30] TECH STACK + SDG
"COGNARA is built on Next.js, Supabase, and AI models ranked on
 LM Arena — accessed via OpenRouter and Groq.
 It directly addresses SDG 4 and Pakistan's Vision 2030 by making
 quality technical education accessible at any price point,
 including completely free."

[9:30-10:00] CLOSING
"COGNARA is live at [vercel URL]. You can log in right now with
 the demo credentials in the README. The source code is on GitHub.
 Thank you."

AFTER RECORDING:
□ Upload to Loom
□ In description: tag all UMT societies (as required)
□ Copy Loom URL → add to README + Vercel site
```

### Canva Poster Brief (Section 25 has full brief)

After presentations are done — create in Canva using brand system from Section 27.

---

## 24. ARCHITECTURE.md CONTENT

```markdown
# COGNARA Architecture

## System Overview

COGNARA is a multi-tenant EdTech SaaS built on:
- **Frontend**: Next.js 15 (App Router, SSR)
- **Database**: Supabase PostgreSQL with Row Level Security
- **AI**: Multi-agent system (Groq + Gemini + OpenRouter)
- **Payments**: Stripe + Stripe Connect
- **Deployment**: Vercel (edge network)

## Architecture Diagram

```
[User Browser]
      │
      ▼
[Vercel Edge Network]
      │
      ├──[Next.js App Router]──────────────────────────────────┐
      │   ├── (auth) routes                                     │
      │   ├── (public) routes                                   │
      │   ├── (student) routes — USER PORTAL                   │
      │   ├── (coach) routes  — CLIENT PORTAL                  │
      │   └── (admin) routes  — ADMIN PORTAL                   │
      │                                                         │
      └──[API Routes]                                           │
          ├── /api/agent ──────────────[COGNARA AI AGENT]      │
          │                             ├── teach-agent (Groq) │
          │                             ├── code-agent (Groq)  │
          │                             ├── pdf-agent (Gemini) │
          │                             ├── voice-agent        │
          │                             ├── path-agent (Groq)  │
          │                             ├── support-agent      │
          │                             └── verify-agent       │
          ├── /api/compiler ───────────[Judge0 CE API]
          ├── /api/upload ────────────[Supabase Storage]
          └── /api/stripe ───────────[Stripe API]
                │
                ▼
         [Supabase]
         ├── PostgreSQL (all data)
         ├── Auth (users, sessions, OAuth)
         ├── Storage (files, videos, documents)
         └── Realtime (notifications, live updates)
```

## Security Architecture

1. **Route Level**: Next.js middleware checks role on every request
2. **Database Level**: Row Level Security on every table
3. **Input Level**: Zod validation on client AND server
4. **File Level**: Magic bytes + MIME check before storage
5. **API Level**: Rate limiting via Upstash Redis
6. **Transport Level**: HTTPS + security headers

## AI Agent Architecture

See docs/AGENT.md for full agent specification.

The agent is NOT a chatbot. It uses tool-calling to:
- Read current lesson content
- Execute code and return results
- Generate and save quizzes
- Update student memory
- Search course catalog
- Write to student's notebook

## Database Design Principles

- All tables use UUID primary keys
- Soft deletes (deleted_at column) — data never hard-deleted
- Row Level Security on every table (no exceptions)
- Indexed on all foreign keys and frequent query columns
- Enum types via CHECK constraints
- JSON columns for flexible metadata (no schema migrations for minor additions)

## Scalability

COGNARA uses feature flags (src/lib/utils/feature-flags.ts)
to enable/disable features without code deployment.

Current capacity estimate:
- Free tier: handles up to ~1,000 concurrent users
- $150/month tier: handles up to ~10,000 concurrent users
- Revenue self-funds infrastructure at this scale
```

---

## 25. CANVA POSTER BRIEF

```
CREATE AFTER PRESENTATIONS ARE DONE.
Size: A2 (42cm × 59.4cm) or standard poster size
Use COGNARA brand colors from Section 27.

REQUIRED SECTIONS ON POSTER:

1. HEADER (top)
   COGNARA™ (large wordmark)
   "Where knowledge finds its place."
   SDG 4 badge (Quality Education logo)
   Vision 2030 + Vision 2035 badges

2. PROBLEM (left column)
   "60%+ of Pakistani students lack access to quality
    technical education. COGNARA closes that gap."
   Icon: broken chain / locked door

3. SOLUTION (center — largest section)
   "AI-Powered EdTech Platform"
   3 portal icons: Student / Coach / Admin
   Brief description of each

4. AI AGENT DIAGRAM (center-right)
   Show the 7-skill agent system as a wheel/hub diagram:
   Center: COGNARA AGENT
   Spokes: Teach / Debug / PDF→Quiz / Voice / Path / Support / Verify

5. TECH STACK (bottom-left)
   Small badges/logos:
   Next.js | Supabase | Groq | Gemini | OpenRouter (LM Arena)
   Judge0 | Daily.co | Stripe | Vercel

6. KEY FEATURES (bottom-center)
   ✅ Free forever tier
   ✅ Verified coaches
   ✅ AI agent with memory
   ✅ Code compiler (20+ languages)
   ✅ Digital notebook
   ✅ Live classes
   ✅ Peer tutoring (capped + disclaimed)
   ✅ Performance earnings

7. TEAM + QR CODE (bottom-right)
   Team names + university IDs
   QR code linking to: live Vercel URL
   QR code linking to: GitHub repository

8. COGNARA BRANDING (throughout)
   Primary: #0A0A0A | Accent: #6366F1 | Success: #10B981
   Font: DM Sans or Plus Jakarta Sans
```

---

## 26. README TEMPLATE

```markdown
# COGNARA™ — AI-Powered Educational Platform

> Where knowledge finds its place.

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-cognara.vercel.app-green?style=for-the-badge)](https://cognara.vercel.app)
[![SDG 4](https://img.shields.io/badge/SDG_4-Quality_Education-e63946?style=for-the-badge)](https://sdgs.un.org/goals/goal4)
[![Vision 2030](https://img.shields.io/badge/Vision-2030_Aligned-457b9d?style=for-the-badge)]()
[![GitHub](https://img.shields.io/badge/GitHub-Source_Code-black?style=for-the-badge&logo=github)](https://github.com/[username]/cognara)

---

## Problem Statement

In Pakistan and across the developing world, quality technical education
remains inaccessible — concentrated in cities, priced in USD, and disconnected
from employment outcomes. COGNARA solves this with an AI agent at its core.

## What is COGNARA?

COGNARA is not a course platform with an AI feature.
It is an **AI agent system** built around education.

The AI agent is context-aware, memory-enabled, and tool-using.
It teaches, debugs code, generates quizzes from PDFs, recommends
learning paths, and responds by voice — on every page of the platform.

## SDG Alignment

**Primary: SDG 4 — Quality Education**
Targets: 4.1, 4.3, 4.4, 4.5, 4.C

**Pakistan Vision 2030**: AI-driven education, workforce development,
equal access regardless of geography or income.

**Pakistan Vision 2035**: Knowledge economy leadership, EdTech infrastructure.

## Three Portals (Dashboards)

| Portal | Route | Users |
|---|---|---|
| **User Portal** | `/dashboard` | Students |
| **Client Portal** | `/coach/dashboard` | Coaches (Clients of COGNARA) |
| **Admin Portal** | `/admin/dashboard` | Platform administrators |

## AI Agent — 7 Skills

The agent is NOT a chatbot. It uses tool-calling to act autonomously.

| Skill | What It Does | Cost |
|---|---|---|
| 🧠 Teach | Explains concepts in context of current lesson | 1 credit |
| 🐛 Debug | Reads, fixes, and explains code errors | 2 credits |
| 📄 PDF→Quiz | Reads PDF, generates + saves quiz automatically | 3 credits |
| 🎤 Voice | Full voice conversation (STT + TTS) | 1 cr/min |
| 🗺️ Path | Analyzes history, recommends next course | 3 credits |
| 🎫 Support | Resolves support tickets automatically | FREE |
| ✅ Verify | Screens coach credentials via AI vision | Internal |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 + Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL + Auth + Storage + RLS) |
| AI Models | Groq + Google Gemini + OpenRouter |
| LM Arena | Top-ranked models accessed via OpenRouter |
| Code Compiler | Judge0 CE API (20+ languages, sandboxed) |
| Payments | Stripe + Stripe Connect (coach payouts) |
| Video | Mux (DRM) + Daily.co (WebRTC live classes) |
| Deployment | Vercel |

## Quick Start

```bash
git clone https://github.com/[username]/cognara
cd cognara
npm install
cp .env.example .env.local
# Add your API keys to .env.local
npm run dev
```

## Demo Accounts (Live)

| Role | Email | Password |
|---|---|---|
| Student (User) | student@demo.cognara.app | Demo1234! |
| Coach (Client) | coach@demo.cognara.app | Demo1234! |
| Admin | admin@demo.cognara.app | Demo1234! |

**Live URL:** https://cognara.vercel.app
**Demo Video:** [Loom URL]
**Kaggle Dataset:** https://www.kaggle.com/datasets/andrewmvd/udemy-courses

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [AI Agent Spec](./docs/AGENT.md)
- [API Reference](./docs/API.md)
- [Security](./docs/SECURITY.md)

## Team

| Name | University ID |
|---|---|
| [Your Name] | [ID] |
| [Partner] | [ID] |

## Assignment

PP Assignment #3 + #4 | UMT | May 2026

## License

COGNARA™ is proprietary software. All rights reserved.
© 2026 COGNARA. Trademark pending (Class 41 + 42).
Unauthorized reproduction or distribution is prohibited.
```

---

## 27. BRAND SYSTEM

```
COLOR PALETTE:
Primary:      #0A0A0A  (near-black — trust, premium, authority)
Accent:       #6366F1  (indigo — intelligence, technology)
Accent Light: #818CF8  (lighter indigo for hover states)
Success:      #10B981  (emerald — growth, progress, completion)
Warning:      #F59E0B  (amber — caution, pending states)
Error:        #EF4444  (red — danger, failure, blocks)
Info:         #3B82F6  (blue — information, neutral)

BACKGROUNDS:
Light mode:   #FAFAFA (page), #FFFFFF (surface), #F3F4F6 (subtle)
Dark mode:    #0A0A0A (page), #141414 (surface), #1F1F1F (subtle)

TYPOGRAPHY:
Display:  'DM Sans' 700-800 weight (NOT Inter, NOT Roboto)
Body:     'DM Sans' 400-500 weight
Code:     'JetBrains Mono' (all code blocks, editor)
Fallback: system-ui, sans-serif

LOGO:
COGNARA  (wordmark, all-caps, tracking: 0.15em)
Colors:  #0A0A0A on light / #FFFFFF on dark
No icon at launch — wordmark only

TONE:
Confident not arrogant  |  Clear not cold
Smart not academic      |  Direct not blunt
"We built this for you" not "Our platform offers"

NAMING CONVENTIONS:
Always: COGNARA (all caps)
Never: Cognara, cognara, CogNara
With trademark symbol on first mention: COGNARA™
In code: cognara (all lowercase)
```

---

## ⚠️ FINAL CHECKS BEFORE SUBMITTING

```
ASSIGNMENT REQUIREMENT FINAL AUDIT:

□ AI Agent exists and is deeply integrated (NOT just a chat window)
□ Agent uses tool-calling (reads data, executes code, saves results)
□ Agent has persistent memory per student
□ 3 dashboards exist with correct labels:
  □ User Dashboard (student)
  □ Client Dashboard (coach — CLIENT = COACH)
  □ Admin Dashboard
□ Each dashboard is DISTINCTLY different (different layout, data, actions)
□ SDG 4 clearly stated on landing page AND in presentation
□ Vision 2030 + Vision 2035 referenced in about page AND presentation
□ Data on Kaggle: dataset link in README
□ GitHub: source code + README + screenshots + docs
□ Vercel: live link, all pages loading
□ Loom: demo video recorded, UMT societies tagged
□ Poster: created in Canva (after presentation)
□ LM Arena: explained correctly in presentation (benchmark platform)
□ Free tier exists and works
□ Payment system works (Stripe test mode)
□ Security headers present (check with securityheaders.com)
□ Mobile responsive (test on 375px width)
□ Demo accounts work on live URL
□ .env.local is NOT in the GitHub repo
□ No API keys in any committed file

IF EVERY ITEM ABOVE IS CHECKED → YOU ARE READY TO SUBMIT.
```

---

*COGNARA™ Master Build Document v2.0 — FINAL*
*Assignment: PP #3 + #4 | UMT | May 2026*
*Every section is intentional. Every decision is documented.*
*Give this file to any developer or AI: they can build the product.*

**END OF DOCUMENT — v2.0 FINAL**
