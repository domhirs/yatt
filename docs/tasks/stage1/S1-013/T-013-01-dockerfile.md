# T-013-01: Dockerfile

| Field | Value |
|---|---|
| **Task ID** | T-013-01 |
| **Story** | [S1-013: Docker Containerization](../../../stories/stage1/S1-013-docker.md) |
| **Status** | Pending |

---

## Objective

Create a multi-stage Dockerfile that produces a minimal, production-ready container image for the employee service.

---

## Checklist

- [ ] Create `Dockerfile` at the employee-service root
- [ ] Use `eclipse-temurin:25-jdk` for build stage (or copy pre-built JAR)
- [ ] Use `eclipse-temurin:25-jre` for runtime stage
- [ ] Copy JAR to runtime stage
- [ ] Configure JVM options for containers
- [ ] Expose port 8080
- [ ] Set `ENTRYPOINT` with `java -jar`
- [ ] Add `HEALTHCHECK` instruction
- [ ] Create `.dockerignore` file
- [ ] Verify `docker build` succeeds
- [ ] Verify image size < 300 MB
- [ ] Commit: `feat(S1-013): add Dockerfile for employee service`

---

## Details

### Multi-stage Dockerfile

<details>
<summary>Expand for guidance</summary>

```dockerfile
# Stage 1: Build (or just copy pre-built JAR)
FROM eclipse-temurin:25-jdk AS build
WORKDIR /app
COPY target/*.jar app.jar

# Stage 2: Runtime
FROM eclipse-temurin:25-jre
WORKDIR /app

# Create non-root user
RUN addgroup --system app && adduser --system --ingroup app app
USER app

COPY --from=build /app/app.jar app.jar

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-jar", "app.jar"]
```

**Key decisions:**

- **Pre-built JAR approach**: Build the JAR externally (`mvn package`), then copy into the image. Simpler than building inside Docker and avoids caching Maven dependencies in the image.
- **Non-root user**: Security best practice — never run as root in containers.
- **`-XX:+UseContainerSupport`**: Default in modern JVMs, but explicit for clarity. Respects container memory/CPU limits.
- **`-XX:MaxRAMPercentage=75.0`**: Use 75% of container memory for heap, leaving room for off-heap, metaspace, and OS.
- **`HEALTHCHECK`**: Docker can automatically restart unhealthy containers.

</details>

### .dockerignore

<details>
<summary>Expand for guidance</summary>

```
.git
.gitignore
.idea
*.md
docs/
out/
target/
!target/*.jar
```

Excludes unnecessary files from the build context, speeding up `docker build`.

</details>

---

## Development Log

| Date | Entry |
|---|---|
| — | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) — Section 6: Docker conventions
- [DESIGN.md](../../../../docs/DESIGN.md) — Section 5: Container architecture
