# T-009-01: Soft Delete Service Method

| Field | Value |
|---|---|
| **Task ID** | T-009-01 |
| **Story** | [S1-009: Delete Employee](../../../stories/stage1/S1-009-delete-employee.md) |
| **Status** | Pending |

---

## Objective

Implement `EmployeeService.delete()` as a soft delete that transitions an employee's status to `INACTIVE` rather than physically removing the row.

---

## Checklist

- [ ] Add `delete(UUID id)` method to `EmployeeService`
- [ ] Find employee or throw `EmployeeNotFoundException`
- [ ] Check if employee is already `INACTIVE` — throw conflict (409)
- [ ] Check for active reports (delegated to T-009-03 guard)
- [ ] Set `status` to `INACTIVE`
- [ ] Save entity (triggers `updatedAt` update)
- [ ] Return void (controller returns 204)
- [ ] Commit: `feat(S1-009): implement soft-delete service method`

---

## Details

### Service method

<details>
<summary>Expand for guidance</summary>

```java
public void delete(UUID id) {
    Employee employee = repository.findById(id)
        .orElseThrow(() -> new EmployeeNotFoundException(id));

    if (employee.getStatus() == EmployeeStatus.INACTIVE) {
        throw new EmployeeAlreadyInactiveException(id);
    }

    // Guard: check for active direct reports (see T-009-03)
    long activeReports = repository.countByManagerIdAndStatus(id, EmployeeStatus.ACTIVE);
    if (activeReports > 0) {
        throw new ActiveReportsException(id, activeReports);
    }

    employee.setStatus(EmployeeStatus.INACTIVE);
    repository.save(employee);
}
```

**Why soft delete?** Preserves historical data for reporting. Employees who tracked time, had budgets, or were part of approval chains should remain in the system for referential integrity.

**Why not `@SQLDelete`?** Hibernate's `@SQLDelete` annotation can automate soft deletes, but it's less explicit and harder to debug. For a learning project, explicit status changes in the service layer are clearer.

</details>

---

## Development Log

| Date | Entry |
|---|---|
| — | *No entries yet* |

---

## References

- [PRD.md](../../../../docs/PRD.md) — Validation rules: cannot delete a manager of others
- [GUIDELINES.md](../../../../docs/GUIDELINES.md) — Section 2: Thin controllers, service logic
