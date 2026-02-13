CREATE TABLE employee (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name  VARCHAR(100)    NOT NULL,
    last_name   VARCHAR(100)    NOT NULL,
    email       VARCHAR(255)    NOT NULL,
    department  VARCHAR(100)    NOT NULL,
    role        VARCHAR(100)    NOT NULL,
    hire_date   DATE            NOT NULL,
    manager_id  UUID            REFERENCES employee(id),
    status      VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE',
    version     BIGINT          NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),

    CONSTRAINT chk_employee_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT uq_employee_email   UNIQUE (email)
);

CREATE INDEX idx_employee_department ON employee (department);
CREATE INDEX idx_employee_manager_id ON employee (manager_id);
CREATE INDEX idx_employee_status     ON employee (status);
