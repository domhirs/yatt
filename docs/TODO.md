# TODO — Stage 1: Employee REST API

Progress checklist for all stories and tasks. Mark tasks `[x]` when fully complete.

> **Rule**: When a task is done, check it off here. When all tasks of a story are done, check off the story too. See [`PROCESS.md`](PROCESS.md) for details.

---

## Stories

- [x] **S1-001 — Project Setup**
  - [x] T-001-01 Init Spring Boot
  - [x] T-001-02 Configure Profiles
  - [x] T-001-03 Docker Compose Dev
  - [x] T-001-04 Health Check
- [x] **S1-002 — Database Schema**
  - [x] T-002-01 Flyway Setup
  - [x] T-002-02 Employee Migration
  - [x] T-002-03 Seed Data
- [ ] **S1-003 — OpenAPI Spec**
  - [ ] T-003-01 OpenAPI Spec
  - [ ] T-003-02 Code Generation
  - [ ] T-003-03 Error Contract
- [ ] **S1-004 — Employee Entity & Repository**
  - [ ] T-004-01 Entity Class
  - [ ] T-004-02 Repository
  - [ ] T-004-03 DTO Records
  - [ ] T-004-04 Mapper
- [ ] **S1-005 — Create Employee**
  - [ ] T-005-01 Service Create
  - [ ] T-005-02 Controller Create
  - [ ] T-005-03 Validation
  - [ ] T-005-04 Unit Tests Create
- [ ] **S1-006 — Get Employee**
  - [ ] T-006-01 Service Get
  - [ ] T-006-02 Controller Get
  - [ ] T-006-03 Invalid UUID
  - [ ] T-006-04 Unit Tests Get
- [ ] **S1-007 — List Employees**
  - [ ] T-007-01 Pagination & Sorting
  - [ ] T-007-02 Filter Specs
  - [ ] T-007-03 Controller List
  - [ ] T-007-04 Unit Tests List
- [ ] **S1-008 — Update Employee**
  - [ ] T-008-01 Service Patch
  - [ ] T-008-02 Controller Patch
  - [ ] T-008-03 Optimistic Locking
  - [ ] T-008-04 Unit Tests Update
- [ ] **S1-009 — Delete Employee**
  - [ ] T-009-01 Soft Delete Service
  - [ ] T-009-02 Controller Delete
  - [ ] T-009-03 Reports Guard
  - [ ] T-009-04 Unit Tests Delete
- [ ] **S1-010 — Search Employees**
  - [ ] T-010-01 Search Query
  - [ ] T-010-02 Controller Search
  - [ ] T-010-03 Unit Tests Search
- [ ] **S1-011 — Org Chart**
  - [ ] T-011-01 Direct Reports
  - [ ] T-011-02 Reporting Chain
  - [ ] T-011-03 Controller Org Chart
  - [ ] T-011-04 Unit Tests Org Chart
- [ ] **S1-012 — Error Handling**
  - [ ] T-012-01 Exception Handler
  - [ ] T-012-02 Custom Exceptions
  - [ ] T-012-03 Error Response DTO
- [ ] **S1-013 — Docker Containerization**
  - [ ] T-013-01 Dockerfile
  - [ ] T-013-02 Compose Prod
  - [ ] T-013-03 Startup Verify
- [ ] **S1-014 — Integration Tests**
  - [ ] T-014-01 Testcontainers Setup
  - [ ] T-014-02 CRUD Integration
  - [ ] T-014-03 Edge Case Integration
