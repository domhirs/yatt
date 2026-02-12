# S1-005: Create Employee

| Field | Value |
|---|---|
| **Story ID** | S1-005 |
| **Title** | Create Employee |
| **Stage** | 1 — Employee REST API |
| **Status** | Backlog |
| **Dependencies** | S1-004, S1-012 |

---

## User Story

As an API consumer, I want to create a new employee by sending a POST request, so that employees can be added to the system.

---

## Acceptance Criteria

- [ ] AC1: `POST /api/v1/employees` creates a new employee and returns 201 Created with a `Location` header pointing to the new resource.
- [ ] AC2: Request body is validated — all fields are required except `manager_id`.
- [ ] AC3: Email uniqueness is enforced across all employees (including inactive). Returns 409 Conflict on duplicate email.
- [ ] AC4: `manager_id`, if provided, must reference an existing active employee. Returns 422 Unprocessable Entity if the manager is invalid or inactive.
- [ ] AC5: Response body contains the created employee with generated `id`, `created_at`, and `updated_at` timestamps.
- [ ] AC6: Validation errors return 422 Unprocessable Entity with field-level error details matching the standard error contract.

---

## Tasks

| Task | Title | Status |
|---|---|---|
| [T-005-01](../../tasks/stage1/S1-005/T-005-01-service-create.md) | Service create method | Pending |
| [T-005-02](../../tasks/stage1/S1-005/T-005-02-controller-create.md) | Controller POST endpoint | Pending |
| [T-005-03](../../tasks/stage1/S1-005/T-005-03-validation.md) | Validation logic | Pending |
| [T-005-04](../../tasks/stage1/S1-005/T-005-04-unit-tests-create.md) | Unit tests | Pending |

---

## Technical Notes

- The service layer validates business rules: email uniqueness (query repository before save), manager existence and active status.
- The controller is thin — it delegates entirely to the service, maps the result, and returns the appropriate `ResponseEntity`.
- Use `@Valid` on the request body to trigger Bean Validation annotations on the `CreateEmployeeRequest` record.
- Return `ResponseEntity.created(location).body(response)` where `location` is `/api/v1/employees/{id}`.
- Email uniqueness violation at the database level (unique constraint) should be caught and translated to a 409 Conflict response, not a 500.
- Unit tests should cover: successful creation, duplicate email, invalid manager_id, missing required fields, email format validation.
- Integration tests (covered in a later story) will verify the full flow against a real database.

---

## References

- [PRD](../../PRD.md) — Functional requirements (create employee), validation rules (email unique, manager must be active)
- [DESIGN](../../DESIGN.md) — Section 6 (error contract format)
- [GUIDELINES](../../GUIDELINES.md) — Section 2 (thin controllers, constructor injection), Section 7 (testing strategy, unit test conventions)
