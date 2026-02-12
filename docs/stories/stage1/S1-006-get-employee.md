# S1-006: Get Employee by ID

| Field | Value |
|---|---|
| **Story ID** | S1-006 |
| **Title** | Get Employee by ID |
| **Stage** | 1 — Employee REST API |
| **Status** | Backlog |
| **Dependencies** | S1-005 |

---

## User Story

As an API consumer, I want to retrieve a single employee by their UUID, so that I can view their details.

---

## Acceptance Criteria

- [ ] AC1: `GET /api/v1/employees/{id}` returns 200 OK with the employee data in the response body.
- [ ] AC2: Returns 404 Not Found with the standard error response if no employee exists with the given ID.
- [ ] AC3: Returns 400 Bad Request if the `id` path parameter is not a valid UUID format.
- [ ] AC4: Inactive employees are still retrievable — soft-delete does not hide employees from direct lookup by ID.

---

## Tasks

| Task | Title | Status |
|---|---|---|
| [T-006-01](../../tasks/stage1/S1-006/T-006-01-service-get.md) | Service get method | Pending |
| [T-006-02](../../tasks/stage1/S1-006/T-006-02-controller-get.md) | Controller GET endpoint | Pending |
| [T-006-03](../../tasks/stage1/S1-006/T-006-03-invalid-uuid.md) | Invalid UUID handling | Pending |
| [T-006-04](../../tasks/stage1/S1-006/T-006-04-unit-tests-get.md) | Unit tests | Pending |

---

## Technical Notes

- The service method returns `Optional<EmployeeResponse>`. The controller maps `Optional.empty()` to a 404 response using the standard error contract.
- UUID parse errors (`MethodArgumentTypeMismatchException` or `IllegalArgumentException`) should be handled in a global `@RestControllerAdvice` exception handler, returning 400 Bad Request.
- No status filter on direct lookup — both `ACTIVE` and `INACTIVE` employees are returned. This is intentional: soft-delete hides from list views but not from direct access, allowing clients to inspect deactivated records.
- The response DTO (`EmployeeResponse`) should include all fields: `id`, `firstName`, `lastName`, `email`, `department`, `role`, `hireDate`, `managerId`, `status`, `createdAt`, `updatedAt`.
- Unit tests should cover: successful retrieval, employee not found (404), invalid UUID format (400), retrieval of inactive employee (200).

---

## References

- [PRD](../../PRD.md) — Functional requirements (read a single employee by ID)
- [DESIGN](../../DESIGN.md) — Section 6 (error contract format)
- [GUIDELINES](../../GUIDELINES.md) — Section 1 (null safety, Optional for return types), Section 7 (testing strategy)
