# T-002-03: Seed Data

| Field | Value |
|---|---|
| **Task ID** | T-002-03 |
| **Story** | [S1-002: Database Schema](../../../stories/stage1/S1-002-database-schema.md) |
| **Status** | Pending |

---

## Objective

Insert sample employees for development and manual testing so that developers have realistic data to work with immediately after starting the application, without needing to manually create records via the API.

---

## Checklist

- [ ] Create `V2__seed_employee_data.sql`
- [ ] Insert 5-10 sample employees with variety (different departments, roles, some with managers)
- [ ] Include at least one manager-report relationship
- [ ] Include at least one employee with no manager (CEO/top-level)
- [ ] Verify seed data appears after app restart
- [ ] Only run in dev profile (configure Flyway locations per profile)
- [ ] Commit: `chore(S1-002): add seed data for development`

---

## Details

### Create V2__seed_employee_data.sql

<details>
<summary>Expand for guidance</summary>

Seed data should live in a **separate directory** from production migrations so it can be conditionally included only in development. Place the seed file in:

```
employee-service/
  src/
    main/
      resources/
        db/
          migration/          <-- production migrations (always applied)
            V1__create_employee_table.sql
          seed/               <-- development seed data (dev profile only)
            V2__seed_employee_data.sql
```

**File**: `employee-service/src/main/resources/db/seed/V2__seed_employee_data.sql`

```sql
-- V2__seed_employee_data.sql
-- Sample employee data for development and manual testing
-- This migration runs ONLY in the dev profile (see Flyway locations config)

-- Insert top-level employees first (no manager)
INSERT INTO employee (id, first_name, last_name, email, department, role, hire_date, manager_id, status)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Elena', 'Rodriguez', 'elena.rodriguez@timetracker.dev',
     'Executive', 'CEO', '2020-01-15', NULL, 'ACTIVE'),

    ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Marcus', 'Chen', 'marcus.chen@timetracker.dev',
     'Engineering', 'VP of Engineering', '2020-03-01', NULL, 'ACTIVE');

-- Insert department heads (report to CEO or VP)
INSERT INTO employee (id, first_name, last_name, email, department, role, hire_date, manager_id, status)
VALUES
    ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Sarah', 'Johnson', 'sarah.johnson@timetracker.dev',
     'Engineering', 'Engineering Manager', '2021-06-15',
     'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'ACTIVE'),

    ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'James', 'O''Brien', 'james.obrien@timetracker.dev',
     'Human Resources', 'HR Director', '2020-08-01',
     'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ACTIVE'),

    ('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'Priya', 'Patel', 'priya.patel@timetracker.dev',
     'Finance', 'Finance Manager', '2021-01-10',
     'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ACTIVE');

-- Insert individual contributors (report to department heads)
INSERT INTO employee (id, first_name, last_name, email, department, role, hire_date, manager_id, status)
VALUES
    ('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'Alex', 'Kim', 'alex.kim@timetracker.dev',
     'Engineering', 'Senior Developer', '2022-03-20',
     'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'ACTIVE'),

    ('a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'Maria', 'Santos', 'maria.santos@timetracker.dev',
     'Engineering', 'Developer', '2023-07-01',
     'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'ACTIVE'),

    ('b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a88', 'David', 'Wilson', 'david.wilson@timetracker.dev',
     'Engineering', 'Junior Developer', '2024-01-08',
     'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'ACTIVE'),

    ('c8eebc99-9c0b-4ef8-bb6d-6bb9bd380a99', 'Lisa', 'Thompson', 'lisa.thompson@timetracker.dev',
     'Human Resources', 'HR Specialist', '2022-11-15',
     'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'ACTIVE');

-- Insert one inactive employee
INSERT INTO employee (id, first_name, last_name, email, department, role, hire_date, manager_id, status)
VALUES
    ('d9eebc99-9c0b-4ef8-bb6d-6bb9bd380aaa', 'Tom', 'Baker', 'tom.baker@timetracker.dev',
     'Engineering', 'Developer', '2021-04-01',
     'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'INACTIVE');
```

**Why fixed UUIDs in seed data?**

Using deterministic UUIDs (instead of `gen_random_uuid()`) makes the seed data:
- **Reproducible**: same IDs every time, useful for manual testing and documentation.
- **Referentially consistent**: manager_id values can reference known IDs.
- **Debuggable**: you can reference specific employees by their ID in test scripts.

</details>

### Insert 5-10 sample employees with variety

<details>
<summary>Expand for guidance</summary>

The seed data above includes 10 employees spanning:

| Department | Count | Roles |
|---|---|---|
| Executive | 1 | CEO |
| Engineering | 6 | VP of Engineering, Engineering Manager, Senior Developer, Developer, Junior Developer, Developer (inactive) |
| Human Resources | 2 | HR Director, HR Specialist |
| Finance | 1 | Finance Manager |

This variety supports testing:
- **Filtering by department**: Engineering (6), HR (2), Finance (1), Executive (1).
- **Filtering by role**: multiple distinct roles.
- **Filtering by status**: 9 ACTIVE, 1 INACTIVE.
- **Pagination**: 10 records is enough to test page size boundaries (e.g., page size 5 gives 2 pages).
- **Org chart**: multi-level hierarchy.

</details>

### Include manager-report relationships

<details>
<summary>Expand for guidance</summary>

The org chart hierarchy in the seed data:

```
Elena Rodriguez (CEO) ── no manager
├── James O'Brien (HR Director)
│   └── Lisa Thompson (HR Specialist)
├── Priya Patel (Finance Manager)
└── Marcus Chen (VP of Engineering) ── no manager (reports to CEO conceptually, but NULL for now)
    └── Sarah Johnson (Engineering Manager)
        ├── Alex Kim (Senior Developer)
        ├── Maria Santos (Developer)
        ├── David Wilson (Junior Developer)
        └── Tom Baker (Developer, INACTIVE)
```

This hierarchy tests:
- **Top-level employees**: Elena and Marcus have `manager_id = NULL`.
- **Single-level reports**: James reports to Elena.
- **Multi-level chain**: David -> Sarah -> Marcus (3 levels).
- **Multiple direct reports**: Sarah has 4 direct reports.
- **Inactive in hierarchy**: Tom is inactive but still in the reporting structure.

Note: Marcus is inserted without a manager for simplicity. In a real org, he would report to Elena. This is a deliberate choice to have two top-level employees for testing.

</details>

### Verify seed data appears

<details>
<summary>Expand for guidance</summary>

After starting the application with the dev profile:

```bash
docker exec -it timetracker-postgres psql -U employee_user -d employee_db -c \
  "SELECT first_name, last_name, department, role, status FROM employee ORDER BY department, role;"
```

Expected output:

```
 first_name |  last_name  |   department    |        role         | status
------------+-------------+-----------------+---------------------+---------
 Alex       | Kim         | Engineering     | Developer           | INACTIVE
 Maria      | Santos      | Engineering     | Developer           | ACTIVE
 Tom        | Baker       | Engineering     | Developer           | INACTIVE
 ...
(10 rows)
```

Also verify the org chart query works:

```sql
-- Find all direct reports of Sarah Johnson
SELECT first_name, last_name, role
FROM employee
WHERE manager_id = 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
```

</details>

### Only run in dev profile

<details>
<summary>Expand for guidance</summary>

Configure Flyway to look in different directories depending on the active profile. This ensures seed data is only applied in development.

**In `application.yaml` (common):**

```yaml
spring:
  flyway:
    locations: classpath:db/migration
```

**In `application-dev.yaml`:**

```yaml
spring:
  flyway:
    locations: classpath:db/migration,classpath:db/seed
```

**In `application-test.yaml`:**

```yaml
spring:
  flyway:
    locations: classpath:db/migration
```

**In `application-prod.yaml`:**

```yaml
spring:
  flyway:
    locations: classpath:db/migration
```

**How this works:**
- In `dev`, Flyway scans both `db/migration/` and `db/seed/`. It finds `V1` and `V2` and applies both.
- In `test` and `prod`, Flyway only scans `db/migration/`. It finds `V1` and applies only the employee table creation. The seed data is never seen or applied.

**Important**: Since the seed migration (`V2`) exists in the Flyway history of dev databases but not in test/prod, running the same database against a different profile will not cause issues. Flyway tracks applied migrations by version number. If `V2` is not in the scan locations, Flyway ignores it during validation (as long as `ignoreMigrationPatterns` is configured or `outOfOrder` is handled).

To be safe, add this to the non-dev profiles:

```yaml
spring:
  flyway:
    ignore-migration-patterns: "*:missing"
```

This tells Flyway to ignore migrations that exist in the history table but are missing from the configured locations. This is exactly the scenario when a dev database's history contains the seed migration but the test/prod scan path does not include it.

**Alternative approach**: Use a `R__seed_employees.sql` (repeatable migration). Repeatable migrations run every time their checksum changes. This is useful if seed data evolves frequently. However, for a fixed set of test data, a versioned migration with conditional inclusion is simpler and more predictable.

</details>

### Commit

<details>
<summary>Expand for guidance</summary>

```bash
git add employee-service/src/main/resources/db/seed/V2__seed_employee_data.sql
git add employee-service/src/main/resources/application-dev.yaml
git commit -m "chore(S1-002): add seed data for development"
```

</details>

---

## Development Log

| Date | Entry |
|---|---|
| --- | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) -- Section 2 (Spring Boot 4.0 conventions: profiles)
- [DESIGN.md](../../../../docs/DESIGN.md) -- Section 3 (database strategy: migrations, schema layout)
- [PRD.md](../../../../docs/PRD.md) -- Data model (initial), Stage 1 scope
