# S1-013: Docker Containerization

| Field | Value |
|---|---|
| **Story ID** | S1-013 |
| **Title** | Docker Containerization |
| **Stage** | 1 — Employee REST API |
| **Status** | Backlog |
| **Dependencies** | S1-011 |

---

## User Story

As a developer, I want the employee service running in a Docker container, so that deployment is reproducible and consistent across environments.

---

## Acceptance Criteria

- [ ] AC1: A multi-stage Dockerfile builds with JDK 25 and runs on JRE 25.
- [ ] AC2: The Docker image starts in under 10 seconds.
- [ ] AC3: `docker-compose.prod.yaml` runs PostgreSQL 17 and the employee-service together.
- [ ] AC4: A health check is configured in Docker Compose (uses `/actuator/health`).
- [ ] AC5: Environment variables configure the database URL, credentials, and other runtime settings — no secrets baked into the image.
- [ ] AC6: The final Docker image size is optimized to under 300 MB.

---

## Tasks

| Task | Title | Status |
|---|---|---|
| [T-013-01](../../tasks/stage1/S1-013/T-013-01-dockerfile.md) | Dockerfile | Pending |
| [T-013-02](../../tasks/stage1/S1-013/T-013-02-compose-prod.md) | Compose production config | Pending |
| [T-013-03](../../tasks/stage1/S1-013/T-013-03-startup-verify.md) | Startup verification | Pending |

---

## Technical Notes

- **Multi-stage Dockerfile**:
  - Stage 1 (`build`): use `eclipse-temurin:25-jdk` to copy the pre-built JAR (built externally via Maven/Gradle, not inside Docker). Alternatively, the build stage can run the Maven/Gradle build if full reproducibility is desired, but for Stage 1 copying a pre-built JAR is simpler.
  - Stage 2 (`runtime`): use `eclipse-temurin:25-jre` as the base image. Copy only the JAR from the build stage. This keeps the image small by excluding build tools and source code.
- **Layer caching**: structure the Dockerfile to copy dependency JARs (extracted layers) before the application code to maximize Docker layer cache hits on rebuilds.
- **HEALTHCHECK** directive in the Dockerfile: `HEALTHCHECK --interval=10s --timeout=3s CMD curl -f http://localhost:8080/actuator/health || exit 1` (or use `wget` if `curl` is not available in the JRE image).
- **Docker Compose production config** (`docker-compose.prod.yaml`):
  - PostgreSQL service with a named volume, health check (`pg_isready`), and resource limits.
  - Employee service with `depends_on` using the `condition: service_healthy` syntax to wait for PostgreSQL readiness.
  - All configuration via environment variables (`SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, etc.).
- No secrets in the image. Use environment variables or Docker secrets for credentials. The Compose file can reference a `.env` file for local use.
- Target image size under 300 MB: the JRE base image is approximately 200 MB, leaving room for the application JAR and dependencies.

---

## References

- [PRD](../../PRD.md) — Non-functional requirements (containerization), success criteria (starts in < 10 seconds)
- [DESIGN](../../DESIGN.md) — Section 5 (container architecture, build strategy, Compose services)
- [GUIDELINES](../../GUIDELINES.md) — Section 6 (Docker conventions: multi-stage builds, named volumes, health checks, no secrets in images)
