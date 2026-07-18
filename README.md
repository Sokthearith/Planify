# Planify

Planify is a full-stack student productivity and study management app for organizing tasks, deadlines, study groups, schedules, and reminders in one place.

The project currently combines a Vite React frontend with an Express and MySQL backend. Core productivity flows are in place, while some frontend-backend integration work is still being verified.

## Features

* User registration, login, logout, and authenticated user loading
* Personal task CRUD with priority, status, deadlines, and ownership checks
* Study groups with creator permissions, member invitations, and invite responses
* Group task management stored separately from personal tasks
* Notifications for task and group events
* Backend deadline reminder job
* Schedule backend model, controller, and routes
* Responsive frontend pages for tasks, groups, schedules, notifications, profile, settings, progress, onboarding, and AI schedule UI

## Current Status

Planify is under active development. The main user journeys are connected to the backend and realtime server.

Implemented and wired through the frontend API adapter:

* Authentication
* Personal task CRUD
* Group loading and creation
* Adding group members
* Group task CRUD
* Notification loading, read state, and deletion
* AI-assisted schedule generation with validated structured output and local fallback
* Realtime task, group, schedule, notification, profile, and chat updates
* Account-backed profile, avatar, subjects, and preferences
* Persistent Pomodoro sessions and historical progress analytics

Verification support:

* Database-backed API integration tests (requires an isolated test database)
* Playwright browser tests for core frontend journeys

Not currently implemented:

* Production deployment configuration
* External browser push, calendar sync, email digests, and public profiles

## Tech Stack

### Frontend

* React 18
* React DOM
* Vite
* JSX
* CSS
* Fetch API
* LocalStorage for selected frontend state and auth token storage

The frontend is a Vite app in `frontend/`.

### Backend

* Node.js
* Express.js
* Sequelize ORM
* MySQL
* JWT authentication
* bcrypt
* dotenv
* Scheduled deadline reminder job

The backend runs on `http://localhost:5001`.

## Project Structure

```text
Planify/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.js
│   ├── package-lock.json
│   └── package.json
│
├── frontend/
│   ├── assets/
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── styles/
│       ├── api.jsx
│       ├── app.jsx
│       ├── data.jsx
│       ├── main.jsx
│       └── sounds.jsx
│
├── docs/
│   ├── PLANS.md
│   ├── PROGESS.md
│   └── WORKFLOW.md
│
└── README.md
```

## Database Models

The backend currently defines these main Sequelize models:

* User
* Task
* Schedule
* StudyGroup
* GroupMember
* GroupTask
* Notifications
* FocusSession
* UserAvailability

## Setup

Clone the repository:

```bash
git clone https://github.com/Sokthearith/Planify.git
cd Planify
```

### Backend

Install dependencies:

```bash
cd backend
npm install
```

Create `backend/.env` with your own values:

```env
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=your_database_host
DB_PORT=3306

JWT_SECRET=your_jwt_secret

# Required for Gemini-powered schedule generation and chat
GEMINI_API_KEY=your_google_ai_studio_key

NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:5173

# Optional, required for real forgot-password emails outside local development
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM="Planify <no-reply@example.com>"
SMTP_SECURE=false
```

In local development without `SMTP_HOST`, forgot-password verification codes are logged by the backend and returned to the frontend so the flow can be tested.

Create the Gemini key in [Google AI Studio](https://aistudio.google.com/app/apikey). Keep it in the backend environment only; never expose it through a `VITE_` variable or commit it to source control. When the key is missing or Gemini is temporarily unavailable, AI Schedule uses the local deterministic planner and labels the result as a fallback.

Start the backend:

```bash
npm run dev
```

Existing installations apply additive migrations during startup. They can also
be applied explicitly before starting the server:

```bash
npm run migrate
npm start
```

The API will run at:

```text
http://localhost:5001
```

### Frontend

Install dependencies:

```bash
cd frontend
npm install
```

Start the Vite dev server:

```bash
npm run dev
```

Then open:

```text
http://localhost:5173
```

The frontend API adapter defaults to:

```text
http://localhost:5001/api
```

To point the frontend at another backend URL, set this browser LocalStorage key:

```js
localStorage.setItem('planify:apiBase', 'http://localhost:5001/api');
```

## API Routes

Main backend route groups:

```text
/api/auth
/api/tasks
/api/groups
/api/schedules
/api/notifications
```

Authentication uses JWT bearer tokens:

```text
Authorization: Bearer <token>
```

Passwords are hashed with bcrypt before storage. They are not encrypted and cannot be decrypted.

## Documentation

Project docs live in `docs/`:

* `docs/PROGESS.md` tracks current implementation status and known gaps.
* `docs/WORKFLOW.md` explains the app flow and feature architecture.
* `docs/PLANS.md` lists the next planned work.

## Roadmap

Near-term priorities:

* Prepare production deployment configuration
* Expand automated coverage for external AI and multi-client realtime failures
* Add external notification and calendar integrations when providers are selected

## Tests

Run frontend build and browser journeys:

```bash
cd frontend
npm run build
npm run test:e2e
```

Run backend tests:

```bash
cd backend
npm test
```

The API integration cases are skipped unless `TEST_DB_NAME` is configured. Use an isolated database and optional `TEST_DB_USER`, `TEST_DB_PASSWORD`, `TEST_DB_HOST`, and `TEST_DB_PORT` values; never point these tests at production data.

## Contributors

Developed by the Planify project team.

## License

This project is licensed under the MIT License.

Copyright (c) 2026 Sokthearith.
