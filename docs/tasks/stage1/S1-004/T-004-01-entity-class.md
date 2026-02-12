# T-004-01: Employee JPA Entity

| Field | Value |
|---|---|
| **Task ID** | T-004-01 |
| **Story** | [S1-004: Employee Entity, Repository & DTOs](../../../stories/stage1/S1-004-employee-entity.md) |
| **Status** | Pending |

---

## Objective

Create the Employee JPA entity mapping to the database table with all fields, constraints, and optimistic locking support.

---

## Checklist

- [ ] Create `EmployeeStatus` enum (`ACTIVE`, `INACTIVE`)
- [ ] Create `Employee.java` in `com.timetracker.employee`
- [ ] Map all columns from the data model with `@Column` annotations
- [ ] Configure UUID PK with `@Id` and `@GeneratedValue(strategy = GenerationType.UUID)`
- [ ] Add `@Version` field (Long) for optimistic locking
- [ ] Map `manager` as `@ManyToOne(fetch = FetchType.LAZY)`
- [ ] Map `directReports` as `@OneToMany(mappedBy = "manager")`
- [ ] Add `@CreationTimestamp` / `@UpdateTimestamp` for audit fields
- [ ] Implement `equals()` and `hashCode()` based on `id` only
- [ ] Verify entity compiles and Hibernate validates against the schema
- [ ] Commit: `feat(S1-004): add Employee JPA entity`

---

## Details

### EmployeeStatus enum

<details>
<summary>Expand for guidance</summary>

```java
package com.timetracker.employee;

public enum EmployeeStatus {
    ACTIVE,
    INACTIVE
}
```

Simple enum — maps to `VARCHAR` column with `@Enumerated(EnumType.STRING)`.

</details>

### Employee entity class

<details>
<summary>Expand for guidance</summary>

```java
package com.timetracker.employee;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "employee")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, length = 100)
    private String department;

    @Column(nullable = false, length = 100)
    private String role;

    @Column(name = "hire_date", nullable = false)
    private LocalDate hireDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Employee manager;

    @OneToMany(mappedBy = "manager")
    private List<Employee> directReports = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EmployeeStatus status = EmployeeStatus.ACTIVE;

    @Version
    private Long version;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // Getters and setters...

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Employee other)) return false;
        return id != null && id.equals(other.getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
```

Key decisions:
- **`equals`/`hashCode`**: Based on `id` only, using the Hibernate-recommended pattern (constant `hashCode`, null-safe `equals`). This ensures correct behavior in Sets and Maps across entity lifecycle states.
- **`FetchType.LAZY`** on `@ManyToOne`: Prevents N+1 queries when loading employees without needing their manager.
- **`@Version`**: Hibernate auto-increments this on every update and uses it for optimistic locking (`WHERE version = ?` in UPDATE SQL).
- **No Lombok**: IDE-generated or manual getters/setters for clarity.

</details>

### Audit timestamps

<details>
<summary>Expand for guidance</summary>

`@CreationTimestamp` sets the field on first persist. `@UpdateTimestamp` updates it on every save. Both are Hibernate-specific annotations (not JPA standard). The JPA standard alternative is `@PrePersist` / `@PreUpdate` callbacks:

```java
@PrePersist
protected void onCreate() {
    createdAt = Instant.now();
    updatedAt = Instant.now();
}

@PreUpdate
protected void onUpdate() {
    updatedAt = Instant.now();
}
```

Either approach works. The Hibernate annotations are simpler.

</details>

---

## Development Log

| Date | Entry |
|---|---|
| — | *No entries yet* |

---

## References

- [PRD.md](../../../../docs/PRD.md) — Data model
- [GUIDELINES.md](../../../../docs/GUIDELINES.md) — Section 1: Java 25 coding standards (immutability, naming)
- [GUIDELINES.md](../../../../docs/GUIDELINES.md) — Section 2: Spring Boot conventions
