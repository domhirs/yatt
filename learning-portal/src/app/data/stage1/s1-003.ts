import { Story } from '../../models/step.model';

export const S1_003: Story = {
  id: 'S1-003',
  title: 'S1-003 — OpenAPI Spec',
  tasks: [
    {
      id: 'T-003-01',
      title: 'Write OpenAPI 3.1 Specification',
      description:
        'OpenAPI is a standard format for describing REST APIs in a language-agnostic way. An ' +
        'OpenAPI specification (usually a YAML file) defines every endpoint your API offers: what ' +
        'path it is at, what HTTP method to use, what the request body looks like, what responses ' +
        'to expect, and what data types are involved. It is a contract between your backend and ' +
        'anything that calls it — a frontend, a mobile app, or another service.\n\n' +
        'The "API-first" approach means writing this specification before writing any implementation ' +
        'code. This sounds backwards, but it has a major advantage: you think through the API design ' +
        'without the constraints of existing code. Once the spec is written, it becomes the source ' +
        'of truth. The implementation must match the spec, not the other way around. If the spec ' +
        'and the code disagree, the spec wins and the code must be corrected.\n\n' +
        'OpenAPI 3.1 is the current standard and aligns closely with JSON Schema. The YAML structure ' +
        'has three main sections: info (metadata about the API), paths (the endpoints), and components ' +
        '(reusable schemas and responses that endpoints reference with $ref). Breaking schemas into ' +
        'components/schemas and referencing them with $ref prevents duplication — if EmployeeResponse ' +
        'is used in ten endpoints, you define it once and reference it ten times.\n\n' +
        'The spec goes in docs/api/employee-service.yaml in the repository root. The openapi-generator ' +
        'Maven plugin (configured in the next task) will read this file and generate Java interfaces ' +
        'from it automatically during the build. Any time you update the spec and rebuild, the ' +
        'generated code updates too — keeping the contract and implementation in sync.',
      concepts: [
        {
          term: 'OpenAPI Specification',
          explanation:
            'OpenAPI (formerly Swagger) is a standard for documenting REST APIs in a machine-readable ' +
            'format. A spec file describes every endpoint, its parameters, request/response schemas, ' +
            'and HTTP status codes. Tools can read the spec to generate documentation, client SDKs, ' +
            'server stubs, and validation code automatically.',
        },
        {
          term: 'API-first design',
          explanation:
            'API-first means the spec is written and agreed upon before any implementation code. ' +
            'This separates the "what" (the contract) from the "how" (the implementation). Frontend ' +
            'and backend teams can work in parallel — the frontend uses a mock server from the spec ' +
            'while the backend implements it. The spec also serves as documentation.',
        },
        {
          term: '$ref (schema reference)',
          explanation:
            '$ref: "#/components/schemas/EmployeeResponse" is a JSON Pointer that references a schema ' +
            'defined elsewhere in the same file. This prevents copy-paste duplication: define ' +
            'EmployeeResponse once in components/schemas and reference it from as many endpoints as ' +
            'needed. When the schema changes, you update it in one place.',
        },
        {
          term: 'HTTP status codes',
          explanation:
            'Status codes communicate the result of an HTTP request. 200 OK = success. 201 Created = ' +
            'a new resource was created (POST). 204 No Content = success with no body (DELETE). ' +
            '400 Bad Request = malformed request. 404 Not Found = resource does not exist. ' +
            '409 Conflict = business rule violation (duplicate email). 422 Unprocessable Entity = ' +
            'request is well-formed but validation failed.',
        },
        {
          term: 'Request/Response schema',
          explanation:
            'A schema in OpenAPI defines the shape of a JSON object: the field names, their types, ' +
            'which are required, and any validation constraints like minimum length or format. ' +
            'The openapi-generator reads these schemas and produces matching Java record or class ' +
            'definitions, so you never write the DTO classes by hand.',
        },
        {
          term: 'servers block',
          explanation:
            'The servers block lists the base URLs where the API is hosted. Tools like Swagger UI ' +
            'and Postman use this to pre-populate the request URL. For a local dev server, ' +
            'url: http://localhost:8080 is correct. Production servers would be listed separately ' +
            'with their own URL.',
        },
      ],
      checklist: [
        'Create the directory docs/api/ in the repository root (not inside employee-service/).',
        'Create docs/api/employee-service.yaml and add the openapi, info, and servers sections from the first example.',
        'Define the paths section with all five endpoints: POST /api/v1/employees, GET /api/v1/employees/{id}, GET /api/v1/employees (with query parameters for pagination and search), PATCH /api/v1/employees/{id}, and DELETE /api/v1/employees/{id}.',
        'For each endpoint, define all expected response codes. POST returns 201 (created), 409 (duplicate email), 422 (validation error). GET /{id} returns 200 or 404. PATCH returns 200, 404, 409, or 422. DELETE returns 204 or 404.',
        'Define all schemas in the components/schemas section: EmployeeResponse, CreateEmployeeRequest, UpdateEmployeeRequest, PagedEmployeeResponse, ErrorResponse, and ValidationErrorDetail.',
        'Open the spec in Swagger Editor (https://editor.swagger.io) and paste it in — fix any YAML errors that the editor highlights.',
        'Commit: docs(S1-003): define OpenAPI spec for employee service',
      ],
      examples: [
        {
          lang: 'yaml',
          label: 'employee-service.yaml — info + servers + POST endpoint',
          code: `openapi: 3.1.0

info:
  title: Employee Service API
  version: 1.0.0
  description: >
    CRUD operations, search, and org-chart queries for employees.
    This is the API contract for the yatt employee-service.

servers:
  # Swagger UI and code generators use this URL as the base for all requests.
  - url: http://localhost:8080
    description: Local development server

paths:
  /api/v1/employees:

    # POST /api/v1/employees — Create a new employee
    post:
      summary: Create a new employee
      operationId: createEmployee   # Used by openapi-generator to name the Java method
      tags: [Employee]              # Groups endpoints in the generated Java interface
      requestBody:
        required: true
        content:
          application/json:
            schema:
              # $ref points to a schema defined in components/schemas below.
              # This avoids repeating the schema definition for every endpoint.
              $ref: '#/components/schemas/CreateEmployeeRequest'
      responses:
        '201':
          description: Employee created successfully
          headers:
            Location:
              description: URL of the newly created employee
              schema:
                type: string
                example: /api/v1/employees/550e8400-e29b-41d4-a716-446655440000
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EmployeeResponse'
        '409':
          description: An employee with this email already exists
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '422':
          description: Request body failed validation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

    # GET /api/v1/employees — List employees with pagination and optional search
    get:
      summary: List employees
      operationId: listEmployees
      tags: [Employee]
      parameters:
        - name: page
          in: query       # This is a query parameter: ?page=0
          schema:
            type: integer
            default: 0
        - name: size
          in: query
          schema:
            type: integer
            default: 20
        - name: q
          in: query       # Full-text search: ?q=Alice
          schema:
            type: string
      responses:
        '200':
          description: Paginated list of employees
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PagedEmployeeResponse'

  /api/v1/employees/{id}:

    # GET /api/v1/employees/{id} — Get one employee by ID
    get:
      summary: Get employee by ID
      operationId: getEmployee
      tags: [Employee]
      parameters:
        - name: id
          in: path        # {id} in the path — required
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Employee found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EmployeeResponse'
        '404':
          description: Employee not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

    # PATCH /api/v1/employees/{id} — Partial update
    patch:
      summary: Update employee (partial)
      operationId: updateEmployee
      tags: [Employee]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateEmployeeRequest'
      responses:
        '200':
          description: Employee updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EmployeeResponse'
        '404':
          description: Employee not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '409':
          description: Conflict — version mismatch or duplicate email
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '422':
          description: Validation failed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

    # DELETE /api/v1/employees/{id}
    delete:
      summary: Delete employee
      operationId: deleteEmployee
      tags: [Employee]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '204':
          description: Employee deleted (no response body)
        '404':
          description: Employee not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '409':
          description: Cannot delete — employee has active direct reports
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'`,
        },
        {
          lang: 'yaml',
          label: 'employee-service.yaml — components/schemas section',
          code: `components:
  schemas:

    # The response shape for a single employee.
    # Returned by GET /{id}, POST (after creation), and PATCH (after update).
    EmployeeResponse:
      type: object
      properties:
        id:
          type: string
          format: uuid          # UUID is serialised as a string in JSON
          example: 550e8400-e29b-41d4-a716-446655440000
        firstName:
          type: string
          example: Alice
        lastName:
          type: string
          example: Admin
        email:
          type: string
          format: email
          example: alice@example.com
        department:
          type: string
          example: Engineering
        role:
          type: string
          example: Senior Developer
        hireDate:
          type: string
          format: date          # ISO 8601 date: "2024-01-15"
          example: "2024-01-15"
        managerId:
          type: string
          format: uuid
          nullable: true        # NULL for top-level employees
          example: null
        status:
          type: string
          enum: [ACTIVE, INACTIVE]
        version:
          type: integer
          format: int64         # Matches Long in Java
          description: Optimistic locking version. Client must send this back on PATCH.
        createdAt:
          type: string
          format: date-time     # ISO 8601 datetime: "2024-01-15T10:30:00Z"
        updatedAt:
          type: string
          format: date-time

    # Request body for creating a new employee.
    # All fields except managerId are required.
    CreateEmployeeRequest:
      type: object
      required: [firstName, lastName, email, department, role, hireDate]
      properties:
        firstName:
          type: string
          minLength: 1
          maxLength: 100
        lastName:
          type: string
          minLength: 1
          maxLength: 100
        email:
          type: string
          format: email
        department:
          type: string
          minLength: 1
          maxLength: 100
        role:
          type: string
          minLength: 1
          maxLength: 100
        hireDate:
          type: string
          format: date
        managerId:
          type: string
          format: uuid
          nullable: true

    # Request body for PATCH (partial update). All fields are optional.
    # The client only sends the fields they want to change.
    UpdateEmployeeRequest:
      type: object
      properties:
        firstName:
          type: string
          maxLength: 100
        lastName:
          type: string
          maxLength: 100
        email:
          type: string
          format: email
        department:
          type: string
          maxLength: 100
        role:
          type: string
          maxLength: 100
        hireDate:
          type: string
          format: date
        managerId:
          type: string
          format: uuid
          nullable: true
        version:
          type: integer
          format: int64
          description: Must match the current version number for optimistic locking.

    # Paginated list response — wraps a page of employees with metadata.
    PagedEmployeeResponse:
      type: object
      properties:
        content:
          type: array
          items:
            $ref: '#/components/schemas/EmployeeResponse'
        page:
          type: integer
          description: Current page number (0-based)
        size:
          type: integer
          description: Number of items per page
        totalElements:
          type: integer
          format: int64
          description: Total number of employees matching the query
        totalPages:
          type: integer`,
        },
      ],
      links: [
        { label: 'OpenAPI 3.1 Specification', url: 'https://spec.openapis.org/oas/v3.1.0' },
        { label: 'Swagger Editor (online — paste your YAML here)', url: 'https://editor.swagger.io/' },
        { label: 'OpenAPI Guide — Describing Responses', url: 'https://swagger.io/docs/specification/describing-responses/' },
      ],
    },
    {
      id: 'T-003-02',
      title: 'OpenAPI Code Generation',
      description:
        'Code generation means a tool reads your OpenAPI spec and automatically produces Java source ' +
        'files from it. In this project, the openapi-generator-maven-plugin reads the spec during ' +
        'the Maven build (./mvnw package or ./mvnw generate-sources) and produces Java interfaces ' +
        'for the API endpoints and record classes for the DTOs.\n\n' +
        'The key setting is interfaceOnly: true. With this setting, the generator produces an ' +
        'interface (like EmployeeApi) with one method per endpoint. Your controller will implement ' +
        'this interface, which means the compiler enforces that your controller handles every ' +
        'endpoint defined in the spec. If you add a new endpoint to the spec but forget to ' +
        'implement it, the project will fail to compile.\n\n' +
        'The generated files appear under target/generated-sources/openapi/ and are added to the ' +
        'compile classpath automatically by the Maven plugin. You never edit these files directly — ' +
        'they are regenerated on every build. If you need to change the API shape, change the spec ' +
        'and rebuild.\n\n' +
        'The useJakartaEe: true setting is critical for Spring Boot 4. Spring Boot 3+ moved from ' +
        'the javax.* package namespace to jakarta.* (this was a major change when Jakarta EE took ' +
        'over stewardship of the Java EE APIs). Without this setting, the generated code will ' +
        'import javax.validation.* and javax.servlet.* which do not exist in Spring Boot 4, ' +
        'and the build will fail.',
      concepts: [
        {
          term: 'Code generation from spec',
          explanation:
            'The openapi-generator tool reads your OpenAPI YAML and generates Java source files that ' +
            'match the spec. You get Java interfaces for your controllers and Java records/classes for ' +
            'your request/response DTOs — all without writing them by hand. When the spec changes, ' +
            'regenerate and the compiler will tell you everywhere the implementation needs updating.',
        },
        {
          term: 'interfaceOnly: true',
          explanation:
            'When set to true, the generator only produces Java interfaces for the API endpoints — ' +
            'no concrete controller classes. Your own controller class will implement the generated ' +
            'interface. This is the "contract-first" pattern: the interface is the contract, and the ' +
            'compiler ensures your controller fulfils it.',
        },
        {
          term: 'Maven generate-sources phase',
          explanation:
            'Maven builds go through phases: validate, compile, test, package, etc. The ' +
            'generate-sources phase runs before compile. The openapi-generator plugin hooks into ' +
            'this phase and writes Java files into target/generated-sources/. When compile runs ' +
            'next, it compiles both your hand-written code and the generated code together.',
        },
        {
          term: 'useJakartaEe: true',
          explanation:
            'Spring Boot 3+ and 4+ use the jakarta.* package namespace (jakarta.validation, ' +
            'jakarta.servlet) instead of the old javax.* namespace. Setting useJakartaEe: true ' +
            'tells the generator to use the jakarta.* imports. Without this, generated code ' +
            'imports javax.validation.constraints.NotNull which does not exist in Spring Boot 4 ' +
            'and causes compilation errors.',
        },
        {
          term: 'useTags: true',
          explanation:
            'In the OpenAPI spec, each endpoint has a tags: [Employee] field. Setting useTags: true ' +
            'tells the generator to create one Java interface per tag. All endpoints tagged with ' +
            '"Employee" end up in one EmployeeApi interface. Without this, all endpoints are ' +
            'combined into a single DefaultApi interface.',
        },
      ],
      checklist: [
        'Open pom.xml in employee-service and add the openapi-generator-maven-plugin inside the <build><plugins> block, exactly as shown in the example.',
        'Verify the inputSpec path: ${project.basedir}/../docs/api/employee-service.yaml — the ../ goes up from employee-service/ to the repository root, then into docs/api/. Adjust if your layout differs.',
        'Set modelPackage to com.timetracker.employee.dto and apiPackage to com.timetracker.employee.api — these are where the generated Java files will be placed within target/generated-sources/.',
        'Run ./mvnw generate-sources from the employee-service directory. This runs only the code generation phase without compiling your own code.',
        'Open the generated files in target/generated-sources/openapi/src/main/java/ — you should see an EmployeeApi.java interface and DTO classes matching your spec schemas.',
        'Run ./mvnw compile to verify the generated code compiles without errors alongside your own code.',
        'Commit: chore(S1-003): add OpenAPI code generation',
      ],
      examples: [
        {
          lang: 'xml',
          label: 'pom.xml — openapi-generator-maven-plugin',
          code: `<!-- Add this plugin inside <build><plugins>...</plugins></build> in pom.xml -->

<plugin>
    <groupId>org.openapitools</groupId>
    <artifactId>openapi-generator-maven-plugin</artifactId>
    <version>7.12.0</version>

    <executions>
        <execution>
            <!-- Bind this execution to the generate-sources phase.
                 This runs BEFORE compilation, so generated code is available to compile. -->
            <goals>
                <goal>generate</goal>
            </goals>
            <configuration>
                <!-- Path to your OpenAPI spec file.
                     \${project.basedir} is employee-service/.
                     The "../" goes up to the repository root. -->
                <inputSpec>\${project.basedir}/../docs/api/employee-service.yaml</inputSpec>

                <!-- Use the Spring generator (produces Spring MVC annotations). -->
                <generatorName>spring</generatorName>

                <!-- Use the Spring Boot library variant of the Spring generator. -->
                <library>spring-boot</library>

                <!-- Package for generated DTO classes (CreateEmployeeRequest, EmployeeResponse, etc.) -->
                <modelPackage>com.timetracker.employee.dto</modelPackage>

                <!-- Package for generated API interfaces (EmployeeApi) -->
                <apiPackage>com.timetracker.employee.api</apiPackage>

                <configOptions>
                    <!-- Only generate interfaces, not concrete controller classes.
                         Your EmployeeController will implement the generated EmployeeApi interface.
                         This means the compiler enforces your controller matches the spec. -->
                    <interfaceOnly>true</interfaceOnly>

                    <!-- CRITICAL for Spring Boot 4: use jakarta.* instead of javax.* imports.
                         Without this, generated code will fail to compile under Spring Boot 4. -->
                    <useJakartaEe>true</useJakartaEe>

                    <!-- Create one interface per tag in the spec.
                         endpoints tagged [Employee] → EmployeeApi.java -->
                    <useTags>true</useTags>
                </configOptions>
            </configuration>
        </execution>
    </executions>
</plugin>`,
        },
        {
          lang: 'bash',
          label: 'Run code generation and verify output',
          code: `# From the employee-service directory:

# Run only the code generation phase (does not compile your code)
./mvnw generate-sources

# Inspect the generated files
ls target/generated-sources/openapi/src/main/java/com/timetracker/employee/api/
# Expected: EmployeeApi.java

ls target/generated-sources/openapi/src/main/java/com/timetracker/employee/dto/
# Expected: EmployeeResponse.java, CreateEmployeeRequest.java, etc.

# Now compile everything together (your code + generated code)
./mvnw compile
# Must complete with BUILD SUCCESS — no compilation errors`,
        },
      ],
      links: [
        { label: 'OpenAPI Generator — Spring generator docs', url: 'https://openapi-generator.tech/docs/generators/spring' },
        { label: 'OpenAPI Generator Maven Plugin', url: 'https://github.com/OpenAPITools/openapi-generator/tree/master/modules/openapi-generator-maven-plugin' },
      ],
    },
    {
      id: 'T-003-03',
      title: 'Error Response Contract',
      description:
        'A consistent error response format is as important as a consistent success response format. ' +
        'When your API returns a 404 or 422, the JSON body should have the same structure every time ' +
        'so clients can write a single error-parsing function instead of handling each endpoint ' +
        'differently. This is what the ErrorResponse schema defines.\n\n' +
        'Every error response in this API returns the same six fields: status (the HTTP status code ' +
        'as an integer, for convenience), error (the standard HTTP status phrase like "Not Found"), ' +
        'message (a human-readable description of what went wrong), details (an array of per-field ' +
        'validation errors — only populated for 422 responses), timestamp (when the error occurred), ' +
        'and path (which URL was called — useful when a client makes multiple concurrent requests).\n\n' +
        'The Java representation uses records. A Java record is a special class introduced in Java 16 ' +
        'that is immutable by design, generates its own constructor, getters, equals, hashCode, and ' +
        'toString automatically. Records are ideal for DTOs because DTOs are data carriers — they ' +
        'hold values and nothing else. No setters needed because you create them once and never mutate them.\n\n' +
        'The two static factory methods (of() and ofValidation()) are a design pattern called "named ' +
        'constructors". Instead of calling the record constructor directly (which requires you to ' +
        'remember the field order and always pass Instant.now()), you call a named method that ' +
        'expresses intent: ErrorResponse.of(404, "Not Found", "Employee not found", path).',
      concepts: [
        {
          term: 'Error contract',
          explanation:
            'An error contract is a promise about the shape of error responses. When every 4xx and 5xx ' +
            'response from your API has the same JSON structure, client developers can write one piece ' +
            'of error-handling code that works for every error. Without a contract, each error might ' +
            'have a different structure (or no body at all), making clients fragile.',
        },
        {
          term: 'Java record',
          explanation:
            'A record is a Java class designed specifically to hold data. Writing public record ' +
            'ErrorResponse(int status, String error, ...) {} automatically generates: a constructor ' +
            'that takes all parameters, getter methods (status(), error(), etc. — no "get" prefix), ' +
            'and correct equals(), hashCode(), and toString() implementations. Records are always ' +
            'final and their fields are always private and final — immutable by design.',
        },
        {
          term: 'Static factory method',
          explanation:
            'A static factory method is a static method on a class that returns an instance of that ' +
            'class. ErrorResponse.of(404, "Not Found", "message", "/path") is more readable than ' +
            'new ErrorResponse(404, "Not Found", "message", List.of(), Instant.now(), "/path") ' +
            'because it gives the creation a name, hides the List.of() and Instant.now() defaults, ' +
            'and you cannot accidentally pass arguments in the wrong order.',
        },
        {
          term: 'ValidationErrorDetail',
          explanation:
            'When Bean Validation fails (e.g. firstName is blank), Spring throws ' +
            'MethodArgumentNotValidException with a list of ConstraintViolation objects. Each ' +
            'violation has a field name and a message. ValidationErrorDetail is the DTO that ' +
            'carries one violation to the client: {field: "firstName", message: "must not be blank"}.',
        },
        {
          term: '422 Unprocessable Entity',
          explanation:
            '422 is the correct HTTP status for "the request was well-formed JSON, but the content ' +
            'failed business validation." 400 Bad Request is for malformed requests (not valid JSON, ' +
            'missing required header). 422 is for valid JSON that violates your rules (blank name, ' +
            'invalid email format, hire date in the future).',
        },
      ],
      checklist: [
        'Add the ErrorResponse and ValidationErrorDetail schemas to the components/schemas section of docs/api/employee-service.yaml as shown in the first example.',
        'Verify all 409 and 422 responses in the paths section reference $ref: \'#/components/schemas/ErrorResponse\' — consistency is the goal.',
        'Create the file src/main/java/com/timetracker/employee/dto/ValidationErrorDetail.java as a Java record with two fields: field and message.',
        'Create the file src/main/java/com/timetracker/employee/dto/ErrorResponse.java as a Java record with the static factory methods of() and ofValidation() shown in the second example.',
        'Verify both records compile: ./mvnw compile should succeed.',
        'Commit: docs(S1-003): define error contract schemas',
      ],
      examples: [
        {
          lang: 'yaml',
          label: 'OpenAPI schemas — ErrorResponse and ValidationErrorDetail',
          code: `# Add this to the components/schemas section in employee-service.yaml

components:
  schemas:
    # Standard error envelope — returned by every 4xx and 5xx response.
    ErrorResponse:
      type: object
      properties:
        status:
          type: integer
          description: HTTP status code (e.g. 404, 409, 422)
          example: 422
        error:
          type: string
          description: Standard HTTP status phrase
          example: "Unprocessable Entity"
        message:
          type: string
          description: Human-readable description of what went wrong
          example: "Validation failed for 2 fields"
        details:
          type: array
          description: Per-field validation errors (only populated for 422 responses)
          items:
            $ref: '#/components/schemas/ValidationErrorDetail'
        timestamp:
          type: string
          format: date-time
          description: When the error occurred (UTC)
        path:
          type: string
          description: The request path that caused the error
          example: "/api/v1/employees"

    # One entry in the details array — describes a single field validation failure.
    ValidationErrorDetail:
      type: object
      properties:
        field:
          type: string
          description: Name of the field that failed validation
          example: "email"
        message:
          type: string
          description: Why the validation failed
          example: "must be a well-formed email address"`,
        },
        {
          lang: 'java',
          label: 'ErrorResponse.java — record with factory methods',
          code: `// What this file does:
// Defines the standard error response shape returned by every error in the API.
// Uses a Java "record" for immutability and compact syntax.
// Static factory methods make it easy to create common error types without
// remembering the constructor parameter order.

package com.timetracker.employee.dto;

import java.time.Instant;
import java.util.List;

// "record" is a Java keyword (since Java 16) that declares an immutable data class.
// This single line replaces ~40 lines of traditional Java:
//   - private final fields
//   - a constructor that sets all fields
//   - getter methods (called status(), error(), etc. — no "get" prefix)
//   - equals(), hashCode(), toString() implementations
public record ErrorResponse(
    int status,                           // HTTP status code as an integer
    String error,                         // Standard HTTP phrase ("Not Found")
    String message,                       // Human-readable description
    List<ValidationErrorDetail> details,  // Per-field errors (empty for non-422)
    Instant timestamp,                    // When this error occurred
    String path                           // Which URL was called
) {

    // Static factory method for non-validation errors (404, 409, 500, etc.)
    // "static" means you call it as ErrorResponse.of(...) without creating an instance first.
    // This is cleaner than calling the constructor because:
    //   - You do not need to pass List.of() and Instant.now() explicitly
    //   - The method name "of" signals "create a simple error response"
    public static ErrorResponse of(int status, String error, String message, String path) {
        return new ErrorResponse(
            status,
            error,
            message,
            List.of(),      // No field-level details for non-validation errors
            Instant.now(),  // Set the timestamp automatically
            path
        );
    }

    // Static factory method specifically for 422 validation errors.
    // The name "ofValidation" makes the intent clear.
    // The details list carries one ValidationErrorDetail per failing field.
    public static ErrorResponse ofValidation(
            String message,
            List<ValidationErrorDetail> details,
            String path) {
        return new ErrorResponse(
            422,
            "Unprocessable Entity",
            message,
            details,
            Instant.now(),
            path
        );
    }
}`,
        },
        {
          lang: 'java',
          label: 'ValidationErrorDetail.java — one field error',
          code: `package com.timetracker.employee.dto;

// A record representing one validation failure.
// Example: field="email", message="must be a well-formed email address"
//
// These are collected into a List<ValidationErrorDetail> and placed
// in the ErrorResponse.details field for 422 responses.
public record ValidationErrorDetail(
    String field,    // The name of the Java field that failed (e.g. "firstName")
    String message   // The constraint message (e.g. "must not be blank")
) {}`,
        },
      ],
      links: [
        { label: 'RFC 7807 — Problem Details for HTTP APIs', url: 'https://datatracker.ietf.org/doc/html/rfc7807' },
        { label: 'Java Records (JEP 395)', url: 'https://openjdk.org/jeps/395' },
        { label: 'HTTP Status Codes — MDN Web Docs', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status' },
      ],
    },
  ],
};
