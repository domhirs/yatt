import { Story } from '../../models/step.model';

export const S1_012: Story = {
  id: 'S1-012',
  title: 'S1-012 — Error Handling',
  tasks: [
    {
      id: 'T-012-01',
      title: 'Global Exception Handler',
      description:
        'A "Global Exception Handler" is a single place in your application that catches any exception thrown from any controller ' +
        'and converts it into a proper HTTP error response.\n\n' +
        'Without it, every controller method would need its own try-catch block, and if you forgot one, Spring would return a generic ' +
        '500 error with a Java stack trace — terrible for API clients. With a global handler, you define the conversion rules once ' +
        'and they apply everywhere automatically.\n\n' +
        'In Spring, this is done with @ControllerAdvice — a special annotation that marks a class as "advice for all controllers." ' +
        'Inside it, @ExceptionHandler methods each handle a specific exception type. When EmployeeNotFoundException is thrown anywhere, ' +
        'Spring finds your @ExceptionHandler(EmployeeNotFoundException.class) method and calls it to produce the response.\n\n' +
        'The catch-all @ExceptionHandler(Exception.class) at the bottom is the safety net. It catches anything not handled by a more ' +
        'specific handler and always returns a safe 500 message — it never leaks the actual exception message or stack trace to the ' +
        'client, which could expose internal implementation details.',
      concepts: [
        {
          term: '@ControllerAdvice',
          explanation:
            'A Spring annotation that marks a class as a cross-cutting concern for all controllers. ' +
            'Any @ExceptionHandler, @ModelAttribute, or @InitBinder methods inside it apply globally. ' +
            'Think of it as a "plugin" that wraps all your controllers without modifying them.',
        },
        {
          term: '@ExceptionHandler',
          explanation:
            'An annotation placed on a method inside @ControllerAdvice that tells Spring: ' +
            '"call this method when this type of exception is thrown during request handling." ' +
            'Spring matches the most specific handler first — so EmployeeNotFoundException.class is matched before Exception.class. ' +
            'The method receives the exception and the HttpServletRequest, and returns a ResponseEntity with the error body.',
        },
        {
          term: 'MethodArgumentNotValidException',
          explanation:
            'The exception Spring throws when @Valid validation fails on a request body. ' +
            'It contains a BindingResult with a list of FieldErrors — one per field that failed validation. ' +
            'We extract these and return them as a structured list of { field, message } details in the 422 response.',
        },
        {
          term: 'ObjectOptimisticLockingFailureException',
          explanation:
            'The exception Hibernate throws when two concurrent requests try to update the same entity, ' +
            'and the second one finds that the @Version number has changed since it loaded the entity. ' +
            'This means "someone else already modified this record." We return 409 Conflict so the client can reload and retry.',
        },
        {
          term: 'Logger (SLF4J)',
          explanation:
            'A logging facade that lets you write log messages at different severity levels: DEBUG, INFO, WARN, ERROR. ' +
            'LoggerFactory.getLogger(GlobalExceptionHandler.class) creates a logger tied to this class. ' +
            'We log 4xx errors at WARN (expected, client mistakes) and 5xx at ERROR (unexpected, needs investigation). ' +
            'Logs are for operators; error responses are for API clients.',
        },
        {
          term: 'HttpServletRequest',
          explanation:
            'The object representing the incoming HTTP request. We inject it into exception handlers to get ' +
            'request.getRequestURI() — the URL path that caused the error (e.g., /api/v1/employees/abc). ' +
            'Including the path in the error response helps API clients and developers quickly understand which request failed.',
        },
      ],
      checklist: [
        'Create GlobalExceptionHandler.java in com.timetracker.employee package (or a .web sub-package)',
        'Annotate the class with @ControllerAdvice',
        'Add: private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class)',
        'Add handler for MethodArgumentNotValidException — extract FieldErrors, log at WARN, return 422 with ValidationErrorDetail list',
        'Add handler for EmployeeNotFoundException — log at WARN, return 404 Not Found',
        'Add handler for DuplicateEmailException — log at WARN, return 409 Conflict',
        'Add handler for ManagerNotFoundException — log at WARN, return 422 Unprocessable Entity',
        'Add handler for ActiveReportsException — log at WARN, return 409 Conflict',
        'Add handler for MethodArgumentTypeMismatchException — log at WARN, return 400 Bad Request',
        'Add handler for ObjectOptimisticLockingFailureException — log at WARN, return 409 Conflict',
        'Add catch-all handler for Exception — log at ERROR, return 500 with safe generic message (never expose ex.getMessage())',
        'Commit: feat(S1-012): add global exception handler',
      ],
      examples: [
        {
          lang: 'java',
          label: 'GlobalExceptionHandler.java — complete implementation',
          code: `package com.timetracker.employee;

import com.timetracker.employee.dto.ErrorResponse;
import com.timetracker.employee.dto.ValidationErrorDetail;
import com.timetracker.employee.exception.*;
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

// @ControllerAdvice makes this class a global handler for all controllers.
// Spring scans for it at startup and registers it automatically.
@ControllerAdvice
public class GlobalExceptionHandler {

    // Logger tied to this class — used to record what went wrong and where.
    // SLF4J is a logging facade; Spring Boot uses Logback as the implementation by default.
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // --- 422 Unprocessable Entity ---
    // Fired when @Valid fails on a @RequestBody — e.g., blank firstName, invalid email format.
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {  // HttpServletRequest gives us the URL path

        // ex.getBindingResult().getFieldErrors() returns a list of per-field failures.
        // We convert each FieldError into a ValidationErrorDetail { field, message }.
        List<ValidationErrorDetail> details = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(fe -> new ValidationErrorDetail(
                        fe.getField(),            // e.g., "email"
                        fe.getDefaultMessage()))   // e.g., "must be a well-formed email address"
                .toList();

        log.warn("Validation failed on {}: {}", request.getRequestURI(), details);

        return ResponseEntity
                .unprocessableEntity()  // shorthand for status(422)
                .body(ErrorResponse.ofValidation("Validation failed", details, request.getRequestURI()));
    }

    // --- 404 Not Found ---
    // Thrown by EmployeeService when an employee ID does not exist in the database.
    @ExceptionHandler(EmployeeNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
            EmployeeNotFoundException ex, HttpServletRequest request) {

        log.warn("Not found: {}", ex.getMessage());  // e.g., "Employee with id 'abc' not found"
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)  // 404
                .body(ErrorResponse.of(404, "Not Found", ex.getMessage(), request.getRequestURI()));
    }

    // --- 409 Conflict: duplicate email ---
    // Thrown by EmployeeService when creating/updating would result in two employees sharing an email.
    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateEmail(
            DuplicateEmailException ex, HttpServletRequest request) {

        log.warn("Conflict — duplicate email: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.CONFLICT)  // 409
                .body(ErrorResponse.of(409, "Conflict", ex.getMessage(), request.getRequestURI()));
    }

    // --- 422 Unprocessable Entity: invalid manager ---
    // Thrown by EmployeeService when the provided managerId does not match an active employee.
    @ExceptionHandler(ManagerNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleManagerNotFound(
            ManagerNotFoundException ex, HttpServletRequest request) {

        log.warn("Invalid manager: {}", ex.getMessage());
        return ResponseEntity
                .unprocessableEntity()  // 422 — the request was valid JSON but the referenced resource is invalid
                .body(ErrorResponse.of(422, "Unprocessable Entity", ex.getMessage(), request.getRequestURI()));
    }

    // --- 409 Conflict: cannot delete manager with active reports ---
    // Thrown by EmployeeService when attempting to deactivate/delete a manager who still has reports.
    @ExceptionHandler(ActiveReportsException.class)
    public ResponseEntity<ErrorResponse> handleActiveReports(
            ActiveReportsException ex, HttpServletRequest request) {

        log.warn("Conflict — active reports: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.CONFLICT)  // 409
                .body(ErrorResponse.of(409, "Conflict", ex.getMessage(), request.getRequestURI()));
    }

    // --- 400 Bad Request: invalid path variable type ---
    // Thrown by Spring when a path variable cannot be converted to the target type.
    // Example: GET /employees/not-a-uuid — "not-a-uuid" cannot be parsed as UUID.
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex, HttpServletRequest request) {

        String message = "Invalid value '%s' for parameter '%s'"
                .formatted(ex.getValue(), ex.getName());
        log.warn("Type mismatch on {}: {}", request.getRequestURI(), message);
        return ResponseEntity
                .badRequest()  // 400
                .body(ErrorResponse.of(400, "Bad Request", message, request.getRequestURI()));
    }

    // --- 409 Conflict: optimistic locking failure ---
    // Thrown by Hibernate when two concurrent updates collide on @Version.
    // The client's version number is stale — someone else saved first.
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ErrorResponse> handleOptimisticLock(
            ObjectOptimisticLockingFailureException ex, HttpServletRequest request) {

        log.warn("Optimistic lock conflict on {}", request.getRequestURI());
        return ResponseEntity
                .status(HttpStatus.CONFLICT)  // 409
                .body(ErrorResponse.of(409, "Conflict",
                        "This record was modified by another request. Please reload and try again.",
                        request.getRequestURI()));
    }

    // --- 500 Internal Server Error: catch-all ---
    // This method MUST be last. Spring matches the most specific handler first,
    // so more specific handlers above take priority. This only fires if nothing else matches.
    // IMPORTANT: We log the full exception (with stack trace) for operators,
    // but we NEVER include ex.getMessage() in the response — it could leak implementation details.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(
            Exception ex, HttpServletRequest request) {

        // Log at ERROR level — this is unexpected and needs investigation.
        // The third argument (ex) causes the full stack trace to be logged.
        log.error("Unexpected error on {}", request.getRequestURI(), ex);

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)  // 500
                .body(ErrorResponse.of(500, "Internal Server Error",
                        "An unexpected error occurred",  // safe generic message — no internal details
                        request.getRequestURI()));
    }
}`,
        },
      ],
      links: [
        {
          label: 'Spring MVC — @ControllerAdvice',
          url: 'https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-advice.html',
        },
        {
          label: 'RFC 7807 — Problem Details for HTTP APIs',
          url: 'https://datatracker.ietf.org/doc/html/rfc7807',
        },
        {
          label: 'SLF4J — Simple Logging Facade for Java',
          url: 'https://www.slf4j.org/manual.html',
        },
      ],
    },
    {
      id: 'T-012-02',
      title: 'Custom Exception Classes',
      description:
        'What are custom exceptions? Java lets you define your own exception types that extend RuntimeException. ' +
        'Instead of throwing a generic RuntimeException("Employee not found"), you throw a typed EmployeeNotFoundException — ' +
        'which the global handler can catch specifically and map to the right HTTP status code.\n\n' +
        'Why extend RuntimeException rather than Exception? RuntimeException is "unchecked" — you do not have to declare it in method signatures ' +
        'with throws, and callers do not have to catch it. This is the standard for application-level exceptions in Spring. ' +
        'Checked exceptions (extending Exception directly) would force every service method signature to declare them, ' +
        'which is verbose and adds no value when you have a global handler.\n\n' +
        'Each exception\'s constructor formats a clear, human-readable message using String.formatted(). ' +
        'This message is what gets included in the HTTP error response body, so it should tell the API caller exactly what went wrong. ' +
        '"Employee with id \'abc-123\' not found" is far more useful than "Not found."\n\n' +
        'All four exceptions live in the com.timetracker.employee.exception package — a dedicated sub-package keeps them organized ' +
        'and easy to find. The GlobalExceptionHandler imports from this package.',
      concepts: [
        {
          term: 'RuntimeException (Unchecked Exception)',
          explanation:
            'A type of exception that does not need to be declared in method signatures or caught explicitly. ' +
            'When you throw a RuntimeException subclass, it bubbles up the call stack until something catches it — ' +
            'in our case, the GlobalExceptionHandler. This is the preferred pattern for domain errors in Spring applications.',
        },
        {
          term: 'super() in Exception Constructor',
          explanation:
            'Calling super(message) in the exception\'s constructor passes the message up to RuntimeException, ' +
            'which stores it. Later, ex.getMessage() retrieves it. This is how Java\'s exception message system works — ' +
            'the message is set once at creation time via the parent class constructor.',
        },
        {
          term: 'String.formatted()',
          explanation:
            'A modern Java method (Java 15+) that replaces String.format(). ' +
            '"Employee with id \'%s\' not found".formatted(id) inserts the id value where %s appears. ' +
            'It reads left-to-right and is equivalent to String.format("...", id). ' +
            'The resulting message is clear, specific, and includes the actual ID that was not found.',
        },
        {
          term: 'Exception Package Organization',
          explanation:
            'Placing all custom exceptions in a dedicated com.timetracker.employee.exception package is a common convention. ' +
            'It separates domain exceptions from business logic classes, makes them easy to find, ' +
            'and makes the import in GlobalExceptionHandler explicit about where exceptions come from.',
        },
      ],
      checklist: [
        'Create the package: com.timetracker.employee.exception (create the directory src/main/java/com/timetracker/employee/exception/)',
        'Create EmployeeNotFoundException.java extending RuntimeException with constructor taking UUID id',
        'Message format: "Employee with id \'%s\' not found".formatted(id)',
        'Create DuplicateEmailException.java extending RuntimeException with constructor taking String email',
        'Message format: "Employee with email \'%s\' already exists".formatted(email)',
        'Create ManagerNotFoundException.java extending RuntimeException with constructor taking UUID id',
        'Message format: "Manager \'%s\' not found or is not active".formatted(id)',
        'Create ActiveReportsException.java extending RuntimeException with constructor taking UUID managerId and long count',
        'Message format: "Employee %s has %d active direct report(s). Reassign them first.".formatted(managerId, count)',
        'If EmployeeNotFoundException was previously in the main package, move it here and update all imports in service and handler classes',
        'Commit: refactor(S1-012): extract custom exceptions to exception package',
      ],
      examples: [
        {
          lang: 'java',
          label: 'All four custom exception classes',
          code: `// File: com/timetracker/employee/exception/EmployeeNotFoundException.java
package com.timetracker.employee.exception;

import java.util.UUID;

// Thrown when a requested employee ID does not exist in the database.
// Maps to HTTP 404 Not Found in GlobalExceptionHandler.
public class EmployeeNotFoundException extends RuntimeException {

    // The constructor takes the UUID so it can format a clear message.
    // Calling super(message) stores the message in RuntimeException.
    // Later, ex.getMessage() returns "Employee with id 'abc-123' not found".
    public EmployeeNotFoundException(UUID id) {
        super("Employee with id '%s' not found".formatted(id));
    }
}

// ---

// File: com/timetracker/employee/exception/DuplicateEmailException.java
package com.timetracker.employee.exception;

// Thrown when creating or updating an employee would result in a duplicate email address.
// Maps to HTTP 409 Conflict in GlobalExceptionHandler.
public class DuplicateEmailException extends RuntimeException {

    public DuplicateEmailException(String email) {
        super("Employee with email '%s' already exists".formatted(email));
    }
}

// ---

// File: com/timetracker/employee/exception/ManagerNotFoundException.java
package com.timetracker.employee.exception;

import java.util.UUID;

// Thrown when a provided managerId does not point to an ACTIVE employee.
// A manager must exist AND be active — an inactive employee cannot be a manager.
// Maps to HTTP 422 Unprocessable Entity in GlobalExceptionHandler.
public class ManagerNotFoundException extends RuntimeException {

    public ManagerNotFoundException(UUID id) {
        super("Manager '%s' not found or is not active".formatted(id));
    }
}

// ---

// File: com/timetracker/employee/exception/ActiveReportsException.java
package com.timetracker.employee.exception;

import java.util.UUID;

// Thrown when attempting to deactivate (soft-delete) an employee who
// still has active direct reports. The caller must reassign those reports first.
// Maps to HTTP 409 Conflict in GlobalExceptionHandler.
public class ActiveReportsException extends RuntimeException {

    // count lets the message tell the user exactly how many reports need reassignment.
    public ActiveReportsException(UUID managerId, long count) {
        super("Employee %s has %d active direct report(s). Reassign them first."
                .formatted(managerId, count));
    }
}`,
        },
        {
          lang: 'java',
          label: 'How these exceptions are thrown in EmployeeService',
          code: `// In EmployeeService.java — examples of where each exception is thrown:

// EmployeeNotFoundException — thrown in get(), update(), delete(), getReportingChain()
Employee employee = repository.findById(id)
        .orElseThrow(() -> new EmployeeNotFoundException(id));

// DuplicateEmailException — thrown in create() and update()
if (repository.existsByEmail(request.email())) {
    throw new DuplicateEmailException(request.email());
}

// ManagerNotFoundException — thrown in create() and update() when managerId is provided
if (request.managerId() != null) {
    Employee manager = repository.findById(request.managerId())
            .filter(m -> m.getStatus() == EmployeeStatus.ACTIVE)
            .orElseThrow(() -> new ManagerNotFoundException(request.managerId()));
    employee.setManager(manager);
}

// ActiveReportsException — thrown in delete() before deactivating a manager
long activeReports = repository.countByManagerIdAndStatus(id, EmployeeStatus.ACTIVE);
if (activeReports > 0) {
    throw new ActiveReportsException(id, activeReports);
}`,
        },
      ],
      links: [
        {
          label: 'Java — Creating Custom Exceptions',
          url: 'https://docs.oracle.com/javase/tutorial/essential/exceptions/creating.html',
        },
        {
          label: 'Checked vs Unchecked Exceptions — explanation',
          url: 'https://docs.oracle.com/javase/tutorial/essential/exceptions/runtime.html',
        },
      ],
    },
    {
      id: 'T-012-03',
      title: 'Error Response DTO',
      description:
        'What is the ErrorResponse? Every API error should return a consistent JSON body so that clients know exactly what to expect. ' +
        'Instead of every exception handler building its own ad-hoc response, we define a single ErrorResponse record that all ' +
        'handlers use. This consistency is important — it means the frontend (or any API consumer) only needs to understand one error format.\n\n' +
        'The ErrorResponse is a Java record — an immutable data class where fields are declared in the header and Java generates ' +
        'the constructor, getters, equals, hashCode, and toString automatically. Records are perfect for DTOs because DTOs ' +
        'are pure data containers with no behavior.\n\n' +
        'We add two static factory methods to make construction cleaner. ErrorResponse.of() creates a standard error response ' +
        'with no validation details. ErrorResponse.ofValidation() creates a 422 response pre-filled with the field-level errors list. ' +
        'Factory methods hide construction details and make the handler code read naturally.\n\n' +
        'The ValidationErrorDetail record is a small companion — it holds one field-level validation failure: ' +
        'which field failed (e.g., "email") and what the message is (e.g., "must be a well-formed email address"). ' +
        'The details list in ErrorResponse contains one of these per invalid field.',
      concepts: [
        {
          term: 'Java Record',
          explanation:
            'A concise class declaration for immutable data holders. ' +
            'public record ErrorResponse(int status, String message, ...) declares the fields and generates ' +
            'a constructor, accessor methods (status(), message()), equals(), hashCode(), and toString() automatically. ' +
            'You cannot change a record\'s fields after construction — it is immutable by design.',
        },
        {
          term: 'Static Factory Method',
          explanation:
            'A public static method on a class that creates and returns an instance of that class. ' +
            'ErrorResponse.of(404, "Not Found", ...) reads more clearly than new ErrorResponse(404, "Not Found", List.of(), Instant.now(), ...). ' +
            'Factory methods also centralize default values (like Instant.now() for the timestamp) so you cannot forget them.',
        },
        {
          term: 'Instant.now()',
          explanation:
            'Gets the current timestamp as an Instant — a point in time on the UTC timeline. ' +
            'Including the timestamp in the error response lets developers correlate an error response ' +
            'from a client with the corresponding log line on the server. ' +
            'Jackson (Spring\'s JSON library) serializes Instant as an ISO-8601 string: "2024-01-15T10:30:00Z".',
        },
        {
          term: 'List.of()',
          explanation:
            'Creates an immutable, empty list. We use it as the default for the details field ' +
            'in non-validation errors — the field is present in the JSON but empty, keeping the structure consistent. ' +
            'All error responses have the same shape; validation errors just have a non-empty details array.',
        },
      ],
      checklist: [
        'Open (or create) the com.timetracker.employee.dto package',
        'Create ValidationErrorDetail.java as a record: public record ValidationErrorDetail(String field, String message) {}',
        'Create ErrorResponse.java as a record with fields: int status, String error, String message, List<ValidationErrorDetail> details, Instant timestamp, String path',
        'Add static factory method: public static ErrorResponse of(int status, String error, String message, String path) — uses Instant.now() and List.of() for defaults',
        'Add static factory method: public static ErrorResponse ofValidation(String message, List<ValidationErrorDetail> details, String path) — hardcodes status=422, error="Unprocessable Entity"',
        'Add necessary imports: java.time.Instant, java.util.List',
        'Verify GlobalExceptionHandler compiles and all handlers use ErrorResponse correctly',
        'Manually test: POST /api/v1/employees with invalid data → response body should have status, error, message, details, timestamp, path fields',
        'Commit: feat(S1-012): add ErrorResponse and ValidationErrorDetail records',
      ],
      examples: [
        {
          lang: 'java',
          label: 'ErrorResponse.java and ValidationErrorDetail.java',
          code: `package com.timetracker.employee.dto;

import java.time.Instant;
import java.util.List;

// A single field-level validation error.
// Example: { "field": "email", "message": "must be a well-formed email address" }
// This is a record — Java auto-generates constructor, accessors (field(), message()), equals, hashCode.
public record ValidationErrorDetail(String field, String message) {}


// ---

package com.timetracker.employee.dto;

import java.time.Instant;
import java.util.List;

// The standard error response body for ALL error cases in the API.
// Example JSON:
// {
//   "status": 404,
//   "error": "Not Found",
//   "message": "Employee with id 'abc' not found",
//   "details": [],
//   "timestamp": "2024-01-15T10:30:00Z",
//   "path": "/api/v1/employees/abc"
// }
public record ErrorResponse(
        int status,                         // HTTP status code, e.g. 404, 422, 409
        String error,                       // HTTP status phrase, e.g. "Not Found"
        String message,                     // human-readable explanation of what went wrong
        List<ValidationErrorDetail> details, // non-empty only for 422 validation errors
        Instant timestamp,                  // when the error occurred (UTC)
        String path                         // which URL was requested when the error happened
) {

    // Factory method for standard (non-validation) errors.
    // Callers don't need to worry about timestamp or empty details list.
    // Usage: ErrorResponse.of(404, "Not Found", "Employee ... not found", "/api/v1/employees/abc")
    public static ErrorResponse of(int status, String error, String message, String path) {
        return new ErrorResponse(
                status,
                error,
                message,
                List.of(),      // no field-level details for non-validation errors
                Instant.now(),  // captures the current time automatically
                path
        );
    }

    // Factory method for 422 Validation errors — always status=422, always has details list.
    // Usage: ErrorResponse.ofValidation("Validation failed", List.of(new ValidationErrorDetail("email", "...")), "/api/v1/employees")
    public static ErrorResponse ofValidation(String message,
                                             List<ValidationErrorDetail> details,
                                             String path) {
        return new ErrorResponse(
                422,
                "Unprocessable Entity",  // standard HTTP phrase for 422
                message,
                details,        // the per-field failure list from BindingResult
                Instant.now(),
                path
        );
    }
}`,
        },
        {
          lang: 'bash',
          label: 'Example error responses — what the client receives',
          code: `// 404 Not Found — GET /api/v1/employees/unknown-id
{
  "status": 404,
  "error": "Not Found",
  "message": "Employee with id 'abc-123' not found",
  "details": [],
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/v1/employees/abc-123"
}

// 422 Unprocessable Entity — POST /api/v1/employees with invalid body
{
  "status": 422,
  "error": "Unprocessable Entity",
  "message": "Validation failed",
  "details": [
    { "field": "email", "message": "must be a well-formed email address" },
    { "field": "firstName", "message": "must not be blank" }
  ],
  "timestamp": "2024-01-15T10:31:00Z",
  "path": "/api/v1/employees"
}

// 409 Conflict — POST with duplicate email
{
  "status": 409,
  "error": "Conflict",
  "message": "Employee with email 'alice@example.com' already exists",
  "details": [],
  "timestamp": "2024-01-15T10:32:00Z",
  "path": "/api/v1/employees"
}

// 500 Internal Server Error — something unexpected went wrong
{
  "status": 500,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "details": [],
  "timestamp": "2024-01-15T10:33:00Z",
  "path": "/api/v1/employees"
}`,
        },
      ],
      links: [
        {
          label: 'Java Records (JEP 395)',
          url: 'https://openjdk.org/jeps/395',
        },
        {
          label: 'RFC 7807 — Problem Details for HTTP APIs',
          url: 'https://datatracker.ietf.org/doc/html/rfc7807',
        },
        {
          label: 'Spring Boot — Error Handling',
          url: 'https://docs.spring.io/spring-boot/reference/web/servlet.html#web.servlet.spring-mvc.error-handling',
        },
      ],
    },
  ],
};
