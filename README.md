# Planify

Planify is a full-stack student productivity and study management app for organizing tasks, deadlines, study groups, schedules, and reminders in one place.

The project currently combines a static React frontend with an Express and MySQL backend. Core productivity flows are in place, while some frontend-backend integration work is still being verified.

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

Planify is under active development.

Implemented and wired through the frontend API adapter:

* Authentication
* Personal task CRUD
* Group loading and creation
* Adding group members
* Group task CRUD
* Notification loading, read state, and deletion

Implemented on the backend and still needing frontend verification:

* Schedule CRUD through `/api/schedules`
* Full group invitation flows
* Progress data persistence
* Profile persistence
* Settings persistence
* AI schedule backend integration

Not currently implemented:

* Automated tests
* Production deployment configuration
* WebSocket real-time updates
* Frontend npm package/build setup

## Tech Stack

### Frontend

* React 18 loaded from CDN
* React DOM loaded from CDN
* Babel Standalone for in-browser JSX compilation
* JSX
* CSS
* Fetch API
* LocalStorage for selected frontend state and auth token storage

The frontend is a static app in `frontend/`. There is no frontend `package.json` yet.

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
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── styles/
│       ├── api.jsx
│       ├── app.jsx
│       ├── data.jsx
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

NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:5500
```

Start the backend:

```bash
npm run dev
```

The API will run at:

```text
http://localhost:5001
```

### Frontend

Serve the `frontend/` folder with a static server or an editor extension such as Live Server.

Example:

```bash
cd frontend
python3 -m http.server 5500
```

Then open:

```text
http://localhost:5500
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

* Verify all frontend-backend integration paths
* Wire the schedule page through `frontend/src/api.jsx`
* Verify group invite acceptance and rejection from the UI
* Decide how profile, settings, progress, and AI schedule data should persist
* Add automated backend tests
* Add a proper frontend build setup when the project needs one

## Contributors

Developed by the Planify project team.

## License

MIT License

Copyright (c) 2026 Sokthearith

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.