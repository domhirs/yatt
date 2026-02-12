# T-005-01: Service Create Method

| Field | Value |
|---|---|
| **Task ID** | T-005-01 |
| **Story** | [S1-005: Create Employee](../../../stories/stage1/S1-005-create-employee.md) |
| **Status** | Pending |

---

## Objective

Implement `EmployeeService.create()` with business rule validation for creating new employees, enforcing email uniqueness and manager existence/active-status constraints before persisting to the database.

---

## Checklist

- [ ] Create `EmployeeService` class with `@Service` annotation
- [ ] Inject `EmployeeRepository` and `EmployeeMapper` via constructor
- [ ] Implement `create(CreateEmployeeRequest)` method
- [ ] Validate email uniqueness (throw `DuplicateEmailException` if exists)
- [ ] Validate manager exists and is active (throw `ManagerNotFoundException` if invalid)
- [ ] Map request to entity, save, and return `EmployeeResponse`
- [ ] Commit: `feat(S1-005): implement EmployeeService.create()`

---

## Details

### Create EmployeeService with constructor injection

<details>
<summary>Expand for guidance</summary>

Create the service class in the `com.timetracker.employee` package. Per GUIDELINES.md Section 2, use **constructor injection only** -- no `@Autowired` on fields or setters. With a single constructor, Spring infers it as the injection point automatically, so `@Autowired` on the constructor is also unnecessary.

```java
package com.timetracker.employee;

import org.springframework.stereotype.Service;

@Service
public class EmployeeService {

    private final EmployeeRepository repository;
    private final EmployeeMapper mapper;

    public EmployeeService(EmployeeRepository repository, EmployeeMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }
}
```

**Why constructor injection?** It makes dependencies explicit, supports immutability (`final` fields), and ensures the object is fully initialized at construction time. It also makes testing straightforward -- you pass mocks directly to the constructor.

</details>

### Implement create(CreateEmployeeRequest) method

<details>
<summary>Expand for guidance</summary>

The method signature and logic flow:

```java
public EmployeeResponse create(CreateEmployeeRequest request) {
    // 1. Business rule: email must be unique
    if (repository.existsByEmail(request.email())) {
        throw new DuplicateEmailException(request.email());
    }

    // 2. Business rule: manager must exist and be active (if provided)
    Employee manager = null;
    if (request.managerId() != null) {
        manager = repository.findById(request.managerId())
                .filter(emp -> emp.getStatus() == EmployeeStatus.ACTIVE)
                .orElseThrow(() -> new ManagerNotFoundException(request.managerId()));
    }

    // 3. Map, set relationships, save
    Employee entity = mapper.toEntity(request);
    if (manager != null) {
        entity.setManager(manager);
    }

    Employee saved = repository.save(entity);
    return mapper.toResponse(saved);
}
```

**Key design decisions:**

- **Service handles business rules, not the controller.** The controller is thin -- it accepts the request, delegates to the service, and returns the response. All validation logic beyond Bean Validation annotations lives here.
- **`existsByEmail()` before save** catches duplicates at the application level with a clear, domain-specific exception. The database unique constraint is a safety net, not the primary enforcement mechanism.
- **Manager lookup uses `filter()` on the Optional** to combine the "exists" and "is active" checks into a single operation. If the manager exists but is inactive, the same `ManagerNotFoundException` is thrown. This is intentional per the acceptance criteria (AC4): an inactive manager is treated the same as a non-existent one.
- **The mapper handles field-by-field mapping** so the service method stays focused on orchestration and business rules. This follows the Single Responsibility Principle.

**Exception classes** (`DuplicateEmailException`, `ManagerNotFoundException`) should be created as runtime exceptions in the `com.timetracker.employee` package. They will be handled by the `GlobalExceptionHandler` (story S1-012) to produce the standard error response.

```java
public class DuplicateEmailException extends RuntimeException {
    public DuplicateEmailException(String email) {
        super("Employee with email '%s' already exists".formatted(email));
    }
}

public class ManagerNotFoundException extends RuntimeException {
    public ManagerNotFoundException(UUID managerId) {
        super("Manager with id '%s' not found or is not active".formatted(managerId));
    }
}
```

</details>

### Business rules: service vs. controller responsibility

<details>
<summary>Expand for guidance</summary>

It is important to understand the separation of concerns between layers:

| Concern | Layer | Mechanism |
|---|---|---|
| Field presence, format, size | Controller | Bean Validation (`@Valid` + annotations on DTO) |
| Email uniqueness | Service | `repository.existsByEmail()` |
| Manager existence & active status | Service | `repository.findById()` + status check |
| Database constraint enforcement | Repository/DB | Unique index on `email` (safety net) |

The controller should never query the repository directly. If a business rule requires data access, it belongs in the service. This keeps the controller thin and the business logic testable without a Spring context.

</details>

---

## Development Log

| Date | Entry |
|---|---|
| --- | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) -- Section 2 (constructor injection only, thin controllers, @Service classes)
- [DESIGN.md](../../../../docs/DESIGN.md) -- Section 6 (error contract format for business rule violations)
- [PRD.md](../../../../docs/PRD.md) -- Validation rules (email unique, manager must be active)
