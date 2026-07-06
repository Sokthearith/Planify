# Planify Progress

> This file tracks the current state of the project.
>
> Update this file whenever an important feature is added, changed, fixed, or removed.
>
> Before starting new work, developers and AI coding assistants should read this file first.
>
> Before and after meaningful project work, update this file together with `docs/PLANS.md` and `docs/WORKFLOW.md` when the plan, status, or workflow changes.

**Last Updated:** July 6, 2026

---

## Project Overview

Planify is a full-stack student productivity and study management application.

The application helps students:

* Manage personal tasks
* Set priorities and deadlines
* Create study schedules
* Join study groups
* Manage group tasks
* Receive notifications
* Receive deadline reminders

---

# Current Project Status

| Area                         | Status             |
| ---------------------------- | ------------------ |
| Frontend UI                  | Mostly complete    |
| Responsive design            | Mostly complete    |
| Frontend build tooling       | Implemented        |
| Backend                      | In progress        |
| Database                     | Mostly implemented |
| Authentication               | Implemented        |
| Personal tasks               | Implemented        |
| Study groups                 | Implemented        |
| Group tasks                  | Implemented        |
| Notifications                | Implemented        |
| Deadline reminders           | Implemented        |
| Schedule system              | In progress        |
| Frontend-backend integration | In progress        |
| Automated testing            | Not started        |
| Production deployment        | Not started        |

---

# Technology Stack

## Frontend

* Vite
* React 18
* React DOM
* ES modules
* JSX
* CSS
* React hooks
* Fetch API
* LocalStorage for selected frontend state

The frontend has a standard npm/Vite setup:

```text
frontend/package.json
frontend/package-lock.json
frontend/vite.config.js
frontend/src/main.jsx
```

Main frontend commands:

```bash
npm install
npm run dev
npm run build
npm run preview
```

Generated frontend output:

* `frontend/node_modules/` from dependency installation
* `frontend/dist/` from `npm run build`
* `frontend/vite-dev.log` and `frontend/vite-dev.err.log` from local background dev-server runs

These generated outputs are ignored by git and should not be edited directly.

## Backend

* Node.js
* Express.js
* JWT
* bcrypt
* dotenv

## Database

* MySQL
* Sequelize ORM

---

# Main Architecture

```text
Vite React frontend
      |
      | REST API
      v
Express backend
      |
      v
Sequelize ORM
      |
      v
MySQL database
```

Backend structure:

```text
Route
  |
  v
Controller
  |
  v
Model
  |
  v
Database
```

---

# Completed Features

## Authentication

* [x] User registration
* [x] User login
* [x] User logout
* [x] JWT generation
* [x] Protected routes
* [x] Password hashing with bcrypt
* [x] Password strength validation
* [x] Get current authenticated user
* [x] Forgot-password verification code flow
* [x] Password reset after code verification

### Notes

Passwords are hashed with bcrypt.

Passwords are not encrypted and cannot be decrypted.

Forgot-password reset codes are hashed before storage, expire after 10 minutes, and are cleared after a successful password reset.

Password reset email delivery uses SMTP when configured through `SMTP_*` environment variables. In local development without `SMTP_HOST`, the reset code is logged by the backend and returned to the frontend for testing.

The frontend currently sends authentication tokens using:

```text
Authorization: Bearer <token>
```

---

## Personal Tasks

* [x] Create personal task
* [x] View personal tasks
* [x] View task by ID
* [x] Update task
* [x] Delete task
* [x] Filter tasks by status
* [x] Filter tasks by priority
* [x] Connect tasks to authenticated users
* [x] Prevent users from editing another user's tasks

Supported priorities:

```text
high
medium
low
```

Supported statuses:

```text
pending
in_progress
done
```

---

## Study Groups

* [x] Create study group
* [x] View user's groups
* [x] View group details
* [x] Update group
* [x] Delete group
* [x] Add group members
* [x] Invite members
* [x] Accept invitations
* [x] Reject invitations
* [x] Remove members
* [x] Check group membership permissions

### Current Group Logic

Only accepted members should access group content.

Group creators can manage the group.

Group invitations use pending membership records.

---

## Group Tasks

* [x] Create group tasks
* [x] View group tasks
* [x] Update group tasks
* [x] Delete group tasks
* [x] Store group tasks separately from personal tasks
* [x] Check group membership before accessing tasks

### Important

Personal tasks and group tasks use separate models.

Do not mix:

```text
Task
```

with:

```text
GroupTask
```

---

## Notifications

* [x] Notification model
* [x] Create notifications
* [x] View notifications
* [x] Mark one notification as read
* [x] Mark all notifications as read
* [x] Delete notifications
* [x] Task creation notifications
* [x] Task completion notifications
* [x] Deadline update notifications
* [x] Group invitation notifications

---

## Deadline Reminder System

* [x] Background deadline reminder job
* [x] Start reminder job when backend starts
* [x] Stop reminder job during graceful server shutdown
* [x] Create reminder notifications

The project currently uses scheduled backend logic.

WebSockets are not currently used.

---

## Schedule System

* [x] Schedule model
* [x] Schedule routes
* [x] Schedule controller
* [x] Backend API structure
* [x] Frontend schedule interface
* [ ] Add schedule methods to `frontend/src/api.jsx`
* [ ] Wire frontend schedule actions to the backend
* [ ] Test schedule CRUD completely
* [ ] Remove any remaining duplicate local-only schedule logic

---

## Frontend

* [x] Main application interface
* [x] Authentication pages
* [x] Onboarding
* [x] Personal task pages
* [x] Group pages
* [x] Schedule pages
* [x] Notification interface
* [x] Settings interface
* [x] Profile interface
* [x] Progress interface
* [x] AI schedule interface
* [x] Responsive layout
* [x] Mobile navigation
* [x] Interactive modals
* [x] Toast feedback
* [x] Task sorting
* [x] Notification filtering
* [x] Vite React project setup
* [x] Frontend npm scripts
* [x] JSX files converted to ES modules
* [x] CSS imported through `frontend/src/main.jsx`
* [x] React CDN, React DOM CDN, and Babel Standalone removed from `frontend/index.html`

---

## Frontend API Integration

The main frontend API adapter is:

```text
frontend/src/api.jsx
```

Currently integrated:

* [x] Login
* [x] Registration
* [x] Current user
* [x] Logout
* [x] Personal task CRUD
* [x] Load groups
* [x] Create groups
* [x] Add group members
* [x] Group task CRUD
* [x] Load notifications
* [x] Mark notifications as read
* [x] Delete notifications

Still needs verification:

* [ ] Schedule integration through `frontend/src/api.jsx`
* [ ] All group invitation flows
* [ ] All progress data
* [ ] Profile persistence
* [ ] Settings persistence
* [ ] AI schedule backend integration

---

# Database Models

Current main models:

* [x] User
* [x] Task
* [x] Schedule
* [x] StudyGroup
* [x] GroupMember
* [x] GroupTask
* [x] Notifications

---

# Database Relationships

Implemented relationships include:

```text
User
  - Tasks
  - Schedules
  - Study Groups
  - Group Memberships
  - Notifications
```

```text
Study Group
  - Members
  - Group Tasks
```

```text
Task
  - Notifications
```

---

# Security Already Implemented

* [x] Password hashing
* [x] Password validation
* [x] JWT authentication
* [x] Hashed password reset verification codes
* [x] Expiring password reset verification codes
* [x] Protected routes
* [x] User ownership checks
* [x] Group membership checks
* [x] Environment variables
* [x] Database SSL configuration
* [x] Input validation for task status and priority

---

# Current Problems and Limitations

## High Priority

* [ ] Test all frontend-backend integrations
* [ ] Verify schedule system completely
* [ ] Check remaining localStorage-only features
* [ ] Improve error handling

## Medium Priority

* [ ] Add automated backend tests
* [ ] Add centralized Express error middleware
* [ ] Add proper request validation
* [ ] Add database migrations
* [ ] Add automated authentication tests

## Low Priority / Future

* [ ] WebSocket real-time updates
* [ ] Real-time group activity
* [ ] Instant notifications
* [ ] Email reminders
* [ ] Configure production SMTP provider and sender identity
* [ ] Database backup and restore tools
* [ ] Advanced AI scheduling
* [ ] Production analytics

---

# Features Not Currently Implemented

* [ ] Automated tests
* [ ] Application-level database backup
* [ ] Custom data encryption
* [ ] Custom data decryption
* [ ] WebSocket communication
* [ ] Full production deployment configuration

Do not claim these features are implemented unless the code is added later.

---

# Current Development Focus

The current development stage is:

```text
Frontend and backend integration
```

Main priorities:

1. Keep docs current before and after meaningful work
2. Verify current code
3. Fix integration bugs
4. Complete schedule integration
5. Remove duplicate frontend-only logic
6. Test authentication
7. Test tasks
8. Test groups
9. Test notifications
10. Add automated tests

---

# Recent Important Development

Recent important progress includes:

* Frontend migration from React CDN + Babel Standalone to Vite React
* Addition of `frontend/package.json`, `frontend/package-lock.json`, `frontend/vite.config.js`, and `frontend/src/main.jsx`
* Conversion of frontend JSX files to ES module import/export syntax
* Verified frontend install, production build, and Vite dev server response
* Authentication implementation
* Personal task controller and routes
* Notification system
* Schedule backend system
* Frontend fixes
* Group task logic fixes
* Group invitation logic
* Separation of personal tasks and group tasks
* Sign-in fix by removing login-time MX lookup
* Forgot-password code verification and password reset flow

---

# Before Starting New Work

Before modifying code:

* [ ] Read this file
* [ ] Read `docs/PLANS.md`
* [ ] Read `docs/WORKFLOW.md`
* [ ] Update these docs first if they are stale or if the planned work changes project direction
* [ ] Pull the latest changes
* [ ] Check the current branch
* [ ] Check `git status`
* [ ] Inspect related files
* [ ] Understand current logic before changing it

---

# After Finishing Work

After completing a feature or fix:

* [ ] Test the feature
* [ ] Check `git diff`
* [ ] Update this file
* [ ] Update `docs/PLANS.md`
* [ ] Update `docs/WORKFLOW.md` if any workflow changed
* [ ] Mark completed items with `[x]`
* [ ] Add new unfinished work with `[ ]`
* [ ] Write a clear commit message
* [ ] Push the changes

---

# AI Handoff Notes

Any AI coding assistant working on Planify should:

1. Read this entire file first.
2. Read `docs/PLANS.md`.
3. Read `docs/WORKFLOW.md`.
4. Inspect the related code before changing anything.
5. Do not assume this file is perfectly current.
6. Compare this file with the actual code.
7. Update docs before work when the docs are stale or the plan changes.
8. Update docs after important work.
9. Do not rewrite unrelated files.
10. Do not replace working logic without explaining why.
11. Preserve the current architecture unless a change is necessary.
12. Report conflicts between documentation and code.

---

# Progress Update Template

Copy this section when completing major work:

```markdown
## Update: YYYY-MM-DD

### Completed

- [x] Feature or fix

### Changed

- Description of changed behavior

### Files Changed

- `path/to/file.js`

### Still Remaining

- [ ] Next task

### Known Problems

- Problem description

### Tested

- [x] Manual test
- [ ] Automated test
```

---

## Update: 2026-07-06

### Completed

- [x] Fixed sign-in for existing/local accounts by removing the login-time DNS MX lookup.
- [x] Added forgot-password code request, code verification, and password reset backend routes.
- [x] Added reset code storage fields to the user model.
- [x] Added frontend forgot-password UI flow.
- [x] Added SMTP-based reset email support with local development fallback code display.

### Changed

- Login now validates email format and password presence, then checks the stored user/password directly.
- Registration still validates email domain MX records.
- Reset codes are hashed with bcrypt, expire after 10 minutes, and are cleared after password reset.
- `nodemailer` was added to the backend for SMTP delivery.

### Files Changed

- `backend/src/controllers/authController.js`
- `backend/src/routes/authRoute.js`
- `backend/src/models/User.js`
- `backend/package.json`
- `backend/package-lock.json`
- `frontend/src/api.jsx`
- `frontend/src/app.jsx`
- `frontend/src/pages/pages-auth.jsx`
- `frontend/src/styles/styles-auth.css`
- `README.md`
- `docs/PROGESS.md`

### Still Remaining

- [ ] Configure real production SMTP values before deploying password reset email.
- [ ] Add automated authentication tests.

### Known Problems

- Local development without `SMTP_HOST` returns and displays the reset code for testing only.
- Existing unrelated package-lock and `.gitignore` changes may still need review before commit.

### Tested

- [x] `node --check backend/src/controllers/authController.js`
- [x] `node --check backend/src/routes/authRoute.js`
- [x] `npm run build` in `frontend`
- [ ] Full manual browser reset flow against a running database.

---

## Update: 2026-07-05

### Completed

- [x] Read `docs/PLANS.md`, `docs/PROGESS.md`, and `docs/WORKFLOW.md`.
- [x] Updated docs to match the current Vite React frontend state.
- [x] Added the standing instruction to update the docs before and after meaningful project work.

### Changed

- Replaced stale React CDN and Babel Standalone frontend descriptions with the current Vite React setup.
- Documented generated frontend outputs and npm commands.
- Kept schedule integration and remaining backend verification work marked as unfinished.

### Files Changed

- `docs/PLANS.md`
- `docs/PROGESS.md`
- `docs/WORKFLOW.md`

### Still Remaining

- [ ] Verify frontend-backend integration feature by feature.
- [ ] Complete schedule integration through `frontend/src/api.jsx`.

### Known Problems

- Schedule UI still appears local-only from the current documentation and needs implementation verification.

### Tested

- [x] Documentation reviewed and updated.
- [ ] No application runtime test was needed for this documentation-only update.
