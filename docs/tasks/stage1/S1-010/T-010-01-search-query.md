# T-010-01: Search Query Implementation

| Field | Value |
|---|---|
| **Task ID** | T-010-01 |
| **Story** | [S1-010: Search Employees](../../../stories/stage1/S1-010-search-employees.md) |
| **Status** | Pending |

---

## Objective

Implement employee name search using case-insensitive matching across first and last name fields, returning only active employees with paginated results.

---

## Checklist

- [ ] Add `search(String query, Pageable pageable)` method to `EmployeeService`
- [ ] Validate minimum query length (2 characters) — throw `IllegalArgumentException` if shorter
- [ ] Create search specification: `firstName ILIKE %query% OR lastName ILIKE %query%`
- [ ] Combine search spec with `status = ACTIVE` filter
- [ ] Use `repository.findAll(specification, pageable)` for paginated results
- [ ] Map results to `PagedEmployeeResponse`
- [ ] Commit: `feat(S1-010): implement employee name search`

---

## Details

### Search specification

<details>
<summary>Expand for guidance</summary>

Add to `EmployeeSpecifications`:

```java
public static Specification<Employee> nameContains(String query) {
    return (root, criteriaQuery, cb) -> {
        String pattern = "%" + query.toLowerCase() + "%";
        return cb.or(
            cb.like(cb.lower(root.get("firstName")), pattern),
            cb.like(cb.lower(root.get("lastName")), pattern)
        );
    };
}
```

In the service:

```java
public PagedEmployeeResponse search(String query, Pageable pageable) {
    if (query == null || query.length() < 2) {
        throw new IllegalArgumentException("Search query must be at least 2 characters");
    }

    Specification<Employee> spec = Specification
        .where(EmployeeSpecifications.nameContains(query))
        .and(EmployeeSpecifications.byStatus(EmployeeStatus.ACTIVE));

    Page<Employee> page = repository.findAll(spec, pageable);
    return toPagedResponse(page);
}
```

**Why `cb.lower()` instead of PostgreSQL `ILIKE`?**
Using `cb.lower()` with standard `LIKE` is portable across databases (useful for Testcontainers with H2 fallback). PostgreSQL `ILIKE` is faster but database-specific. For Stage 1, portability wins. If performance matters later, switch to a native query with `ILIKE` or add a trigram index.

**Future improvement**: Full-text search with `tsvector`/`tsquery` would be faster for large datasets. Not needed in Stage 1.

</details>

---

## Development Log

| Date | Entry |
|---|---|
| — | *No entries yet* |

---

## References

- [PRD.md](../../../../docs/PRD.md) — Search employees by name
- [GUIDELINES.md](../../../../docs/GUIDELINES.md) — Section 2: Spring Boot conventions
