# S3-EPIC-time-budget: Time Budget Service

| Field | Value |
|---|---|
| **Epic ID** | S3-EPIC-time-budget |
| **Title** | Time Budget Service |
| **Stage** | 3 — Time Budget & Project Planning |
| **Status** | Backlog |
| **Framework** | Spring Boot 4 |

---

## Vision

Allow managers to allocate time budgets per project, team, and period. Track actual hours against budgets with burn-down visibility.

---

## Key Features (planned)

- Create/manage time budgets (project + team + period)
- Budget allocation rules
- Burn-down tracking (budget vs actuals)
- Budget alerts (approaching limit, exceeded)
- Period rollover and carry-forward rules

---

## Technical Considerations

- Consumes `timeentry` events from NATS to update actuals
- Scheduled jobs for budget alerts
- Complex queries for budget vs actual calculations
- Event sourcing considered but CRUD+events is simpler for now

---

## Dependencies

- Stage 2 complete (time tracking service publishing events)

---

## Stories

> Stories will be defined when this stage is prioritized. See [`BACKLOG.md`](../BACKLOG.md) for current status.
