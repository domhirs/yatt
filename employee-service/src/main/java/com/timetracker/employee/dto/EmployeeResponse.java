package com.timetracker.employee.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Response body for all endpoints that return a single employee.
 *
 * version is included so clients can send it back on PATCH requests for
 * optimistic locking. If the version has changed since the client last read
 * the resource, the server returns 409 Conflict.
 */
public record EmployeeResponse(

        UUID id,
        String firstName,
        String lastName,
        String email,
        String department,
        String role,
        LocalDate hireDate,
        UUID managerId,   // null for root employees (no manager)
        String status,
        long version,
        Instant createdAt,
        Instant updatedAt

) {}
