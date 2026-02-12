# T-006-04: Unit Tests for Get

| Field | Value |
|---|---|
| **Task ID** | T-006-04 |
| **Story** | [S1-006: Get Employee by ID](../../../stories/stage1/S1-006-get-employee.md) |
| **Status** | Pending |

---

## Objective

Write unit tests for the get employee flow covering the happy path, the not-found error case, and the inactive employee retrieval case, using JUnit 5 and Mockito without loading a Spring context.

---

## Checklist

- [ ] Test: `getById` with existing employee returns `EmployeeResponse`
- [ ] Test: `getById` with non-existent ID throws `EmployeeNotFoundException`
- [ ] Test: `getById` with inactive employee still returns response
- [ ] Use `@DisplayName` annotations
- [ ] Commit: `test(S1-006): add unit tests for EmployeeService.getById()`

---

## Details

### Test: getById with existing employee returns EmployeeResponse

<details>
<summary>Expand for guidance</summary>

Add this test method to the existing `EmployeeServiceTest` class (created in T-005-04):

```java
@Test
@DisplayName("getById() with existing employee returns EmployeeResponse")
void getByIdWithExistingEmployee() {
    // Arrange
    UUID employeeId = UUID.randomUUID();
    var entity = new Employee();
    entity.setId(employeeId);
    entity.setFirstName("Jane");
    entity.setLastName("Doe");
    entity.setEmail("jane.doe@example.com");
    entity.setStatus(EmployeeStatus.ACTIVE);

    var expectedResponse = new EmployeeResponse(
            employeeId, "Jane", "Doe", "jane.doe@example.com",
            "Engineering", "Software Engineer",
            LocalDate.of(2025, 1, 15), null, EmployeeStatus.ACTIVE,
            entity.getCreatedAt(), entity.getUpdatedAt()
    );

    given(repository.findById(employeeId)).willReturn(Optional.of(entity));
    given(mapper.toResponse(entity)).willReturn(expectedResponse);

    // Act
    EmployeeResponse result = service.getById(employeeId);

    // Assert
    assertThat(result).isEqualTo(expectedResponse);
    verify(mapper).toResponse(entity);
}
```

**Key points:**

- `repository.findById()` is mocked to return `Optional.of(entity)` -- the employee exists.
- The test verifies that `mapper.toResponse()` is called with the correct entity, ensuring the mapping layer is invoked.
- The assertion checks the complete response object for equality.

</details>

### Test: getById with non-existent ID throws EmployeeNotFoundException

<details>
<summary>Expand for guidance</summary>

```java
@Test
@DisplayName("getById() with non-existent ID throws EmployeeNotFoundException")
void getByIdWithNonExistentId() {
    // Arrange
    UUID nonExistentId = UUID.randomUUID();
    given(repository.findById(nonExistentId)).willReturn(Optional.empty());

    // Act & Assert
    assertThatThrownBy(() -> service.getById(nonExistentId))
            .isInstanceOf(EmployeeNotFoundException.class)
            .hasMessageContaining(nonExistentId.toString());

    verify(mapper, never()).toResponse(any());
}
```

**Key points:**

- `repository.findById()` is mocked to return `Optional.empty()` -- no employee with that ID.
- The test asserts the correct exception type and that the exception message includes the UUID (so the caller knows which ID was not found).
- `verify(mapper, never()).toResponse(any())` confirms the mapper is never called when the employee doesn't exist. There is no entity to map.

</details>

### Test: getById with inactive employee still returns response

<details>
<summary>Expand for guidance</summary>

```java
@Test
@DisplayName("getById() with inactive employee still returns EmployeeResponse")
void getByIdWithInactiveEmployee() {
    // Arrange
    UUID employeeId = UUID.randomUUID();
    var inactiveEntity = new Employee();
    inactiveEntity.setId(employeeId);
    inactiveEntity.setFirstName("Former");
    inactiveEntity.setLastName("Employee");
    inactiveEntity.setEmail("former@example.com");
    inactiveEntity.setStatus(EmployeeStatus.INACTIVE);

    var expectedResponse = new EmployeeResponse(
            employeeId, "Former", "Employee", "former@example.com",
            "Engineering", "Software Engineer",
            LocalDate.of(2020, 3, 1), null, EmployeeStatus.INACTIVE,
            inactiveEntity.getCreatedAt(), inactiveEntity.getUpdatedAt()
    );

    given(repository.findById(employeeId)).willReturn(Optional.of(inactiveEntity));
    given(mapper.toResponse(inactiveEntity)).willReturn(expectedResponse);

    // Act
    EmployeeResponse result = service.getById(employeeId);

    // Assert
    assertThat(result).isNotNull();
    assertThat(result.status()).isEqualTo(EmployeeStatus.INACTIVE);
}
```

**Why this test matters:**

This test explicitly verifies acceptance criteria AC4: "Inactive employees are still retrievable." Without this test, a future developer might add a status filter to `getById()` (e.g., to match the list endpoint behavior) and break the contract. The test serves as **living documentation** of the design decision.

The assertion checks `result.status()` is `INACTIVE`, making the intent unmistakable -- this is not a test about general retrieval, it is specifically about the soft-delete behavior.

</details>

### Test organization within EmployeeServiceTest

<details>
<summary>Expand for guidance</summary>

After completing both T-005-04 and T-006-04, the `EmployeeServiceTest` class will contain tests for both `create()` and `getById()`. Consider grouping them with `@Nested` classes for readability:

```java
@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private EmployeeRepository repository;

    @Mock
    private EmployeeMapper mapper;

    @InjectMocks
    private EmployeeService service;

    @Nested
    @DisplayName("create()")
    class Create {
        // T-005-04 tests here
    }

    @Nested
    @DisplayName("getById()")
    class GetById {
        // T-006-04 tests here
    }
}
```

`@Nested` test classes in JUnit 5 share the enclosing class's `@Mock` and `@InjectMocks` fields. They provide logical grouping and produce hierarchical test output:

```
EmployeeServiceTest
  create()
    create() with valid data saves employee and returns response
    create() with duplicate email throws DuplicateEmailException
    ...
  getById()
    getById() with existing employee returns EmployeeResponse
    getById() with non-existent ID throws EmployeeNotFoundException
    ...
```

This is optional but recommended as the test class grows.

</details>

---

## Development Log

| Date | Entry |
|---|---|
| --- | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) -- Section 7 (JUnit 5 + Mockito, @DisplayName, Arrange-Act-Assert, tests must be independent and repeatable)
- [DESIGN.md](../../../../docs/DESIGN.md) -- Section 6 (error contract)
- [PRD.md](../../../../docs/PRD.md) -- Functional requirements (read a single employee by ID, soft-delete preserves direct access)
