# T-005-03: Validation Logic

| Field | Value |
|---|---|
| **Task ID** | T-005-03 |
| **Story** | [S1-005: Create Employee](../../../stories/stage1/S1-005-create-employee.md) |
| **Status** | Pending |

---

## Objective

Ensure all input validation works correctly for employee creation, covering both Bean Validation (field-level) and business rule validation (service-level), with proper error responses matching the standard error contract.

---

## Checklist

- [ ] Verify `@NotBlank` on `firstName`, `lastName`, `department`, `role`
- [ ] Verify `@Email` on `email`
- [ ] Verify `@Size(max = 100)` on `firstName` and `lastName`
- [ ] Verify `@NotNull` and `@PastOrPresent` on `hireDate`
- [ ] Test missing required fields return 422 Unprocessable Entity
- [ ] Test invalid email format returns 422 Unprocessable Entity
- [ ] Test future hire date returns 422 Unprocessable Entity
- [ ] Test duplicate email returns 409 Conflict
- [ ] Test invalid `manager_id` returns 422 Unprocessable Entity
- [ ] Commit: `feat(S1-005): verify validation for create employee`

---

## Details

### Bean Validation annotations on CreateEmployeeRequest

<details>
<summary>Expand for guidance</summary>

The `CreateEmployeeRequest` record should have the following validation annotations. These are enforced automatically by Spring when `@Valid` is used on the controller parameter.

```java
package com.timetracker.employee.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateEmployeeRequest(
        @NotBlank(message = "First name is required")
        @Size(max = 100, message = "First name must not exceed 100 characters")
        String firstName,

        @NotBlank(message = "Last name is required")
        @Size(max = 100, message = "Last name must not exceed 100 characters")
        String lastName,

        @NotBlank(message = "Email is required")
        @Email(message = "Must be a valid email address")
        String email,

        @NotBlank(message = "Department is required")
        String department,

        @NotBlank(message = "Role is required")
        String role,

        @NotNull(message = "Hire date is required")
        @PastOrPresent(message = "Hire date must not be in the future")
        LocalDate hireDate,

        UUID managerId
) {}
```

**Key points:**

- `@NotBlank` checks for non-null, non-empty, and non-whitespace-only strings. It is more restrictive than `@NotNull` for string fields.
- `@Email` validates email format. It allows `null` by default, but `@NotBlank` already prevents null.
- `@PastOrPresent` ensures the hire date is today or in the past. It allows `null`, but `@NotNull` prevents that.
- `managerId` has no validation annotations because it is optional. Business validation (manager exists and is active) happens in the service layer.

</details>

### Two layers of validation

<details>
<summary>Expand for guidance</summary>

Validation is split across two layers, each with a clear responsibility:

| Layer | What it validates | HTTP status | Mechanism |
|---|---|---|---|
| **Controller** (Bean Validation) | Field presence, format, size | 422 Unprocessable Entity | `@Valid` + constraint annotations |
| **Service** (Business rules) | Email uniqueness, manager validity | 409 Conflict / 422 Unprocessable Entity | Explicit checks with repository queries |

**Why two layers?** Bean Validation handles *syntactic* correctness -- is the data well-formed? The service layer handles *semantic* correctness -- does the data make sense given the current state of the system? Mixing these concerns would violate the Single Responsibility Principle.

The `GlobalExceptionHandler` (from story S1-012) converts exceptions to the standard error response format. Here is how each exception maps:

| Exception | HTTP Status | When |
|---|---|---|
| `MethodArgumentNotValidException` | 422 | Bean Validation fails |
| `DuplicateEmailException` | 409 | Email already exists |
| `ManagerNotFoundException` | 422 | Manager ID not found or inactive |

</details>

### Test: missing required fields (422)

<details>
<summary>Expand for guidance</summary>

Send a request with missing fields:

```bash
curl -s -X POST http://localhost:8080/api/v1/employees \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
```

**Expected response** (422 Unprocessable Entity):

```json
{
  "status": 422,
  "error": "Unprocessable Entity",
  "message": "Validation failed",
  "details": [
    { "field": "firstName", "message": "First name is required" },
    { "field": "lastName", "message": "Last name is required" },
    { "field": "email", "message": "Email is required" },
    { "field": "department", "message": "Department is required" },
    { "field": "role", "message": "Role is required" },
    { "field": "hireDate", "message": "Hire date is required" }
  ],
  "timestamp": "2026-02-12T10:30:00Z",
  "path": "/api/v1/employees"
}
```

Note: the order of fields in `details` may vary. The important thing is that all violated constraints are reported at once -- Spring collects all violations, it does not fail on the first one.

</details>

### Test: invalid email format (422)

<details>
<summary>Expand for guidance</summary>

```bash
curl -s -X POST http://localhost:8080/api/v1/employees \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "not-an-email",
    "department": "Engineering",
    "role": "Software Engineer",
    "hireDate": "2025-01-15"
  }' | jq .
```

**Expected response** (422):

```json
{
  "status": 422,
  "error": "Unprocessable Entity",
  "message": "Validation failed",
  "details": [
    { "field": "email", "message": "Must be a valid email address" }
  ],
  "timestamp": "2026-02-12T10:30:00Z",
  "path": "/api/v1/employees"
}
```

</details>

### Test: future hire date (422)

<details>
<summary>Expand for guidance</summary>

```bash
curl -s -X POST http://localhost:8080/api/v1/employees \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane.doe@example.com",
    "department": "Engineering",
    "role": "Software Engineer",
    "hireDate": "2099-12-31"
  }' | jq .
```

**Expected response** (422):

```json
{
  "status": 422,
  "error": "Unprocessable Entity",
  "message": "Validation failed",
  "details": [
    { "field": "hireDate", "message": "Hire date must not be in the future" }
  ],
  "timestamp": "2026-02-12T10:30:00Z",
  "path": "/api/v1/employees"
}
```

</details>

### Test: duplicate email (409)

<details>
<summary>Expand for guidance</summary>

Create an employee first, then attempt to create another with the same email:

```bash
# First create succeeds
curl -s -X POST http://localhost:8080/api/v1/employees \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane.doe@example.com",
    "department": "Engineering",
    "role": "Software Engineer",
    "hireDate": "2025-01-15"
  }' | jq .

# Second create with same email fails
curl -s -X POST http://localhost:8080/api/v1/employees \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Smith",
    "email": "jane.doe@example.com",
    "department": "Marketing",
    "role": "Analyst",
    "hireDate": "2025-06-01"
  }' | jq .
```

**Expected response** (409 Conflict):

```json
{
  "status": 409,
  "error": "Conflict",
  "message": "Employee with email 'jane.doe@example.com' already exists",
  "details": [],
  "timestamp": "2026-02-12T10:30:00Z",
  "path": "/api/v1/employees"
}
```

Note: duplicate email is enforced across **all** employees, including inactive ones. This is a business decision -- email addresses should remain unique system-wide for audit and communication purposes.

</details>

### Test: invalid manager_id (422)

<details>
<summary>Expand for guidance</summary>

```bash
curl -s -X POST http://localhost:8080/api/v1/employees \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane.doe@example.com",
    "department": "Engineering",
    "role": "Software Engineer",
    "hireDate": "2025-01-15",
    "managerId": "00000000-0000-0000-0000-000000000000"
  }' | jq .
```

**Expected response** (422 Unprocessable Entity):

```json
{
  "status": 422,
  "error": "Unprocessable Entity",
  "message": "Manager with id '00000000-0000-0000-0000-000000000000' not found or is not active",
  "details": [],
  "timestamp": "2026-02-12T10:30:00Z",
  "path": "/api/v1/employees"
}
```

The 422 status is used (not 404) because the invalid manager ID is a validation problem with the submitted data, not a missing resource at the requested URL.

</details>

---

## Development Log

| Date | Entry |
|---|---|
| --- | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) -- Section 2 (Spring Boot validation with @Valid, thin controllers)
- [DESIGN.md](../../../../docs/DESIGN.md) -- Section 6 (error contract format with status, error, message, details, timestamp, path)
- [PRD.md](../../../../docs/PRD.md) -- Validation rules (email unique across all employees, manager must be active)
