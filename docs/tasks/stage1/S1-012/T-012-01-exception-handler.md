# T-012-01: Global Exception Handler

| Field | Value |
|---|---|
| **Task ID** | T-012-01 |
| **Story** | [S1-012: Error Handling](../../../stories/stage1/S1-012-error-handling.md) |
| **Status** | Pending |

---

## Objective

Create a `@ControllerAdvice` that intercepts all exceptions and returns consistent, structured error responses matching the project's error contract.

---

## Checklist

- [ ] Create `GlobalExceptionHandler` with `@ControllerAdvice`
- [ ] Handle `MethodArgumentNotValidException` → 422 with field-level details
- [ ] Handle `EmployeeNotFoundException` → 404
- [ ] Handle `DuplicateEmailException` → 409
- [ ] Handle `ManagerNotFoundException` → 422
- [ ] Handle `ActiveReportsException` → 409
- [ ] Handle `MethodArgumentTypeMismatchException` → 400 (invalid UUID)
- [ ] Handle `OptimisticLockingFailureException` → 409
- [ ] Handle `IllegalArgumentException` → 400
- [ ] Handle generic `Exception` → 500 with safe message (no stack trace)
- [ ] Include `timestamp` and `path` in all error responses
- [ ] Log 4xx at WARN level, 5xx at ERROR level
- [ ] Commit: `feat(S1-012): add global exception handler`

---

## Details

### Full handler class

<details>
<summary>Expand for guidance</summary>

```java
package com.timetracker.employee.exception;

import com.timetracker.employee.dto.ErrorResponse;
import com.timetracker.employee.dto.ValidationErrorDetail;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.List;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        List<ValidationErrorDetail> details = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(fe -> new ValidationErrorDetail(fe.getField(), fe.getDefaultMessage()))
            .toList();

        log.warn("Validation failed on {}: {}", request.getRequestURI(), details);
        return ResponseEntity.unprocessableEntity()
            .body(ErrorResponse.ofValidation("Validation failed", details, request.getRequestURI()));
    }

    @ExceptionHandler(EmployeeNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
            EmployeeNotFoundException ex, HttpServletRequest request) {
        log.warn("Employee not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ErrorResponse.of(404, "Not Found", ex.getMessage(), request.getRequestURI()));
    }

    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateEmail(
            DuplicateEmailException ex, HttpServletRequest request) {
        log.warn("Duplicate email: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(ErrorResponse.of(409, "Conflict", ex.getMessage(), request.getRequestURI()));
    }

    @ExceptionHandler(ManagerNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleManagerNotFound(
            ManagerNotFoundException ex, HttpServletRequest request) {
        log.warn("Manager not found: {}", ex.getMessage());
        return ResponseEntity.unprocessableEntity()
            .body(ErrorResponse.of(422, "Unprocessable Entity", ex.getMessage(), request.getRequestURI()));
    }

    @ExceptionHandler(ActiveReportsException.class)
    public ResponseEntity<ErrorResponse> handleActiveReports(
            ActiveReportsException ex, HttpServletRequest request) {
        log.warn("Active reports guard: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(ErrorResponse.of(409, "Conflict", ex.getMessage(), request.getRequestURI()));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        log.warn("Type mismatch on {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity.badRequest()
            .body(ErrorResponse.of(400, "Bad Request", "Invalid parameter format", request.getRequestURI()));
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ErrorResponse> handleOptimisticLock(
            ObjectOptimisticLockingFailureException ex, HttpServletRequest request) {
        log.warn("Optimistic locking failure: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(ErrorResponse.of(409, "Conflict",
                "Resource was modified by another request. Refresh and try again.",
                request.getRequestURI()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(
            IllegalArgumentException ex, HttpServletRequest request) {
        log.warn("Bad request: {}", ex.getMessage());
        return ResponseEntity.badRequest()
            .body(ErrorResponse.of(400, "Bad Request", ex.getMessage(), request.getRequestURI()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(
            Exception ex, HttpServletRequest request) {
        log.error("Unexpected error on {}", request.getRequestURI(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ErrorResponse.of(500, "Internal Server Error",
                "An unexpected error occurred", request.getRequestURI()));
    }
}
```

**Key design decisions:**
- **4xx logged at WARN, 5xx at ERROR**: Client errors are expected in normal operation; server errors indicate bugs.
- **Generic handler last**: Catches anything not handled by specific handlers. Returns a safe message — never exposes stack traces or implementation details.
- **`HttpServletRequest` for path**: Gets the actual request URI for the error response.

</details>

---

## Development Log

| Date | Entry |
|---|---|
| — | *No entries yet* |

---

## References

- [DESIGN.md](../../../../docs/DESIGN.md) — Section 6: Error contract
- [GUIDELINES.md](../../../../docs/GUIDELINES.md) — Section 2: Spring Boot conventions
