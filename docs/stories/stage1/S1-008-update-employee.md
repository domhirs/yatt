# S1-008: Update Employee

| Field | Value |
|---|---|
| **Story ID** | S1-008 |
| **Title** | Update Employee |
| **Stage** | 1 — Employee REST API |
| **Status** | Backlog |
| **Dependencies** | S1-007 |

---

## User Story

As an API consumer, I want to partially update an employee via PATCH, so that I can modify specific fields without sending the full resource.

---

## Acceptance Criteria

- [ ] AC1: `PATCH /api/v1/employees/{id}` accepts partial updates and returns 200 with the updated employee.
- [ ] AC2: Only provided fields are updated — null fields in the request body are ignored (absent means "don't change").
- [ ] AC3: Email uniqueness is enforced on update — returns 409 Conflict if the new email is already taken by another employee.
- [ ] AC4: `manager_id` validation applies on update — returns 422 Unprocessable Entity if the specified manager does not exist or is not active.
- [ ] AC5: Optimistic locking prevents lost updates — returns 409 Conflict on version mismatch.
- [ ] AC6: Returns 404 Not Found if the employee does not exist.

---

## Tasks

| Task | Title | Status |
|---|---|---|
| [T-008-01](../../tasks/stage1/S1-008/T-008-01-service-patch.md) | Service patch method | Pending |
| [T-008-02](../../tasks/stage1/S1-008/T-008-02-controller-patch.md) | Controller PATCH endpoint | Pending |
| [T-008-03](../../tasks/stage1/S1-008/T-008-03-optimistic-locking.md) | Optimistic locking | Pending |
| [T-008-04](../../tasks/stage1/S1-008/T-008-04-unit-tests-update.md) | Unit tests | Pending |

---

## Technical Notes

- Use `JsonNullable` (from the `org.openapitools:jackson-databind-nullable` library) or a custom approach to distinguish between "field not sent" and "field explicitly set to null". This is critical for PATCH semantics — a field omitted from the request body must not overwrite the existing value, while a field explicitly set to `null` should clear it (where nullable fields allow it).
- Add `@Version` (Jakarta Persistence) on the entity to enable optimistic locking. The version field is automatically incremented on each update. The client must include the current version in the PATCH request; if it does not match the persisted version, JPA throws `OptimisticLockException`, which the controller advice maps to 409 Conflict.
- The patch DTO should be a separate record/class from the create DTO, with all fields optional (wrapped in `JsonNullable` or similar).
- Reuse the existing email-uniqueness and manager-validation logic from the create flow; extract shared validation into the service layer to avoid duplication.

---

## References

- [PRD](../../PRD.md) — Stage 1 functional requirements (update employee details via PATCH)
- [DESIGN](../../DESIGN.md) — Section 6 (error contract for 409 and 422 responses)
- [GUIDELINES](../../GUIDELINES.md) — Section 1 (records for DTOs, immutability), Section 2 (thin controllers, constructor injection)
