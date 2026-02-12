# T-007-04: Unit Tests for List

| Field | Value |
|---|---|
| **Task ID** | T-007-04 |
| **Story** | [S1-007: List Employees](../../../stories/stage1/S1-007-list-employees.md) |
| **Status** | Pending |

---

## Objective

Test pagination, sorting, and filtering logic in the service layer, verifying that specifications are correctly built and pagination metadata is accurately mapped.

---

## Checklist

- [ ] Test: list returns paginated results with correct metadata
- [ ] Test: list with department filter only returns matching employees
- [ ] Test: list with role filter works
- [ ] Test: list with combined filters (department + role)
- [ ] Test: list defaults to ACTIVE employees only
- [ ] Test: empty results return empty content (not exception)
- [ ] Commit: `test(S1-007): add unit tests for employee list service`

---

## Details

### Test class setup

<details>
<summary>Expand for guidance</summary>

Create `EmployeeServiceListTest` (or add to the existing `EmployeeServiceTest` if it exists) using JUnit 5 and Mockito. No Spring context is needed — these are pure unit tests.

```java
package com.timetracker.employee;

import com.timetracker.employee.dto.EmployeeResponse;
import com.timetracker.employee.dto.PagedEmployeeResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceListTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private EmployeeMapper employeeMapper;

    @InjectMocks
    private EmployeeService employeeService;

    private Employee activeEmployee;
    private EmployeeResponse employeeResponse;

    @BeforeEach
    void setUp() {
        activeEmployee = // ... build a test Employee entity
        employeeResponse = // ... build a matching EmployeeResponse
    }
}
```

Follow the **Arrange-Act-Assert** pattern for every test. Use `@DisplayName` for readable names.

</details>

### Test: list returns paginated results with correct metadata

<details>
<summary>Expand for guidance</summary>

```java
@Test
@DisplayName("list returns paginated results with correct metadata")
void listReturnsPaginatedResultsWithCorrectMetadata() {
    // Arrange
    Pageable pageable = PageRequest.of(0, 20);
    Page<Employee> page = new PageImpl<>(
            List.of(activeEmployee),
            pageable,
            1L // totalElements
    );

    when(employeeRepository.findAll(any(Specification.class), any(Pageable.class)))
            .thenReturn(page);
    when(employeeMapper.toResponse(activeEmployee))
            .thenReturn(employeeResponse);

    // Act
    PagedEmployeeResponse result = employeeService.list(null, null, null, pageable);

    // Assert
    assertThat(result.content()).hasSize(1);
    assertThat(result.page()).isEqualTo(0);
    assertThat(result.size()).isEqualTo(20);
    assertThat(result.totalElements()).isEqualTo(1L);
    assertThat(result.totalPages()).isEqualTo(1);
}
```

This verifies that the Spring Data `Page` object is correctly mapped to `PagedEmployeeResponse`. The content size, page number, page size, total elements, and total pages must all carry through.

</details>

### Test: list with department filter only returns matching employees

<details>
<summary>Expand for guidance</summary>

```java
@Test
@DisplayName("list with department filter passes specification to repository")
@SuppressWarnings("unchecked")
void listWithDepartmentFilterPassesSpecificationToRepository() {
    // Arrange
    Pageable pageable = PageRequest.of(0, 20);
    Page<Employee> page = new PageImpl<>(List.of(activeEmployee), pageable, 1L);

    ArgumentCaptor<Specification<Employee>> specCaptor =
            ArgumentCaptor.forClass(Specification.class);

    when(employeeRepository.findAll(specCaptor.capture(), any(Pageable.class)))
            .thenReturn(page);
    when(employeeMapper.toResponse(any(Employee.class)))
            .thenReturn(employeeResponse);

    // Act
    employeeService.list("Engineering", null, null, pageable);

    // Assert
    verify(employeeRepository).findAll(specCaptor.capture(), any(Pageable.class));
    Specification<Employee> capturedSpec = specCaptor.getValue();
    assertThat(capturedSpec).isNotNull();
}
```

Use `ArgumentCaptor` to capture the `Specification` passed to the repository. While you cannot easily assert the internal predicate of a specification in a unit test, you can verify that the specification is non-null and that the repository was called with the correct `Pageable`.

For deeper specification testing (verifying the actual SQL predicate), consider integration tests with Testcontainers (covered in S1-014).

</details>

### Test: list defaults to ACTIVE employees only

<details>
<summary>Expand for guidance</summary>

```java
@Test
@DisplayName("list with no status filter defaults to ACTIVE employees")
void listWithNoStatusFilterDefaultsToActive() {
    // Arrange
    Pageable pageable = PageRequest.of(0, 20);
    Page<Employee> page = new PageImpl<>(List.of(), pageable, 0L);

    when(employeeRepository.findAll(any(Specification.class), any(Pageable.class)))
            .thenReturn(page);

    // Act
    employeeService.list(null, null, null, pageable);

    // Assert — the service should have applied ACTIVE as the default status
    // Verification: the specification was built with status=ACTIVE
    verify(employeeRepository).findAll(any(Specification.class), any(Pageable.class));
}
```

The key assertion is that when `status` is `null`, the service applies `EmployeeStatus.ACTIVE` as the default. The specification builder (`EmployeeSpecifications.withFilters`) always receives a non-null status.

</details>

### Test: empty results return empty content

<details>
<summary>Expand for guidance</summary>

```java
@Test
@DisplayName("list with no matching results returns empty content, not exception")
void listWithNoMatchingResultsReturnsEmptyContent() {
    // Arrange
    Pageable pageable = PageRequest.of(0, 20);
    Page<Employee> emptyPage = new PageImpl<>(List.of(), pageable, 0L);

    when(employeeRepository.findAll(any(Specification.class), any(Pageable.class)))
            .thenReturn(emptyPage);

    // Act
    PagedEmployeeResponse result = employeeService.list("NonExistentDept", null, null, pageable);

    // Assert
    assertThat(result.content()).isEmpty();
    assertThat(result.totalElements()).isZero();
    assertThat(result.totalPages()).isZero();
    assertThat(result.page()).isEqualTo(0);
}
```

This is explicitly required by AC5 of the story: empty results return 200 OK with an empty `content` array, not 404. The service layer should never throw an exception for zero results.

</details>

---

## Development Log

| Date | Entry |
|---|---|
| --- | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) -- Section 7 (testing strategy: JUnit 5 + Mockito, Arrange-Act-Assert, @DisplayName)
- [DESIGN.md](../../../../docs/DESIGN.md) -- Section 6 (response structure for pagination)
- [PRD.md](../../../../docs/PRD.md) -- Success criteria (unit test coverage >= 80% on service layer)
