# Planify Plans

> What the team plans to work on next.
>
> Keep this file focused on near-term work. Move completed context into `docs/PROGESS.md`.

## Current Priority

* [x] Make README and docs match the current repository state.
* [ ] Verify frontend-backend integration feature by feature.

---

## Next Tasks

1. [ ] Wire the schedule page through `frontend/src/api.jsx` and `/api/schedules`.
2. [ ] Test schedule create, read, update, delete, and active schedule behavior.
3. [ ] Verify group invitation flows from the frontend, including accept and reject.
4. [ ] Review remaining localStorage-only areas: profile, settings, progress, and AI schedule.
5. [ ] Improve frontend error states for failed API requests.

---

## Planned Features

* [ ] Automated backend tests for auth, tasks, groups, schedules, and notifications.
* [ ] Centralized request validation for backend controllers.
* [ ] Frontend package/build setup when the static CDN setup becomes limiting.
* [ ] Deployment configuration for a production environment.

---

## Bugs To Fix / Risks To Verify

* [ ] Schedule UI currently appears local-only and is not exposed through `PlanifyAPI`.
* [ ] Some profile, settings, progress, and AI schedule state may not persist to the backend.
* [ ] Group invitation notification actions need full UI verification.
* [ ] Backend uses `sequelize.sync({ alter: true })`; confirm the migration strategy before production.

---

## Later

* [ ] Database migrations
* [ ] Database backup and restore tooling
* [ ] WebSocket real-time updates
* [ ] Email reminders
* [ ] Advanced AI scheduling
