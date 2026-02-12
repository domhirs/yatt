# T-001-04: Health Check Endpoint

| Field | Value |
|---|---|
| **Task ID** | T-001-04 |
| **Story** | [S1-001: Project Setup](../../../stories/stage1/S1-001-project-setup.md) |
| **Status** | Pending |

---

## Objective

Verify that the Spring Actuator health endpoint works correctly and includes the database health indicator, providing a reliable way to confirm the application and its dependencies are operational.

---

## Checklist

- [ ] Confirm `spring-boot-starter-actuator` dependency is present
- [ ] Configure actuator endpoint exposure in `application.yaml`
- [ ] Configure health detail visibility
- [ ] Verify `GET /actuator/health` returns 200 with status UP
- [ ] Verify database health indicator shows UP when Postgres is running
- [ ] Commit: `chore(S1-001): verify actuator health check endpoint`

---

## Details

### Confirm actuator dependency is present

<details>
<summary>Expand for guidance</summary>

The `spring-boot-starter-actuator` dependency should already be in `pom.xml` from T-001-01. Verify it is present:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

Spring Boot auto-configures actuator endpoints when this starter is on the classpath. No additional setup is required for basic health checks.

</details>

### Configure actuator endpoint exposure

<details>
<summary>Expand for guidance</summary>

The actuator configuration should already be in `application.yaml` from T-001-02. Verify these settings are present:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health, info, metrics
  endpoint:
    health:
      show-details: when-authorized
```

**What each setting does:**

| Setting | Value | Purpose |
|---|---|---|
| `exposure.include` | `health, info, metrics` | Only expose these three endpoints over HTTP. All others are disabled for security. |
| `show-details` | `when-authorized` | Show component-level health details (db, disk, etc.) only to authenticated users. Anonymous users see only the aggregate status. |

Per GUIDELINES.md Section 2: "Expose only `/actuator/health` externally." The `info` and `metrics` endpoints are for internal use -- in production, the API gateway should not route external traffic to them.

**Why not `show-details: always`?**

Exposing health details publicly reveals infrastructure information (database type, version, connection pool stats) that could aid an attacker. Use `when-authorized` by default and switch to `always` only in dev if needed:

```yaml
# In application-dev.yaml only, if desired:
management:
  endpoint:
    health:
      show-details: always
```

</details>

### Configure health detail visibility

<details>
<summary>Expand for guidance</summary>

Spring Boot auto-configures health indicators for detected dependencies. With `spring-boot-starter-data-jpa` and a PostgreSQL datasource configured, Spring automatically registers:

- **`db`** -- checks the database connection via a `SELECT 1` query
- **`diskSpace`** -- checks available disk space

No additional configuration is needed. The health indicators are automatically included when their corresponding starters are on the classpath.

To see all registered health indicators during development, temporarily set:

```yaml
management:
  endpoint:
    health:
      show-details: always
      show-components: always
```

This is useful for debugging but should not be used in production.

</details>

### Verify GET /actuator/health returns 200

<details>
<summary>Expand for guidance</summary>

Start the application with Docker Compose running (from T-001-03):

```bash
# Start Postgres
docker compose -f docker-compose.yaml -f docker-compose.dev.yaml up -d

# Start the app
cd employee-service
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

Then test the health endpoint:

```bash
curl -s http://localhost:8080/actuator/health | jq .
```

**Expected response (anonymous, without details):**

```json
{
  "status": "UP"
}
```

**Expected response (with `show-details: always` in dev):**

```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "PostgreSQL",
        "validationQuery": "isValid()"
      }
    },
    "diskSpace": {
      "status": "UP",
      "details": {
        "total": ...,
        "free": ...,
        "threshold": ...,
        "path": "...",
        "exists": true
      }
    }
  }
}
```

The HTTP status code should be `200 OK` when all components are UP, and `503 Service Unavailable` when any component is DOWN.

</details>

### Verify database health indicator

<details>
<summary>Expand for guidance</summary>

To confirm the database health indicator is working, test the failure case:

```bash
# Stop Postgres
docker compose stop postgres

# Check health again
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health
# Expected: 503

# Restart Postgres
docker compose start postgres

# Wait a few seconds, then check again
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/actuator/health
# Expected: 200
```

This confirms that the health endpoint accurately reflects the database connection state. In production, this is what load balancers and container orchestrators use to determine if a service instance is healthy.

</details>

### Commit

<details>
<summary>Expand for guidance</summary>

If any configuration changes were made during verification, commit them:

```bash
git add employee-service/src/main/resources/
git commit -m "chore(S1-001): verify actuator health check endpoint"
```

If no changes were needed (everything was already configured in T-001-02), this task is a verification-only step and no commit is required.

</details>

---

## Development Log

| Date | Entry |
|---|---|
| --- | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) -- Section 2 (Spring Boot 4.0 conventions: actuator, expose only health externally)
- [DESIGN.md](../../../../docs/DESIGN.md) -- Section 7 (observability: health checks)
- [PRD.md](../../../../docs/PRD.md) -- Non-functional requirements (observability)
