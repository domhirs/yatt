# T-011-02: Reporting Chain Traversal

| Field | Value |
|---|---|
| **Task ID** | T-011-02 |
| **Story** | [S1-011: Org Chart](../../../stories/stage1/S1-011-org-chart.md) |
| **Status** | Pending |

---

## Objective

Implement upward traversal of the management hierarchy from an employee to the top-level (CEO), with cycle detection and depth limiting.

---

## Checklist

- [ ] Add `getReportingChain(UUID employeeId)` to `EmployeeService`
- [ ] Verify the employee exists (throw `EmployeeNotFoundException` if not)
- [ ] Walk up the manager chain iteratively
- [ ] Include all employees in chain regardless of status
- [ ] Stop when `managerId` is null (top of org)
- [ ] Detect cycles using a `Set<UUID>` of visited IDs
- [ ] Cap traversal at max depth of 50
- [ ] Return ordered list: immediate manager first, top-level last
- [ ] Commit: `feat(S1-011): implement reporting chain traversal`

---

## Details

### Iterative traversal implementation

<details>
<summary>Expand for guidance</summary>

```java
private static final int MAX_CHAIN_DEPTH = 50;

public List<EmployeeResponse> getReportingChain(UUID employeeId) {
    Employee employee = repository.findById(employeeId)
        .orElseThrow(() -> new EmployeeNotFoundException(employeeId));

    List<EmployeeResponse> chain = new ArrayList<>();
    Set<UUID> visited = new HashSet<>();
    visited.add(employeeId);

    Employee current = employee;
    int depth = 0;

    while (current.getManager() != null && depth < MAX_CHAIN_DEPTH) {
        Employee manager = current.getManager();

        if (visited.contains(manager.getId())) {
            // Circular reference detected — stop traversal
            break;
        }

        visited.add(manager.getId());
        chain.add(mapper.toResponse(manager));
        current = manager;
        depth++;
    }

    return chain;
}
```

**Key decisions:**

1. **Iterative over recursive**: Easier to reason about, no risk of stack overflow, explicit depth control.

2. **Cycle detection**: A `Set<UUID>` of visited IDs prevents infinite loops if the data somehow contains a circular manager reference.

3. **Max depth of 50**: A reasonable upper bound. Real org charts rarely exceed 15 levels. This protects against pathological data.

4. **Include inactive managers**: The reporting chain is a historical/structural view. If a manager in the chain was deactivated, they still appear in the chain for accuracy.

</details>

### Alternative: PostgreSQL recursive CTE

<details>
<summary>Expand for guidance</summary>

For better performance with large org charts, a recursive CTE fetches the entire chain in one query:

```sql
WITH RECURSIVE chain AS (
    SELECT id, first_name, last_name, manager_id, 1 AS depth
    FROM employee
    WHERE id = :managerId

    UNION ALL

    SELECT e.id, e.first_name, e.last_name, e.manager_id, c.depth + 1
    FROM employee e
    JOIN chain c ON e.id = c.manager_id
    WHERE c.depth < 50
)
SELECT * FROM chain WHERE depth > 1 ORDER BY depth;
```

This avoids N+1 queries but is less readable for a learning project. Consider this optimization if performance becomes an issue.

</details>

---

## Development Log

| Date | Entry |
|---|---|
| — | *No entries yet* |

---

## References

- [PRD.md](../../../../docs/PRD.md) — Org chart: retrieve reporting chain
- [DESIGN.md](../../../../docs/DESIGN.md) — Section 3: Database strategy
