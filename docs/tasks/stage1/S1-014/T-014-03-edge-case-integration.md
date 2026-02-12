# T-014-03: Edge Case Integration Tests

| Field | Value |
|---|---|
| **Task ID** | T-014-03 |
| **Story** | [S1-014: Integration Tests](../../../stories/stage1/S1-014-integration-tests.md) |
| **Status** | Pending |

---

## Objective

Test business rule edge cases end-to-end to verify that validation, constraints, and error handling work correctly through the entire stack.

---

## Checklist

- [ ] Test: duplicate email returns 409 Conflict with error body
- [ ] Test: invalid `managerId` returns 422 with error body
- [ ] Test: delete manager with active reports returns 409
- [ ] Test: optimistic locking conflict returns 409
- [ ] Test: invalid UUID in path returns 400
- [ ] Test: search with query < 2 characters returns 400
- [ ] Test: org chart direct reports returns correct employees
- [ ] Test: org chart reporting chain returns correct hierarchy
- [ ] Verify error response body matches the standard contract for each case
- [ ] Commit: `test(S1-014): add edge case integration tests`

---

## Details

### Edge case test class

<details>
<summary>Expand for guidance</summary>

```java
package com.timetracker.employee;

import com.timetracker.employee.dto.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class EmployeeEdgeCaseIntegrationTest extends IntegrationTestBase {

    @Autowired private TestRestTemplate restTemplate;
    @Autowired private EmployeeRepository repository;

    @BeforeEach
    void cleanUp() {
        repository.deleteAll();
    }

    @Test
    @DisplayName("Duplicate email returns 409 Conflict")
    void duplicateEmail_returns409() {
        var request = createRequest("john@example.com");
        restTemplate.postForEntity("/api/v1/employees", request, EmployeeResponse.class);

        // Try to create another employee with the same email
        var duplicate = createRequest("john@example.com");
        var response = restTemplate.postForEntity(
            "/api/v1/employees", duplicate, ErrorResponse.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().status()).isEqualTo(409);
        assertThat(response.getBody().message()).contains("john@example.com");
    }

    @Test
    @DisplayName("Invalid managerId returns 422")
    void invalidManager_returns422() {
        var request = new CreateEmployeeRequest(
            "John", "Doe", "john@example.com",
            "Engineering", "Developer",
            LocalDate.of(2024, 1, 15),
            UUID.randomUUID() // non-existent manager
        );

        var response = restTemplate.postForEntity(
            "/api/v1/employees", request, ErrorResponse.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
    }

    @Test
    @DisplayName("Delete manager with active reports returns 409")
    void deleteManagerWithReports_returns409() {
        // Create manager
        var managerReq = createRequest("manager@example.com");
        var manager = restTemplate.postForEntity(
            "/api/v1/employees", managerReq, EmployeeResponse.class
        ).getBody();

        // Create report
        var reportReq = new CreateEmployeeRequest(
            "Report", "User", "report@example.com",
            "Engineering", "Developer",
            LocalDate.of(2024, 1, 15), manager.id()
        );
        restTemplate.postForEntity("/api/v1/employees", reportReq, EmployeeResponse.class);

        // Try to delete manager
        var response = restTemplate.exchange(
            "/api/v1/employees/" + manager.id(),
            HttpMethod.DELETE, null, ErrorResponse.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().message()).contains("active employee(s)");
    }

    @Test
    @DisplayName("Optimistic locking conflict returns 409")
    void optimisticLocking_returns409() {
        // Create employee
        var created = restTemplate.postForEntity(
            "/api/v1/employees", createRequest("lock@example.com"),
            EmployeeResponse.class
        ).getBody();

        // Update with correct version
        var update1 = new UpdateEmployeeRequest(
            "Updated", null, null, null, null, null, null, created.version()
        );
        restTemplate.exchange(
            "/api/v1/employees/" + created.id(),
            HttpMethod.PATCH, new HttpEntity<>(update1), EmployeeResponse.class
        );

        // Try update with stale version
        var update2 = new UpdateEmployeeRequest(
            "Stale", null, null, null, null, null, null, created.version() // old version!
        );
        var response = restTemplate.exchange(
            "/api/v1/employees/" + created.id(),
            HttpMethod.PATCH, new HttpEntity<>(update2), ErrorResponse.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("Invalid UUID returns 400 Bad Request")
    void invalidUuid_returns400() {
        var response = restTemplate.getForEntity(
            "/api/v1/employees/not-a-uuid", ErrorResponse.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Search with short query returns 400")
    void shortSearchQuery_returns400() {
        var response = restTemplate.getForEntity(
            "/api/v1/employees/search?q=j", ErrorResponse.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    private CreateEmployeeRequest createRequest(String email) {
        return new CreateEmployeeRequest(
            "Test", "User", email,
            "Engineering", "Developer",
            LocalDate.of(2024, 1, 15), null
        );
    }
}
```

Each test verifies:
1. The correct HTTP status code
2. The error response body matches the standard contract (status, error, message, timestamp, path)
3. The error message is meaningful and specific

</details>

---

## Development Log

| Date | Entry |
|---|---|
| — | *No entries yet* |

---

## References

- [PRD.md](../../../../docs/PRD.md) — Validation rules, API design
- [DESIGN.md](../../../../docs/DESIGN.md) — Section 6: Error contract
- [GUIDELINES.md](../../../../docs/GUIDELINES.md) — Section 7: Testing strategy
