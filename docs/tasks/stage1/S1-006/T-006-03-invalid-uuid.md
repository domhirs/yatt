# T-006-03: Invalid UUID Handling

| Field | Value |
|---|---|
| **Task ID** | T-006-03 |
| **Story** | [S1-006: Get Employee by ID](../../../stories/stage1/S1-006-get-employee.md) |
| **Status** | Pending |

---

## Objective

Handle invalid UUID path variables gracefully by returning a 400 Bad Request with the standard error response format, instead of letting Spring produce a default 500 Internal Server Error.

---

## Checklist

- [ ] Verify that non-UUID strings in path return 400 (not 500)
- [ ] Add handler for `MethodArgumentTypeMismatchException` in `GlobalExceptionHandler`
- [ ] Return standard error response with message "Invalid UUID format"
- [ ] Test with `/api/v1/employees/not-a-uuid`
- [ ] Test with `/api/v1/employees/123`
- [ ] Commit: `feat(S1-006): handle invalid UUID path variables with 400 Bad Request`

---

## Details

### Why this is needed

<details>
<summary>Expand for guidance</summary>

When a controller method declares `@PathVariable UUID id`, Spring MVC attempts to convert the path segment string into a `UUID` object. If the string is not a valid UUID, Spring throws a `MethodArgumentTypeMismatchException` wrapping a `NumberFormatException` (or `IllegalArgumentException`).

Without a custom handler, Spring's default error handling may produce:
- A **500 Internal Server Error** (if no other handler matches), or
- A **400 Bad Request** with a generic, framework-specific error format that does not match the project's standard error contract.

Either way, the response does not conform to the error contract defined in DESIGN.md Section 6. A custom handler ensures consistency.

</details>

### Add handler to GlobalExceptionHandler

<details>
<summary>Expand for guidance</summary>

Add this method to the `GlobalExceptionHandler` class (created in story S1-012). If that class does not exist yet, create a minimal version:

```java
package com.timetracker.employee;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex,
            HttpServletRequest request) {

        String message = "Invalid value '%s' for parameter '%s'. Expected type: %s"
                .formatted(ex.getValue(), ex.getName(), getExpectedTypeName(ex));

        ErrorResponse error = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                message,
                List.of(),
                Instant.now(),
                request.getRequestURI()
        );

        return ResponseEntity.badRequest().body(error);
    }

    private String getExpectedTypeName(MethodArgumentTypeMismatchException ex) {
        Class<?> requiredType = ex.getRequiredType();
        if (requiredType == null) {
            return "unknown";
        }
        return requiredType.getSimpleName();
    }
}
```

**Notes on the implementation:**

- The handler catches **all** type mismatch exceptions, not just UUID-specific ones. This is intentional -- any future `@PathVariable` or `@RequestParam` with a typed parameter (e.g., `Long`, `LocalDate`) benefits from the same handler.
- `ex.getValue()` contains the raw string the user sent, `ex.getName()` is the parameter name (e.g., `"id"`), and `ex.getRequiredType()` is the expected Java type (e.g., `UUID.class`).
- The error message is descriptive without leaking internal implementation details.
- `ErrorResponse` is the standard error response record matching the DESIGN.md contract.

</details>

### ErrorResponse record

<details>
<summary>Expand for guidance</summary>

If not already created, define the error response record:

```java
package com.timetracker.employee.dto;

import java.time.Instant;
import java.util.List;

public record ErrorResponse(
        int status,
        String error,
        String message,
        List<FieldError> details,
        Instant timestamp,
        String path
) {
    public record FieldError(String field, String message) {}
}
```

This matches the error contract from DESIGN.md Section 6.

</details>

### Test: /api/v1/employees/not-a-uuid

<details>
<summary>Expand for guidance</summary>

```bash
curl -s http://localhost:8080/api/v1/employees/not-a-uuid | jq .
```

**Expected response** (400 Bad Request):

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Invalid value 'not-a-uuid' for parameter 'id'. Expected type: UUID",
  "details": [],
  "timestamp": "2026-02-12T10:30:00Z",
  "path": "/api/v1/employees/not-a-uuid"
}
```

</details>

### Test: /api/v1/employees/123

<details>
<summary>Expand for guidance</summary>

```bash
curl -s http://localhost:8080/api/v1/employees/123 | jq .
```

**Expected response** (400 Bad Request):

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Invalid value '123' for parameter 'id'. Expected type: UUID",
  "details": [],
  "timestamp": "2026-02-12T10:30:00Z",
  "path": "/api/v1/employees/123"
}
```

Note that `123` is a valid number but not a valid UUID. The handler correctly rejects it because the `@PathVariable` type is `UUID`, not `String` or `Long`.

</details>

### Edge case: valid UUID format but non-existent

<details>
<summary>Expand for guidance</summary>

It is worth noting the distinction:

| Input | Result | Handler |
|---|---|---|
| `not-a-uuid` | 400 Bad Request | `MethodArgumentTypeMismatchException` handler |
| `123` | 400 Bad Request | `MethodArgumentTypeMismatchException` handler |
| `00000000-0000-0000-0000-000000000000` | 404 Not Found | `EmployeeNotFoundException` handler |
| `550e8400-e29b-41d4-a716-446655440000` (exists) | 200 OK | Normal flow |

A valid UUID that does not match any employee produces a **404**, not a 400. The 400 is strictly for malformed input.

</details>

---

## Development Log

| Date | Entry |
|---|---|
| --- | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) -- Section 1 (fail fast with clear error messages)
- [DESIGN.md](../../../../docs/DESIGN.md) -- Section 6 (error contract format)
- [PRD.md](../../../../docs/PRD.md) -- API design (proper HTTP status codes: 400 for bad requests)
