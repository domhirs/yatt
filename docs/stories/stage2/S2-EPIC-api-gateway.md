# S2-EPIC-api-gateway: API Gateway

| Field | Value |
|---|---|
| **Epic ID** | S2-EPIC-api-gateway |
| **Title** | API Gateway |
| **Stage** | 2 — Time Tracking & Frontend |
| **Status** | Backlog |
| **Framework** | Spring Cloud Gateway |

---

## Vision

Provide a single entry point for all frontend requests. The gateway routes to backend services, handles rate limiting, and prepares for authentication.

---

## Key Features (planned)

- Path-based routing (`/api/v1/employees` -> employee-service)
- Rate limiting
- CORS configuration
- Request/response logging
- Health aggregation from all services

---

## Technical Considerations

- Spring Cloud Gateway (reactive)
- Route configuration in YAML
- Prepare security filter chain for OAuth 2.0 (Stage 2+)
- Circuit breaker on downstream services

---

## Dependencies

- Stage 1 complete
- At least one backend service deployed

---

## Stories

> Stories will be defined when this stage is prioritized. See [`BACKLOG.md`](../BACKLOG.md) for current status.
