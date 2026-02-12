# T-011-01: Direct Reports Query

| Field | Value |
|---|---|
| **Task ID** | T-011-01 |
| **Story** | [S1-011: Org Chart](../../../stories/stage1/S1-011-org-chart.md) |
| **Status** | Pending |

---

## Objective

Implement retrieval of an employee's direct reports — the list of active employees who report directly to a given manager.

---

## Checklist

- [ ] Add `getDirectReports(UUID managerId)` to `EmployeeService`
- [ ] Verify the manager employee exists (throw `EmployeeNotFoundException` if not)
- [ ] Query `repository.findByManagerIdAndStatus(managerId, ACTIVE)`
- [ ] Map results to `List<EmployeeResponse>`
- [ ] Return empty list if no reports (not an error)
- [ ] Commit: `feat(S1-011): implement direct reports query`

---

## Details

### Service method

<details>
<summary>Expand for guidance</summary>

```java
public List<EmployeeResponse> getDirectReports(UUID managerId) {
    if (!repository.existsById(managerId)) {
        throw new EmployeeNotFoundException(managerId);
    }

    return repository.findByManagerIdAndStatus(managerId, EmployeeStatus.ACTIVE)
        .stream()
        .map(mapper::toResponse)
        .toList();
}
```

This is a simple one-level query. The `findByManagerIdAndStatus` method was added to `EmployeeRepository` in T-004-02.

**Why only ACTIVE reports?** Inactive employees should not appear in org chart views. If a caller needs to see all historical reports, they can use the list endpoint with `status=INACTIVE` filter.

**Why check `existsById` first?** To distinguish "employee exists but has no reports" (return empty list) from "employee doesn't exist" (return 404). Without this check, both cases would return an empty list, which is confusing for API consumers.

</details>

---

## Development Log

| Date | Entry |
|---|---|
| — | *No entries yet* |

---

## References

- [PRD.md](../../../../docs/PRD.md) — Org chart: retrieve direct reports
- [GUIDELINES.md](../../../../docs/GUIDELINES.md) — Section 2: Spring Boot conventions
