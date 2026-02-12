# S4-EPIC-vacation-workflow: Vacation Workflow Service

| Field | Value |
|---|---|
| **Epic ID** | S4-EPIC-vacation-workflow |
| **Title** | Vacation Workflow Service |
| **Stage** | 4 — Vacation & Visualization |
| **Status** | Backlog |
| **Framework** | Spring Boot 4 |

---

## Vision

Handle leave requests with a full approval workflow. Track vacation balances, support calendar views, and enforce organizational policies.

---

## Key Features (planned)

- Leave request submission (type, dates, reason)
- Approval chain (manager approval, HR override)
- Vacation balance tracking (accrual, usage, carry-over)
- Team calendar view
- Leave policies (min notice, blackout periods)

---

## Technical Considerations

- Workflow engine (simple state machine or Spring State Machine)
- Uses employee service for manager/org chart resolution
- NATS events: `vacation.requested`, `vacation.approved`, `vacation.denied`
- Sealed interface for leave types: `Vacation`, `SickLeave`, `CompensatoryTime`

---

## Dependencies

- Stage 3 complete
- Employee service with org chart

---

## Stories

> Stories will be defined when this stage is prioritized. See [`BACKLOG.md`](../BACKLOG.md) for current status.
