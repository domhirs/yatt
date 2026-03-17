package com.timetracker.employee.dto;

import java.time.Instant;
import java.util.List;

/**
 * Uniform error body returned for all 4xx and 5xx responses.
 *
 * For 422 Unprocessable Entity, details contains one entry per failing field.
 * For all other errors, details is an empty list.
 *
 * Example (400):
 *   { "status": 400, "error": "Bad Request", "message": "...",
 *     "details": [], "timestamp": "...", "path": "/api/v1/employees/bad-id" }
 */
public record ErrorResponse(

        int status,
        String error,
        String message,
        List<ValidationErrorDetail> details,
        Instant timestamp,
        String path

) {}
