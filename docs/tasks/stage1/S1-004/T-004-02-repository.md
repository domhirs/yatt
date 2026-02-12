# T-004-02: Employee Repository

| Field | Value |
|---|---|
| **Task ID** | T-004-02 |
| **Story** | [S1-004: Employee Entity, Repository & DTOs](../../../stories/stage1/S1-004-employee-entity.md) |
| **Status** | Pending |

---

## Objective

Create the Spring Data JPA repository interface with derived query methods needed by the service layer.

---

## Checklist

- [ ] Create `EmployeeRepository` extending `JpaRepository<Employee, UUID>` and `JpaSpecificationExecutor<Employee>`
- [ ] Add `existsByEmail(String email)` for create validation
- [ ] Add `existsByEmailAndIdNot(String email, UUID id)` for update validation
- [ ] Add `findByManagerId(UUID managerId)` for direct reports
- [ ] Add `findByManagerIdAndStatus(UUID managerId, EmployeeStatus status)` for filtered direct reports
- [ ] Add `countByManagerIdAndStatus(UUID managerId, EmployeeStatus status)` for delete guard
- [ ] Verify query derivation compiles correctly
- [ ] Commit: `feat(S1-004): add EmployeeRepository with query methods`

---

## Details

### Repository interface

<details>
<summary>Expand for guidance</summary>

```java
package com.timetracker.employee;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.UUID;

public interface EmployeeRepository
        extends JpaRepository<Employee, UUID>,
                JpaSpecificationExecutor<Employee> {

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, UUID id);

    List<Employee> findByManagerId(UUID managerId);

    List<Employee> findByManagerIdAndStatus(UUID managerId, EmployeeStatus status);

    long countByManagerIdAndStatus(UUID managerId, EmployeeStatus status);
}
```

**Why `JpaSpecificationExecutor`?**
Needed for dynamic filtering in the list endpoint (S1-007). Specifications allow composing WHERE clauses at runtime based on which query parameters the client sends (department, role, status).

**Why derived queries (not `@Query`)?**
For these simple cases, Spring Data query derivation is sufficient and more readable. Use `@Query` when the derived method name becomes unwieldy or when you need joins/subqueries.

</details>

---

## Development Log

| Date | Entry |
|---|---|
| — | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) — Section 2: Spring Boot conventions
- [DESIGN.md](../../../../docs/DESIGN.md) — Section 3: Database strategy
