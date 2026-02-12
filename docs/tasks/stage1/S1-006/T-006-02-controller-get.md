# T-006-02: Controller GET Endpoint

| Field | Value |
|---|---|
| **Task ID** | T-006-02 |
| **Story** | [S1-006: Get Employee by ID](../../../stories/stage1/S1-006-get-employee.md) |
| **Status** | Pending |

---

## Objective

Implement `GET /api/v1/employees/{id}` in the controller layer to retrieve a single employee by UUID, delegating entirely to the service and relying on the global exception handler for error responses.

---

## Checklist

- [ ] Add GET method to `EmployeeController`
- [ ] Accept `@PathVariable UUID id`
- [ ] Return 200 OK with `EmployeeResponse`
- [ ] `EmployeeNotFoundException` (thrown by service) is handled by `GlobalExceptionHandler` -> 404
- [ ] Verify endpoint works via curl
- [ ] Commit: `feat(S1-006): implement GET /api/v1/employees/{id} endpoint`

---

## Details

### Add GET method to EmployeeController

<details>
<summary>Expand for guidance</summary>

Add this method to the existing `EmployeeController`:

```java
@GetMapping("/{id}")
public ResponseEntity<EmployeeResponse> getById(@PathVariable UUID id) {
    EmployeeResponse response = service.getById(id);
    return ResponseEntity.ok(response);
}
```

That's it. The controller is deliberately thin:

1. It extracts the `UUID` from the path.
2. It delegates to `service.getById(id)`.
3. It wraps the result in a 200 OK response.

There is no `try-catch`, no null check, no Optional handling. All exceptional cases are handled elsewhere:

| Scenario | Who handles it | Result |
|---|---|---|
| Employee exists | Controller returns 200 | `ResponseEntity.ok(response)` |
| Employee not found | `GlobalExceptionHandler` catches `EmployeeNotFoundException` | 404 response |
| Invalid UUID format | `GlobalExceptionHandler` catches `MethodArgumentTypeMismatchException` | 400 response (T-006-03) |

This is the **cross-cutting concerns** approach: exception handling is not the controller's job. The `@ControllerAdvice` (or `@RestControllerAdvice`) class handles it globally, ensuring consistent error responses across all endpoints.

</details>

### @PathVariable UUID automatic parsing

<details>
<summary>Expand for guidance</summary>

Spring MVC automatically converts the `{id}` path segment to a `UUID` object. If the string is not a valid UUID, Spring throws a `MethodArgumentTypeMismatchException` before the controller method is even invoked. This is handled in task T-006-03.

There is no need to manually parse the UUID:

```java
// DON'T do this -- Spring handles it automatically
@GetMapping("/{id}")
public ResponseEntity<EmployeeResponse> getById(@PathVariable String id) {
    UUID uuid = UUID.fromString(id);  // unnecessary
    ...
}
```

```java
// DO this -- let Spring do the conversion
@GetMapping("/{id}")
public ResponseEntity<EmployeeResponse> getById(@PathVariable UUID id) {
    ...
}
```

</details>

### Verify with curl

<details>
<summary>Expand for guidance</summary>

**Successful retrieval (200):**

```bash
# Replace with an actual UUID from a previously created employee
curl -s http://localhost:8080/api/v1/employees/550e8400-e29b-41d4-a716-446655440000 | jq .
```

**Expected response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane.doe@example.com",
  "department": "Engineering",
  "role": "Software Engineer",
  "hireDate": "2025-01-15",
  "managerId": null,
  "status": "ACTIVE",
  "createdAt": "2026-02-12T10:30:00Z",
  "updatedAt": "2026-02-12T10:30:00Z"
}
```

**Employee not found (404):**

```bash
curl -s http://localhost:8080/api/v1/employees/00000000-0000-0000-0000-000000000000 | jq .
```

**Expected response:**

```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Employee with id '00000000-0000-0000-0000-000000000000' not found",
  "details": [],
  "timestamp": "2026-02-12T10:30:00Z",
  "path": "/api/v1/employees/00000000-0000-0000-0000-000000000000"
}
```

**Invalid UUID (400):**

```bash
curl -s http://localhost:8080/api/v1/employees/not-a-uuid | jq .
```

This should return a 400 Bad Request. See task T-006-03 for the handler implementation.

</details>

---

## Development Log

| Date | Entry |
|---|---|
| --- | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) -- Section 2 (thin controllers, constructor injection)
- [DESIGN.md](../../../../docs/DESIGN.md) -- Section 6 (API versioning, error contract)
- [PRD.md](../../../../docs/PRD.md) -- Functional requirements (read a single employee by ID), API design (proper HTTP status codes)
