package com.timetracker.employee.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Request body for PATCH /employees/{id}.
 *
 * PATCH semantics: every field is optional. A null field means "leave the
 * current value unchanged". The service layer iterates only the non-null
 * fields and applies them to the entity.
 *
 * version is required by convention (optimistic locking) but is not annotated
 * @NotNull here — the service validates its presence and returns 409 Conflict
 * if a concurrent modification is detected.
 */
public record UpdateEmployeeRequest(

        @Size(min = 1, max = 100)
        String firstName,

        @Size(min = 1, max = 100)
        String lastName,

        @Email
        String email,

        @Size(min = 1, max = 100)
        String department,

        @Size(min = 1, max = 100)
        String role,

        LocalDate hireDate,

        UUID managerId,  // null = "don't change"; to explicitly remove a manager use a dedicated endpoint

        Long version

) {}
