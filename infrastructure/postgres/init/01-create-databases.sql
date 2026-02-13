-- Create the employee service user and database
-- This script runs only on first container initialization

CREATE USER employee_user WITH PASSWORD 'employee_pass';

CREATE DATABASE employee_db OWNER employee_user;

GRANT ALL PRIVILEGES ON DATABASE employee_db TO employee_user;

\c employee_db

GRANT ALL ON SCHEMA public TO employee_user;
