# T-009-02: Controller DELETE Endpoint

| Field | Value |
|---|---|
| **Task ID** | T-009-02 |
| **Story** | [S1-009: Delete Employee](../../../stories/stage1/S1-009-delete-employee.md) |
| **Status** | Pending |

---

## Objective

Implement `DELETE /api/v1/employees/{id}` returning 204 No Content on successful soft delete.

---

## Checklist

- [ ] Add DELETE method to `EmployeeController`
- [ ] Accept `@PathVariable UUID id`
- [ ] Delegate to `service.delete(id)`
- [ ] Return `ResponseEntity.noContent().build()` (204)
- [ ] Verify endpoint with curl
- [ ] Verify 404 for non-existent employee
- [ ] Verify 409 for already-inactive employee
- [ ] Commit: `feat(S1-009): add DELETE endpoint`

---

## Details

### Controller method

<details>
<summary>Expand for guidance</summary>

```java
@DeleteMapping("/{id}")
public ResponseEntity<Void> delete(@PathVariable UUID id) {
    service.delete(id);
    return ResponseEntity.noContent().build();
}
```

The controller is deliberately thin. All business logic (existence check, status check, reports guard) lives in the service. Exceptions are handled by `GlobalExceptionHandler`.

**Testing with curl:**

```bash
# Soft-delete an employee
curl -X DELETE http://localhost:8080/api/v1/employees/{id} -v
# Expected: 204 No Content

# Verify the employee is now INACTIVE
curl http://localhost:8080/api/v1/employees/{id}
# Expected: 200 with status: "INACTIVE"

# Try deleting again
curl -X DELETE http://localhost:8080/api/v1/employees/{id} -v
# Expected: 409 Conflict
```

</details>

---

## Development Log

| Date | Entry |
|---|---|
| — | *No entries yet* |

---

## References

- [PRD.md](../../../../docs/PRD.md) — API design: 204 on delete
- [GUIDELINES.md](../../../../docs/GUIDELINES.md) — Section 2: Thin controllers
