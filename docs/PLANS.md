# Planify Plans

> What the team plans to work on next.
>
> Keep this file focused on near-term work. Move completed context into `docs/PROGESS.md`.
>
> Before and after meaningful project work, update this file together with `docs/PROGESS.md` and `docs/WORKFLOW.md` when the plan, status, or workflow changes.

**Last Updated:** July 18, 2026

---

## Current Priority

* [x] Make README and docs match the current repository state.
* [x] Convert the frontend from React CDN + Babel Standalone to Vite React.
* [x] Verify frontend-backend integration feature by feature.

---

## Next Tasks

1. [x] Wire schedules, active schedule creation, availability, and task-deadline synchronization.
2. [x] Persist profile, avatar, preferences, subjects, focus sessions, and progress per account.
3. [x] Add browser journey tests and database-backed API integration cases.
4. [x] Add preference-aware realtime group and deadline notifications.
5. [ ] Add production deployment and monitoring configuration.
6. [ ] Select providers before implementing external push, calendar, digest, or public-profile features.

---

## Planned Features

* [x] Automated API integration test foundation and core coverage.
* [ ] Centralized request validation for backend controllers.
* [x] Frontend package/build setup with Vite.
* [ ] Deployment configuration for a production environment.

---

## Bugs To Fix / Risks To Verify

* [x] Schedule UI is connected through `PlanifyAPI`.
* [x] Profile, preferences, subjects, progress, and focus history persist to the backend.
* [x] Core group and notification paths have automated coverage.
* [ ] Run API integration tests against an isolated MySQL database in CI.
* [ ] Replace startup migrations with deployment-managed migrations before horizontal scaling.
* [ ] `frontend/dist/` is generated Vite build output and should stay ignored unless deployment needs it committed.

---

## Later

* [ ] Database migrations
* [ ] Database backup and restore tooling
* [x] WebSocket real-time updates
* [ ] Email reminders
* [ ] Advanced AI scheduling
