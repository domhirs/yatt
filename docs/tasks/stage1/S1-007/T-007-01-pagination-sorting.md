# T-007-01: Pagination and Sorting

| Field | Value |
|---|---|
| **Task ID** | T-007-01 |
| **Story** | [S1-007: List Employees](../../../stories/stage1/S1-007-list-employees.md) |
| **Status** | Pending |

---

## Objective

Implement paginated and sortable employee listing using Spring Data `Pageable`, with sensible defaults and a response record that wraps content with pagination metadata.

---

## Checklist

- [ ] Add `list` method to `EmployeeService` accepting `Pageable` and filter parameters
- [ ] Use `repository.findAll(specification, pageable)` for paginated, filtered queries
- [ ] Default page size: 20, default sort: `lastName` ascending
- [ ] Create `PagedEmployeeResponse` record wrapping content + pagination metadata
- [ ] Return only `ACTIVE` employees by default
- [ ] Commit: `feat(S1-007): add paginated employee listing to service layer`

---

## Details

### Add list method to EmployeeService

<details>
<summary>Expand for guidance</summary>

Add a method to `EmployeeService` that accepts a `Pageable` and optional filter parameters, delegates to the repository with a JPA `Specification`, and maps the result to a `PagedEmployeeResponse`.

```java
public PagedEmployeeResponse list(String department, String role, EmployeeStatus status, Pageable pageable) {
    Specification<Employee> spec = EmployeeSpecifications.withFilters(department, role, status);
    Page<Employee> page = employeeRepository.findAll(spec, pageable);

    List<EmployeeResponse> content = page.getContent().stream()
            .map(employeeMapper::toResponse)
            .toList();

    return new PagedEmployeeResponse(
            content,
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages()
    );
}
```

The `EmployeeRepository` must extend `JpaSpecificationExecutor<Employee>` in addition to `JpaRepository<Employee, UUID>` to support the `findAll(Specification, Pageable)` method. If it does not already, add the interface:

```java
public interface EmployeeRepository extends JpaRepository<Employee, UUID>,
                                            JpaSpecificationExecutor<Employee> {
}
```

**Why `Specification` + `Pageable` together?** Spring Data JPA's `JpaSpecificationExecutor.findAll(Specification, Pageable)` applies both the dynamic filter and the pagination/sorting in a single database query. This avoids fetching all rows and filtering/paginating in memory.

</details>

### Default page size and sort

<details>
<summary>Expand for guidance</summary>

Spring Boot automatically resolves `Pageable` from query parameters (`?page=0&size=20&sort=lastName,asc`). To configure defaults, add a `WebMvcConfigurer` bean or use `@PageableDefault` on the controller parameter (covered in T-007-03).

For application-wide defaults, configure in `application.yaml`:

```yaml
spring:
  data:
    web:
      pageable:
        default-page-size: 20
        max-page-size: 100
      sort:
        sort-parameter: sort
```

The default sort of `lastName,asc` will be applied at the controller level using `@SortDefault`. This ensures that even if the caller sends no `sort` parameter, results come back in a predictable order.

**Why 20 as default?** It is a reasonable page size for directory listings — small enough to load quickly, large enough to be useful. The maximum of 100 prevents clients from accidentally requesting thousands of rows.

</details>

### Create PagedEmployeeResponse record

<details>
<summary>Expand for guidance</summary>

Place this record in the `dto/` sub-package alongside the other request/response types:

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

This record mirrors the `PagedResponse` schema defined in the OpenAPI spec (`docs/api/employee-service.yaml`). It provides a clean abstraction over Spring Data's `Page` object so that the API response shape is under our control and not coupled to Spring internals.

**Why a custom record instead of returning `Page` directly?**

| Approach | Pros | Cons |
|---|---|---|
| Return `Page<EmployeeResponse>` directly | Less code | Leaks Spring Data structure (sort metadata, pageable object, etc.) into the API |
| Custom `PagedEmployeeResponse` record | Clean API contract, matches OpenAPI spec exactly | One extra mapping step |

The custom record wins because it keeps the API response shape stable regardless of framework internals.

</details>

### Return only ACTIVE employees by default

<details>
<summary>Expand for guidance</summary>

When no `status` filter is provided, the service should default to `EmployeeStatus.ACTIVE`. This prevents deactivated employees from appearing in standard directory listings.

```java
public PagedEmployeeResponse list(String department, String role, EmployeeStatus status, Pageable pageable) {
    EmployeeStatus effectiveStatus = (status != null) ? status : EmployeeStatus.ACTIVE;
    Specification<Employee> spec = EmployeeSpecifications.withFilters(department, role, effectiveStatus);
    // ...
}
```

If the caller explicitly sends `?status=INACTIVE`, they get inactive employees. If they send nothing, they get active employees only. The filter specification construction is covered in T-007-02.

</details>

---

## Development Log

| Date | Entry |
|---|---|
| --- | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) -- Section 1 (records for DTOs, immutability by default), Section 2 (thin controllers, Spring Data conventions)
- [DESIGN.md](../../../../docs/DESIGN.md) -- Section 6 (API versioning, response structure)
- [PRD.md](../../../../docs/PRD.md) -- Stage 1 functional requirements (list employees with pagination, sorting, filtering)
