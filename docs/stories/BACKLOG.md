# Product Backlog

All user stories and epics, organized by stage. Stories are listed in recommended implementation order within each stage.

> **How to use**: Pick the next story in order, verify its dependencies are complete, then follow the tasks in `docs/tasks/`.
> See [`docs/PROCESS.md`](../PROCESS.md) for the full development workflow.

---

## Stage 1 — Employee REST API

**Goal**: A fully functional Employee microservice with CRUD, search, org chart, error handling, Docker containerization, and integration tests.

### Dependency graph

```
S1-001 Project Setup ──► S1-002 Database Schema    S1-003 OpenAPI Spec
                              │                          │
                              ▼                          ▼
                         S1-004 Entity/Repository/DTOs ◄─┘
                              │
                              ├──► S1-012 Error Handling (cross-cutting, built early)
                              │
                              ▼
                         S1-005 Create Employee
                              ▼
                         S1-006 Get Employee
                              ▼
                         S1-007 List Employees
                              ▼
                         S1-008 Update Employee
                              ▼
                         S1-009 Delete Employee
                              ▼
                         S1-010 Search Employees
                              ▼
                         S1-011 Org Chart
                              ▼
                         S1-013 Docker Containerization
                              ▼
                         S1-014 Integration Tests
```

### Stories

| ID | Title | Status | Dependencies | Tasks |
|---|---|---|---|---|
| [S1-001](stage1/S1-001-project-setup.md) | Project Setup | Backlog | — | [4 tasks](../tasks/stage1/S1-001/) |
| [S1-002](stage1/S1-002-database-schema.md) | Database Schema | Backlog | S1-001 | [3 tasks](../tasks/stage1/S1-002/) |
| [S1-003](stage1/S1-003-openapi-spec.md) | OpenAPI Spec | Backlog | S1-001 | [3 tasks](../tasks/stage1/S1-003/) |
| [S1-004](stage1/S1-004-employee-entity.md) | Employee Entity & Repository | Backlog | S1-002, S1-003 | [4 tasks](../tasks/stage1/S1-004/) |
| [S1-005](stage1/S1-005-create-employee.md) | Create Employee | Backlog | S1-004, S1-012 | [4 tasks](../tasks/stage1/S1-005/) |
| [S1-006](stage1/S1-006-get-employee.md) | Get Employee | Backlog | S1-005 | [4 tasks](../tasks/stage1/S1-006/) |
| [S1-007](stage1/S1-007-list-employees.md) | List Employees | Backlog | S1-006 | [4 tasks](../tasks/stage1/S1-007/) |
| [S1-008](stage1/S1-008-update-employee.md) | Update Employee | Backlog | S1-007 | [4 tasks](../tasks/stage1/S1-008/) |
| [S1-009](stage1/S1-009-delete-employee.md) | Delete Employee | Backlog | S1-008 | [4 tasks](../tasks/stage1/S1-009/) |
| [S1-010](stage1/S1-010-search-employees.md) | Search Employees | Backlog | S1-009 | [3 tasks](../tasks/stage1/S1-010/) |
| [S1-011](stage1/S1-011-org-chart.md) | Org Chart | Backlog | S1-010 | [4 tasks](../tasks/stage1/S1-011/) |
| [S1-012](stage1/S1-012-error-handling.md) | Error Handling | Backlog | S1-004 | [3 tasks](../tasks/stage1/S1-012/) |
| [S1-013](stage1/S1-013-docker.md) | Docker Containerization | Backlog | S1-011 | [3 tasks](../tasks/stage1/S1-013/) |
| [S1-014](stage1/S1-014-integration-tests.md) | Integration Tests | Backlog | S1-013 | [3 tasks](../tasks/stage1/S1-014/) |

---

## Stage 2 — Time Tracking & Frontend Shell

**Goal**: Add time tracking (Quarkus), API gateway, and the Angular frontend shell.

| ID | Title | Status | Description |
|---|---|---|---|
| [S2-EPIC-time-tracking](stage2/S2-EPIC-time-tracking.md) | Time Tracking Service | Backlog | Clock in/out, manual entry, timesheets (Quarkus) |
| [S2-EPIC-api-gateway](stage2/S2-EPIC-api-gateway.md) | API Gateway | Backlog | Spring Cloud Gateway — routing, rate limiting |
| [S2-EPIC-frontend-shell](stage2/S2-EPIC-frontend-shell.md) | Frontend Shell | Backlog | Angular 21 SPA — app shell, auth, routing |

---

## Stage 3 — Time Budget & Project Planning

**Goal**: Budget allocation, project/milestone management, resource planning.

| ID | Title | Status | Description |
|---|---|---|---|
| [S3-EPIC-time-budget](stage3/S3-EPIC-time-budget.md) | Time Budget Service | Backlog | Allocate hours per project/team/period, burn-down |
| [S3-EPIC-project-planning](stage3/S3-EPIC-project-planning.md) | Project Planning Service | Backlog | Projects, milestones, task assignment, resources |

---

## Stage 4 — Vacation Workflow & Visualization

**Goal**: Leave requests, approvals, dashboards, and reports.

| ID | Title | Status | Description |
|---|---|---|---|
| [S4-EPIC-vacation-workflow](stage4/S4-EPIC-vacation-workflow.md) | Vacation Workflow Service | Backlog | Leave requests, approval chain, calendar, balance |
| [S4-EPIC-data-visualization](stage4/S4-EPIC-data-visualization.md) | Data Visualization | Backlog | Dashboards, reports, charts (Grafana) |
