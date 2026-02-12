# T-004-04: Employee Mapper

| Field | Value |
|---|---|
| **Task ID** | T-004-04 |
| **Story** | [S1-004: Employee Entity, Repository & DTOs](../../../stories/stage1/S1-004-employee-entity.md) |
| **Status** | Pending |

---

## Objective

Create a mapper component to convert between Employee entity and DTOs, keeping mapping logic centralized and testable.

---

## Checklist

- [ ] Create `EmployeeMapper` as `@Component`
- [ ] Implement `toEntity(CreateEmployeeRequest)` method
- [ ] Implement `toResponse(Employee)` method
- [ ] Implement `updateEntity(Employee, UpdateEmployeeRequest)` for partial updates
- [ ] Handle `managerId` → `manager` entity lookup delegation (done in service, not mapper)
- [ ] Write unit tests for all mapper methods
- [ ] Commit: `feat(S1-004): add EmployeeMapper component`

---

## Details

### Mapper implementation

<details>
<summary>Expand for guidance</summary>

```java
package com.timetracker.employee;

import com.timetracker.employee.dto.CreateEmployeeRequest;
import com.timetracker.employee.dto.EmployeeResponse;
import com.timetracker.employee.dto.UpdateEmployeeRequest;
import org.springframework.stereotype.Component;

@Component
public class EmployeeMapper {

    public Employee toEntity(CreateEmployeeRequest request) {
        var employee = new Employee();
        employee.setFirstName(request.firstName());
        employee.setLastName(request.lastName());
        employee.setEmail(request.email());
        employee.setDepartment(request.department());
        employee.setRole(request.role());
        employee.setHireDate(request.hireDate());
        employee.setStatus(EmployeeStatus.ACTIVE);
        // manager is set by the service after validation
        return employee;
    }

    public EmployeeResponse toResponse(Employee entity) {
        return new EmployeeResponse(
            entity.getId(),
            entity.getFirstName(),
            entity.getLastName(),
            entity.getEmail(),
            entity.getDepartment(),
            entity.getRole(),
            entity.getHireDate(),
            entity.getManager() != null ? entity.getManager().getId() : null,
            entity.getStatus(),
            entity.getVersion(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }

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
        // manager update is handled by the service
    }
}
```

**Why no MapStruct?** At this project scale, manual mapping is clearer, easier to debug, and avoids an annotation processor dependency. Consider MapStruct if the number of entities grows significantly.

**Why doesn't the mapper handle manager?** The mapper does pure data transformation. Looking up a manager entity from the database is a service-layer concern (it involves repository access and business validation).

</details>

### Unit tests

<details>
<summary>Expand for guidance</summary>

```java
@Test
@DisplayName("toEntity maps all fields from CreateEmployeeRequest")
void toEntity_mapsAllFields() {
    var request = new CreateEmployeeRequest(
        "John", "Doe", "john@example.com",
        "Engineering", "Developer",
        LocalDate.of(2024, 1, 15), null
    );

    Employee entity = mapper.toEntity(request);

    assertThat(entity.getFirstName()).isEqualTo("John");
    assertThat(entity.getStatus()).isEqualTo(EmployeeStatus.ACTIVE);
    // ... assert all fields
}

@Test
@DisplayName("updateEntity only updates non-null fields")
void updateEntity_partialUpdate() {
    var entity = createTestEmployee();
    var request = new UpdateEmployeeRequest(
        null, null, null, "Marketing", null, null, null, null
    );

    mapper.updateEntity(entity, request);

    assertThat(entity.getDepartment()).isEqualTo("Marketing");
    assertThat(entity.getFirstName()).isEqualTo("OriginalName"); // unchanged
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

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) — Section 1: Java 25 coding standards
- [GUIDELINES.md](../../../../docs/GUIDELINES.md) — Section 2: Thin controllers, service logic
