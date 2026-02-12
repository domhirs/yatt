# S1-011: Org Chart

| Field | Value |
|---|---|
| **Story ID** | S1-011 |
| **Title** | Org Chart |
| **Stage** | 1 — Employee REST API |
| **Status** | Backlog |
| **Dependencies** | S1-010 |

---

## User Story

As an API consumer, I want to view an employee's direct reports and full reporting chain, so that I can understand the organizational hierarchy.

---

## Acceptance Criteria

- [ ] AC1: `GET /api/v1/employees/{id}/direct-reports` returns a list of employees who report directly to this manager.
- [ ] AC2: `GET /api/v1/employees/{id}/reporting-chain` returns the chain from this employee up to the top-level employee (one with no manager).
- [ ] AC3: Both endpoints return 404 Not Found if the employee does not exist.
- [ ] AC4: Direct reports only include `ACTIVE` employees.
- [ ] AC5: Reporting chain includes all employees in the chain regardless of status (to preserve full hierarchy visibility).
- [ ] AC6: Circular reference protection is implemented — traversal stops at a maximum depth (e.g., 50 levels) or upon detecting a cycle.

---

## Tasks

| Task | Title | Status |
|---|---|---|
| [T-011-01](../../tasks/stage1/S1-011/T-011-01-direct-reports.md) | Direct reports query | Pending |
| [T-011-02](../../tasks/stage1/S1-011/T-011-02-reporting-chain.md) | Reporting chain traversal | Pending |
| [T-011-03](../../tasks/stage1/S1-011/T-011-03-controller-orgchart.md) | Controller org chart endpoints | Pending |
| [T-011-04](../../tasks/stage1/S1-011/T-011-04-unit-tests-orgchart.md) | Unit tests | Pending |

---

## Technical Notes

- **Direct reports** is a simple query: `SELECT * FROM employee WHERE manager_id = :id AND status = 'ACTIVE'`. This can be a Spring Data JPA derived query method (`findByManagerIdAndStatus`).
- **Reporting chain** requires traversal up the manager hierarchy. Two implementation options:
  1. **Recursive CTE in PostgreSQL** — a single SQL query using `WITH RECURSIVE` that walks up the `manager_id` chain. Efficient and handles cycle detection via the query itself (limit recursion depth).
  2. **Iterative Java loop** — load the employee, then load their manager, then the manager's manager, etc. Use a `Set<UUID>` of visited IDs to detect cycles. Simpler to understand but makes N+1 queries (acceptable for small hierarchies).
  - For Stage 1, the iterative Java approach is simpler and more instructive. The recursive CTE can be introduced as an optimization if hierarchy depth becomes a performance concern.
- Cap the maximum traversal depth at 50 levels. If reached, return the chain collected so far and log a warning. This prevents runaway queries from corrupt data.
- The reporting chain response should be an ordered list starting from the employee's direct manager up to the root (top-level employee with `manager_id = null`).

---

## References

- [PRD](../../PRD.md) — Stage 1 functional requirements (org chart: direct reports and reporting chain)
- [DESIGN](../../DESIGN.md) — Section 3 (database strategy, PostgreSQL), Section 6 (API versioning)
- [GUIDELINES](../../GUIDELINES.md) — Section 1 (immutability, null safety), Section 2 (thin controllers, service layer logic)
