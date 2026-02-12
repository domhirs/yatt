# S4-EPIC-data-visualization: Data Visualization

| Field | Value |
|---|---|
| **Epic ID** | S4-EPIC-data-visualization |
| **Title** | Data Visualization |
| **Stage** | 4 — Vacation & Visualization |
| **Status** | Backlog |
| **Framework** | Angular 21 + Grafana |

---

## Vision

Provide dashboards and reports showing time distribution, budget usage, team utilization, and vacation patterns. Make data-driven decisions visible.

---

## Key Features (planned)

- Time distribution charts (per employee, team, project)
- Budget burn-down dashboards
- Team utilization heatmaps
- Vacation calendar overlay
- Export to PDF/CSV

---

## Technical Considerations

- Grafana for infrastructure/metrics dashboards
- Angular charts for in-app visualization (ngx-charts or similar FOSS library)
- Read-optimized views/materialized views in PostgreSQL
- Consider CQRS for complex reporting queries

---

## Dependencies

- All services operational
- Prometheus/Micrometer metrics flowing

---

## Stories

> Stories will be defined when this stage is prioritized. See [`BACKLOG.md`](../BACKLOG.md) for current status.
