# AI Schedule Implementation Report

**UI status:** Complete

**Last verified:** July 13, 2026

## AI Features Implementation (July 13, 2026)

### New SDK Migration
- Replaced legacy `@google/generative-ai` with modern `@google/genai` SDK
- New service: `backend/src/services/genai.js` — centralized AI client using `GoogleGenAI` with `gemini-2.5-flash`
- Three functions: `handleChatbot`, `handleSmartScheduler`, `autoScheduleTasks`

### Backend Endpoints
- `POST /api/chat` — conversational chatbot with history support (`chatbotController.js`)
- `POST /api/schedules/generate` — natural language → structured schedule entries (`handleSmartScheduler`)
- `POST /api/schedules/auto-generate` — one-click: reads user's personal + group tasks, generates optimized schedule

### Hybrid Scheduling Engine
- Gemini is the primary planner for `POST /api/schedules/auto-generate`
- Gemini receives task references rather than database content it can modify; the server maps results back to authoritative task data
- Structured output includes dated focus blocks, concise placement reasons, a schedule summary, and strategy notes
- The server rejects malformed dates/times, out-of-week blocks, overlaps, blocked availability, work outside the selected focus window, and sessions after a task deadline
- Gemini credentials stay on the Express backend through `GEMINI_API_KEY` or `GOOGLE_API_KEY`
- If the key is absent or the request fails, the deterministic scheduler keeps generation available and stores `provider: local-fallback`

### Deterministic Scheduler (`backend/src/services/scheduler.js`)
- 7-day week support (Mon–Sun) with different hours for weekdays (08:00–20:00) and weekends (10:00–16:00)
- Real date assignment — entries carry YYYY-MM-DD dates synced to real calendar
- Multi-week overflow — tasks spill to next days/weeks automatically
- Lunch breaks (12:00–13:00) and 15min breaks between tasks
- Priority-first sorting (high → medium → low), then earliest deadline
- `dueDate` field on entries shows task deadlines
- Honors the selected week, focus window, preferred session length, weekend setting, and saved availability when used as fallback

### Controller Updates (`scheduleController.js`)
- `autoGenerateSchedule` attempts validated Gemini generation before deterministic fallback
- Queries both personal tasks (`Task`) and group tasks (`GroupTask` where user is creator or assignee)
- Properly deactivates old active schedule before setting new one (`setActiveSchedule`)
- Removed unused `GroupMember` import, fixed `Sequelize` import
- Persists generation provider, model, summary, strategy notes, and preferences in `planData.generation`

### Frontend — AI Schedule Page (`pages-ai-schedule.jsx`)
- Work-focused scheduling workspace with responsive desktop and mobile layouts
- Loads active schedule from backend on mount
- Restores the active plan's saved week and planning preferences when the page is reopened
- Real 7-day week pills with actual calendar dates
- Week navigation with previous, today, and next controls
- Today indicator on the correct day pill
- Gemini composer supports free-form instructions, presets, a focus window, session length, and weekend inclusion
- Each task block shows time range, subject, due date, and Gemini's placement reason
- Completion state is stored per schedule in LocalStorage
- Completion remains usable in memory when LocalStorage is unavailable
- Summary metrics show block count, focus time, high-priority load, and the next deadline
- Plan intelligence and weekly load panels explain and visualize the generated result
- Provider status accurately distinguishes Gemini from local fallback
- Loading, empty, generating, completed, fallback, and populated states have dedicated UI treatments
- Tabs, completion controls, presets, loading feedback, and icon buttons include keyboard and screen-reader states

### Frontend — API (`api.jsx`)
- `autoGenerateSchedule(preferences)` posts the complete planning preferences
- `toUiSchedule` preserves generation metadata instead of dropping non-entry fields

### CSS
- Added a dedicated `ai-*` workspace style layer matching Planify's editorial visual system
- Added responsive breakpoints for stacked controls, a two-column metric strip, horizontal day tabs, and mobile task blocks
- Added provider, priority, completion, skeleton-loading, preset-selection, and keyboard-focus states

### Routes
- Created `chatbotRoute.js` with `POST /` (authenticated)
- Added `auto-generate` route to `scheduleRoute.js`

## Key Design Decisions
- Gemini provides personalized placement and concise rationale; the server remains authoritative for task identity and deadline data
- Structured output is validated before persistence
- Deterministic fallback provides resilience, predictable cost control, and a usable no-key development state
- Schedule data stored as JSON in `planData.entries` with `{ taskName, priority, day, date, startTime, endTime, dueDate }` shape

## UI Acceptance Checklist

- [x] Existing active schedules load without mock data
- [x] Saved generation settings and generated week are restored
- [x] Users can move between weeks and return to today
- [x] Users can select a day and inspect ordered focus blocks
- [x] Users can generate or regenerate with planning preferences
- [x] Users can open the availability time map and add a task
- [x] Completion state is isolated by schedule
- [x] Gemini and deterministic fallback results are labeled accurately
- [x] Empty, loading, generating, and fallback states are explained in the interface
- [x] Desktop, tablet, and phone layouts have explicit responsive rules
- [x] Interactive controls expose accessible names, pressed/selected states, and focus indicators

## Verification

Completed from the repository root on July 13, 2026:

```text
cd frontend && npm run build
✓ 72 modules transformed
✓ built successfully
```

The following implementation files also pass Node syntax checks:

- `backend/src/controllers/scheduleController.js`
- `backend/src/services/genai.js`
- `backend/src/services/scheduler.js`

The repository does not currently include an automated test suite. End-to-end generation still requires the backend, database, an authenticated user with pending tasks, and optionally `GEMINI_API_KEY`; without the key, the local fallback is the expected result.
