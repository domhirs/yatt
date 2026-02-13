-- CEO (no manager)
INSERT INTO employee (id, first_name, last_name, email, department, role, hire_date, manager_id, status)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Elena', 'Rodriguez', 'elena.rodriguez@timetracker.dev', 'Executive', 'CEO', '2020-01-15', NULL, 'ACTIVE');

-- VP Engineering (reports to CEO)
INSERT INTO employee (id, first_name, last_name, email, department, role, hire_date, manager_id, status)
VALUES ('a0000000-0000-0000-0000-000000000002', 'James', 'Chen', 'james.chen@timetracker.dev', 'Engineering', 'VP of Engineering', '2020-03-01', 'a0000000-0000-0000-0000-000000000001', 'ACTIVE');

-- VP Product (reports to CEO)
INSERT INTO employee (id, first_name, last_name, email, department, role, hire_date, manager_id, status)
VALUES ('a0000000-0000-0000-0000-000000000003', 'Sarah', 'Kim', 'sarah.kim@timetracker.dev', 'Product', 'VP of Product', '2020-06-10', 'a0000000-0000-0000-0000-000000000001', 'ACTIVE');

-- Engineering Manager (reports to VP Engineering)
INSERT INTO employee (id, first_name, last_name, email, department, role, hire_date, manager_id, status)
VALUES ('a0000000-0000-0000-0000-000000000004', 'Michael', 'Thompson', 'michael.thompson@timetracker.dev', 'Engineering', 'Engineering Manager', '2021-02-15', 'a0000000-0000-0000-0000-000000000002', 'ACTIVE');

-- Senior Developer (reports to Engineering Manager)
INSERT INTO employee (id, first_name, last_name, email, department, role, hire_date, manager_id, status)
VALUES ('a0000000-0000-0000-0000-000000000005', 'Priya', 'Patel', 'priya.patel@timetracker.dev', 'Engineering', 'Senior Developer', '2021-09-01', 'a0000000-0000-0000-0000-000000000004', 'ACTIVE');

-- Developer (reports to Engineering Manager)
INSERT INTO employee (id, first_name, last_name, email, department, role, hire_date, manager_id, status)
VALUES ('a0000000-0000-0000-0000-000000000006', 'Alex', 'Nakamura', 'alex.nakamura@timetracker.dev', 'Engineering', 'Developer', '2022-01-10', 'a0000000-0000-0000-0000-000000000004', 'ACTIVE');

-- Developer (reports to Engineering Manager)
INSERT INTO employee (id, first_name, last_name, email, department, role, hire_date, manager_id, status)
VALUES ('a0000000-0000-0000-0000-000000000007', 'Lisa', 'Wang', 'lisa.wang@timetracker.dev', 'Engineering', 'Developer', '2022-06-20', 'a0000000-0000-0000-0000-000000000004', 'ACTIVE');

-- Product Manager (reports to VP Product)
INSERT INTO employee (id, first_name, last_name, email, department, role, hire_date, manager_id, status)
VALUES ('a0000000-0000-0000-0000-000000000008', 'David', 'Okafor', 'david.okafor@timetracker.dev', 'Product', 'Product Manager', '2021-11-01', 'a0000000-0000-0000-0000-000000000003', 'ACTIVE');

-- Junior Developer (reports to Engineering Manager)
INSERT INTO employee (id, first_name, last_name, email, department, role, hire_date, manager_id, status)
VALUES ('a0000000-0000-0000-0000-000000000009', 'Emma', 'Johansson', 'emma.johansson@timetracker.dev', 'Engineering', 'Junior Developer', '2023-03-15', 'a0000000-0000-0000-0000-000000000004', 'ACTIVE');

-- Former employee (INACTIVE, reports to Engineering Manager)
INSERT INTO employee (id, first_name, last_name, email, department, role, hire_date, manager_id, status)
VALUES ('a0000000-0000-0000-0000-000000000010', 'Robert', 'Fischer', 'robert.fischer@timetracker.dev', 'Engineering', 'Developer', '2021-04-01', 'a0000000-0000-0000-0000-000000000004', 'INACTIVE');
