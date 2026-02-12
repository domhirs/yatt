# S1-009: Delete Employee (Soft Delete)

| Field | Value |
|---|---|
| **Story ID** | S1-009 |
| **Title** | Delete Employee (Soft Delete) |
| **Stage** | 1 — Employee REST API |
| **Status** | Backlog |
| **Dependencies** | S1-008 |

---

## User Story

As an API consumer, I want to soft-delete an employee, so that their data is preserved for historical records but they no longer appear in active listings.

---

## Acceptance Criteria

- [ ] AC1: `DELETE /api/v1/employees/{id}` sets the employee's status to `INACTIVE` and returns 204 No Content.
- [ ] AC2: Cannot delete an employee who manages other active employees — returns 409 Conflict with a message listing the dependent employees.
- [ ] AC3: Returns 404 Not Found if the employee does not exist.
- [ ] AC4: Returns 409 Conflict if the employee is already inactive.
- [ ] AC5: Soft-deleted employees are excluded from list and search results by default but are still retrievable by direct ID lookup (`GET /api/v1/employees/{id}`).

---

## Tasks

| Task | Title | Status |
|---|---|---|
| [T-009-01](../../tasks/stage1/S1-009/T-009-01-soft-delete-service.md) | Soft delete service method | Pending |
| [T-009-02](../../tasks/stage1/S1-009/T-009-02-controller-delete.md) | Controller DELETE endpoint | Pending |
| [T-009-03](../../tasks/stage1/S1-009/T-009-03-reports-guard.md) | Manager dependency guard | Pending |
| [T-009-04](../../tasks/stage1/S1-009/T-009-04-unit-tests-delete.md) | Unit tests | Pending |

---

## Technical Notes

- Soft delete means setting `status = INACTIVE` and updating `updated_at`. Do **not** physically delete rows from the database. This preserves referential integrity and historical data.
- The manager dependency guard queries for active employees where `manager_id = :id`. If any exist, the delete is rejected with 409 and the response body should include the IDs (or names) of the dependent employees so the caller knows who needs to be reassigned.
- List and search endpoints must filter by `status = ACTIVE` by default. Consider adding an optional query parameter (e.g., `?includeInactive=true`) in a future story if needed.
- The direct ID lookup (`GET /api/v1/employees/{id}`) returns the employee regardless of status, so that callers can still inspect deactivated records.
- Already-inactive employees return 409 (not 204) to signal the operation is not idempotent in the traditional sense — the caller should know the employee was already deactivated.

---

## References

- [PRD](../../PRD.md) — Stage 1 functional requirements (soft-delete, validation rules for manager reassignment)
- [DESIGN](../../DESIGN.md) — Section 4 (domain events: `employee.deactivated`), Section 6 (error contract)
- [GUIDELINES](../../GUIDELINES.md) — Section 1 (null safety, fail fast), Section 7 (testing strategy)
