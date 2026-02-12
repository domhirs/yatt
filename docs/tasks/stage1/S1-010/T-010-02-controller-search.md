# T-010-02: Controller Search Endpoint

| Field | Value |
|---|---|
| **Task ID** | T-010-02 |
| **Story** | [S1-010: Search Employees](../../../stories/stage1/S1-010-search-employees.md) |
| **Status** | Pending |

---

## Objective

Implement `GET /api/v1/employees/search` endpoint for name-based employee search.

---

## Checklist

- [ ] Add GET `/search` method to `EmployeeController`
- [ ] Accept `@RequestParam String q` and `Pageable` parameters
- [ ] Delegate to `service.search(q, pageable)`
- [ ] Return 200 with `PagedEmployeeResponse`
- [ ] `IllegalArgumentException` (short query) maps to 400 via `GlobalExceptionHandler`
- [ ] Verify with curl: search by first name, last name, partial match
- [ ] Verify empty results return 200 with empty content (not 404)
- [ ] Commit: `feat(S1-010): add search endpoint`

---

## Details

### Controller method

<details>
<summary>Expand for guidance</summary>

```java
@GetMapping("/search")
public PagedEmployeeResponse search(
        @RequestParam String q,
        Pageable pageable) {
    return service.search(q, pageable);
}
```

**Note**: This endpoint is separate from the list endpoint (`GET /api/v1/employees`). The list endpoint supports filtering by exact field values (department, role). The search endpoint supports fuzzy name matching.

**Testing with curl:**

```bash
# Search by first name
curl "http://localhost:8080/api/v1/employees/search?q=john"

# Search by last name
curl "http://localhost:8080/api/v1/employees/search?q=doe"

# Partial match
curl "http://localhost:8080/api/v1/employees/search?q=jo"

# Short query (should return 400)
curl "http://localhost:8080/api/v1/employees/search?q=j"

# With pagination
curl "http://localhost:8080/api/v1/employees/search?q=john&page=0&size=5"
```

</details>

### Exception handling for short queries

<details>
<summary>Expand for guidance</summary>

Add handler in `GlobalExceptionHandler` if not already present:

```java
@ExceptionHandler(IllegalArgumentException.class)
public ResponseEntity<ErrorResponse> handleIllegalArgument(
        IllegalArgumentException ex, HttpServletRequest request) {
    return ResponseEntity.badRequest()
        .body(ErrorResponse.of(400, "Bad Request", ex.getMessage(), request.getRequestURI()));
}
```

</details>

---

## Development Log

| Date | Entry |
|---|---|
| — | *No entries yet* |

---

## References

- [PRD.md](../../../../docs/PRD.md) — Search employees by name
- [DESIGN.md](../../../../docs/DESIGN.md) — Section 6: Error contract
