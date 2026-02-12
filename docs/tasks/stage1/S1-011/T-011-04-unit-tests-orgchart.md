# T-011-04: Unit Tests for Org Chart

| Field | Value |
|---|---|
| **Task ID** | T-011-04 |
| **Story** | [S1-011: Org Chart](../../../stories/stage1/S1-011-org-chart.md) |
| **Status** | Pending |

---

## Objective

Test direct reports retrieval and reporting chain traversal including edge cases like circular references and empty results.

---

## Checklist

- [ ] Test: `getDirectReports` returns correct employees for a manager
- [ ] Test: `getDirectReports` for non-existent employee throws `EmployeeNotFoundException`
- [ ] Test: `getDirectReports` for employee with no reports returns empty list
- [ ] Test: `getReportingChain` returns correct order (immediate manager first, CEO last)
- [ ] Test: `getReportingChain` for top-level employee (no manager) returns empty list
- [ ] Test: `getReportingChain` detects circular reference and terminates
- [ ] Test: `getReportingChain` respects max depth (50)
- [ ] Use `@DisplayName` for readable test names
- [ ] Commit: `test(S1-011): add unit tests for org chart`

---

## Details

### Direct reports tests

<details>
<summary>Expand for guidance</summary>

```java
@Test
@DisplayName("getDirectReports() returns active employees reporting to manager")
void getDirectReports_returnsReports() {
    var managerId = UUID.randomUUID();
    var reports = List.of(createActiveEmployee("Alice"), createActiveEmployee("Bob"));
    when(repository.existsById(managerId)).thenReturn(true);
    when(repository.findByManagerIdAndStatus(managerId, EmployeeStatus.ACTIVE))
        .thenReturn(reports);
    when(mapper.toResponse(any())).thenAnswer(inv -> createResponseFrom(inv.getArgument(0)));

    var result = service.getDirectReports(managerId);

    assertThat(result).hasSize(2);
}

@Test
@DisplayName("getDirectReports() returns empty list when no reports exist")
void getDirectReports_returnsEmptyList() {
    var managerId = UUID.randomUUID();
    when(repository.existsById(managerId)).thenReturn(true);
    when(repository.findByManagerIdAndStatus(managerId, EmployeeStatus.ACTIVE))
        .thenReturn(List.of());

    var result = service.getDirectReports(managerId);

    assertThat(result).isEmpty();
}
```

</details>

### Reporting chain tests

<details>
<summary>Expand for guidance</summary>

Set up a chain: Employee A → Manager B → Director C (no manager):

```java
@Test
@DisplayName("getReportingChain() returns chain from immediate manager to top")
void getReportingChain_returnsOrderedChain() {
    var ceo = createEmployee("CEO", null);     // no manager
    var director = createEmployee("Director", ceo);
    var employee = createEmployee("Employee", director);

    when(repository.findById(employee.getId())).thenReturn(Optional.of(employee));
    when(mapper.toResponse(director)).thenReturn(createResponseFrom(director));
    when(mapper.toResponse(ceo)).thenReturn(createResponseFrom(ceo));

    var chain = service.getReportingChain(employee.getId());

    assertThat(chain).hasSize(2);
    // First = immediate manager, Last = top-level
    assertThat(chain.get(0).firstName()).isEqualTo("Director");
    assertThat(chain.get(1).firstName()).isEqualTo("CEO");
}

@Test
@DisplayName("getReportingChain() detects circular reference and stops")
void getReportingChain_handlesCircularReference() {
    var employeeA = createEmployee("A", null);
    var employeeB = createEmployee("B", employeeA);
    employeeA.setManager(employeeB); // circular!

    when(repository.findById(employeeA.getId())).thenReturn(Optional.of(employeeA));
    when(mapper.toResponse(any())).thenAnswer(inv -> createResponseFrom(inv.getArgument(0)));

    var chain = service.getReportingChain(employeeA.getId());

    // Should terminate without infinite loop
    assertThat(chain).hasSizeLessThanOrEqualTo(2);
}
```

</details>

---

## Development Log

| Date | Entry |
|---|---|
| — | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) — Section 7: Testing strategy, Arrange-Act-Assert
