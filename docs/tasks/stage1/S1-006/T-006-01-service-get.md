# T-006-01: Service Get Method

| Field | Value |
|---|---|
| **Task ID** | T-006-01 |
| **Story** | [S1-006: Get Employee by ID](../../../stories/stage1/S1-006-get-employee.md) |
| **Status** | Pending |

---

## Objective

Implement `EmployeeService.getById()` to retrieve a single employee by UUID, throwing `EmployeeNotFoundException` when no matching record exists, and returning both active and inactive employees.

---

## Checklist

- [ ] Add `getById(UUID id)` method to `EmployeeService`
- [ ] Use `repository.findById(id)` to look up the employee
- [ ] Map entity to `EmployeeResponse` via `EmployeeMapper`
- [ ] Throw `EmployeeNotFoundException` if not found
- [ ] Verify that inactive employees ARE retrievable by ID
- [ ] Commit: `feat(S1-006): implement EmployeeService.getById()`

---

## Details

### Implement getById(UUID id)

<details>
<summary>Expand for guidance</summary>

Add this method to the existing `EmployeeService` class:

```java
public EmployeeResponse getById(UUID id) {
    Employee employee = repository.findById(id)
            .orElseThrow(() -> new EmployeeNotFoundException(id));

    return mapper.toResponse(employee);
}
```

**Key design decisions:**

- **Return type is `EmployeeResponse`, not `Optional<EmployeeResponse>`.** The service throws an exception if the employee is not found, which keeps the controller simple -- it never has to deal with an empty Optional. The story's technical notes mention `Optional<EmployeeResponse>` as a possibility, but throwing from the service is the cleaner approach because:
  - The controller stays thin (no `.orElseThrow()` or `.map()` logic).
  - The exception is handled centrally by `GlobalExceptionHandler`.
  - The "not found" case is exceptional in the domain sense -- the caller asked for a specific ID that doesn't exist.

- **No status filter.** Both `ACTIVE` and `INACTIVE` employees are returned. This is intentional per acceptance criteria AC4: soft-delete hides employees from list views (S1-007) but not from direct ID lookups. The rationale is that direct access by UUID implies the caller already knows the resource exists (e.g., from a link, a cached reference, or an audit log). Hiding soft-deleted records from direct access would break referential integrity for other services.

</details>

### EmployeeNotFoundException

<details>
<summary>Expand for guidance</summary>

Create the exception class in `com.timetracker.employee`:

```java
public class EmployeeNotFoundException extends RuntimeException {

    public EmployeeNotFoundException(UUID id) {
        super("Employee with id '%s' not found".formatted(id));
    }
}
```

This exception will be handled by the `GlobalExceptionHandler` (S1-012) and converted to a 404 Not Found response matching the standard error contract:

```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Employee with id '550e8400-...' not found",
  "details": [],
  "timestamp": "2026-02-12T10:30:00Z",
  "path": "/api/v1/employees/550e8400-..."
}
```

**Why a custom exception instead of returning Optional and letting the controller decide?** The service owns the business rule "an employee must exist to be retrieved." Encoding this as an exception centralizes the decision and its error message. If multiple controller methods (or even other services) need to look up an employee, they all get consistent not-found behavior without duplicating the check.

</details>

### Inactive employees are still retrievable

<details>
<summary>Expand for guidance</summary>

The `findById()` call does **not** add a status filter. This is a deliberate choice:

| Endpoint | Includes inactive? | Rationale |
|---|---|---|
| `GET /api/v1/employees/{id}` | Yes | Direct access implies the caller knows the ID; hiding would break links |
| `GET /api/v1/employees` (list) | No (by default) | List views show the "current" workforce; inactive employees are filtered out |

This distinction will be important when implementing the list endpoint (S1-007). For now, `getById()` simply returns whatever `findById()` returns, regardless of status.

</details>

---

## Development Log

| Date | Entry |
|---|---|
| --- | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) -- Section 1 (null safety: avoid returning null, use Optional for method return types where absence is valid)
- [DESIGN.md](../../../../docs/DESIGN.md) -- Section 6 (error contract format for 404 responses)
- [PRD.md](../../../../docs/PRD.md) -- Functional requirements (read a single employee by ID)
