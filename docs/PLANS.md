# Planify Plans

> What the team plans to work on next.
>
> Keep this file focused on near-term work. Move completed context into `docs/PROGESS.md`.
>
> Before and after meaningful project work, update this file together with `docs/PROGESS.md` and `docs/WORKFLOW.md` when the plan, status, or workflow changes.

**Last Updated:** July 5, 2026

---

## Current Priority

* [x] Make README and docs match the current repository state.
* [x] Convert the frontend from React CDN + Babel Standalone to Vite React.
* [ ] Verify frontend-backend integration feature by feature.

---

## Next Tasks

1. [ ] Wire the schedule page through `frontend/src/api.jsx` and `/api/schedules`.
2. [ ] Test schedule create, read, update, delete, and active schedule behavior.
3. [ ] Verify group invitation flows from the frontend, including accept and reject.
4. [ ] Review remaining localStorage-only areas: profile, settings, progress, and AI schedule.
5. [ ] Improve frontend error states for failed API requests.
6. [ ] Decide production deployment details for the Vite frontend and Express backend.

---

## Planned Features

* [ ] Automated backend tests for auth, tasks, groups, schedules, and notifications.
* [ ] Centralized request validation for backend controllers.
* [x] Frontend package/build setup with Vite.
* [ ] Deployment configuration for a production environment.

---

## Bugs To Fix / Risks To Verify

* [ ] Schedule UI currently appears local-only and is not exposed through `PlanifyAPI`.
* [ ] Some profile, settings, progress, and AI schedule state may not persist to the backend.
* [ ] Group invitation notification actions need full UI verification.
* [ ] Backend uses `sequelize.sync({ alter: true })`; confirm the migration strategy before production.
* [ ] `frontend/dist/` is generated Vite build output and should stay ignored unless deployment needs it committed.

---

## Later

* [ ] Database migrations
* [ ] Database backup and restore tooling
* [ ] WebSocket real-time updates
* [ ] Email reminders
* [ ] Advanced AI scheduling
