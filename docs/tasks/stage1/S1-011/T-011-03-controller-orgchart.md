# T-011-03: Controller Org Chart Endpoints

| Field | Value |
|---|---|
| **Task ID** | T-011-03 |
| **Story** | [S1-011: Org Chart](../../../stories/stage1/S1-011-org-chart.md) |
| **Status** | Pending |

---

## Objective

Implement REST endpoints for direct reports and reporting chain queries.

---

## Checklist

- [ ] Add `GET /{id}/direct-reports` endpoint to `EmployeeController`
- [ ] Add `GET /{id}/reporting-chain` endpoint to `EmployeeController`
- [ ] Both return 200 with `List<EmployeeResponse>`
- [ ] Both return 404 if employee not found
- [ ] Verify with curl using employees with known hierarchy
- [ ] Verify empty results return 200 with `[]` (not 404)
- [ ] Commit: `feat(S1-011): add org chart endpoints`

---

## Details

### Controller methods

<details>
<summary>Expand for guidance</summary>

```java
@GetMapping("/{id}/direct-reports")
public List<EmployeeResponse> getDirectReports(@PathVariable UUID id) {
    return service.getDirectReports(id);
}

@GetMapping("/{id}/reporting-chain")
public List<EmployeeResponse> getReportingChain(@PathVariable UUID id) {
    return service.getReportingChain(id);
}
```

**Why no pagination?** These lists are inherently small:
- Direct reports: typically 3-15 per manager
- Reporting chain: typically 3-10 levels deep

Pagination would add complexity with no real benefit. If the org grows very large, reconsider.

**Testing with curl:**

```bash
# Get direct reports for a manager
curl http://localhost:8080/api/v1/employees/{manager-id}/direct-reports

# Get reporting chain for an employee
curl http://localhost:8080/api/v1/employees/{employee-id}/reporting-chain

# Non-existent employee
curl http://localhost:8080/api/v1/employees/00000000-0000-0000-0000-000000000000/direct-reports
# Expected: 404
```

</details>

---

## Development Log

| Date | Entry |
|---|---|
| — | *No entries yet* |

---

## References

- [PRD.md](../../../../docs/PRD.md) — Org chart endpoints
- [GUIDELINES.md](../../../../docs/GUIDELINES.md) — Section 2: Thin controllers
