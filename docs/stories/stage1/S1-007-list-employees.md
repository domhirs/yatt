# S1-007: List Employees

| Field | Value |
|---|---|
| **Story ID** | S1-007 |
| **Title** | List Employees |
| **Stage** | 1 — Employee REST API |
| **Status** | Backlog |
| **Dependencies** | S1-006 |

---

## User Story

As an API consumer, I want to list employees with pagination, sorting, and filtering, so that I can browse the employee directory efficiently.

---

## Acceptance Criteria

- [ ] AC1: `GET /api/v1/employees` returns paginated results with default `page=0` and `size=20`.
- [ ] AC2: Supports sorting by any field via query parameter (default: `lastName,asc`).
- [ ] AC3: Supports filtering by `department` and/or `role` via query parameters.
- [ ] AC4: Response includes pagination metadata: `page`, `size`, `totalElements`, `totalPages`.
- [ ] AC5: Empty results return 200 OK with an empty `content` array, not 404.

---

## Tasks

| Task | Title | Status |
|---|---|---|
| [T-007-01](../../tasks/stage1/S1-007/T-007-01-pagination-sorting.md) | Pagination and sorting | Pending |
| [T-007-02](../../tasks/stage1/S1-007/T-007-02-filter-specs.md) | Filter specifications | Pending |
| [T-007-03](../../tasks/stage1/S1-007/T-007-03-controller-list.md) | Controller list endpoint | Pending |
| [T-007-04](../../tasks/stage1/S1-007/T-007-04-unit-tests-list.md) | Unit tests | Pending |

---

## Technical Notes

- Use Spring Data `Pageable` for pagination and sorting. Accept `page`, `size`, and `sort` query parameters, which Spring resolves automatically.
- Use JPA `Specification` for dynamic filtering via `JpaSpecificationExecutor`. Build specifications for `department`, `role`, and `status` filters that compose with `and()`.
- Default behavior: show only `ACTIVE` employees unless the caller explicitly passes `status=INACTIVE` or `status=ALL`. This prevents accidentally exposing deactivated employees in directory listings.
- Return a `Page<EmployeeResponse>` wrapped in a response DTO that includes both the `content` list and pagination metadata (`page`, `size`, `totalElements`, `totalPages`).
- Sorting must handle invalid field names gracefully — return 400 Bad Request if the sort field does not exist on the entity.
- Unit tests should cover: default pagination, custom page/size, sorting by various fields, filtering by department, filtering by role, combined filters, empty results, invalid sort field.

---

## References

- [PRD](../../PRD.md) — Functional requirements (list employees with pagination, sorting, filtering)
- [DESIGN](../../DESIGN.md) — Section 6 (error contract format)
- [GUIDELINES](../../GUIDELINES.md) — Section 2 (thin controllers, Spring Data conventions), Section 7 (testing strategy)
