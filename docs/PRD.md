# Project Requirements Document (PRD)

## Vision

**yatt** (Yet Another Time Tracker) — a full-stack **time-tracking, time-budget, project-planning, and vacation-workflow platform** built as a learning project. The primary goal is to level up Java skills while learning microservices architecture with modern frameworks. The secondary goal is to produce a genuinely useful internal tool.

## Scope

### Modules

| # | Module | Description | Priority |
|---|---|---|---|
| 1 | **Employee management** | CRUD for employees, teams, roles, reporting hierarchy | Stage 1 |
| 2 | **Time tracking** | Clock in/out, manual entry, daily/weekly timesheets | Stage 2 |
| 3 | **Time budget** | Allocate hours per project/team/period, track burn-down | Stage 3 |
| 4 | **Project planning** | Projects, milestones, task assignment, resource allocation | Stage 3 |
| 5 | **Vacation workflow** | Leave requests, approval chain, calendar view, balance tracking | Stage 4 |
| 6 | **Data visualization** | Dashboards, reports, charts (time distribution, budget usage, team utilization) | Stage 4 |

### Stage 1 — Employee REST API (current focus)

The first deliverable is a working **Employee microservice** with:

#### Functional requirements
- **Create** an employee: name, email, department, role, hire date, manager (self-referencing).
- **Read** a single employee by ID.
- **List** employees with pagination, sorting, and filtering by department/role.
- **Update** employee details (partial updates via PATCH).
- **Delete** (soft-delete) an employee.
- **Search** employees by name (full-text or LIKE).
- **Org chart**: retrieve direct reports and reporting chain.

#### API design
- RESTful, JSON over HTTP.
- OpenAPI 3.1 spec defined before implementation.
- Proper HTTP status codes (201 on create, 204 on delete, 409 on conflict, 422 on validation failure).
- HATEOAS links for discoverability (optional, nice-to-have).

#### Data model (initial)
```
Employee
  id          : UUID (PK)
  first_name  : String (not blank, max 100)
  last_name   : String (not blank, max 100)
  email       : String (unique, valid email format)
  department  : String (not blank)
  role        : String (not blank)
  hire_date   : LocalDate (not null, not in future)
  manager_id  : UUID (FK -> Employee, nullable)
  status      : Enum (ACTIVE, INACTIVE)
  created_at  : Instant
  updated_at  : Instant
```

#### Validation rules
- Email must be unique across all employees (including inactive).
- Manager must be an existing, active employee.
- Cannot delete an employee who is a manager of others (must reassign first).

---

## Non-functional requirements

| Requirement | Details |
|---|---|
| **Architecture** | Microservices; each module is a separate deployable service. |
| **Containerization** | All services and infrastructure run in Docker containers. |
| **FOSS** | All dependencies must be free and open-source (see GUIDELINES.md). |
| **API-first** | OpenAPI specs defined before implementation. |
| **Testing** | Unit, integration (Testcontainers), and contract tests for every service. |
| **Observability** | Structured logging, health checks, metrics (Micrometer). |
| **Security** | Authentication and authorization from Stage 2 onward. Stage 1: unauthenticated but structurally ready. |
| **Database** | PostgreSQL 17+ with schema-per-service isolation. |
| **CI/CD** | GitHub Actions (or equivalent) — deferred until Stage 2. |

---

## Constraints

- **Learning-first**: code quality and understanding matter more than speed. Every decision should be explainable.
- **Incremental delivery**: each stage builds on the previous one. Don't build infrastructure for later stages until needed.
- **Single developer**: no need for complex branching strategies. Keep it simple.

---

## Success criteria — Stage 1

1. Employee REST API is functional and meets all CRUD requirements above.
2. API matches the OpenAPI spec.
3. Unit test coverage >= 80% on service layer.
4. Integration tests pass against a real PostgreSQL instance (via Testcontainers).
5. The service runs in a Docker container and starts in < 10 seconds.
6. Documentation is clear enough that a new developer could onboard in an afternoon.
