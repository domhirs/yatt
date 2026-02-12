# T-003-03: Define Error Contract Schema

| Field | Value |
|---|---|
| **Task ID** | T-003-03 |
| **Story** | [S1-003: OpenAPI Specification](../../../stories/stage1/S1-003-openapi-spec.md) |
| **Status** | Pending |

---

## Objective

Formalize the error response format in the OpenAPI spec so that all services return errors in a consistent, machine-readable structure matching the DESIGN.md contract.

---

## Checklist

- [ ] Define `ErrorResponse` schema in OpenAPI spec
- [ ] Define `ValidationErrorDetail` schema (field + message)
- [ ] Map error schemas to HTTP status codes (400, 404, 409, 422, 500)
- [ ] Add error response examples for each status code
- [ ] Verify error schemas are referenced in all endpoint error responses
- [ ] Commit: `docs(S1-003): define error contract schema in OpenAPI spec`

---

## Details

### Define ErrorResponse schema

<details>
<summary>Expand for guidance</summary>

Add to the `components.schemas` section of `docs/api/employee-service.yaml`:

```yaml
components:
  schemas:
    ErrorResponse:
      type: object
      required: [status, error, message, timestamp, path]
      properties:
        status:
          type: integer
          description: HTTP status code
          example: 422
        error:
          type: string
          description: HTTP status reason phrase
          example: "Unprocessable Entity"
        message:
          type: string
          description: Human-readable error message
          example: "Validation failed"
        details:
          type: array
          nullable: true
          description: Field-level validation errors (null for non-validation errors)
          items:
            $ref: '#/components/schemas/ValidationErrorDetail'
        timestamp:
          type: string
          format: date-time
          description: ISO-8601 timestamp of the error
          example: "2026-02-12T10:00:00Z"
        path:
          type: string
          description: Request path that caused the error
          example: "/api/v1/employees"

    ValidationErrorDetail:
      type: object
      required: [field, message]
      properties:
        field:
          type: string
          description: The field that failed validation
          example: "email"
        message:
          type: string
          description: Validation error message
          example: "must be a valid email address"
```

This matches the error contract defined in [DESIGN.md Section 6](../../DESIGN.md).

</details>

### Map error schemas to status codes

<details>
<summary>Expand for guidance</summary>

Define reusable response components:

```yaml
components:
  responses:
    BadRequest:
      description: Bad request (invalid input format)
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            status: 400
            error: "Bad Request"
            message: "Invalid UUID format"
            details: null
            timestamp: "2026-02-12T10:00:00Z"
            path: "/api/v1/employees/not-a-uuid"

    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            status: 404
            error: "Not Found"
            message: "Employee not found: 550e8400-e29b-41d4-a716-446655440000"
            details: null
            timestamp: "2026-02-12T10:00:00Z"
            path: "/api/v1/employees/550e8400-e29b-41d4-a716-446655440000"

    Conflict:
      description: Conflict (duplicate resource or version mismatch)
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            status: 409
            error: "Conflict"
            message: "An employee with email john@example.com already exists"
            details: null
            timestamp: "2026-02-12T10:00:00Z"
            path: "/api/v1/employees"

    UnprocessableEntity:
      description: Validation failed
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            status: 422
            error: "Unprocessable Entity"
            message: "Validation failed"
            details:
              - field: "email"
                message: "must be a valid email address"
              - field: "firstName"
                message: "must not be blank"
            timestamp: "2026-02-12T10:00:00Z"
            path: "/api/v1/employees"

    InternalServerError:
      description: Unexpected server error
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            status: 500
            error: "Internal Server Error"
            message: "An unexpected error occurred"
            details: null
            timestamp: "2026-02-12T10:00:00Z"
            path: "/api/v1/employees"
```

Reference these in every endpoint's responses section using `$ref: '#/components/responses/NotFound'` etc.

</details>

### Verify references in endpoints

<details>
<summary>Expand for guidance</summary>

Every endpoint should reference the appropriate error responses. Example for POST:

```yaml
paths:
  /api/v1/employees:
    post:
      responses:
        '201':
          description: Employee created
        '409':
          $ref: '#/components/responses/Conflict'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'
        '500':
          $ref: '#/components/responses/InternalServerError'
```

Mapping by endpoint:
- **POST**: 409, 422, 500
- **GET /{id}**: 400, 404, 500
- **GET (list)**: 400, 500
- **PATCH /{id}**: 400, 404, 409, 422, 500
- **DELETE /{id}**: 400, 404, 409, 500
- **GET /search**: 400, 500
- **GET /{id}/direct-reports**: 400, 404, 500
- **GET /{id}/reporting-chain**: 400, 404, 500

</details>

---

## Development Log

| Date | Entry |
|---|---|
| — | *No entries yet* |

---

## References

- [DESIGN.md](../../../../docs/DESIGN.md) — Section 6: Error contract
- [GUIDELINES.md](../../../../docs/GUIDELINES.md) — Section 4: API-first design
