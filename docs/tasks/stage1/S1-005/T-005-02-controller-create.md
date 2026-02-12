# T-005-02: Controller POST Endpoint

| Field | Value |
|---|---|
| **Task ID** | T-005-02 |
| **Story** | [S1-005: Create Employee](../../../stories/stage1/S1-005-create-employee.md) |
| **Status** | Pending |

---

## Objective

Implement the `POST /api/v1/employees` endpoint in the controller layer, delegating to `EmployeeService.create()` and returning a 201 Created response with the `Location` header pointing to the newly created resource.

---

## Checklist

- [ ] Create `EmployeeController` with `@RestController` and `@RequestMapping("/api/v1/employees")`
- [ ] Inject `EmployeeService` via constructor
- [ ] Implement POST method accepting `@Valid @RequestBody CreateEmployeeRequest`
- [ ] Return 201 Created with `Location` header and response body
- [ ] Build `Location` URI using `ServletUriComponentsBuilder`
- [ ] Verify endpoint works via curl or HTTP client
- [ ] Commit: `feat(S1-005): implement POST /api/v1/employees endpoint`

---

## Details

### Create EmployeeController

<details>
<summary>Expand for guidance</summary>

The controller lives in `com.timetracker.employee`. Per GUIDELINES.md Section 2, controllers are **thin** -- they handle HTTP mapping and validation, nothing more. Business logic lives in the service.

```java
package com.timetracker.employee;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

@RestController
@RequestMapping("/api/v1/employees")
public class EmployeeController {

    private final EmployeeService service;

    public EmployeeController(EmployeeService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<EmployeeResponse> create(@Valid @RequestBody CreateEmployeeRequest request) {
        EmployeeResponse response = service.create(request);

        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();

        return ResponseEntity.created(location).body(response);
    }
}
```

**Why this structure?**

- `@RestController` combines `@Controller` + `@ResponseBody`, so every method returns a serialized response body.
- `@RequestMapping("/api/v1/employees")` sets the base path for all endpoints in this controller, following the URL-based versioning convention from DESIGN.md Section 6.
- Constructor injection keeps the dependency explicit and `final`.

</details>

### Return 201 Created with Location header

<details>
<summary>Expand for guidance</summary>

The HTTP spec (RFC 9110) states that a `201 Created` response **should** include a `Location` header pointing to the created resource. This is a REST best practice.

`ResponseEntity.created(location).body(response)` does two things:
1. Sets the HTTP status to `201 Created`.
2. Adds the `Location` header with the URI of the new resource.

The `Location` URI is built from the current request URI, appending the generated ID:

```
POST /api/v1/employees  ->  Location: /api/v1/employees/550e8400-e29b-41d4-a716-446655440000
```

`ServletUriComponentsBuilder.fromCurrentRequest()` captures the current request URI, including scheme, host, port, and path. This ensures the `Location` header is correct regardless of whether the service is behind a reverse proxy (assuming proper `X-Forwarded-*` header handling).

</details>

### @Valid triggers Bean Validation

<details>
<summary>Expand for guidance</summary>

The `@Valid` annotation on the method parameter tells Spring to run Jakarta Bean Validation on the `CreateEmployeeRequest` before the method body executes. If any constraint is violated, Spring throws `MethodArgumentNotValidException`, which is handled by the `GlobalExceptionHandler` (S1-012) and converted to a 422 response matching the standard error contract.

This means field-level validations like `@NotBlank`, `@Email`, `@Size`, and `@PastOrPresent` are enforced **automatically** without any code in the controller or service. The controller does not need to check field validity -- it only needs `@Valid`.

</details>

### Verify with curl

<details>
<summary>Expand for guidance</summary>

After the application is running, test with:

```bash
curl -s -X POST http://localhost:8080/api/v1/employees \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane.doe@example.com",
    "department": "Engineering",
    "role": "Software Engineer",
    "hireDate": "2025-01-15"
  }' | jq .
```

**Expected response** (201 Created):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane.doe@example.com",
  "department": "Engineering",
  "role": "Software Engineer",
  "hireDate": "2025-01-15",
  "managerId": null,
  "status": "ACTIVE",
  "createdAt": "2026-02-12T10:30:00Z",
  "updatedAt": "2026-02-12T10:30:00Z"
}
```

Check that the `Location` header is present in the response headers:

```bash
curl -s -D - -X POST http://localhost:8080/api/v1/employees \
  -H "Content-Type: application/json" \
  -d '{ ... }' -o /dev/null | grep -i location
```

Expected: `Location: http://localhost:8080/api/v1/employees/550e8400-...`

</details>

---

## Development Log

| Date | Entry |
|---|---|
| --- | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) -- Section 2 (thin controllers, constructor injection)
- [DESIGN.md](../../../../docs/DESIGN.md) -- Section 6 (API versioning: `/api/v1/...`, error contract)
- [PRD.md](../../../../docs/PRD.md) -- API design (201 on create, Location header)
