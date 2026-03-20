import { Story } from '../../models/step.model';

export const S1_008: Story = {
  id: 'S1-008',
  title: 'S1-008 — Update Employee',
  tasks: [
    {
      id: 'T-008-01',
      title: 'Service — Partial Update (PATCH)',
      description:
        'What is a partial update and why use PATCH instead of PUT?\n\n' +
        'HTTP defines two methods for updating resources: PUT and PATCH. PUT replaces the entire resource — you send all fields, and the server replaces everything. PATCH partially updates the resource — you send only the fields you want to change, and the server merges them into the existing record. For employee data, PATCH is almost always better: you would not want to require a caller to resend firstName, lastName, email, and hireDate just to update someone\'s department.\n\n' +
        'In this implementation, the UpdateEmployeeRequest record uses nullable fields. A null field in the request means "do not change this field." Only non-null fields are applied to the entity. The mapper\'s updateEntity() method implements this merge logic: if request.firstName() != null, update it; otherwise, leave the entity\'s current value.\n\n' +
        'The update operation has three business rules: (1) if the email is being changed, it must still be unique (but not collide with the employee\'s own current email — that is a valid "no-change"); (2) if the managerId is being changed, the new manager must exist and be ACTIVE; (3) an employee cannot be their own manager.\n\n' +
        'After applying the changes, you call repository.save(employee) to persist them. Because the employee entity was loaded in the same transaction, JPA knows which record to UPDATE in the database.',
      concepts: [
        {
          term: 'PATCH vs PUT',
          explanation:
            'PATCH performs a partial update — only the fields included in the request body are changed. PUT performs a full replacement — all fields must be provided and the entire resource is overwritten. PATCH is preferred for resources with many optional fields, or when clients should not need to know the current state of all fields just to update one.',
        },
        {
          term: 'Partial update with nullable fields',
          explanation:
            'In a PATCH request DTO, all fields are nullable. If the client sends {"department": "Marketing"}, only department is non-null, so only department gets updated. The other fields remain at their current values in the database. This "null means no-change" pattern requires the mapper to check each field individually before applying it.',
        },
        {
          term: 'existsByEmailAndIdNot()',
          explanation:
            'This is a custom Spring Data query method that checks if any employee OTHER THAN the given id has the given email. This is needed for email uniqueness validation during updates: you need to allow saving the same email if it belongs to this very employee (no actual change), but reject it if another employee already uses it. The method name is parsed by Spring Data and generates: SELECT COUNT(*) > 0 FROM employee WHERE email = ? AND id != ?',
        },
        {
          term: 'Dirty checking',
          explanation:
            'JPA has a feature called dirty checking: when you load an entity from the database and modify it within the same transaction, JPA automatically detects what changed. When the transaction commits (on repository.save()), JPA generates an UPDATE statement for only the changed columns. You do not need to write the UPDATE SQL yourself.',
        },
      ],
      checklist: [
        'Create UpdateEmployeeRequest.java as a record in com.timetracker.employee.dto — all fields should be nullable (no @NotBlank or @NotNull here, unlike CreateEmployeeRequest).',
        'Add the updateEntity() method to EmployeeMapper: for each field in UpdateEmployeeRequest, check if it is non-null before updating the entity field.',
        'Add existsByEmailAndIdNot(String email, UUID id) to EmployeeRepository.',
        'Add the update(UUID id, UpdateEmployeeRequest request) method to EmployeeService — follow the three-step validation shown in the example.',
        'Create ManagerNotFoundException.java if it does not exist yet — similar structure to EmployeeNotFoundException.',
        'Create DuplicateEmailException.java if it does not exist yet.',
        'Add handler for DuplicateEmailException in GlobalExceptionHandler returning 409 Conflict.',
        'Commit with message: feat(S1-008): implement EmployeeService.update()',
      ],
      examples: [
        {
          lang: 'java',
          label: 'UpdateEmployeeRequest.java — partial update DTO',
          code: `package com.timetracker.employee.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

// All fields are nullable — null means "do not change this field"
// Contrast with CreateEmployeeRequest where firstName, lastName, email are @NotBlank
public record UpdateEmployeeRequest(
        @Size(max = 100) String firstName,    // null = keep existing
        @Size(max = 100) String lastName,     // null = keep existing
        @Email @Size(max = 255) String email, // null = keep existing; if non-null, must be unique
        @Size(max = 100) String department,   // null = keep existing
        @Size(max = 100) String role,         // null = keep existing
        LocalDate hireDate,                   // null = keep existing
        UUID managerId                        // null = keep existing; special: UUID.NIL could clear it
) {}`,
        },
        {
          lang: 'java',
          label: 'EmployeeMapper.java — updateEntity() method',
          code: `package com.timetracker.employee.mapper;

import com.timetracker.employee.domain.Employee;
import com.timetracker.employee.dto.CreateEmployeeRequest;
import com.timetracker.employee.dto.EmployeeResponse;
import com.timetracker.employee.dto.UpdateEmployeeRequest;
import org.springframework.stereotype.Component;

@Component
public class EmployeeMapper {

    // ... toEntity() and toResponse() from earlier stories ...

    // Apply only non-null fields from the request onto the existing entity.
    // This is the "partial update" logic — null fields are ignored.
    public void updateEntity(Employee employee, UpdateEmployeeRequest request) {
        // Each field: only update if the request contains a non-null value for it
        if (request.firstName() != null) {
            employee.setFirstName(request.firstName());
        }
        if (request.lastName() != null) {
            employee.setLastName(request.lastName());
        }
        if (request.email() != null) {
            employee.setEmail(request.email());
        }
        if (request.department() != null) {
            employee.setDepartment(request.department());
        }
        if (request.role() != null) {
            employee.setRole(request.role());
        }
        if (request.hireDate() != null) {
            employee.setHireDate(request.hireDate());
        }
        // managerId is handled separately in the service (requires a database lookup),
        // so the mapper does not set it here — the service sets employee.setManager(...)
    }
}`,
        },
        {
          lang: 'java',
          label: 'EmployeeService.java — update() method',
          code: `package com.timetracker.employee.service;

import com.timetracker.employee.domain.Employee;
import com.timetracker.employee.domain.EmployeeStatus;
import com.timetracker.employee.dto.EmployeeResponse;
import com.timetracker.employee.dto.UpdateEmployeeRequest;
import com.timetracker.employee.exception.DuplicateEmailException;
import com.timetracker.employee.exception.EmployeeNotFoundException;
import com.timetracker.employee.exception.ManagerNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class EmployeeService {

    // ... other methods ...

    @Transactional // wraps the whole method in a single database transaction
    public EmployeeResponse update(UUID id, UpdateEmployeeRequest request) {

        // Step 1: Load the existing employee — throws 404 if not found
        Employee employee = repository.findById(id)
                .orElseThrow(() -> new EmployeeNotFoundException(id));

        // Step 2: If email is being changed, verify it is still unique
        if (request.email() != null && !request.email().equals(employee.getEmail())) {
            // Check: does any OTHER employee already have this email?
            // existsByEmailAndIdNot() = SELECT ... WHERE email = ? AND id != ?
            if (repository.existsByEmailAndIdNot(request.email(), id)) {
                throw new DuplicateEmailException(request.email()); // → 409 Conflict
            }
        }

        // Step 3: If managerId is being changed, validate the new manager
        if (request.managerId() != null) {
            // Rule A: An employee cannot manage themselves
            if (request.managerId().equals(id)) {
                throw new IllegalArgumentException("An employee cannot be their own manager");
            }
            // Rule B: The new manager must exist and be ACTIVE
            Employee newManager = repository.findById(request.managerId())
                    .filter(m -> m.getStatus() == EmployeeStatus.ACTIVE) // must be active
                    .orElseThrow(() -> new ManagerNotFoundException(request.managerId())); // 404/409
            employee.setManager(newManager); // update the manager reference on the entity
        }

        // Step 4: Apply all other non-null field changes from the request to the entity
        mapper.updateEntity(employee, request);

        // Step 5: Save and return — JPA detects changes and generates the UPDATE SQL
        return mapper.toResponse(repository.save(employee));
    }
}`,
        },
        {
          lang: 'java',
          label: 'EmployeeRepository.java — add update-specific query method',
          code: `package com.timetracker.employee.repository;

import com.timetracker.employee.domain.Employee;
import com.timetracker.employee.domain.EmployeeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface EmployeeRepository
        extends JpaRepository<Employee, UUID>,
                JpaSpecificationExecutor<Employee> {

    boolean existsByEmail(String email);

    // Used during update: check uniqueness EXCLUDING this employee's own record.
    // Spring Data parses this method name and generates:
    // SELECT COUNT(*) > 0 FROM employee WHERE email = ? AND id != ?
    boolean existsByEmailAndIdNot(String email, UUID id);

    long countByManagerIdAndStatus(UUID managerId, EmployeeStatus status);
}`,
        },
      ],
      links: [
        { label: 'HTTP PATCH method — MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/PATCH' },
        { label: 'Spring Data — Derived query methods', url: 'https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html' },
        { label: 'Spring — @Transactional', url: 'https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html' },
      ],
    },
    {
      id: 'T-008-02',
      title: 'Controller — PATCH /api/v1/employees/{id}',
      description:
        'How does the PATCH endpoint differ from POST?\n\n' +
        'The controller for PATCH is almost identical in structure to POST — it has @PatchMapping instead of @PostMapping, and it takes a path variable for the employee ID. It still uses @Valid on the request body to trigger Bean Validation, and it still delegates entirely to the service.\n\n' +
        'One key difference is the return code. POST (create) returns 201 Created with a Location header. PATCH (update) returns 200 OK with the updated resource in the body. This is the standard REST convention: creation returns 201, update returns 200.\n\n' +
        'The @Valid annotation still applies, but for UpdateEmployeeRequest it only validates the constraints you put on non-null fields — it does not enforce that any fields are present (since all fields are optional in a PATCH). For example, if email is provided, it must be a valid email format; but it is fine to omit email entirely.\n\n' +
        'Error handling follows the same pattern: EmployeeNotFoundException becomes 404, DuplicateEmailException becomes 409, ManagerNotFoundException becomes 404, and ObjectOptimisticLockingFailureException (from T-008-03) becomes 409.',
      concepts: [
        {
          term: '@PatchMapping',
          explanation:
            'A shorthand for @RequestMapping(method = RequestMethod.PATCH, path = "/{id}"). It tells Spring MVC that this method handles HTTP PATCH requests to the path. PATCH is the semantically correct HTTP method for partial updates. Browsers do not natively send PATCH (they only support GET and POST in HTML forms), but REST clients and API tools like curl and Postman do.',
        },
        {
          term: 'HTTP 200 OK for updates',
          explanation:
            'When updating an existing resource, the standard response is 200 OK with the updated resource in the body. This lets the client see the final state of the resource after the update — including any server-side transformations like timestamp updates. Compare to 204 No Content (update succeeded, but no body is returned) — both are valid, but returning the updated body is more useful.',
        },
        {
          term: 'Validation on partial update',
          explanation:
            'When @Valid is applied to an UpdateEmployeeRequest, Bean Validation runs on whichever fields are present. If email is null (not provided), the @Email constraint on the email field is skipped — validation only runs when the value is non-null. This is the default behavior of most Bean Validation annotations with null values. You do NOT need @NotBlank here because none of the PATCH fields are required.',
        },
      ],
      checklist: [
        'Open EmployeeController.java and add the @PatchMapping("/{id}") method shown in the example.',
        'The method signature: public ResponseEntity<EmployeeResponse> update(@PathVariable UUID id, @Valid @RequestBody UpdateEmployeeRequest request)',
        'The method body: return ResponseEntity.ok(service.update(id, request));',
        'Verify GlobalExceptionHandler handles DuplicateEmailException with 409 Conflict.',
        'Test: PATCH /api/v1/employees/{id} with {"department": "Marketing"} — only department should change.',
        'Test: PATCH with a duplicate email — should return 409.',
        'Test: PATCH with a non-existent managerId — should return 404.',
        'Commit with message: feat(S1-008): add PATCH /api/v1/employees/{id} endpoint',
      ],
      examples: [
        {
          lang: 'java',
          label: 'EmployeeController.java — PATCH update endpoint',
          code: `package com.timetracker.employee.controller;

import com.timetracker.employee.dto.EmployeeResponse;
import com.timetracker.employee.dto.UpdateEmployeeRequest;
import com.timetracker.employee.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/employees")
public class EmployeeController {

    private final EmployeeService service;

    public EmployeeController(EmployeeService service) {
        this.service = service;
    }

    // ... POST, GET/{id}, GET endpoints from earlier stories ...

    @PatchMapping("/{id}") // handles PATCH /api/v1/employees/{someUUID}
    public ResponseEntity<EmployeeResponse> update(
            @PathVariable UUID id, // extract UUID from URL path
            @Valid @RequestBody UpdateEmployeeRequest request) { // parse+validate JSON body

        // Delegate to service — returns updated employee
        // ResponseEntity.ok() = HTTP 200 OK with the updated employee as JSON body
        return ResponseEntity.ok(service.update(id, request));

        // Exceptions handled by GlobalExceptionHandler:
        // EmployeeNotFoundException       → 404 Not Found
        // DuplicateEmailException         → 409 Conflict
        // ManagerNotFoundException        → 404 Not Found
        // IllegalArgumentException        → 400 Bad Request (self-manager check)
        // ObjectOptimisticLockingFailure  → 409 Conflict (optimistic locking, T-008-03)
    }
}`,
        },
        {
          lang: 'bash',
          label: 'Test PATCH with curl',
          code: `# Update only the department field (all other fields unchanged)
curl -s -X PATCH http://localhost:8080/api/v1/employees/EMPLOYEE-UUID \\
  -H "Content-Type: application/json" \\
  -d '{"department": "Marketing"}' | jq .

# Update email to a duplicate — expect 409
curl -s -X PATCH http://localhost:8080/api/v1/employees/EMPLOYEE-UUID \\
  -H "Content-Type: application/json" \\
  -d '{"email": "already.exists@example.com"}' | jq .

# Assign self as manager — expect 400
curl -s -X PATCH http://localhost:8080/api/v1/employees/EMPLOYEE-UUID \\
  -H "Content-Type: application/json" \\
  -d '{"managerId": "EMPLOYEE-UUID"}' | jq .`,
        },
        {
          lang: 'java',
          label: 'GlobalExceptionHandler.java — DuplicateEmailException handler',
          code: `// Add this to GlobalExceptionHandler alongside the other handlers

@ExceptionHandler(DuplicateEmailException.class)
public ResponseEntity<ErrorResponse> handleDuplicateEmail(
        DuplicateEmailException ex, HttpServletRequest request) {

    return ResponseEntity
            .status(HttpStatus.CONFLICT) // HTTP 409 Conflict
            .body(ErrorResponse.of(
                    409,
                    "Conflict",
                    ex.getMessage(), // e.g. "Employee with email 'x@y.com' already exists"
                    request.getRequestURI()));
}`,
        },
      ],
      links: [
        { label: 'Spring MVC — @PatchMapping', url: 'https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/bind/annotation/PatchMapping.html' },
        { label: 'HTTP status 409 Conflict — MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/409' },
        { label: 'REST API design — PATCH vs PUT', url: 'https://www.rfc-editor.org/rfc/rfc5789' },
      ],
    },
    {
      id: 'T-008-03',
      title: 'Optimistic Locking',
      description:
        'What is optimistic locking and why does it exist?\n\n' +
        'Imagine two users open the same employee record at the same time. User A changes the department to "Marketing". User B changes the role to "Senior Developer." Both submit their changes. Without any coordination, one update will silently overwrite the other — whichever reaches the database last wins. User A\'s change might be lost without either user knowing.\n\n' +
        'Optimistic locking solves this with a version number. Every time a record is saved, the version number increments (0 → 1 → 2...). When you load an employee with version=2 and try to save a change, the database UPDATE statement includes WHERE id = ? AND version = 2. If another request already incremented the version to 3, this UPDATE matches zero rows — JPA detects this and throws ObjectOptimisticLockingFailureException. You catch this and return 409 Conflict, telling the client "someone else modified this record, please reload and try again."\n\n' +
        'The implementation is remarkably simple: add a Long field annotated with @Version to the Employee entity. JPA handles everything else automatically — incrementing the version on save and checking it on update.\n\n' +
        'This is called "optimistic" because it optimistically assumes conflicts are rare. It does not lock rows in the database (which would block other readers). Instead, it detects conflicts after the fact and lets the client retry. For most web applications, optimistic locking is the right default.',
      concepts: [
        {
          term: '@Version',
          explanation:
            'The @Version annotation on a Long field in a JPA entity enables optimistic locking. JPA manages this field automatically: it starts at 0, increments on every save, and includes it in UPDATE statements as a WHERE condition. You never set this field manually — JPA controls it. Jackson serializes it in responses so clients can see the current version.',
        },
        {
          term: 'ObjectOptimisticLockingFailureException',
          explanation:
            'This Spring exception is thrown when a JPA UPDATE matches zero rows because the version in the WHERE clause no longer matches what is in the database. It means another request already modified and saved the record between when you loaded it and when you tried to save. Your GlobalExceptionHandler catches this and returns 409 Conflict.',
        },
        {
          term: 'HTTP 409 Conflict',
          explanation:
            'HTTP 409 means the request could not be completed because of a conflict with the current state of the resource. Optimistic locking failures (another request modified the resource) and duplicate email violations (another employee has this email) both use 409. The error message should tell the client what to do: "Resource was modified by another request. Refresh and try again."',
        },
        {
          term: 'Optimistic vs pessimistic locking',
          explanation:
            'Pessimistic locking places a database-level lock on the row when you read it, preventing other transactions from modifying it until you release the lock. It guarantees no conflicts but reduces throughput and can cause deadlocks. Optimistic locking does not lock anything — it just detects conflicts at save time. Optimistic locking is appropriate when conflicts are rare, which is true for most CRUD operations in typical web applications.',
        },
      ],
      checklist: [
        'Open Employee.java (the entity class) and add a Long field named version annotated with @Version.',
        'Create a new Flyway migration script V3__add_employee_version.sql that adds the version column to the employee table (ALTER TABLE employee ADD COLUMN version BIGINT DEFAULT 0 NOT NULL).',
        'Add the version field to EmployeeResponse so clients can see the current version number.',
        'Open GlobalExceptionHandler.java and add the ObjectOptimisticLockingFailureException handler shown in the example.',
        'Verify EmployeeResponse includes the version field in its record definition.',
        'Test: make two concurrent PATCH requests to the same employee and verify the second one returns 409.',
        'Commit with message: feat(S1-008): add optimistic locking via @Version',
      ],
      examples: [
        {
          lang: 'java',
          label: 'Employee.java — add @Version field',
          code: `package com.timetracker.employee.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "employee")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID) // database generates UUID automatically
    private UUID id;

    private String firstName;
    private String lastName;

    @Column(unique = true)
    private String email;

    private String department;
    private String role;
    private LocalDate hireDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Employee manager;

    @Enumerated(EnumType.STRING) // store as 'ACTIVE'/'INACTIVE', not 0/1
    private EmployeeStatus status = EmployeeStatus.ACTIVE;

    // @Version tells JPA to use this field for optimistic locking.
    // JPA will:
    //   - Start it at 0 when a record is first inserted
    //   - Increment it by 1 on every UPDATE
    //   - Add "AND version = ?" to every UPDATE WHERE clause
    //   - Throw ObjectOptimisticLockingFailureException if 0 rows were updated
    @Version
    private Long version;

    @Column(updatable = false) // set once on INSERT, never changed
    private Instant createdAt;

    private Instant updatedAt;

    // Getters, setters, @PrePersist, @PreUpdate hooks...
}`,
        },
        {
          lang: 'sql',
          label: 'V3__add_employee_version.sql — Flyway migration',
          code: `-- Flyway runs this automatically on startup if it has not run before.
-- This adds the version column to existing rows (default 0).
ALTER TABLE employee
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

-- Verify:
-- SELECT id, version FROM employee LIMIT 5;
-- All existing rows will have version = 0.`,
        },
        {
          lang: 'java',
          label: 'GlobalExceptionHandler.java — optimistic locking handler',
          code: `package com.timetracker.employee.exception;

import com.timetracker.employee.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // ... other handlers ...

    // Caught when two concurrent requests try to update the same record
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ErrorResponse> handleOptimisticLock(
            ObjectOptimisticLockingFailureException ex,
            HttpServletRequest request) {

        // The message tells the client what happened and what to do
        String message = "Resource was modified by another request. Refresh and try again.";

        return ResponseEntity
                .status(HttpStatus.CONFLICT) // HTTP 409 Conflict
                .body(ErrorResponse.of(
                        409,
                        "Conflict",
                        message,
                        request.getRequestURI()));
    }
}`,
        },
        {
          lang: 'sql',
          label: 'What Hibernate generates under the hood',
          code: `-- When you call repository.save(employee) after a PATCH,
-- Hibernate generates this UPDATE (not a plain "UPDATE all columns"):

UPDATE employee
SET first_name  = 'Jane',
    department  = 'Marketing',
    updated_at  = NOW(),
    version     = 3              -- incremented from 2 to 3
WHERE id      = 'some-uuid'
  AND version = 2;               -- <-- this is the optimistic lock check

-- If version was already 3 (changed by another request), this matches 0 rows.
-- JPA detects 0 rows updated and throws ObjectOptimisticLockingFailureException.`,
        },
      ],
      links: [
        { label: 'Hibernate — Optimistic Locking', url: 'https://docs.jboss.org/hibernate/orm/6.4/userguide/html_single/Hibernate_User_Guide.html#locking-optimistic' },
        { label: 'Jakarta Persistence — @Version', url: 'https://jakarta.ee/specifications/persistence/3.1/apidocs/jakarta.persistence/jakarta/persistence/version' },
        { label: 'Spring — ObjectOptimisticLockingFailureException', url: 'https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/orm/ObjectOptimisticLockingFailureException.html' },
      ],
    },
    {
      id: 'T-008-04',
      title: 'Unit Tests — Update',
      description:
        'What scenarios should you test for update()?\n\n' +
        'The update() method has more branching logic than create() or getById(). Each branch needs its own test: success (changes applied and saved), email uniqueness conflict, manager validation failure, and the self-manager guard. Testing each branch separately makes it easy to see exactly what fails when a test breaks.\n\n' +
        'The happy path test verifies that when all validations pass, the entity is updated via the mapper and saved via the repository. You use Mockito\'s verify() to assert that repository.save() was called — because update() returns an EmployeeResponse from the mapper, not from a repository.save() call that returns data in the test setup.\n\n' +
        'For the email conflict test, you set up the mock so existsByEmailAndIdNot() returns true (simulating another employee with the same email), and verify that DuplicateEmailException is thrown. For the self-manager test, you pass the same UUID for both the employee ID and the managerId — no mock setup is needed because the check is purely in-memory.\n\n' +
        'A practical note: the verify() method from Mockito asserts that a mock method was called with specific arguments. verify(repository).save(employee) asserts that save() was called with that exact employee object. This is useful when the method you are testing does not return a value you can assert on.',
      concepts: [
        {
          term: 'verify() in Mockito',
          explanation:
            'verify(mock).method(args) asserts that the given method was called on the mock with the given arguments. This is useful when the important side-effect of a method is that it calls something (like saving to the database), not just what it returns. For example: verify(repository).save(employee) confirms that save was called — useful when the return value is mocked separately.',
        },
        {
          term: 'ArgumentCaptor',
          explanation:
            'An ArgumentCaptor lets you capture the actual argument that was passed to a mock method, so you can assert on it. For example: ArgumentCaptor<Employee> captor = ArgumentCaptor.forClass(Employee.class); verify(repository).save(captor.capture()); Then captor.getValue() gives you the Employee that was passed to save(). This is useful when you want to assert on the state of the object, not just that it was passed.',
        },
      ],
      checklist: [
        'In EmployeeServiceTest.java, add an update_success() test: stub findById to return an employee, stub existsByEmailAndIdNot to return false, stub save to return the employee, stub mapper methods, call service.update(), and assert the result.',
        'Add an update_duplicateEmail() test: stub findById and existsByEmailAndIdNot(true), assert DuplicateEmailException is thrown.',
        'Add an update_selfManager() test: pass the same UUID as both the employee ID and the new managerId — assert IllegalArgumentException is thrown (no mock setup needed).',
        'Add an update_managerNotFound() test: stub the manager findById to return Optional.empty(), assert ManagerNotFoundException is thrown.',
        'Run: ./mvnw.cmd test -Dtest=EmployeeServiceTest',
        'All tests green. Commit with message: test(S1-008): unit tests for update employee',
      ],
      examples: [
        {
          lang: 'java',
          label: 'EmployeeServiceTest.java — update() tests',
          code: `package com.timetracker.employee.service;

import com.timetracker.employee.domain.Employee;
import com.timetracker.employee.domain.EmployeeStatus;
import com.timetracker.employee.dto.EmployeeResponse;
import com.timetracker.employee.dto.UpdateEmployeeRequest;
import com.timetracker.employee.exception.DuplicateEmailException;
import com.timetracker.employee.exception.EmployeeNotFoundException;
import com.timetracker.employee.exception.ManagerNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock EmployeeRepository repository;
    @Mock EmployeeMapper mapper;
    @InjectMocks EmployeeService service;

    // ... tests from S1-005, S1-006, S1-007 ...

    @Test
    @DisplayName("update saves and returns updated employee on valid input")
    void update_success() {
        UUID id = UUID.randomUUID();
        // Build an existing employee in the database
        Employee employee = new Employee();
        employee.setId(id);
        employee.setEmail("old@example.com");

        // Request only changes the department — other fields are null (not changed)
        UpdateEmployeeRequest request = new UpdateEmployeeRequest(
                null, null, null, "Marketing", null, null, null);

        EmployeeResponse expectedResponse = mock(EmployeeResponse.class); // just a stand-in

        when(repository.findById(id)).thenReturn(Optional.of(employee));
        // Email is null in request, so existsByEmailAndIdNot won't even be called
        when(repository.save(employee)).thenReturn(employee);
        when(mapper.toResponse(employee)).thenReturn(expectedResponse);

        EmployeeResponse result = service.update(id, request);

        assertThat(result).isEqualTo(expectedResponse);
        // verify that the mapper was asked to apply changes and that save was called
        verify(mapper).updateEntity(employee, request);
        verify(repository).save(employee);
    }

    @Test
    @DisplayName("update throws DuplicateEmailException when new email is already taken")
    void update_duplicateEmail() {
        UUID id = UUID.randomUUID();
        Employee employee = new Employee();
        employee.setId(id);
        employee.setEmail("current@example.com"); // current email

        // Request changes email to one that belongs to another employee
        UpdateEmployeeRequest request = new UpdateEmployeeRequest(
                null, null, "taken@example.com", null, null, null, null);

        when(repository.findById(id)).thenReturn(Optional.of(employee));
        // Another employee already has "taken@example.com"
        when(repository.existsByEmailAndIdNot("taken@example.com", id)).thenReturn(true);

        assertThatThrownBy(() -> service.update(id, request))
                .isInstanceOf(DuplicateEmailException.class);

        // Verify save was never called — we threw before reaching it
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("update throws IllegalArgumentException when employee tries to manage themselves")
    void update_selfManager() {
        UUID id = UUID.randomUUID();
        Employee employee = new Employee();
        employee.setId(id);
        employee.setEmail("employee@example.com");

        // managerId is the same as the employee's own id — should be rejected
        UpdateEmployeeRequest request = new UpdateEmployeeRequest(
                null, null, null, null, null, null, id); // managerId == id

        when(repository.findById(id)).thenReturn(Optional.of(employee));

        assertThatThrownBy(() -> service.update(id, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("cannot be their own manager");
    }

    @Test
    @DisplayName("update throws ManagerNotFoundException when new manager does not exist or is inactive")
    void update_managerNotFound() {
        UUID id = UUID.randomUUID();
        UUID managerId = UUID.randomUUID(); // a different UUID — valid for self-check
        Employee employee = new Employee();
        employee.setId(id);
        employee.setEmail("employee@example.com");

        UpdateEmployeeRequest request = new UpdateEmployeeRequest(
                null, null, null, null, null, null, managerId);

        when(repository.findById(id)).thenReturn(Optional.of(employee));
        // Manager lookup returns empty — no such manager
        when(repository.findById(managerId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(id, request))
                .isInstanceOf(ManagerNotFoundException.class);
    }
}`,
        },
      ],
      links: [
        { label: 'Mockito — verify()', url: 'https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/Mockito.html#verify(T)' },
        { label: 'Mockito — ArgumentCaptor', url: 'https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/ArgumentCaptor.html' },
        { label: 'AssertJ — exception assertions', url: 'https://assertj.github.io/doc/#assertj-core-exception-assertions' },
      ],
    },
  ],
};
