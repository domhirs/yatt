package com.timetracker.employee;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.UUID;

public interface EmployeeRepository
        extends JpaRepository<Employee, UUID>,
                JpaSpecificationExecutor<Employee> {

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, UUID id);

    List<Employee> findByManagerId(UUID managerId);

    List<Employee> findByManagerIdAndStatus(UUID managerId, EmployeeStatus status);

    long countByManagerIdAndStatus(UUID managerId, EmployeeStatus status);
}
