# Development Process

How work flows in this project — from backlog to done.

---

## 1. Overview

This project follows an **iterative, story-driven** development process. Work is organized into **stages**, each containing **user stories**. Stories are broken down into **tasks** with checklists and detailed guidance.

```
Stage (milestone)
  └── Story (user-facing value)
       └── Task (developer action with checklist)
```

### Key locations

| Artifact | Path |
|---|---|
| Backlog (all stories) | [`docs/stories/BACKLOG.md`](stories/BACKLOG.md) |
| Story files | `docs/stories/stage{N}/S{N}-{NNN}-*.md` |
| Task files | `docs/tasks/stage{N}/S{N}-{NNN}/T-{NNN}-{NN}-*.md` |
| Diagrams | `docs/diagrams/` |
| Requirements | [`docs/PRD.md`](PRD.md) |
| Architecture | [`docs/DESIGN.md`](DESIGN.md) |
| Coding standards | [`docs/GUIDELINES.md`](GUIDELINES.md) |

---

## 2. Workflow

### Step-by-step

```
┌─────────┐     ┌────────────┐     ┌────────────┐     ┌───────────┐
│ Backlog  │────►│ Pick Story │────►│ Read Tasks │────►│ Implement │
└─────────┘     └────────────┘     └────────────┘     └─────┬─────┘
                                                            │
                                                    ┌───────▼───────┐
                                                    │  Check Task   │◄──┐
                                                    │  Checklist    │   │
                                                    └───────┬───────┘   │
                                                            │           │
                                                     ┌──────▼──────┐   │
                                                     │   Write     │   │
                                                     │   Tests     │───┘
                                                     └──────┬──────┘
                                                            │
                                                     ┌──────▼──────┐
                                                     │  Verify AC  │
                                                     └──────┬──────┘
                                                            │
                                                     ┌──────▼──────┐
                                                     │   Commit    │
                                                     └──────┬──────┘
                                                            │
                                                     ┌──────▼──────┐
                                                     │    Done     │
                                                     └─────────────┘
```

### Detailed steps

1. **Review the backlog** — Open [`BACKLOG.md`](stories/BACKLOG.md) and pick the next story in priority order. Stories have dependencies; don't start a story until its dependencies are complete.

2. **Read the story** — Open the story file (e.g., `S1-005-create-employee.md`). Understand the user story, acceptance criteria, and dependencies.

3. **Read the tasks** — Each story has task files in `docs/tasks/`. Tasks are numbered in implementation order. Read through all tasks for the story before starting.

4. **Implement** — Work through each task's checklist:
   - Open the task file
   - Follow the checklist items top-to-bottom
   - Expand `<details>` blocks for detailed guidance
   - Check off items as you complete them
   - Add entries to the Development Log section

5. **Write tests** — Follow the testing strategy in [`GUIDELINES.md`](GUIDELINES.md):
   - Unit tests for service logic (JUnit 5 + Mockito)
   - Integration tests with Testcontainers where specified
   - Target: 80%+ coverage on service layer

6. **Verify acceptance criteria** — Go back to the story file and verify every AC is met. If an AC requires manual verification, document the result.

7. **Commit** — Follow [git conventions](GUIDELINES.md#9-git-conventions):
   - Use conventional commits: `feat:`, `fix:`, `test:`, etc.
   - One logical change per commit
   - Reference the story ID in the commit message (e.g., `feat(S1-005): implement create employee endpoint`)

8. **Mark as done** — Update the task status to `Done` and the story status to `Done` when all tasks are complete.

---

## 3. Story lifecycle

```
Backlog → In Progress → Done
```

| Status | Meaning |
|---|---|
| **Backlog** | Not started. Dependencies may not be met yet. |
| **In Progress** | Actively being worked on. |
| **Done** | All tasks complete, all ACs verified, code committed. |

---

## 4. Task lifecycle

```
Pending → In Progress → Done
```

Each task file contains:
- **Checklist** — Concrete steps with `[ ]` / `[x]` checkboxes
- **Details** — Expandable `<details>` blocks with guidance, code snippets, file paths
- **Development Log** — Timestamped entries added during implementation
- **References** — Links to relevant docs, specs, and patterns

---

## 5. Conventions

### Story IDs
- Format: `S{stage}-{NNN}` (e.g., `S1-005`)
- Stage number maps to the project stage (1-4)
- Sequence number is unique within the stage

### Task IDs
- Format: `T-{story}-{NN}` (e.g., `T-005-01`)
- First three digits match the parent story
- Last two digits are the task sequence within the story

### Branch naming
- One branch per story: `feat/S1-005-create-employee`
- Follow [git conventions](GUIDELINES.md#9-git-conventions)

### Commit messages
- Reference the story: `feat(S1-005): implement create employee endpoint`
- Reference the task in the body if useful: `Task: T-005-01`

---

## 6. Definition of Done

A story is **Done** when:

- [ ] All task checklists are complete
- [ ] All acceptance criteria pass
- [ ] Unit tests written and passing (80%+ service coverage)
- [ ] Integration tests passing (where applicable)
- [ ] Code follows [GUIDELINES.md](GUIDELINES.md)
- [ ] No compiler warnings
- [ ] Code committed with conventional commit messages

---

## 7. Diagrams

Visual references for the development process and architecture:

| Diagram | Path | Description |
|---|---|---|
| Development Workflow | [`diagrams/development-workflow.excalidraw`](diagrams/development-workflow.excalidraw) | Flowchart of the development process |
| Architecture Overview | [`diagrams/architecture-overview.excalidraw`](diagrams/architecture-overview.excalidraw) | Full platform architecture, color-coded by stage |
| Stage 1 Components | [`diagrams/stage1-components.excalidraw`](diagrams/stage1-components.excalidraw) | Employee service internal components |
