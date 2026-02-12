# T-007-02: Filter Specifications

| Field | Value |
|---|---|
| **Task ID** | T-007-02 |
| **Story** | [S1-007: List Employees](../../../stories/stage1/S1-007-list-employees.md) |
| **Status** | Pending |

---

## Objective

Implement JPA Specifications for dynamic filtering by department, role, and status, enabling composable query predicates that combine cleanly with pagination.

---

## Checklist

- [ ] Create `EmployeeSpecifications` utility class
- [ ] Add `byDepartment(String)` specification
- [ ] Add `byRole(String)` specification
- [ ] Add `byStatus(EmployeeStatus)` specification
- [ ] Combine specifications with `and()` for multiple filters
- [ ] Default filter: `status = ACTIVE` (unless explicitly filtered)
- [ ] Verify filters work with different combinations
- [ ] Commit: `feat(S1-007): add JPA specifications for employee filtering`

---

## Details

### Create EmployeeSpecifications utility class

<details>
<summary>Expand for guidance</summary>

Create a utility class with static factory methods, each returning a `Specification<Employee>`. Place it in the main `com.timetracker.employee` package alongside the entity and repository.

```java
package com.timetracker.employee;

import org.springframework.data.jpa.domain.Specification;

public final class EmployeeSpecifications {

    private EmployeeSpecifications() {
        // Utility class — no instantiation
    }

    public static Specification<Employee> byDepartment(String department) {
        return (root, query, cb) -> cb.equal(root.get("department"), department);
    }

    public static Specification<Employee> byRole(String role) {
        return (root, query, cb) -> cb.equal(root.get("role"), role);
    }

    public static Specification<Employee> byStatus(EmployeeStatus status) {
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<Employee> withFilters(String department, String role, EmployeeStatus status) {
        Specification<Employee> spec = Specification.where(byStatus(status));

        if (department != null && !department.isBlank()) {
            spec = spec.and(byDepartment(department));
        }
        if (role != null && !role.isBlank()) {
            spec = spec.and(byRole(role));
        }
        return spec;
    }
}
```

The `withFilters` method is the primary entry point. It always applies the status filter (defaulted to `ACTIVE` by the service layer in T-007-01) and conditionally adds department and role filters only when provided.

</details>

### Why JPA Specifications over @Query

<details>
<summary>Expand for guidance</summary>

**Why the Specification pattern instead of `@Query` methods?**

| Approach | Pros | Cons |
|---|---|---|
| `@Query` methods | Simple, explicit SQL/JPQL | Combinatorial explosion: need a method for every filter combination (`findByDepartment`, `findByRole`, `findByDepartmentAndRole`, `findByDepartmentAndStatus`, ...) |
| JPA `Specification` | Composable: combine any filters dynamically | Slightly more verbose per-filter |

With three optional filters (`department`, `role`, `status`), you would need up to 8 different `@Query` methods to cover every combination. The Specification pattern gives you 3 building blocks that compose freely.

This is the **Strategy pattern** in action: each specification encapsulates a single filter predicate, and the composite `withFilters` method orchestrates them. It follows the **Open/Closed Principle** (SOLID "O") — adding a new filter (e.g., `byHireDateAfter`) requires only a new static method, not modifying existing code.

</details>

### Combine specifications with and()

<details>
<summary>Expand for guidance</summary>

Spring Data's `Specification.and()` creates a conjunction (SQL `AND`). The chain is null-safe: `Specification.where(null)` returns a no-op specification.

```java
// Example: department=Engineering, role=null, status=ACTIVE
// Result SQL: WHERE status = 'ACTIVE' AND department = 'Engineering'

// Example: department=null, role=null, status=ACTIVE
// Result SQL: WHERE status = 'ACTIVE'

// Example: department=Engineering, role=Senior Developer, status=INACTIVE
// Result SQL: WHERE status = 'INACTIVE' AND department = 'Engineering' AND role = 'Senior Developer'
```

The conditional building in `withFilters` ensures that only non-null, non-blank filters are added. This means:
- Calling with all nulls returns only the status predicate.
- Calling with all values returns all three predicates combined with `AND`.

</details>

### Verify filters work with different combinations

<details>
<summary>Expand for guidance</summary>

Before writing formal tests (T-007-04), manually verify by starting the application and running these queries:

```bash
# Default: ACTIVE employees, no filters
curl http://localhost:8080/api/v1/employees

# Filter by department
curl "http://localhost:8080/api/v1/employees?department=Engineering"

# Filter by role
curl "http://localhost:8080/api/v1/employees?role=Senior%20Developer"

# Combined filters
curl "http://localhost:8080/api/v1/employees?department=Engineering&role=Senior%20Developer"

# Explicit status filter
curl "http://localhost:8080/api/v1/employees?status=INACTIVE"
```

Verify that each query returns the expected subset of employees. If the database has no data yet, insert a few test rows via Flyway migration or a data.sql script in the `test` profile.

</details>

---

## Development Log

| Date | Entry |
|---|---|
| --- | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) -- Section 1 (immutability, utility class conventions), Section 2 (Spring Data conventions)
- [DESIGN.md](../../../../docs/DESIGN.md) -- Section 6 (API versioning, query parameter design)
- [PRD.md](../../../../docs/PRD.md) -- Stage 1 functional requirements (filtering by department/role)
