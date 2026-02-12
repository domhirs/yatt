# T-008-04: Unit Tests for Update

| Field | Value |
|---|---|
| **Task ID** | T-008-04 |
| **Story** | [S1-008: Update Employee](../../../stories/stage1/S1-008-update-employee.md) |
| **Status** | Pending |

---

## Objective

Test partial update logic including field-level application, email uniqueness validation, manager validation, and edge cases where no fields are changed.

---

## Checklist

- [ ] Test: update single field (e.g., department) preserves other fields
- [ ] Test: update email validates uniqueness
- [ ] Test: update with duplicate email throws `DuplicateEmailException`
- [ ] Test: update with invalid `managerId` throws `ManagerNotFoundException`
- [ ] Test: update non-existent employee throws `EmployeeNotFoundException`
- [ ] Test: all null fields in request results in no changes
- [ ] Commit: `test(S1-008): add unit tests for employee update service`

---

## Details

### Test class setup

<details>
<summary>Expand for guidance</summary>

Create `EmployeeServiceUpdateTest` (or add to the existing `EmployeeServiceTest`) using JUnit 5 and Mockito. Follow the same structure as the list tests (T-007-04).

```java
package com.timetracker.employee;

import com.timetracker.employee.dto.EmployeeResponse;
import com.timetracker.employee.dto.UpdateEmployeeRequest;
import org.junit.jupiter.api.BeforeEach;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceUpdateTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private EmployeeMapper employeeMapper;

    @InjectMocks
    private EmployeeService employeeService;

    private UUID employeeId;
    private Employee existingEmployee;

    @BeforeEach
    void setUp() {
        employeeId = UUID.randomUUID();
        existingEmployee = new Employee();
        existingEmployee.setId(employeeId);
        existingEmployee.setFirstName("Jane");
        existingEmployee.setLastName("Smith");
        existingEmployee.setEmail("jane.smith@example.com");
        existingEmployee.setDepartment("Engineering");
        existingEmployee.setRole("Senior Developer");
        existingEmployee.setHireDate(LocalDate.of(2025, 3, 15));
        existingEmployee.setStatus(EmployeeStatus.ACTIVE);
        existingEmployee.setVersion(0L);
    }
}
```

Each test method follows **Arrange-Act-Assert** and uses `@DisplayName` for readability.

</details>

### Test: update single field preserves other fields

<details>
<summary>Expand for guidance</summary>

```java
@Test
@DisplayName("update with only department changes department and preserves other fields")
void updateWithOnlyDepartmentChangesDepartmentAndPreservesOtherFields() {
    // Arrange
    when(employeeRepository.findById(employeeId))
            .thenReturn(Optional.of(existingEmployee));
    when(employeeRepository.save(any(Employee.class)))
            .thenReturn(existingEmployee);

    EmployeeResponse expectedResponse = new EmployeeResponse(
            employeeId, "Jane", "Smith", "jane.smith@example.com",
            "Product", "Senior Developer", LocalDate.of(2025, 3, 15),
            null, EmployeeStatus.ACTIVE, 1L, null, null
    );
    when(employeeMapper.toResponse(any(Employee.class)))
            .thenReturn(expectedResponse);

    UpdateEmployeeRequest request = new UpdateEmployeeRequest(
            null, null, null, "Product", null, null, null, null, 0L
    );

    // Act
    EmployeeResponse result = employeeService.update(employeeId, request);

    // Assert
    verify(employeeMapper).updateEntity(existingEmployee, request);
    verify(employeeRepository).save(existingEmployee);
    assertThat(result.department()).isEqualTo("Product");
    assertThat(result.firstName()).isEqualTo("Jane"); // Preserved
    assertThat(result.lastName()).isEqualTo("Smith");  // Preserved
}
```

The key assertion is that `mapper.updateEntity()` is called with the request, and only the non-null field (`department`) is applied. The other fields remain unchanged on the entity.

</details>

### Test: update email validates uniqueness

<details>
<summary>Expand for guidance</summary>

```java
@Test
@DisplayName("update with new unique email succeeds")
void updateWithNewUniqueEmailSucceeds() {
    // Arrange
    when(employeeRepository.findById(employeeId))
            .thenReturn(Optional.of(existingEmployee));
    when(employeeRepository.existsByEmailAndIdNot("new.email@example.com", employeeId))
            .thenReturn(false);
    when(employeeRepository.save(any(Employee.class)))
            .thenReturn(existingEmployee);
    when(employeeMapper.toResponse(any(Employee.class)))
            .thenReturn(mock(EmployeeResponse.class));

    UpdateEmployeeRequest request = new UpdateEmployeeRequest(
            null, null, "new.email@example.com", null, null, null, null, null, 0L
    );

    // Act
    employeeService.update(employeeId, request);

    // Assert
    verify(employeeRepository).existsByEmailAndIdNot("new.email@example.com", employeeId);
    verify(employeeRepository).save(existingEmployee);
}
```

This verifies that the email uniqueness check is performed when the email field is present in the request.

</details>

### Test: update with duplicate email throws DuplicateEmailException

<details>
<summary>Expand for guidance</summary>

```java
@Test
@DisplayName("update with duplicate email throws DuplicateEmailException")
void updateWithDuplicateEmailThrowsDuplicateEmailException() {
    // Arrange
    when(employeeRepository.findById(employeeId))
            .thenReturn(Optional.of(existingEmployee));
    when(employeeRepository.existsByEmailAndIdNot("taken@example.com", employeeId))
            .thenReturn(true);

    UpdateEmployeeRequest request = new UpdateEmployeeRequest(
            null, null, "taken@example.com", null, null, null, null, null, 0L
    );

    // Act & Assert
    assertThatThrownBy(() -> employeeService.update(employeeId, request))
            .isInstanceOf(DuplicateEmailException.class);

    verify(employeeRepository, never()).save(any());
}
```

The `never().save()` verification confirms that the entity is not persisted when validation fails. This is a fail-fast behavior.

</details>

### Test: update with invalid managerId throws ManagerNotFoundException

<details>
<summary>Expand for guidance</summary>

```java
@Test
@DisplayName("update with non-existent managerId throws ManagerNotFoundException")
void updateWithNonExistentManagerIdThrowsManagerNotFoundException() {
    // Arrange
    UUID invalidManagerId = UUID.randomUUID();
    when(employeeRepository.findById(employeeId))
            .thenReturn(Optional.of(existingEmployee));
    when(employeeRepository.findById(invalidManagerId))
            .thenReturn(Optional.empty());

    UpdateEmployeeRequest request = new UpdateEmployeeRequest(
            null, null, null, null, null, null, invalidManagerId, null, 0L
    );

    // Act & Assert
    assertThatThrownBy(() -> employeeService.update(employeeId, request))
            .isInstanceOf(ManagerNotFoundException.class);

    verify(employeeRepository, never()).save(any());
}
```

This test covers the case where the manager ID does not correspond to any existing employee. The service should throw `ManagerNotFoundException` before attempting to save.

</details>

### Test: update non-existent employee throws EmployeeNotFoundException

<details>
<summary>Expand for guidance</summary>

```java
@Test
@DisplayName("update non-existent employee throws EmployeeNotFoundException")
void updateNonExistentEmployeeThrowsEmployeeNotFoundException() {
    // Arrange
    UUID nonExistentId = UUID.randomUUID();
    when(employeeRepository.findById(nonExistentId))
            .thenReturn(Optional.empty());

    UpdateEmployeeRequest request = new UpdateEmployeeRequest(
            null, null, null, "Product", null, null, null, null, 0L
    );

    // Act & Assert
    assertThatThrownBy(() -> employeeService.update(nonExistentId, request))
            .isInstanceOf(EmployeeNotFoundException.class);

    verify(employeeRepository, never()).save(any());
    verify(employeeMapper, never()).updateEntity(any(), any());
}
```

This is the first check in the update method: if the employee is not found, fail immediately. No mapper or save calls should occur.

</details>

### Test: all null fields in request results in no changes

<details>
<summary>Expand for guidance</summary>

```java
@Test
@DisplayName("update with all null fields applies no changes but still saves")
void updateWithAllNullFieldsAppliesNoChangesButStillSaves() {
    // Arrange
    when(employeeRepository.findById(employeeId))
            .thenReturn(Optional.of(existingEmployee));
    when(employeeRepository.save(existingEmployee))
            .thenReturn(existingEmployee);
    when(employeeMapper.toResponse(existingEmployee))
            .thenReturn(mock(EmployeeResponse.class));

    UpdateEmployeeRequest request = new UpdateEmployeeRequest(
            null, null, null, null, null, null, null, null, 0L
    );

    // Act
    employeeService.update(employeeId, request);

    // Assert
    verify(employeeMapper).updateEntity(existingEmployee, request);
    verify(employeeRepository).save(existingEmployee);
    // No email uniqueness check since email is null in request
    verify(employeeRepository, never()).existsByEmailAndIdNot(any(), any());
}
```

When all fields are null, the mapper's `updateEntity` method is called but applies no changes (every null check skips). The entity is still saved (which is idempotent since nothing changed). No validation checks for email or manager are triggered because those fields are null in the request.

This is a valid edge case: the client sends an empty PATCH body `{}`. It should not cause an error.

</details>

---

## Development Log

| Date | Entry |
|---|---|
| --- | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) -- Section 7 (testing strategy: JUnit 5 + Mockito, Arrange-Act-Assert, @DisplayName, independent tests)
- [DESIGN.md](../../../../docs/DESIGN.md) -- Section 6 (error contract for 404, 409, 422 responses)
- [PRD.md](../../../../docs/PRD.md) -- Success criteria (unit test coverage >= 80% on service layer), validation rules (email uniqueness, manager validation)
