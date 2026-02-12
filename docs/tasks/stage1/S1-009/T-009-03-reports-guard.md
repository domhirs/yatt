# T-009-03: Manager Dependency Guard

| Field | Value |
|---|---|
| **Task ID** | T-009-03 |
| **Story** | [S1-009: Delete Employee](../../../stories/stage1/S1-009-delete-employee.md) |
| **Status** | Pending |

---

## Objective

Prevent deactivation of employees who manage other active employees, enforcing the business rule that reports must be reassigned first.

---

## Checklist

- [ ] Before soft-deleting, check `countByManagerIdAndStatus(id, ACTIVE)`
- [ ] If count > 0, throw `ActiveReportsException` with the count
- [ ] Create `ActiveReportsException` if not already created (see S1-012)
- [ ] Add handler in `GlobalExceptionHandler` → 409 Conflict
- [ ] Error message includes the number of active reports
- [ ] Test: cannot delete manager with active reports
- [ ] Test: can delete manager after all reports are reassigned or deactivated
- [ ] Commit: `feat(S1-009): add manager dependency guard on delete`

---

## Details

### Guard logic

<details>
<summary>Expand for guidance</summary>

In `EmployeeService.delete()`:

```java
long activeReports = repository.countByManagerIdAndStatus(id, EmployeeStatus.ACTIVE);
if (activeReports > 0) {
    throw new ActiveReportsException(id, activeReports);
}
```

The `ActiveReportsException`:

```java
public class ActiveReportsException extends RuntimeException {
    public ActiveReportsException(UUID managerId, long reportCount) {
        super("Cannot deactivate employee %s: they manage %d active employee(s). Reassign their reports first."
            .formatted(managerId, reportCount));
    }
}
```

Handler in `GlobalExceptionHandler`:

```java
@ExceptionHandler(ActiveReportsException.class)
public ResponseEntity<ErrorResponse> handleActiveReports(
        ActiveReportsException ex, HttpServletRequest request) {
    return ResponseEntity.status(HttpStatus.CONFLICT)
        .body(ErrorResponse.of(409, "Conflict", ex.getMessage(), request.getRequestURI()));
}
```

</details>

### Why this approach?

<details>
<summary>Expand for guidance</summary>

**Alternative considered: cascade deactivation.** Automatically deactivating all reports when a manager is deactivated. This was rejected because:
- It's surprising behavior — callers might not expect multiple employees to be affected
- It could cascade through the entire org chart
- Explicit reassignment is safer and more intentional

**The chosen approach** forces callers to reassign reports first, which is the safest pattern. The error message tells them exactly how many reports need to be reassigned.

</details>

---

## Development Log

| Date | Entry |
|---|---|
| — | *No entries yet* |

---

## References

- [PRD.md](../../../../docs/PRD.md) — Validation rules: cannot delete a manager of others
- [DESIGN.md](../../../../docs/DESIGN.md) — Section 6: Error contract
