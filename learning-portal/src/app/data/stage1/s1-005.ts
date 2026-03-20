import { Story } from '../../models/step.model';

export const S1_005: Story = {
  id: 'S1-005',
  title: 'S1-005 — Create Employee',
  tasks: [
    {
      id: 'T-005-01',
      title: 'Service — Create Method',
      description:
        'The service layer is where business logic lives. "Business logic" means the rules that ' +
        'go beyond simple data storage — rules like "an employee\'s email must be unique" or ' +
        '"you can only assign an active employee as a manager." These rules are not enforced by ' +
        'the database schema, so they live here.\n\n' +
        'The create() method follows a three-step pattern that you will see repeated in every ' +
        'write operation: validate (check that business rules are satisfied), prepare (convert the ' +
        'DTO to an entity and set any derived values like the manager), and persist (save to the ' +
        'database and return the response). If any validation step fails, a custom exception is ' +
        'thrown immediately and the method returns nothing.\n\n' +
        'Custom exceptions extend RuntimeException and carry a descriptive message. They are ' +
        '"unchecked" exceptions — Java does not require you to declare them in the method signature ' +
        'with "throws". You define one exception class per distinct business rule violation: ' +
        'DuplicateEmailException for email conflicts, ManagerNotFoundException when the requested ' +
        'manager does not exist or is inactive. This makes the GlobalExceptionHandler (a later task) ' +
        'straightforward: catch DuplicateEmailException → return 409, catch ManagerNotFoundException ' +
        '→ return 404.\n\n' +
        'Dependency injection via constructor is the standard practice in Spring. The constructor ' +
        'receives the repository and mapper; Spring calls this constructor automatically when ' +
        'creating the service bean. Using final fields prevents accidental reassignment. With a ' +
        'single constructor, you do not need the @Autowired annotation — Spring infers it.',
      concepts: [
        {
          term: '@Service',
          explanation:
            'A Spring stereotype annotation that marks a class as a service bean. It is semantically ' +
            'equivalent to @Component but communicates intent: this class contains business logic. ' +
            'Spring creates one instance of this class at startup and injects it wherever it is ' +
            'needed (e.g., into EmployeeController via constructor injection).',
        },
        {
          term: 'Constructor injection',
          explanation:
            'Spring can inject dependencies in three ways: constructor, setter, or field (@Autowired). ' +
            'Constructor injection is the preferred approach because: dependencies are declared as ' +
            'final (immutable after construction), the class cannot be instantiated without its ' +
            'dependencies (fails fast if wiring is wrong), and it makes unit testing trivial — you ' +
            'just call new EmployeeService(mockRepository, mockMapper).',
        },
        {
          term: 'RuntimeException and unchecked exceptions',
          explanation:
            'Java has two categories of exceptions: checked (must be declared in the method signature ' +
            'or caught) and unchecked (extend RuntimeException, no declaration required). Spring\'s ' +
            'exception handling works with RuntimeException subclasses. DuplicateEmailException and ' +
            'ManagerNotFoundException both extend RuntimeException so they bubble up to the ' +
            'GlobalExceptionHandler without being declared with "throws".',
        },
        {
          term: 'Optional.filter().orElseThrow()',
          explanation:
            'repository.findById(managerId) returns Optional<Employee>. The .filter() method applies ' +
            'a condition: only keep the value if the employee is ACTIVE. If the condition fails, ' +
            'the Optional becomes empty. .orElseThrow() then throws the exception if the Optional ' +
            'is empty — either because the manager was not found OR because they are inactive. ' +
            'Both cases are treated the same: the manager is not available.',
        },
        {
          term: 'String.formatted()',
          explanation:
            'A Java 15+ method equivalent to String.format(). "Employee with email \'%s\' already exists" ' +
            '.formatted(email) substitutes the email value into the %s placeholder. This is used in ' +
            'exception messages so the error message tells you exactly what was wrong: ' +
            '"Employee with email \'alice@example.com\' already exists".',
        },
      ],
      checklist: [
        'Create src/main/java/com/timetracker/employee/DuplicateEmailException.java — extends RuntimeException, takes a String email in the constructor, passes a formatted message to super().',
        'Create src/main/java/com/timetracker/employee/ManagerNotFoundException.java — extends RuntimeException, takes a UUID id in the constructor.',
        'Create src/main/java/com/timetracker/employee/EmployeeService.java annotated with @Service.',
        'Add constructor injection for EmployeeRepository and EmployeeMapper using final fields. Do not add @Autowired — Spring detects the single constructor automatically.',
        'Implement the create(CreateEmployeeRequest request) method following the three steps in the example: (1) check email uniqueness, (2) validate manager if provided, (3) map, set manager, save, return.',
        'Import com.timetracker.employee.dto.CreateEmployeeRequest and com.timetracker.employee.dto.EmployeeResponse — IntelliJ or VS Code can add imports automatically.',
        'Start the app and test with curl: POST /api/v1/employees with valid JSON. Then POST again with the same email to verify DuplicateEmailException is thrown (you will see the stack trace in logs until you add the GlobalExceptionHandler).',
        'Commit: feat(S1-005): implement EmployeeService.create()',
      ],
      examples: [
        {
          lang: 'java',
          label: 'DuplicateEmailException.java and ManagerNotFoundException.java',
          code: `// DuplicateEmailException.java
// Thrown when an employee with the same email already exists in the database.
// The GlobalExceptionHandler will catch this and return HTTP 409 Conflict.

package com.timetracker.employee;

// RuntimeException = unchecked — no "throws DuplicateEmailException" needed
// in method signatures. Spring's exception handling infrastructure catches these.
public class DuplicateEmailException extends RuntimeException {

    // The constructor takes the duplicate email address and builds a helpful message.
    public DuplicateEmailException(String email) {
        // super() passes the message to RuntimeException, which stores it.
        // Callers retrieve it with exception.getMessage().
        super("Employee with email '%s' already exists".formatted(email));
        // "formatted()" is Java 15+ sugar for String.format("...%s...", email)
    }
}


// ---

// ManagerNotFoundException.java
// Thrown when a requested manager ID does not exist OR is not ACTIVE.
// The GlobalExceptionHandler will catch this and return HTTP 404 Not Found.

package com.timetracker.employee;

import java.util.UUID;

public class ManagerNotFoundException extends RuntimeException {

    public ManagerNotFoundException(UUID managerId) {
        super("Manager '%s' not found or is not active".formatted(managerId));
    }
}`,
        },
        {
          lang: 'java',
          label: 'EmployeeService.java — create() with business rules',
          code: `// What this file does:
// Contains the business logic for creating an employee.
// Enforces two business rules before saving:
//   1. No other employee can have the same email address.
//   2. The specified manager must exist AND be ACTIVE.
// Delegates persistence to EmployeeRepository and field mapping to EmployeeMapper.

package com.timetracker.employee;

import com.timetracker.employee.dto.CreateEmployeeRequest;
import com.timetracker.employee.dto.EmployeeResponse;
import org.springframework.stereotype.Service;

// @Service marks this as a Spring bean with business-logic intent.
// Spring creates ONE instance of this class and injects it into EmployeeController.
@Service
public class EmployeeService {

    // "final" fields: can only be set in the constructor, never reassigned.
    // This is a good safety guarantee for injected dependencies.
    private final EmployeeRepository repository;
    private final EmployeeMapper mapper;

    // Constructor injection: Spring sees ONE constructor and calls it automatically,
    // passing the EmployeeRepository and EmployeeMapper beans it created at startup.
    // No @Autowired annotation needed with a single constructor.
    public EmployeeService(EmployeeRepository repository, EmployeeMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    // Creates a new employee, enforcing business rules.
    // Returns the saved employee as a response DTO.
    // Throws DuplicateEmailException or ManagerNotFoundException if rules are violated.
    public EmployeeResponse create(CreateEmployeeRequest request) {

        // ─── STEP 1: Validate business rules ───────────────────────────────────

        // Rule 1: Email must be unique across all employees.
        // existsByEmail() runs: SELECT EXISTS(SELECT 1 FROM employee WHERE email = ?)
        // This is faster than findByEmail() because it does not load the full entity.
        if (repository.existsByEmail(request.email())) {
            // Throw immediately — execution stops here if the email is taken.
            throw new DuplicateEmailException(request.email());
        }

        // Rule 2: If a managerId was provided, the manager must exist AND be ACTIVE.
        // A null managerId is perfectly valid (top-level employees have no manager).
        Employee manager = null;
        if (request.managerId() != null) {
            manager = repository.findById(request.managerId())
                    // .filter() keeps the employee only if they are ACTIVE.
                    // If the employee is found but INACTIVE, filter makes the Optional empty.
                    .filter(e -> e.getStatus() == EmployeeStatus.ACTIVE)
                    // .orElseThrow() throws if the Optional is empty
                    // (either not found OR found but not ACTIVE — both are "not available as manager")
                    .orElseThrow(() -> new ManagerNotFoundException(request.managerId()));
        }

        // ─── STEP 2: Map request to entity ──────────────────────────────────────

        // The mapper copies fields from the request DTO into a new Employee entity.
        // The entity has no ID yet (Hibernate assigns it on save).
        Employee entity = mapper.toEntity(request);

        // Set the manager AFTER the mapper runs (mapper doesn't have the repository).
        // "manager" is null if no managerId was provided — that is correct.
        entity.setManager(manager);

        // ─── STEP 3: Persist and return ─────────────────────────────────────────

        // repository.save() runs an INSERT (because id is null — Hibernate knows it is new).
        // Hibernate sets: id (new UUID), version (0), createdAt (NOW()), updatedAt (NOW()).
        // The returned entity is the saved, managed version with all generated fields populated.
        Employee saved = repository.save(entity);

        // Convert the saved entity to a response DTO and return it.
        // The caller (controller) will serialise this to JSON.
        return mapper.toResponse(saved);
    }
}`,
        },
      ],
      links: [
        { label: 'Spring — @Service stereotype', url: 'https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/stereotype/Service.html' },
        { label: 'Spring — Dependency Injection (constructor)', url: 'https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html' },
        { label: 'Java Optional — docs', url: 'https://docs.oracle.com/en/java/docs/api/java.base/java/util/Optional.html' },
      ],
    },
    {
      id: 'T-005-02',
      title: 'Controller — POST /api/v1/employees',
      description:
        'A REST controller is the entry point for HTTP requests. Its job is narrow and deliberate: ' +
        'receive the HTTP request, extract the relevant data, delegate to the service, and wrap ' +
        'the result in an appropriate HTTP response. It does zero business logic. If you see an ' +
        'if statement in a controller, that is usually a sign something should be moved to the ' +
        'service layer.\n\n' +
        'Spring MVC maps HTTP requests to controller methods using annotations. @RestController ' +
        'tells Spring this class handles HTTP and that every method\'s return value should be ' +
        'serialised to JSON automatically. @RequestMapping("/api/v1/employees") sets the base ' +
        'path for all methods in this class. @PostMapping on a method means "this method handles ' +
        'HTTP POST requests to the base path."\n\n' +
        'The @Valid annotation on the request body parameter triggers Bean Validation before ' +
        'the method body executes. If any validation constraint fails (blank firstName, invalid ' +
        'email format), Spring throws MethodArgumentNotValidException immediately. Your method ' +
        'body never runs. The GlobalExceptionHandler catches this exception and returns the 422 ' +
        'error response.\n\n' +
        'The Location header in the 201 Created response is a REST convention. After creating a ' +
        'resource, you tell the client where to find it with a Location header pointing to its ' +
        'URL. ServletUriComponentsBuilder builds this URL dynamically from the current request ' +
        'URL plus the new resource\'s ID, so it works in any environment (localhost, staging, ' +
        'production) without hardcoding.',
      concepts: [
        {
          term: '@RestController',
          explanation:
            'A combination of @Controller and @ResponseBody. @Controller marks a class as an MVC ' +
            'controller (Spring routes HTTP requests to it). @ResponseBody means every method\'s ' +
            'return value is written directly to the HTTP response body as JSON (using Jackson), ' +
            'rather than being interpreted as a view template name.',
        },
        {
          term: '@RequestMapping and @PostMapping',
          explanation:
            '@RequestMapping("/api/v1/employees") on the class sets the base URL path for all ' +
            'methods in that class. @PostMapping on a method maps it to HTTP POST requests at ' +
            'that base path. Spring also has @GetMapping, @PatchMapping, @DeleteMapping for the ' +
            'other HTTP verbs. These annotations replace the verbose @RequestMapping(method = POST) syntax.',
        },
        {
          term: '@RequestBody and @Valid',
          explanation:
            '@RequestBody tells Spring to deserialise the HTTP request body (JSON) into the ' +
            'annotated parameter type using Jackson. @Valid triggers Bean Validation on the ' +
            'deserialised object — all @NotBlank, @Email etc. annotations are checked. Both ' +
            'annotations must be present for the JSON to be parsed AND validated.',
        },
        {
          term: 'ResponseEntity<T>',
          explanation:
            'ResponseEntity wraps a response body (T) together with an HTTP status code and headers. ' +
            'ResponseEntity.created(location) creates a response with status 201 Created and a ' +
            'Location header. Calling .body(response) attaches the response body. Without ' +
            'ResponseEntity, you cannot set custom status codes or headers — the method just ' +
            'returns 200 OK.',
        },
        {
          term: 'Location header',
          explanation:
            'The Location response header tells the client where to find the newly created resource. ' +
            'For a POST that creates /api/v1/employees/123, the Location header should be ' +
            '/api/v1/employees/123. This allows clients to immediately fetch the created resource ' +
            'without needing to know the server\'s URL structure in advance.',
        },
        {
          term: 'ServletUriComponentsBuilder',
          explanation:
            'A Spring utility that builds URLs based on the current HTTP request. ' +
            '.fromCurrentRequest() starts from the current request URL (e.g., http://localhost:8080/api/v1/employees). ' +
            '.path("/{id}") appends a path segment. .buildAndExpand(id) substitutes the actual ID. ' +
            '.toUri() returns a java.net.URI. This approach works regardless of which host or port the app is running on.',
        },
      ],
      checklist: [
        'Create src/main/java/com/timetracker/employee/EmployeeController.java with @RestController and @RequestMapping("/api/v1/employees").',
        'Add constructor injection for EmployeeService using a final field.',
        'Add the create() method with @PostMapping. The method signature must be: public ResponseEntity<EmployeeResponse> create(@Valid @RequestBody CreateEmployeeRequest request).',
        'Inside the method, call service.create(request) to get the EmployeeResponse, then build the Location URI and return ResponseEntity.created(location).body(response).',
        'Import: jakarta.validation.Valid, org.springframework.http.ResponseEntity, org.springframework.web.bind.annotation.*, org.springframework.web.servlet.support.ServletUriComponentsBuilder.',
        'Start the app and test with curl: copy the curl command from the example. Verify you get a 201 response with a Location header.',
        'Test that the Location header URL is correct: run curl -I (headers only) and check the Location value.',
        'Commit: feat(S1-005): add POST /api/v1/employees endpoint',
      ],
      examples: [
        {
          lang: 'java',
          label: 'EmployeeController.java — thin controller with POST endpoint',
          code: `// What this file does:
// Handles HTTP requests to /api/v1/employees.
// Delegates ALL business logic to EmployeeService.
// The controller only: deserialises JSON → calls service → serialises result → sets status code.

package com.timetracker.employee;

import com.timetracker.employee.dto.CreateEmployeeRequest;
import com.timetracker.employee.dto.EmployeeResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

// @RestController = @Controller + @ResponseBody
//   @Controller: Spring routes HTTP requests to methods in this class
//   @ResponseBody: return values are serialised to JSON automatically
@RestController
// @RequestMapping sets the base URL for ALL methods in this class.
// Every endpoint in this controller starts with /api/v1/employees.
@RequestMapping("/api/v1/employees")
public class EmployeeController {

    // The service handles all business logic. The controller is a thin wrapper.
    private final EmployeeService service;

    // Constructor injection: Spring passes the EmployeeService bean automatically.
    public EmployeeController(EmployeeService service) {
        this.service = service;
    }

    // @PostMapping maps this method to: HTTP POST /api/v1/employees
    // The method returns ResponseEntity<EmployeeResponse> so we can control:
    //   - The HTTP status code (201 Created, not the default 200 OK)
    //   - The Location response header
    //   - The response body (the created employee as JSON)
    @PostMapping
    public ResponseEntity<EmployeeResponse> create(
            // @Valid: triggers Bean Validation on CreateEmployeeRequest before this method runs.
            //   If any constraint fails (@NotBlank, @Email, etc.), Spring throws
            //   MethodArgumentNotValidException and this method body is NEVER executed.
            // @RequestBody: tells Jackson to deserialise the HTTP request body (JSON) into
            //   a CreateEmployeeRequest object. If the JSON is malformed, Jackson throws
            //   HttpMessageNotReadableException.
            @Valid @RequestBody CreateEmployeeRequest request) {

        // Delegate entirely to the service. All business rules are enforced there.
        // If DuplicateEmailException or ManagerNotFoundException is thrown, it propagates
        // up to the GlobalExceptionHandler (a future task) which converts it to a 409 or 404.
        EmployeeResponse response = service.create(request);

        // Build the Location header URL: the URL of the newly created employee.
        // Example: if the request was POST http://localhost:8080/api/v1/employees
        // and the new employee's ID is 550e8400-..., then Location = http://localhost:8080/api/v1/employees/550e8400-...
        //
        // ServletUriComponentsBuilder.fromCurrentRequest() starts from the current request URL.
        // .path("/{id}") appends "/{id}" to the path.
        // .buildAndExpand(response.id()) substitutes the actual UUID for {id}.
        // .toUri() returns a java.net.URI object.
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();

        // Return 201 Created with:
        //   - Location header pointing to the new employee's URL
        //   - Response body containing the full EmployeeResponse JSON
        return ResponseEntity.created(location).body(response);
    }
}`,
        },
        {
          lang: 'bash',
          label: 'Test the POST endpoint with curl',
          code: `# Create a new employee (no manager — Alice is the top of the org chart)
curl -s -X POST http://localhost:8080/api/v1/employees \\
  -H "Content-Type: application/json" \\
  -d '{
    "firstName": "Alice",
    "lastName":  "Admin",
    "email":     "alice@example.com",
    "department": "Management",
    "role":      "CTO",
    "hireDate":  "2024-01-15"
  }' | jq .

# Expected response (HTTP 201 Created):
# {
#   "id": "550e8400-e29b-41d4-a716-446655440000",
#   "firstName": "Alice",
#   "lastName": "Admin",
#   "email": "alice@example.com",
#   "department": "Management",
#   "role": "CTO",
#   "hireDate": "2024-01-15",
#   "managerId": null,
#   "status": "ACTIVE",
#   "version": 0,
#   "createdAt": "2024-01-15T10:30:00Z",
#   "updatedAt": "2024-01-15T10:30:00Z"
# }

# Check the response headers (to see the Location header):
curl -s -o /dev/null -D - -X POST http://localhost:8080/api/v1/employees \\
  -H "Content-Type: application/json" \\
  -d '{"firstName":"Bob","lastName":"Builder","email":"bob@example.com","department":"Engineering","role":"Dev","hireDate":"2024-02-01"}'

# Look for:
# HTTP/1.1 201
# Location: http://localhost:8080/api/v1/employees/550e8400-...`,
        },
      ],
      links: [
        { label: 'Spring MVC — @RestController', url: 'https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller.html' },
        { label: 'Spring MVC — ResponseEntity', url: 'https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/ResponseEntity.html' },
        { label: 'RFC 9110 — HTTP Semantics (201 Created + Location)', url: 'https://www.rfc-editor.org/rfc/rfc9110#section-9.3.2' },
      ],
    },
    {
      id: 'T-005-03',
      title: 'Bean Validation',
      description:
        'Bean Validation is a standard for declaring constraints on Java class fields using ' +
        'annotations. The Jakarta Bean Validation specification defines the annotations (@NotBlank, ' +
        '@Email, @Size, etc.) and Hibernate Validator (bundled with spring-boot-starter-validation) ' +
        'provides the implementation that checks them.\n\n' +
        'The trigger is @Valid on the @RequestBody parameter in the controller. When Spring ' +
        'deserialises the JSON request into a CreateEmployeeRequest record, it then runs all ' +
        'validation annotations on the record\'s fields. If any constraint fails, Spring throws ' +
        'MethodArgumentNotValidException before the method body ever executes.\n\n' +
        'The GlobalExceptionHandler is a class annotated with @RestControllerAdvice that intercepts ' +
        'exceptions thrown by any controller in the application. When it catches ' +
        'MethodArgumentNotValidException (validation failure), it maps it to a 422 response with ' +
        'per-field error details. When it catches DuplicateEmailException, it returns 409. ' +
        'This keeps the mapping from "exception type" to "HTTP status code" in one central place.\n\n' +
        'Testing validation thoroughly means sending intentionally bad requests and verifying the ' +
        'error responses. A blank firstName should give you {"field":"firstName","message":"must not ' +
        'be blank"}. An invalid email should give you the email constraint message. A future hire ' +
        'date should give you the @PastOrPresent message. Each test exercises a different constraint.',
      concepts: [
        {
          term: 'MethodArgumentNotValidException',
          explanation:
            'The exception Spring throws when @Valid validation fails. It contains a BindingResult ' +
            'with a list of FieldError objects — one per failing constraint. Each FieldError has a ' +
            'field name (e.g. "firstName") and a default message (e.g. "must not be blank"). ' +
            'The GlobalExceptionHandler extracts these and maps them to ValidationErrorDetail objects.',
        },
        {
          term: '@RestControllerAdvice',
          explanation:
            'A Spring annotation that marks a class as a global exception handler for all controllers. ' +
            'Methods inside the class annotated with @ExceptionHandler(SomeException.class) are called ' +
            'automatically when that exception is thrown from any controller method. This centralises ' +
            'error handling instead of duplicating try-catch blocks in every controller.',
        },
        {
          term: '@ExceptionHandler',
          explanation:
            'Annotates a method in a @RestControllerAdvice class to handle a specific exception type. ' +
            'When MethodArgumentNotValidException is thrown anywhere in the application, Spring ' +
            'calls the @ExceptionHandler(MethodArgumentNotValidException.class) method, passing the ' +
            'exception as a parameter. The method returns the error response.',
        },
        {
          term: 'HttpServletRequest',
          explanation:
            'The raw HTTP request object. In exception handler methods, you inject this to read the ' +
            'request URI (getRequestURI()) and include it in the error response\'s "path" field. ' +
            'This tells the client which endpoint caused the error — useful when multiple concurrent ' +
            'requests are being made.',
        },
        {
          term: 'Constraint violation message',
          explanation:
            'Every validation annotation has a default message: @NotBlank\'s default is "must not be ' +
            'blank", @Email\'s is "must be a well-formed email address". You can override these with ' +
            '@NotBlank(message = "First name is required"). The message appears in the ' +
            'ValidationErrorDetail.message field in the API error response.',
        },
      ],
      checklist: [
        'Verify @Valid is present on the @RequestBody parameter in EmployeeController.create() — without it, validation annotations on CreateEmployeeRequest are ignored.',
        'Create src/main/java/com/timetracker/employee/GlobalExceptionHandler.java with @RestControllerAdvice.',
        'Add a @ExceptionHandler method for MethodArgumentNotValidException that extracts field errors and returns a 422 ErrorResponse with the details array populated.',
        'Add a @ExceptionHandler method for DuplicateEmailException that returns a 409 ErrorResponse.',
        'Test validation by sending the curl command from the example with an empty firstName and an invalid email. Verify you get a 422 with the details array.',
        'Test the duplicate email case: create an employee, then try to create another with the same email. Verify you get a 409.',
        'Commit: feat(S1-005): add validation and exception handling',
      ],
      examples: [
        {
          lang: 'java',
          label: 'GlobalExceptionHandler.java — maps exceptions to HTTP responses',
          code: `// What this file does:
// Intercepts exceptions thrown by ANY controller in the application and converts them
// to structured ErrorResponse JSON. This is the single place that maps exception types
// to HTTP status codes — no try-catch needed in controllers or services.

package com.timetracker.employee;

import com.timetracker.employee.dto.ErrorResponse;
import com.timetracker.employee.dto.ValidationErrorDetail;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

// @RestControllerAdvice: this class intercepts exceptions from all @RestController classes.
// Spring calls the appropriate @ExceptionHandler method automatically when an exception is thrown.
@RestControllerAdvice
public class GlobalExceptionHandler {

    // Handle Bean Validation failures: @Valid found at least one failing constraint.
    // This is called when the @Valid annotation on a controller parameter triggers a failure.
    // "MethodArgumentNotValidException" contains a list of all failing field constraints.
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {  // Spring injects the current HTTP request

        // Extract per-field errors from the exception.
        // getBindingResult().getFieldErrors() returns one FieldError per failing constraint.
        List<ValidationErrorDetail> details = ex.getBindingResult().getFieldErrors().stream()
                .map(fieldError -> new ValidationErrorDetail(
                    fieldError.getField(),           // e.g. "firstName"
                    fieldError.getDefaultMessage()   // e.g. "must not be blank"
                ))
                .toList();

        ErrorResponse error = ErrorResponse.ofValidation(
            "Validation failed for %d field(s)".formatted(details.size()),
            details,
            request.getRequestURI()  // e.g. "/api/v1/employees"
        );

        // Return 422 Unprocessable Entity
        return ResponseEntity.unprocessableEntity().body(error);
    }

    // Handle duplicate email: another employee already has this email address.
    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateEmail(
            DuplicateEmailException ex,
            HttpServletRequest request) {

        ErrorResponse error = ErrorResponse.of(
            HttpStatus.CONFLICT.value(),     // 409
            HttpStatus.CONFLICT.getReasonPhrase(),  // "Conflict"
            ex.getMessage(),                 // "Employee with email '...' already exists"
            request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    // Handle manager not found or not active.
    @ExceptionHandler(ManagerNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleManagerNotFound(
            ManagerNotFoundException ex,
            HttpServletRequest request) {

        ErrorResponse error = ErrorResponse.of(
            HttpStatus.NOT_FOUND.value(),     // 404
            HttpStatus.NOT_FOUND.getReasonPhrase(),
            ex.getMessage(),
            request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
}`,
        },
        {
          lang: 'bash',
          label: 'Test validation failures with curl',
          code: `# Test 1: Missing required fields → expect 422 with details array
curl -s -X POST http://localhost:8080/api/v1/employees \\
  -H "Content-Type: application/json" \\
  -d '{"firstName":"","email":"not-an-email","hireDate":"2099-01-01"}' | jq .

# Expected response:
# {
#   "status": 422,
#   "error": "Unprocessable Entity",
#   "message": "Validation failed for 5 field(s)",
#   "details": [
#     {"field": "firstName",  "message": "must not be blank"},
#     {"field": "email",      "message": "must be a well-formed email address"},
#     {"field": "hireDate",   "message": "must be a date in the past or in the present"},
#     {"field": "lastName",   "message": "must not be blank"},
#     {"field": "department", "message": "must not be blank"}
#   ],
#   "timestamp": "...",
#   "path": "/api/v1/employees"
# }

# Test 2: Duplicate email → expect 409
# (First run this to create Alice)
curl -s -X POST http://localhost:8080/api/v1/employees \\
  -H "Content-Type: application/json" \\
  -d '{"firstName":"Alice","lastName":"Admin","email":"alice@example.com","department":"Mgmt","role":"CTO","hireDate":"2020-01-01"}'

# Then try to create another Alice with the same email:
curl -s -X POST http://localhost:8080/api/v1/employees \\
  -H "Content-Type: application/json" \\
  -d '{"firstName":"Alice2","lastName":"Admin2","email":"alice@example.com","department":"Eng","role":"Dev","hireDate":"2021-01-01"}' | jq .

# Expected:
# {
#   "status": 409,
#   "error": "Conflict",
#   "message": "Employee with email 'alice@example.com' already exists",
#   ...
# }`,
        },
      ],
      links: [
        { label: 'Jakarta Bean Validation — Built-in Constraints', url: 'https://jakarta.ee/specifications/bean-validation/3.0/jakarta-bean-validation-spec-3.0.html#builtinconstraints' },
        { label: 'Hibernate Validator — Getting Started', url: 'https://docs.jboss.org/hibernate/validator/8.0/reference/en-US/html_single/#chapter-getting-started' },
        { label: 'Spring MVC — Exception Handling', url: 'https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-exceptionhandler.html' },
      ],
    },
    {
      id: 'T-005-04',
      title: 'Unit Tests — Create',
      description:
        'Unit tests verify one unit of code in isolation. For EmployeeService, a unit test ' +
        'checks that the create() method enforces the right business rules — without starting ' +
        'a Spring context, without connecting to a database, and without sending real HTTP ' +
        'requests. The test runs in milliseconds rather than seconds.\n\n' +
        'The key tool is Mockito. Mockito creates "mock" objects — fake implementations of ' +
        'interfaces or classes that you control. When you create a mock of EmployeeRepository, ' +
        'you get an object where every method does nothing and returns null or empty by default. ' +
        'You then use when(...).thenReturn(...) to make specific methods return specific values ' +
        'for your test scenario. This lets you test the service in complete isolation from the ' +
        'database.\n\n' +
        'There are four test cases to cover: (1) the happy path where everything is valid and ' +
        'a response is returned, (2) the duplicate email case where an exception is thrown, ' +
        '(3) the manager-not-found case, and (4) the inactive-manager case. Each test arranges ' +
        'the mocks to simulate a specific scenario, calls service.create(), and asserts the ' +
        'expected outcome.\n\n' +
        'The @InjectMocks annotation creates the real EmployeeService and injects the mock ' +
        'repository and mock mapper into it (matching the constructor parameters). This is how ' +
        'Mockito wires together the "real" service with its "fake" dependencies so you test ' +
        'only the service logic.',
      concepts: [
        {
          term: 'Unit test',
          explanation:
            'A test that exercises one class in complete isolation from its dependencies. External ' +
            'dependencies (database, other services) are replaced with mocks. Unit tests run fast ' +
            '(no I/O) and are precise: a failing test points to a specific piece of logic in one ' +
            'class, not a misconfigured Spring context or a database constraint.',
        },
        {
          term: 'Mockito and @Mock',
          explanation:
            '@Mock creates a mock object — a fake implementation that records method calls and returns ' +
            'configurable values. A mock EmployeeRepository does not connect to any database: ' +
            'existsByEmail("test@example.com") returns false by default until you configure it with ' +
            'when(repository.existsByEmail("test@example.com")).thenReturn(true).',
        },
        {
          term: '@InjectMocks',
          explanation:
            '@InjectMocks creates a REAL instance of the annotated class and injects all @Mock fields ' +
            'into it. For EmployeeService, Mockito calls new EmployeeService(mockRepository, mockMapper). ' +
            'The result is a real service with fake dependencies — perfect for testing the service\'s ' +
            'own logic without the external dependencies.',
        },
        {
          term: 'when(...).thenReturn(...)',
          explanation:
            'The core Mockito stubbing pattern. when(repository.existsByEmail("alice@example.com")) ' +
            '.thenReturn(true) means: "when existsByEmail is called with this specific argument, ' +
            'return true." Only that specific call is stubbed; other calls use the default (false). ' +
            'This lets you simulate any database state without a real database.',
        },
        {
          term: 'assertThatThrownBy()',
          explanation:
            'An AssertJ method for testing that an exception is thrown. ' +
            'assertThatThrownBy(() -> service.create(request)).isInstanceOf(DuplicateEmailException.class) ' +
            'runs the lambda, catches any exception, and asserts it is the right type. If no exception ' +
            'is thrown, the assertion fails. This is cleaner than try-catch in tests.',
        },
        {
          term: '@DisplayName',
          explanation:
            'A JUnit 5 annotation that provides a human-readable name for a test method. The default ' +
            'name is the method name (create_success, create_duplicateEmail). @DisplayName lets you ' +
            'write a full sentence describing what the test verifies — this sentence appears in IDE ' +
            'test reports and CI output, making failures easier to understand.',
        },
      ],
      checklist: [
        'Create the test file src/test/java/com/timetracker/employee/EmployeeServiceTest.java.',
        'Add @ExtendWith(MockitoExtension.class) on the class — this activates Mockito for this test class, enabling @Mock and @InjectMocks.',
        'Add @Mock EmployeeRepository repository; and @Mock EmployeeMapper mapper; fields. Mockito creates fake implementations of these.',
        'Add @InjectMocks EmployeeService service; — Mockito creates a real EmployeeService and injects the mock repository and mapper.',
        'Write create_success(): configure when(repository.existsByEmail(...)).thenReturn(false), when(mapper.toEntity(request)).thenReturn(entity), when(repository.save(entity)).thenReturn(entity), when(mapper.toResponse(entity)).thenReturn(response). Call service.create(request) and assert the response equals the expected value.',
        'Write create_duplicateEmail(): configure when(repository.existsByEmail(...)).thenReturn(true). Use assertThatThrownBy(() -> service.create(request)).isInstanceOf(DuplicateEmailException.class).',
        'Write create_managerNotFound(): configure managerId on the request and when(repository.findById(managerId)).thenReturn(Optional.empty()). Assert ManagerNotFoundException is thrown.',
        'Write create_inactiveManager(): configure managerId on the request and when(repository.findById(managerId)).thenReturn(Optional.of(inactiveManager)) where inactiveManager.getStatus() == INACTIVE. Assert ManagerNotFoundException is thrown.',
        'Run ./mvnw test and verify all four tests pass with BUILD SUCCESS.',
        'Commit: test(S1-005): unit tests for EmployeeService.create()',
      ],
      examples: [
        {
          lang: 'java',
          label: 'EmployeeServiceTest.java — four test cases with Mockito',
          code: `// What this file does:
// Tests EmployeeService.create() in isolation using Mockito to mock the database.
// Four scenarios: happy path, duplicate email, manager not found, inactive manager.
// No Spring context, no database, no HTTP requests — just pure Java logic.

package com.timetracker.employee;

import com.timetracker.employee.dto.CreateEmployeeRequest;
import com.timetracker.employee.dto.EmployeeResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

// @ExtendWith(MockitoExtension.class): activates Mockito for this test class.
// This processes @Mock, @InjectMocks, and @Captor annotations automatically.
@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    // @Mock: creates a fake EmployeeRepository that does nothing by default.
    // No database needed — all method calls are recorded and can be stubbed.
    @Mock
    EmployeeRepository repository;

    // @Mock: creates a fake EmployeeMapper.
    @Mock
    EmployeeMapper mapper;

    // @InjectMocks: creates a REAL EmployeeService and injects the two mocks above.
    // This is equivalent to: service = new EmployeeService(repository, mapper)
    // where repository and mapper are the Mockito mocks.
    @InjectMocks
    EmployeeService service;

    // Test 1: Everything valid — expect a successful response.
    @Test
    @DisplayName("create returns EmployeeResponse when all inputs are valid")
    void create_success() {
        // ─── Arrange ──────────────────────────────────────────────────────────
        // Build the request DTO (what the controller would pass to the service)
        var request = new CreateEmployeeRequest(
            "Jane", "Doe", "jane@example.com",
            "Engineering", "Developer",
            LocalDate.of(2024, 1, 1),
            null  // No manager
        );

        // Create an entity and a response object to be returned by the mocks
        var entity = new Employee();
        var expectedResponse = new EmployeeResponse(
            UUID.randomUUID(), "Jane", "Doe", "jane@example.com",
            "Engineering", "Developer", LocalDate.of(2024, 1, 1),
            null, EmployeeStatus.ACTIVE, 0L, Instant.now(), Instant.now()
        );

        // Stub the mock methods: configure what each mock returns for this test.
        // "when existsByEmail is called with this email, return false (email not taken)"
        when(repository.existsByEmail("jane@example.com")).thenReturn(false);
        // "when mapper.toEntity is called with our request, return the entity"
        when(mapper.toEntity(request)).thenReturn(entity);
        // "when repository.save is called with the entity, return the same entity"
        when(repository.save(entity)).thenReturn(entity);
        // "when mapper.toResponse is called with the entity, return the expected response"
        when(mapper.toResponse(entity)).thenReturn(expectedResponse);

        // ─── Act ──────────────────────────────────────────────────────────────
        EmployeeResponse actual = service.create(request);

        // ─── Assert ───────────────────────────────────────────────────────────
        // assertThat() is from AssertJ — fluent, readable assertions.
        // isEqualTo() checks that actual equals expectedResponse using .equals().
        assertThat(actual).isEqualTo(expectedResponse);
    }

    // Test 2: Email already taken — expect DuplicateEmailException.
    @Test
    @DisplayName("create throws DuplicateEmailException when email is already taken")
    void create_duplicateEmail() {
        // Arrange: existsByEmail returns true (another employee has this email)
        var request = new CreateEmployeeRequest(
            "Jane", "Doe", "jane@example.com",
            "Engineering", "Developer", LocalDate.now(), null
        );
        when(repository.existsByEmail("jane@example.com")).thenReturn(true);

        // Act + Assert: assertThatThrownBy executes the lambda and catches the exception.
        // If no exception is thrown, the test FAILS.
        assertThatThrownBy(() -> service.create(request))
            .isInstanceOf(DuplicateEmailException.class)
            // Optionally also check the exception message:
            .hasMessageContaining("jane@example.com");
    }

    // Test 3: Manager ID provided but manager does not exist in the database.
    @Test
    @DisplayName("create throws ManagerNotFoundException when manager does not exist")
    void create_managerNotFound() {
        // Arrange: email is not taken, but the manager does not exist
        var managerId = UUID.randomUUID();
        var request = new CreateEmployeeRequest(
            "Jane", "Doe", "jane@example.com",
            "Engineering", "Developer", LocalDate.now(), managerId
        );
        when(repository.existsByEmail("jane@example.com")).thenReturn(false);
        // findById returns Optional.empty() = manager does not exist
        when(repository.findById(managerId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(request))
            .isInstanceOf(ManagerNotFoundException.class);
    }

    // Test 4: Manager exists but is INACTIVE — cannot be assigned as manager.
    @Test
    @DisplayName("create throws ManagerNotFoundException when manager is INACTIVE")
    void create_inactiveManager() {
        // Arrange: email is not taken, manager exists but is INACTIVE
        var managerId = UUID.randomUUID();
        var request = new CreateEmployeeRequest(
            "Jane", "Doe", "jane@example.com",
            "Engineering", "Developer", LocalDate.now(), managerId
        );

        // Build an INACTIVE manager entity
        var inactiveManager = new Employee();
        inactiveManager.setStatus(EmployeeStatus.INACTIVE);

        when(repository.existsByEmail("jane@example.com")).thenReturn(false);
        // findById returns the manager, but the manager is INACTIVE.
        // The .filter(e -> e.getStatus() == ACTIVE) in the service will make Optional empty.
        when(repository.findById(managerId)).thenReturn(Optional.of(inactiveManager));

        assertThatThrownBy(() -> service.create(request))
            .isInstanceOf(ManagerNotFoundException.class);
    }
}`,
        },
      ],
      links: [
        { label: 'JUnit 5 — User Guide', url: 'https://junit.org/junit5/docs/current/user-guide/' },
        { label: 'Mockito — Official Documentation', url: 'https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/Mockito.html' },
        { label: 'AssertJ — Fluent Assertions', url: 'https://assertj.github.io/doc/' },
        { label: 'Baeldung — Mockito Tutorial', url: 'https://www.baeldung.com/mockito-series' },
      ],
    },
  ],
};
