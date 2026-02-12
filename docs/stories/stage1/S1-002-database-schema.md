# S1-002: Database Schema

| Field | Value |
|---|---|
| **Story ID** | S1-002 |
| **Title** | Database Schema |
| **Stage** | 1 — Employee REST API |
| **Status** | Backlog |
| **Dependencies** | S1-001 |

---

## User Story

As a developer, I want the employee database schema managed by Flyway migrations, so that schema changes are versioned, repeatable, and automated.

---

## Acceptance Criteria

- [ ] AC1: Flyway runs automatically on application startup via Spring Boot auto-configuration.
- [ ] AC2: V1 migration creates the `employee` table matching the data model (id, first_name, last_name, email, department, role, hire_date, manager_id, status, created_at, updated_at).
- [ ] AC3: The `employee_db` schema is isolated from other services' schemas in the shared PostgreSQL instance.
- [ ] AC4: A seed data migration inserts sample employees for development use.
- [ ] AC5: Migrations are idempotent and pass on both clean and existing databases.

---

## Tasks

| Task | Title | Status |
|---|---|---|
| [T-002-01](../../tasks/stage1/S1-002/T-002-01-flyway-setup.md) | Flyway setup | Pending |
| [T-002-02](../../tasks/stage1/S1-002/T-002-02-employee-migration.md) | Employee table migration | Pending |
| [T-002-03](../../tasks/stage1/S1-002/T-002-03-seed-data.md) | Seed data | Pending |

---

## Technical Notes

- Use Flyway with Spring Boot auto-configuration. Migration files live in `src/main/resources/db/migration/`.
- Use UUID as the primary key with `gen_random_uuid()` as the default value.
- Add indexes on `email` (unique), `department`, and `manager_id` for query performance.
- The `status` column should be `VARCHAR` with a `CHECK` constraint restricting values to `ACTIVE` and `INACTIVE`.
- The `manager_id` column is a self-referencing foreign key to the `employee` table (`FK -> employee.id`).
- Timestamps: `created_at` defaults to `NOW()`, `updated_at` is set via trigger or application-level logic.
- Seed data should be a repeatable migration (`R__seed_employees.sql`) or a versioned migration that only runs in the `dev` profile.
- Schema isolation: configure the datasource to use the `employee_db` schema per DESIGN.md conventions.

---

## References

- [PRD](../../PRD.md) — Data model (initial), validation rules
- [DESIGN](../../DESIGN.md) — Section 3 (database strategy, schema layout, migrations)
- [GUIDELINES](../../GUIDELINES.md) — Section 2 (Spring Boot 4.0 conventions, profiles)
