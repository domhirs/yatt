# T-008-03: Optimistic Locking

| Field | Value |
|---|---|
| **Task ID** | T-008-03 |
| **Story** | [S1-008: Update Employee](../../../stories/stage1/S1-008-update-employee.md) |
| **Status** | Pending |

---

## Objective

Implement optimistic locking to prevent lost updates when concurrent modifications occur, using JPA's `@Version` annotation and returning 409 Conflict on version mismatch.

---

## Checklist

- [ ] Verify `@Version` field on `Employee` entity
- [ ] Include `version` in `UpdateEmployeeRequest`
- [ ] Include `version` in `EmployeeResponse`
- [ ] Service compares request version with entity version
- [ ] Handle `OptimisticLockingFailureException` in `GlobalExceptionHandler`
- [ ] Return 409 Conflict with message explaining version mismatch
- [ ] Write test for optimistic locking conflict
- [ ] Commit: `feat(S1-008): add optimistic locking for employee updates`

---

## Details

### How @Version works with JPA/Hibernate

<details>
<summary>Expand for guidance</summary>

JPA's `@Version` annotation marks a field that Hibernate uses for optimistic concurrency control. The mechanism is straightforward:

1. The entity has a `version` field (typically `Long` or `Integer`).
2. On every `UPDATE`, Hibernate appends `WHERE version = :currentVersion` to the SQL.
3. If no rows are affected (because another transaction incremented the version), Hibernate throws `OptimisticLockingFailureException`.
4. The version is automatically incremented on successful update.

```java
@Entity
@Table(name = "employee")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Version
    private Long version;

    // ... other fields
}
```

The generated SQL for an update looks like:

```sql
UPDATE employee
SET first_name = ?, last_name = ?, ..., version = version + 1
WHERE id = ? AND version = ?
```

If the `WHERE` clause matches zero rows (because the version changed), Hibernate throws `jakarta.persistence.OptimisticLockException`, which Spring wraps as `org.springframework.orm.ObjectOptimisticLockingFailureException` (a subclass of `OptimisticLockingFailureException`).

</details>

### Include version in DTOs

<details>
<summary>Expand for guidance</summary>

Add `version` to both the request and response records:

**UpdateEmployeeRequest:**

```java
public record UpdateEmployeeRequest(
        String firstName,
        String lastName,
        String email,
        String department,
        String role,
        LocalDate hireDate,
        UUID managerId,
        EmployeeStatus status,
        Long version  // Required for optimistic locking
) {}
```

**EmployeeResponse:**

```java
public record EmployeeResponse(
        UUID id,
        String firstName,
        String lastName,
        String email,
        String department,
        String role,
        LocalDate hireDate,
        UUID managerId,
        EmployeeStatus status,
        Long version,
        Instant createdAt,
        Instant updatedAt
) {}
```

The client flow:
1. `GET /api/v1/employees/{id}` returns the employee with `version: 0`.
2. Client sends `PATCH` with `version: 0` and the fields to change.
3. If another request modified the employee in between, the version is now `1`, and the PATCH fails with 409 Conflict.
4. The client must re-fetch the employee and retry with the new version.

</details>

### Service version check

<details>
<summary>Expand for guidance</summary>

The service should set the version on the entity before saving, so Hibernate uses it in the `WHERE` clause:

```java
public EmployeeResponse update(UUID id, UpdateEmployeeRequest request) {
    Employee employee = employeeRepository.findById(id)
            .orElseThrow(() -> new EmployeeNotFoundException(id));

    // Set version for optimistic locking (if provided in request)
    if (request.version() != null) {
        employee.setVersion(request.version());
    }

    // ... validation and field application (from T-008-01)

    Employee saved = employeeRepository.save(employee);
    return employeeMapper.toResponse(saved);
}
```

**Important**: Hibernate tracks the version internally via the persistence context. When you load an entity, Hibernate knows its version. When you call `save()`, Hibernate uses the tracked version in the `WHERE` clause. Setting the version explicitly is one approach; another is to compare versions manually:

```java
if (request.version() != null && !request.version().equals(employee.getVersion())) {
    throw new OptimisticLockingConflictException(
            employee.getVersion(), request.version());
}
```

The manual approach gives you a clearer error message. The Hibernate automatic approach is simpler but the error message is less specific. Choose the approach that best fits your error handling strategy. The manual comparison is recommended because it lets you include both the expected and actual version in the error response.

</details>

### Handle exception in GlobalExceptionHandler

<details>
<summary>Expand for guidance</summary>

Add a handler for `OptimisticLockingFailureException` (or your custom exception) in `GlobalExceptionHandler`:

```java
@ExceptionHandler(OptimisticLockingFailureException.class)
public ResponseEntity<ErrorResponse> handleOptimisticLockingFailure(
        OptimisticLockingFailureException ex,
        HttpServletRequest request) {

    var errorResponse = new ErrorResponse(
            HttpStatus.CONFLICT.value(),
            "Conflict",
            "Employee was modified by another request. Please refresh and try again.",
            null,
            Instant.now(),
            request.getRequestURI()
    );

    return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
}
```

If using the custom exception approach with version numbers:

```java
@ExceptionHandler(OptimisticLockingConflictException.class)
public ResponseEntity<ErrorResponse> handleOptimisticLockingConflict(
        OptimisticLockingConflictException ex,
        HttpServletRequest request) {

    String message = String.format(
            "Employee was modified by another request. "
            + "Please refresh and try again. Expected version: %d, current version: %d",
            ex.getExpectedVersion(), ex.getCurrentVersion()
    );

    var errorResponse = new ErrorResponse(
            HttpStatus.CONFLICT.value(),
            "Conflict",
            message,
            null,
            Instant.now(),
            request.getRequestURI()
    );

    return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
}
```

The response follows the error contract defined in DESIGN.md Section 6.

</details>

### Test scenario for optimistic locking

<details>
<summary>Expand for guidance</summary>

Write a test that simulates a version mismatch:

```java
@Test
@DisplayName("update with stale version throws optimistic locking exception")
void updateWithStaleVersionThrowsOptimisticLockingException() {
    // Arrange
    UUID employeeId = UUID.randomUUID();
    Employee employee = buildTestEmployee(employeeId);
    employee.setVersion(2L); // Current version in DB is 2

    when(employeeRepository.findById(employeeId))
            .thenReturn(Optional.of(employee));

    UpdateEmployeeRequest request = new UpdateEmployeeRequest(
            null, null, null, "New Department", null, null, null, null, 1L // Stale version
    );

    // Act & Assert
    assertThatThrownBy(() -> employeeService.update(employeeId, request))
            .isInstanceOf(OptimisticLockingConflictException.class);
}
```

This test verifies that the service detects a version mismatch and throws the appropriate exception. The handler test (verifying the 409 response) belongs in a controller integration test.

</details>

---

## Development Log

| Date | Entry |
|---|---|
| --- | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) -- Section 1 (fail fast with clear error messages), Section 2 (Spring Boot conventions)
- [DESIGN.md](../../../../docs/DESIGN.md) -- Section 6 (error contract: 409 Conflict response format)
- [PRD.md](../../../../docs/PRD.md) -- Stage 1 functional requirements (proper HTTP status codes: 409 on conflict)
