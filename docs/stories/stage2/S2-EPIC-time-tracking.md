# S2-EPIC-time-tracking: Time Tracking Service

| Field | Value |
|---|---|
| **Epic ID** | S2-EPIC-time-tracking |
| **Title** | Time Tracking Service |
| **Stage** | 2 — Time Tracking & Frontend |
| **Status** | Backlog |
| **Framework** | Quarkus 3.32+ |

---

## Vision

Enable employees to track their working hours with clock in/out events and manual time entries. This is the highest-throughput service — optimized for fast writes using Quarkus native.

---

## Key Features (planned)

- Clock in/out events
- Manual time entry (project + hours + description)
- Daily/weekly timesheet view
- Timesheet approval workflow
- Integration with employee service for validation

---

## Technical Considerations

- Quarkus for fast startup and low memory
- TimescaleDB hypertable for time-series storage
- NATS events: `timeentry.created`, `timeentry.updated`
- RESTEasy Reactive endpoints
- Panache for data access

---

## Dependencies

- Stage 1 complete (employee service running)
- PostgreSQL with TimescaleDB extension

---

## Stories

> Stories will be defined when this stage is prioritized. See [`BACKLOG.md`](../BACKLOG.md) for current status.
