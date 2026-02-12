# S1-001: Project Setup

| Field | Value |
|---|---|
| **Story ID** | S1-001 |
| **Title** | Project Setup |
| **Stage** | 1 — Employee REST API |
| **Status** | Backlog |
| **Dependencies** | None |

---

## User Story

As a developer, I want a fully configured Spring Boot 4 project with dev/test/prod profiles and Docker Compose for local development, so that I have a solid foundation to build the employee service.

---

## Acceptance Criteria

- [ ] AC1: Spring Boot 4.0.x project initializes successfully with Java 25.
- [ ] AC2: Maven/Gradle build produces a runnable JAR.
- [ ] AC3: `application-dev.yaml`, `application-test.yaml`, and `application-prod.yaml` are configured with appropriate defaults per environment.
- [ ] AC4: Docker Compose starts PostgreSQL 17 and the application connects to it without manual configuration.
- [ ] AC5: `/actuator/health` returns 200 OK when the application is running.
- [ ] AC6: Project follows package-by-feature structure (`com.timetracker.employee`).

---

## Tasks

| Task | Title | Status |
|---|---|---|
| [T-001-01](../../tasks/stage1/S1-001/T-001-01-init-spring-boot.md) | Init Spring Boot project | Pending |
| [T-001-02](../../tasks/stage1/S1-001/T-001-02-configure-profiles.md) | Configure profiles | Pending |
| [T-001-03](../../tasks/stage1/S1-001/T-001-03-docker-compose-dev.md) | Docker Compose dev environment | Pending |
| [T-001-04](../../tasks/stage1/S1-001/T-001-04-health-check.md) | Health check endpoint | Pending |

---

## Technical Notes

- Use Spring Initializr or manual setup to bootstrap the project.
- Dependencies: `spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `spring-boot-starter-actuator`, `spring-boot-starter-validation`, PostgreSQL driver, `flyway-core`.
- Package structure: `com.timetracker.employee` (package-by-feature, not package-by-layer per GUIDELINES.md).
- Profiles: `dev` for local Docker, `test` for Testcontainers, `prod` for production-ready defaults. No secrets in YAML files — use environment variables.
- Docker Compose should define a `postgres` service (PostgreSQL 17) with a named volume for data persistence and a health check.
- Actuator: expose only `/actuator/health` externally per GUIDELINES.md conventions.

---

## References

- [PRD](../../PRD.md) — Stage 1 scope, non-functional requirements (containerization, observability)
- [DESIGN](../../DESIGN.md) — Section 2 (service decomposition), Section 5 (container architecture)
- [GUIDELINES](../../GUIDELINES.md) — Section 2 (Spring Boot 4.0 conventions), Section 6 (Docker conventions)
