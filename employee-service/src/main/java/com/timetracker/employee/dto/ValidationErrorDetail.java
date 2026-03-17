package com.timetracker.employee.dto;

/**
 * A single field-level validation failure.
 *
 * Included in ErrorResponse.details when the response status is 422.
 * For all other error types, details is an empty list.
 */
public record ValidationErrorDetail(

        String field,
        String message

) {}
