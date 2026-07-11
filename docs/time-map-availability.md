# Time Map & Availability System (Post `f69a310`)

## Overview
Added a **User Availability** system (Time Map) that lets users define when they're available for scheduling. The deterministic scheduler respects these windows, blocking out hours the user marks as unavailable.

---

## UserAvailability Model

- **File**: `backend/src/models/UserAvailability.js`
- **Fields**: `userId`, `name`, `dayOfWeek` (0=Mon..6=Sun), `startTime`, `endTime`, `type` (`available`|`blocked`)
- **Index**: compound index on `[userId, dayOfWeek]`
- **Association**: `User.hasMany(UserAvailability)` in `models/index.js`
- Separate table approach (not JSON-on-User) — queryable, indexable, atomic updates per window

## Availability API

- **`GET /api/availability`** — returns all availability slots for current user
- **`PUT /api/availability`** — bulk replace (destroys all existing, bulk creates new) with validation
- **`DELETE /api/availability`** — deletes all slots for current user
- **File**: `backend/src/controllers/availabilityController.js`, `backend/src/routes/availabilityRoute.js`

## Frontend API

- **File**: `frontend/src/api.jsx`
- Added `getAvailability()`, `setAvailability(slots)`, `deleteAvailability()` methods

## Time Map Components

- **File**: `frontend/src/components/time-map.jsx`
- **`TimeMapPopup`**: floating overlay wrapper (used in AI Schedule page)
- **`TimeMapInline`**: reusable grid component (used in both Settings inline and popup)
- Week-grid visual editor: 7 days × 18 hours (06:00–23:00)
- White cells = available, red cells = blocked with reason label
- Click available cell → small floating modal asks "Why blocked?"
- Click blocked cell → unblock immediately
- "Block a time range" button for multi-hour blocks
- "Save Time Map" and "Clear all" buttons

## Scheduler: `buildAvailabilityMap`

- **File**: `backend/src/services/scheduler.js`
- `buildAvailabilityMap(availability)`:
  - Separates slots into `available` and `blocked` arrays per day of week
  - If a day has **no** available slots → fallback window 06:00–23:00 (for backward compat)
  - If available slots exist → `subtractWindows(available, blocked)` removes blocked regions
  - Returns day-indexed map of window arrays

## Scheduler: `subtractWindows`

- Standard interval subtraction algorithm
- For each blocked window, iterates over available windows and splits/trims them
- Handles full overlap, partial overlap, non-overlap correctly

## Scheduler: Multi-Session Splitting

- Tasks with `estimatedHours` get split into chunks:
  - High priority: up to 90min chunks
  - Medium/Low: up to 60min chunks
  - Multiple chunks get `(1/3)`, `(2/3)` suffixes
- `dueDate` on every entry

## Scheduler: Deadline Time Preservation

- `syncTaskDeadlinesForSchedule` extracts actual `HH:MM` from `task.deadline` for entry time field
- Deadline entries in schedule use real time, not random default hour

## Schedule Page Enhancements

- **File**: `frontend/src/pages/pages-ai-schedule.jsx`
- No mock data — loads active schedule from backend
- Week navigation (← → buttons with `weekStart` state)
- Day pills (Mon–Sun) toggle visibility per day
- Done toggle on each entry
- Due date display per entry
- `⌚ Time Map` button opens `TimeMapPopup` overlay

## Personal Task Editing

- **File**: `frontend/src/pages/pages-home-tasks.jsx`
- Edit button on TaskRow (matches group task UX)
- `onEditTask` prop → `editPersonalTask` handler in app.jsx
- Modal uses `datetime-local` input for deadline (via `toLocalDatetime` helper)
- `estimatedHours` field in task modals

## Auto-Refresh After CRUD

- `refreshSchedule()` helper fetched active schedule after every task operation
- Wired into create, edit, toggle, delete, group operations

## Settings Page: Time Map Removed

- **File**: `frontend/src/pages/pages-other.jsx`
- Removed `TimeMapSettings` section
- Time Map is now only accessible from AI Schedule page via popup

## CSS

- **File**: `frontend/src/styles/styles.css`
- `.tm-overlay` / `.tm-modal` — Time Map floating overlay (960px)
- `.week .cell.blocked` — `display: flex; align-items: center; justify-content: center` with `background: var(--accent-soft)`
- `.tm-block-label` — centered label in blocked cells
- `.tm-block-overlay` / `.tm-block-modal` — small floating "Why blocked?" popup
- Removed `.tm-modal .week*` overrides that caused grid inconsistency

## Schema Sync Change

- Switched from `sync({ alter: true })` to `sync()` to avoid MySQL "Too many keys specified; max 64 keys allowed" error
