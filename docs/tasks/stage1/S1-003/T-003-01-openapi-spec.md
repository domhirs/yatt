# T-003-01: Write OpenAPI 3.1 Specification

| Field | Value |
|---|---|
| **Task ID** | T-003-01 |
| **Story** | [S1-003: OpenAPI Specification](../../../stories/stage1/S1-003-openapi-spec.md) |
| **Status** | Pending |

---

## Objective

Define the complete Employee REST API contract in OpenAPI 3.1 YAML before any implementation begins, establishing a single source of truth for endpoints, request/response schemas, and error handling that all subsequent tasks implement against.

---

## Checklist

- [ ] Create `docs/api/` directory
- [ ] Write `employee-service.yaml` with OpenAPI 3.1 format
- [ ] Define all endpoints (POST, GET, GET by ID, PATCH, DELETE, search, direct-reports, reporting-chain)
- [ ] Define request/response schemas
- [ ] Define error response schema
- [ ] Add request/response examples
- [ ] Validate spec with online validator
- [ ] Commit: `docs(S1-003): add OpenAPI 3.1 spec for employee service`

---

## Details

### Create `docs/api/` directory

<details>
<summary>Expand for guidance</summary>

Per GUIDELINES.md Section 4, OpenAPI specs live in `docs/api/` with one YAML file per service:

```
docs/
  api/
    employee-service.yaml
```

This directory is the canonical location for all API contracts in the project. Other services added in later stages will place their specs here as well.

</details>

### Write `employee-service.yaml` with OpenAPI 3.1 format

<details>
<summary>Expand for guidance</summary>

Start the file with the OpenAPI 3.1 header and info block. The base path for all endpoints is `/api/v1` per DESIGN.md Section 6 (API versioning).

```yaml
openapi: 3.1.0
info:
  title: Employee Service API
  description: REST API for employee management in the time-tracking platform.
  version: 1.0.0
  contact:
    name: Time Tracker Team

servers:
  - url: http://localhost:8080/api/v1
    description: Local development server

tags:
  - name: Employees
    description: Employee CRUD operations
  - name: Org Chart
    description: Organizational hierarchy operations
```

Use tags to group endpoints logically. The `Employees` tag covers CRUD and search; the `Org Chart` tag covers direct-reports and reporting-chain.

</details>

### Define all endpoints

<details>
<summary>Expand for guidance</summary>

The endpoint structure covers all operations from the PRD. Each path should reference shared schemas from the `components` section.

```yaml
paths:
  /employees:
    post:
      tags: [Employees]
      operationId: createEmployee
      summary: Create a new employee
      # ... requestBody, responses

    get:
      tags: [Employees]
      operationId: listEmployees
      summary: List employees with pagination and filtering
      parameters:
        - $ref: '#/components/parameters/PageParam'
        - $ref: '#/components/parameters/SizeParam'
        - $ref: '#/components/parameters/SortParam'
        - $ref: '#/components/parameters/DepartmentFilter'
        - $ref: '#/components/parameters/RoleFilter'
        - $ref: '#/components/parameters/StatusFilter'
      # ... responses

  /employees/search:
    get:
      tags: [Employees]
      operationId: searchEmployees
      summary: Search employees by name
      parameters:
        - name: q
          in: query
          required: true
          description: Search query (matches first name or last name)
          schema:
            type: string
            minLength: 1
        - $ref: '#/components/parameters/PageParam'
        - $ref: '#/components/parameters/SizeParam'
      # ... responses

  /employees/{id}:
    get:
      tags: [Employees]
      operationId: getEmployee
      summary: Get employee by ID
      # ... responses

    patch:
      tags: [Employees]
      operationId: updateEmployee
      summary: Update an employee (partial update)
      # ... requestBody, responses

    delete:
      tags: [Employees]
      operationId: deleteEmployee
      summary: Soft-delete an employee
      # ... responses (204 No Content on success)

  /employees/{id}/direct-reports:
    get:
      tags: [Org Chart]
      operationId: getDirectReports
      summary: Get direct reports of an employee
      # ... responses (list of EmployeeResponse)

  /employees/{id}/reporting-chain:
    get:
      tags: [Org Chart]
      operationId: getReportingChain
      summary: Get the reporting chain (manager hierarchy) of an employee
      # ... responses (ordered list, immediate manager first)
```

**HTTP status codes** (from PRD):

| Operation | Success | Error codes |
|---|---|---|
| POST /employees | 201 Created | 400, 409, 422 |
| GET /employees | 200 OK | 400 |
| GET /employees/{id} | 200 OK | 404 |
| PATCH /employees/{id} | 200 OK | 400, 404, 409, 422 |
| DELETE /employees/{id} | 204 No Content | 404, 409 |
| GET /employees/search | 200 OK | 400 |
| GET /employees/{id}/direct-reports | 200 OK | 404 |
| GET /employees/{id}/reporting-chain | 200 OK | 404 |

**Pagination parameters** (define as reusable components):

```yaml
components:
  parameters:
    PageParam:
      name: page
      in: query
      required: false
      description: Zero-based page index
      schema:
        type: integer
        default: 0
        minimum: 0

    SizeParam:
      name: size
      in: query
      required: false
      description: Number of records per page
      schema:
        type: integer
        default: 20
        minimum: 1
        maximum: 100

    SortParam:
      name: sort
      in: query
      required: false
      description: "Sort field and direction (e.g., lastName,asc)"
      schema:
        type: string
        default: "lastName,asc"

    DepartmentFilter:
      name: department
      in: query
      required: false
      description: Filter by department (exact match)
      schema:
        type: string

    RoleFilter:
      name: role
      in: query
      required: false
      description: Filter by role (exact match)
      schema:
        type: string

    StatusFilter:
      name: status
      in: query
      required: false
      description: Filter by employee status
      schema:
        type: string
        enum: [ACTIVE, INACTIVE]
```

</details>

### Define request/response schemas

<details>
<summary>Expand for guidance</summary>

Place all schemas under `components/schemas`. Use the data model from the PRD as the basis.

```yaml
components:
  schemas:
    CreateEmployeeRequest:
      type: object
      required:
        - firstName
        - lastName
        - email
        - department
        - role
        - hireDate
      properties:
        firstName:
          type: string
          maxLength: 100
          description: Employee's first name
        lastName:
          type: string
          maxLength: 100
          description: Employee's last name
        email:
          type: string
          format: email
          description: Unique email address
        department:
          type: string
          description: Department name
        role:
          type: string
          description: Job role/title
        hireDate:
          type: string
          format: date
          description: Date of hire (ISO 8601, not in the future)
        managerId:
          type: string
          format: uuid
          nullable: true
          description: UUID of the employee's manager (null for top-level employees)

    UpdateEmployeeRequest:
      type: object
      description: "Partial update: only include fields to change. Omitted fields remain unchanged."
      properties:
        firstName:
          type: string
          maxLength: 100
        lastName:
          type: string
          maxLength: 100
        email:
          type: string
          format: email
        department:
          type: string
        role:
          type: string
        hireDate:
          type: string
          format: date
        managerId:
          type: string
          format: uuid
          nullable: true
        status:
          type: string
          enum: [ACTIVE, INACTIVE]

    EmployeeResponse:
      type: object
      properties:
        id:
          type: string
          format: uuid
        firstName:
          type: string
        lastName:
          type: string
        email:
          type: string
          format: email
        department:
          type: string
        role:
          type: string
        hireDate:
          type: string
          format: date
        managerId:
          type: string
          format: uuid
          nullable: true
        status:
          type: string
          enum: [ACTIVE, INACTIVE]
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    PagedResponse:
      type: object
      properties:
        content:
          type: array
          items:
            $ref: '#/components/schemas/EmployeeResponse'
        page:
          type: integer
          description: Current page number (zero-based)
        size:
          type: integer
          description: Number of elements per page
        totalElements:
          type: integer
          format: int64
          description: Total number of matching records
        totalPages:
          type: integer
          description: Total number of pages
```

The `PagedResponse` wraps a list of `EmployeeResponse` with pagination metadata. This mirrors the structure of Spring Data's `Page` object, which will make the mapping straightforward in implementation.

</details>

### Define error response schema

<details>
<summary>Expand for guidance</summary>

The error schema must match the contract defined in DESIGN.md Section 6:

```yaml
    ErrorResponse:
      type: object
      required:
        - status
        - error
        - message
        - timestamp
        - path
      properties:
        status:
          type: integer
          description: HTTP status code
        error:
          type: string
          description: HTTP status reason phrase
        message:
          type: string
          description: Human-readable error description
        details:
          type: array
          nullable: true
          items:
            $ref: '#/components/schemas/ValidationErrorDetail'
          description: Field-level validation errors (present on 422 responses)
        timestamp:
          type: string
          format: date-time
          description: When the error occurred
        path:
          type: string
          description: Request path that caused the error

    ValidationErrorDetail:
      type: object
      properties:
        field:
          type: string
          description: The field that failed validation
        message:
          type: string
          description: Validation error message for this field
```

Reference `ErrorResponse` in all error responses across every endpoint. See T-003-03 for detailed error examples and mapping.

</details>

### Add request/response examples

<details>
<summary>Expand for guidance</summary>

Add `example` or `examples` to each endpoint's request and response bodies. This makes the spec useful as documentation and helps consumers understand the expected format.

Example for `POST /employees`:

```yaml
requestBody:
  required: true
  content:
    application/json:
      schema:
        $ref: '#/components/schemas/CreateEmployeeRequest'
      example:
        firstName: "Jane"
        lastName: "Smith"
        email: "jane.smith@example.com"
        department: "Engineering"
        role: "Senior Developer"
        hireDate: "2025-03-15"
        managerId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
responses:
  '201':
    description: Employee created successfully
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/EmployeeResponse'
        example:
          id: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
          firstName: "Jane"
          lastName: "Smith"
          email: "jane.smith@example.com"
          department: "Engineering"
          role: "Senior Developer"
          hireDate: "2025-03-15"
          managerId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
          status: "ACTIVE"
          createdAt: "2026-02-12T10:00:00Z"
          updatedAt: "2026-02-12T10:00:00Z"
```

Add examples for every endpoint and every error status code. Complete examples make the spec self-documenting and are required by AC3 of the story.

</details>

### Validate spec with online validator

<details>
<summary>Expand for guidance</summary>

After writing the spec, validate it to catch syntax errors and schema issues:

1. **Swagger Editor**: Paste the YAML into [https://editor.swagger.io/](https://editor.swagger.io/) and check for errors in the right panel.
2. **Redocly CLI** (optional): If you install it locally, run `redocly lint docs/api/employee-service.yaml`.

Fix any warnings or errors before committing. Common issues to watch for:
- Missing `$ref` targets
- Invalid `format` values
- Required fields not listed in `required` array
- Inconsistent naming (camelCase in JSON, snake_case in URLs)

</details>

### Commit

<details>
<summary>Expand for guidance</summary>

```bash
git add docs/api/employee-service.yaml
git commit -m "docs(S1-003): add OpenAPI 3.1 spec for employee service"
```

This follows the project's Conventional Commits convention (`docs:` prefix for documentation changes).

</details>

---

## Development Log

| Date | Entry |
|---|---|
| --- | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) -- Section 4 (API-first design, OpenAPI specs before implementation)
- [DESIGN.md](../../../../docs/DESIGN.md) -- Section 6 (error contract, API versioning)
- [PRD.md](../../../../docs/PRD.md) -- Stage 1 functional requirements, API design, data model
