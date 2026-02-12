# S1-014: Integration Tests

| Field | Value |
|---|---|
| **Story ID** | S1-014 |
| **Title** | Integration Tests |
| **Stage** | 1 — Employee REST API |
| **Status** | Backlog |
| **Dependencies** | S1-013 |

---

## User Story

As a developer, I want comprehensive integration tests running against a real PostgreSQL instance, so that I can verify the full stack works end-to-end.

---

## Acceptance Criteria

- [ ] AC1: Testcontainers starts a PostgreSQL 17 instance automatically for integration tests.
- [ ] AC2: All CRUD endpoints are tested end-to-end (create, read, update, delete, list, search).
- [ ] AC3: Edge cases are tested: duplicate email (409), invalid manager (422), delete manager with active reports (409), optimistic locking conflict (409).
- [ ] AC4: Tests are independent and repeatable — each test starts with a clean state.
- [ ] AC5: Integration tests run in a separate Maven/Gradle profile (e.g., `integration-test`) so they can be executed independently from unit tests.
- [ ] AC6: All integration tests pass in a CI-compatible environment (no Docker-in-Docker issues).

---

## Tasks

| Task | Title | Status |
|---|---|---|
| [T-014-01](../../tasks/stage1/S1-014/T-014-01-testcontainers-setup.md) | Testcontainers setup | Pending |
| [T-014-02](../../tasks/stage1/S1-014/T-014-02-crud-integration.md) | CRUD integration tests | Pending |
| [T-014-03](../../tasks/stage1/S1-014/T-014-03-edge-case-integration.md) | Edge case integration tests | Pending |

---

## Technical Notes

- Use `@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)` to start the full application context with an embedded server on a random port. Use `TestRestTemplate` or `WebTestClient` for making HTTP requests against the running server.
- **Testcontainers setup**: use the `org.testcontainers:postgresql` module. Define a shared container in a base test class or use the `@Testcontainers` / `@Container` annotations. Configure the test datasource to point to the Testcontainers-managed PostgreSQL instance via `@DynamicPropertySource`.
- **Test isolation**: use `@Sql` scripts to reset the database before each test, or clean up via repository `deleteAll()` in a `@BeforeEach` method. The `@Transactional` + rollback approach does **not** work with `WebEnvironment.RANDOM_PORT` because the test and server run in different threads (and thus different transactions).
- **Separate profile**: create a Maven/Gradle profile (e.g., `integration-test`) that includes integration test sources (e.g., `src/integration-test/java/`) and runs them with the Failsafe plugin (Maven) or a custom test task (Gradle). This keeps unit and integration test execution independent.
- **CI compatibility**: Testcontainers uses the Docker daemon on the host. In CI (e.g., GitHub Actions), ensure Docker is available. Testcontainers supports CI environments natively — no Docker-in-Docker is needed if the CI runner has Docker installed. Use `testcontainers.reuse.enable=true` in `~/.testcontainers.properties` for faster local development.
- **Test naming**: follow the convention `*IntegrationTest.java` (or `*IT.java`) to distinguish from unit tests (`*Test.java`). Configure the build tool to pick up integration tests by this naming pattern.
- Flyway migrations run automatically against the Testcontainers database, ensuring the schema matches production.

---

## References

- [PRD](../../PRD.md) — Non-functional requirements (testing), success criteria (integration tests pass against real PostgreSQL)
- [DESIGN](../../DESIGN.md) — Section 3 (database strategy, migrations)
- [GUIDELINES](../../GUIDELINES.md) — Section 7 (testing strategy: Testcontainers, test conventions, coverage targets)
