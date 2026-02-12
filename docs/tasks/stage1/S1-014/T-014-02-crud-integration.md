# T-014-02: CRUD Integration Tests

| Field | Value |
|---|---|
| **Task ID** | T-014-02 |
| **Story** | [S1-014: Integration Tests](../../../stories/stage1/S1-014-integration-tests.md) |
| **Status** | Pending |

---

## Objective

Write end-to-end integration tests verifying all CRUD operations against a real PostgreSQL database through the full Spring stack.

---

## Checklist

- [ ] Create `EmployeeCrudIntegrationTest` extending `IntegrationTestBase`
- [ ] Test: POST creates employee and returns 201 with Location header
- [ ] Test: GET retrieves the created employee by ID
- [ ] Test: GET list returns paginated results with correct metadata
- [ ] Test: PATCH updates specific employee fields
- [ ] Test: DELETE soft-deletes employee (status → INACTIVE)
- [ ] Test: GET after delete still returns the employee (with INACTIVE status)
- [ ] Test: List after delete excludes the inactive employee by default
- [ ] Clean up between tests (`@BeforeEach` with repository delete or `@Sql`)
- [ ] Use `TestRestTemplate` or `WebTestClient` for HTTP calls
- [ ] Commit: `test(S1-014): add CRUD integration tests`

---

## Details

### Test class structure

<details>
<summary>Expand for guidance</summary>

```java
package com.timetracker.employee;

import com.timetracker.employee.dto.CreateEmployeeRequest;
import com.timetracker.employee.dto.EmployeeResponse;
import com.timetracker.employee.dto.UpdateEmployeeRequest;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class EmployeeCrudIntegrationTest extends IntegrationTestBase {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private EmployeeRepository repository;

    @BeforeEach
    void cleanUp() {
        repository.deleteAll();
    }

    @Test
    @DisplayName("POST /employees creates employee and returns 201")
    void createEmployee() {
        var request = new CreateEmployeeRequest(
            "John", "Doe", "john@example.com",
            "Engineering", "Developer",
            LocalDate.of(2024, 1, 15), null
        );

        ResponseEntity<EmployeeResponse> response = restTemplate.postForEntity(
            "/api/v1/employees", request, EmployeeResponse.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getHeaders().getLocation()).isNotNull();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().id()).isNotNull();
        assertThat(response.getBody().firstName()).isEqualTo("John");
        assertThat(response.getBody().status()).isEqualTo(EmployeeStatus.ACTIVE);
    }

    @Test
    @DisplayName("Full CRUD lifecycle works end-to-end")
    void crudLifecycle() {
        // Create
        var createReq = new CreateEmployeeRequest(
            "Jane", "Smith", "jane@example.com",
            "Marketing", "Manager",
            LocalDate.of(2023, 6, 1), null
        );
        var created = restTemplate.postForEntity(
            "/api/v1/employees", createReq, EmployeeResponse.class
        );
        var id = created.getBody().id();

        // Read
        var fetched = restTemplate.getForEntity(
            "/api/v1/employees/" + id, EmployeeResponse.class
        );
        assertThat(fetched.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(fetched.getBody().email()).isEqualTo("jane@example.com");

        // Update
        var updateReq = new UpdateEmployeeRequest(
            null, null, null, "Sales", null, null, null,
            fetched.getBody().version()
        );
        var updateResponse = restTemplate.exchange(
            "/api/v1/employees/" + id, HttpMethod.PATCH,
            new HttpEntity<>(updateReq), EmployeeResponse.class
        );
        assertThat(updateResponse.getBody().department()).isEqualTo("Sales");

        // Delete
        var deleteResponse = restTemplate.exchange(
            "/api/v1/employees/" + id, HttpMethod.DELETE,
            null, Void.class
        );
        assertThat(deleteResponse.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        // Verify soft-deleted
        var afterDelete = restTemplate.getForEntity(
            "/api/v1/employees/" + id, EmployeeResponse.class
        );
        assertThat(afterDelete.getBody().status()).isEqualTo(EmployeeStatus.INACTIVE);
    }
}
```

**Key patterns:**
- `@BeforeEach` cleanup ensures test isolation
- `TestRestTemplate` sends real HTTP requests to the embedded server
- Tests verify status codes, headers, and response bodies
- The lifecycle test shows the full happy path in one test

</details>

---

## Development Log

| Date | Entry |
|---|---|
| — | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) — Section 7: Integration tests with Testcontainers
- [PRD.md](../../../../docs/PRD.md) — Success criteria: integration tests pass against real PostgreSQL
