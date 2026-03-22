package com.timetracker.employee;

import com.timetracker.employee.dto.CreateEmployeeRequest;
import com.timetracker.employee.dto.EmployeeResponse;
import com.timetracker.employee.dto.UpdateEmployeeRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class EmployeeMapperTest {

    private EmployeeMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new EmployeeMapper();
    }

    // ── toEntity ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("toEntity maps all fields from CreateEmployeeRequest")
    void toEntity_mapsAllFields() {
        var managerId = UUID.randomUUID();
        var request = new CreateEmployeeRequest(
                "Jane", "Smith", "jane@example.com",
                "Engineering", "Senior Developer",
                LocalDate.of(2025, 3, 15), managerId
        );

        Employee entity = mapper.toEntity(request);

        assertThat(entity.getFirstName()).isEqualTo("Jane");
        assertThat(entity.getLastName()).isEqualTo("Smith");
        assertThat(entity.getEmail()).isEqualTo("jane@example.com");
        assertThat(entity.getDepartment()).isEqualTo("Engineering");
        assertThat(entity.getRole()).isEqualTo("Senior Developer");
        assertThat(entity.getHireDate()).isEqualTo(LocalDate.of(2025, 3, 15));
        assertThat(entity.getStatus()).isEqualTo(EmployeeStatus.ACTIVE);
    }

    @Test
    @DisplayName("toEntity always sets status to ACTIVE regardless of any future request field")
    void toEntity_defaultsStatusToActive() {
        var request = new CreateEmployeeRequest(
                "A", "B", "a@b.com", "Dept", "Role", LocalDate.now(), null
        );

        Employee entity = mapper.toEntity(request);

        assertThat(entity.getStatus()).isEqualTo(EmployeeStatus.ACTIVE);
    }

    @Test
    @DisplayName("toEntity does not set manager — service is responsible for that")
    void toEntity_doesNotSetManager() {
        var request = new CreateEmployeeRequest(
                "A", "B", "a@b.com", "Dept", "Role", LocalDate.now(),
                UUID.randomUUID()  // managerId present in request, but mapper ignores it
        );

        Employee entity = mapper.toEntity(request);

        assertThat(entity.getManager()).isNull();
    }

    // ── toResponse ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("toResponse maps all entity fields to response DTO")
    void toResponse_mapsAllFields() {
        Employee entity = buildPersistedEmployee();

        EmployeeResponse response = mapper.toResponse(entity);

        assertThat(response.id()).isEqualTo(entity.getId());
        assertThat(response.firstName()).isEqualTo("Jane");
        assertThat(response.lastName()).isEqualTo("Smith");
        assertThat(response.email()).isEqualTo("jane@example.com");
        assertThat(response.department()).isEqualTo("Engineering");
        assertThat(response.role()).isEqualTo("Senior Developer");
        assertThat(response.hireDate()).isEqualTo(LocalDate.of(2025, 3, 15));
        assertThat(response.status()).isEqualTo("ACTIVE");
    }

    @Test
    @DisplayName("toResponse extracts managerId from manager entity when present")
    void toResponse_extractsManagerId() {
        Employee manager = buildPersistedEmployee();
        Employee employee = buildPersistedEmployee();
        employee.setManager(manager);

        EmployeeResponse response = mapper.toResponse(employee);

        assertThat(response.managerId()).isEqualTo(manager.getId());
    }

    @Test
    @DisplayName("toResponse sets managerId to null for root employees")
    void toResponse_nullManagerId_whenNoManager() {
        Employee employee = buildPersistedEmployee();
        // manager is not set

        EmployeeResponse response = mapper.toResponse(employee);

        assertThat(response.managerId()).isNull();
    }

    // ── updateEntity ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("updateEntity applies all non-null fields from the request")
    void updateEntity_appliesNonNullFields() {
        Employee entity = buildPersistedEmployee();
        var request = new UpdateEmployeeRequest(
                "NewFirst", "NewLast", "new@example.com",
                "Marketing", "Staff Engineer",
                LocalDate.of(2024, 6, 1), null, 0L
        );

        mapper.updateEntity(entity, request);

        assertThat(entity.getFirstName()).isEqualTo("NewFirst");
        assertThat(entity.getLastName()).isEqualTo("NewLast");
        assertThat(entity.getEmail()).isEqualTo("new@example.com");
        assertThat(entity.getDepartment()).isEqualTo("Marketing");
        assertThat(entity.getRole()).isEqualTo("Staff Engineer");
        assertThat(entity.getHireDate()).isEqualTo(LocalDate.of(2024, 6, 1));
    }

    @Test
    @DisplayName("updateEntity skips null fields — existing values are preserved")
    void updateEntity_preservesUnchangedFields() {
        Employee entity = buildPersistedEmployee();
        String originalFirst = entity.getFirstName();
        var request = new UpdateEmployeeRequest(
                null, null, null, "Marketing", null, null, null, 0L
        );

        mapper.updateEntity(entity, request);

        assertThat(entity.getDepartment()).isEqualTo("Marketing");
        assertThat(entity.getFirstName()).isEqualTo(originalFirst); // untouched
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Builds an Employee that looks as if it came from the database.
     * Uses reflection-style field setting via setters since the entity
     * doesn't expose an id setter (id is assigned by Hibernate).
     */
    private Employee buildPersistedEmployee() {
        var employee = new Employee();
        employee.setFirstName("Jane");
        employee.setLastName("Smith");
        employee.setEmail("jane@example.com");
        employee.setDepartment("Engineering");
        employee.setRole("Senior Developer");
        employee.setHireDate(LocalDate.of(2025, 3, 15));
        employee.setStatus(EmployeeStatus.ACTIVE);
        return employee;
    }
}
