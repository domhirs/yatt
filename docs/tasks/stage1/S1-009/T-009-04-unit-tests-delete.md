# T-009-04: Unit Tests for Delete

| Field | Value |
|---|---|
| **Task ID** | T-009-04 |
| **Story** | [S1-009: Delete Employee](../../../stories/stage1/S1-009-delete-employee.md) |
| **Status** | Pending |

---

## Objective

Test soft-delete logic including the manager dependency guard and all edge cases.

---

## Checklist

- [ ] Test: delete sets status to `INACTIVE`
- [ ] Test: delete non-existent employee throws `EmployeeNotFoundException`
- [ ] Test: delete already-inactive employee throws conflict exception
- [ ] Test: delete manager with active reports throws `ActiveReportsException`
- [ ] Test: delete manager with zero active reports succeeds
- [ ] Test: verify `repository.save()` is called with updated entity
- [ ] Use `@DisplayName` for readable test names
- [ ] Commit: `test(S1-009): add unit tests for delete`

---

## Details

### Test cases

<details>
<summary>Expand for guidance</summary>

```java
@ExtendWith(MockitoExtension.class)
class EmployeeServiceDeleteTest {

    @Mock private EmployeeRepository repository;
    @Mock private EmployeeMapper mapper;
    @InjectMocks private EmployeeService service;

    @Test
    @DisplayName("delete() sets employee status to INACTIVE")
    void delete_setsStatusToInactive() {
        var employee = createActiveEmployee();
        when(repository.findById(employee.getId())).thenReturn(Optional.of(employee));
        when(repository.countByManagerIdAndStatus(employee.getId(), EmployeeStatus.ACTIVE))
            .thenReturn(0L);

        service.delete(employee.getId());

        assertThat(employee.getStatus()).isEqualTo(EmployeeStatus.INACTIVE);
        verify(repository).save(employee);
    }

    @Test
    @DisplayName("delete() throws EmployeeNotFoundException for unknown ID")
    void delete_throwsWhenNotFound() {
        var id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete(id))
            .isInstanceOf(EmployeeNotFoundException.class);
    }

    @Test
    @DisplayName("delete() throws when employee is already inactive")
    void delete_throwsWhenAlreadyInactive() {
        var employee = createInactiveEmployee();
        when(repository.findById(employee.getId())).thenReturn(Optional.of(employee));

        assertThatThrownBy(() -> service.delete(employee.getId()))
            .isInstanceOf(EmployeeAlreadyInactiveException.class);
    }

    @Test
    @DisplayName("delete() throws ActiveReportsException when manager has active reports")
    void delete_throwsWhenManagerHasActiveReports() {
        var employee = createActiveEmployee();
        when(repository.findById(employee.getId())).thenReturn(Optional.of(employee));
        when(repository.countByManagerIdAndStatus(employee.getId(), EmployeeStatus.ACTIVE))
            .thenReturn(3L);

        assertThatThrownBy(() -> service.delete(employee.getId()))
            .isInstanceOf(ActiveReportsException.class)
            .hasMessageContaining("3 active employee(s)");
    }
}
```

Follow Arrange-Act-Assert pattern. Each test verifies one behavior.

</details>

---

## Development Log

| Date | Entry |
|---|---|
| — | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) — Section 7: Testing strategy
