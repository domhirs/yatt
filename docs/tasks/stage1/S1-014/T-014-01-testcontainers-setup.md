# T-014-01: Testcontainers Setup

| Field | Value |
|---|---|
| **Task ID** | T-014-01 |
| **Story** | [S1-014: Integration Tests](../../../stories/stage1/S1-014-integration-tests.md) |
| **Status** | Pending |

---

## Objective

Configure Testcontainers to provide a real PostgreSQL instance for integration tests, ensuring tests run against the same database engine used in production.

---

## Checklist

- [ ] Add `org.testcontainers:postgresql` dependency (test scope)
- [ ] Add `org.testcontainers:junit-jupiter` dependency (test scope)
- [ ] Create `IntegrationTestBase` abstract class with `@SpringBootTest`
- [ ] Configure PostgreSQL container (postgres:17 image)
- [ ] Set dynamic datasource properties using `@DynamicPropertySource`
- [ ] Use singleton container pattern (one container shared across test classes)
- [ ] Verify container starts and Flyway migrations run
- [ ] Configure test profile (`application-test.yaml`) to use Testcontainers
- [ ] Commit: `test(S1-014): configure Testcontainers for integration tests`

---

## Details

### IntegrationTestBase class

<details>
<summary>Expand for guidance</summary>

```java
package com.timetracker.employee;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public abstract class IntegrationTestBase {

    @LocalServerPort
    protected int port;

    static final PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:17")
            .withDatabaseName("employee_db")
            .withUsername("test")
            .withPassword("test");

    static {
        postgres.start(); // Singleton pattern: starts once, reused by all test classes
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }
}
```

**Why singleton container?** Starting a Postgres container takes 2-5 seconds. The singleton pattern starts it once and reuses it for all test classes, dramatically reducing total test time. The `static { postgres.start(); }` block runs once per JVM.

**Why not `@Testcontainers` + `@Container`?** The annotation-driven approach creates a new container per test class, which is slower. The manual singleton pattern is preferred for integration test suites.

</details>

### Test dependencies (Maven)

<details>
<summary>Expand for guidance</summary>

```xml
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>postgresql</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>junit-jupiter</artifactId>
    <scope>test</scope>
</dependency>
```

Use the Testcontainers BOM for version management:

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>testcontainers-bom</artifactId>
            <version>1.20.x</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

</details>

---

## Development Log

| Date | Entry |
|---|---|
| — | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) — Section 7: Testing strategy, Testcontainers
