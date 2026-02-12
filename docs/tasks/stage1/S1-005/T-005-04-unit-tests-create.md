# T-005-04: Unit Tests for Create

| Field | Value |
|---|---|
| **Task ID** | T-005-04 |
| **Story** | [S1-005: Create Employee](../../../stories/stage1/S1-005-create-employee.md) |
| **Status** | Pending |

---

## Objective

Write unit tests for the create employee flow covering the happy path and all business-rule error cases, using JUnit 5 and Mockito without loading a Spring context.

---

## Checklist

- [ ] Create `EmployeeServiceTest` with `@ExtendWith(MockitoExtension.class)`
- [ ] Mock `EmployeeRepository` and `EmployeeMapper`
- [ ] Test: create with valid data returns `EmployeeResponse`
- [ ] Test: create with duplicate email throws `DuplicateEmailException`
- [ ] Test: create with non-existent manager throws `ManagerNotFoundException`
- [ ] Test: create with inactive manager throws `ManagerNotFoundException`
- [ ] Test: create without manager succeeds (manager is optional)
- [ ] Use `@DisplayName` for readable test names
- [ ] Follow Arrange-Act-Assert pattern
- [ ] Commit: `test(S1-005): add unit tests for EmployeeService.create()`

---

## Details

### Test class skeleton

<details>
<summary>Expand for guidance</summary>

Create `EmployeeServiceTest` in `src/test/java/com/timetracker/employee/`. Per GUIDELINES.md Section 7, the test class name matches the source class: `EmployeeService` -> `EmployeeServiceTest`.

```java
package com.timetracker.employee;

import com.timetracker.employee.dto.CreateEmployeeRequest;
import com.timetracker.employee.dto.EmployeeResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private EmployeeRepository repository;

    @Mock
    private EmployeeMapper mapper;

    @InjectMocks
    private EmployeeService service;
}
```

**Why `@ExtendWith(MockitoExtension.class)` instead of `@SpringBootTest`?**

Unit tests should not load the Spring context. They test the class in isolation with its dependencies mocked. This makes tests:
- **Fast** -- no context startup overhead (milliseconds, not seconds).
- **Focused** -- failures point directly to the class under test.
- **Independent** -- no shared state from the Spring context.

`@InjectMocks` creates the `EmployeeService` instance and injects the `@Mock` fields into its constructor automatically.

</details>

### Test: create with valid data returns EmployeeResponse

<details>
<summary>Expand for guidance</summary>

```java
@Test
@DisplayName("create() with valid data saves employee and returns response")
void createWithValidData() {
    // Arrange
    var request = new CreateEmployeeRequest(
            "Jane", "Doe", "jane.doe@example.com",
            "Engineering", "Software Engineer",
            LocalDate.of(2025, 1, 15), null
    );
    var entity = new Employee();
    entity.setId(UUID.randomUUID());
    var expectedResponse = new EmployeeResponse(
            entity.getId(), "Jane", "Doe", "jane.doe@example.com",
            "Engineering", "Software Engineer",
            LocalDate.of(2025, 1, 15), null, EmployeeStatus.ACTIVE,
            entity.getCreatedAt(), entity.getUpdatedAt()
    );

    given(repository.existsByEmail("jane.doe@example.com")).willReturn(false);
    given(mapper.toEntity(request)).willReturn(entity);
    given(repository.save(entity)).willReturn(entity);
    given(mapper.toResponse(entity)).willReturn(expectedResponse);

    // Act
    EmployeeResponse result = service.create(request);

    // Assert
    assertThat(result).isEqualTo(expectedResponse);
    verify(repository).save(entity);
}
```

**Pattern notes:**

- **Arrange-Act-Assert** is clearly separated with comments.
- `given()` (from `BDDMockito`) reads more naturally than `when()` in the Arrange section, since `when()` reads like an action but it is setup.
- `verify()` confirms the repository was actually called to save the entity.
- The test focuses on one behavior: valid input produces a response.

</details>

### Test: create with duplicate email throws DuplicateEmailException

<details>
<summary>Expand for guidance</summary>

```java
@Test
@DisplayName("create() with duplicate email throws DuplicateEmailException")
void createWithDuplicateEmail() {
    // Arrange
    var request = new CreateEmployeeRequest(
            "Jane", "Doe", "existing@example.com",
            "Engineering", "Software Engineer",
            LocalDate.of(2025, 1, 15), null
    );

    given(repository.existsByEmail("existing@example.com")).willReturn(true);

    // Act & Assert
    assertThatThrownBy(() -> service.create(request))
            .isInstanceOf(DuplicateEmailException.class)
            .hasMessageContaining("existing@example.com");

    verify(repository, never()).save(any());
}
```

The `verify(repository, never()).save(any())` assertion is important -- it confirms the service **short-circuits** and does not attempt to save when the email is already taken. This is a guard clause pattern: fail fast, fail clearly.

</details>

### Test: create with non-existent manager throws ManagerNotFoundException

<details>
<summary>Expand for guidance</summary>

```java
@Test
@DisplayName("create() with non-existent manager throws ManagerNotFoundException")
void createWithNonExistentManager() {
    // Arrange
    UUID managerId = UUID.randomUUID();
    var request = new CreateEmployeeRequest(
            "Jane", "Doe", "jane.doe@example.com",
            "Engineering", "Software Engineer",
            LocalDate.of(2025, 1, 15), managerId
    );

    given(repository.existsByEmail("jane.doe@example.com")).willReturn(false);
    given(repository.findById(managerId)).willReturn(Optional.empty());

    // Act & Assert
    assertThatThrownBy(() -> service.create(request))
            .isInstanceOf(ManagerNotFoundException.class)
            .hasMessageContaining(managerId.toString());

    verify(repository, never()).save(any());
}
```

</details>

### Test: create with inactive manager throws ManagerNotFoundException

<details>
<summary>Expand for guidance</summary>

```java
@Test
@DisplayName("create() with inactive manager throws ManagerNotFoundException")
void createWithInactiveManager() {
    // Arrange
    UUID managerId = UUID.randomUUID();
    var request = new CreateEmployeeRequest(
            "Jane", "Doe", "jane.doe@example.com",
            "Engineering", "Software Engineer",
            LocalDate.of(2025, 1, 15), managerId
    );

    var inactiveManager = new Employee();
    inactiveManager.setId(managerId);
    inactiveManager.setStatus(EmployeeStatus.INACTIVE);

    given(repository.existsByEmail("jane.doe@example.com")).willReturn(false);
    given(repository.findById(managerId)).willReturn(Optional.of(inactiveManager));

    // Act & Assert
    assertThatThrownBy(() -> service.create(request))
            .isInstanceOf(ManagerNotFoundException.class);

    verify(repository, never()).save(any());
}
```

This test is distinct from the "non-existent manager" test above. The manager **exists** in the database but is **inactive**. The acceptance criteria (AC4) requires that inactive managers be treated as invalid. The service logic uses `.filter(emp -> emp.getStatus() == EmployeeStatus.ACTIVE)` to unify both cases under a single exception.

</details>

### Test: create without manager succeeds

<details>
<summary>Expand for guidance</summary>

```java
@Test
@DisplayName("create() without manager_id succeeds (manager is optional)")
void createWithoutManager() {
    // Arrange
    var request = new CreateEmployeeRequest(
            "Jane", "Doe", "jane.doe@example.com",
            "Engineering", "Software Engineer",
            LocalDate.of(2025, 1, 15), null  // no manager
    );
    var entity = new Employee();
    entity.setId(UUID.randomUUID());
    var expectedResponse = new EmployeeResponse(
            entity.getId(), "Jane", "Doe", "jane.doe@example.com",
            "Engineering", "Software Engineer",
            LocalDate.of(2025, 1, 15), null, EmployeeStatus.ACTIVE,
            entity.getCreatedAt(), entity.getUpdatedAt()
    );

    given(repository.existsByEmail("jane.doe@example.com")).willReturn(false);
    given(mapper.toEntity(request)).willReturn(entity);
    given(repository.save(entity)).willReturn(entity);
    given(mapper.toResponse(entity)).willReturn(expectedResponse);

    // Act
    EmployeeResponse result = service.create(request);

    // Assert
    assertThat(result).isNotNull();
    assertThat(result.managerId()).isNull();
    verify(repository, never()).findById(any());  // manager lookup should be skipped
}
```

The key assertion here is `verify(repository, never()).findById(any())` -- when `managerId` is null, the service should **not** query the repository for a manager at all. This verifies the conditional logic works correctly.

</details>

---

## Development Log

| Date | Entry |
|---|---|
| --- | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) -- Section 7 (JUnit 5 + Mockito, 80%+ coverage on services, @DisplayName, Arrange-Act-Assert)
- [DESIGN.md](../../../../docs/DESIGN.md) -- Section 6 (error contract)
- [PRD.md](../../../../docs/PRD.md) -- Validation rules (email unique, manager must be active)
