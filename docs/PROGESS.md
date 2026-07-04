# Planify Progress

> This file tracks the current state of the project.
>
> Update this file whenever an important feature is added, changed, fixed, or removed.
>
> Before starting new work, developers and AI coding assistants should read this file first.

**Last Updated:** July 4, 2026

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

* Static React 18 loaded from CDN
* React DOM loaded from CDN
* Babel Standalone for in-browser JSX
* JSX
* CSS
* React hooks
* Fetch API
* LocalStorage for selected frontend state

There is currently no frontend `package.json` or build step.

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
React Frontend
      |
      | REST API
      v
Express Backend
      |
      v
Sequelize ORM
      |
      v
MySQL Database
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

### Notes

Passwords are hashed with bcrypt.

Passwords are not encrypted and cannot be decrypted.

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
 ├── Tasks
 ├── Schedules
 ├── Study Groups
 ├── Group Memberships
 └── Notifications
```

```text
Study Group
 ├── Members
 └── Group Tasks
```

```text
Task
 └── Notifications
```

---

# Security Already Implemented

* [x] Password hashing
* [x] Password validation
* [x] JWT authentication
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
* [ ] Decide whether to keep the static CDN frontend or add a package/build setup
* [ ] Improve error handling

## Medium Priority

* [ ] Add automated backend tests
* [ ] Add centralized Express error middleware
* [ ] Add proper request validation
* [ ] Add database migrations
* [ ] Improve authentication consistency

## Low Priority / Future

* [ ] WebSocket real-time updates
* [ ] Real-time group activity
* [ ] Instant notifications
* [ ] Email reminders
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

1. Verify current code
2. Fix integration bugs
3. Complete schedule integration
4. Remove duplicate frontend-only logic
5. Test authentication
6. Test tasks
7. Test groups
8. Test notifications
9. Add automated tests

---

# Recent Important Development

Recent important progress includes:

* Authentication implementation
* Personal task controller and routes
* Notification system
* Schedule backend system
* Frontend fixes
* Group task logic fixes
* Group invitation logic
* Separation of personal tasks and group tasks

---

# Before Starting New Work

Before modifying code:

* [ ] Read this file
* [ ] Read `docs/WORKFLOW.md`
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
* [ ] Mark completed items with `[x]`
* [ ] Add new unfinished work with `[ ]`
* [ ] Write a clear commit message
* [ ] Push the changes

---

# AI Handoff Notes

Any AI coding assistant working on Planify should:

1. Read this entire file first.
2. Read `docs/WORKFLOW.md`.
3. Inspect the related code before changing anything.
4. Do not assume this file is perfectly current.
5. Compare this file with the actual code.
6. Update this file after important work.
7. Do not rewrite unrelated files.
8. Do not replace working logic without explaining why.
9. Preserve the current architecture unless a change is necessary.
10. Report conflicts between documentation and code.

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
