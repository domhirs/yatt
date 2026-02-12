# T-008-02: Controller PATCH Endpoint

| Field | Value |
|---|---|
| **Task ID** | T-008-02 |
| **Story** | [S1-008: Update Employee](../../../stories/stage1/S1-008-update-employee.md) |
| **Status** | Pending |

---

## Objective

Implement `PATCH /api/v1/employees/{id}` endpoint, keeping the controller thin and delegating update logic entirely to the service layer.

---

## Checklist

- [ ] Add `PATCH` method to `EmployeeController`
- [ ] Accept `@PathVariable UUID id` and `@RequestBody UpdateEmployeeRequest`
- [ ] Delegate to `service.update(id, request)`
- [ ] Return 200 with updated `EmployeeResponse`
- [ ] Verify endpoint with curl (update single field)
- [ ] Verify endpoint with curl (update multiple fields)
- [ ] Commit: `feat(S1-008): add PATCH /api/v1/employees/{id} endpoint`

---

## Details

### Add PATCH method to EmployeeController

<details>
<summary>Expand for guidance</summary>

```java
@PatchMapping("/{id}")
public ResponseEntity<EmployeeResponse> update(
        @PathVariable UUID id,
        @RequestBody UpdateEmployeeRequest request) {

    EmployeeResponse response = employeeService.update(id, request);
    return ResponseEntity.ok(response);
}
```

**Key design points:**

- **No `@Valid`** on the request body. Unlike `CreateEmployeeRequest` where all fields are required and validated, `UpdateEmployeeRequest` has all optional fields. Bean Validation annotations like `@NotBlank` would reject the request when fields are `null` (which means "don't change" in PATCH semantics). Validation of individual field values happens in the service layer when the field is present.
- `@PathVariable UUID id` — Spring automatically converts the path segment to `UUID`. If the format is invalid, Spring returns 400 Bad Request.
- The method returns `ResponseEntity<EmployeeResponse>` wrapping the updated employee, consistent with the create endpoint.
- Error responses (404, 409, 422) are handled by `GlobalExceptionHandler`, not by the controller.

</details>

### Why @Valid is not appropriate here

<details>
<summary>Expand for guidance</summary>

| Scenario | With `@Valid` | Without `@Valid` |
|---|---|---|
| `{"department": "Engineering"}` | Would fail if `@NotBlank` is on `firstName` (because `firstName` is null) | Works correctly: only `department` is updated |
| `{"email": "invalid"}` | Would catch invalid email format | Must validate in service layer when email is non-null |
| `{}` (empty body) | Passes (no fields to validate) | Passes (no changes applied) |

The trade-off: without `@Valid`, you need to validate individual field values (like email format) in the service layer when they are present. This is more work but correctly implements PATCH semantics.

An alternative is to use a custom `Validator` or per-field validation annotations that only trigger when the field is non-null:

```java
public record UpdateEmployeeRequest(
        @Size(min = 1, max = 100) String firstName,
        @Size(min = 1, max = 100) String lastName,
        @Email String email,
        String department,
        String role,
        LocalDate hireDate,
        UUID managerId,
        EmployeeStatus status,
        Long version
) {}
```

With these annotations, `@Valid` would only validate fields that are present (non-null), because Bean Validation skips null values by default for most constraints (`@Size`, `@Email`, etc.). However, `@NotBlank` would still fail on null. Choose the approach that best fits the project's validation strategy.

</details>

### Verify with curl

<details>
<summary>Expand for guidance</summary>

After implementing, test with these requests (replace the UUID with an actual employee ID):

```bash
# Update a single field (department)
curl -X PATCH http://localhost:8080/api/v1/employees/f47ac10b-58cc-4372-a567-0e02b2c3d479 \
  -H "Content-Type: application/json" \
  -d '{"department": "Product"}'

# Update multiple fields (email and role)
curl -X PATCH http://localhost:8080/api/v1/employees/f47ac10b-58cc-4372-a567-0e02b2c3d479 \
  -H "Content-Type: application/json" \
  -d '{"email": "new.email@example.com", "role": "Staff Engineer"}'

# Empty body (no changes)
curl -X PATCH http://localhost:8080/api/v1/employees/f47ac10b-58cc-4372-a567-0e02b2c3d479 \
  -H "Content-Type: application/json" \
  -d '{}'

# Non-existent employee (expect 404)
curl -X PATCH http://localhost:8080/api/v1/employees/00000000-0000-0000-0000-000000000000 \
  -H "Content-Type: application/json" \
  -d '{"department": "Product"}'

# Duplicate email (expect 409)
curl -X PATCH http://localhost:8080/api/v1/employees/f47ac10b-58cc-4372-a567-0e02b2c3d479 \
  -H "Content-Type: application/json" \
  -d '{"email": "already.taken@example.com"}'
```

**Expected success response** (200 OK):

```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "new.email@example.com",
  "department": "Product",
  "role": "Staff Engineer",
  "hireDate": "2025-03-15",
  "managerId": null,
  "status": "ACTIVE",
  "createdAt": "2026-02-12T10:00:00Z",
  "updatedAt": "2026-02-12T14:30:00Z"
}
```

Note that `updatedAt` should reflect the time of the update, while `createdAt` remains unchanged.

</details>

---

## Development Log

| Date | Entry |
|---|---|
| --- | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) -- Section 2 (thin controllers, constructor injection, Spring Boot conventions)
- [DESIGN.md](../../../../docs/DESIGN.md) -- Section 6 (error contract for 404, 409 responses, API versioning)
- [PRD.md](../../../../docs/PRD.md) -- Stage 1 functional requirements (update employee via PATCH), API design (proper HTTP status codes)
