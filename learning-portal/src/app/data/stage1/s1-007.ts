import { Story } from '../../models/step.model';

export const S1_007: Story = {
  id: 'S1-007',
  title: 'S1-007 — List Employees',
  tasks: [
    {
      id: 'T-007-01',
      title: 'Service — Paginated Listing',
      description:
        'What is pagination and why does it matter?\n\n' +
        'Imagine your company has 10,000 employees. If the list endpoint returned all 10,000 records at once, the response would be enormous — slow to send, slow to parse, and wasteful of memory. Pagination solves this by dividing results into "pages." The client asks for page 0 with 20 items, then page 1 with 20 items, and so on. This is how almost every real-world list API works.\n\n' +
        'In Spring Data JPA, you get pagination for free. Instead of calling repository.findAll(), you call repository.findAll(spec, pageable), where pageable carries the page number and page size. Spring generates the correct SQL with LIMIT and OFFSET clauses automatically. The result is a Page<Employee> object that contains both the current page\'s records AND metadata like total count and total pages.\n\n' +
        'The service method you are writing accepts optional filter parameters (department, role, status) plus a Pageable. It builds a Specification (a set of WHERE conditions), passes it to the repository, then maps the results into a PagedEmployeeResponse DTO that includes both the employee list and the pagination metadata.\n\n' +
        'One important default behavior: if no status filter is provided, the list defaults to showing only ACTIVE employees. Inactive (soft-deleted) employees are hidden unless you explicitly ask for them. This is different from getById(), which returns any employee regardless of status.',
      concepts: [
        {
          term: 'Pageable',
          explanation:
            'An interface that carries pagination instructions: which page number (0-indexed), how many items per page (size), and how to sort (e.g., sort by lastName ascending). Spring MVC automatically reads ?page=0&size=20&sort=lastName,asc from the URL and creates a Pageable object. You declare it as a method parameter in your controller and Spring handles the rest — you never create Pageable objects manually in the controller.',
        },
        {
          term: 'Page<T>',
          explanation:
            'The return type of repository.findAll(spec, pageable). A Page<Employee> holds the list of Employee objects for the current page plus pagination metadata: total number of matching records, total number of pages, current page number, and page size. This metadata is essential for the client to build "next page" / "previous page" controls. You unpack this into PagedEmployeeResponse.',
        },
        {
          term: 'PagedEmployeeResponse',
          explanation:
            'A DTO (Data Transfer Object) record you define to represent the API response for paginated lists. It contains the list of EmployeeResponse objects for the current page, plus fields for pageNumber, pageSize, totalElements, and totalPages. This is what gets serialized to JSON and sent to the client.',
        },
        {
          term: 'JPA Specification',
          explanation:
            'A Specification is a reusable "filter rule" you can compose and combine. Instead of writing a separate repository method for every filter combination (findByDepartmentAndRole, findByDepartmentAndStatus...), you write small Specification pieces and combine them with .and(). Spring Data JPA translates each Specification into a WHERE clause predicate. You write Specifications in the next task.',
        },
        {
          term: 'Effective status default',
          explanation:
            'The list method defaults status to ACTIVE when the caller does not provide one. The line EmployeeStatus effectiveStatus = (status != null) ? status : EmployeeStatus.ACTIVE uses the ternary operator — a shorthand if/else. It means: "if status was provided, use it; otherwise use ACTIVE." This is a common API design pattern: safe defaults make APIs easier to use correctly.',
        },
      ],
      checklist: [
        'Create the PagedEmployeeResponse record in com.timetracker.employee.dto — it should have fields: List<EmployeeResponse> content, int pageNumber, int pageSize, long totalElements, int totalPages.',
        'Add the list() method to EmployeeService with the signature shown in the example.',
        'Inside list(), compute the effective status: if status is null, default to EmployeeStatus.ACTIVE.',
        'Build the specification using EmployeeSpecifications.withFilters() (you will create this class in the next task — for now you can use a placeholder and refine it).',
        'Call repository.findAll(spec, pageable) and store the result as Page<Employee>.',
        'Map the page content to EmployeeResponse using stream().map(mapper::toResponse).toList().',
        'Construct and return a new PagedEmployeeResponse from the page data.',
        'Commit with message: feat(S1-007): implement EmployeeService.list()',
      ],
      examples: [
        {
          lang: 'java',
          label: 'PagedEmployeeResponse.java — response DTO',
          code: `package com.timetracker.employee.dto;

import java.util.List;

// A Java record is an immutable data class — the compiler generates constructor,
// getters (as field-name methods), equals, hashCode, and toString automatically.
// This record holds a single page of employees plus pagination metadata.
public record PagedEmployeeResponse(
        List<EmployeeResponse> content,    // the employees on this page
        int pageNumber,                    // current page index (0-based)
        int pageSize,                      // how many items were requested per page
        long totalElements,                // total matching records across ALL pages
        int totalPages                     // total number of pages available
) {}`,
        },
        {
          lang: 'java',
          label: 'EmployeeService.java — list() method',
          code: `package com.timetracker.employee.service;

import com.timetracker.employee.domain.Employee;
import com.timetracker.employee.domain.EmployeeStatus;
import com.timetracker.employee.dto.EmployeeResponse;
import com.timetracker.employee.dto.PagedEmployeeResponse;
import com.timetracker.employee.repository.EmployeeRepository;
import com.timetracker.employee.repository.EmployeeSpecifications;
import com.timetracker.employee.mapper.EmployeeMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmployeeService {

    // ... constructor, create(), getById() from earlier stories ...

    public PagedEmployeeResponse list(
            String department,      // optional: filter by department name
            String role,            // optional: filter by role
            EmployeeStatus status,  // optional: filter by status (defaults to ACTIVE)
            Pageable pageable) {    // carries page number, size, and sort from the URL

        // Default status to ACTIVE when not specified by the caller.
        // Ternary operator: condition ? valueIfTrue : valueIfFalse
        EmployeeStatus effectiveStatus = (status != null) ? status : EmployeeStatus.ACTIVE;

        // Build a combined WHERE specification from all the optional filters
        // (EmployeeSpecifications is written in the next task)
        Specification<Employee> spec =
                EmployeeSpecifications.withFilters(department, role, effectiveStatus);

        // Execute the query: Spring adds LIMIT/OFFSET/ORDER BY automatically
        Page<Employee> page = repository.findAll(spec, pageable);

        // Convert Employee entities to EmployeeResponse DTOs for the current page only
        List<EmployeeResponse> content = page.getContent()  // List<Employee> for this page
                .stream()                                    // turn it into a Stream
                .map(mapper::toResponse)                     // convert each Employee to EmployeeResponse
                .toList();                                   // collect back into a List

        // Build and return the response with both the data and the pagination metadata
        return new PagedEmployeeResponse(
                content,
                page.getNumber(),        // current page index (0-based)
                page.getSize(),          // page size (may differ from totalElements)
                page.getTotalElements(), // total matching records in the database
                page.getTotalPages()     // total pages (totalElements / pageSize, rounded up)
        );
    }
}`,
        },
      ],
      links: [
        { label: 'Spring Data — Pagination and Sorting', url: 'https://docs.spring.io/spring-data/jpa/reference/repositories/query-methods-details.html#repositories.special-parameters' },
        { label: 'Spring Data — Page interface', url: 'https://docs.spring.io/spring-data/commons/docs/current/api/org/springframework/data/domain/Page.html' },
        { label: 'Java Streams — map() and toList()', url: 'https://docs.oracle.com/en/java/docs/api/java.base/java/util/stream/Stream.html' },
      ],
    },
    {
      id: 'T-007-02',
      title: 'Filter Specifications',
      description:
        'What is a JPA Specification?\n\n' +
        'A Specification is a small, composable filter rule. Think of it like a building block for SQL WHERE clauses. Each Specification represents one condition: "department equals X", "status equals Y". You can combine them with .and() and .or() to build complex filters without writing SQL or creating dozens of separate repository methods.\n\n' +
        'Without Specifications, to support filtering by department AND role AND status, you would need to write a repository method like findByDepartmentAndRoleAndStatus(). But what if you want to filter by just department? Or just status? You need a method for every combination. With three optional filters, that is 8 possible combinations (2^3). Specifications let you build the filter dynamically at runtime.\n\n' +
        'Each Specification is a lambda with three parameters: root (the entity being queried — think of it as a reference to the Employee table), query (the full query object), and cb (the CriteriaBuilder, a factory for building conditions). You use cb.equal(root.get("department"), value) to express "WHERE department = ?". When you return null from a Specification, it means "no filter" — the condition is skipped.\n\n' +
        'The final withFilters() method uses Specification.where(...).and(...).and(...) to chain all three conditions. Specification.where() starts the chain with a safe "no filter" base, and .and() adds each additional condition.',
      concepts: [
        {
          term: 'JPA Specification',
          explanation:
            'A Specification is a reusable "filter rule" you can pass to the repository. Instead of writing a separate repository method for every possible filter combination (findByDepartmentAndRole, findByDepartmentAndStatus, findByDepartmentAndRoleAndStatus...), you write small Specification pieces and combine them with .and() or .or(). Spring Data JPA translates them into WHERE clause predicates.',
        },
        {
          term: 'Predicate (in JPA context)',
          explanation:
            'A predicate is a single condition in a SQL WHERE clause, like department = \'Engineering\' or status = \'ACTIVE\'. In JPA Specifications, you build predicates using the CriteriaBuilder (cb). The cb.equal(root.get("field"), value) call creates a predicate meaning "field = value." Returning null from a Specification means "no filter" — the predicate is skipped entirely.',
        },
        {
          term: 'root.get("fieldName")',
          explanation:
            'root.get("fieldName") accesses a field of the entity you are querying. It is like saying "the department column of the Employee table." The string name must match your Java field name exactly (the JPA field name, not the database column name). JPA knows the mapping between Java field names and database column names from your @Column annotations.',
        },
        {
          term: 'Specification.where()',
          explanation:
            'Specification.where(spec) is the starting point for combining specifications. It accepts a single Specification and returns it as a starting point for chaining .and() or .or() calls. It handles the edge case where the first specification is null gracefully — the chain will not fail if the first filter is null.',
        },
        {
          term: 'CriteriaBuilder (cb)',
          explanation:
            'The CriteriaBuilder is a factory provided by JPA for constructing query conditions. You use it to build predicates: cb.equal() for equality, cb.like() for pattern matching (used in search), cb.greaterThan() for comparisons, cb.or() to combine conditions with OR. You never instantiate CriteriaBuilder yourself — JPA provides it as the third parameter in a Specification lambda.',
        },
      ],
      checklist: [
        'Create EmployeeSpecifications.java in com.timetracker.employee.repository — use the class shown in the example.',
        'Declare the class as final with a private constructor to prevent instantiation (it is a utility class with only static methods).',
        'Implement the private hasDepartment(String department) method that returns a Specification.',
        'Implement hasRole(String role) similarly.',
        'Implement hasStatus(EmployeeStatus status) similarly.',
        'Implement the public withFilters() method that combines all three with Specification.where().and().and().',
        'Open EmployeeRepository.java and add JpaSpecificationExecutor<Employee> to the extends clause — this enables the findAll(spec, pageable) call.',
        'Commit with message: feat(S1-007): add EmployeeSpecifications for dynamic filtering',
      ],
      examples: [
        {
          lang: 'java',
          label: 'EmployeeRepository.java — add JpaSpecificationExecutor',
          code: `package com.timetracker.employee.repository;

import com.timetracker.employee.domain.Employee;
import com.timetracker.employee.domain.EmployeeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

// JpaRepository<Employee, UUID> provides: findById, findAll, save, delete, existsById, etc.
// JpaSpecificationExecutor<Employee> adds: findAll(Specification, Pageable) — needed for filtering
public interface EmployeeRepository
        extends JpaRepository<Employee, UUID>,
                JpaSpecificationExecutor<Employee> { // <-- ADD THIS

    boolean existsByEmail(String email);
    boolean existsByEmailAndIdNot(String email, UUID id);
    long countByManagerIdAndStatus(UUID managerId, EmployeeStatus status);
}`,
        },
        {
          lang: 'java',
          label: 'EmployeeSpecifications.java — dynamic filter builder',
          code: `package com.timetracker.employee.repository;

import com.timetracker.employee.domain.Employee;
import com.timetracker.employee.domain.EmployeeStatus;
import org.springframework.data.jpa.domain.Specification;

// 'final' prevents subclassing — this is a utility class, not meant to be extended
public final class EmployeeSpecifications {

    // Private constructor prevents instantiation: new EmployeeSpecifications() is a compile error.
    // All methods are static, so you call EmployeeSpecifications.withFilters(...) directly.
    private EmployeeSpecifications() {}

    // The public entry point — combines all filters into one Specification
    public static Specification<Employee> withFilters(
            String department,
            String role,
            EmployeeStatus status) {

        // Specification.where(first) starts the chain with the first filter.
        // .and(second) adds each additional filter.
        // If any individual Specification returns null, Spring skips that condition.
        return Specification.where(hasDepartment(department))
                .and(hasRole(role))
                .and(hasStatus(status));
    }

    // --- Private helper methods, each returning one Specification ---

    private static Specification<Employee> hasDepartment(String department) {
        // (root, query, cb) -> ... is a lambda — a function with three parameters
        // root = reference to the Employee table/entity
        // query = the full query being built (rarely needed in simple specs)
        // cb = CriteriaBuilder, the factory for building conditions
        return (root, query, cb) -> {
            // Returning null means "no filter" — this condition will be skipped
            if (department == null) return null;
            // cb.equal(column, value) generates: WHERE department = ?
            return cb.equal(root.get("department"), department);
        };
    }

    private static Specification<Employee> hasRole(String role) {
        return (root, query, cb) -> {
            if (role == null) return null;
            return cb.equal(root.get("role"), role); // WHERE role = ?
        };
    }

    private static Specification<Employee> hasStatus(EmployeeStatus status) {
        return (root, query, cb) -> {
            if (status == null) return null;
            // root.get("status") refers to the 'status' field in the Employee entity
            // The value is an enum — JPA handles enum-to-string conversion automatically
            return cb.equal(root.get("status"), status); // WHERE status = 'ACTIVE'
        };
    }
}`,
        },
        {
          lang: 'sql',
          label: 'What SQL gets generated',
          code: `-- Query: list(department="Engineering", role=null, status=ACTIVE, page=0, size=20, sort=lastName ASC)
-- Spring generates:
SELECT * FROM employee
WHERE department = 'Engineering'   -- from hasDepartment()
  AND status = 'ACTIVE'            -- from hasStatus() — role filter is skipped (null)
ORDER BY last_name ASC             -- from Pageable sort
LIMIT 20 OFFSET 0;                 -- from Pageable page/size

-- Query: list(department=null, role=null, status=ACTIVE, page=1, size=20)
-- All filters null except status:
SELECT * FROM employee
WHERE status = 'ACTIVE'
ORDER BY last_name ASC
LIMIT 20 OFFSET 20;  -- page 1 = skip first 20`,
        },
      ],
      links: [
        { label: 'Spring Data JPA — Specifications', url: 'https://docs.spring.io/spring-data/jpa/reference/jpa/specifications.html' },
        { label: 'Spring Data — JpaSpecificationExecutor', url: 'https://docs.spring.io/spring-data/jpa/docs/current/api/org/springframework/data/jpa/repository/JpaSpecificationExecutor.html' },
        { label: 'JPA CriteriaBuilder — javadoc', url: 'https://jakarta.ee/specifications/persistence/3.1/apidocs/jakarta.persistence/jakarta/persistence/criteria/criteriabuilder' },
      ],
    },
    {
      id: 'T-007-03',
      title: 'Controller — GET /api/v1/employees',
      description:
        'How does the list endpoint wire everything together?\n\n' +
        'The GET /api/v1/employees endpoint is the main list view of the API. It accepts optional query parameters for filtering (department, role, status) plus standard pagination parameters (page, size, sort). All of these are optional — calling GET /api/v1/employees with no parameters returns the first 20 active employees sorted by last name.\n\n' +
        'The @RequestParam annotation binds URL query parameters to method parameters. For example, ?department=Engineering binds "Engineering" to the department parameter. Because all filters are optional (required = false), Spring passes null for any filter not included in the URL.\n\n' +
        'The @PageableDefault annotation sets the default pagination behavior when the client does not provide page/size/sort parameters. You set size = 20 and sort = "lastName" so that unfiltered calls return a sensible first page. Spring MVC automatically converts the sort string into a Sort object and packages it all into a Pageable.\n\n' +
        'You also configure spring.data.web.pageable in application.yaml to enforce a maximum page size (100). This prevents a client from requesting size=999999 and loading the entire database into memory.',
      concepts: [
        {
          term: '@RequestParam',
          explanation:
            'The @RequestParam annotation binds a URL query parameter to a method parameter. In GET /employees?department=Engineering, "department" is the query parameter name and "Engineering" is its value. With required = false, if the parameter is absent from the URL, Spring sets the method parameter to null. You can also provide a defaultValue attribute to use a specific string default instead of null.',
        },
        {
          term: '@PageableDefault',
          explanation:
            'This annotation sets the default values for the Pageable parameter when the client does not provide ?page=, ?size=, or ?sort= in the URL. @PageableDefault(size = 20, sort = "lastName") means: if no pagination is specified, return page 0 with 20 items sorted by lastName ascending. Spring reads ?page=2&size=10&sort=email,desc and overrides these defaults automatically.',
        },
        {
          term: 'Query parameter vs path variable',
          explanation:
            'A path variable is part of the URL path — /employees/{id} — it is mandatory and identifies a specific resource. A query parameter appears after the ? in the URL — /employees?department=Engineering — it is optional and filters or customizes the response. List endpoints use query parameters for filters. Get-by-ID endpoints use path variables.',
        },
        {
          term: 'spring.data.web.pageable configuration',
          explanation:
            'Spring Boot can configure pagination behavior via application.yaml. The property spring.data.web.pageable.max-page-size limits how many records a client can request per page — without this, a client could send size=1000000 and cause an out-of-memory error. The default-page-size sets the fallback when no size is specified in the URL.',
        },
      ],
      checklist: [
        'Open EmployeeController.java and add the @GetMapping method (no path, handles GET /api/v1/employees) with the four parameters shown in the example.',
        'Annotate each filter parameter with @RequestParam(required = false) so they are optional.',
        'Annotate the Pageable parameter with @PageableDefault(size = 20, sort = "lastName").',
        'The method body is a single line: return ResponseEntity.ok(service.list(department, role, status, pageable));',
        'Open src/main/resources/application.yaml and add the spring.data.web.pageable configuration shown in the example.',
        'Test: GET /api/v1/employees should return first 20 active employees sorted by lastName.',
        'Test: GET /api/v1/employees?department=Engineering should return only Engineering employees.',
        'Test: GET /api/v1/employees?page=0&size=5&sort=email,asc should return 5 records sorted by email.',
        'Commit with message: feat(S1-007): add GET /api/v1/employees list endpoint',
      ],
      examples: [
        {
          lang: 'java',
          label: 'EmployeeController.java — list endpoint',
          code: `package com.timetracker.employee.controller;

import com.timetracker.employee.domain.EmployeeStatus;
import com.timetracker.employee.dto.PagedEmployeeResponse;
import com.timetracker.employee.service.EmployeeService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/employees")
public class EmployeeController {

    private final EmployeeService service;

    public EmployeeController(EmployeeService service) {
        this.service = service;
    }

    // POST and GET /{id} endpoints from earlier stories are here too...

    // Handles all of these:
    //   GET /api/v1/employees
    //   GET /api/v1/employees?department=Engineering
    //   GET /api/v1/employees?status=INACTIVE
    //   GET /api/v1/employees?page=2&size=10&sort=lastName,asc
    @GetMapping // handles GET /api/v1/employees (no path variable, no path suffix)
    public ResponseEntity<PagedEmployeeResponse> list(
            @RequestParam(required = false) String department,     // ?department=Engineering (optional)
            @RequestParam(required = false) String role,           // ?role=Developer (optional)
            @RequestParam(required = false) EmployeeStatus status, // ?status=ACTIVE — Spring converts string to enum
            @PageableDefault(size = 20, sort = "lastName")         // defaults when client omits pagination params
            Pageable pageable) {                                    // Spring builds Pageable from ?page= ?size= ?sort=

        // Delegate to service — no logic in the controller
        return ResponseEntity.ok(service.list(department, role, status, pageable));
    }
}`,
        },
        {
          lang: 'yaml',
          label: 'application.yaml — pageable configuration',
          code: `spring:
  data:
    web:
      pageable:
        # Maximum page size a client can request — prevents ?size=1000000 abuse
        max-page-size: 100
        # Default number of items per page when client does not specify ?size=
        default-page-size: 20`,
        },
        {
          lang: 'bash',
          label: 'Test the list endpoint with curl',
          code: `# Default — first 20 active employees, sorted by lastName
curl -s "http://localhost:8080/api/v1/employees" | jq .

# Filter by department
curl -s "http://localhost:8080/api/v1/employees?department=Engineering" | jq .

# Show inactive employees
curl -s "http://localhost:8080/api/v1/employees?status=INACTIVE" | jq .

# Second page, 5 per page, sorted by email ascending
curl -s "http://localhost:8080/api/v1/employees?page=1&size=5&sort=email,asc" | jq .

# Expected response shape:
# {
#   "content": [ {...}, {...} ],
#   "pageNumber": 0,
#   "pageSize": 20,
#   "totalElements": 47,
#   "totalPages": 3
# }`,
        },
      ],
      links: [
        { label: 'Spring MVC — @RequestParam', url: 'https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/requestparam.html' },
        { label: 'Spring Data Web Support — Pageable', url: 'https://docs.spring.io/spring-data/jpa/reference/repositories/core-extensions.html#core.web.basic' },
        { label: 'Spring Boot — application.properties reference', url: 'https://docs.spring.io/spring-boot/docs/current/reference/html/application-properties.html' },
      ],
    },
    {
      id: 'T-007-04',
      title: 'Unit Tests — List',
      description:
        'What should you test for the list operation?\n\n' +
        'The list() service method has more behavior to verify than getById(). You need to test: that it calls the repository with correct arguments, that it maps results correctly, that it defaults status to ACTIVE when none is provided, and that pagination metadata is passed through accurately.\n\n' +
        'The key challenge is mocking repository.findAll(spec, pageable). The repository now takes a Specification argument, so you use Mockito\'s any(Specification.class) matcher: "match this call regardless of which Specification is passed." You also need to return a realistic Page<Employee> from the mock.\n\n' +
        'For the Page object, use Spring\'s PageImpl class. It is a real implementation of the Page interface that you can construct in tests: new PageImpl<>(listOfItems, pageable, totalCount). This is cleaner than trying to mock the Page interface method-by-method.\n\n' +
        'A good set of tests covers: the happy path (some results returned), the empty result case (no matches), and the metadata correctness (totalElements, totalPages, pageNumber are all correct in the response).',
      concepts: [
        {
          term: 'PageImpl',
          explanation:
            'PageImpl is Spring Data\'s concrete implementation of the Page interface. You use it in tests to create a real Page object: new PageImpl<>(List.of(employee), pageable, 1L) creates a page with one employee, the given pageable settings, and a total count of 1. The third argument (1L) is the total element count — it is what Page.getTotalElements() will return.',
        },
        {
          term: 'Mocking with any(Class)',
          explanation:
            'any(Specification.class) is a typed Mockito matcher that matches any non-null argument of that type. It is needed here because Specifications are built dynamically inside the service — you cannot predict the exact object instance that will be created. Using any(Specification.class) tells Mockito: "match this call whenever a Specification of any kind is passed."',
        },
        {
          term: 'PageRequest.of()',
          explanation:
            'PageRequest.of(pageNumber, pageSize) creates a concrete Pageable object for use in tests. PageRequest.of(0, 20) means page 0 with size 20. You can also add sorting: PageRequest.of(0, 20, Sort.by("lastName")). This is the test equivalent of what Spring MVC creates automatically from URL parameters in the real application.',
        },
      ],
      checklist: [
        'Open EmployeeServiceTest.java and add necessary imports: PageImpl, PageRequest, Specification from Spring Data.',
        'Add the list_returnsPagedResponse() test: create a mock Employee and PageImpl, stub repository.findAll(any(Specification.class), any(Pageable.class)), call service.list(), and assert all response fields.',
        'Add the list_emptyResult() test: stub repository to return an empty PageImpl, assert content is empty and totalElements is 0.',
        'Run: cd employee-service && ./mvnw.cmd test -Dtest=EmployeeServiceTest',
        'All tests should be green. Commit with message: test(S1-007): unit tests for list employees',
      ],
      examples: [
        {
          lang: 'java',
          label: 'EmployeeServiceTest.java — list() tests',
          code: `package com.timetracker.employee.service;

import com.timetracker.employee.domain.Employee;
import com.timetracker.employee.domain.EmployeeStatus;
import com.timetracker.employee.dto.EmployeeResponse;
import com.timetracker.employee.dto.PagedEmployeeResponse;
import com.timetracker.employee.mapper.EmployeeMapper;
import com.timetracker.employee.repository.EmployeeRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock EmployeeRepository repository;
    @Mock EmployeeMapper mapper;
    @InjectMocks EmployeeService service;

    // ... other tests from S1-005 and S1-006 ...

    @Test
    @DisplayName("list returns paged response with correct metadata")
    void list_returnsPagedResponse() {
        // ARRANGE
        Employee employee = new Employee();
        EmployeeResponse employeeResponse = new EmployeeResponse(
                UUID.randomUUID(), "Jane", "Doe", "jane@example.com",
                "Engineering", "Developer", LocalDate.of(2024, 1, 1),
                null, EmployeeStatus.ACTIVE, 0L, Instant.now(), Instant.now());

        // PageRequest.of(0, 20) = page 0, 20 items per page
        Pageable pageable = PageRequest.of(0, 20, Sort.by("lastName"));

        // PageImpl creates a real Page object:
        // args: (list of content, pageable settings, total element count)
        Page<Employee> mockPage = new PageImpl<>(List.of(employee), pageable, 1L);

        // Stub: when findAll is called with any Specification and any Pageable, return mockPage
        when(repository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(mockPage);
        // Stub: when mapper converts our employee, return the DTO
        when(mapper.toResponse(employee)).thenReturn(employeeResponse);

        // ACT
        PagedEmployeeResponse result = service.list(null, null, null, pageable);

        // ASSERT: verify data and metadata are correct
        assertThat(result.content()).hasSize(1);
        assertThat(result.content().get(0)).isEqualTo(employeeResponse);
        assertThat(result.totalElements()).isEqualTo(1L);
        assertThat(result.pageNumber()).isEqualTo(0);
        assertThat(result.pageSize()).isEqualTo(20);
        assertThat(result.totalPages()).isEqualTo(1);
    }

    @Test
    @DisplayName("list returns empty response when no employees match the filters")
    void list_emptyResult() {
        // ARRANGE: an empty page — simulate "no records match"
        Pageable pageable = PageRequest.of(0, 20);
        // new PageImpl<>(emptyList, pageable, 0L) = page with no items, total 0
        Page<Employee> emptyPage = new PageImpl<>(List.of(), pageable, 0L);
        when(repository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(emptyPage);

        // ACT
        PagedEmployeeResponse result = service.list("NonExistentDept", null, null, pageable);

        // ASSERT
        assertThat(result.content()).isEmpty();          // no employees in the list
        assertThat(result.totalElements()).isEqualTo(0L); // zero total records
        assertThat(result.totalPages()).isEqualTo(0);    // zero pages
    }
}`,
        },
        {
          lang: 'bash',
          label: 'Run only the service tests',
          code: `# From the project root
JAVA_HOME="C:/Program Files/Eclipse Adoptium/jdk-25.0.2.10-hotspot" \\
  ./mvnw.cmd test -Dtest=EmployeeServiceTest -pl employee-service

# Expected:
# [INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0`,
        },
      ],
      links: [
        { label: 'Spring Data — PageImpl', url: 'https://docs.spring.io/spring-data/commons/docs/current/api/org/springframework/data/domain/PageImpl.html' },
        { label: 'Mockito — ArgumentMatchers', url: 'https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/ArgumentMatchers.html' },
        { label: 'AssertJ — Collection assertions', url: 'https://assertj.github.io/doc/#assertj-core-group-assertions' },
      ],
    },
  ],
};
