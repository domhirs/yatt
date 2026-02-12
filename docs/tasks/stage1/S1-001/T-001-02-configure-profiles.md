# T-001-02: Configure Application Profiles

| Field | Value |
|---|---|
| **Task ID** | T-001-02 |
| **Story** | [S1-001: Project Setup](../../../stories/stage1/S1-001-project-setup.md) |
| **Status** | Pending |

---

## Objective

Set up `dev`, `test`, and `prod` profiles with environment-specific configuration so the application behaves correctly in each environment without manual intervention or secret leakage.

---

## Checklist

- [ ] Create `application.yaml` (common config shared across all profiles)
- [ ] Create `application-dev.yaml` (local Postgres, debug logging)
- [ ] Create `application-test.yaml` (Testcontainers placeholder, INFO logging)
- [ ] Create `application-prod.yaml` (env vars for DB, JSON logging)
- [ ] Verify profile activation with `--spring.profiles.active=dev`
- [ ] Commit: `chore(S1-001): configure dev, test, and prod profiles`

---

## Details

### Create application.yaml (common config)

<details>
<summary>Expand for guidance</summary>

Place all profile files in `employee-service/src/main/resources/`. The common `application.yaml` contains settings shared across all profiles:

```yaml
spring:
  application:
    name: employee-service

server:
  port: 8080
  shutdown: graceful

management:
  endpoints:
    web:
      exposure:
        include: health, info, metrics
  endpoint:
    health:
      show-details: when-authorized

spring.jpa:
  open-in-view: false
  hibernate:
    ddl-auto: validate
```

**Key decisions:**

| Setting | Value | Why |
|---|---|---|
| `server.shutdown` | `graceful` | Allows in-flight requests to complete on shutdown |
| `jpa.open-in-view` | `false` | Prevents lazy-loading surprises in controllers (anti-pattern if left on) |
| `hibernate.ddl-auto` | `validate` | Flyway manages the schema; Hibernate only validates it matches the entities |
| `health.show-details` | `when-authorized` | Hides internals from anonymous users in production |

</details>

### Create application-dev.yaml

<details>
<summary>Expand for guidance</summary>

The dev profile targets a local PostgreSQL instance started via Docker Compose (see T-001-03):

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/employee_db
    username: employee_user
    password: employee_pass
  jpa:
    show-sql: true
    properties:
      hibernate:
        format_sql: true

logging:
  level:
    com.timetracker: DEBUG
    org.springframework.web: DEBUG
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
```

**Why these settings:**
- `show-sql: true` and `format_sql: true` let you see exactly what Hibernate generates during development.
- `BasicBinder: TRACE` logs the actual parameter values bound to prepared statements, which is invaluable for debugging queries.
- These are too noisy for test or production -- that is why they live only in the dev profile.

**Important**: The username and password here are for the local Docker Compose database only. They are not secrets. Production credentials must never appear in YAML files -- see `application-prod.yaml`.

</details>

### Create application-test.yaml

<details>
<summary>Expand for guidance</summary>

The test profile is used by integration tests with Testcontainers. Testcontainers will override the datasource URL dynamically, so the YAML provides sensible defaults and logging:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/employee_test_db
    username: test_user
    password: test_pass
  jpa:
    show-sql: false
  flyway:
    clean-disabled: false

logging:
  level:
    com.timetracker: INFO
    org.springframework.web: INFO
    org.hibernate.SQL: WARN
```

**Notes:**
- The datasource URL here is a placeholder. When Testcontainers is configured (later task), it will override `spring.datasource.url` with the container's dynamic URL using `@DynamicPropertySource` or the `@ServiceConnection` annotation.
- `flyway.clean-disabled: false` allows tests to use `Flyway.clean()` for a fresh schema between test runs. This is **disabled in production** by default.
- Logging is at INFO level to keep test output readable.

</details>

### Create application-prod.yaml

<details>
<summary>Expand for guidance</summary>

The production profile reads all sensitive values from environment variables and configures structured JSON logging:

```yaml
spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
  jpa:
    show-sql: false
  flyway:
    clean-disabled: true

logging:
  level:
    com.timetracker: INFO
    org.springframework: WARN
    org.hibernate: WARN

management:
  endpoint:
    health:
      show-details: when-authorized
```

**Key points:**
- `${DB_URL}`, `${DB_USERNAME}`, `${DB_PASSWORD}` are resolved from environment variables at runtime. The application will fail fast if these are not set, which is the correct behavior.
- `flyway.clean-disabled: true` prevents accidental schema destruction in production.
- HikariCP connection pool is tuned with explicit values rather than relying on defaults, so pool behavior is predictable under load.
- JSON logging: Spring Boot 4 supports structured logging out of the box. To enable JSON output, add the following to `application-prod.yaml`:

```yaml
logging:
  structured:
    format:
      console: ecs
```

This uses Elastic Common Schema (ECS) format. Alternatively, use `logstash` format if your log aggregator prefers it. This is a Spring Boot 4 feature -- no additional dependencies needed.

</details>

### Verify profile activation

<details>
<summary>Expand for guidance</summary>

Test that the correct profile loads by starting the application with an explicit profile:

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

Or via command-line argument:

```bash
java -jar target/employee-service-0.0.1-SNAPSHOT.jar --spring.profiles.active=dev
```

Look for this log line near the top of the output:

```
The following 1 profile is active: "dev"
```

If using the dev profile without Docker Compose running, a database connection error is expected. The important thing is that the correct profile is reported as active.

For IntelliJ IDEA, set the active profile in Run Configuration > Environment variables: `SPRING_PROFILES_ACTIVE=dev`.

</details>

### Commit

<details>
<summary>Expand for guidance</summary>

```bash
git add employee-service/src/main/resources/application*.yaml
git commit -m "chore(S1-001): configure dev, test, and prod profiles"
```

</details>

---

## Development Log

| Date | Entry |
|---|---|
| --- | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) -- Section 2 (Spring Boot 4.0 conventions: profiles, no secrets in YAML)
- [DESIGN.md](../../../../docs/DESIGN.md) -- Section 3 (database strategy: schema isolation, credentials)
- [AGENT.md](../../../../docs/AGENT.md) -- Production mindset (security-aware defaults)
