# S1-003: OpenAPI Specification

| Field | Value |
|---|---|
| **Story ID** | S1-003 |
| **Title** | OpenAPI Specification |
| **Stage** | 1 — Employee REST API |
| **Status** | Backlog |
| **Dependencies** | S1-001 |

---

## User Story

As a developer, I want an OpenAPI 3.1 spec defined before implementation, so that the API contract is clear, reviewed, and can generate server stubs.

---

## Acceptance Criteria

- [ ] AC1: OpenAPI 3.1 YAML spec covers all CRUD endpoints (POST, GET, PATCH, DELETE), search, and org chart endpoints.
- [ ] AC2: Error response schema matches the standard error contract defined in DESIGN.md Section 6.
- [ ] AC3: Spec includes request/response examples for every endpoint.
- [ ] AC4: Code generation produces DTOs and controller interfaces from the spec.
- [ ] AC5: Spec is stored in `docs/api/employee-service.yaml`.

---

## Tasks

| Task | Title | Status |
|---|---|---|
| [T-003-01](../../tasks/stage1/S1-003/T-003-01-openapi-spec.md) | Write OpenAPI spec | Pending |
| [T-003-02](../../tasks/stage1/S1-003/T-003-02-code-generation.md) | Configure code generation | Pending |
| [T-003-03](../../tasks/stage1/S1-003/T-003-03-error-contract.md) | Define error contract schema | Pending |

---

## Technical Notes

- API-first approach per GUIDELINES.md Section 4. Define the spec, review it, then implement against it.
- Endpoints to cover:
  - `POST /api/v1/employees` — Create employee
  - `GET /api/v1/employees/{id}` — Get employee by ID
  - `GET /api/v1/employees` — List employees (paginated, filtered)
  - `PATCH /api/v1/employees/{id}` — Update employee (partial)
  - `DELETE /api/v1/employees/{id}` — Soft-delete employee
  - `GET /api/v1/employees/{id}/direct-reports` — Direct reports
  - `GET /api/v1/employees/{id}/reporting-chain` — Reporting chain
  - `GET /api/v1/employees/search` — Search by name
- Use `openapi-generator-maven-plugin` or `springdoc-openapi` for code generation.
- Error contract schema (from DESIGN.md):
  ```json
  {
    "status": 422,
    "error": "Unprocessable Entity",
    "message": "Validation failed",
    "details": [{ "field": "email", "message": "must be a valid email address" }],
    "timestamp": "2026-02-12T10:00:00Z",
    "path": "/api/v1/employees"
  }
  ```
- HTTP status codes: 201 on create, 200 on get/list/update, 204 on delete, 400 on bad input, 404 on not found, 409 on conflict, 422 on validation failure.

---

## References

- [PRD](../../PRD.md) — API design requirements, functional requirements
- [DESIGN](../../DESIGN.md) — Section 6 (error contract), Section 4 (communication patterns)
- [GUIDELINES](../../GUIDELINES.md) — Section 4 (API-first design)
