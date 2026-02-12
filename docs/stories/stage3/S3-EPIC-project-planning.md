# S3-EPIC-project-planning: Project Planning Service

| Field | Value |
|---|---|
| **Epic ID** | S3-EPIC-project-planning |
| **Title** | Project Planning Service |
| **Stage** | 3 — Time Budget & Project Planning |
| **Status** | Backlog |
| **Framework** | Spring Boot 4 |

---

## Vision

Enable project managers to create projects, define milestones, assign tasks to employees, and plan resource allocation across teams.

---

## Key Features (planned)

- Project CRUD with milestones
- Task creation and assignment
- Resource allocation (employee hours per project)
- Timeline/Gantt view data
- Project status tracking

---

## Technical Considerations

- Links to employee service (assignment validation)
- Links to time tracking (actual hours per project)
- REST API with project hierarchy (project -> milestones -> tasks)
- Consider read-model pattern for complex queries

---

## Dependencies

- Stage 2 complete
- Employee service
- Time tracking service

---

## Stories

> Stories will be defined when this stage is prioritized. See [`BACKLOG.md`](../BACKLOG.md) for current status.
