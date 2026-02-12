# T-004-03: DTO Records

| Field | Value |
|---|---|
| **Task ID** | T-004-03 |
| **Story** | [S1-004: Employee Entity, Repository & DTOs](../../../stories/stage1/S1-004-employee-entity.md) |
| **Status** | Pending |

---

## Objective

Create request and response DTOs as Java records with Bean Validation annotations, keeping the API contract separate from the persistence model.

---

## Checklist

- [ ] Create `CreateEmployeeRequest` record with validation annotations
- [ ] Create `UpdateEmployeeRequest` record with nullable fields for partial updates
- [ ] Create `EmployeeResponse` record with all output fields
- [ ] Create `PagedEmployeeResponse` record for paginated list results
- [ ] Place all DTOs in `com.timetracker.employee.dto` package
- [ ] Verify validation annotations trigger correctly
- [ ] Commit: `feat(S1-004): add DTO records with validation`

---

## Details

### CreateEmployeeRequest

<details>
<summary>Expand for guidance</summary>

```java
package com.timetracker.employee.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.UUID;

public record CreateEmployeeRequest(
    @NotBlank @Size(max = 100) String firstName,
    @NotBlank @Size(max = 100) String lastName,
    @NotBlank @Email String email,
    @NotBlank @Size(max = 100) String department,
    @NotBlank @Size(max = 100) String role,
    @NotNull @PastOrPresent LocalDate hireDate,
    UUID managerId  // nullable — top-level employees have no manager
) {}
```

All fields required except `managerId`. `@Valid` on the controller method parameter triggers validation automatically.

</details>

### UpdateEmployeeRequest

<details>
<summary>Expand for guidance</summary>

```java
package com.timetracker.employee.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.UUID;

public record UpdateEmployeeRequest(
    @Size(max = 100) String firstName,
    @Size(max = 100) String lastName,
    @Email String email,
    @Size(max = 100) String department,
    @Size(max = 100) String role,
    @PastOrPresent LocalDate hireDate,
    UUID managerId,
    Long version  // required for optimistic locking
) {}
```

All fields are nullable — only non-null fields are applied during PATCH. The `version` field is used for optimistic locking (compare with entity's version before saving).

**Design decision**: Using `null` to mean "not provided" is simple and works for Stage 1. If you later need to distinguish "not provided" from "explicitly set to null" (e.g., removing a manager), consider `JsonNullable` from the `openapitools` library.

</details>

### EmployeeResponse

<details>
<summary>Expand for guidance</summary>

```java
package com.timetracker.employee.dto;

import com.timetracker.employee.EmployeeStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record EmployeeResponse(
    UUID id,
    String firstName,
    String lastName,
    String email,
    String department,
    String role,
    LocalDate hireDate,
    UUID managerId,
    EmployeeStatus status,
    Long version,
    Instant createdAt,
    Instant updatedAt
) {}
```

Includes `version` so clients can send it back on PATCH requests for optimistic locking.

</details>

### PagedEmployeeResponse

<details>
<summary>Expand for guidance</summary>

```java
package com.timetracker.employee.dto;

import java.util.List;

public record PagedEmployeeResponse(
    List<EmployeeResponse> content,
    int page,
    int size,
    long totalElements,
    int totalPages
) {}
```

Maps from Spring Data's `Page<Employee>`:
```java
new PagedEmployeeResponse(
    page.getContent().stream().map(mapper::toResponse).toList(),
    page.getNumber(),
    page.getSize(),
    page.getTotalElements(),
    page.getTotalPages()
);
```

</details>

---

## Development Log

| Date | Entry |
|---|---|
| — | *No entries yet* |

---

## References

- [PRD.md](../../../../docs/PRD.md) — Data model, validation rules
- [GUIDELINES.md](../../../../docs/GUIDELINES.md) — Section 1: Records for DTOs
