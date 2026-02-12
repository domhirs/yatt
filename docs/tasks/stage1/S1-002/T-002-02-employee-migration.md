# T-002-02: Employee Table Migration

| Field | Value |
|---|---|
| **Task ID** | T-002-02 |
| **Story** | [S1-002: Database Schema](../../../stories/stage1/S1-002-database-schema.md) |
| **Status** | Pending |

---

## Objective

Create the `employee` table via Flyway migration matching the PRD data model, with all constraints and indexes needed for data integrity and query performance.

---

## Checklist

- [ ] Write `V1__create_employee_table.sql` (replaces the placeholder from T-002-01)
- [ ] Include all columns from the data model
- [ ] Add constraints (PK, FK, UNIQUE email, NOT NULL, CHECK status)
- [ ] Add indexes (email unique, department, manager_id)
- [ ] Use `gen_random_uuid()` for default UUID generation
- [ ] Verify table creation on app startup
- [ ] Verify constraints work (try inserting invalid data via `psql`)
- [ ] Commit: `feat(S1-002): create employee table migration`

---

## Details

### Write V1__create_employee_table.sql

<details>
<summary>Expand for guidance</summary>

Replace the placeholder `V1__init.sql` from T-002-01 with the actual migration. Since the placeholder has already been applied, you have two options:

**Option A (clean start):** Destroy the volume and recreate everything.
```bash
docker compose down -v
docker compose -f docker-compose.yaml -f docker-compose.dev.yaml up -d
```
Then replace `V1__init.sql` with the employee table migration.

**Option B (new migration):** Keep `V1__init.sql` as-is and create `V2__create_employee_table.sql`. This is the "proper" way in a shared environment, but since we are in local development with no other users, Option A is simpler.

**Recommended: Option A** -- for a clean learning project, start with the real migration as V1.

**File**: `employee-service/src/main/resources/db/migration/V1__create_employee_table.sql`

```sql
-- V1__create_employee_table.sql
-- Creates the employee table for the employee-service
-- See PRD.md for the data model specification

CREATE TABLE employee (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name  VARCHAR(100)    NOT NULL,
    last_name   VARCHAR(100)    NOT NULL,
    email       VARCHAR(255)    NOT NULL,
    department  VARCHAR(100)    NOT NULL,
    role        VARCHAR(100)    NOT NULL,
    hire_date   DATE            NOT NULL,
    manager_id  UUID            REFERENCES employee(id),
    status      VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE',
    version     BIGINT          NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),

    CONSTRAINT chk_employee_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT uq_employee_email   UNIQUE (email)
);

-- Indexes for common query patterns
CREATE INDEX idx_employee_department ON employee (department);
CREATE INDEX idx_employee_manager_id ON employee (manager_id);
CREATE INDEX idx_employee_status     ON employee (status);
```

</details>

### Include all columns from data model

<details>
<summary>Expand for guidance</summary>

The columns map directly to the PRD data model:

| PRD Field | Column | SQL Type | Notes |
|---|---|---|---|
| `id` | `id` | `UUID` | PK, auto-generated via `gen_random_uuid()` |
| `first_name` | `first_name` | `VARCHAR(100)` | NOT NULL per PRD "not blank, max 100" |
| `last_name` | `last_name` | `VARCHAR(100)` | NOT NULL per PRD "not blank, max 100" |
| `email` | `email` | `VARCHAR(255)` | UNIQUE, NOT NULL per PRD "unique, valid email" |
| `department` | `department` | `VARCHAR(100)` | NOT NULL per PRD "not blank" |
| `role` | `role` | `VARCHAR(100)` | NOT NULL per PRD "not blank" |
| `hire_date` | `hire_date` | `DATE` | NOT NULL per PRD "not null, not in future" |
| `manager_id` | `manager_id` | `UUID` | FK to `employee(id)`, nullable (CEO has no manager) |
| `status` | `status` | `VARCHAR(20)` | CHECK constraint, defaults to 'ACTIVE' |
| `created_at` | `created_at` | `TIMESTAMPTZ` | Auto-set on insert |
| `updated_at` | `updated_at` | `TIMESTAMPTZ` | Auto-set on insert, updated by application |

**Additional column: `version`**

The `version` column (`BIGINT DEFAULT 0`) supports **optimistic locking** via JPA's `@Version` annotation. When two concurrent requests try to update the same employee, Hibernate uses this column to detect conflicts and throw `OptimisticLockException`, preventing lost updates. This is essential for data integrity in a REST API.

</details>

### Add constraints

<details>
<summary>Expand for guidance</summary>

**Primary Key**: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `gen_random_uuid()` is a PostgreSQL built-in function (since v13) that generates RFC 4122 v4 UUIDs. No extension required.

**Foreign Key**: `manager_id UUID REFERENCES employee(id)`
- Self-referencing FK. An employee's manager must be an existing employee.
- `ON DELETE` is intentionally left as the default (`NO ACTION`), meaning you cannot delete an employee who is someone's manager. This matches the PRD rule: "Cannot delete an employee who is a manager of others (must reassign first)."

**Unique constraint**: `CONSTRAINT uq_employee_email UNIQUE (email)`
- Named constraints make error messages more readable and debugging easier.
- The unique constraint automatically creates a unique index, so a separate `CREATE UNIQUE INDEX` on email is not needed.

**Check constraint**: `CONSTRAINT chk_employee_status CHECK (status IN ('ACTIVE', 'INACTIVE'))`
- Enforces the domain values at the database level, providing defense-in-depth beyond application validation.

**NOT NULL constraints**: Applied to all required fields. Only `manager_id` is nullable (for top-level employees with no manager).

**Why enforce constraints at the database level when the application also validates?**

Defense-in-depth. Application validation provides user-friendly error messages, but bugs, direct database access, or future services could bypass it. Database constraints are the last line of defense for data integrity.

</details>

### Add indexes

<details>
<summary>Expand for guidance</summary>

```sql
CREATE INDEX idx_employee_department ON employee (department);
CREATE INDEX idx_employee_manager_id ON employee (manager_id);
CREATE INDEX idx_employee_status     ON employee (status);
```

**Why these indexes:**

| Index | Purpose |
|---|---|
| `uq_employee_email` | Already created by the UNIQUE constraint. Supports email lookups and uniqueness checks. |
| `idx_employee_department` | Supports filtering employees by department (PRD: "List employees with filtering by department"). |
| `idx_employee_manager_id` | Supports org chart queries: "find all direct reports of a manager" (PRD: "retrieve direct reports"). |
| `idx_employee_status` | Supports filtering by active/inactive status. Often combined with other filters. |

**What about a name search index?**

The PRD mentions "Search employees by name (full-text or LIKE)." A B-tree index does not help with `LIKE '%pattern%'` queries. Options for later:
- `pg_trgm` extension with a GIN trigram index for LIKE/ILIKE queries.
- Full-text search with `tsvector` and `tsquery`.

These will be added when implementing S1-010 (Search Employees). Don't add them now -- YAGNI.

</details>

### Use gen_random_uuid()

<details>
<summary>Expand for guidance</summary>

`gen_random_uuid()` is built into PostgreSQL 13+ and generates version 4 (random) UUIDs. No extension is required.

**Why UUID v4 as primary key instead of SERIAL/BIGINT?**

| | UUID | SERIAL/BIGINT |
|---|---|---|
| **Pros** | Globally unique, no coordination needed between services, safe to expose in URLs, merge-friendly | Smaller (8 bytes vs 16), faster index lookups, human-readable |
| **Cons** | Larger, index fragmentation due to randomness, not human-readable | Requires coordination (sequence), leaks ordering info, problematic in distributed systems |

For a microservices architecture where IDs may need to be generated by different services or exposed in URLs, UUIDs are the standard choice. The performance difference is negligible at the scale of this project.

**Note on UUID v7**: PostgreSQL does not natively support UUID v7 (time-ordered) yet. If index fragmentation becomes a concern, consider a UUID v7 generator at the application level. For now, v4 is sufficient.

</details>

### Verify table creation

<details>
<summary>Expand for guidance</summary>

After starting the application (which triggers Flyway), verify the table exists:

```bash
# Check table structure
docker exec -it timetracker-postgres psql -U employee_user -d employee_db -c "\d employee"
```

Expected output:

```
                           Table "public.employee"
   Column    |           Type           | Nullable |      Default
-------------+--------------------------+----------+---------------------
 id          | uuid                     | not null | gen_random_uuid()
 first_name  | character varying(100)   | not null |
 last_name   | character varying(100)   | not null |
 email       | character varying(255)   | not null |
 department  | character varying(100)   | not null |
 role        | character varying(100)   | not null |
 hire_date   | date                     | not null |
 manager_id  | uuid                     |          |
 status      | character varying(20)    | not null | 'ACTIVE'
 version     | bigint                   | not null | 0
 created_at  | timestamp with time zone | not null | now()
 updated_at  | timestamp with time zone | not null | now()
Indexes:
    "employee_pkey" PRIMARY KEY, btree (id)
    "uq_employee_email" UNIQUE CONSTRAINT, btree (email)
    "idx_employee_department" btree (department)
    "idx_employee_manager_id" btree (manager_id)
    "idx_employee_status" btree (status)
Check constraints:
    "chk_employee_status" CHECK (status::text = ANY (ARRAY['ACTIVE'::text, 'INACTIVE'::text]))
Foreign-key constraints:
    "employee_manager_id_fkey" FOREIGN KEY (manager_id) REFERENCES employee(id)
Referenced by:
    TABLE "employee" CONSTRAINT "employee_manager_id_fkey" FOREIGN KEY (manager_id) REFERENCES employee(id)
```

</details>

### Verify constraints work

<details>
<summary>Expand for guidance</summary>

Test that constraints reject invalid data:

```bash
docker exec -it timetracker-postgres psql -U employee_user -d employee_db
```

```sql
-- Test 1: Duplicate email should fail
INSERT INTO employee (first_name, last_name, email, department, role, hire_date)
VALUES ('Alice', 'Smith', 'alice@example.com', 'Engineering', 'Developer', '2024-01-15');

INSERT INTO employee (first_name, last_name, email, department, role, hire_date)
VALUES ('Bob', 'Jones', 'alice@example.com', 'Engineering', 'Developer', '2024-02-01');
-- Expected: ERROR: duplicate key value violates unique constraint "uq_employee_email"

-- Test 2: Invalid status should fail
INSERT INTO employee (first_name, last_name, email, department, role, hire_date, status)
VALUES ('Charlie', 'Brown', 'charlie@example.com', 'HR', 'Manager', '2024-03-01', 'DELETED');
-- Expected: ERROR: new row violates check constraint "chk_employee_status"

-- Test 3: NULL required field should fail
INSERT INTO employee (first_name, last_name, email, department, role, hire_date)
VALUES (NULL, 'Wilson', 'dave@example.com', 'Sales', 'Rep', '2024-04-01');
-- Expected: ERROR: null value in column "first_name" violates not-null constraint

-- Test 4: Invalid manager_id should fail
INSERT INTO employee (first_name, last_name, email, department, role, hire_date, manager_id)
VALUES ('Eve', 'Davis', 'eve@example.com', 'Finance', 'Analyst', '2024-05-01',
        '00000000-0000-0000-0000-000000000000');
-- Expected: ERROR: insert or update violates foreign key constraint "employee_manager_id_fkey"

-- Clean up test data
DELETE FROM employee;
```

All four tests should fail with the expected constraint violation errors, confirming the schema enforces data integrity.

</details>

### Commit

<details>
<summary>Expand for guidance</summary>

```bash
git add employee-service/src/main/resources/db/migration/V1__create_employee_table.sql
git commit -m "feat(S1-002): create employee table migration"
```

Note the prefix is `feat` (not `chore`) because this adds a user-facing capability: the database schema that underpins the employee API.

</details>

---

## Development Log

| Date | Entry |
|---|---|
| --- | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) -- Section 1 (Java 25 coding standards: immutability, naming)
- [DESIGN.md](../../../../docs/DESIGN.md) -- Section 3 (database strategy: schema isolation, migrations, UUID primary keys)
- [PRD.md](../../../../docs/PRD.md) -- Data model (initial), validation rules
