# T-001-03: Docker Compose Dev Environment

| Field | Value |
|---|---|
| **Task ID** | T-001-03 |
| **Story** | [S1-001: Project Setup](../../../stories/stage1/S1-001-project-setup.md) |
| **Status** | Pending |

---

## Objective

Set up Docker Compose with PostgreSQL 17 for local development so the application has a running database to connect to, eliminating manual database installation and configuration.

---

## Checklist

- [ ] Create `docker-compose.yaml` at the repository root
- [ ] Add PostgreSQL 17 service with named volume
- [ ] Add health check for Postgres
- [ ] Configure `employee_db` database and schema
- [ ] Create `docker-compose.dev.yaml` override (port mapping, dev env vars)
- [ ] Verify: `docker compose up -d` starts Postgres
- [ ] Verify: app connects to Postgres with dev profile
- [ ] Commit: `chore(S1-001): add Docker Compose with PostgreSQL 17`

---

## Details

### Create docker-compose.yaml at the repository root

<details>
<summary>Expand for guidance</summary>

Create `docker-compose.yaml` in the repository root (`yatt/docker-compose.yaml`). This is the base Compose file defining infrastructure services. Per GUIDELINES.md Section 6, the base file lives at the repo root with override files for environment-specific configuration.

```yaml
services:
  postgres:
    image: postgres:17
    container_name: timetracker-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: postgres
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./infrastructure/postgres/init:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    restart: unless-stopped

volumes:
  postgres-data:
    name: timetracker-postgres-data
```

**Why this structure:**
- The base `docker-compose.yaml` defines the service without exposing ports. Port mapping is an environment concern handled by override files.
- `restart: unless-stopped` ensures the database survives host reboots during development.
- The named volume `postgres-data` persists data across container recreations. Using a named volume (vs. a bind mount) is the Docker best practice for database storage.

</details>

### Add PostgreSQL 17 service with named volume

<details>
<summary>Expand for guidance</summary>

The PostgreSQL 17 image is the official image from Docker Hub. The named volume `postgres-data` is defined at the top level of the Compose file and referenced in the service definition.

To completely reset the database (e.g., after a bad migration), remove the volume:

```bash
docker compose down -v
```

**Caution**: `-v` removes all named volumes, destroying all data. Use only when a fresh start is needed.

</details>

### Add health check for Postgres

<details>
<summary>Expand for guidance</summary>

The health check uses `pg_isready`, which is included in the PostgreSQL image. This allows dependent services (added in later stages) to use `depends_on` with a `condition: service_healthy` to wait for the database to be ready:

```yaml
depends_on:
  postgres:
    condition: service_healthy
```

The health check parameters:
- `interval: 10s` -- check every 10 seconds
- `timeout: 5s` -- fail the check if no response in 5 seconds
- `retries: 5` -- mark unhealthy after 5 consecutive failures
- `start_period: 30s` -- grace period for initial startup

</details>

### Configure employee_db database and schema

<details>
<summary>Expand for guidance</summary>

PostgreSQL initializes files in `/docker-entrypoint-initdb.d/` on first startup (when the data volume is empty). Create an init script:

**File**: `infrastructure/postgres/init/01-create-databases.sql`

```sql
-- Create the employee service database user and schema
-- This script runs only on first container initialization

CREATE USER employee_user WITH PASSWORD 'employee_pass';

CREATE DATABASE employee_db OWNER employee_user;

-- Connect to the new database and set up the schema
\c employee_db

-- The default 'public' schema will be used as 'employee_db' schema
-- Flyway will manage all objects within this database

GRANT ALL PRIVILEGES ON DATABASE employee_db TO employee_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO employee_user;
```

**Why a separate database rather than a schema in the default `postgres` database?**

Per DESIGN.md Section 3, each service owns its own schema (logical isolation). Using a separate database provides stronger isolation than a schema within the shared `postgres` database. The init script creates:

1. A dedicated user (`employee_user`) with limited privileges.
2. A dedicated database (`employee_db`) owned by that user.

This matches the datasource URL in `application-dev.yaml`: `jdbc:postgresql://localhost:5432/employee_db`.

</details>

### Create docker-compose.dev.yaml override

<details>
<summary>Expand for guidance</summary>

The dev override exposes the PostgreSQL port to the host and sets dev-friendly environment variables:

**File**: `docker-compose.dev.yaml`

```yaml
services:
  postgres:
    ports:
      - "5432:5432"
    environment:
      POSTGRES_LOG_STATEMENT: all
```

To start the dev environment, use both files:

```bash
docker compose -f docker-compose.yaml -f docker-compose.dev.yaml up -d
```

**Tip**: Create a shortcut by adding this to a `Makefile` or documenting it in the project README:

```bash
# Shorthand (if COMPOSE_FILE env var is set)
export COMPOSE_FILE=docker-compose.yaml:docker-compose.dev.yaml
docker compose up -d
```

`POSTGRES_LOG_STATEMENT: all` logs every SQL statement to the container logs, useful for debugging during development. This is not set in the base file because it would be too noisy in production.

Port `5432` is exposed only in the dev override. In production, services connect via Docker networking (service name resolution) and ports are not exposed to the host.

</details>

### Verify Postgres starts

<details>
<summary>Expand for guidance</summary>

```bash
# Start the stack
docker compose -f docker-compose.yaml -f docker-compose.dev.yaml up -d

# Check status
docker compose ps

# Expected output:
# NAME                    ... STATUS          PORTS
# timetracker-postgres    ... Up (healthy)    0.0.0.0:5432->5432/tcp

# Verify the employee_db database exists
docker exec timetracker-postgres psql -U postgres -c "\l" | grep employee_db

# Connect as employee_user
docker exec -it timetracker-postgres psql -U employee_user -d employee_db -c "SELECT current_database(), current_user;"
```

</details>

### Verify app connects to Postgres

<details>
<summary>Expand for guidance</summary>

With Docker Compose running, start the application with the dev profile:

```bash
cd employee-service
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

The application should start successfully. Look for:

1. No datasource connection errors.
2. Flyway migration output (if Flyway config is in place from T-002-01, otherwise this will come later).
3. The application listens on port 8080.

If the application fails with a connection refused error, verify:
- Docker Compose is running: `docker compose ps`
- Port 5432 is exposed: `docker compose port postgres 5432`
- The credentials in `application-dev.yaml` match the init script (`employee_user` / `employee_pass`)

</details>

### Commit

<details>
<summary>Expand for guidance</summary>

```bash
git add docker-compose.yaml docker-compose.dev.yaml infrastructure/
git commit -m "chore(S1-001): add Docker Compose with PostgreSQL 17"
```

</details>

---

## Development Log

| Date | Entry |
|---|---|
| --- | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) -- Section 6 (Docker and container conventions: Compose at repo root, named volumes, health checks)
- [DESIGN.md](../../../../docs/DESIGN.md) -- Section 3 (database strategy: single instance, schema isolation), Section 5 (container architecture)
