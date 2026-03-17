package com.timetracker.employee.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Request body for POST /employees.
 *
 * All fields except managerId are required. managerId is null for top-level
 * employees (e.g. the CEO).
 */
public record CreateEmployeeRequest(

        @NotBlank
        @Size(max = 100)
        String firstName,

        @NotBlank
        @Size(max = 100)
        String lastName,

        @NotBlank
        @Email
        String email,

        @NotBlank
        @Size(max = 100)
        String department,

        @NotBlank
        @Size(max = 100)
        String role,

        @NotNull
        LocalDate hireDate,

        UUID managerId  // nullable — null means no manager (root employee)

) {}
