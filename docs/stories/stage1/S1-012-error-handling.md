# S1-012: Error Handling

| Field | Value |
|---|---|
| **Story ID** | S1-012 |
| **Title** | Error Handling |
| **Stage** | 1 — Employee REST API |
| **Status** | Backlog |
| **Dependencies** | S1-004 |

---

## User Story

As an API consumer, I want all errors returned in a consistent format, so that I can handle them programmatically.

---

## Acceptance Criteria

- [ ] AC1: All errors follow the standard error contract defined in DESIGN.md (`status`, `error`, `message`, `details`, `timestamp`, `path`).
- [ ] AC2: A `@ControllerAdvice` class handles all exceptions globally — no exception handling logic in individual controllers.
- [ ] AC3: Validation errors (422 Unprocessable Entity) include field-level details with the field name and violation message.
- [ ] AC4: Not found errors (404) return a clear message identifying the missing resource.
- [ ] AC5: Conflict errors (409) return a message explaining the conflict (duplicate email, version mismatch, active dependents).
- [ ] AC6: Bad request errors (400) return a message describing the invalid input.
- [ ] AC7: Unexpected errors return 500 Internal Server Error with a safe, generic message — no stack traces or internal details are leaked to the client.
- [ ] AC8: All error responses include `timestamp` (ISO 8601) and `path` (the request URI).

---

## Tasks

| Task | Title | Status |
|---|---|---|
| [T-012-01](../../tasks/stage1/S1-012/T-012-01-exception-handler.md) | Global exception handler | Pending |
| [T-012-02](../../tasks/stage1/S1-012/T-012-02-custom-exceptions.md) | Custom exception classes | Pending |
| [T-012-03](../../tasks/stage1/S1-012/T-012-03-error-response-dto.md) | Error response DTO | Pending |

---

## Technical Notes

- Create a `GlobalExceptionHandler` class annotated with `@ControllerAdvice` and `@RestController` (or use `@RestControllerAdvice`). This centralizes all exception-to-HTTP-response mapping.
- Define custom exception classes that extend `RuntimeException`:
  - `EmployeeNotFoundException` — maps to 404
  - `DuplicateEmailException` — maps to 409
  - `ManagerNotFoundException` — maps to 422
  - `ActiveReportsException` — maps to 409 (employee has active direct reports, cannot delete)
  - `StaleVersionException` — maps to 409 (optimistic locking conflict)
- Create an `ErrorResponse` record matching the DESIGN.md error contract:
  ```java
  public record ErrorResponse(
      int status,
      String error,
      String message,
      List<FieldError> details,
      Instant timestamp,
      String path
  ) {}
  ```
- Handle Spring's built-in exceptions: `MethodArgumentNotValidException` (bean validation failures), `HttpMessageNotReadableException` (malformed JSON), `MissingServletRequestParameterException`, etc.
- For 500 errors, log the full stack trace at `ERROR` level but return only a generic message like "An unexpected error occurred" to the client.
- Use `HttpServletRequest` or `WebRequest` to extract the request path for inclusion in the error response.

---

## References

- [PRD](../../PRD.md) — API design (proper HTTP status codes), non-functional requirements
- [DESIGN](../../DESIGN.md) — Section 6 (error contract JSON structure)
- [GUIDELINES](../../GUIDELINES.md) — Section 1 (records for DTOs, fail fast), Section 2 (structured logging)
