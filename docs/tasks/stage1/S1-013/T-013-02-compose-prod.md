# T-013-02: Compose Production Config

| Field | Value |
|---|---|
| **Task ID** | T-013-02 |
| **Story** | [S1-013: Docker Containerization](../../../stories/stage1/S1-013-docker.md) |
| **Status** | Pending |

---

## Objective

Create a `docker-compose.prod.yaml` that runs the full stack (PostgreSQL + employee service) in containers with proper health checks and configuration.

---

## Checklist

- [ ] Create `docker-compose.prod.yaml` at repo root
- [ ] Add `postgres` service with named volume and health check
- [ ] Add `employee-svc` service built from Dockerfile
- [ ] Configure `depends_on` with health check condition
- [ ] Pass environment variables for DB connection (no hardcoded secrets)
- [ ] Configure health check for employee service
- [ ] Expose employee service on port 8080
- [ ] Verify: `docker compose -f docker-compose.yaml -f docker-compose.prod.yaml up` works
- [ ] Verify: employee service connects to Postgres and runs migrations
- [ ] Commit: `feat(S1-013): add production Docker Compose config`

---

## Details

### docker-compose.prod.yaml

<details>
<summary>Expand for guidance</summary>

```yaml
services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_DB: employee_db
      POSTGRES_USER: ${DB_USERNAME:-employee}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-employee_secret}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME:-employee} -d employee_db"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    ports:
      - "5432:5432"

  employee-svc:
    build:
      context: ./employee-service
      dockerfile: Dockerfile
    environment:
      SPRING_PROFILES_ACTIVE: prod
      DB_URL: jdbc:postgresql://postgres:5432/employee_db
      DB_USERNAME: ${DB_USERNAME:-employee}
      DB_PASSWORD: ${DB_PASSWORD:-employee_secret}
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 30s
    ports:
      - "8080:8080"

volumes:
  postgres-data:
```

**Key points:**
- **`depends_on` with condition**: Employee service waits for Postgres to be healthy before starting. Prevents connection errors during Flyway migrations.
- **Environment variable defaults**: `${DB_USERNAME:-employee}` provides defaults for local testing while allowing override in production.
- **Named volume**: `postgres-data` persists database data across `docker compose down` / `up` cycles.
- **No secrets in file**: Use env vars or a `.env` file (not committed to git).

</details>

### .env file (not committed)

<details>
<summary>Expand for guidance</summary>

Create a `.env` file at repo root (add to `.gitignore`):

```
DB_USERNAME=employee
DB_PASSWORD=employee_secret
```

Docker Compose automatically reads `.env` and substitutes variables.

</details>

---

## Development Log

| Date | Entry |
|---|---|
| — | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) — Section 6: Docker conventions
- [DESIGN.md](../../../../docs/DESIGN.md) — Section 5: Compose services
