# S1-010: Search Employees

| Field | Value |
|---|---|
| **Story ID** | S1-010 |
| **Title** | Search Employees |
| **Stage** | 1 — Employee REST API |
| **Status** | Backlog |
| **Dependencies** | S1-009 |

---

## User Story

As an API consumer, I want to search employees by name, so that I can find people without knowing their exact details.

---

## Acceptance Criteria

- [ ] AC1: `GET /api/v1/employees/search?q={query}` searches across first name and last name.
- [ ] AC2: Search is case-insensitive.
- [ ] AC3: Results are paginated using the same pagination model as the list endpoint (page, size, sort parameters).
- [ ] AC4: Minimum query length is 2 characters — returns 400 Bad Request if shorter.
- [ ] AC5: Only `ACTIVE` employees are returned in search results.
- [ ] AC6: Empty results return 200 OK with an empty `content` array (not 404).

---

## Tasks

| Task | Title | Status |
|---|---|---|
| [T-010-01](../../tasks/stage1/S1-010/T-010-01-search-query.md) | Search query implementation | Pending |
| [T-010-02](../../tasks/stage1/S1-010/T-010-02-controller-search.md) | Controller search endpoint | Pending |
| [T-010-03](../../tasks/stage1/S1-010/T-010-03-unit-tests-search.md) | Unit tests | Pending |

---

## Technical Notes

- Use PostgreSQL `ILIKE` for case-insensitive search. In Spring Data JPA, this can be implemented via a custom `@Query` with `LOWER()` or via a JPA `Specification` that applies `lower(root.get("firstName"))` and `lower(root.get("lastName"))`.
- Search across `first_name` and `last_name` with `OR` — a query like "Jan" should match employees with first name "Janet" or last name "Jansen".
- Use `%query%` (contains) matching. Consider prefix-only matching (`query%`) if performance is a concern, but contains is more user-friendly for Stage 1.
- For Stage 1, `ILIKE` is sufficient. Full-text search (`tsvector`/`tsquery`) can be introduced later if search requirements grow (e.g., searching across more fields, ranking results, handling typos).
- The minimum query length of 2 characters prevents overly broad searches that could return the entire table. Validate this in the controller and return a meaningful error message.
- Reuse the same `Page<EmployeeResponse>` response wrapper used by the list endpoint for consistency.

---

## References

- [PRD](../../PRD.md) — Stage 1 functional requirements (search employees by name)
- [DESIGN](../../DESIGN.md) — Section 3 (database strategy, PostgreSQL features)
- [GUIDELINES](../../GUIDELINES.md) — Section 1 (text blocks for SQL), Section 2 (thin controllers)
