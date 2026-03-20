import { Story } from '../../models/step.model';

export const S1_009: Story = {
  id: 'S1-009',
  title: 'S1-009 — Delete Employee',
  tasks: [
    {
      id: 'T-009-01',
      title: 'Service — Soft Delete',
      description:
        'What is a soft delete, and why not just delete the row?\n\n' +
        'A hard delete removes the database row permanently. Once deleted, the data is gone — you lose all history, audit trails, and any records that reference this employee. If another system stored a reference to this employee\'s ID (a time-tracking entry, a project assignment), those references would point to nothing — a "dangling reference."\n\n' +
        'A soft delete instead marks the record as inactive by setting its status field to INACTIVE. The row stays in the database. Foreign key references still resolve. Historical records remain intact. An administrator can even "un-delete" an employee by setting their status back to ACTIVE. This is the industry-standard approach for employee and user data in most enterprise systems.\n\n' +
        'The delete() method loads the employee, checks whether they have any active direct reports, and if clear, sets their status to INACTIVE and saves. The active reports check is a business rule: if you deactivate a manager who still has active reports, those reports would have an INACTIVE manager — which is logically inconsistent and could break workflows.\n\n' +
        'There is one subtle point: you check active reports by calling repository.countByManagerIdAndStatus(id, ACTIVE). If the count is greater than zero, you throw ActiveReportsException, which maps to 409 Conflict. The caller must reassign or deactivate those reports first.',
      concepts: [
        {
          term: 'Soft delete',
          explanation:
            'A soft delete marks a record as deleted (e.g., by setting status = INACTIVE) without removing it from the database. The record is hidden from normal queries but the data is preserved. This is important for audit trails, historical reporting, and referential integrity — other records that reference this entity continue to resolve correctly.',
        },
        {
          term: 'Hard delete',
          explanation:
            'A hard delete removes the row from the database permanently using DELETE FROM table WHERE id = ?. Once executed, the data is gone. This is appropriate for truly temporary data (e.g., a draft record the user abandoned), but wrong for employees, users, or any entity that other records may reference or that has historical significance.',
        },
        {
          term: 'Active reports guard',
          explanation:
            'A business rule that prevents deactivating a manager who still has active direct reports. If you soft-delete a manager, their reports would have a reference to an INACTIVE manager — logically inconsistent and potentially breaking workflows in downstream systems. The guard checks repository.countByManagerIdAndStatus(id, ACTIVE) and throws ActiveReportsException if the count is > 0.',
        },
        {
          term: 'countByManagerIdAndStatus()',
          explanation:
            'A Spring Data derived query method that counts employees matching two conditions. Spring parses the method name and generates: SELECT COUNT(*) FROM employee WHERE manager_id = ? AND status = ?. The result is a long (primitive, not Long) — zero means no active reports, any positive number means the manager has reports to reassign.',
        },
        {
          term: 'HTTP 409 Conflict for business rule violations',
          explanation:
            'HTTP 409 Conflict is used when a request cannot be completed because of a conflict with the current state of the resource. Optimistic locking conflicts, duplicate emails, and active reports blocking deletion are all 409 scenarios. They differ from 400 Bad Request (the input format was wrong) and 422 Unprocessable Entity (the input was valid but failed field validation).',
        },
      ],
      checklist: [
        'Open EmployeeRepository.java and verify countByManagerIdAndStatus(UUID managerId, EmployeeStatus status) is present — add it if not.',
        'Create ActiveReportsException.java in com.timetracker.employee.exception — it should extend RuntimeException and include both the manager ID and the count in its message.',
        'Add the delete(UUID id) method to EmployeeService as shown in the example.',
        'Open GlobalExceptionHandler.java and add a handler for ActiveReportsException that returns 409 Conflict.',
        'Test: DELETE /api/v1/employees/{id} for an employee with no active reports — should return 204 No Content and the employee should now have status INACTIVE.',
        'Test: DELETE /api/v1/employees/{id} for a manager with active reports — should return 409.',
        'Test: DELETE /api/v1/employees/{unknown-id} — should return 404.',
        'Commit with message: feat(S1-009): implement soft delete in EmployeeService',
      ],
      examples: [
        {
          lang: 'java',
          label: 'ActiveReportsException.java — business rule exception',
          code: `package com.timetracker.employee.exception;

import java.util.UUID;

// Thrown when trying to deactivate a manager who still has active direct reports.
// Mapped to HTTP 409 Conflict by GlobalExceptionHandler.
public class ActiveReportsException extends RuntimeException {

    // Store the count so the error message can be specific and useful
    public ActiveReportsException(UUID managerId, long activeReportCount) {
        super("Cannot deactivate employee '%s': they have %d active direct report(s). "
                .formatted(managerId, activeReportCount) +
              "Reassign or deactivate those employees first.");
    }
}`,
        },
        {
          lang: 'java',
          label: 'EmployeeService.java — delete() method',
          code: `package com.timetracker.employee.service;

import com.timetracker.employee.domain.Employee;
import com.timetracker.employee.domain.EmployeeStatus;
import com.timetracker.employee.exception.ActiveReportsException;
import com.timetracker.employee.exception.EmployeeNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class EmployeeService {

    // ... other methods ...

    @Transactional // ensures the load and save happen in one atomic transaction
    public void delete(UUID id) {

        // Step 1: Find the employee — throws 404 if not found.
        // This works for both ACTIVE and INACTIVE employees
        // (you can call delete on an already-inactive employee; it is idempotent)
        Employee employee = repository.findById(id)
                .orElseThrow(() -> new EmployeeNotFoundException(id));

        // Step 2: Check for active direct reports.
        // Spring Data generates: SELECT COUNT(*) FROM employee WHERE manager_id = ? AND status = 'ACTIVE'
        long activeReports = repository.countByManagerIdAndStatus(id, EmployeeStatus.ACTIVE);

        if (activeReports > 0) {
            // Cannot deactivate — this manager still has active direct reports
            throw new ActiveReportsException(id, activeReports); // → 409 Conflict
        }

        // Step 3: Soft delete — change status to INACTIVE and save.
        // We do NOT call repository.deleteById(id) — that would be a hard delete.
        employee.setStatus(EmployeeStatus.INACTIVE);
        repository.save(employee); // JPA generates: UPDATE employee SET status = 'INACTIVE' WHERE id = ?

        // Return type is void — the controller will return 204 No Content
    }
}`,
        },
        {
          lang: 'java',
          label: 'EmployeeRepository.java — countByManagerIdAndStatus',
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
    boolean existsByEmailAndIdNot(String email, UUID id);

    // Spring Data parses this method name and generates:
    // SELECT COUNT(*) FROM employee WHERE manager_id = ? AND status = ?
    // Returns long (primitive) — 0 means no active reports, >0 means there are some
    long countByManagerIdAndStatus(UUID managerId, EmployeeStatus status);
}`,
        },
        {
          lang: 'java',
          label: 'GlobalExceptionHandler.java — ActiveReportsException handler',
          code: `// Add to GlobalExceptionHandler alongside the other handlers

@ExceptionHandler(ActiveReportsException.class)
public ResponseEntity<ErrorResponse> handleActiveReports(
        ActiveReportsException ex,
        HttpServletRequest request) {

    return ResponseEntity
            .status(HttpStatus.CONFLICT) // HTTP 409 Conflict
            .body(ErrorResponse.of(
                    409,
                    "Conflict",
                    ex.getMessage(), // "Cannot deactivate employee '...': they have 3 active direct report(s)."
                    request.getRequestURI()));
}`,
        },
      ],
      links: [
        { label: 'Spring Data — derived query methods', url: 'https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html' },
        { label: 'HTTP 409 Conflict — MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/409' },
        { label: 'Soft delete pattern — Martin Fowler', url: 'https://martinfowler.com/bliki/SoftDelete.html' },
      ],
    },
    {
      id: 'T-009-02',
      title: 'Controller — DELETE /api/v1/employees/{id}',
      description:
        'How should the DELETE endpoint respond?\n\n' +
        'The HTTP DELETE method signals intent to remove a resource. The correct success response for a successful delete with no body to return is 204 No Content — the status code says "it worked" and the empty body says "there is nothing to return." This is distinct from 200 OK, which implies a response body is present.\n\n' +
        'The controller method for DELETE is one of the shortest you will write: accept a path variable, call the service, return ResponseEntity.noContent().build(). That last call creates a 204 response with no body. The service handles all the logic and throws exceptions as needed.\n\n' +
        'The ResponseEntity<Void> type signature is important. The Void type parameter (capital V, not void keyword) tells Spring that this endpoint has no response body. This is the correct Java way to express "this HTTP response will be empty."\n\n' +
        'Error responses still work exactly as before: EmployeeNotFoundException becomes 404, ActiveReportsException becomes 409 — all handled by GlobalExceptionHandler without any code in the controller.',
      concepts: [
        {
          term: 'HTTP 204 No Content',
          explanation:
            'HTTP 204 means the request was successful and the server has no content to return. It is the standard response for DELETE operations that succeed: you deleted the resource, there is nothing to show. It differs from 200 OK (success, with a body) and 404 Not Found (resource did not exist). ResponseEntity.noContent().build() creates a 204 response in Spring.',
        },
        {
          term: 'ResponseEntity<Void>',
          explanation:
            'ResponseEntity<Void> is used when an endpoint intentionally returns no body. The Void type parameter (capital V) signals to both Java and Spring that no object will be serialized. This is the correct type for DELETE endpoints that return 204, and for endpoints that return only a status code with no data.',
        },
        {
          term: '@DeleteMapping',
          explanation:
            'A shorthand for @RequestMapping(method = RequestMethod.DELETE). It routes HTTP DELETE requests to your method. Combined with ("/{id}"), it handles DELETE /api/v1/employees/{someUUID}. The HTTP DELETE method is idempotent — calling it multiple times should produce the same result (in our case, the employee stays INACTIVE after repeated calls).',
        },
      ],
      checklist: [
        'Open EmployeeController.java and add the @DeleteMapping("/{id}") method shown in the example.',
        'The return type must be ResponseEntity<Void> — capital V Void.',
        'The method body: call service.delete(id), then return ResponseEntity.noContent().build();',
        'Test: DELETE /api/v1/employees/{valid-id-no-reports} — should return 204 with empty body.',
        'Test: DELETE the same ID again — should still return 204 (idempotent — already INACTIVE, no active reports, no error).',
        'Test: DELETE /api/v1/employees/{manager-with-reports} — should return 409.',
        'Test: DELETE /api/v1/employees/{unknown-id} — should return 404.',
        'Commit with message: feat(S1-009): add DELETE /api/v1/employees/{id} endpoint',
      ],
      examples: [
        {
          lang: 'java',
          label: 'EmployeeController.java — DELETE endpoint',
          code: `package com.timetracker.employee.controller;

import com.timetracker.employee.service.EmployeeService;
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

    // ... POST, GET/{id}, GET, PATCH/{id} endpoints from earlier stories ...

    @DeleteMapping("/{id}") // handles DELETE /api/v1/employees/{someUUID}
    public ResponseEntity<Void> delete(
            @PathVariable UUID id) { // extract UUID from URL path

        service.delete(id); // delegates entirely to the service

        // ResponseEntity.noContent() creates a 204 No Content response.
        // .build() finalizes it with no body.
        // The Void type parameter tells Spring there is no body to serialize.
        return ResponseEntity.noContent().build();

        // Exceptions from service.delete() are handled by GlobalExceptionHandler:
        // EmployeeNotFoundException  → 404 Not Found
        // ActiveReportsException     → 409 Conflict
    }
}`,
        },
        {
          lang: 'bash',
          label: 'Test the DELETE endpoint with curl',
          code: `# Successful soft delete — 204 No Content (empty body)
curl -s -o /dev/null -w "%{http_code}" \\
  -X DELETE http://localhost:8080/api/v1/employees/EMPLOYEE-UUID
# Output: 204

# Verify the employee is now INACTIVE (not gone from database!)
curl -s http://localhost:8080/api/v1/employees/EMPLOYEE-UUID | jq .status
# Output: "INACTIVE"

# Delete again — still 204 (already INACTIVE, no active reports, idempotent)
curl -s -o /dev/null -w "%{http_code}" \\
  -X DELETE http://localhost:8080/api/v1/employees/EMPLOYEE-UUID
# Output: 204

# Try to delete a manager with active reports — 409
curl -s -X DELETE http://localhost:8080/api/v1/employees/MANAGER-WITH-REPORTS-UUID | jq .
# {
#   "status": 409,
#   "error": "Conflict",
#   "message": "Cannot deactivate employee '...': they have 2 active direct report(s)."
# }

# Unknown ID — 404
curl -s -X DELETE http://localhost:8080/api/v1/employees/00000000-0000-0000-0000-000000000000 | jq .
# { "status": 404, ... }`,
        },
      ],
      links: [
        { label: 'HTTP DELETE method — MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/DELETE' },
        { label: 'HTTP 204 No Content — MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/204' },
        { label: 'Spring MVC — @DeleteMapping', url: 'https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/bind/annotation/DeleteMapping.html' },
      ],
    },
    {
      id: 'T-009-03',
      title: 'Active Reports Guard',
      description:
        'Why does the active reports check matter beyond just throwing an exception?\n\n' +
        'The active reports guard is a business integrity rule, not just a validation. Without it, you could deactivate a manager and leave their reports orphaned — connected to an INACTIVE manager. Downstream systems (like a time-tracker that sends report digests to managers) might silently fail or send emails to the wrong person. Enforcing the rule at the API layer prevents this class of data integrity problem.\n\n' +
        'The check uses repository.countByManagerIdAndStatus(id, EmployeeStatus.ACTIVE). This is important: it checks for ACTIVE reports only. If a manager\'s reports are all INACTIVE, they can be deactivated freely. You should also consider whether an already-INACTIVE employee can be "re-deleted" — in this design, calling delete() on an already-INACTIVE employee succeeds silently (no active reports, just sets status to INACTIVE again), which is idempotent and fine.\n\n' +
        'The ActiveReportsException message should be actionable — tell the caller exactly what they need to do: "Reassign or deactivate those employees first." A good error message answers the question "what should I do now?" not just "what went wrong."\n\n' +
        'From a REST design perspective, this 409 response is correct. The request itself is valid (the ID is a real UUID, the employee exists) but it cannot be fulfilled because of the current state of related resources. This is exactly what 409 Conflict is for.',
      concepts: [
        {
          term: 'Referential integrity',
          explanation:
            'Referential integrity means that references between database records are always valid. If employee A references manager B, then B must exist and be valid. Deleting B (hard or soft) without updating A creates an orphaned reference. The active reports guard protects referential integrity by refusing to deactivate a manager until all their references are handled.',
        },
        {
          term: 'Idempotent operations',
          explanation:
            'An idempotent operation produces the same result no matter how many times you call it. HTTP DELETE is defined as idempotent: deleting a resource that is already deleted should succeed (not error). In our soft-delete design, calling delete() on an already-INACTIVE employee with no active reports succeeds silently — the status stays INACTIVE. This is the correct behavior.',
        },
        {
          term: 'Actionable error messages',
          explanation:
            'A good error message does not just describe what went wrong — it tells the caller what to do next. "Cannot deactivate employee: they have 2 active direct reports. Reassign or deactivate those employees first." is actionable. "Conflict" is not. The extra effort in error message design significantly reduces support burden and developer frustration when integrating with your API.',
        },
      ],
      checklist: [
        'Verify ActiveReportsException.java exists with a message that includes both the employee ID and the count of active reports.',
        'Verify the message is actionable — it should tell the caller to "reassign or deactivate those employees first."',
        'Verify GlobalExceptionHandler handles ActiveReportsException and returns 409 with the exception message.',
        'Test the guard manually: create an employee, set them as a manager for another employee, then try to DELETE the manager — should get 409.',
        'Test: deactivate all the reports first, then DELETE the manager — should succeed with 204.',
        'Commit with message: feat(S1-009): add active reports guard for soft delete',
      ],
      examples: [
        {
          lang: 'java',
          label: 'Full delete() with guard — annotated walkthrough',
          code: `package com.timetracker.employee.service;

import com.timetracker.employee.domain.Employee;
import com.timetracker.employee.domain.EmployeeStatus;
import com.timetracker.employee.exception.ActiveReportsException;
import com.timetracker.employee.exception.EmployeeNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class EmployeeService {

    // ... fields, constructor, other methods ...

    @Transactional
    public void delete(UUID id) {

        // --- Guard 1: Employee must exist ---
        // findById returns Optional<Employee>
        // orElseThrow fires EmployeeNotFoundException if empty → 404
        Employee employee = repository.findById(id)
                .orElseThrow(() -> new EmployeeNotFoundException(id));

        // --- Guard 2: No active direct reports ---
        // Generates: SELECT COUNT(*) FROM employee WHERE manager_id = ? AND status = 'ACTIVE'
        long activeReports = repository.countByManagerIdAndStatus(id, EmployeeStatus.ACTIVE);

        if (activeReports > 0) {
            // Cannot proceed — actionable error tells the caller exactly what to fix
            throw new ActiveReportsException(id, activeReports);
            // GlobalExceptionHandler maps this to 409 Conflict
        }

        // --- Action: Soft delete ---
        // NOT: repository.deleteById(id) — that is a hard delete!
        // Instead: set status to INACTIVE and save
        employee.setStatus(EmployeeStatus.INACTIVE);

        // JPA generates:
        //   UPDATE employee
        //   SET status = 'INACTIVE', version = (version+1), updated_at = NOW()
        //   WHERE id = ? AND version = ?
        // (The @Version check happens here — see T-008-03)
        repository.save(employee);

        // delete() returns void. The controller converts this to 204 No Content.
    }
}`,
        },
        {
          lang: 'bash',
          label: 'End-to-end scenario: guard in action',
          code: `# Create a manager
MANAGER_ID=$(curl -s -X POST http://localhost:8080/api/v1/employees \\
  -H "Content-Type: application/json" \\
  -d '{"firstName":"Alice","lastName":"Smith","email":"alice@example.com","department":"Eng","role":"Manager","hireDate":"2023-01-01"}' \\
  | jq -r '.id')

# Create a report under that manager
curl -s -X POST http://localhost:8080/api/v1/employees \\
  -H "Content-Type: application/json" \\
  -d "{\"firstName\":\"Bob\",\"lastName\":\"Jones\",\"email\":\"bob@example.com\",\"department\":\"Eng\",\"role\":\"Dev\",\"hireDate\":\"2023-06-01\",\"managerId\":\"$MANAGER_ID\"}" \\
  | jq .id

# Try to delete the manager — should be 409
curl -s -X DELETE "http://localhost:8080/api/v1/employees/$MANAGER_ID" | jq .
# { "status": 409, "message": "Cannot deactivate employee '...': they have 1 active direct report(s)." }

# Get Bob's ID from the create response above, then delete Bob first
BOB_ID="...paste Bob's ID here..."
curl -s -o /dev/null -w "%{http_code}" -X DELETE "http://localhost:8080/api/v1/employees/$BOB_ID"
# 204

# Now delete Alice — should succeed
curl -s -o /dev/null -w "%{http_code}" -X DELETE "http://localhost:8080/api/v1/employees/$MANAGER_ID"
# 204`,
        },
      ],
      links: [
        { label: 'REST API error handling best practices', url: 'https://www.rfc-editor.org/rfc/rfc7807' },
        { label: 'HTTP 409 Conflict — MDN', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/409' },
      ],
    },
    {
      id: 'T-009-04',
      title: 'Unit Tests — Delete',
      description:
        'What scenarios should you test for delete()?\n\n' +
        'The delete() method has three outcomes: success (employee is soft-deleted), not found (404), and blocked by active reports (409). Each branch needs its own test. You also need to verify a specific side-effect: that after a successful delete, the employee\'s status is INACTIVE and repository.save() was called.\n\n' +
        'The success test uses Mockito\'s ArgumentCaptor to capture the Employee object that was passed to save(). This lets you assert that employee.getStatus() == INACTIVE — proving the soft delete actually set the status correctly, not just that save() was called.\n\n' +
        'For the active reports test, stub countByManagerIdAndStatus to return 2 (simulating two active reports). Assert that ActiveReportsException is thrown. Use verify(repository, never()).save(any()) to confirm that save was never called — the guard fired before the save.\n\n' +
        'The not-found test is the simplest: stub findById to return Optional.empty() and assert EmployeeNotFoundException is thrown.',
      concepts: [
        {
          term: 'ArgumentCaptor',
          explanation:
            'ArgumentCaptor captures the actual argument passed to a mock method so you can make assertions on it. In the delete test, after calling service.delete(id), you use ArgumentCaptor to capture the Employee passed to repository.save(). Then you assert that employee.getStatus() == INACTIVE. Without ArgumentCaptor, you can only verify that save() was called, not what state the employee was in.',
        },
        {
          term: 'verify(mock, never()).method()',
          explanation:
            'verify(repository, never()).save(any()) asserts that save() was NEVER called on the repository mock. This is used in the error case tests to confirm that the guard threw before reaching the save step. If save() was accidentally called despite the guard, this verification would fail and catch the bug.',
        },
      ],
      checklist: [
        'In EmployeeServiceTest.java, add the delete_success() test using ArgumentCaptor to capture the saved employee and assert its status is INACTIVE.',
        'Add the delete_hasActiveReports() test: stub countByManagerIdAndStatus to return 2L, assert ActiveReportsException is thrown, verify repository.save() was never called.',
        'Add the delete_notFound() test: stub findById to return Optional.empty(), assert EmployeeNotFoundException is thrown.',
        'Run all tests: ./mvnw.cmd test -Dtest=EmployeeServiceTest',
        'All tests green. Commit with message: test(S1-009): unit tests for delete employee',
      ],
      examples: [
        {
          lang: 'java',
          label: 'EmployeeServiceTest.java — delete() tests',
          code: `package com.timetracker.employee.service;

import com.timetracker.employee.domain.Employee;
import com.timetracker.employee.domain.EmployeeStatus;
import com.timetracker.employee.exception.ActiveReportsException;
import com.timetracker.employee.exception.EmployeeNotFoundException;
import com.timetracker.employee.mapper.EmployeeMapper;
import com.timetracker.employee.repository.EmployeeRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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

    // ... tests from previous stories ...

    @Test
    @DisplayName("delete sets employee status to INACTIVE and saves")
    void delete_success() {
        // ARRANGE
        UUID id = UUID.randomUUID();
        Employee employee = new Employee();
        employee.setId(id);
        employee.setStatus(EmployeeStatus.ACTIVE); // starts ACTIVE

        when(repository.findById(id)).thenReturn(Optional.of(employee));
        // No active reports — count is 0
        when(repository.countByManagerIdAndStatus(id, EmployeeStatus.ACTIVE)).thenReturn(0L);
        // Stub save to return the same employee (the service ignores the return value of save() here,
        // but Mockito needs this stub because save() is called)
        when(repository.save(any(Employee.class))).thenReturn(employee);

        // ACT
        service.delete(id); // returns void

        // ASSERT: capture the Employee that was passed to save()
        ArgumentCaptor<Employee> captor = ArgumentCaptor.forClass(Employee.class);
        verify(repository).save(captor.capture()); // assert save() was called and capture the arg
        Employee savedEmployee = captor.getValue(); // get the captured Employee

        // The saved employee's status must be INACTIVE (the soft delete was applied)
        assertThat(savedEmployee.getStatus()).isEqualTo(EmployeeStatus.INACTIVE);
    }

    @Test
    @DisplayName("delete throws ActiveReportsException when manager has active reports")
    void delete_hasActiveReports() {
        // ARRANGE
        UUID id = UUID.randomUUID();
        Employee employee = new Employee();
        employee.setId(id);

        when(repository.findById(id)).thenReturn(Optional.of(employee));
        // Simulate 2 active direct reports
        when(repository.countByManagerIdAndStatus(id, EmployeeStatus.ACTIVE)).thenReturn(2L);

        // ACT + ASSERT: exception is thrown
        assertThatThrownBy(() -> service.delete(id))
                .isInstanceOf(ActiveReportsException.class)
                .hasMessageContaining("2"); // message should mention the count

        // VERIFY: save() must NOT have been called — the guard stopped execution before it
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("delete throws EmployeeNotFoundException when employee does not exist")
    void delete_notFound() {
        // ARRANGE: employee does not exist
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        // ACT + ASSERT
        assertThatThrownBy(() -> service.delete(id))
                .isInstanceOf(EmployeeNotFoundException.class);

        // VERIFY: countByManagerIdAndStatus and save were never called
        verify(repository, never()).countByManagerIdAndStatus(any(), any());
        verify(repository, never()).save(any());
    }
}`,
        },
        {
          lang: 'bash',
          label: 'Run all service tests',
          code: `JAVA_HOME="C:/Program Files/Eclipse Adoptium/jdk-25.0.2.10-hotspot" \\
  ./mvnw.cmd test -Dtest=EmployeeServiceTest -pl employee-service

# Expected after all stories so far:
# Tests run: 10, Failures: 0, Errors: 0, Skipped: 0`,
        },
      ],
      links: [
        { label: 'Mockito — ArgumentCaptor', url: 'https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/ArgumentCaptor.html' },
        { label: 'Mockito — verify() modes (never, times, atLeast)', url: 'https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/Mockito.html#times(int)' },
        { label: 'AssertJ — hasMessageContaining', url: 'https://assertj.github.io/doc/#assertj-core-exception-assertions' },
      ],
    },
  ],
};
