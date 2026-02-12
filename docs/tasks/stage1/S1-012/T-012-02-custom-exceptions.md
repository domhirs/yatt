# T-012-02: Custom Exception Classes

| Field | Value |
|---|---|
| **Task ID** | T-012-02 |
| **Story** | [S1-012: Error Handling](../../../stories/stage1/S1-012-error-handling.md) |
| **Status** | Pending |

---

## Objective

Create domain-specific exception classes that express business rule violations with clear, meaningful messages.

---

## Checklist

- [ ] Create `EmployeeNotFoundException` (extends `RuntimeException`)
- [ ] Create `DuplicateEmailException` (extends `RuntimeException`)
- [ ] Create `ManagerNotFoundException` (extends `RuntimeException`)
- [ ] Create `ActiveReportsException` (extends `RuntimeException`)
- [ ] Create `EmployeeAlreadyInactiveException` (extends `RuntimeException`)
- [ ] Place all in `com.timetracker.employee.exception` package
- [ ] Each exception takes meaningful constructor parameters
- [ ] Commit: `feat(S1-012): add custom exception classes`

---

## Details

### Exception classes

<details>
<summary>Expand for guidance</summary>

```java
package com.timetracker.employee.exception;

import java.util.UUID;

public class EmployeeNotFoundException extends RuntimeException {
    public EmployeeNotFoundException(UUID id) {
        super("Employee not found: " + id);
    }
}
```

```java
public class DuplicateEmailException extends RuntimeException {
    public DuplicateEmailException(String email) {
        super("An employee with email " + email + " already exists");
    }
}
```

```java
public class ManagerNotFoundException extends RuntimeException {
    public ManagerNotFoundException(UUID managerId) {
        super("Manager not found or inactive: " + managerId);
    }
}
```

```java
public class ActiveReportsException extends RuntimeException {
    public ActiveReportsException(UUID managerId, long reportCount) {
        super("Cannot deactivate employee %s: they manage %d active employee(s). Reassign their reports first."
            .formatted(managerId, reportCount));
    }
}
```

```java
public class EmployeeAlreadyInactiveException extends RuntimeException {
    public EmployeeAlreadyInactiveException(UUID id) {
        super("Employee " + id + " is already inactive");
    }
}
```

**Why unchecked exceptions?**
- Spring's `@ExceptionHandler` works naturally with unchecked exceptions
- They don't pollute method signatures with `throws` declarations
- These represent business rule violations, not recoverable conditions — the caller can't "fix" a duplicate email programmatically

**Why not a shared base class?**
Could create `BusinessException extends RuntimeException` as a common parent. Not needed yet — YAGNI. Add it when there's a concrete reason (e.g., common retry logic, common logging).

</details>

---

## Development Log

| Date | Entry |
|---|---|
| — | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) — Section 1: Fail fast with clear error messages
- [DESIGN.md](../../../../docs/DESIGN.md) — Section 6: Error contract
