import { Story } from '../../models/step.model';

export const S1_006: Story = {
  id: 'S1-006',
  title: 'S1-006 — Get Employee',
  tasks: [
    {
      id: 'T-006-01',
      title: 'Service — getById()',
      description:
        'What is a "get by ID" operation?\n\n' +
        'When a client (a browser, a mobile app, another service) knows the unique ID of an employee and wants to see their details, it sends a GET request like GET /api/v1/employees/abc123. The service needs to look up that record in the database and return it — or report that it does not exist.\n\n' +
        'In this task you add a getById() method to EmployeeService. The method takes a UUID (the employee\'s unique identifier), asks the repository to look it up, and either returns the found employee converted to a response object, or throws a custom exception called EmployeeNotFoundException.\n\n' +
        'An important design decision here: both ACTIVE and INACTIVE employees are returned when you look up by ID. Inactive employees are "soft-deleted" — they are hidden from lists, but they are not gone from the database. A direct ID lookup still finds them. This is useful for audit trails and historical records. The list endpoint (S1-007) will filter them out, but this one will not.\n\n' +
        'The key Java concept here is Optional<T>. When you call repository.findById(id), Spring Data does not return null if the employee does not exist — it returns an Optional that is either present (wrapping the Employee) or empty. You chain .map(mapper::toResponse) to convert it if it is present, then .orElseThrow(...) to produce an exception if it is empty. This eliminates the need to write null-checks manually.',
      concepts: [
        {
          term: 'UUID',
          explanation:
            'UUID stands for Universally Unique Identifier. It is a 128-bit number written as 32 hex digits in the format xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx, for example 550e8400-e29b-41d4-a716-446655440000. In this project, every employee gets a UUID as their primary key. The database generates it automatically when you insert a record. UUIDs are preferred over auto-incrementing integers because they are globally unique — two different databases cannot accidentally produce the same ID.',
        },
        {
          term: 'Optional<T>',
          explanation:
            'Optional is a Java class that acts as a wrapper around a value that might or might not exist. Instead of returning null when nothing is found (which causes NullPointerExceptions if you forget to check), a method returns Optional.empty() or Optional.of(value). You call .isPresent() to check, .get() to unwrap, .map() to transform, or .orElseThrow() to throw an exception if empty. Spring Data\'s findById() always returns an Optional — never null.',
        },
        {
          term: 'Method reference (::)',
          explanation:
            'The double-colon syntax mapper::toResponse is called a method reference. It is a shorthand for writing a lambda like employee -> mapper.toResponse(employee). Both mean the same thing: "call toResponse on the mapper, passing the employee as the argument." Method references are used with stream operations and Optional methods like .map() to keep code concise.',
        },
        {
          term: 'Custom exception',
          explanation:
            'A custom exception is a class you write that extends RuntimeException (or another exception class). You create one — EmployeeNotFoundException — so that error messages are specific and meaningful. When thrown, it bubbles up to the GlobalExceptionHandler, which catches it and converts it into an HTTP 404 response. Without a custom exception you would have to return null or use a generic exception with a less descriptive message.',
        },
        {
          term: 'orElseThrow()',
          explanation:
            'orElseThrow() is a method on Optional. If the Optional contains a value, it returns that value. If the Optional is empty, it calls the lambda you provide to create and throw an exception. You pass it a lambda like () -> new EmployeeNotFoundException(id), which means "if empty, create a new EmployeeNotFoundException with this id and throw it." This is the standard Spring Data pattern for "find or 404."',
        },
      ],
      checklist: [
        'Open EmployeeService.java — add the getById(UUID id) method shown in the example below, placing it after the create() method.',
        'Create a new file EmployeeNotFoundException.java in the same package (com.timetracker.employee) with the class shown in the example — it extends RuntimeException and formats a helpful message.',
        'Verify GlobalExceptionHandler already handles EmployeeNotFoundException and maps it to a 404 response — if not, add @ExceptionHandler(EmployeeNotFoundException.class) returning ResponseEntity with status 404.',
        'Run the application and test with curl: GET /api/v1/employees/{a-real-uuid} should return 200 with the employee body.',
        'Test: GET /api/v1/employees/{a-random-unknown-uuid} should return 404.',
        'Commit with message: feat(S1-006): implement EmployeeService.getById()',
      ],
      examples: [
        {
          lang: 'java',
          label: 'EmployeeService.java — getById() method',
          code: `package com.timetracker.employee.service;

import com.timetracker.employee.domain.Employee;
import com.timetracker.employee.dto.EmployeeResponse;
import com.timetracker.employee.exception.EmployeeNotFoundException;
import com.timetracker.employee.repository.EmployeeRepository;
import com.timetracker.employee.mapper.EmployeeMapper;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class EmployeeService {

    private final EmployeeRepository repository;
    private final EmployeeMapper mapper;

    // Spring injects these automatically via constructor injection
    public EmployeeService(EmployeeRepository repository, EmployeeMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    // --- Add this method ---
    public EmployeeResponse getById(UUID id) {
        // repository.findById(id) returns Optional<Employee>
        // — it will never be null, but it might be empty (not found)
        return repository.findById(id)
                .map(mapper::toResponse)      // if found: convert Employee → EmployeeResponse
                .orElseThrow(() -> new EmployeeNotFoundException(id)); // if empty: throw 404 exception
        // Note: NO status filter here — inactive employees are still visible by direct ID.
        // The list endpoint (S1-007) will filter out inactive employees.
    }
}`,
        },
        {
          lang: 'java',
          label: 'EmployeeNotFoundException.java — custom 404 exception',
          code: `package com.timetracker.employee.exception;

import java.util.UUID;

// Extending RuntimeException means this is an "unchecked" exception.
// Unchecked exceptions do NOT need to be declared with "throws" in method signatures.
// Spring's @ExceptionHandler can catch them automatically.
public class EmployeeNotFoundException extends RuntimeException {

    // Constructor takes the ID so the error message is specific and useful
    public EmployeeNotFoundException(UUID id) {
        // super(...) calls RuntimeException's constructor with the message string
        // .formatted() is Java's String.format shorthand — %s inserts the id value
        super("Employee with id '%s' not found".formatted(id));
    }
}`,
        },
        {
          lang: 'java',
          label: 'GlobalExceptionHandler.java — map EmployeeNotFoundException to HTTP 404',
          code: `package com.timetracker.employee.exception;

import com.timetracker.employee.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

// @RestControllerAdvice means: "this class handles exceptions thrown by any @RestController"
@RestControllerAdvice
public class GlobalExceptionHandler {

    // @ExceptionHandler tells Spring: "run this method when EmployeeNotFoundException is thrown"
    @ExceptionHandler(EmployeeNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
            EmployeeNotFoundException ex,
            HttpServletRequest request) { // Spring injects the current HTTP request

        // Build a 404 response with a structured error body
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)  // HTTP 404
                .body(ErrorResponse.of(
                        404,
                        "Not Found",
                        ex.getMessage(), // "Employee with id 'abc...' not found"
                        request.getRequestURI())); // e.g. "/api/v1/employees/abc..."
    }
}`,
        },
        {
          lang: 'bash',
          label: 'Manual test with curl',
          code: `# Replace {id} with an actual UUID from your database

# Happy path — employee exists → 200 OK
curl -s http://localhost:8080/api/v1/employees/{id} | jq .
# Expected:
# {
#   "id": "550e8400-e29b-41d4-a716-446655440000",
#   "firstName": "Jane",
#   "lastName": "Doe",
#   "email": "jane@example.com",
#   ...
# }

# Not found — unknown UUID → 404 Not Found
curl -s http://localhost:8080/api/v1/employees/00000000-0000-0000-0000-000000000000 | jq .
# Expected:
# {
#   "status": 404,
#   "error": "Not Found",
#   "message": "Employee with id '00000000-0000-0000-0000-000000000000' not found",
#   "path": "/api/v1/employees/00000000-0000-0000-0000-000000000000"
# }`,
        },
      ],
      links: [
        { label: 'Java Optional — Oracle docs', url: 'https://docs.oracle.com/en/java/docs/api/java.base/java/util/Optional.html' },
        { label: 'Spring Data — findById', url: 'https://docs.spring.io/spring-data/commons/docs/current/api/org/springframework/data/repository/CrudRepository.html#findById(ID)' },
        { label: 'Spring — @ExceptionHandler', url: 'https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-exceptionhandler.html' },
      ],
    },
    {
      id: 'T-006-02',
      title: 'Controller — GET /api/v1/employees/{id}',
      description:
        'What does this controller endpoint do?\n\n' +
        'The controller is the entry point for HTTP requests. When a client sends GET /api/v1/employees/550e8400-e29b-41d4-a716-446655440000, Spring MVC routes that request to your getById() method in EmployeeController. The {id} part of the URL is called a path variable — Spring automatically extracts it from the URL and passes it to your method as a UUID parameter.\n\n' +
        'The controller method itself is intentionally short: it takes the id, passes it to the service, and wraps the result in a ResponseEntity.ok() which produces HTTP 200 OK. There is no business logic here — the controller just handles the HTTP translation layer.\n\n' +
        'Error handling is completely automatic. If the service throws EmployeeNotFoundException, the exception propagates up through the controller and is caught by GlobalExceptionHandler, which converts it to a 404 response. The controller does not need any try-catch blocks.\n\n' +
        'The @PathVariable annotation is what tells Spring to bind the {id} segment from the URL to the UUID id parameter. Spring also automatically converts the string "550e8400-..." into a real Java UUID object for you. If the string is not a valid UUID format, Spring will throw a MethodArgumentTypeMismatchException before your code even runs — which you handle in the next task.',
      concepts: [
        {
          term: '@PathVariable',
          explanation:
            'The @PathVariable annotation tells Spring MVC to extract a segment from the URL path and inject it as a method parameter. In @GetMapping("/{id}"), the {id} is a placeholder. @PathVariable UUID id tells Spring: "take whatever is in that {id} slot, convert it to a UUID, and put it in the id variable." Spring handles the string-to-UUID conversion automatically.',
        },
        {
          term: 'ResponseEntity<T>',
          explanation:
            'ResponseEntity is a wrapper that lets you control the full HTTP response: the status code (200, 201, 404...), the headers, and the body. ResponseEntity.ok(data) creates a 200 OK response with data as the JSON body. ResponseEntity.notFound().build() creates a 404 with no body. Using ResponseEntity makes your intent explicit — any reader immediately sees what HTTP status the endpoint returns.',
        },
        {
          term: 'HTTP 200 OK',
          explanation:
            'HTTP 200 OK is the standard success response for GET requests. It means "here is the thing you asked for." The response body contains the employee\'s data serialized as JSON. Spring uses the Jackson library to automatically convert your Java EmployeeResponse record into JSON — you do not need to write any serialization code.',
        },
      ],
      checklist: [
        'Open EmployeeController.java and add the @GetMapping("/{id}") method shown in the example — place it after the create() method.',
        'The method signature must be: public ResponseEntity<EmployeeResponse> getById(@PathVariable UUID id)',
        'The body is a single line: return ResponseEntity.ok(service.getById(id));',
        'No try-catch needed — exception handling is done by GlobalExceptionHandler.',
        'Run the application and test: GET /api/v1/employees/{valid-uuid} should return 200 with the employee JSON.',
        'Test: GET /api/v1/employees/{unknown-uuid} should return 404 (handled automatically).',
        'Commit with message: feat(S1-006): add GET /api/v1/employees/{id} endpoint',
      ],
      examples: [
        {
          lang: 'java',
          label: 'EmployeeController.java — complete controller with both endpoints',
          code: `package com.timetracker.employee.controller;

import com.timetracker.employee.dto.CreateEmployeeRequest;
import com.timetracker.employee.dto.EmployeeResponse;
import com.timetracker.employee.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.UUID;

// @RestController = @Controller + @ResponseBody
// Means: "this class handles HTTP requests and returns JSON (not HTML pages)"
@RestController
// All methods in this class share the /api/v1/employees base path
@RequestMapping("/api/v1/employees")
public class EmployeeController {

    private final EmployeeService service;

    // Spring injects EmployeeService here automatically
    public EmployeeController(EmployeeService service) {
        this.service = service;
    }

    // --- Existing endpoint from S1-005 ---
    @PostMapping  // handles POST /api/v1/employees
    public ResponseEntity<EmployeeResponse> create(@Valid @RequestBody CreateEmployeeRequest request) {
        EmployeeResponse response = service.create(request);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();
        return ResponseEntity.created(location).body(response); // 201 Created
    }

    // --- New endpoint for S1-006 ---
    @GetMapping("/{id}")  // handles GET /api/v1/employees/{id}
    public ResponseEntity<EmployeeResponse> getById(
            @PathVariable UUID id) { // Spring extracts {id} from URL and converts to UUID

        // Delegate entirely to the service — controller has zero business logic
        return ResponseEntity.ok(service.getById(id)); // 200 OK with employee as JSON body

        // If service.getById() throws EmployeeNotFoundException,
        // it propagates here and GlobalExceptionHandler catches it → 404 response
    }
}`,
        },
        {
          lang: 'bash',
          label: 'Test the endpoint manually',
          code: `# Step 1: Create an employee first, capture the ID from the response
curl -s -X POST http://localhost:8080/api/v1/employees \\
  -H "Content-Type: application/json" \\
  -d '{
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane@example.com",
    "department": "Engineering",
    "role": "Developer",
    "hireDate": "2024-01-15"
  }' | jq .

# Step 2: Use the ID from the response above
curl -s http://localhost:8080/api/v1/employees/PASTE-ID-HERE | jq .

# Step 3: Try an ID that doesn't exist
curl -s http://localhost:8080/api/v1/employees/00000000-0000-0000-0000-000000000000 | jq .
# → 404 with error body`,
        },
      ],
      links: [
        { label: 'Spring MVC — @PathVariable', url: 'https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/pathvars.html' },
        { label: 'Spring MVC — @GetMapping', url: 'https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/bind/annotation/GetMapping.html' },
        { label: 'HTTP status codes — MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status' },
      ],
    },
    {
      id: 'T-006-03',
      title: 'Handle Invalid UUID Format',
      description:
        'What happens when the URL contains garbage instead of a UUID?\n\n' +
        'Your getById() method expects a UUID like 550e8400-e29b-41d4-a716-446655440000. But clients can send anything in the URL — someone might accidentally call GET /api/v1/employees/not-a-uuid or GET /api/v1/employees/abc. The string "not-a-uuid" cannot be converted to a UUID object.\n\n' +
        'Spring tries to do this conversion before your method even runs. When it fails, Spring throws a MethodArgumentTypeMismatchException. Without a handler for this exception, Spring would return a generic 500 Internal Server Error, which is confusing and unhelpful to the caller.\n\n' +
        'The fix is to add a handler in GlobalExceptionHandler that catches MethodArgumentTypeMismatchException and returns HTTP 400 Bad Request with a clear message like "Invalid parameter format: id". This tells the client exactly what they did wrong.\n\n' +
        'This is a common pattern in REST APIs: distinguish between "not found" (the format was valid but nothing matched — 404) and "bad request" (the format itself was invalid — 400). Both are client errors, but they mean different things.',
      concepts: [
        {
          term: 'MethodArgumentTypeMismatchException',
          explanation:
            'This Spring exception is thrown when a path variable or request parameter cannot be converted to the declared type. For example, if your method declares @PathVariable UUID id and the URL contains /employees/hello-world, Spring cannot convert "hello-world" to a UUID and throws this exception. The exception carries the parameter name ("id") so you can include it in the error message.',
        },
        {
          term: 'HTTP 400 Bad Request',
          explanation:
            'HTTP 400 means the server understood the request but refuses to process it because the request is malformed. It is the correct response when the client sends invalid data — a non-UUID in a UUID field, a negative number where a positive is required, or a date in the wrong format. It differs from 404 (correct format, nothing found) and 422 (correct format and found, but validation rules failed).',
        },
        {
          term: 'Type conversion in Spring MVC',
          explanation:
            'Spring MVC automatically converts URL strings into Java types for path variables and request parameters. It can convert strings to int, long, boolean, UUID, LocalDate, and many more types using built-in converters. This conversion happens before your method body runs. If conversion fails, the MethodArgumentTypeMismatchException is thrown and your method is never called.',
        },
      ],
      checklist: [
        'Open GlobalExceptionHandler.java and check whether a handler for MethodArgumentTypeMismatchException already exists.',
        'If not, add the @ExceptionHandler(MethodArgumentTypeMismatchException.class) method shown in the example.',
        'The handler should return ResponseEntity with HTTP 400 status and an ErrorResponse body.',
        'Use ex.getName() in the error message — it returns the parameter name ("id"), making the error message "Invalid parameter format: id".',
        'Test: GET /api/v1/employees/not-a-uuid should return 400 with the error body.',
        'Test: GET /api/v1/employees/12345 (a number, not a UUID) should also return 400.',
        'Commit with message: feat(S1-006): handle invalid UUID path variable',
      ],
      examples: [
        {
          lang: 'java',
          label: 'GlobalExceptionHandler.java — add MethodArgumentTypeMismatchException handler',
          code: `package com.timetracker.employee.exception;

import com.timetracker.employee.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // --- Existing handler ---
    @ExceptionHandler(EmployeeNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
            EmployeeNotFoundException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ErrorResponse.of(404, "Not Found", ex.getMessage(), request.getRequestURI()));
    }

    // --- New handler for invalid path variable format ---
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex,
            HttpServletRequest request) {

        // ex.getName() = the parameter name, e.g. "id"
        // ex.getValue() = what the client actually sent, e.g. "not-a-uuid"
        // ex.getRequiredType() = the expected type, e.g. class java.util.UUID
        String message = "Invalid parameter format: " + ex.getName();

        return ResponseEntity
                .badRequest() // HTTP 400 Bad Request
                .body(ErrorResponse.of(
                        400,
                        "Bad Request",
                        message,
                        request.getRequestURI()));
    }
}`,
        },
        {
          lang: 'bash',
          label: 'Test invalid path variable formats',
          code: `# Non-UUID string → 400
curl -s http://localhost:8080/api/v1/employees/not-a-uuid | jq .
# Expected:
# {
#   "status": 400,
#   "error": "Bad Request",
#   "message": "Invalid parameter format: id",
#   "path": "/api/v1/employees/not-a-uuid"
# }

# Number instead of UUID → 400
curl -s http://localhost:8080/api/v1/employees/12345 | jq .
# Also 400 — 12345 is not a valid UUID

# Valid UUID format but not found → 404 (different error!)
curl -s http://localhost:8080/api/v1/employees/00000000-0000-0000-0000-000000000000 | jq .
# {
#   "status": 404,
#   "error": "Not Found",
#   ...
# }`,
        },
      ],
      links: [
        { label: 'Spring MVC — Exception Handling', url: 'https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-exceptionhandler.html' },
        { label: 'Spring MVC — @RestControllerAdvice', url: 'https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/bind/annotation/RestControllerAdvice.html' },
      ],
    },
    {
      id: 'T-006-04',
      title: 'Unit Tests — Get',
      description:
        'Why write tests for getById()?\n\n' +
        'Tests are not just about catching bugs — they are documentation that proves your code behaves as intended. For getById(), you need to test two scenarios: the "happy path" (employee exists, return it) and the "unhappy path" (employee does not exist, throw EmployeeNotFoundException). These are the only two possible outcomes of the method.\n\n' +
        'You use JUnit 5 and Mockito, just like in S1-005. You mock the repository and mapper so your tests do not need a database. This is called a unit test — it tests the service class in isolation. You control the repository\'s behavior with when(...).thenReturn(...): "when findById is called with any UUID, pretend the database returned this Optional."\n\n' +
        'For the not-found test, you tell the mock to return Optional.empty() — simulating a database with no matching record. You then assert that the exception is thrown. This proves your orElseThrow() logic actually fires.\n\n' +
        'A good test has three sections: Arrange (set up mocks and data), Act (call the method), Assert (verify the outcome). This pattern is sometimes called AAA or Given-When-Then.',
      concepts: [
        {
          term: 'Optional.of() vs Optional.empty()',
          explanation:
            'Optional.of(value) creates an Optional that contains a value — it represents "something was found." Optional.empty() creates an Optional with nothing inside — it represents "nothing was found." In tests, you use when(repository.findById(any())).thenReturn(Optional.of(employee)) to simulate finding a record, or .thenReturn(Optional.empty()) to simulate a missing record.',
        },
        {
          term: 'ArgumentMatchers.any()',
          explanation:
            'any() is a Mockito "argument matcher." It means "match this mock call no matter what argument is passed." Without it, Mockito would only match the exact UUID value you pass. Since UUIDs are randomly generated in tests, using any() is simpler — it tells Mockito to match the call regardless of which specific UUID is used.',
        },
        {
          term: 'assertThatThrownBy()',
          explanation:
            'assertThatThrownBy() is an AssertJ method for testing that a piece of code throws an exception. You pass a lambda containing the code that should throw, then chain .isInstanceOf(SomeException.class) to verify the exception type. If no exception is thrown, the assertion fails. This is the standard way to test exception scenarios without ugly try-catch blocks in your test.',
        },
      ],
      checklist: [
        'Open EmployeeServiceTest.java (created in S1-005) and add the two new test methods shown in the example.',
        'Add the getById_found() test: configure the mock to return Optional.of(employee), call service.getById(UUID.randomUUID()), assert the result equals the expected response.',
        'Add the getById_notFound() test: configure the mock to return Optional.empty(), assert that calling service.getById() throws EmployeeNotFoundException.',
        'Use when(repository.findById(any())).thenReturn(...) — the any() matcher works for any UUID value.',
        'Run the tests with: cd employee-service && ./mvnw.cmd test -Dtest=EmployeeServiceTest',
        'Both tests should be green. Commit with message: test(S1-006): unit tests for get employee',
      ],
      examples: [
        {
          lang: 'java',
          label: 'EmployeeServiceTest.java — getById() tests',
          code: `package com.timetracker.employee.service;

import com.timetracker.employee.domain.Employee;
import com.timetracker.employee.domain.EmployeeStatus;
import com.timetracker.employee.dto.EmployeeResponse;
import com.timetracker.employee.exception.EmployeeNotFoundException;
import com.timetracker.employee.mapper.EmployeeMapper;
import com.timetracker.employee.repository.EmployeeRepository;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

// @ExtendWith(MockitoExtension.class) activates Mockito annotations in this test class
@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    // @Mock creates a fake (mock) object — no real database calls happen
    @Mock
    EmployeeRepository repository;

    @Mock
    EmployeeMapper mapper;

    // @InjectMocks creates the real EmployeeService and injects the mocks above into it
    @InjectMocks
    EmployeeService service;

    // ---- Tests from S1-005 (create) would be here ----

    @Test
    @DisplayName("getById returns EmployeeResponse when employee exists")
    void getById_found() {
        // ARRANGE: prepare test data
        UUID id = UUID.randomUUID(); // any UUID
        Employee employee = new Employee();  // a minimal Employee entity object

        // Build a realistic EmployeeResponse that the mapper would return
        EmployeeResponse expected = new EmployeeResponse(
                id, "Jane", "Doe", "jane@example.com",
                "Engineering", "Developer",
                LocalDate.of(2024, 1, 15), null,
                EmployeeStatus.ACTIVE, 0L,
                Instant.now(), Instant.now());

        // Tell the mock: when findById is called with ANY UUID, return this Optional
        when(repository.findById(any())).thenReturn(Optional.of(employee));
        // Tell the mock: when toResponse is called with this employee, return our expected response
        when(mapper.toResponse(employee)).thenReturn(expected);

        // ACT: call the method we are testing
        EmployeeResponse actual = service.getById(id);

        // ASSERT: verify we got back what we expected
        assertThat(actual).isEqualTo(expected);
    }

    @Test
    @DisplayName("getById throws EmployeeNotFoundException when employee does not exist")
    void getById_notFound() {
        // ARRANGE: tell the mock to return an empty Optional — simulating "not in database"
        when(repository.findById(any())).thenReturn(Optional.empty());

        // ACT + ASSERT: verify that calling getById throws the right exception
        assertThatThrownBy(() -> service.getById(UUID.randomUUID()))
                .isInstanceOf(EmployeeNotFoundException.class);
        // Note: we don't need to verify the exception message here,
        // but you could chain .hasMessageContaining("not found") if you wanted to.
    }
}`,
        },
        {
          lang: 'bash',
          label: 'Run only the service tests',
          code: `# From the employee-service directory
JAVA_HOME="C:/Program Files/Eclipse Adoptium/jdk-25.0.2.10-hotspot" \\
  ./mvnw.cmd test -Dtest=EmployeeServiceTest

# Expected output:
# [INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
# (2 from S1-005 + 2 new from S1-006)`,
        },
      ],
      links: [
        { label: 'JUnit 5 — Writing Tests', url: 'https://junit.org/junit5/docs/current/user-guide/#writing-tests' },
        { label: 'Mockito — when/thenReturn', url: 'https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/Mockito.html#when(T)' },
        { label: 'AssertJ — assertThatThrownBy', url: 'https://assertj.github.io/doc/#assertj-core-exception-assertions' },
        { label: 'Optional — Java docs', url: 'https://docs.oracle.com/en/java/docs/api/java.base/java/util/Optional.html' },
      ],
    },
  ],
};
