import { Story } from '../../models/step.model';

export const S1_002: Story = {
  id: 'S1-002',
  title: 'S1-002 — Database Schema',
  tasks: [
    {
      id: 'T-002-01',
      title: 'Configure Flyway',
      description:
        'Flyway is a database migration tool that tracks which SQL scripts have been run against a ' +
        'database and runs any that have not. Think of it like git for your database schema: every ' +
        'change is a versioned file, you can see the full history of what changed and when, and you ' +
        'can reliably reproduce the exact same schema in any environment.\n\n' +
        'Without a migration tool, database changes are fragile. A developer changes the schema ' +
        'manually on their laptop, forgets to update staging, and the deployment to production fails ' +
        'because a column is missing. Flyway solves this by making schema changes code: you write a ' +
        'SQL file, commit it, and every environment runs it automatically on the next startup.\n\n' +
        'Spring Boot auto-detects Flyway when the flyway-core dependency is on the classpath and a ' +
        'datasource is configured. No annotation or @EnableFlyway is needed. On every startup, ' +
        'Flyway compares the migration files in db/migration/ against a tracking table it maintains ' +
        'called flyway_schema_history. Any migration not recorded there is executed in version order.\n\n' +
        'The validate-on-migrate: true setting is a safety net. Flyway checksums every migration ' +
        'file when it runs it. On subsequent startups, it re-checksums the files and verifies they ' +
        'match. If someone edited an already-applied migration file (a common mistake), Flyway ' +
        'detects the mismatch and refuses to start the application.',
      concepts: [
        {
          term: 'Database migration',
          explanation:
            'A migration is a versioned SQL script that makes a specific change to the database schema ' +
            '(creating a table, adding a column, adding an index). Migrations are run in order, once ' +
            'each, and never modified after being applied. This guarantees that every database — ' +
            'developer laptops, CI environments, production — has exactly the same schema.',
        },
        {
          term: 'flyway_schema_history',
          explanation:
            'Flyway creates this table automatically in your database on first run. It records every ' +
            'migration that has been applied: the version number, description, checksum, and whether it ' +
            'succeeded. When Flyway starts, it reads this table to know which migrations are pending. ' +
            'You should never manually modify this table.',
        },
        {
          term: 'Versioned migrations (V prefix)',
          explanation:
            'Files named V1__description.sql, V2__description.sql are versioned migrations. The V is ' +
            'followed by a version number, then two underscores, then a description. They run exactly ' +
            'once in version order. Once applied and committed to git, the file content must never ' +
            'change — Flyway will detect the altered checksum and refuse to start.',
        },
        {
          term: 'Repeatable migrations (R prefix)',
          explanation:
            'Files named R__description.sql are repeatable migrations. They run (or re-run) whenever ' +
            'their file content changes. They are ideal for seed data, views, and stored procedures that ' +
            'you want to keep up to date. Repeatable migrations run AFTER all versioned migrations on ' +
            'each startup where their checksum has changed.',
        },
        {
          term: 'validate-on-migrate',
          explanation:
            'When true (the default), Flyway recalculates the checksum of every applied migration file ' +
            'at startup and compares it to the stored value. If a developer edited an already-applied ' +
            'migration (trying to fix a mistake), Flyway detects this and throws an error instead of ' +
            'silently running an inconsistent schema.',
        },
      ],
      checklist: [
        'Confirm flyway-core and flyway-database-postgresql are both present in pom.xml (added in S1-001). The PostgreSQL-specific module is required since Flyway 10.',
        'Open application.yaml and add the spring.flyway block shown in the example. The locations: classpath:db/migration tells Flyway where to look for migration files.',
        'Create the directory src/main/resources/db/migration/ — this is where all your SQL migration files will live.',
        'Create the file src/main/resources/db/migration/V1__init.sql with just "SELECT 1;" — this is a placeholder to verify Flyway runs before you create any real tables.',
        'Start the app with ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev. Look for the log line "Successfully applied 1 migration to schema public" — this confirms Flyway ran.',
        'Verify the tracking table was created: run the Docker exec command from the example to query flyway_schema_history. You should see one row for V1.',
        'Commit: chore(S1-002): configure Flyway for schema migrations',
      ],
      examples: [
        {
          lang: 'yaml',
          label: 'application.yaml — Flyway configuration block',
          code: `spring:
  flyway:
    # Enable Flyway (true is the default when flyway-core is on the classpath,
    # but being explicit makes the intent clear).
    enabled: true

    # Where to find migration SQL files.
    # "classpath:db/migration" maps to src/main/resources/db/migration/
    locations: classpath:db/migration

    # The PostgreSQL schema to manage. "public" is the default PostgreSQL schema.
    schemas: public
    default-schema: public

    # baseline-on-migrate: false means Flyway will FAIL if you point it at a database
    # that already has tables but no flyway_schema_history table.
    # Keep this false — it forces you to be explicit about pre-existing databases.
    baseline-on-migrate: false

    # validate-on-migrate: true is the default and should stay enabled.
    # It detects if someone edited an already-applied migration file.
    validate-on-migrate: true`,
        },
        {
          lang: 'sql',
          label: 'V1__init.sql — placeholder to verify Flyway runs',
          code: `-- V1__init.sql
-- Flyway naming convention: V{version}__{description}.sql
--   V     = versioned migration (runs once)
--   1     = version number (determines run order)
--   __    = double underscore separator (required)
--   init  = human-readable description
--
-- CRITICAL RULE: Never modify this file after it has been applied to any database.
-- Flyway stores a checksum of the file content. If you change it, Flyway will
-- detect the mismatch and refuse to start the application.
--
-- This file is a placeholder. We just verify Flyway can connect and run SQL.
SELECT 1;`,
        },
        {
          lang: 'bash',
          label: 'Verify flyway_schema_history after first run',
          code: `# After starting the app, connect to the database inside Docker
# and query the Flyway tracking table.
docker exec -it timetracker-postgres psql -U employee_user -d employee_db \\
  -c "SELECT installed_rank, version, description, success FROM flyway_schema_history;"

# Expected output:
#  installed_rank | version | description | success
# ----------------+---------+-------------+---------
#               1 | 1       | init        | t
# (1 row)
#
# "success: t" means the migration ran successfully.
# If you see "success: f", check the application logs for the SQL error.`,
        },
      ],
      links: [
        { label: 'Flyway Documentation', url: 'https://documentation.red-gate.com/flyway' },
        { label: 'Spring Boot — Flyway Auto-configuration', url: 'https://docs.spring.io/spring-boot/reference/data/sql.html#data.sql.flyway' },
        { label: 'Flyway — Concepts: Migrations', url: 'https://documentation.red-gate.com/flyway/flyway-cli-and-api/concepts/migrations' },
      ],
    },
    {
      id: 'T-002-02',
      title: 'Employee Table Migration',
      description:
        'This migration creates the employee table that Hibernate will map to. It is the single ' +
        'source of truth for the schema — the JPA entity you write in S1-004 must match this ' +
        'table exactly. If they differ, Hibernate will throw a "Schema-validation" error at startup.\n\n' +
        'PostgreSQL data types matter here. UUID is the right choice for a primary key in a ' +
        'distributed system: UUIDs are globally unique and can be generated without a central ' +
        'authority (unlike auto-increment integers). The gen_random_uuid() function is built into ' +
        'PostgreSQL 13+ and generates a random UUID — matching what Hibernate will do from the ' +
        'Java side with @GeneratedValue(strategy = GenerationType.UUID).\n\n' +
        'The manager_id column is a self-referencing foreign key — it references the same table\'s ' +
        'id column. This models the org chart: an employee can have a manager who is also an ' +
        'employee. The column is nullable (no NOT NULL constraint) because top-level employees ' +
        'like the CEO have no manager.\n\n' +
        'Indexes deserve attention. Every column you filter or sort by frequently should have an ' +
        'index. Without an index, a query like WHERE email = ? performs a full table scan — ' +
        'reading every row. With an index, PostgreSQL jumps directly to the matching row. The ' +
        'tradeoff: indexes make reads faster but writes slightly slower (the index must be ' +
        'maintained on every INSERT and UPDATE).',
      concepts: [
        {
          term: 'UUID primary key',
          explanation:
            'A UUID (Universally Unique Identifier) is a 128-bit random value like ' +
            '"550e8400-e29b-41d4-a716-446655440000". Unlike auto-incrementing integers (1, 2, 3...), ' +
            'UUIDs can be generated independently on any machine without a central counter. This is ' +
            'important for distributed systems where multiple services create records simultaneously. ' +
            'gen_random_uuid() generates cryptographically random UUIDs.',
        },
        {
          term: 'NOT NULL constraint',
          explanation:
            'Adding NOT NULL to a column tells PostgreSQL to reject any INSERT or UPDATE that tries ' +
            'to leave that column empty. This is a database-level guarantee that complements (and ' +
            'reinforces) the @NotBlank validation in your Java DTOs. Defence in depth: even if the ' +
            'Java validation is bypassed, the database enforces data integrity.',
        },
        {
          term: 'UNIQUE constraint',
          explanation:
            'The UNIQUE constraint on email tells PostgreSQL to reject any INSERT or UPDATE that ' +
            'would result in two rows having the same email value. This is a database-level ' +
            'guarantee that email addresses are unique. Your Java service also checks this with ' +
            'existsByEmail(), but the database constraint is the ultimate source of truth.',
        },
        {
          term: 'Self-referencing foreign key',
          explanation:
            'manager_id REFERENCES employee(id) creates a foreign key that points to the same table. ' +
            'This is how you model a hierarchy in SQL: an employee row can reference another employee ' +
            'row as their manager. The ON DELETE SET NULL or ON DELETE RESTRICT behaviour controls ' +
            'what happens when you delete the manager row.',
        },
        {
          term: 'TIMESTAMPTZ (timestamp with time zone)',
          explanation:
            'TIMESTAMPTZ stores timestamps in UTC and automatically converts them to the session ' +
            'time zone when you read them. Always use TIMESTAMPTZ instead of TIMESTAMP in PostgreSQL. ' +
            'Plain TIMESTAMP stores the wall-clock time with no time zone information, which causes ' +
            'subtle bugs when servers or users are in different time zones.',
        },
        {
          term: 'Database index',
          explanation:
            'An index is a separate data structure (like a book\'s index) that PostgreSQL maintains ' +
            'alongside a table to make queries faster. Without an index on email, finding one employee ' +
            'by email requires scanning all rows. With an index, PostgreSQL jumps directly to the match. ' +
            'Indexes cost disk space and slow down writes slightly — only index columns you actually query by.',
        },
      ],
      checklist: [
        'Create the file src/main/resources/db/migration/V2__create_employee_table.sql — the version number 2 ensures it runs after V1.',
        'Copy the CREATE TABLE statement from the example. Pay attention to: UUID DEFAULT gen_random_uuid() (PostgreSQL generates the ID), NOT NULL on required fields, and the nullable manager_id (no NOT NULL means null is allowed).',
        'Add all four CREATE INDEX statements at the bottom — one for email (frequently looked up), one for status (frequently filtered), one for department, and one for manager_id (used in the org chart query).',
        'Start the app and look for "Successfully applied 2 migrations" in the logs. If Hibernate then shows "Schema-validation: missing table [employee]", that means the migration did not apply — check for SQL syntax errors.',
        'Verify the table was created: connect with Docker exec and run \\d employee to see the column definitions.',
        'Commit: feat(S1-002): create employee table migration',
      ],
      examples: [
        {
          lang: 'sql',
          label: 'V2__create_employee_table.sql — full schema',
          code: `-- V2__create_employee_table.sql
-- Creates the employee table. This is the source of truth for the schema.
-- The JPA entity (Employee.java) must match this table exactly.
-- Never modify this file after it has been applied — add a V3 instead.

CREATE TABLE employee (
    -- UUID primary key. gen_random_uuid() is a PostgreSQL built-in that generates
    -- a random UUID. DEFAULT means PostgreSQL generates it if you don't provide one.
    -- This matches @GeneratedValue(strategy = GenerationType.UUID) in the JPA entity.
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- VARCHAR(100) allows up to 100 characters. NOT NULL enforces at the DB level.
    -- These match @Column(nullable = false, length = 100) in the entity.
    first_name  VARCHAR(100)    NOT NULL,
    last_name   VARCHAR(100)    NOT NULL,

    -- Email can be up to 255 characters. UNIQUE means no two employees share an email.
    -- PostgreSQL automatically creates an index for UNIQUE constraints.
    email       VARCHAR(255)    NOT NULL UNIQUE,

    -- Department and role are free-text, limited to 100 characters.
    department  VARCHAR(100)    NOT NULL,
    role        VARCHAR(100)    NOT NULL,

    -- DATE stores only the date (year, month, day) — no time component.
    -- Matches LocalDate in the Java entity.
    hire_date   DATE            NOT NULL,

    -- Self-referencing foreign key. This column can be NULL (no manager for the CEO).
    -- REFERENCES employee(id) means: the value must exist as an id in this same table.
    -- If you try to insert a manager_id that doesn't exist, PostgreSQL rejects the INSERT.
    manager_id  UUID            REFERENCES employee(id),

    -- Status is stored as a string matching the EmployeeStatus enum values: 'ACTIVE' or 'INACTIVE'.
    -- DEFAULT 'ACTIVE' means new employees start active unless you specify otherwise.
    -- This matches @Enumerated(EnumType.STRING) in the entity.
    status      VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE',

    -- Optimistic locking counter. Hibernate increments this on every UPDATE.
    -- DEFAULT 0 means all new rows start at version 0.
    version     BIGINT          NOT NULL DEFAULT 0,

    -- Audit timestamps. DEFAULT NOW() sets them automatically on INSERT.
    -- TIMESTAMPTZ = timestamp with time zone (always stored as UTC).
    -- "updatable = false" in the JPA entity ensures created_at is never changed after insert.
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Indexes: create an index for every column you will query or filter by frequently.
-- Without these, every query against employee would scan all rows (slow with millions of records).

-- Email is looked up for uniqueness checks — index ensures O(log n) lookup.
CREATE INDEX idx_employee_email      ON employee(email);

-- Status is a common filter ("show all ACTIVE employees").
CREATE INDEX idx_employee_status     ON employee(status);

-- Department is used for grouping and filtering in the list endpoint.
CREATE INDEX idx_employee_department ON employee(department);

-- manager_id is used for org chart queries ("get all direct reports of manager X").
CREATE INDEX idx_employee_manager_id ON employee(manager_id);`,
        },
        {
          lang: 'bash',
          label: 'Verify the table was created correctly',
          code: `# Connect to the database inside the Docker container
docker exec -it timetracker-postgres psql -U employee_user -d employee_db

# Inside psql, describe the employee table structure:
\\d employee

# Expected output shows all columns, types, and constraints:
#                        Table "public.employee"
#    Column    |            Type             | Nullable |      Default
# -------------+-----------------------------+----------+-------------------
#  id          | uuid                        | not null | gen_random_uuid()
#  first_name  | character varying(100)      | not null |
#  email       | character varying(255)      | not null |
#  ...

# Also verify the Flyway history shows both migrations:
SELECT installed_rank, version, description, success
FROM flyway_schema_history
ORDER BY installed_rank;`,
        },
      ],
      links: [
        { label: 'PostgreSQL — CREATE TABLE', url: 'https://www.postgresql.org/docs/current/sql-createtable.html' },
        { label: 'PostgreSQL — Data Types', url: 'https://www.postgresql.org/docs/current/datatype.html' },
        { label: 'Flyway — Versioned Migrations', url: 'https://documentation.red-gate.com/flyway/flyway-cli-and-api/concepts/migrations#VersionedMigrations' },
      ],
    },
    {
      id: 'T-002-03',
      title: 'Seed Data',
      description:
        'Seed data is a small, realistic set of records inserted into the database so you have ' +
        'something to work with during development. Without seed data, every time you restart the ' +
        'database you would need to manually call the create-employee API several times before you ' +
        'could test the list or org-chart endpoints.\n\n' +
        'Flyway\'s repeatable migrations (R__ prefix) are the right tool for seed data. Unlike ' +
        'versioned migrations (V__ prefix) that run once, a repeatable migration re-runs whenever ' +
        'its file content changes. This means you can update your seed data by editing the file, ' +
        'and Flyway will automatically replace it on the next startup.\n\n' +
        'The key to making a repeatable migration safe to re-run is the TRUNCATE TABLE ... CASCADE ' +
        'statement at the top. Without it, re-running the migration would try to INSERT the same ' +
        'rows again and fail with a UNIQUE constraint violation (duplicate email). TRUNCATE wipes ' +
        'the table first, making the migration idempotent — running it ten times has the same ' +
        'result as running it once.\n\n' +
        'The seed data models a small org chart: Alice is the top-level manager (managerId = NULL), ' +
        'Bob and Carol both report to Alice. This gives you data to test the org-chart relationship ' +
        'queries, the PATCH endpoint (update Bob\'s role), and the DELETE guard (you cannot delete ' +
        'Alice because she has active direct reports).',
      concepts: [
        {
          term: 'Repeatable migration (R__ prefix)',
          explanation:
            'A Flyway migration file starting with R__ (instead of V__) is a repeatable migration. ' +
            'It runs every time the file\'s checksum changes. Flyway stores the checksum and compares ' +
            'it on each startup — if different, it re-runs the migration. Unlike versioned migrations, ' +
            'repeatable ones can be modified safely.',
        },
        {
          term: 'TRUNCATE TABLE CASCADE',
          explanation:
            'TRUNCATE is a fast operation that removes all rows from a table. The CASCADE modifier ' +
            'also truncates tables that have a foreign key referencing this table. This is needed ' +
            'because the manager_id column references employee(id) — you cannot truncate employee ' +
            'without first handling that self-reference.',
        },
        {
          term: 'Idempotent operation',
          explanation:
            'An idempotent operation produces the same result whether you run it once or a hundred ' +
            'times. A seed migration with TRUNCATE + INSERT is idempotent: no matter how many times ' +
            'you run it, the table ends up with exactly those three rows. This is critical for ' +
            'repeatable migrations because Flyway re-runs them when the file changes.',
        },
        {
          term: 'Hard-coded UUIDs in seed data',
          explanation:
            'The seed INSERT statements use specific, fixed UUIDs (like 00000000-0000-0000-0000-000000000001) ' +
            'rather than letting the database generate random ones. This means you can reference these ' +
            'employees by their known IDs in tests, without needing to query for them first. These ' +
            '"well-known" IDs make debugging and testing predictable.',
        },
      ],
      checklist: [
        'Create the file src/main/resources/db/migration/R__seed_data.sql — the R__ prefix tells Flyway this is a repeatable migration.',
        'Start with TRUNCATE TABLE employee CASCADE; — this clears all rows before inserting, making the migration safe to re-run.',
        'Copy the INSERT statements from the example. Notice Alice has manager_id = NULL (she is the top-level manager) while Bob and Carol reference Alice\'s UUID.',
        'Start the app and look for "Successfully applied 1 repeatable migration" in the logs (separate from the versioned migrations count).',
        'Verify the data: run docker exec -it timetracker-postgres psql -U employee_user -d employee_db -c "SELECT id, first_name, last_name, manager_id FROM employee;"',
        'Commit: chore(S1-002): add seed data for development',
      ],
      examples: [
        {
          lang: 'sql',
          label: 'R__seed_data.sql — idempotent seed with org chart',
          code: `-- R__seed_data.sql
-- Repeatable migration: re-runs whenever THIS FILE'S CONTENT changes.
-- (Flyway computes a checksum; if it differs from last run, it re-executes this file.)
--
-- IMPORTANT: This file MUST be idempotent — running it multiple times should
-- produce the same result as running it once.
-- The TRUNCATE at the start ensures this by wiping the table before inserting.

-- Remove all employees first. CASCADE handles the self-referencing foreign key
-- on manager_id — without CASCADE, this would fail with a foreign key violation.
TRUNCATE TABLE employee CASCADE;

-- Insert three employees that form a simple org chart:
--   Alice (CEO) → has no manager (NULL)
--   Bob (Senior Dev) → reports to Alice
--   Carol (Developer) → reports to Alice
--
-- We use fixed, predictable UUIDs so tests can reference them by a known ID.
INSERT INTO employee (id, first_name, last_name, email, department, role, hire_date, manager_id, status)
VALUES
  -- Alice: top-level manager. manager_id is NULL because she has no manager.
  ('00000000-0000-0000-0000-000000000001',
   'Alice', 'Admin', 'alice@example.com',
   'Management', 'CTO',
   '2020-01-01',
   NULL,          -- NULL manager_id = top of the org chart
   'ACTIVE'),

  -- Bob: reports to Alice. manager_id references Alice's fixed UUID.
  ('00000000-0000-0000-0000-000000000002',
   'Bob', 'Builder', 'bob@example.com',
   'Engineering', 'Senior Developer',
   '2021-03-15',
   '00000000-0000-0000-0000-000000000001',   -- Alice's UUID
   'ACTIVE'),

  -- Carol: also reports to Alice.
  ('00000000-0000-0000-0000-000000000003',
   'Carol', 'Coder', 'carol@example.com',
   'Engineering', 'Developer',
   '2022-06-01',
   '00000000-0000-0000-0000-000000000001',   -- Alice's UUID
   'ACTIVE');`,
        },
        {
          lang: 'bash',
          label: 'Verify seed data was inserted',
          code: `# Query the employee table to confirm all three employees exist
docker exec -it timetracker-postgres psql -U employee_user -d employee_db \\
  -c "SELECT id, first_name, last_name, manager_id FROM employee ORDER BY hire_date;"

# Expected output:
#                   id                  | first_name | last_name |             manager_id
# --------------------------------------+------------+-----------+--------------------------------------
#  00000000-0000-0000-0000-000000000001 | Alice      | Admin     |
#  00000000-0000-0000-0000-000000000002 | Bob        | Builder   | 00000000-0000-0000-0000-000000000001
#  00000000-0000-0000-0000-000000000003 | Carol      | Coder     | 00000000-0000-0000-0000-000000000001
#
# Alice's manager_id is empty (NULL) — she is the top of the org chart.
# Bob and Carol's manager_id points to Alice.`,
        },
      ],
      links: [
        { label: 'Flyway — Repeatable Migrations', url: 'https://documentation.red-gate.com/flyway/flyway-cli-and-api/concepts/migrations#RepeatableMigrations' },
        { label: 'PostgreSQL — TRUNCATE', url: 'https://www.postgresql.org/docs/current/sql-truncate.html' },
      ],
    },
  ],
};
