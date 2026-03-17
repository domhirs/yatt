package com.timetracker.employee.dto;

import java.util.List;

/**
 * Paginated wrapper returned by GET /employees and GET /employees/search.
 *
 * page and size mirror what the client requested. totalElements is the count
 * across all pages. totalPages = ceil(totalElements / size).
 */
public record PagedEmployeeResponse(

        List<EmployeeResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages

) {}
