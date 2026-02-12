# S1-004: Employee Entity, Repository & DTOs

| Field | Value |
|---|---|
| **Story ID** | S1-004 |
| **Title** | Employee Entity, Repository & DTOs |
| **Stage** | 1 — Employee REST API |
| **Status** | Backlog |
| **Dependencies** | S1-002, S1-003 |

---

## User Story

As a developer, I want the Employee JPA entity, Spring Data repository, DTO records, and mapper in place, so that the data layer is ready for service implementation.

---

## Acceptance Criteria

- [ ] AC1: `Employee` entity maps to the `employee` table with all fields from the data model (id, first_name, last_name, email, department, role, hire_date, manager_id, status, created_at, updated_at).
- [ ] AC2: JPA entity uses UUID primary key, proper column mappings, and `@Version` for optimistic locking.
- [ ] AC3: `EmployeeRepository` extends `JpaRepository` and `JpaSpecificationExecutor` for dynamic queries.
- [ ] AC4: Request/response DTOs are Java records with Bean Validation annotations.
- [ ] AC5: `EmployeeMapper` converts between entity and DTOs correctly, handling all fields including nullable `manager_id`.

---

## Tasks

| Task | Title | Status |
|---|---|---|
| [T-004-01](../../tasks/stage1/S1-004/T-004-01-entity-class.md) | Entity class | Pending |
| [T-004-02](../../tasks/stage1/S1-004/T-004-02-repository.md) | Repository interface | Pending |
| [T-004-03](../../tasks/stage1/S1-004/T-004-03-dto-records.md) | DTO records | Pending |
| [T-004-04](../../tasks/stage1/S1-004/T-004-04-mapper.md) | Mapper | Pending |

---

## Technical Notes

- Entity lives in `com.timetracker.employee` package (package-by-feature structure per GUIDELINES.md).
- Use Java records for DTOs: `CreateEmployeeRequest`, `UpdateEmployeeRequest`, `EmployeeResponse`. Records enforce immutability by default.
- The `manager_id` field is a self-referencing `@ManyToOne` relationship. Use `@JoinColumn(name = "manager_id")` with `FetchType.LAZY` to avoid N+1 queries.
- Use `@Version` with a `Long` field for optimistic locking — prevents lost updates when concurrent requests modify the same employee.
- `EmployeeStatus` should be a Java enum (`ACTIVE`, `INACTIVE`) mapped as `@Enumerated(EnumType.STRING)`.
- `EmployeeMapper` is a Spring `@Component` with manual mapping (no MapStruct needed at this scale — keep dependencies minimal per incremental complexity principle).
- `UpdateEmployeeRequest` fields should be nullable to support partial updates (PATCH semantics): only non-null fields are applied.
- Timestamps (`created_at`, `updated_at`) use JPA `@PrePersist` and `@PreUpdate` callbacks or `@CreationTimestamp`/`@UpdateTimestamp`.

---

## References

- [PRD](../../PRD.md) — Data model (initial), validation rules
- [DESIGN](../../DESIGN.md) — Section 3 (database strategy, schema layout)
- [GUIDELINES](../../GUIDELINES.md) — Section 1 (records for DTOs, immutability, null safety), Section 2 (thin controllers, constructor injection)
