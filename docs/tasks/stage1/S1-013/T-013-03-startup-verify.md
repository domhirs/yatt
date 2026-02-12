# T-013-03: Startup Verification

| Field | Value |
|---|---|
| **Task ID** | T-013-03 |
| **Story** | [S1-013: Docker Containerization](../../../stories/stage1/S1-013-docker.md) |
| **Status** | Pending |

---

## Objective

Verify the containerized employee service starts correctly, connects to PostgreSQL, and meets the < 10 second startup target.

---

## Checklist

- [ ] Run `docker compose -f docker-compose.yaml -f docker-compose.prod.yaml up -d`
- [ ] Time from container start to first successful health check
- [ ] Verify startup time < 10 seconds
- [ ] Verify `GET /actuator/health` returns `UP` with database indicator
- [ ] Verify Flyway migrations ran (check logs)
- [ ] Test a quick CRUD cycle: POST employee, GET it back
- [ ] Check container logs for errors or warnings
- [ ] Verify graceful shutdown: `docker compose down`
- [ ] Document any issues and their fixes
- [ ] Commit: `docs(S1-013): document startup verification results`

---

## Details

### Verification commands

<details>
<summary>Expand for guidance</summary>

```bash
# Start the stack
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml up -d

# Watch logs until healthy
docker compose logs -f employee-svc

# Check health endpoint
curl http://localhost:8080/actuator/health
# Expected: {"status":"UP","components":{"db":{"status":"UP",...},...}}

# Quick CRUD test
curl -X POST http://localhost:8080/api/v1/employees \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "department": "Engineering",
    "role": "Developer",
    "hireDate": "2024-01-15"
  }'
# Expected: 201 Created with Location header

# Check image size
docker images | grep employee
# Expected: < 300 MB

# Graceful shutdown
docker compose down
```

</details>

### Troubleshooting

<details>
<summary>Expand for guidance</summary>

| Problem | Cause | Fix |
|---|---|---|
| Startup > 10s | Flyway migrations or JVM warmup | Check migration count; consider JVM flags like `-XX:TieredStopAtLevel=1` for faster startup |
| Connection refused to Postgres | Service started before Postgres was ready | Verify `depends_on` condition is `service_healthy`, not just `service_started` |
| Flyway migration error | Schema or table already exists | Ensure `spring.flyway.baseline-on-migrate=true` for first run on existing DB |
| Out of memory | JVM using too much heap | Adjust `-XX:MaxRAMPercentage` or increase container memory limit |
| Health check fails | Actuator not exposed or wrong port | Verify `management.server.port` matches `HEALTHCHECK` URL |

</details>

---

## Development Log

| Date | Entry |
|---|---|
| — | *No entries yet* |

---

## References

- [PRD.md](../../../../docs/PRD.md) — Success criteria: starts in < 10 seconds
- [GUIDELINES.md](../../../../docs/GUIDELINES.md) — Section 6: Health checks in Compose
