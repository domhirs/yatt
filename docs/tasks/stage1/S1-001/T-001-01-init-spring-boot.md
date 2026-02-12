# T-001-01: Initialize Spring Boot 4 Project

| Field | Value |
|---|---|
| **Task ID** | T-001-01 |
| **Story** | [S1-001: Project Setup](../../../stories/stage1/S1-001-project-setup.md) |
| **Status** | Pending |

---

## Objective

Create a new Spring Boot 4.0.x project with Java 25, the required dependencies, and a package-by-feature structure so the employee service has a buildable, runnable foundation from day one.

---

## Checklist

- [ ] Generate Spring Boot 4 project (Spring Initializr or manual)
- [ ] Set Java 25 in build configuration
- [ ] Add dependencies (web, data-jpa, actuator, validation, postgresql, flyway-core, test, devtools)
- [ ] Create package structure `com.timetracker.employee`
- [ ] Verify `./mvnw spring-boot:run` starts (DB connection failure is expected)
- [ ] Commit: `chore(S1-001): initialize Spring Boot 4 project`

---

## Details

### Generate Spring Boot 4 project

<details>
<summary>Expand for guidance</summary>

Use [Spring Initializr](https://start.spring.io/) or create the project manually. Configure the following:

| Setting | Value |
|---|---|
| Project | Maven |
| Language | Java |
| Spring Boot | 4.0.x |
| Group | `com.timetracker` |
| Artifact | `employee-service` |
| Name | `employee-service` |
| Package name | `com.timetracker.employee` |
| Packaging | Jar |
| Java | 25 |

If creating manually, place the project at the repository root under `employee-service/`. The Maven wrapper (`mvnw` / `mvnw.cmd`) should be included so the project builds without a globally installed Maven.

</details>

### Set Java 25 in build configuration

<details>
<summary>Expand for guidance</summary>

In `pom.xml`, set the Java version property. Spring Boot 4.0.x uses the `java.version` property:

```xml
<properties>
    <java.version>25</java.version>
</properties>
```

The `spring-boot-starter-parent` will pick this up and configure the Maven compiler plugin accordingly. Verify that your local JDK matches:

```bash
java --version
# Expected: openjdk 25 ...
```

</details>

### Add dependencies

<details>
<summary>Expand for guidance</summary>

Use `spring-boot-starter-parent` 4.0.x as the parent POM. The full `pom.xml` structure:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.0.0</version>
        <relativePath/>
    </parent>

    <groupId>com.timetracker</groupId>
    <artifactId>employee-service</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>employee-service</name>
    <description>Employee microservice for the time-tracking platform</description>

    <properties>
        <java.version>25</java.version>
    </properties>

    <dependencies>
        <!-- Web -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- Data / JPA -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>

        <!-- Actuator -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>

        <!-- Validation -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- PostgreSQL driver -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- Flyway -->
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-database-postgresql</artifactId>
        </dependency>

        <!-- DevTools -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-devtools</artifactId>
            <scope>runtime</scope>
            <optional>true</optional>
        </dependency>

        <!-- Test -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

**Why these dependencies?**

| Dependency | Purpose |
|---|---|
| `spring-boot-starter-web` | Embedded Tomcat, REST controllers, JSON serialization |
| `spring-boot-starter-data-jpa` | Hibernate + Spring Data repositories |
| `spring-boot-starter-actuator` | Health checks, metrics, info endpoints |
| `spring-boot-starter-validation` | Jakarta Bean Validation (Hibernate Validator) |
| `postgresql` | JDBC driver for PostgreSQL |
| `flyway-core` + `flyway-database-postgresql` | Schema migrations |
| `spring-boot-devtools` | Hot reload in development |
| `spring-boot-starter-test` | JUnit 5, Mockito, Spring Test |

Note: `flyway-database-postgresql` is required since Flyway 10+, which modularized database support.

</details>

### Create package structure

<details>
<summary>Expand for guidance</summary>

The project follows **package-by-feature** as specified in GUIDELINES.md. For now, create the base package and the main application class:

```
employee-service/
  src/
    main/
      java/
        com/
          timetracker/
            employee/
              EmployeeServiceApplication.java
      resources/
        application.yaml
        db/
          migration/
    test/
      java/
        com/
          timetracker/
            employee/
              EmployeeServiceApplicationTests.java
```

The main class:

```java
package com.timetracker.employee;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class EmployeeServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(EmployeeServiceApplication.class, args);
    }
}
```

Do **not** create sub-packages like `controller/`, `service/`, `repository/` yet. Those will be created when the corresponding classes are needed. The package-by-feature approach means classes for the employee feature live directly in `com.timetracker.employee`, with sub-packages only for groupings like `dto/` when they accumulate.

</details>

### Verify startup

<details>
<summary>Expand for guidance</summary>

Run the application from the `employee-service/` directory:

```bash
./mvnw spring-boot:run
```

**Expected behavior**: The application will attempt to start but will fail to connect to PostgreSQL because no database is running yet. This is expected and correct at this stage. Look for:

1. The Spring Boot banner prints successfully.
2. The failure message mentions a database connection issue (not a classpath or configuration error).

A log line like the following confirms the project structure is correct:

```
***************************
APPLICATION FAILED TO START
***************************
Description:
Failed to configure a DataSource: 'url' attribute is not specified...
```

This will be resolved in T-001-02 (profiles) and T-001-03 (Docker Compose).

</details>

### Commit

<details>
<summary>Expand for guidance</summary>

Stage all generated files and commit following the project's Conventional Commits convention:

```bash
git add employee-service/
git commit -m "chore(S1-001): initialize Spring Boot 4 project"
```

</details>

---

## Development Log

| Date | Entry |
|---|---|
| --- | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) -- Section 1 (Java 25 coding standards), Section 2 (Spring Boot 4.0 conventions)
- [DESIGN.md](../../../../docs/DESIGN.md) -- Section 2 (service decomposition: employee-service is Spring Boot 4.0)
- [PRD.md](../../../../docs/PRD.md) -- Stage 1 scope, non-functional requirements
