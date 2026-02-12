# Design Document

## 1. Architecture overview

```
                         +-----------+
                         |  Angular  |
                         |  SPA (21) |
                         +-----+-----+
                               |
                               | HTTPS / JSON
                               v
                      +--------+--------+
                      |   API Gateway   |
                      | (Spring Cloud   |
                      |  Gateway)       |
                      +--------+--------+
                               |
              +----------------+----------------+
              |                |                |
        +-----v-----+   +-----v-----+   +-----v-----+
        |  Employee  |   |   Time    |   |  Vacation  |
        |  Service   |   |  Tracking |   |  Workflow  |
        | (Spring    |   |  Service  |   |  Service   |
        |  Boot 4)   |   | (Quarkus) |   | (Spring    |
        +-----+------+   +-----+-----+   |  Boot 4)  |
              |                |          +-----+-----+
              |                |                |
              v                v                v
        +-----+----------------+----------------+-----+
        |           PostgreSQL 17 (single instance)    |
        |  schema: employee | schema: time | schema: … |
        |                                              |
        |  TimescaleDB extension on time-series tables |
        +-----------------------+----------------------+
                                |
        +-----------------------+----------------------+
        |          NATS JetStream (message broker)     |
        +----------------------------------------------+
```

### Key principles
- Each service is independently deployable and owns its data.
- Services communicate synchronously via REST and asynchronously via NATS JetStream events.
- The API Gateway is the single entry point for the frontend; it handles routing, rate limiting, and (later) authentication.

---

## 2. Service decomposition

| Service | Framework | Responsibility | Stage |
|---|---|---|---|
| **employee-service** | Spring Boot 4.0 | Employee CRUD, org chart | 1 |
| **time-tracking-service** | Quarkus 3.32+ | Time entries, timesheets | 2 |
| **time-budget-service** | Spring Boot 4.0 | Budget allocation, tracking | 3 |
| **project-service** | Spring Boot 4.0 | Projects, milestones, tasks | 3 |
| **vacation-service** | Spring Boot 4.0 | Leave requests, approvals | 4 |
| **api-gateway** | Spring Cloud Gateway | Routing, rate limiting, auth | 2 |
| **frontend** | Angular 21 | SPA served via nginx | 2 |

### Why Quarkus for time-tracking?

The time-tracking service is the **highest-throughput, simplest-logic** service: it ingests clock events, validates, and persists. Quarkus's fast startup (~0.5s native) and low memory footprint (~50 MB RSS) make it ideal for this kind of lightweight ingestion service. It also gives the developer exposure to a second framework.

> **Decision: Spring Boot as primary framework**
>
> | | Spring Boot | Quarkus |
> |---|---|---|
> | **Pros** | Largest ecosystem, most learning resources, Spring Security is battle-tested, Spring Cloud for service orchestration | Faster startup, lower memory, native-image first-class, dev services are excellent |
> | **Cons** | Higher memory baseline (~200 MB), slower cold start | Smaller ecosystem, fewer guides, some Spring libraries don't have Quarkus equivalents |
> | **Decision** | **Primary** — best for learning, widest job market, richest library support | **Secondary** — used for 1-2 services to gain exposure |

---

## 3. Database strategy

### Single PostgreSQL instance with schema isolation

All services share one PostgreSQL 17 instance but each owns a **dedicated schema**. This is the right trade-off for a learning/small-team project.

> **Decision: Single instance vs. multiple instances**
>
> | | Single instance + schema isolation | Separate DB per service |
> |---|---|---|
> | **Pros** | Simple ops, single backup, low resource usage, easy local dev | True isolation, independent scaling, independent upgrades |
> | **Cons** | Shared failure domain, contention under heavy load | More ops burden, more memory/CPU, complex backup strategy |
> | **Decision** | **Single instance** — right-sized for this project. Move to separate instances if/when load demands it. |

### Schema layout
```
postgres (instance)
  ├── employee_db    (schema) — employee-service
  ├── time_db        (schema) — time-tracking-service
  ├── budget_db      (schema) — time-budget-service
  ├── project_db     (schema) — project-service
  └── vacation_db    (schema) — vacation-service
```

### TimescaleDB
The `time_db` schema uses the **TimescaleDB extension** on the PostgreSQL instance for time-series data (clock events, time entries). This gives automatic partitioning, compression, and fast time-range queries without a separate database engine.

### Migrations
- **Flyway** for Spring Boot services.
- **Flyway or Liquibase** for Quarkus (Quarkus has built-in Flyway support).
- Migration scripts live in each service's `src/main/resources/db/migration/` directory.

---

## 4. Communication patterns

### Synchronous — REST
- **Frontend -> API Gateway -> Service**: all user-initiated requests.
- **Service -> Service**: when a command needs an immediate response (e.g., vacation-service validating employee existence by calling employee-service).
- Use **Spring RestClient** (Spring Boot services) or **Quarkus REST Client** (Quarkus services).
- Always set timeouts. Always use circuit breakers on outbound calls.

### Asynchronous — NATS JetStream

> **Decision: NATS JetStream vs. Kafka vs. RabbitMQ**
>
> | | NATS JetStream | Kafka | RabbitMQ |
> |---|---|---|---|
> | **Pros** | Lightweight (~20 MB), simple ops, built-in persistence, request-reply, great for right-sized projects | Industry standard, massive throughput, rich ecosystem | Mature, flexible routing, good Spring integration |
> | **Cons** | Smaller community, fewer tutorials | Heavy ops (ZooKeeper/KRaft), overkill for this scale | More memory, complex clustering |
> | **Decision** | **NATS** — right-sized for this project. Simple to run in Docker, sufficient throughput, clean API. |

#### Event patterns
- **Domain events**: `employee.created`, `employee.updated`, `employee.deactivated`.
- **Command events**: reserved for later stages (e.g., `vacation.request.submitted`).
- Events are published to NATS subjects following the pattern: `{service}.{entity}.{action}`.
- Consumers use **durable subscriptions** to ensure at-least-once delivery.

#### Event envelope
```json
{
  "eventId": "uuid",
  "eventType": "employee.created",
  "timestamp": "2026-02-12T10:00:00Z",
  "source": "employee-service",
  "payload": { ... }
}
```

---

## 5. Container architecture

### Docker Compose — development and initial production

> **Decision: Docker Compose vs. Kubernetes from day one**
>
> | | Docker Compose | Kubernetes |
> |---|---|---|
> | **Pros** | Simple, fast to iterate, works on a single machine, no cluster overhead | Production-grade orchestration, auto-scaling, self-healing |
> | **Cons** | No auto-scaling, no self-healing, manual restart on failure | Steep learning curve, heavy resource usage, overkill for learning |
> | **Decision** | **Docker Compose** — start here. Migrate to K8s only if/when multi-node deployment is needed. |

### Compose services (target state)
```yaml
services:
  postgres:       # PostgreSQL 17 + TimescaleDB
  nats:           # NATS server with JetStream enabled
  employee-svc:   # Spring Boot 4.0
  time-svc:       # Quarkus (native or JVM)
  api-gateway:    # Spring Cloud Gateway
  frontend:       # Angular SPA served by nginx
```

### Build strategy
- **Multi-stage Dockerfiles**: build with JDK 25, run on JRE 25 (or distroless for Quarkus native).
- **Layer caching**: copy dependency resolution files first (`pom.xml` / `build.gradle`), then source code.
- For Quarkus native: build in a container with GraalVM to ensure reproducibility.

---

## 6. Frontend-backend integration

### Angular SPA <-> API Gateway
- The Angular app is a **standalone SPA** served by nginx (or a similar static file server) in its own container.
- All API calls go through the **API Gateway** at a single base URL (e.g., `/api/v1/...`).
- The gateway routes to the appropriate backend service based on the URL path prefix.
- **CORS**: configured at the gateway level, not in individual services.

### API versioning
- URL-based versioning: `/api/v1/employees`.
- Breaking changes get a new version (`/api/v2/...`). Old versions are maintained until deprecated.

### Error contract
All services return errors in a consistent format:
```json
{
  "status": 422,
  "error": "Unprocessable Entity",
  "message": "Validation failed",
  "details": [
    { "field": "email", "message": "must be a valid email address" }
  ],
  "timestamp": "2026-02-12T10:00:00Z",
  "path": "/api/v1/employees"
}
```

---

## 7. Observability (planned)

| Concern | Tool | Notes |
|---|---|---|
| Logging | SLF4J + Logback (Spring), JBoss Logging (Quarkus) | JSON format in production, correlation IDs |
| Metrics | Micrometer -> Prometheus | Exposed via `/actuator/metrics` |
| Tracing | Micrometer Tracing -> OpenTelemetry | Distributed trace propagation across services |
| Dashboards | Grafana | Deferred until Stage 3+ |

---

## 8. Security (planned)

Not implemented in Stage 1, but the architecture is designed to support it:

- **Authentication**: OAuth 2.0 / OpenID Connect via Keycloak (FOSS).
- **Authorization**: role-based access control (RBAC) enforced at the gateway and service level.
- **Token propagation**: JWT tokens passed from gateway to services via `Authorization` header.
- **Service-to-service auth**: mutual TLS or shared JWT trust (deferred decision).

Stage 1 runs unauthenticated but with Spring Security on the classpath and security filters in place (just permitting all requests).
