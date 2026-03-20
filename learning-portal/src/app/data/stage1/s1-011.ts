import { Story } from '../../models/step.model';

export const S1_011: Story = {
  id: 'S1-011',
  title: 'S1-011 — Org Chart',
  tasks: [
    {
      id: 'T-011-01',
      title: 'Service — Direct Reports',
      description:
        'What is "direct reports"? In most companies, a manager has a set of employees who report directly to them. ' +
        '"Direct reports" means the immediate subordinates — the people one level below in the hierarchy. ' +
        'This method answers the question: "Who reports to this manager?"\n\n' +
        'To implement this, we already have everything we need. The Employee entity has a manager field (a self-referencing foreign key), ' +
        'and we added findByManagerId() to the repository in Story S1-004. Spring Data JPA derived that query automatically from the method name — ' +
        'it translates to: SELECT * FROM employee WHERE manager_id = ?. All we do in the service is call it and convert the results to response DTOs.\n\n' +
        'The one extra step is existence checking. Before looking up reports, we verify the manager ID actually belongs to an employee. ' +
        'If it does not, we throw EmployeeNotFoundException immediately. This gives the caller a clear 404 instead of an empty list, ' +
        'which would be ambiguous — an empty list could mean "no reports" or "manager does not exist."\n\n' +
        'This method is a pure read — it does not change any data, and there are no complex business rules. ' +
        'The service layer here is thin on purpose: it validates the ID, delegates to the repository, and maps the results.',
      concepts: [
        {
          term: 'Direct Reports',
          explanation:
            'The employees who are immediately managed by a specific person — one level down in the hierarchy. ' +
            'If Alice manages Bob and Carol, then Bob and Carol are Alice\'s direct reports. ' +
            'This is different from the full reporting chain, which includes everyone below in all levels.',
        },
        {
          term: 'Self-Referencing Relationship',
          explanation:
            'A database relationship where a table references itself. The employee table has a manager_id column that points to another row in the same table. ' +
            'In JPA, this is mapped as @ManyToOne on the manager field and @OneToMany on directReports. ' +
            'One manager can have many direct reports; each employee has at most one direct manager.',
        },
        {
          term: 'existsById()',
          explanation:
            'A JpaRepository method that runs SELECT EXISTS(SELECT 1 FROM employee WHERE id = ?). ' +
            'It is cheaper than findById() because it does not load the entire entity — it only checks whether a row exists. ' +
            'Use it when you only need to verify presence, not retrieve data.',
        },
        {
          term: 'stream().map().toList()',
          explanation:
            'A Java Stream pipeline for transforming a collection. stream() opens a stream over the list, ' +
            'map() applies a function to every element (here: mapper::toResponse converts each Employee to EmployeeResponse), ' +
            'and toList() collects the results into an unmodifiable list. ' +
            'This replaces a verbose for-loop and is idiomatic modern Java.',
        },
      ],
      checklist: [
        'Open EmployeeService.java and add a new public method: public List<EmployeeResponse> getDirectReports(UUID managerId)',
        'Inside the method, call repository.existsById(managerId). If it returns false, throw new EmployeeNotFoundException(managerId)',
        'Call repository.findByManagerId(managerId) to get the List<Employee>',
        'Use .stream().map(mapper::toResponse).toList() to convert the list to List<EmployeeResponse>',
        'Return the mapped list',
        'Add the import for List (java.util.List) if not already present',
        'Commit: feat(S1-011): add getDirectReports to employee service',
      ],
      examples: [
        {
          lang: 'java',
          label: 'EmployeeService.java — getDirectReports()',
          code: `package com.timetracker.employee;

import com.timetracker.employee.dto.EmployeeResponse;
import com.timetracker.employee.exception.EmployeeNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class EmployeeService {

    // ... existing fields and methods ...

    // @Transactional(readOnly = true) tells Hibernate this is a read-only operation.
    // It allows optimizations: no dirty-checking (Hibernate won't compare entity state
    // to detect changes), and some databases use read replicas for these queries.
    @Transactional(readOnly = true)
    public List<EmployeeResponse> getDirectReports(UUID managerId) {

        // Step 1: confirm the manager exists.
        // We use existsById() rather than findById() because we don't need the entity here —
        // we just need to know if it's real. Cheaper query: SELECT EXISTS(SELECT 1 FROM employee WHERE id = ?)
        if (!repository.existsById(managerId)) {
            throw new EmployeeNotFoundException(managerId);
            // This will be caught by GlobalExceptionHandler and returned as 404 Not Found
        }

        // Step 2: fetch all employees whose manager_id = managerId.
        // findByManagerId() was declared in EmployeeRepository — Spring Data JPA
        // derives the SQL automatically from the method name.
        // SQL: SELECT * FROM employee WHERE manager_id = ?
        return repository.findByManagerId(managerId)
                .stream()
                // mapper::toResponse is a method reference. It means:
                // for each Employee e, call mapper.toResponse(e)
                .map(mapper::toResponse)
                // toList() collects the Stream into an unmodifiable List<EmployeeResponse>
                .toList();
    }
}`,
        },
      ],
      links: [
        {
          label: 'Spring Data JPA — Derived Query Methods',
          url: 'https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html',
        },
        {
          label: 'Java Streams — map and collect',
          url: 'https://docs.oracle.com/en/java/docs/api/java.base/java/util/stream/Stream.html',
        },
      ],
    },
    {
      id: 'T-011-02',
      title: 'Service — Reporting Chain',
      description:
        'What is a "reporting chain"? It is the path from a specific employee up through all their managers to the top of the company ' +
        '(the CEO or founder — whoever has no manager). If Bob reports to Alice, and Alice reports to Carol (the CEO), ' +
        'then Bob\'s reporting chain is: [Bob, Alice, Carol].\n\n' +
        'We implement this with an iterative loop — starting at the employee, then following the manager reference upward, ' +
        'step by step, until we reach someone with no manager (manager is null). Each person we visit gets added to the chain list.\n\n' +
        'There is an important subtlety: LAZY loading. The Employee entity\'s manager field is annotated @ManyToOne(fetch = FetchType.LAZY). ' +
        'This means Hibernate does NOT load the manager when it loads the employee — it only loads it the first time you call getManager(). ' +
        'So in our loop, each call to current.getManager() triggers a separate database query. ' +
        'For a typical reporting chain of 4-6 levels, this is fine. For deeper hierarchies, a recursive CTE query would be more efficient, ' +
        'but that is an advanced optimization not needed here.\n\n' +
        'The Set<UUID> visited guard protects against infinite loops in case of corrupted data (e.g., A\'s manager is B and B\'s manager is A). ' +
        'In theory, the database foreign key constraint prevents cycles, but defensive programming here costs nothing and prevents a potential infinite loop.',
      concepts: [
        {
          term: 'Reporting Chain (Management Hierarchy)',
          explanation:
            'The ordered list of a person\'s manager, their manager\'s manager, and so on up to the top. ' +
            'It starts with the employee themselves and ends at the root person — whoever has no manager. ' +
            'This is useful for org charts, access control ("is this person in the same chain?"), and notifications.',
        },
        {
          term: 'LAZY Loading',
          explanation:
            'A Hibernate strategy where related entities are not fetched from the database until you actually access them. ' +
            'With @ManyToOne(fetch = FetchType.LAZY), the manager field starts as a proxy object. ' +
            'The first time you call getManager(), Hibernate fires a query to fetch the actual manager row. ' +
            'This is why the while loop works: each iteration loads the next level on demand.',
        },
        {
          term: 'Cycle Guard (visited Set)',
          explanation:
            'A Set<UUID> that tracks which employee IDs we have already seen. ' +
            'Set.add() returns true if the element was new, and false if it was already in the set. ' +
            'The condition visited.add(current.getId()) adds the current ID and continues only if it was new. ' +
            'If we ever see an ID we already visited, the loop stops — preventing an infinite loop from circular manager references.',
        },
        {
          term: 'orElseThrow()',
          explanation:
            'A method on Optional<T> that either returns the value inside the Optional, or throws an exception if the Optional is empty. ' +
            'repository.findById() returns Optional<Employee> — it might find nothing. ' +
            'orElseThrow(() -> new EmployeeNotFoundException(id)) means: "give me the employee, or throw this exception." ' +
            'The lambda () -> new EmployeeNotFoundException(id) is only called if the Optional is empty.',
        },
      ],
      checklist: [
        'Open EmployeeService.java and add: public List<EmployeeResponse> getReportingChain(UUID employeeId)',
        'Inside the method, declare: List<EmployeeResponse> chain = new ArrayList<>() — this will hold the result',
        'Declare: Set<UUID> visited = new HashSet<>() — this is the cycle guard',
        'Load the starting employee: Employee current = repository.findById(employeeId).orElseThrow(() -> new EmployeeNotFoundException(employeeId))',
        'Write the while loop: while (current != null && visited.add(current.getId()))',
        'Inside the loop: add mapper.toResponse(current) to chain, then set current = current.getManager()',
        'After the loop, return chain',
        'Add imports for ArrayList, HashSet, Set (java.util package)',
        'Commit: feat(S1-011): add getReportingChain to employee service',
      ],
      examples: [
        {
          lang: 'java',
          label: 'EmployeeService.java — getReportingChain()',
          code: `package com.timetracker.employee;

import com.timetracker.employee.dto.EmployeeResponse;
import com.timetracker.employee.exception.EmployeeNotFoundException;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

// Inside EmployeeService:

@Transactional(readOnly = true)
public List<EmployeeResponse> getReportingChain(UUID employeeId) {

    // The result list — we build it bottom-up (employee first, CEO last)
    List<EmployeeResponse> chain = new ArrayList<>();

    // Cycle guard: tracks IDs we have already visited.
    // Set.add() returns false if the element was already present,
    // which would indicate a cycle in the manager hierarchy.
    Set<UUID> visited = new HashSet<>();

    // Load the starting employee. findById() returns Optional<Employee>.
    // orElseThrow() unwraps it, or throws EmployeeNotFoundException if not found.
    // This gives us our 404 when the caller passes an unknown ID.
    Employee current = repository.findById(employeeId)
            .orElseThrow(() -> new EmployeeNotFoundException(employeeId));

    // Walk up the manager chain one level at a time.
    // Loop continues while:
    //   1. current != null  — we haven't reached someone with no manager (the CEO)
    //   2. visited.add(current.getId()) returns true  — we haven't seen this person before
    while (current != null && visited.add(current.getId())) {

        // Add this person to the chain (employee first, then their manager, etc.)
        chain.add(mapper.toResponse(current));

        // Move up one level. Because manager is LAZY-loaded, this line triggers
        // a SELECT FROM employee WHERE id = manager_id query in the database.
        // For a 5-level chain, this causes 5 separate queries (N+1 pattern).
        // Acceptable for shallow org charts; a CTE query would be faster for deep hierarchies.
        current = current.getManager();
        // When we reach the CEO (no manager), getManager() returns null.
        // The while condition current != null then terminates the loop.
    }

    // Result: [employee, their manager, grandmanager, ..., CEO]
    // The list starts with the original employee and ends at the root.
    return chain;
}`,
        },
        {
          lang: 'java',
          label: 'Visualizing the loop — who is loaded at each step',
          code: `// Example org structure:
// CEO (no manager)
//   └── Alice (manager = CEO)
//         └── Bob (manager = Alice)

// Call: getReportingChain(Bob.id)

// Iteration 1: current = Bob
//   visited = {Bob.id}, chain = [BobResponse]
//   current = Bob.getManager()  →  triggers SQL: SELECT * FROM employee WHERE id = alice_id
//   current is now Alice

// Iteration 2: current = Alice
//   visited = {Bob.id, Alice.id}, chain = [BobResponse, AliceResponse]
//   current = Alice.getManager()  →  triggers SQL: SELECT * FROM employee WHERE id = ceo_id
//   current is now CEO

// Iteration 3: current = CEO
//   visited = {Bob.id, Alice.id, CEO.id}, chain = [Bob, Alice, CEO]
//   current = CEO.getManager()  →  returns null (CEO has no manager)
//   current is now null

// Loop exits: current == null
// Return [BobResponse, AliceResponse, CEOResponse]`,
        },
      ],
      links: [
        {
          label: 'Hibernate — LAZY vs EAGER fetching',
          url: 'https://docs.jboss.org/hibernate/orm/6.4/userguide/html_single/Hibernate_User_Guide.html#fetching',
        },
        {
          label: 'Java Optional — orElseThrow()',
          url: 'https://docs.oracle.com/en/java/docs/api/java.base/java/util/Optional.html#orElseThrow(java.util.function.Supplier)',
        },
      ],
    },
    {
      id: 'T-011-03',
      title: 'Controller — Org Chart Endpoints',
      description:
        'What are these endpoints? We expose the two org chart service methods as HTTP endpoints. ' +
        'Both are sub-resources on an employee — they are accessed via /api/v1/employees/{id}/reports ' +
        'and /api/v1/employees/{id}/chain. The {id} path variable identifies which employee we are querying about.\n\n' +
        'In REST design, sub-resource URLs like /{id}/reports are the correct way to model "things that belong to a resource." ' +
        'The reports and chain are properties of a specific employee, so they live under that employee\'s URL. ' +
        'This is more readable and consistent than having separate top-level endpoints.\n\n' +
        'Both methods are GET requests with no request body — they are read-only queries. ' +
        'The {id} is parsed by Spring from the URL path and passed to the method via @PathVariable. ' +
        'Spring automatically converts the String in the URL to a UUID object. If the path variable is not a valid UUID format, ' +
        'Spring throws MethodArgumentTypeMismatchException, which our GlobalExceptionHandler converts to a 400 Bad Request.\n\n' +
        'Both handlers delegate entirely to the service and wrap the result in ResponseEntity.ok(), ' +
        'which sets the HTTP status to 200 OK. Error cases (unknown ID) are handled by EmployeeNotFoundException ' +
        'bubbling up to the global handler.',
      concepts: [
        {
          term: 'Sub-resource URL',
          explanation:
            'A URL path that represents a resource owned by another resource. ' +
            '/employees/{id}/reports means "the reports belonging to employee {id}." ' +
            'This is standard REST design — related data lives under the parent resource\'s path. ' +
            'It makes the API intuitive: you know just from the URL that reports are associated with a specific employee.',
        },
        {
          term: '@PathVariable',
          explanation:
            'A Spring annotation that extracts a value from the URL path and injects it as a method parameter. ' +
            'In @GetMapping("/{id}/reports"), the {id} placeholder is matched to the @PathVariable UUID id parameter. ' +
            'Spring automatically converts the String "abc-123..." to a UUID object. ' +
            'If conversion fails (the string is not a valid UUID), Spring throws an exception that the global handler maps to 400.',
        },
        {
          term: 'ResponseEntity.ok()',
          explanation:
            'A factory method that creates an HTTP 200 OK response with a body. ' +
            'ResponseEntity is Spring\'s way of representing a full HTTP response — status code, headers, and body together. ' +
            'ResponseEntity.ok(body) is shorthand for ResponseEntity.status(200).body(body). ' +
            'When your method returns ResponseEntity<T>, Spring serializes T to JSON and sets it as the response body.',
        },
      ],
      checklist: [
        'Open EmployeeController.java',
        'Add a new method: public ResponseEntity<List<EmployeeResponse>> directReports(@PathVariable UUID id)',
        'Annotate it with @GetMapping("/{id}/reports")',
        'Inside the method, return ResponseEntity.ok(service.getDirectReports(id))',
        'Add a second method: public ResponseEntity<List<EmployeeResponse>> reportingChain(@PathVariable UUID id)',
        'Annotate it with @GetMapping("/{id}/chain")',
        'Inside the method, return ResponseEntity.ok(service.getReportingChain(id))',
        'Add the import for List (java.util.List) if not already present',
        'Start the application and test with curl: GET /api/v1/employees/{id}/reports and GET /api/v1/employees/{id}/chain',
        'Verify that an unknown ID returns 404 and a non-UUID path returns 400',
        'Commit: feat(S1-011): add org chart endpoints',
      ],
      examples: [
        {
          lang: 'java',
          label: 'EmployeeController.java — org chart endpoints',
          code: `package com.timetracker.employee;

import com.timetracker.employee.dto.EmployeeResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/employees")  // base path for all employee endpoints
public class EmployeeController {

    // ... existing fields and methods (create, get, list, update, delete) ...

    // GET /api/v1/employees/{id}/reports
    // Returns all employees whose manager is the employee with the given ID.
    // 200 OK with empty list → manager exists but has no direct reports
    // 404 Not Found → no employee with this ID exists
    @GetMapping("/{id}/reports")
    public ResponseEntity<List<EmployeeResponse>> directReports(
            @PathVariable UUID id) {  // Spring converts URL "/{id}" String to UUID automatically
        return ResponseEntity.ok(service.getDirectReports(id));
    }

    // GET /api/v1/employees/{id}/chain
    // Returns the full management chain from the employee up to the CEO.
    // The first item in the list is always the employee themselves.
    // The last item is the root employee (no manager — typically the CEO).
    // 200 OK with list of size 1 → employee has no manager (they ARE the root)
    // 404 Not Found → no employee with this ID exists
    @GetMapping("/{id}/chain")
    public ResponseEntity<List<EmployeeResponse>> reportingChain(
            @PathVariable UUID id) {
        return ResponseEntity.ok(service.getReportingChain(id));
    }
}`,
        },
        {
          lang: 'bash',
          label: 'Manual test with curl',
          code: `# Assume we have seeded data: CEO → Alice → Bob

# Get Bob's direct reports (empty — Bob has no reports)
curl -s http://localhost:8080/api/v1/employees/{bob-id}/reports | jq .

# Get Alice's direct reports (returns Bob)
curl -s http://localhost:8080/api/v1/employees/{alice-id}/reports | jq .[].email

# Get Bob's full reporting chain: [Bob, Alice, CEO]
curl -s http://localhost:8080/api/v1/employees/{bob-id}/chain | jq .[].email

# Unknown ID → 404
curl -s http://localhost:8080/api/v1/employees/00000000-0000-0000-0000-000000000000/chain | jq .

# Non-UUID path → 400
curl -s http://localhost:8080/api/v1/employees/not-a-uuid/chain | jq .status`,
        },
      ],
      links: [
        {
          label: 'Spring MVC — @GetMapping and @PathVariable',
          url: 'https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-requestmapping.html',
        },
        {
          label: 'REST API Design — Sub-resources',
          url: 'https://restfulapi.net/resource-naming/',
        },
      ],
    },
    {
      id: 'T-011-04',
      title: 'Unit Tests — Org Chart',
      description:
        'What are we testing here? We test the service layer in isolation — no Spring context, no database, no HTTP. ' +
        'We replace the repository and mapper with Mockito mocks: objects that pretend to be the real thing, ' +
        'but we control exactly what they return. This lets us test just the logic in EmployeeService.\n\n' +
        'For getDirectReports(), we test two cases: the happy path (manager exists, returns subordinates) ' +
        'and the error path (manager not found, throws exception). These two cases cover all branches in the method.\n\n' +
        'For getReportingChain(), the interesting cases are: (1) a full chain of 3 — employee with a manager with another manager, ' +
        'and (2) the root employee case — an employee with no manager, whose chain is just themselves (size 1). ' +
        'The root case matters because it tests that the while loop terminates correctly when manager is null on the very first step.\n\n' +
        'The key technique in these tests is building "connected" Employee objects manually — setting the manager field on each one — ' +
        'so that when the service calls current.getManager() in the loop, it finds the next level without hitting a database.',
      concepts: [
        {
          term: 'Mockito Mock',
          explanation:
            'A mock is a fake object that stands in for a real dependency during tests. ' +
            'when(repository.findById(someId)).thenReturn(Optional.of(employee)) tells the mock: ' +
            '"when someone calls findById() with someId, return this Optional." ' +
            'The mock records calls and returns whatever you tell it to — no database needed.',
        },
        {
          term: '@ExtendWith(MockitoExtension.class)',
          explanation:
            'A JUnit 5 extension that activates Mockito in the test class. ' +
            'With it, @Mock creates mock objects automatically, and @InjectMocks creates the class under test ' +
            'and injects the mocks into it. Without this extension, you would have to create mocks manually.',
        },
        {
          term: 'Building Connected Entities in Tests',
          explanation:
            'When testing getReportingChain(), the loop calls current.getManager() to walk up the hierarchy. ' +
            'In unit tests, there is no database, so we manually set manager references: employee.setManager(manager), manager.setManager(ceo). ' +
            'This gives the service real in-memory objects to navigate without any database queries.',
        },
        {
          term: 'assertThat() from AssertJ',
          explanation:
            'AssertJ is a fluent assertion library included with Spring Boot Test. ' +
            'assertThat(list).hasSize(3) reads like English and gives descriptive failure messages. ' +
            'It is preferred over JUnit\'s assertEquals() because the error messages are much clearer when a test fails.',
        },
      ],
      checklist: [
        'Open (or create) EmployeeServiceTest.java in src/test/java/com/timetracker/employee/',
        'Annotate the class with @ExtendWith(MockitoExtension.class)',
        'Add @Mock EmployeeRepository repository and @Mock EmployeeMapper mapper fields',
        'Add @InjectMocks EmployeeService service field',
        'Write test: getDirectReports_returnsSubordinates — mock existsById() returning true, findByManagerId() returning one employee, mapper returning a response; assert list size is 1',
        'Write test: getDirectReports_throwsNotFound — mock existsById() returning false; assert assertThatThrownBy(() -> service.getDirectReports(id)).isInstanceOf(EmployeeNotFoundException.class)',
        'Write helper method: createEmployee(Employee manager) that creates an Employee, sets the manager field, and assigns a unique ID',
        'Write test: getReportingChain_returnsFullChain — build CEO → manager → employee chain; mock findById returning employee; assert chain size is 3',
        'Write test: getReportingChain_rootEmployee — build single employee with no manager; mock findById returning them; assert chain size is 1',
        'Commit: test(S1-011): unit tests for org chart service methods',
      ],
      examples: [
        {
          lang: 'java',
          label: 'EmployeeServiceTest.java — org chart tests',
          code: `package com.timetracker.employee;

import com.timetracker.employee.dto.EmployeeResponse;
import com.timetracker.employee.exception.EmployeeNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

// @ExtendWith(MockitoExtension.class) activates Mockito for this test class.
// It processes @Mock and @InjectMocks annotations automatically.
@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    // @Mock creates a fake EmployeeRepository. No database is used.
    @Mock
    private EmployeeRepository repository;

    // @Mock creates a fake EmployeeMapper.
    @Mock
    private EmployeeMapper mapper;

    // @InjectMocks creates EmployeeService and injects the two mocks above into it.
    // The service's constructor or fields receive the mock objects instead of real ones.
    @InjectMocks
    private EmployeeService service;

    // ---- getDirectReports tests ----

    @Test
    @DisplayName("getDirectReports returns list of subordinates when manager exists")
    void getDirectReports_returnsSubordinates() {
        UUID managerId = UUID.randomUUID();
        Employee report = createEmployee(null);  // one direct report
        EmployeeResponse reportResponse = buildResponse(report.getId());

        // Tell mock repository: existsById(managerId) → true
        when(repository.existsById(managerId)).thenReturn(true);
        // Tell mock repository: findByManagerId(managerId) → list of one employee
        when(repository.findByManagerId(managerId)).thenReturn(List.of(report));
        // Tell mock mapper: toResponse(report) → reportResponse
        when(mapper.toResponse(report)).thenReturn(reportResponse);

        List<EmployeeResponse> result = service.getDirectReports(managerId);

        // The returned list should have exactly one element
        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo(report.getId());
    }

    @Test
    @DisplayName("getDirectReports throws EmployeeNotFoundException for unknown manager")
    void getDirectReports_throwsNotFound() {
        UUID unknownId = UUID.randomUUID();
        // Tell mock repository: existsById(unknownId) → false (no such employee)
        when(repository.existsById(unknownId)).thenReturn(false);

        // assertThatThrownBy() verifies that calling the lambda throws an exception.
        // isInstanceOf() checks the exception type.
        assertThatThrownBy(() -> service.getDirectReports(unknownId))
                .isInstanceOf(EmployeeNotFoundException.class);
    }

    // ---- getReportingChain tests ----

    @Test
    @DisplayName("getReportingChain returns ordered chain from employee to root (size 3)")
    void getReportingChain_returnsFullChain() {
        // Build a 3-level hierarchy: CEO has no manager, manager reports to CEO, employee reports to manager.
        // We create them bottom-up: CEO first (needs no reference), then manager, then employee.
        Employee ceo = createEmployee(null);       // root — no manager
        Employee manager = createEmployee(ceo);    // manager's manager is CEO
        Employee employee = createEmployee(manager); // employee's manager is manager

        // The service calls findById() only once — to load the starting employee.
        // After that, it navigates via getManager() which just reads the in-memory field.
        when(repository.findById(employee.getId())).thenReturn(Optional.of(employee));

        // Provide mapper responses for each level
        when(mapper.toResponse(employee)).thenReturn(buildResponse(employee.getId()));
        when(mapper.toResponse(manager)).thenReturn(buildResponse(manager.getId()));
        when(mapper.toResponse(ceo)).thenReturn(buildResponse(ceo.getId()));

        List<EmployeeResponse> chain = service.getReportingChain(employee.getId());

        // Chain should be: [employee, manager, CEO] — 3 items
        assertThat(chain).hasSize(3);
        // First item is the employee themselves
        assertThat(chain.get(0).id()).isEqualTo(employee.getId());
        // Last item is the root (CEO)
        assertThat(chain.get(2).id()).isEqualTo(ceo.getId());
    }

    @Test
    @DisplayName("getReportingChain for root employee (no manager) returns list of size 1")
    void getReportingChain_rootEmployee() {
        // A root employee has no manager — they are at the top of the hierarchy.
        Employee ceo = createEmployee(null);  // manager = null

        when(repository.findById(ceo.getId())).thenReturn(Optional.of(ceo));
        when(mapper.toResponse(ceo)).thenReturn(buildResponse(ceo.getId()));

        List<EmployeeResponse> chain = service.getReportingChain(ceo.getId());

        // Only the CEO themselves — the loop stops after the first iteration because getManager() returns null
        assertThat(chain).hasSize(1);
    }

    // ---- helper methods ----

    // Creates an Employee with a random UUID and sets the manager reference.
    // By setting manager in-memory, the service's while loop can navigate
    // the chain without any database calls beyond the initial findById().
    private Employee createEmployee(Employee manager) {
        Employee e = new Employee();
        e.setId(UUID.randomUUID());
        e.setManager(manager);  // null for root employees
        return e;
    }

    // Creates a minimal EmployeeResponse for the given ID.
    // The mapper mock will return this when asked to convert an Employee.
    private EmployeeResponse buildResponse(UUID id) {
        return new EmployeeResponse(id, "First", "Last", "test@test.com",
                "Eng", "Dev", null, null, EmployeeStatus.ACTIVE,
                1L, null, null);
    }
}`,
        },
      ],
      links: [
        {
          label: 'Mockito — Getting Started',
          url: 'https://site.mockito.org/',
        },
        {
          label: 'AssertJ — Fluent Assertions',
          url: 'https://assertj.github.io/doc/',
        },
        {
          label: 'JUnit 5 — @ExtendWith',
          url: 'https://junit.org/junit5/docs/current/user-guide/#extensions',
        },
      ],
    },
  ],
};
