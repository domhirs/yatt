import { Story } from '../../models/step.model';

export const S1_014: Story = {
  id: 'S1-014',
  title: 'S1-014 — Integration Tests',
  tasks: [
    {
      id: 'T-014-01',
      title: 'Testcontainers Setup',
      description:
        'What is an integration test? A unit test verifies one class in isolation using mocks. ' +
        'An integration test verifies that multiple components work correctly together — including the real database, ' +
        'real HTTP parsing, real Flyway migrations, and real transaction management. ' +
        'Integration tests catch a different class of bugs: wiring mistakes, SQL errors, transaction boundary problems, ' +
        'and type mapping issues that are invisible to unit tests.\n\n' +
        'The challenge is the database. You need a real PostgreSQL for integration tests, but you cannot rely on a developer ' +
        'having one running locally, and you cannot share a database between test runs (tests would interfere with each other). ' +
        'Testcontainers solves this by starting a real PostgreSQL Docker container automatically when your tests start, ' +
        'running all your tests against it, and tearing it down when tests finish.\n\n' +
        'Spring Boot 3.1+ added @ServiceConnection — a magic annotation that reads the container\'s dynamically assigned port and URL ' +
        'and automatically configures the Spring DataSource to point to it. Before this annotation existed, you had to ' +
        'use @DynamicPropertySource with a callback method to manually wire the container URL into Spring\'s properties. ' +
        '@ServiceConnection does all of that automatically.\n\n' +
        'The abstract base class pattern is important for performance. If each test class created its own container, ' +
        'you would spend more time starting/stopping containers than running tests. ' +
        'By declaring the container as static in the base class, Testcontainers reuses the same container across all subclasses. ' +
        'Flyway migrations run once; all tests share the same database instance (but use @Transactional rollbacks to stay isolated).',
      concepts: [
        {
          term: 'Testcontainers',
          explanation:
            'A Java library that starts real Docker containers from within your test code. ' +
            'new PostgreSQLContainer("postgres:17") downloads and starts the official postgres:17 Docker image. ' +
            'Testcontainers assigns a random available host port, so multiple test runs never conflict. ' +
            'The container starts before any tests run and stops automatically after they finish.',
        },
        {
          term: '@ServiceConnection',
          explanation:
            'A Spring Boot 3.1+ annotation that wires a Testcontainers container directly to Spring\'s auto-configuration. ' +
            'When placed on a PostgreSQLContainer field, it reads the container\'s JDBC URL, username, and password ' +
            'and configures the DataSource bean to use them — no manual property wiring needed. ' +
            'It replaces the older @DynamicPropertySource pattern.',
        },
        {
          term: '@SpringBootTest(webEnvironment = RANDOM_PORT)',
          explanation:
            'Starts the full Spring application context (all beans, all configuration) on a random available HTTP port. ' +
            'RANDOM_PORT avoids conflicts if multiple test runs happen in parallel. ' +
            'TestRestTemplate is pre-configured to talk to this random port, so you do not need to know the port number.',
        },
        {
          term: 'static Container Field',
          explanation:
            'Declaring the PostgreSQLContainer as static means one container instance is shared across all instances of the test class ' +
            'and all subclasses. Testcontainers starts it once before any @Test methods run and stops it after all of them finish. ' +
            'If it were not static (instance field), a new container would start for every test method — extremely slow.',
        },
        {
          term: '@ActiveProfiles("test")',
          explanation:
            'Tells Spring to load application-test.yaml (or application-test.properties) on top of the default config. ' +
            'The test profile typically disables things like email sending, sets shorter timeouts, ' +
            'and may override any config that does not apply in tests. ' +
            '@ServiceConnection overrides the database URL regardless of what is in the test profile.',
        },
        {
          term: 'TestRestTemplate',
          explanation:
            'A test-friendly version of Spring\'s RestTemplate. Pre-configured to point to the test server started by @SpringBootTest. ' +
            'Unlike WebTestClient (reactive), TestRestTemplate is synchronous — it waits for each HTTP response before continuing. ' +
            'It does not throw exceptions on 4xx/5xx responses — it returns the ResponseEntity, letting you assert on the status code.',
        },
      ],
      checklist: [
        'Open employee-service/pom.xml',
        'Add the Testcontainers BOM inside <dependencyManagement> to manage versions: groupId=org.testcontainers, artifactId=testcontainers-bom, version=1.20.4, type=pom, scope=import',
        'Add two test-scoped dependencies: spring-boot-testcontainers (groupId=org.springframework.boot) and postgresql (groupId=org.testcontainers)',
        'Create AbstractIntegrationTest.java in src/test/java/com/timetracker/employee/',
        'Annotate with @SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT) and @ActiveProfiles("test")',
        'Add: @Container @ServiceConnection static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17").withDatabaseName("employee_test_db").withUsername("test_user").withPassword("test_pass")',
        'Add: @Autowired protected TestRestTemplate restTemplate',
        'Run: mvn test -pl employee-service — verify the container starts and Flyway migrations run',
        'Commit: chore(S1-014): configure Testcontainers for integration tests',
      ],
      examples: [
        {
          lang: 'xml',
          label: 'pom.xml — Testcontainers BOM and dependencies',
          code: `<!-- Add inside <dependencyManagement><dependencies>: -->
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>testcontainers-bom</artifactId>
    <version>1.20.4</version>
    <!-- type=pom scope=import: imports all version declarations from this BOM. -->
    <!-- After this, you can add testcontainers dependencies WITHOUT specifying versions — -->
    <!-- the BOM manages them all consistently. -->
    <type>pom</type>
    <scope>import</scope>
</dependency>

<!-- Add inside <dependencies>: -->

<!-- Spring Boot's Testcontainers integration — provides @ServiceConnection support -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-testcontainers</artifactId>
    <scope>test</scope>
    <!-- scope=test: this jar is only on the classpath during test compilation and execution. -->
    <!-- It is NOT included in the production JAR built by mvn package. -->
</dependency>

<!-- Testcontainers PostgreSQL module — provides PostgreSQLContainer class -->
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>postgresql</artifactId>
    <scope>test</scope>
    <!-- No <version> needed — the BOM above manages it. -->
</dependency>`,
        },
        {
          lang: 'java',
          label: 'AbstractIntegrationTest.java — base class for all integration tests',
          code: `package com.timetracker.employee;

import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

// Starts the full Spring application context on a random port.
// RANDOM_PORT: picks any available port, avoiding conflicts with other running services.
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)

// Activates the "test" Spring profile (loads application-test.yaml / application-test.properties).
@ActiveProfiles("test")

// Enables Testcontainers JUnit 5 integration — manages container lifecycle automatically.
// The extension starts @Container fields before tests and stops them after.
@Testcontainers
abstract class AbstractIntegrationTest {

    // @Container: Testcontainers manages the lifecycle of this field.
    // static: ONE container is shared across all test classes that extend this base.
    //         Started once before any test runs, stopped after all tests finish.
    //         If non-static, a new container starts per test class — very slow.
    @Container
    // @ServiceConnection: Spring Boot reads the container's JDBC URL, username, and password
    // and automatically configures the DataSource bean to connect to this container.
    // This replaces the manual @DynamicPropertySource approach from older Spring Boot versions.
    @ServiceConnection
    static final PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:17")  // uses official postgres:17 Docker image
                    .withDatabaseName("employee_test_db")
                    .withUsername("test_user")
                    .withPassword("test_pass");
    // Testcontainers assigns a random host port (e.g., 54321) and maps it to container port 5432.
    // @ServiceConnection picks up this random port and configures Spring accordingly.

    // TestRestTemplate is pre-configured by Spring Boot to talk to the test server.
    // It knows the random port from RANDOM_PORT above.
    // protected: subclasses can use it directly without declaring it themselves.
    @Autowired
    protected TestRestTemplate restTemplate;
}`,
        },
      ],
      links: [
        {
          label: 'Testcontainers — Java Module',
          url: 'https://java.testcontainers.org/',
        },
        {
          label: 'Spring Boot — Testcontainers Integration',
          url: 'https://docs.spring.io/spring-boot/reference/testing/testcontainers.html',
        },
        {
          label: 'Spring Boot — @ServiceConnection',
          url: 'https://docs.spring.io/spring-boot/reference/testing/testcontainers.html#testing.testcontainers.service-connections',
        },
      ],
    },
    {
      id: 'T-014-02',
      title: 'CRUD Integration Tests',
      description:
        'What do CRUD integration tests verify? They test the full request-to-database-to-response path. ' +
        'A unit test with mocks verifies that the service calls the right method on the repository. ' +
        'An integration test verifies that the actual HTTP request reaches the controller, ' +
        'the controller calls the service, the service runs Hibernate correctly, Hibernate executes real SQL against PostgreSQL, ' +
        'and the response body has the right shape and values.\n\n' +
        'The test flow for "create and get" is the most fundamental: POST to create, ' +
        'extract the ID from the response, then GET by that ID and verify the data. ' +
        'This confirms both that creation worked and that retrieval works — two endpoints tested in one scenario.\n\n' +
        'For the PATCH test, we verify that only the fields sent in the request were changed — other fields retain their original values. ' +
        'This is the PATCH semantics requirement: partial update. If our service had a bug and always overwrote ' +
        'non-sent fields with null, the unit tests with mocks would not necessarily catch it — but the integration test would.\n\n' +
        'For the DELETE test (soft delete), we verify two things: the 204 No Content response, ' +
        'and that a subsequent GET returns status=INACTIVE. ' +
        'This confirms the employee was deactivated, not deleted, and is still retrievable.',
      concepts: [
        {
          term: 'End-to-End Test Path',
          explanation:
            'Integration tests exercise every layer: HTTP parsing (Spring MVC), controller, service, repository, Hibernate ORM, and the real database. ' +
            'No mocks are involved — every component is the real implementation. ' +
            'This makes them slower than unit tests (each test involves real SQL queries), but they catch wiring bugs that mocks cannot.',
        },
        {
          term: 'restTemplate.postForEntity()',
          explanation:
            'Sends an HTTP POST request with the given object as the JSON body and deserializes the response into the given class. ' +
            'postForEntity("/api/v1/employees", request, EmployeeResponse.class) returns a ResponseEntity<EmployeeResponse>. ' +
            'You can then call .getStatusCode(), .getHeaders(), and .getBody() to assert on the full response.',
        },
        {
          term: 'Location Header',
          explanation:
            'A standard HTTP response header returned with 201 Created responses that contains the URL of the newly created resource. ' +
            'For example: Location: http://localhost:8080/api/v1/employees/abc-123. ' +
            'The REST convention is to always include a Location header on 201 responses. ' +
            'In the test, we assert it is not null to verify the controller is setting it correctly.',
        },
        {
          term: '@Transactional in Integration Tests',
          explanation:
            'You can annotate integration test methods with @Transactional, which causes Spring to roll back the database transaction ' +
            'after each test — leaving the database clean for the next test. ' +
            'However, for tests that make HTTP calls via TestRestTemplate, the transaction runs in the server\'s thread, ' +
            'not the test thread. The rollback does not affect the server-side transaction. ' +
            'Instead, you may need to clean up data manually or use a shared database that accumulates data across tests.',
        },
        {
          term: 'HttpStatus Constants',
          explanation:
            'Spring\'s HttpStatus enum contains named constants for all standard HTTP status codes. ' +
            'HttpStatus.CREATED is 201, HttpStatus.OK is 200, HttpStatus.NO_CONTENT is 204. ' +
            'Using constants instead of integers (assertThat(status).isEqualTo(201)) makes tests more readable ' +
            'and avoids magic numbers.',
        },
      ],
      checklist: [
        'Create EmployeeIntegrationTest.java in src/test/java/com/timetracker/employee/',
        'Extend AbstractIntegrationTest',
        'Write test createAndGet: POST a new employee, assert 201 and Location header, GET by extracted ID, assert 200 and correct email',
        'Write test patchEmployee: create an employee, PATCH only the department field, assert 200 and that department changed but other fields are unchanged',
        'Write test deleteEmployee: create an employee, DELETE it, assert 204; then GET the same ID and assert status is INACTIVE',
        'Write test listEmployees: create two employees, DELETE one, GET /api/v1/employees, assert only one active employee appears',
        'Add a private helper method createEmployee(String email) that POSTs an employee and returns the created EmployeeResponse',
        'Run the tests: mvn test -pl employee-service — all should pass',
        'Commit: test(S1-014): CRUD integration tests against Testcontainers PostgreSQL',
      ],
      examples: [
        {
          lang: 'java',
          label: 'EmployeeIntegrationTest.java — CRUD tests',
          code: `package com.timetracker.employee;

import com.timetracker.employee.dto.CreateEmployeeRequest;
import com.timetracker.employee.dto.EmployeeResponse;
import com.timetracker.employee.dto.UpdateEmployeeRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

// No @SpringBootTest here — inherited from AbstractIntegrationTest.
// The full Spring context and Testcontainers container are already set up by the base class.
class EmployeeIntegrationTest extends AbstractIntegrationTest {

    @Test
    @DisplayName("POST creates employee, GET retrieves it with correct data")
    void createAndGet() {
        // Build the request DTO — all required fields
        var request = new CreateEmployeeRequest(
                "Jane", "Doe", "jane.it@test.com",
                "Engineering", "Developer",
                LocalDate.of(2024, 1, 1),
                null);  // no manager — Jane is a root employee

        // Send the POST request. The server processes it through the full stack:
        // controller → service → Hibernate → real PostgreSQL
        ResponseEntity<EmployeeResponse> createResp =
                restTemplate.postForEntity("/api/v1/employees", request, EmployeeResponse.class);

        // Assert 201 Created — the resource was successfully created
        assertThat(createResp.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        // Assert the Location header is present — REST convention for 201 responses
        assertThat(createResp.getHeaders().getLocation()).isNotNull();
        // e.g., Location: http://localhost:PORT/api/v1/employees/abc-123-...

        // Extract the created employee's ID from the response body
        UUID id = createResp.getBody().id();
        assertThat(id).isNotNull();

        // Send a GET request to retrieve the employee by ID
        ResponseEntity<EmployeeResponse> getResp =
                restTemplate.getForEntity("/api/v1/employees/" + id, EmployeeResponse.class);

        // Assert 200 OK
        assertThat(getResp.getStatusCode()).isEqualTo(HttpStatus.OK);

        // Assert the data was persisted correctly
        assertThat(getResp.getBody().email()).isEqualTo("jane.it@test.com");
        assertThat(getResp.getBody().firstName()).isEqualTo("Jane");
        assertThat(getResp.getBody().status()).isEqualTo(EmployeeStatus.ACTIVE);
    }

    @Test
    @DisplayName("PATCH updates only the specified fields, leaving others unchanged")
    void patchEmployee() {
        // Create an employee first
        EmployeeResponse created = createEmployee("patch.test@test.com");

        // Build a PATCH request that only changes department — other fields are null (not sent)
        var patchRequest = new UpdateEmployeeRequest(
                null,  // firstName — not changing
                null,  // lastName — not changing
                null,  // email — not changing
                "Product",  // department — CHANGING this
                null,  // role — not changing
                null,  // hireDate — not changing
                null,  // managerId — not changing
                created.version());  // version — REQUIRED for optimistic locking check

        // PATCH uses HttpEntity to wrap the body, and exchange() for non-GET/POST methods
        var entity = new HttpEntity<>(patchRequest);
        ResponseEntity<EmployeeResponse> patchResp = restTemplate.exchange(
                "/api/v1/employees/" + created.id(),
                HttpMethod.PATCH,
                entity,
                EmployeeResponse.class);

        assertThat(patchResp.getStatusCode()).isEqualTo(HttpStatus.OK);

        EmployeeResponse updated = patchResp.getBody();
        // Department should have changed
        assertThat(updated.department()).isEqualTo("Product");
        // All other fields should be unchanged
        assertThat(updated.firstName()).isEqualTo(created.firstName());
        assertThat(updated.email()).isEqualTo(created.email());
        // Version should have incremented (optimistic locking)
        assertThat(updated.version()).isGreaterThan(created.version());
    }

    @Test
    @DisplayName("DELETE deactivates employee (204), then GET returns status INACTIVE")
    void deleteEmployee() {
        EmployeeResponse created = createEmployee("delete.test@test.com");

        // Send DELETE request
        ResponseEntity<Void> deleteResp = restTemplate.exchange(
                "/api/v1/employees/" + created.id(),
                HttpMethod.DELETE,
                null,  // no request body for DELETE
                Void.class);

        // Assert 204 No Content — successful deletion with no response body
        assertThat(deleteResp.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        // The employee should still be retrievable (soft delete — not removed from database)
        ResponseEntity<EmployeeResponse> getResp =
                restTemplate.getForEntity("/api/v1/employees/" + created.id(), EmployeeResponse.class);
        assertThat(getResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        // But status should now be INACTIVE
        assertThat(getResp.getBody().status()).isEqualTo(EmployeeStatus.INACTIVE);
    }

    @Test
    @DisplayName("GET /employees returns paginated list with only ACTIVE employees")
    void listEmployees_returnsOnlyActive() {
        // Create two employees
        EmployeeResponse active = createEmployee("active.list@test.com");
        EmployeeResponse toDelete = createEmployee("todelete.list@test.com");

        // Deactivate one
        restTemplate.delete("/api/v1/employees/" + toDelete.id());

        // List all employees
        ResponseEntity<PagedEmployeeResponse> listResp =
                restTemplate.getForEntity("/api/v1/employees", PagedEmployeeResponse.class);

        assertThat(listResp.getStatusCode()).isEqualTo(HttpStatus.OK);

        // The inactive employee should NOT be in the results
        // (Note: this test may be affected by other tests' data if running in the same database.
        //  In a clean test database, we can assert exact counts. Otherwise, just verify
        //  no INACTIVE employees appear in the content.)
        assertThat(listResp.getBody().content())
                .extracting(EmployeeResponse::status)
                .allMatch(status -> status == EmployeeStatus.ACTIVE);
    }

    // ---- Helper methods ----

    // Creates an employee with the given email and returns the created EmployeeResponse.
    // Used by multiple tests to set up prerequisite data.
    private EmployeeResponse createEmployee(String email) {
        var request = new CreateEmployeeRequest(
                "Test", "User", email,
                "Engineering", "Developer",
                LocalDate.of(2023, 6, 1),
                null);
        ResponseEntity<EmployeeResponse> resp =
                restTemplate.postForEntity("/api/v1/employees", request, EmployeeResponse.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return resp.getBody();
    }
}`,
        },
      ],
      links: [
        {
          label: 'Spring Boot — Testing with TestRestTemplate',
          url: 'https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html#testing.spring-boot-applications.with-running-server',
        },
        {
          label: 'AssertJ — Core Assertions',
          url: 'https://assertj.github.io/doc/#basic-assertions',
        },
      ],
    },
    {
      id: 'T-014-03',
      title: 'Edge Case Integration Tests',
      description:
        'What are edge case tests? They test the failure paths — the scenarios where something goes wrong and the API ' +
        'must return the right error response. Testing happy paths is necessary but not sufficient. ' +
        'You also need to know that duplicate email returns 409, not 500; that a missing employee returns 404, not an empty body; ' +
        'that a garbage UUID path returns 400, not a stack trace.\n\n' +
        'These tests are especially valuable as integration tests because they exercise the GlobalExceptionHandler end-to-end. ' +
        'A unit test of the exception handler just verifies the handler logic directly. ' +
        'An integration test verifies the entire exception flow: exception is thrown in the service, ' +
        'bubbles through the controller, Spring finds the right @ExceptionHandler, and the response body is correct.\n\n' +
        'The optimistic locking test (409 on stale version) is the most complex because it requires setting up a conflict: ' +
        'create an employee, do one successful update (which increments the version), then try to update again with the old version. ' +
        'Hibernate detects that the version in the request does not match the version in the database and throws ObjectOptimisticLockingFailureException.\n\n' +
        'The non-UUID path test (400 Bad Request) is simple but important. When the URL path is /api/v1/employees/not-a-uuid, ' +
        'Spring tries to convert "not-a-uuid" to UUID and fails with MethodArgumentTypeMismatchException. ' +
        'Our GlobalExceptionHandler converts this to 400 Bad Request.',
      concepts: [
        {
          term: 'Conflict (409) vs Validation Error (422)',
          explanation:
            '409 Conflict means the request is valid (correct format, correct types) but conflicts with the current state of the server. ' +
            'Duplicate email is a conflict — the email format is valid, but it collides with an existing record. ' +
            '422 Unprocessable Entity means the request body is syntactically valid JSON but semantically invalid — ' +
            'field values violate business rules (blank name, invalid email format). ' +
            'The distinction matters for API consumers who need to know whether to show a field error or a general error.',
        },
        {
          term: 'Optimistic Locking Conflict Test',
          explanation:
            'To test the 409 stale version scenario, you must: (1) create an employee, (2) do a successful PATCH (this increments the version), ' +
            '(3) try to PATCH again using the original version number. ' +
            'Step 3 fails because the database now has version 2, but the request carries version 1 — they do not match. ' +
            'Hibernate throws ObjectOptimisticLockingFailureException, which the global handler maps to 409.',
        },
        {
          term: 'ErrorResponse Deserialization',
          explanation:
            'In error response tests, we deserialize the response body into ErrorResponse.class instead of EmployeeResponse.class. ' +
            'restTemplate.postForEntity(url, request, ErrorResponse.class) tells Jackson to parse the JSON body as an ErrorResponse. ' +
            'We can then assert on resp.getBody().status(), resp.getBody().message(), etc.',
        },
        {
          term: '400 Bad Request for Invalid Path Variable',
          explanation:
            'When the {id} path variable cannot be parsed as a UUID (e.g., /employees/not-a-uuid), ' +
            'Spring throws MethodArgumentTypeMismatchException before the controller method is even called. ' +
            'The GlobalExceptionHandler catches it and returns 400 Bad Request. ' +
            'This is automatic — no code in the controller handles this. The global handler does it all.',
        },
      ],
      checklist: [
        'In EmployeeIntegrationTest.java, add test: createDuplicateEmail — create an employee, try to create another with the same email, assert 409 and message contains the email',
        'Add test: createInvalidEmail — POST with email="not-an-email", assert 422 and details list contains a field error for "email"',
        'Add test: deleteManagerWithReports — create a manager, create a report assigned to that manager, try to DELETE the manager, assert 409',
        'Add test: getUnknownEmployee — GET /api/v1/employees/{random-uuid}, assert 404',
        'Add test: getWithNonUUID — GET /api/v1/employees/not-a-uuid, assert 400',
        'Add test: patchWithStaleVersion — create employee, do one successful PATCH (increments version), PATCH again with old version number, assert 409',
        'Run all tests: mvn test -pl employee-service — all should pass',
        'Commit: test(S1-014): edge case integration tests',
      ],
      examples: [
        {
          lang: 'java',
          label: 'EmployeeIntegrationTest.java — error case tests',
          code: `package com.timetracker.employee;

import com.timetracker.employee.dto.CreateEmployeeRequest;
import com.timetracker.employee.dto.ErrorResponse;
import com.timetracker.employee.dto.EmployeeResponse;
import com.timetracker.employee.dto.UpdateEmployeeRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class EmployeeIntegrationTest extends AbstractIntegrationTest {

    // ... CRUD tests from T-014-02 ...

    // ---- Error case tests ----

    @Test
    @DisplayName("POST with duplicate email returns 409 Conflict")
    void createDuplicateEmail_returnsConflict() {
        // First creation — succeeds
        createEmployee("alice.dup@test.com");

        // Second creation with the SAME email — should fail
        var duplicate = new CreateEmployeeRequest(
                "Bob", "Smith", "alice.dup@test.com",  // duplicate email
                "HR", "Manager", LocalDate.now(), null);

        // Deserialize the error response as ErrorResponse (not EmployeeResponse)
        ResponseEntity<ErrorResponse> resp =
                restTemplate.postForEntity("/api/v1/employees", duplicate, ErrorResponse.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);  // 409
        assertThat(resp.getBody().status()).isEqualTo(409);
        // The exception message includes the email — verify it appears in the response
        assertThat(resp.getBody().message()).contains("alice.dup@test.com");
    }

    @Test
    @DisplayName("POST with invalid email format returns 422 Unprocessable Entity with field error")
    void createInvalidEmail_returns422() {
        var request = new CreateEmployeeRequest(
                "Jane", "Doe",
                "this-is-not-an-email",  // invalid email format — violates @Email constraint
                "Engineering", "Developer",
                LocalDate.of(2024, 1, 1), null);

        ResponseEntity<ErrorResponse> resp =
                restTemplate.postForEntity("/api/v1/employees", request, ErrorResponse.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);  // 422

        // The details list should contain one entry for the "email" field
        assertThat(resp.getBody().details())
                .isNotEmpty()
                .anyMatch(detail -> detail.field().equals("email"));
    }

    @Test
    @DisplayName("DELETE manager with active reports returns 409 Conflict")
    void deleteManagerWithReports_returnsConflict() {
        // Create the manager
        EmployeeResponse manager = createEmployee("manager.del@test.com");

        // Create a report that reports to the manager
        var reportRequest = new CreateEmployeeRequest(
                "Report", "Person", "report.del@test.com",
                "Engineering", "Developer",
                LocalDate.of(2023, 1, 1),
                manager.id());  // set manager

        restTemplate.postForEntity("/api/v1/employees", reportRequest, EmployeeResponse.class);

        // Try to delete the manager — should fail because they have an active report
        ResponseEntity<ErrorResponse> resp = restTemplate.exchange(
                "/api/v1/employees/" + manager.id(),
                HttpMethod.DELETE,
                null,
                ErrorResponse.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);  // 409
        // The error message should mention the active report count
        assertThat(resp.getBody().message()).contains("1 active direct report");
    }

    @Test
    @DisplayName("GET non-existent employee returns 404 Not Found")
    void getUnknownEmployee_returns404() {
        // Use a randomly generated UUID that certainly does not exist in the database
        UUID nonExistentId = UUID.randomUUID();

        ResponseEntity<ErrorResponse> resp = restTemplate.getForEntity(
                "/api/v1/employees/" + nonExistentId, ErrorResponse.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);  // 404
        assertThat(resp.getBody().status()).isEqualTo(404);
        assertThat(resp.getBody().message()).contains(nonExistentId.toString());
    }

    @Test
    @DisplayName("GET with non-UUID path variable returns 400 Bad Request")
    void getWithNonUUID_returns400() {
        // "not-a-uuid" cannot be parsed as UUID — Spring throws MethodArgumentTypeMismatchException
        // which GlobalExceptionHandler maps to 400 Bad Request
        ResponseEntity<ErrorResponse> resp = restTemplate.getForEntity(
                "/api/v1/employees/not-a-uuid", ErrorResponse.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);  // 400
        assertThat(resp.getBody().status()).isEqualTo(400);
    }

    @Test
    @DisplayName("PATCH with stale version number returns 409 Conflict (optimistic locking)")
    void patchWithStaleVersion_returnsConflict() {
        // Step 1: Create an employee. Initial version is 0.
        EmployeeResponse created = createEmployee("stale.version@test.com");
        Long originalVersion = created.version();  // version = 0

        // Step 2: Do a successful PATCH. This increments the version to 1 in the database.
        var firstPatch = new UpdateEmployeeRequest(
                null, null, null, "Product", null, null, null,
                originalVersion);  // correct version — this PATCH succeeds
        restTemplate.exchange(
                "/api/v1/employees/" + created.id(),
                HttpMethod.PATCH,
                new HttpEntity<>(firstPatch),
                EmployeeResponse.class);
        // Database now has version = 1

        // Step 3: Try to PATCH again using the ORIGINAL version (0 = stale).
        // Hibernate will detect the mismatch: we send version=0, but database has version=1.
        var stalePatch = new UpdateEmployeeRequest(
                null, null, null, "Sales", null, null, null,
                originalVersion);  // STALE version — this should fail

        ResponseEntity<ErrorResponse> resp = restTemplate.exchange(
                "/api/v1/employees/" + created.id(),
                HttpMethod.PATCH,
                new HttpEntity<>(stalePatch),
                ErrorResponse.class);

        // Hibernate throws ObjectOptimisticLockingFailureException,
        // which GlobalExceptionHandler maps to 409 Conflict
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);  // 409
        assertThat(resp.getBody().message()).containsIgnoringCase("modified");
    }

    // Helper: creates an employee and returns the EmployeeResponse
    private EmployeeResponse createEmployee(String email) {
        var request = new CreateEmployeeRequest(
                "Test", "User", email, "Eng", "Dev",
                LocalDate.of(2023, 1, 1), null);
        var resp = restTemplate.postForEntity("/api/v1/employees", request, EmployeeResponse.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return resp.getBody();
    }
}`,
        },
        {
          lang: 'bash',
          label: 'Running only the integration tests',
          code: `# Run all tests (unit + integration) in employee-service
mvn test -pl employee-service

# Run only integration test classes (by name pattern)
mvn test -pl employee-service -Dtest="*IntegrationTest"

# Run a single test method
mvn test -pl employee-service -Dtest="EmployeeIntegrationTest#createAndGet"

# Run tests with verbose output to see Testcontainers startup logs
mvn test -pl employee-service -Dsurefire.useFile=false

# What you should see in the output:
# [INFO] --- Pulling image: postgres:17
# [INFO] --- Container STARTED in 3.2s
# [INFO] --- Flyway: Successfully applied 3 migrations
# [INFO] Tests run: 10, Failures: 0, Errors: 0, Skipped: 0`,
        },
      ],
      links: [
        {
          label: 'Testcontainers — JUnit 5 Integration',
          url: 'https://java.testcontainers.org/test_framework_integration/junit_5/',
        },
        {
          label: 'Spring Boot — Testing',
          url: 'https://docs.spring.io/spring-boot/reference/testing/index.html',
        },
        {
          label: 'AssertJ — Exception and Collection Assertions',
          url: 'https://assertj.github.io/doc/#assertj-core-assertions-guide',
        },
      ],
    },
  ],
};
