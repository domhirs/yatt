# Development Guidelines

Coding standards, conventions, and practices for the time-tracking platform. All code in this project **must** follow these guidelines.

---

## 1. Java 25 coding standards

### Use modern language features
- **Records** for DTOs, value objects, and event payloads. Records are immutable by default — don't recreate this with manual `final` fields + getters when a record fits.
- **Sealed classes/interfaces** for domain type hierarchies where the set of subtypes is known (e.g., `sealed interface LeaveType permits Vacation, SickLeave, CompensatoryTime`).
- **Pattern matching** (`switch` expressions with patterns, `instanceof` patterns) to replace visitor-like boilerplate. Prefer exhaustive `switch` over `if-else` chains.
- **Virtual threads** (`Thread.ofVirtual()`, structured concurrency via `StructuredTaskScope`) for I/O-bound work. Do not pin virtual threads — avoid `synchronized` blocks on shared resources; use `ReentrantLock` instead.
- **Text blocks** (`"""`) for multi-line strings (SQL, JSON templates, etc.).
- **`var`** for local variables when the type is obvious from the right-hand side. Do not use `var` when it hurts readability.

### General style
- **Immutability by default**: `final` fields, unmodifiable collections (`List.of`, `Map.of`, `Collections.unmodifiable*`), records.
- **Null safety**: avoid returning `null`. Use `Optional` for method return types where absence is a valid outcome. Never use `Optional` as a field or parameter type.
- **Naming**: `PascalCase` for types, `camelCase` for methods/variables, `UPPER_SNAKE_CASE` for constants. Package names are all lowercase.
- **Package structure**: organize by feature, not by layer.
  ```
  com.timetracker.employee/
    EmployeeController.java
    EmployeeService.java
    EmployeeRepository.java
    Employee.java
    dto/
      CreateEmployeeRequest.java
  ```
- **No wildcard imports.** Use explicit imports.
- **Maximum line length**: 120 characters (IntelliJ default).

---

## 2. Spring Boot 4.0 conventions

- **Constructor injection** only. No `@Autowired` on fields or setters.
- **`@ConfigurationProperties`** over `@Value` for any configuration with more than one related property.
- **Thin controllers**: controllers handle HTTP mapping and validation. Business logic lives in `@Service` classes.
- **RestClient** (Spring 6.2+) as the default HTTP client for service-to-service REST calls.
- **Spring Security 7**: follow the new defaults (CSRF protection, SecurityFilterChain bean config). Do not disable security features without documenting the reason.
- **Profiles**: `dev`, `test`, `prod`. Use `application-{profile}.yaml`. Never put secrets in YAML files — use environment variables or a secret store.
- **Actuator**: enable health, info, and metrics endpoints. Expose only `/actuator/health` externally.
- **Structured logging**: use SLF4J with logback. Log in JSON format for production. Include correlation IDs.

---

## 3. Quarkus conventions

Used for selected services where fast startup and low memory matter.

- **CDI scopes**: prefer `@ApplicationScoped` for services, `@RequestScoped` only when needed.
- **Config**: `application.properties` / `application.yaml` with profile-based overrides (`%dev.`, `%test.`, `%prod.`).
- **RESTEasy Reactive** for REST endpoints (annotation-compatible with Jakarta REST).
- **Dev Services**: leverage automatic database/broker provisioning in dev mode.
- **Native build**: ensure compatibility with GraalVM native image. Avoid reflection-heavy patterns; register reflection hints when needed.
- **Panache** for data access — Active Record or Repository pattern as fits the entity.

---

## 4. Microservices patterns

### API-first design
- Define OpenAPI 3.1 specs **before** implementation.
- Generate server stubs and client code from the spec.
- Store specs in `docs/api/` (one YAML per service).

### Database-per-service (schema isolation)
- Each service owns its schema in the shared PostgreSQL instance.
- No cross-schema joins. Period.
- If service A needs data from service B, it calls B's API or subscribes to B's events.

### Event-driven communication
- Use NATS JetStream for async events (domain events, notifications).
- Synchronous REST for queries and commands that need immediate responses.
- Event schema: define in `docs/events/` as JSON Schema or Avro.

### Resilience
- Circuit breakers on outbound service calls.
- Timeouts on all external calls (HTTP, database, message broker).
- Graceful degradation: return partial data or cached results when a dependency is down.

---

## 5. Angular 21 conventions

- **Standalone components** only. No `NgModule`s.
- **Signals** as the primary reactivity model. Use `signal()`, `computed()`, `effect()`. Minimize RxJS usage to HTTP calls and complex async flows.
- **Zoneless change detection**: do not import `zone.js`. Rely on signal-based change detection.
- **File naming**: `kebab-case` (e.g., `employee-list.component.ts`).
- **Project structure**: feature-based modules with lazy-loaded routes.
  ```
  src/app/
    features/
      employee/
        employee-list.component.ts
        employee-detail.component.ts
        employee.service.ts
        employee.routes.ts
    shared/
      components/
      services/
      models/
  ```
- **State management**: start with component-level signals. Introduce a store (NgRx SignalStore or lightweight alternative) only when cross-component state sharing becomes complex.
- **Testing**: Vitest for unit tests. Playwright for E2E.

---

## 6. Docker and container conventions

- **One Dockerfile per service**, placed at the service root.
- **Multi-stage builds**: build stage (JDK 25) -> runtime stage (JRE 25 or distroless).
- **Docker Compose** for local development and initial production. One `docker-compose.yaml` at the repo root, with override files (`docker-compose.dev.yaml`, `docker-compose.prod.yaml`).
- **Named volumes** for database data persistence.
- **Health checks** in Compose for all services.
- **No secrets in images**: use environment variables or Docker secrets.

---

## 7. Testing strategy

| Level | Tool | Coverage target | Scope |
|---|---|---|---|
| Unit (Java) | JUnit 5 + Mockito | 80%+ on services | Pure logic, no Spring context |
| Integration (Java) | Spring Boot Test / QuarkusTest + Testcontainers | Key flows | Full stack with real DB |
| Contract | Spring Cloud Contract or Pact | All service interfaces | API compatibility |
| Unit (Angular) | Vitest | 80%+ on services/pipes | Component and service logic |
| E2E | Playwright | Critical user journeys | Full browser tests |

### Test conventions
- Test class name matches source: `EmployeeService` -> `EmployeeServiceTest`.
- Use `@DisplayName` for readable test names.
- Arrange-Act-Assert structure.
- Use Testcontainers for integration tests — never mock the database in integration tests.
- Tests must be independent and repeatable. No shared mutable state between tests.

---

## 8. FOSS requirement

- **All dependencies must be free and open-source software.**
- Acceptable licenses: Apache 2.0, MIT, BSD, EPL, MPL 2.0, LGPL.
- No proprietary SDKs, SaaS-only services, or SSPL-licensed components.
- If a dependency's license is unclear, investigate before adding it.
- Prefer well-maintained projects with active communities.

---

## 9. Git conventions

- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `ci:`.
- **Branch naming**: `feat/short-description`, `fix/short-description`, `refactor/short-description`.
- **Small, focused commits.** One logical change per commit.
- **No force-pushing to shared branches.**
