# T-007-03: Controller List Endpoint

| Field | Value |
|---|---|
| **Task ID** | T-007-03 |
| **Story** | [S1-007: List Employees](../../../stories/stage1/S1-007-list-employees.md) |
| **Status** | Pending |

---

## Objective

Implement `GET /api/v1/employees` with pagination, sorting, and filter query parameters, keeping the controller thin and delegating all business logic to the service layer.

---

## Checklist

- [ ] Add `GET` method to `EmployeeController`
- [ ] Accept `Pageable` parameter (auto-resolved by Spring)
- [ ] Accept `@RequestParam(required = false)` for `department`, `role`, `status`
- [ ] Delegate to `service.list()` with filter params and `Pageable`
- [ ] Return 200 with `PagedEmployeeResponse`
- [ ] Verify: default pagination works
- [ ] Verify: sorting by different fields
- [ ] Verify: filtering by department and role
- [ ] Commit: `feat(S1-007): add GET /api/v1/employees list endpoint`

---

## Details

### Add GET method to EmployeeController

<details>
<summary>Expand for guidance</summary>

Add the list endpoint to the existing `EmployeeController`. The controller should be thin — it only maps HTTP concerns and delegates to the service.

```java
@GetMapping
public ResponseEntity<PagedEmployeeResponse> list(
        @RequestParam(required = false) String department,
        @RequestParam(required = false) String role,
        @RequestParam(required = false) EmployeeStatus status,
        @PageableDefault(size = 20)
        @SortDefault(sort = "lastName", direction = Sort.Direction.ASC)
        Pageable pageable) {

    PagedEmployeeResponse response = employeeService.list(department, role, status, pageable);
    return ResponseEntity.ok(response);
}
```

**Key design points:**

- `@PageableDefault(size = 20)` sets the default page size when the client does not send a `size` parameter.
- `@SortDefault(sort = "lastName", direction = Sort.Direction.ASC)` sets the default sort when no `sort` parameter is present.
- `EmployeeStatus` as a `@RequestParam` type works because Spring automatically converts the string to the enum (case-sensitive). If the value is invalid, Spring returns 400 Bad Request.
- The method returns `ResponseEntity<PagedEmployeeResponse>` for consistency with other controller methods, even though `@ResponseBody` with `@RestController` would suffice.

</details>

### Spring Pageable auto-resolution

<details>
<summary>Expand for guidance</summary>

Spring Data Web support automatically resolves `Pageable` from query parameters. No manual parsing is needed.

| Query Parameter | Purpose | Example |
|---|---|---|
| `page` | Zero-based page index | `?page=0` |
| `size` | Number of records per page | `?size=20` |
| `sort` | Field name and direction | `?sort=lastName,asc` |

Multiple sort parameters are supported: `?sort=department,asc&sort=lastName,desc`.

This works because Spring Boot auto-configures `SpringDataWebConfiguration`, which registers a `PageableHandlerMethodArgumentResolver`. You do not need to register this manually.

</details>

### Verify with curl examples

<details>
<summary>Expand for guidance</summary>

After implementing, test with these requests:

```bash
# Default: page 0, size 20, sorted by lastName ascending, ACTIVE only
curl http://localhost:8080/api/v1/employees

# Custom pagination
curl "http://localhost:8080/api/v1/employees?page=1&size=5"

# Sort by hire date descending
curl "http://localhost:8080/api/v1/employees?sort=hireDate,desc"

# Filter by department
curl "http://localhost:8080/api/v1/employees?department=Engineering"

# Combined: filter by department, sort by hire date, page 0 size 10
curl "http://localhost:8080/api/v1/employees?department=Engineering&sort=hireDate,desc&page=0&size=10"

# Filter by role
curl "http://localhost:8080/api/v1/employees?role=Senior%20Developer"

# Filter by status explicitly
curl "http://localhost:8080/api/v1/employees?status=INACTIVE"
```

**Expected response shape** (matches OpenAPI spec):

```json
{
  "content": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@example.com",
      "department": "Engineering",
      "role": "Senior Developer",
      "hireDate": "2025-03-15",
      "managerId": null,
      "status": "ACTIVE",
      "createdAt": "2026-02-12T10:00:00Z",
      "updatedAt": "2026-02-12T10:00:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1
}
```

**Empty results** return 200 with an empty content array, not 404:

```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalElements": 0,
  "totalPages": 0
}
```

</details>

---

## Development Log

| Date | Entry |
|---|---|
| --- | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) -- Section 2 (thin controllers, constructor injection, Spring Data conventions)
- [DESIGN.md](../../../../docs/DESIGN.md) -- Section 6 (API versioning, error contract, response structure)
- [PRD.md](../../../../docs/PRD.md) -- Stage 1 functional requirements (list with pagination, sorting, filtering)
