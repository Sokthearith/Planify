# Planify Workflow

> How the current Planify system works.
>
> Update this file when an important feature flow changes.

## Overall Flow

```text
Static React frontend
   ↓
api.jsx
   ↓
Express Route
   ↓
Controller
   ↓
Sequelize Model
   ↓
MySQL
```

---

## Authentication

```text
Register / Login
      ↓
Backend checks user
      ↓
Password checked with bcrypt
      ↓
JWT created
      ↓
Frontend stores authentication
      ↓
Token sent with protected requests
```

Main files:

* `frontend/src/api.jsx`
* `backend/src/controllers/authController.js`
* `backend/src/routes/authRoute.js`
* `backend/src/middleware/authMiddleware.js`

---

## Personal Tasks

```text
User action
    ↓
PlanifyAPI
    ↓
/api/tasks
    ↓
taskController
    ↓
Task model
    ↓
MySQL
```

Important:

```text
Personal tasks → Task model
```

Implemented:

* Create
* Load
* Update
* Delete
* Filter by priority
* Filter by status

---

## Study Groups

```text
Create group
    ↓
StudyGroup created
    ↓
Creator membership created
    ↓
Users invited
    ↓
Pending membership
    ↓
Accept / Reject
```

Main models:

* `StudyGroup`
* `GroupMember`

Important:

```text
pending  → invited but not joined
accepted → active group member
```

---

## Group Tasks

```text
Group member
    ↓
Group task request
    ↓
Check membership
    ↓
GroupTask model
    ↓
MySQL
```

Important:

```text
Personal task → Task

Group task → GroupTask
```

Do not mix them.

---

## Notifications

```text
Important event
    ↓
createNotification()
    ↓
Notification stored
    ↓
Frontend loads notifications
```

Current events:

* Task created
* Task completed
* Deadline changed
* Group invitation
* Deadline reminder

---

## Deadline Reminders

```text
Server starts
    ↓
Reminder job starts
    ↓
Checks upcoming deadlines
    ↓
Creates notifications
```

---

## Schedule

```text
Schedule page
    ↓
frontend/src/api.jsx schedule methods (not wired yet)
    ↓
scheduleRoute
    ↓
scheduleController
    ↓
Schedule model
    ↓
MySQL
```

Current status:

* Backend exists
* Frontend schedule page exists
* `frontend/src/api.jsx` does not currently expose schedule CRUD helpers
* Full frontend-backend integration still needs implementation and testing

---

## Frontend API

Main file:

```text
frontend/src/api.jsx
```

Use this for backend communication.

The adapter defaults to:

```text
http://localhost:5001/api
```

This can be overridden in browser LocalStorage with:

```js
localStorage.setItem('planify:apiBase', 'http://localhost:5001/api');
```

Preferred:

```text
Page
 ↓
api.jsx
 ↓
Backend
```

Avoid adding random `fetch()` calls in many different pages.

---

## Adding a New Feature

Follow the existing structure:

```text
UI
 ↓
api.jsx
 ↓
Route
 ↓
Controller
 ↓
Model
 ↓
Database
```

Before implementing:

1. Check `docs/PROGESS.md`
2. Check `docs/PLANS.md`
3. Read this file
4. Inspect the actual related code
5. Reuse existing logic where possible
