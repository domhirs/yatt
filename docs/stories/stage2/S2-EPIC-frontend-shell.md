# S2-EPIC-frontend-shell: Frontend Shell

| Field | Value |
|---|---|
| **Epic ID** | S2-EPIC-frontend-shell |
| **Title** | Frontend Shell |
| **Stage** | 2 — Time Tracking & Frontend |
| **Status** | Backlog |
| **Framework** | Angular 21 |

---

## Vision

Build the Angular SPA shell with routing, authentication UI, and the employee management screens as the first feature module.

---

## Key Features (planned)

- App shell with navigation
- Authentication UI (login/logout — connects to Keycloak)
- Employee list and detail views
- Time tracking entry form
- Responsive layout

---

## Technical Considerations

- Standalone components only (no NgModules)
- Signals for reactivity (zoneless)
- Vitest for unit tests
- Lazy-loaded feature routes
- Served via nginx in Docker container

---

## Dependencies

- API Gateway deployed
- Employee service and time tracking service available

---

## Stories

> Stories will be defined when this stage is prioritized. See [`BACKLOG.md`](../BACKLOG.md) for current status.
