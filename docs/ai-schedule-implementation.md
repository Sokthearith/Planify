# Progress

## AI Features Implementation (July 11, 2026)

### New SDK Migration
- Replaced legacy `@google/generative-ai` with modern `@google/genai` SDK
- New service: `backend/src/services/genai.js` — centralized AI client using `GoogleGenAI` with `gemini-2.5-flash`
- Three functions: `handleChatbot`, `handleSmartScheduler`, `autoScheduleTasks`

### Backend Endpoints
- `POST /api/chat` — conversational chatbot with history support (`chatbotController.js`)
- `POST /api/schedules/generate` — natural language → structured schedule entries (`handleSmartScheduler`)
- `POST /api/schedules/auto-generate` — one-click: reads user's personal + group tasks, generates optimized schedule

### Deterministic Scheduler (`backend/src/services/scheduler.js`)
- Replaced LLM-based scheduling with pure deterministic algorithm (zero cost, consistent output)
- 7-day week support (Mon–Sun) with different hours for weekdays (08:00–20:00) and weekends (10:00–16:00)
- Real date assignment — entries carry YYYY-MM-DD dates synced to real calendar
- Multi-week overflow — tasks spill to next days/weeks automatically
- Lunch breaks (12:00–13:00) and 15min breaks between tasks
- Priority-first sorting (high → medium → low), then earliest deadline
- `dueDate` field on entries shows task deadlines

### Controller Updates (`scheduleController.js`)
- `autoGenerateSchedule` now uses deterministic scheduler instead of LLM
- Queries both personal tasks (`Task`) and group tasks (`GroupTask` where user is creator or assignee)
- Properly deactivates old active schedule before setting new one (`setActiveSchedule`)
- Removed unused `GroupMember` import, fixed `Sequelize` import

### Frontend — AI Schedule Page (`pages-ai-schedule.jsx`)
- Full rewrite — no more mock data
- Loads active schedule from backend on mount
- Real 7-day week pills with actual calendar dates
- Week navigation (`← Prev` / `Next →`) to scroll through weeks
- Today indicator on the correct day pill
- "Generate from my tasks" button calls `POST /api/schedules/auto-generate`
- Each task block shows time range + due date
- Done toggle (local state)
- Day balance panel (priority breakdown)

### Frontend — API (`api.jsx`)
- Added `autoGenerateSchedule()` method

### CSS
- Added `.week-nav` styles (prev/next nav + week label)
- Removed `.day-pill.today` border on request

### Routes
- Created `chatbotRoute.js` with `POST /` (authenticated)
- Added `auto-generate` route to `scheduleRoute.js`

## Key Design Decisions
- Deterministic over LLM scheduling for consistency, cost, and speed
- Hybrid approach: LLM used for parsing/conversation, algorithm for scheduling
- Schedule data stored as JSON in `planData.entries` with `{ taskName, priority, day, date, startTime, endTime, dueDate }` shape
