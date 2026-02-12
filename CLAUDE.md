# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Behavioral instructions

**Read and follow [`docs/AGENT.md`](docs/AGENT.md)** for persona, principles, and communication style. That document defines how you should behave in this project (expert mentor, challenge decisions, show pros/cons, enforce SOLID).

## Project Overview

**yatt** (Yet Another Time Tracker) — a full-stack **time-tracking, time-budget, project-planning, and vacation-workflow platform** built as a Java learning project focused on microservices architecture.

### Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Language | Java | 25 |
| Backend (primary) | Spring Boot | 4.0.x |
| Backend (secondary) | Quarkus | 3.32+ |
| Frontend | Angular | 21 |
| Database | PostgreSQL + TimescaleDB | 17+ |
| Message broker | NATS JetStream | latest |
| Containers | Docker Compose | V2 |
| Testing (Angular) | Vitest | latest |

### Current stage: Stage 1 — Employee REST API

See [`docs/PRD.md`](docs/PRD.md) for full requirements.

## Key Documentation

| Document | Purpose |
|---|---|
| [`docs/AGENT.md`](docs/AGENT.md) | Agent persona and behavioral rules |
| [`docs/GUIDELINES.md`](docs/GUIDELINES.md) | Coding standards, conventions, testing strategy |
| [`docs/DESIGN.md`](docs/DESIGN.md) | Architecture, service decomposition, key decisions |
| [`docs/PRD.md`](docs/PRD.md) | Product requirements, module breakdown, success criteria |
| [`docs/PROCESS.md`](docs/PROCESS.md) | Development workflow, story/task lifecycle |
| [`docs/stories/BACKLOG.md`](docs/stories/BACKLOG.md) | Product backlog — all stories and epics by stage |

## Development Process

Work is organized into **stages → stories → tasks**. See [`docs/PROCESS.md`](docs/PROCESS.md) for the full workflow.

### Stories and tasks

- **Backlog**: [`docs/stories/BACKLOG.md`](docs/stories/BACKLOG.md) — index of all stories with status and dependencies
- **Story files**: `docs/stories/stage{N}/S{N}-{NNN}-*.md` — user stories with acceptance criteria
- **Task files**: `docs/tasks/stage{N}/S{N}-{NNN}/T-{NNN}-{NN}-*.md` — implementation checklists with expandable guidance
- **Epic placeholders**: `docs/stories/stage{2-4}/S{N}-EPIC-*.md` — future stage epics (detailed when prioritized)

### Diagrams

- [`docs/diagrams/development-workflow.excalidraw`](docs/diagrams/development-workflow.excalidraw) — Dev process flowchart
- [`docs/diagrams/architecture-overview.excalidraw`](docs/diagrams/architecture-overview.excalidraw) — Full platform architecture
- [`docs/diagrams/stage1-components.excalidraw`](docs/diagrams/stage1-components.excalidraw) — Employee service internals

## Build & Run

No build system is configured yet. Stage 1 will introduce Maven or Gradle for the employee-service.

## Project Structure

- `.idea/` — IntelliJ IDEA project configuration
- `docs/` — Project documentation (architecture, requirements, guidelines)
  - `docs/diagrams/` — Excalidraw diagrams (architecture, workflow, components)
  - `docs/stories/` — User stories and epic placeholders organized by stage
  - `docs/tasks/` — Implementation task files with checklists, organized by story
- `out/` — Compiled class output directory (legacy, will be replaced by build tool output)
