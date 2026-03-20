package com.timetracker.employee;

import com.timetracker.employee.dto.CreateEmployeeRequest;
import com.timetracker.employee.dto.EmployeeResponse;
import com.timetracker.employee.dto.UpdateEmployeeRequest;
import org.springframework.stereotype.Component;

@Component
public class EmployeeMapper {

    /**
     * Maps a creation request to a new entity.
     * Status defaults to ACTIVE. Manager is NOT set here — the service resolves
     * managerId to an Employee entity after validating it exists.
     */
    public Employee toEntity(CreateEmployeeRequest request) {
        var employee = new Employee();
        employee.setFirstName(request.firstName());
        employee.setLastName(request.lastName());
        employee.setEmail(request.email());
        employee.setDepartment(request.department());
        employee.setRole(request.role());
        employee.setHireDate(request.hireDate());
        employee.setStatus(EmployeeStatus.ACTIVE);
        return employee;
    }

    /**
     * Maps a persisted entity to a response DTO.
     * managerId is extracted from the manager association (null for root employees).
     */
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
                entity.getStatus().name(),
                entity.getVersion() != null ? entity.getVersion() : 0L,
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    /**
     * Applies a partial update request onto an existing entity.
     * Null fields in the request are skipped — PATCH semantics.
     * Manager and version are handled by the service, not here.
     */
    public void updateEntity(Employee entity, UpdateEmployeeRequest request) {
        if (request.firstName() != null)   entity.setFirstName(request.firstName());
        if (request.lastName() != null)    entity.setLastName(request.lastName());
        if (request.email() != null)       entity.setEmail(request.email());
        if (request.department() != null)  entity.setDepartment(request.department());
        if (request.role() != null)        entity.setRole(request.role());
        if (request.hireDate() != null)    entity.setHireDate(request.hireDate());
    }
}
