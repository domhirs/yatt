# T-008-01: Service Patch Method

| Field | Value |
|---|---|
| **Task ID** | T-008-01 |
| **Story** | [S1-008: Update Employee](../../../stories/stage1/S1-008-update-employee.md) |
| **Status** | Pending |

---

## Objective

Implement `EmployeeService.update()` supporting partial updates via PATCH semantics, where only non-null fields in the request are applied to the existing entity.

---

## Checklist

- [ ] Add `update(UUID id, UpdateEmployeeRequest)` method to `EmployeeService`
- [ ] Find existing employee or throw `EmployeeNotFoundException`
- [ ] Validate email uniqueness if email is being changed
- [ ] Validate manager if `managerId` is being changed
- [ ] Use `mapper.updateEntity()` to apply only non-null fields
- [ ] Save and return updated `EmployeeResponse`
- [ ] Commit: `feat(S1-008): add partial update method to employee service`

---

## Details

### Add update method to EmployeeService

<details>
<summary>Expand for guidance</summary>

The update method follows this flow: fetch, validate, apply changes, save, map to response.

```java
public EmployeeResponse update(UUID id, UpdateEmployeeRequest request) {
    Employee employee = employeeRepository.findById(id)
            .orElseThrow(() -> new EmployeeNotFoundException(id));

    // Validate email uniqueness if email is being changed
    if (request.email() != null && !request.email().equals(employee.getEmail())) {
        if (employeeRepository.existsByEmailAndIdNot(request.email(), id)) {
            throw new DuplicateEmailException(request.email());
        }
    }

    // Validate manager if managerId is being changed
    if (request.managerId() != null && !request.managerId().equals(employee.getManagerId())) {
        validateManager(request.managerId(), id);
    }

    // Apply only non-null fields from request to entity
    employeeMapper.updateEntity(employee, request);

    Employee saved = employeeRepository.save(employee);
    return employeeMapper.toResponse(saved);
}
```

The method leans on the existing validation logic from the create flow. If `validateManager` already exists for creation, reuse it here. If it does not, extract it into a private method in the service:

```java
private void validateManager(UUID managerId, UUID employeeId) {
    if (managerId.equals(employeeId)) {
        throw new IllegalArgumentException("An employee cannot be their own manager");
    }
    Employee manager = employeeRepository.findById(managerId)
            .orElseThrow(() -> new ManagerNotFoundException(managerId));
    if (manager.getStatus() != EmployeeStatus.ACTIVE) {
        throw new ManagerNotFoundException(managerId);
    }
}
```

**Single Responsibility note**: the service orchestrates the update workflow. The mapper handles field-level application. Validation logic stays in the service (or a dedicated validator if it grows complex).

</details>

### Repository method for email uniqueness check

<details>
<summary>Expand for guidance</summary>

Add this method to `EmployeeRepository` if it does not already exist:

```java
boolean existsByEmailAndIdNot(String email, UUID id);
```

Spring Data derives the query automatically: `SELECT EXISTS(SELECT 1 FROM employee WHERE email = ? AND id != ?)`. This checks whether any *other* employee has the same email, excluding the employee being updated.

**Why `existsByEmailAndIdNot` instead of `existsByEmail`?** On update, the employee's own email would match `existsByEmail`, causing a false positive. The `IdNot` suffix excludes the current entity from the check.

</details>

### Mapper updateEntity method

<details>
<summary>Expand for guidance</summary>

Add an `updateEntity` method to `EmployeeMapper` that applies only non-null fields from the request to the entity:

```java
public void updateEntity(Employee entity, UpdateEmployeeRequest request) {
    if (request.firstName() != null) {
        entity.setFirstName(request.firstName());
    }
    if (request.lastName() != null) {
        entity.setLastName(request.lastName());
    }
    if (request.email() != null) {
        entity.setEmail(request.email());
    }
    if (request.department() != null) {
        entity.setDepartment(request.department());
    }
    if (request.role() != null) {
        entity.setRole(request.role());
    }
    if (request.hireDate() != null) {
        entity.setHireDate(request.hireDate());
    }
    if (request.managerId() != null) {
        entity.setManagerId(request.managerId());
    }
    if (request.status() != null) {
        entity.setStatus(request.status());
    }
}
```

Each field is guarded by a null check. If the client omits a field from the JSON request body, Jackson leaves it as `null` in the record, and the mapper skips it. This implements PATCH semantics: only provided fields are updated.

**Limitation**: this approach cannot distinguish between "field omitted" and "field explicitly set to null". If you need to clear a nullable field (e.g., set `managerId` to `null`), consider using `JsonNullable` from `org.openapitools:jackson-databind-nullable` in a future iteration. For Stage 1, this simple approach covers the requirements.

</details>

### PATCH vs PUT

<details>
<summary>Expand for guidance</summary>

The PRD specifies PATCH, not PUT. Here is why:

| Method | Semantics | Use Case |
|---|---|---|
| PUT | **Full replacement** — client sends the complete resource; missing fields are reset to defaults or null | When the client always has the full resource |
| PATCH | **Partial update** — client sends only the fields to change; missing fields are preserved | When the client wants to modify one or two fields without knowing the full resource |

PATCH is the better fit for this API because:
1. Clients often update a single field (e.g., changing department after a transfer).
2. PUT would require the client to fetch the full resource first, then send it back with one field changed — unnecessary round-trip.
3. It reduces the risk of accidentally overwriting fields with stale data.

The trade-off is that PATCH requires more careful implementation (null-handling, partial validation). That complexity is handled here in the service and mapper layers.

</details>

---

## Development Log

| Date | Entry |
|---|---|
| --- | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) -- Section 1 (records for DTOs, null safety with Optional), Section 2 (thin controllers, constructor injection)
- [DESIGN.md](../../../../docs/DESIGN.md) -- Section 6 (error contract for 404, 409, 422 responses)
- [PRD.md](../../../../docs/PRD.md) -- Stage 1 functional requirements (update employee via PATCH), validation rules (email uniqueness, manager validation)
