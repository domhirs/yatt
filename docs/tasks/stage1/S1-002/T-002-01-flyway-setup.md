# T-002-01: Flyway Setup

| Field | Value |
|---|---|
| **Task ID** | T-002-01 |
| **Story** | [S1-002: Database Schema](../../../stories/stage1/S1-002-database-schema.md) |
| **Status** | Pending |

---

## Objective

Configure Flyway for automatic schema migrations on application startup so that database schema changes are versioned, repeatable, and applied without manual intervention.

---

## Checklist

- [ ] Confirm `flyway-core` and `flyway-database-postgresql` dependencies are present
- [ ] Configure Flyway in `application.yaml`
- [ ] Create `src/main/resources/db/migration/` directory
- [ ] Create placeholder `V1__init.sql`
- [ ] Verify Flyway runs on startup (check logs for "Successfully applied" message)
- [ ] Verify `flyway_schema_history` table exists
- [ ] Commit: `chore(S1-002): configure Flyway for schema migrations`

---

## Details

### Confirm flyway-core dependency

<details>
<summary>Expand for guidance</summary>

The Flyway dependencies should already be in `pom.xml` from T-001-01:

```xml
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-database-postgresql</artifactId>
</dependency>
```

Since Flyway 10, database-specific modules are separate. `flyway-database-postgresql` is required for PostgreSQL support. Without it, Flyway will fail at startup with an error about unsupported database type.

Spring Boot auto-configures Flyway when `flyway-core` is on the classpath and a datasource is available. No `@EnableFlyway` annotation or manual bean configuration is needed.

</details>

### Configure Flyway in application.yaml

<details>
<summary>Expand for guidance</summary>

Add Flyway configuration to the common `application.yaml`:

```yaml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
    schemas: public
    default-schema: public
    baseline-on-migrate: false
    validate-on-migrate: true
```

**What each setting does:**

| Setting | Value | Purpose |
|---|---|---|
| `enabled` | `true` | Explicit opt-in (it is true by default, but being explicit is clearer) |
| `locations` | `classpath:db/migration` | Where Flyway looks for migration scripts |
| `schemas` | `public` | The schema Flyway manages. We use `public` within the `employee_db` database |
| `default-schema` | `public` | The schema where `flyway_schema_history` is created |
| `baseline-on-migrate` | `false` | Do not auto-baseline. Fail if the history table is missing and there are applied migrations |
| `validate-on-migrate` | `true` | Verify checksums of already-applied migrations match the local files |

**Why `public` schema instead of `employee_db` schema?**

Per DESIGN.md Section 3, each service owns its own *database* (`employee_db`). Within that database, we use the default `public` schema. The schema isolation between services is achieved at the database level, not the schema level within a single database. This is simpler and avoids needing to set `search_path` on every connection.

If you later need to use a non-default schema name, update `spring.flyway.schemas` and also set `spring.jpa.properties.hibernate.default_schema` to match.

</details>

### Create db/migration directory

<details>
<summary>Expand for guidance</summary>

Create the migration directory structure:

```
employee-service/
  src/
    main/
      resources/
        db/
          migration/
            V1__init.sql
```

On the filesystem:

```bash
mkdir -p employee-service/src/main/resources/db/migration
```

Flyway scans this directory on startup and applies any unapplied migrations in version order.

</details>

### Create placeholder V1__init.sql

<details>
<summary>Expand for guidance</summary>

Create a minimal placeholder migration to verify Flyway is working. This will be replaced by the actual employee table migration in T-002-02.

**File**: `employee-service/src/main/resources/db/migration/V1__init.sql`

```sql
-- V1__init.sql
-- Placeholder migration to verify Flyway setup
-- This will be replaced by the employee table migration in T-002-02

SELECT 1;
```

**Flyway naming convention:**

```
V{version}__{description}.sql
```

- `V` -- versioned migration prefix (vs. `R` for repeatable)
- `{version}` -- numeric version (1, 2, 3, ...) or dotted (1.1, 1.2)
- `__` -- double underscore separator (required)
- `{description}` -- human-readable description (underscores become spaces in the log)
- `.sql` -- file extension

Examples:
- `V1__create_employee_table.sql`
- `V2__add_department_index.sql`
- `V3__seed_employee_data.sql`

**Important**: Once a migration has been applied, never modify it. Flyway checksums applied migrations and will fail on startup if a checksum mismatch is detected. To fix a mistake, create a new migration.

</details>

### Verify Flyway runs on startup

<details>
<summary>Expand for guidance</summary>

Start the application with Docker Compose running:

```bash
# Ensure Postgres is running
docker compose -f docker-compose.yaml -f docker-compose.dev.yaml up -d

# Start the app
cd employee-service
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

Look for Flyway output in the application logs:

```
... Flyway Community Edition ...
... Database: jdbc:postgresql://localhost:5432/employee_db (PostgreSQL 17.x)
... Successfully validated 1 migration
... Creating Schema History table "public"."flyway_schema_history"
... Current version of schema "public": << Empty Schema >>
... Migrating schema "public" to version "1 - init"
... Successfully applied 1 migration to schema "public" (execution time ...)
```

If you see these log lines, Flyway is correctly configured and running migrations on startup.

</details>

### Verify flyway_schema_history table exists

<details>
<summary>Expand for guidance</summary>

Connect to the database and check that Flyway created its tracking table:

```bash
docker exec -it timetracker-postgres psql -U employee_user -d employee_db -c \
  "SELECT installed_rank, version, description, type, checksum, installed_on, success
   FROM flyway_schema_history;"
```

Expected output:

```
 installed_rank | version | description | type |  checksum   |     installed_on      | success
----------------+---------+-------------+------+-------------+-----------------------+---------
              1 | 1       | init        | SQL  | <checksum>  | 2026-02-12 ...        | t
```

This confirms:
1. The `flyway_schema_history` table was created.
2. The `V1__init.sql` migration was applied successfully.
3. The version, description, and checksum are tracked.

</details>

### Commit

<details>
<summary>Expand for guidance</summary>

```bash
git add employee-service/src/main/resources/db/migration/V1__init.sql
git add employee-service/src/main/resources/application.yaml
git commit -m "chore(S1-002): configure Flyway for schema migrations"
```

</details>

---

## Development Log

| Date | Entry |
|---|---|
| --- | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) -- Section 2 (Spring Boot 4.0 conventions)
- [DESIGN.md](../../../../docs/DESIGN.md) -- Section 3 (database strategy: migrations with Flyway)
