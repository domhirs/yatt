import { Story } from '../../models/step.model';

export const S1_010: Story = {
  id: 'S1-010',
  title: 'S1-010 — Search Employees',
  tasks: [
    {
      id: 'T-010-01',
      title: 'Service — Search by Name',
      description:
        'What is name search and how does it work?\n\n' +
        'Search is different from filter. Filtering (S1-007) matches exact values: department = "Engineering". Search matches partial strings: find any employee whose first name OR last name contains "joh" — returning "John Smith", "Mary Johnson", "Johanna Brown". The caller types a few letters and gets back all matching employees.\n\n' +
        'The implementation uses a SQL LIKE clause with wildcards: WHERE LOWER(first_name) LIKE \'%joh%\' OR LOWER(last_name) LIKE \'%joh%\'. The LOWER() function makes the search case-insensitive — "joh" matches "John", "JOHNSON", "johanna". The % wildcards match any characters before and after the search term.\n\n' +
        'You implement this as a new Specification in EmployeeSpecifications called nameContains(String query). You also add a search() method to EmployeeService that uses this Specification combined with a status = ACTIVE filter. Search only returns active employees — you would not want a name search to surface deleted employees.\n\n' +
        'The search is paginated like the regular list. The same PagedEmployeeResponse type is returned. This consistency means the front-end can use the same UI code for both the list view and the search results view.',
      concepts: [
        {
          term: 'SQL LIKE with wildcards',
          explanation:
            'LIKE is a SQL operator for pattern matching. The % character matches any sequence of characters. So LIKE \'%joh%\' matches any string containing "joh" anywhere — "John", "Johnson", "Johanna". LIKE \'joh%\' would only match strings starting with "joh". In JPA, you build LIKE predicates with cb.like(expression, pattern).',
        },
        {
          term: 'Case-insensitive search',
          explanation:
            'Databases store text with case preserved — "John" and "john" are different strings. To match regardless of case, you convert both sides to lowercase before comparing: LOWER(first_name) LIKE \'%joh%\'. In JPA, cb.lower(root.get("firstName")) applies LOWER() to the column, and you also call query.toLowerCase() to lowercase the search pattern.',
        },
        {
          term: 'OR predicate with cb.or()',
          explanation:
            'cb.or(predicate1, predicate2) creates a predicate that is true if EITHER condition is true. For name search, you want: first_name LIKE pattern OR last_name LIKE pattern. cb.or(firstNamePredicate, lastNamePredicate) generates the SQL OR clause. Compare to cb.and(), which requires BOTH conditions to be true.',
        },
        {
          term: 'Blank query handling',
          explanation:
            'If the caller sends ?q= (empty string) or ?q=   (whitespace only), the search should return no results or behave like a normal list — not crash. The nameContains() Specification returns null when query is null or blank, which means "no filter." The service method checks for blank query before calling search, routing to the regular list() method instead.',
        },
      ],
      checklist: [
        'Open EmployeeSpecifications.java and add the static nameContains(String query) method shown in the example.',
        'The method should return null (no filter) when query is null or blank.',
        'For non-blank query: build the pattern string as "%" + query.toLowerCase() + "%".',
        'Build two LIKE predicates using cb.like(cb.lower(root.get("firstName")), pattern) and cb.like(cb.lower(root.get("lastName")), pattern).',
        'Return cb.or(firstNamePredicate, lastNamePredicate).',
        'Add the search(String query, Pageable pageable) method to EmployeeService — it combines nameContains() with hasStatus(ACTIVE).',
        'The search method maps results and returns PagedEmployeeResponse exactly like list() does.',
        'Commit with message: feat(S1-010): implement name search in EmployeeService',
      ],
      examples: [
        {
          lang: 'java',
          label: 'EmployeeSpecifications.java — add nameContains() Specification',
          code: `package com.timetracker.employee.repository;

import com.timetracker.employee.domain.Employee;
import com.timetracker.employee.domain.EmployeeStatus;
import org.springframework.data.jpa.domain.Specification;

public final class EmployeeSpecifications {

    private EmployeeSpecifications() {}

    // --- existing methods: withFilters, hasDepartment, hasRole, hasStatus ---

    // New: case-insensitive name search across firstName and lastName
    public static Specification<Employee> nameContains(String query) {
        return (root, q, cb) -> {
            // If no query provided (null or blank), return null = "no filter"
            // query.isBlank() returns true for "", " ", "\t", etc.
            if (query == null || query.isBlank()) return null;

            // Build the SQL LIKE pattern: "%" at start and end means "matches anywhere"
            // toLowerCase() makes the search case-insensitive on the Java side
            String pattern = "%" + query.toLowerCase() + "%";

            // cb.lower(expression) applies the SQL LOWER() function to the column
            // cb.like(expression, pattern) generates: column LIKE ?
            // Combined: LOWER(first_name) LIKE '%joh%'
            var firstNamePredicate = cb.like(
                    cb.lower(root.get("firstName")), // LOWER(first_name)
                    pattern);                         // LIKE '%joh%'

            var lastNamePredicate = cb.like(
                    cb.lower(root.get("lastName")),  // LOWER(last_name)
                    pattern);                         // LIKE '%joh%'

            // cb.or() joins the two predicates with SQL OR:
            // LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ?
            return cb.or(firstNamePredicate, lastNamePredicate);
        };
    }
}`,
        },
        {
          lang: 'java',
          label: 'EmployeeService.java — search() method',
          code: `package com.timetracker.employee.service;

import com.timetracker.employee.domain.Employee;
import com.timetracker.employee.domain.EmployeeStatus;
import com.timetracker.employee.dto.PagedEmployeeResponse;
import com.timetracker.employee.dto.EmployeeResponse;
import com.timetracker.employee.repository.EmployeeSpecifications;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmployeeService {

    // ... other methods: create, getById, list, update, delete ...

    public PagedEmployeeResponse search(String query, Pageable pageable) {
        // Build a specification that combines:
        // 1. nameContains: LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ?
        // 2. hasStatus(ACTIVE): status = 'ACTIVE'
        // Both must be true (AND), so we combine with .and()
        Specification<Employee> spec = Specification
                .where(EmployeeSpecifications.nameContains(query)) // name filter
                .and(EmployeeSpecifications.hasStatus(EmployeeStatus.ACTIVE)); // only active

        // Same query, map, and return pattern as the list() method
        Page<Employee> page = repository.findAll(spec, pageable);

        List<EmployeeResponse> content = page.getContent()
                .stream()
                .map(mapper::toResponse)
                .toList();

        return new PagedEmployeeResponse(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }
}`,
        },
        {
          lang: 'sql',
          label: 'What SQL gets generated for search',
          code: `-- search(query="joh", pageable=page0,size20,sort=lastName)
-- Spring generates:

SELECT *
FROM employee
WHERE (LOWER(first_name) LIKE '%joh%'
    OR LOWER(last_name) LIKE '%joh%')
  AND status = 'ACTIVE'
ORDER BY last_name ASC
LIMIT 20 OFFSET 0;

-- Matches: "John Smith", "Mary Johnson", "Johanna Brown", "sam JOHNS" (case-insensitive)
-- Does NOT match: "INACTIVE John" (filtered by status = 'ACTIVE')`,
        },
      ],
      links: [
        { label: 'JPA CriteriaBuilder — cb.like()', url: 'https://jakarta.ee/specifications/persistence/3.1/apidocs/jakarta.persistence/jakarta/persistence/criteria/criteriabuilder#like(jakarta.persistence.criteria.Expression,java.lang.String)' },
        { label: 'SQL LIKE operator — W3Schools', url: 'https://www.w3schools.com/sql/sql_like.asp' },
        { label: 'Spring Data JPA — Specifications', url: 'https://docs.spring.io/spring-data/jpa/reference/jpa/specifications.html' },
      ],
    },
    {
      id: 'T-010-02',
      title: 'Controller — GET /api/v1/employees?q=',
      description:
        'How do you integrate search into the existing list endpoint?\n\n' +
        'Rather than creating a new endpoint like GET /api/v1/employees/search, you extend the existing GET /api/v1/employees endpoint with an optional ?q= parameter. This is cleaner from a REST design perspective: "list employees, optionally filtered by name" is still a list operation. A separate /search endpoint would be redundant.\n\n' +
        'The controller method already handles department, role, status, and pageable. You add one more parameter: @RequestParam(required = false) String q. Then you add a simple if-else at the top of the method body: if q is non-blank, delegate to service.search(); otherwise, delegate to service.list() as before.\n\n' +
        'This if-else is a rare case of minimal logic in the controller. It is acceptable here because it is routing logic (deciding which service method to call) rather than business logic (validating data, applying rules). The alternative — having service.list() detect a query and branch internally — would be less clear.\n\n' +
        'The response type is the same for both paths: ResponseEntity<PagedEmployeeResponse>. This means the caller gets the same JSON structure whether they are browsing the full list or searching by name. Consistency in response shape is a hallmark of well-designed APIs.',
      concepts: [
        {
          term: 'Extending an endpoint with an optional parameter',
          explanation:
            'Adding a new optional query parameter to an existing endpoint is a backward-compatible change. Existing callers who do not send ?q= continue to get the same behavior. New callers can use ?q= to search. This is preferred over creating a new /search endpoint because it keeps the API surface small and consistent.',
        },
        {
          term: 'Routing logic vs business logic in controllers',
          explanation:
            'Business logic belongs in the service layer (validation, rules, calculations). Routing logic — deciding which code path to take based on the presence of a parameter — is acceptable in the controller when it is a single, simple decision. The if (q != null && !q.isBlank()) branch here is routing logic: it decides whether to call search() or list(). No calculation or validation is involved.',
        },
        {
          term: 'String.isBlank()',
          explanation:
            'isBlank() returns true if the string is empty ("") or contains only whitespace (" ", "\\t", "\\n"). This is better than isEmpty() for user input, because a user might accidentally send ?q=   (spaces). isBlank() catches both cases. It was introduced in Java 11 and is the modern way to check for "no meaningful content."',
        },
      ],
      checklist: [
        'Open EmployeeController.java and add String q as a new @RequestParam(required = false) parameter to the existing list() method.',
        'At the start of the method body, add: if (q != null && !q.isBlank()) { return ResponseEntity.ok(service.search(q, pageable)); }',
        'The existing service.list(...) call remains for the non-search path.',
        'Test: GET /api/v1/employees?q=joh — should return employees matching "joh" in their name.',
        'Test: GET /api/v1/employees?q= (empty) — should behave like the regular list, not throw.',
        'Test: GET /api/v1/employees?q=xyz&page=0&size=5 — search with pagination.',
        'Test: GET /api/v1/employees?department=Engineering — regular filter should still work unchanged.',
        'Commit with message: feat(S1-010): add ?q= search parameter to list endpoint',
      ],
      examples: [
        {
          lang: 'java',
          label: 'EmployeeController.java — list endpoint with search parameter',
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

    // POST, GET/{id}, PATCH/{id}, DELETE/{id} from earlier stories ...

    @GetMapping
    public ResponseEntity<PagedEmployeeResponse> list(
            @RequestParam(required = false) String q,              // NEW: ?q=search+term (optional)
            @RequestParam(required = false) String department,     // ?department=Engineering (optional)
            @RequestParam(required = false) String role,           // ?role=Developer (optional)
            @RequestParam(required = false) EmployeeStatus status, // ?status=ACTIVE (optional)
            @PageableDefault(size = 20, sort = "lastName")
            Pageable pageable) {

        // Routing logic: if a search query is provided, use the search path
        if (q != null && !q.isBlank()) {
            // Search by name (case-insensitive, active employees only)
            // Note: department/role/status filters are ignored when searching by name
            return ResponseEntity.ok(service.search(q, pageable));
        }

        // No search query — use the regular paginated list with filters
        return ResponseEntity.ok(service.list(department, role, status, pageable));
    }
}`,
        },
        {
          lang: 'bash',
          label: 'Test search and list endpoints',
          code: `# Search by partial name — returns employees whose first or last name contains "joh"
curl -s "http://localhost:8080/api/v1/employees?q=joh" | jq .

# Search with pagination — first 5 results
curl -s "http://localhost:8080/api/v1/employees?q=smith&size=5" | jq .

# Empty q — behaves like regular list (q.isBlank() is true)
curl -s "http://localhost:8080/api/v1/employees?q=" | jq .

# Regular department filter — unaffected by the new q parameter
curl -s "http://localhost:8080/api/v1/employees?department=Engineering" | jq .

# Both q and department provided — q wins (search branch executes, department is ignored)
# (This is a design decision — you could also throw a 400 for ambiguous input)
curl -s "http://localhost:8080/api/v1/employees?q=jane&department=Engineering" | jq .`,
        },
      ],
      links: [
        { label: 'Spring MVC — @RequestParam', url: 'https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/requestparam.html' },
        { label: 'Java String — isBlank()', url: 'https://docs.oracle.com/en/java/docs/api/java.base/java/lang/String.html#isBlank()' },
        { label: 'REST API design guidelines — Google', url: 'https://google.aip.dev/132' },
      ],
    },
    {
      id: 'T-010-03',
      title: 'Unit Tests — Search',
      description:
        'What should you test for the search operation?\n\n' +
        'The search() service method is structurally similar to list(), so the tests are also similar. You need to verify: (1) that search returns a paged response when results are found, (2) that an empty query is handled gracefully, and (3) that the repository is called with a Specification when a valid query is provided.\n\n' +
        'You do not need to test that the SQL LIKE clause is correct — that is SQL behavior, not your application logic. What you test is that the service method calls the repository when it should, maps results when they are returned, and builds the response correctly.\n\n' +
        'For the controller, you can add a brief test to verify that the ?q= routing works: when q is non-blank, service.search() is called; when q is null or blank, service.list() is called. You would do this with a @WebMvcTest controller test that mocks the service. However, these controller routing tests are optional at this stage — the service tests provide most of the value.\n\n' +
        'A useful addition is testing the nameContains() Specification directly. You can call EmployeeSpecifications.nameContains(query) with various inputs and verify: null input returns null, blank input returns null, valid input returns a non-null Specification. This tests the utility class in isolation without needing a mock repository.',
      concepts: [
        {
          term: '@WebMvcTest',
          explanation:
            'A Spring Boot test annotation that loads only the web layer — controllers, filters, and exception handlers — without starting a full application context or database. It is faster than @SpringBootTest for testing controller routing and HTTP behavior. You mock the service layer with @MockBean. This is the right tool for testing that ?q= routes to service.search() vs service.list().',
        },
        {
          term: 'Testing a Specification directly',
          explanation:
            'You can unit-test a Specification class by calling its factory method and checking whether the return value is null (no filter) or non-null (filter present). This does not test the SQL it generates, but it tests the null-safety guard: EmployeeSpecifications.nameContains(null) should return null, EmployeeSpecifications.nameContains("") should return null, EmployeeSpecifications.nameContains("joh") should return a non-null Specification.',
        },
        {
          term: '@MockBean',
          explanation:
            'In a @WebMvcTest, you cannot use @Mock (Mockito) to mock the service because Spring MVC needs to inject the service into the controller as a Spring bean. @MockBean creates a Mockito mock AND registers it as a Spring bean in the test context. This makes it available for the controller\'s constructor injection.',
        },
      ],
      checklist: [
        'In EmployeeServiceTest.java, add the search_returnsResults() test: stub repository.findAll() to return a PageImpl with one employee, call service.search("joh", pageable), assert content is not empty.',
        'Add the search_emptyResults() test: stub repository to return an empty PageImpl, call service.search("nomatch", pageable), assert content is empty.',
        'Optionally add EmployeeSpecificationsTest.java with tests for nameContains(null), nameContains(""), and nameContains("joh") to verify null safety.',
        'Run all tests: ./mvnw.cmd test -Dtest=EmployeeServiceTest',
        'All tests green. Commit with message: test(S1-010): unit tests for search employees',
      ],
      examples: [
        {
          lang: 'java',
          label: 'EmployeeServiceTest.java — search() tests',
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

    // ... tests from previous stories ...

    @Test
    @DisplayName("search returns matching employees for a valid query")
    void search_returnsResults() {
        // ARRANGE
        Employee employee = new Employee();
        EmployeeResponse employeeResponse = new EmployeeResponse(
                UUID.randomUUID(), "John", "Doe", "john@example.com",
                "Engineering", "Developer", LocalDate.of(2024, 1, 1),
                null, EmployeeStatus.ACTIVE, 0L, Instant.now(), Instant.now());

        Pageable pageable = PageRequest.of(0, 20, Sort.by("lastName"));
        // Simulate one matching employee returned by the database
        Page<Employee> mockPage = new PageImpl<>(List.of(employee), pageable, 1L);

        // Stub: any Specification + any Pageable → return the mock page
        when(repository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(mockPage);
        when(mapper.toResponse(employee)).thenReturn(employeeResponse);

        // ACT
        PagedEmployeeResponse result = service.search("joh", pageable);

        // ASSERT
        assertThat(result.content()).hasSize(1);
        assertThat(result.content().get(0).firstName()).isEqualTo("John");
        assertThat(result.totalElements()).isEqualTo(1L);
    }

    @Test
    @DisplayName("search returns empty response when no employees match the query")
    void search_noResults() {
        // ARRANGE: no employees match "xyzzy"
        Pageable pageable = PageRequest.of(0, 20);
        Page<Employee> emptyPage = new PageImpl<>(List.of(), pageable, 0L);
        when(repository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(emptyPage);

        // ACT
        PagedEmployeeResponse result = service.search("xyzzy", pageable);

        // ASSERT
        assertThat(result.content()).isEmpty();
        assertThat(result.totalElements()).isEqualTo(0L);
    }
}`,
        },
        {
          lang: 'java',
          label: 'EmployeeSpecificationsTest.java — test nameContains() null safety',
          code: `package com.timetracker.employee.repository;

import com.timetracker.employee.domain.Employee;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.domain.Specification;

import static org.assertj.core.api.Assertions.assertThat;

// This is a pure unit test — no Spring context, no database, no mocks needed.
// We are just testing the factory methods return the right things.
class EmployeeSpecificationsTest {

    @Test
    @DisplayName("nameContains returns null for null query (no filter)")
    void nameContains_nullQuery_returnsNull() {
        // When query is null, the specification should return null (= no filter)
        Specification<Employee> spec = EmployeeSpecifications.nameContains(null);

        // We call toPredicate() to trigger the lambda body.
        // All three args are null — only the null/blank check runs before returning null.
        var predicate = spec.toPredicate(null, null, null);

        assertThat(predicate).isNull(); // null predicate = no filter applied
    }

    @Test
    @DisplayName("nameContains returns null for blank query (no filter)")
    void nameContains_blankQuery_returnsNull() {
        Specification<Employee> spec = EmployeeSpecifications.nameContains("   ");
        var predicate = spec.toPredicate(null, null, null);
        assertThat(predicate).isNull();
    }

    // Note: testing that nameContains("joh") returns a non-null predicate requires a real
    // JPA Root, CriteriaQuery, and CriteriaBuilder — those need a JPA context to create.
    // That test belongs in an integration test (using @DataJpaTest), not a unit test.
    // For now, testing the null safety guards is sufficient at the unit level.
}`,
        },
        {
          lang: 'bash',
          label: 'Full test suite for Stage 1 so far',
          code: `# Run all tests in employee-service
JAVA_HOME="C:/Program Files/Eclipse Adoptium/jdk-25.0.2.10-hotspot" \\
  ./mvnw.cmd test -pl employee-service

# You should see something like:
# [INFO] Tests run: 12, Failures: 0, Errors: 0, Skipped: 0
#
# The test count will vary depending on exactly which tests you wrote.
# Green is all that matters.`,
        },
      ],
      links: [
        { label: 'Spring Boot — @WebMvcTest', url: 'https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html#testing.spring-boot-applications.spring-mvc-tests' },
        { label: 'Mockito — @MockBean', url: 'https://docs.spring.io/spring-boot/reference/testing/utilities.html#testing.utilities.mocks' },
        { label: 'JUnit 5 — Writing Tests', url: 'https://junit.org/junit5/docs/current/user-guide/#writing-tests' },
        { label: 'AssertJ — Basic assertions', url: 'https://assertj.github.io/doc/#assertj-core-basic-assertions' },
      ],
    },
  ],
};
