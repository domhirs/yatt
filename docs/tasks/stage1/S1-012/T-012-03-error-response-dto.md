# T-012-03: Error Response DTO

| Field | Value |
|---|---|
| **Task ID** | T-012-03 |
| **Story** | [S1-012: Error Handling](../../../stories/stage1/S1-012-error-handling.md) |
| **Status** | Pending |

---

## Objective

Create the `ErrorResponse` and `ValidationErrorDetail` records matching the standard error contract defined in DESIGN.md.

---

## Checklist

- [ ] Create `ErrorResponse` record with all contract fields
- [ ] Create `ValidationErrorDetail` record (field + message)
- [ ] Add static factory method `ErrorResponse.of(...)` for simple errors
- [ ] Add static factory method `ErrorResponse.ofValidation(...)` for validation errors
- [ ] `details` field is nullable (null for non-validation errors)
- [ ] Verify JSON serialization matches the contract format
- [ ] Commit: `feat(S1-012): add ErrorResponse and ValidationErrorDetail DTOs`

---

## Details

### ErrorResponse record

<details>
<summary>Expand for guidance</summary>

```java
package com.timetracker.employee.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
    int status,
    String error,
    String message,
    List<ValidationErrorDetail> details,
    Instant timestamp,
    String path
) {
    public static ErrorResponse of(int status, String error, String message, String path) {
        return new ErrorResponse(status, error, message, null, Instant.now(), path);
    }

    public static ErrorResponse ofValidation(
            String message, List<ValidationErrorDetail> details, String path) {
        return new ErrorResponse(422, "Unprocessable Entity", message, details, Instant.now(), path);
    }
}
```

</details>

### ValidationErrorDetail record

<details>
<summary>Expand for guidance</summary>

```java
package com.timetracker.employee.dto;

public record ValidationErrorDetail(
    String field,
    String message
) {}
```

</details>

### Expected JSON output

<details>
<summary>Expand for guidance</summary>

Simple error (404):
```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Employee not found: 550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-02-12T10:00:00Z",
  "path": "/api/v1/employees/550e8400-e29b-41d4-a716-446655440000"
}
```

Validation error (422):
```json
{
  "status": 422,
  "error": "Unprocessable Entity",
  "message": "Validation failed",
  "details": [
    { "field": "email", "message": "must be a valid email address" },
    { "field": "firstName", "message": "must not be blank" }
  ],
  "timestamp": "2026-02-12T10:00:00Z",
  "path": "/api/v1/employees"
}
```

Note: `@JsonInclude(NON_NULL)` omits `details` when it's null, keeping non-validation error responses clean.

</details>

---

## Development Log

| Date | Entry |
|---|---|
| — | *No entries yet* |

---

## References

- [DESIGN.md](../../../../docs/DESIGN.md) — Section 6: Error contract
- [GUIDELINES.md](../../../../docs/GUIDELINES.md) — Section 1: Records for DTOs
