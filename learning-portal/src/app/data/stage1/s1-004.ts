import { Story } from '../../models/step.model';

export const S1_004: Story = {
  id: 'S1-004',
  title: 'S1-004 — Employee Entity & Repository',
  tasks: [
    {
      id: 'T-004-01',
      title: 'Employee JPA Entity',
      description:
        'An "entity" is a Java class that represents one row in a database table. When you annotate ' +
        'a class with @Entity, you are telling Hibernate (the JPA implementation bundled with Spring ' +
        'Boot) "this class maps to a database table." Hibernate then takes care of reading rows from ' +
        'the database and turning them into Java objects — and vice versa when you save.\n\n' +
        'Think of Hibernate as a translator between the Java world (objects) and the SQL world (rows). ' +
        'Without it, you would write raw SQL like SELECT * FROM employee WHERE id = ? and manually ' +
        'map each column to a Java field. Hibernate does all of that for you. You call ' +
        'repository.findById(id) and Hibernate executes the SQL, reads the result set, and constructs ' +
        'a fully populated Employee object.\n\n' +
        'The Employee entity you are building here maps to the employee table you created in the ' +
        'Flyway migration. Every field on the class corresponds to a column. The annotations tell ' +
        'Hibernate the exact column name, whether it can be null, and how relationships to other ' +
        'rows work. If you miss an annotation or spell a column name wrong, Hibernate will throw ' +
        'a "Schema-validation" error at startup — which is actually helpful because it catches ' +
        'mismatches before your first API call.\n\n' +
        'One subtle but critical rule: the @Id field (the primary key) drives how Hibernate decides ' +
        'whether to INSERT or UPDATE. If the id is null, Hibernate INSERTs a new row. If it has a ' +
        'value, Hibernate UPDATEs the existing row. This is why you never set the ID yourself on ' +
        'a new entity — let @GeneratedValue handle it.',
      concepts: [
        {
          term: '@Entity',
          explanation:
            'Marks a Java class as a JPA entity. Hibernate will look for a database table with the ' +
            'same name (or the name you specify with @Table). Without this annotation, Hibernate ' +
            'ignores the class entirely. Every entity class must have a no-argument constructor ' +
            '(which Java generates automatically when you define no constructors).',
        },
        {
          term: '@Table(name = "employee")',
          explanation:
            'Explicitly names the database table this entity maps to. Without it, Hibernate would ' +
            'guess the table name from the class name — "Employee" becomes "employee" in some ' +
            'dialects. Being explicit prevents surprises. The name must exactly match the table ' +
            'name in your Flyway migration.',
        },
        {
          term: '@Id and @GeneratedValue',
          explanation:
            '@Id marks the primary key field. @GeneratedValue(strategy = GenerationType.UUID) tells ' +
            'Hibernate to generate a new UUID automatically when you persist a new employee, so you ' +
            'never need to supply an ID yourself. Hibernate calls UUID.randomUUID() and stores the ' +
            'result, matching what gen_random_uuid() does in the database.',
        },
        {
          term: 'FetchType.LAZY',
          explanation:
            'When one entity references another (like an Employee referencing their manager, who is ' +
            'also an Employee), LAZY loading means Hibernate does NOT load the related entity from ' +
            'the database until you actually access it with e.getManager(). The alternative, EAGER, ' +
            'would load the entire manager object every time you load any employee — including when ' +
            'you just need the employee\'s name.',
        },
        {
          term: '@Version',
          explanation:
            'A special field that Hibernate increments by 1 on every UPDATE. If two requests try to ' +
            'update the same employee at the same time, the second one will see that the version ' +
            'number has changed (because the first update already incremented it) and throw an ' +
            'OptimisticLockException — preventing silent data overwrites. This is "optimistic locking."',
        },
        {
          term: '@CreationTimestamp / @UpdateTimestamp',
          explanation:
            'Hibernate annotations (not standard JPA) that automatically set the field to the current ' +
            'time when the entity is first saved (@CreationTimestamp) or any time it is updated ' +
            '(@UpdateTimestamp). You never set these fields yourself — Hibernate manages them. ' +
            'The updatable = false on createdAt prevents Hibernate from ever changing it after insert.',
        },
      ],
      checklist: [
        'Create the file src/main/java/com/timetracker/employee/EmployeeStatus.java — this is a Java enum (a fixed set of named constants). It has two values: ACTIVE and INACTIVE.',
        'Create the file src/main/java/com/timetracker/employee/Employee.java. Add @Entity and @Table(name = "employee") above the class declaration, exactly as shown.',
        'Map the id field: copy the three annotations @Id, @GeneratedValue(strategy = GenerationType.UUID), and @Column exactly. The UUID type comes from java.util.UUID — you will need to add the import.',
        'Map firstName, lastName, email, department, and role with @Column annotations. Pay attention to nullable = false and length = 100. Email also needs unique = true.',
        'Map hireDate as @Column(name = "hire_date", nullable = false) with type LocalDate (from java.time.LocalDate).',
        'Map the manager relationship: copy the @ManyToOne(fetch = FetchType.LAZY) and @JoinColumn(name = "manager_id") lines exactly. Notice there is no nullable = false — the manager CAN be null for top-level employees.',
        'Map directReports: copy the @OneToMany(mappedBy = "manager") annotation. The mappedBy = "manager" tells Hibernate "the manager field on Employee is the owning side of this relationship."',
        'Map status with @Enumerated(EnumType.STRING) — this tells Hibernate to store the enum\'s name ("ACTIVE") rather than its ordinal number (0), which makes the database column human-readable.',
        'Add the @Version private Long version; field. Hibernate manages this completely — never set it yourself.',
        'Add @CreationTimestamp and @UpdateTimestamp fields of type Instant (from java.time.Instant). Add updatable = false to the @Column for createdAt.',
        'Generate getters and setters using your IDE: right-click in the class body → Generate → Getters and Setters → select all fields.',
        'Add the equals() and hashCode() methods EXACTLY as shown in the example — do NOT use your IDE\'s auto-generate for these in JPA entities. The IDE version uses all fields, which breaks with Hibernate.',
        'Start the app. If Hibernate logs "Schema-validation: missing table [employee]", the Flyway migration has not run yet — do S1-002 first.',
        'Commit: feat(S1-004): add Employee JPA entity',
      ],
      examples: [
        {
          lang: 'java',
          label: 'EmployeeStatus.java — the enum',
          code: `// What this file does:
// Defines the two possible states for an employee.
// An enum is a class with a fixed set of named constants.
// Using an enum instead of a raw String prevents typos like "Ative" or "active".

package com.timetracker.employee;

// "enum" declares a fixed set of values. These names must exactly match
// the strings stored in the database (because of @Enumerated(EnumType.STRING)).
public enum EmployeeStatus {
    ACTIVE,    // Employee is currently working
    INACTIVE   // Employee has left or been deactivated
}`,
        },
        {
          lang: 'java',
          label: 'Employee.java — the full entity',
          code: `// What this file does:
// Maps the Java Employee class to the "employee" database table.
// Hibernate reads this class (and its annotations) to know how to:
//   - SELECT rows from "employee" and turn them into Employee objects
//   - INSERT new Employee objects as rows
//   - UPDATE existing rows when you change fields and save

package com.timetracker.employee;

// Jakarta Persistence API (JPA) annotations for entity mapping
import jakarta.persistence.*;
// Hibernate-specific annotations (not standard JPA) for timestamp management
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;       // Represents a point in time (UTC) — for createdAt/updatedAt
import java.time.LocalDate;     // Represents a date without time — for hireDate
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;          // Universally Unique Identifier — for the id field

// @Entity — tells Hibernate "this class maps to a database table"
// @Table — specifies WHICH table. Without this, Hibernate guesses (sometimes wrongly).
@Entity
@Table(name = "employee")
public class Employee {

    // @Id — marks this field as the primary key
    // @GeneratedValue(UUID) — Hibernate calls UUID.randomUUID() when saving a new entity
    // @Column — maps to the "id" column (the name matches by default, but being explicit is clearer)
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // @Column annotations tell Hibernate:
    //   name     = the exact column name in the database
    //   nullable = whether the column allows NULL (false = NOT NULL)
    //   length   = maximum string length (matches VARCHAR(100) in the migration)
    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    // unique = true adds a uniqueness check (though the DB UNIQUE constraint is the real enforcement)
    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, length = 100)
    private String department;

    @Column(nullable = false, length = 100)
    private String role;

    // LocalDate maps to the SQL DATE type — just year, month, day (no time)
    @Column(name = "hire_date", nullable = false)
    private LocalDate hireDate;

    // @ManyToOne — this employee has ONE manager; a manager can have MANY direct reports
    // FetchType.LAZY — do NOT load the manager object from DB until getManager() is called
    //   (prevents loading the entire management chain when you just need the employee's name)
    // @JoinColumn(name = "manager_id") — the foreign key column in the employee table
    // Note: no nullable = false — the manager CAN be null for top-level employees (like the CEO)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Employee manager;

    // @OneToMany — this employee can have MANY direct reports
    // mappedBy = "manager" — tells Hibernate: "the 'manager' field on Employee owns this relationship"
    //   This prevents Hibernate from creating a separate join table.
    // We initialise to empty ArrayList so code calling getDirectReports() never gets null.
    @OneToMany(mappedBy = "manager")
    private List<Employee> directReports = new ArrayList<>();

    // @Enumerated(EnumType.STRING) — store the enum NAME ("ACTIVE") not its ordinal (0)
    //   Using STRING is always safer than ORDINAL: if you reorder enum values, ORDINAL breaks.
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EmployeeStatus status = EmployeeStatus.ACTIVE;  // Default: new employees start ACTIVE

    // @Version — Hibernate increments this field on every UPDATE.
    // If two concurrent updates try to change the same employee, the second one
    // will find the version has changed and throw OptimisticLockException.
    // Never set this field yourself — Hibernate owns it.
    @Version
    private Long version;

    // @CreationTimestamp — Hibernate sets this to NOW() when the entity is first persisted.
    // updatable = false — Hibernate will never include this column in UPDATE statements.
    // Instant = timestamp with timezone information (stored as UTC in PostgreSQL TIMESTAMPTZ)
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    // @UpdateTimestamp — Hibernate sets this to NOW() on every UPDATE.
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // === Getters and Setters ===
    // Generate these with your IDE: right-click → Generate → Getters and Setters
    // (Omitted here for brevity — generate for ALL fields above)

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public LocalDate getHireDate() { return hireDate; }
    public void setHireDate(LocalDate hireDate) { this.hireDate = hireDate; }
    public Employee getManager() { return manager; }
    public void setManager(Employee manager) { this.manager = manager; }
    public List<Employee> getDirectReports() { return directReports; }
    public EmployeeStatus getStatus() { return status; }
    public void setStatus(EmployeeStatus status) { this.status = status; }
    public Long getVersion() { return version; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }

    // === equals() and hashCode() ===
    // IMPORTANT: Do NOT use your IDE's auto-generated version for JPA entities.
    // The IDE generates equals() using all fields — this breaks with Hibernate's
    // lazy loading and causes incorrect behaviour in collections.
    //
    // The correct Hibernate pattern: base equality ONLY on the id field.
    // Two Employee objects are the same if and only if they have the same database ID.
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        // "instanceof Employee other" is a Java 16+ pattern match — avoids a cast
        if (!(o instanceof Employee other)) return false;
        // Two employees are equal only if their IDs are both non-null and the same.
        // A new, unsaved employee has id = null — it is not equal to any other entity.
        return id != null && id.equals(other.getId());
    }

    @Override
    public int hashCode() {
        // Returning a constant hashCode is the recommended Hibernate pattern.
        // Normally, changing an object's hashCode after it is added to a HashSet
        // causes the Set to lose track of it. With JPA entities, the id changes
        // from null (before save) to a real UUID (after save) — so we cannot use
        // id in hashCode without breaking Set behaviour.
        // Using a constant is safe: it puts all employees in the same hash bucket
        // (slightly slower for large collections) but always correct.
        return getClass().hashCode();
    }
}`,
        },
      ],
      links: [
        { label: 'Hibernate ORM — Entity Mapping', url: 'https://docs.jboss.org/hibernate/orm/6.4/userguide/html_single/Hibernate_User_Guide.html#entity' },
        { label: 'Vlad Mihalcea — equals/hashCode for JPA entities', url: 'https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/' },
        { label: 'Jakarta Persistence API — specification', url: 'https://jakarta.ee/specifications/persistence/' },
        { label: 'Baeldung — JPA Entity Lifecycle', url: 'https://www.baeldung.com/jpa-hibernate-persistence-context' },
      ],
    },
    {
      id: 'T-004-02',
      title: 'Employee Repository',
      description:
        'A repository is an object that provides methods to read and write entities to the database. ' +
        'Spring Data JPA generates the implementation automatically — you only write an interface ' +
        'with method signatures. Spring reads the method names and derives the correct SQL query ' +
        'at startup time.\n\n' +
        'For example, if you declare boolean existsByEmail(String email), Spring Data sees the ' +
        '"existsBy" prefix and the "Email" part (which matches the email field on Employee) and ' +
        'generates SELECT EXISTS(SELECT 1 FROM employee WHERE email = ?) automatically. You do not ' +
        'write any SQL. This is called "query derivation" or "derived query methods."\n\n' +
        'Extending JpaRepository<Employee, UUID> gives you about 15 common methods for free: ' +
        'findById(), findAll(), save(), delete(), count(), existsById(), and more. The two type ' +
        'parameters tell Spring Data which entity this repository manages (Employee) and what type ' +
        'the primary key is (UUID).\n\n' +
        'The second interface, JpaSpecificationExecutor<Employee>, adds a findAll(Specification) ' +
        'method. A Specification is a reusable, composable query predicate — think of it as a ' +
        'WHERE clause you can build dynamically at runtime. This is needed for the list endpoint ' +
        'where users can filter by department, status, or search by name simultaneously.',
      concepts: [
        {
          term: 'Spring Data JPA repository',
          explanation:
            'An interface that extends JpaRepository tells Spring Data: "manage Employee entities." ' +
            'Spring Data generates a concrete class implementing your interface at application startup. ' +
            'You never write SQL for standard CRUD operations — save(), findById(), findAll(), ' +
            'delete() are all provided. The generated class uses Hibernate under the hood.',
        },
        {
          term: 'Derived query methods',
          explanation:
            'Spring Data reads method names and derives the SQL automatically. The method name follows ' +
            'a grammar: find/exists/count + By + FieldName + [And/Or] + FieldName. ' +
            'existsByEmail → WHERE email = ?. findByManagerId → WHERE manager_id = ?. ' +
            'existsByEmailAndIdNot → WHERE email = ? AND id != ?. No @Query annotation needed ' +
            'for simple conditions like these.',
        },
        {
          term: 'JpaRepository<T, ID>',
          explanation:
            'The generic JpaRepository interface takes two type parameters: T is the entity type ' +
            '(Employee) and ID is the type of the primary key (UUID). These tell Spring Data which ' +
            'database table to query and how to look up rows by primary key. You get findById(UUID), ' +
            'save(Employee), deleteById(UUID), and many more methods for free.',
        },
        {
          term: 'JpaSpecificationExecutor',
          explanation:
            'This interface adds findAll(Specification<T>) to your repository. A Specification is a ' +
            'lambda or class that adds conditions to a JPA Criteria query. You can combine multiple ' +
            'Specifications with .and() and .or() to build complex, dynamic WHERE clauses at runtime ' +
            'without concatenating SQL strings.',
        },
        {
          term: 'Optional<T>',
          explanation:
            'findById() returns Optional<Employee> rather than Employee (which could be null). An ' +
            'Optional is a container that either holds a value or is empty. This forces you to ' +
            'explicitly handle the "not found" case: you call .orElseThrow() to throw an exception ' +
            'if the employee does not exist, or .orElse(null) to get null. This prevents ' +
            'NullPointerExceptions from being silently ignored.',
        },
      ],
      checklist: [
        'Create the file src/main/java/com/timetracker/employee/EmployeeRepository.java as a Java interface (not a class). The interface declaration line is: public interface EmployeeRepository extends JpaRepository<Employee, UUID>, JpaSpecificationExecutor<Employee>.',
        'Add the four custom query methods shown in the example. Do not add @Query annotations — Spring Data derives the SQL from the method names automatically.',
        'Build the project (./mvnw compile) to verify Spring Data can parse all method names. If a method name is wrong, Spring throws a PropertyReferenceException at startup.',
        'Verify the derived queries work: start the app, hit the /actuator/health endpoint (which triggers a DB check), and look for Hibernate SQL logs in the console (show-sql: true in dev profile).',
        'Commit: feat(S1-004): add EmployeeRepository with query methods',
      ],
      examples: [
        {
          lang: 'java',
          label: 'EmployeeRepository.java — the complete repository interface',
          code: `// What this file does:
// Declares the database access methods for Employee entities.
// Spring Data JPA reads this interface at startup and generates the implementation.
// You never implement this interface yourself — Spring does it automatically.

package com.timetracker.employee;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.UUID;

// This is an interface, not a class — it has no method bodies.
// Extending JpaRepository<Employee, UUID> gives you these methods for free:
//   save(Employee)           → INSERT or UPDATE
//   findById(UUID)           → SELECT WHERE id = ? (returns Optional<Employee>)
//   findAll()                → SELECT all rows
//   deleteById(UUID)         → DELETE WHERE id = ?
//   existsById(UUID)         → SELECT EXISTS(SELECT 1 WHERE id = ?)
//   count()                  → SELECT COUNT(*)
//   ... and about 10 more
//
// JpaSpecificationExecutor<Employee> adds:
//   findAll(Specification<Employee>)  → SELECT with dynamic WHERE clause
//   count(Specification<Employee>)    → COUNT with dynamic WHERE clause
public interface EmployeeRepository
        extends JpaRepository<Employee, UUID>,
                JpaSpecificationExecutor<Employee> {

    // Derived query: Spring sees "existsBy" + "Email" (matches field "email" on Employee)
    // Generated SQL: SELECT EXISTS(SELECT 1 FROM employee WHERE email = ?)
    // Used in create(): before inserting, check no other employee has this email.
    boolean existsByEmail(String email);

    // Derived query: Spring sees "existsBy" + "Email" + "And" + "Id" + "Not"
    // The "Not" suffix means "WHERE id != ?"
    // Generated SQL: SELECT EXISTS(SELECT 1 FROM employee WHERE email = ? AND id != ?)
    // Used in update(): email must be unique, but it is OK if the CURRENT employee has it.
    boolean existsByEmailAndIdNot(String email, UUID id);

    // Derived query: Spring sees "findBy" + "ManagerId" (matches the manager's ID column)
    // Generated SQL: SELECT * FROM employee WHERE manager_id = ?
    // Used in the org-chart endpoint: get all direct reports of a given manager.
    List<Employee> findByManagerId(UUID managerId);

    // Derived query: count employees where manager_id matches AND status matches.
    // Generated SQL: SELECT COUNT(*) FROM employee WHERE manager_id = ? AND status = ?
    // Used in delete guard: cannot delete a manager who still has active direct reports.
    long countByManagerIdAndStatus(UUID managerId, EmployeeStatus status);
}`,
        },
      ],
      links: [
        { label: 'Spring Data JPA — Query Methods', url: 'https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html' },
        { label: 'Spring Data JPA — Specifications', url: 'https://docs.spring.io/spring-data/jpa/reference/jpa/specifications.html' },
        { label: 'Baeldung — Spring Data JPA derived query methods', url: 'https://www.baeldung.com/spring-data-derived-queries' },
      ],
    },
    {
      id: 'T-004-03',
      title: 'DTO Records',
      description:
        'A DTO (Data Transfer Object) is a class whose sole purpose is to carry data between layers. ' +
        'In a REST API, you have two distinct worlds: the persistence world (the Employee entity, ' +
        'which Hibernate manages and which has a direct database mapping) and the API world (the ' +
        'JSON that comes in from the client and goes back out). DTOs bridge these two worlds without ' +
        'coupling them.\n\n' +
        'Why not just expose the entity directly? Because the entity has database concerns: it has ' +
        '@Version for optimistic locking, @CreationTimestamp for audit, lazy-loaded relationships. ' +
        'If you serialise it directly to JSON, Jackson might trigger lazy loading (causing SQL ' +
        'queries during serialisation), or it might expose the version field when you do not want ' +
        'it to. DTOs give you full control over what the API contract looks like.\n\n' +
        'Java records are perfect for DTOs. They are immutable (all fields are set at construction ' +
        'time and can never change), they are concise (no boilerplate setters or constructors), and ' +
        'they serialise to JSON naturally with Jackson. A record with fields firstName and lastName ' +
        'produces exactly the JSON you would expect: {"firstName":"Alice","lastName":"Admin"}.\n\n' +
        'The difference between CreateEmployeeRequest and UpdateEmployeeRequest reflects HTTP ' +
        'semantics. POST (create) requires all mandatory fields — if firstName is missing, the ' +
        'request is invalid. PATCH (partial update) allows null for any field to mean "do not ' +
        'change this field" — a client can update just the role without re-sending all other fields.',
      concepts: [
        {
          term: 'DTO (Data Transfer Object)',
          explanation:
            'A DTO is a simple object that carries data between layers or over the network. It has ' +
            'no business logic, no database annotations, and no relationships. A request DTO ' +
            'carries what the client sent; a response DTO carries what the client will receive. ' +
            'Using separate DTOs for requests and responses gives you independent control over ' +
            'each API contract.',
        },
        {
          term: 'Java record',
          explanation:
            'A record is a Java class designed to hold immutable data. public record Foo(String a, int b) {} ' +
            'automatically gets: a constructor Foo(String a, int b), accessor methods a() and b() ' +
            '(not getA()), correct equals()/hashCode() using all fields, and a readable toString(). ' +
            'Records cannot have setters because their fields are final.',
        },
        {
          term: 'Bean Validation annotations',
          explanation:
            'Annotations like @NotBlank, @Email, @Size, and @PastOrPresent come from the Jakarta ' +
            'Bean Validation specification. They declare constraints on record fields. Spring Boot ' +
            'triggers these constraints when the controller receives a request annotated with @Valid. ' +
            'A failed constraint throws MethodArgumentNotValidException, which your exception ' +
            'handler converts to a 422 response.',
        },
        {
          term: 'PATCH semantics (nullable fields)',
          explanation:
            'PATCH means "partial update" — only change the fields that are present in the request. ' +
            'In UpdateEmployeeRequest, every field is nullable (no @NotBlank, no @NotNull). A null ' +
            'value means "the client did not send this field, so leave it unchanged." The mapper\'s ' +
            'updateEntity() method checks each field for null before applying it.',
        },
        {
          term: 'Pagination metadata',
          explanation:
            'When a list endpoint can return thousands of records, you return one "page" at a time ' +
            'and include metadata so the client knows how to navigate. PagedEmployeeResponse ' +
            'includes content (the current page\'s items), page (which page this is, 0-based), ' +
            'size (items per page), totalElements (total matching records), and totalPages ' +
            '(calculated from totalElements / size).',
        },
      ],
      checklist: [
        'Create the package directory src/main/java/com/timetracker/employee/dto/ (either through your IDE or by creating a placeholder file).',
        'Create CreateEmployeeRequest.java as a record. Copy the field declarations exactly, including the Bean Validation annotations (@NotBlank, @Size, @Email, @NotNull, @PastOrPresent). All fields except managerId are required.',
        'Create UpdateEmployeeRequest.java as a record with all nullable fields (no @NotBlank or @NotNull). Include the Long version field — this is required by optimistic locking when the client sends a PATCH.',
        'Create EmployeeResponse.java as a record with all output fields. Include version (the client reads this and sends it back on PATCH), createdAt, and updatedAt.',
        'Create PagedEmployeeResponse.java as a record with content, page, size, totalElements, and totalPages.',
        'Build the project (./mvnw compile) to verify all records compile without errors.',
        'Commit: feat(S1-004): add DTO records with validation',
      ],
      examples: [
        {
          lang: 'java',
          label: 'CreateEmployeeRequest.java — record with validation',
          code: `// What this file does:
// Defines the shape of the JSON body for POST /api/v1/employees.
// Bean Validation annotations define what constitutes a valid request.
// Spring's @Valid annotation on the controller parameter triggers these checks.

package com.timetracker.employee.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.UUID;

// "record" gives us: constructor, getters (firstName(), lastName(), etc.),
// equals(), hashCode(), toString() — all for free.
// The fields are automatically private and final — this record is immutable.
public record CreateEmployeeRequest(

    // @NotBlank checks that the string is not null AND not empty AND not only whitespace.
    // @Size(max = 100) checks that the string is at most 100 characters.
    // Both constraints must pass for the request to be accepted.
    @NotBlank @Size(max = 100) String firstName,
    @NotBlank @Size(max = 100) String lastName,

    // @Email checks that the string looks like a valid email address format.
    // @NotBlank ensures it is not empty.
    @NotBlank @Email String email,

    @NotBlank @Size(max = 100) String department,
    @NotBlank @Size(max = 100) String role,

    // @NotNull checks that the field is not absent from the JSON (but it can be "2024-01-01").
    // @PastOrPresent checks that the date is not in the future (you cannot hire someone tomorrow).
    @NotNull @PastOrPresent LocalDate hireDate,

    // managerId has NO @NotNull — it is intentionally nullable.
    // A null managerId means this employee has no manager (top of the org chart).
    UUID managerId

) {}`,
        },
        {
          lang: 'java',
          label: 'UpdateEmployeeRequest.java — PATCH semantics (all nullable)',
          code: `// What this file does:
// Defines the shape of the JSON body for PATCH /api/v1/employees/{id}.
// All fields are optional (nullable). A null field means "do not change this field."
// The version field is included for optimistic locking.

package com.timetracker.employee.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.UUID;

public record UpdateEmployeeRequest(

    // No @NotBlank here — null means "do not change firstName".
    // @Size(max = 100) still applies IF the field is provided (not null).
    @Size(max = 100) String firstName,
    @Size(max = 100) String lastName,

    // If email is provided (not null), it must still be a valid email format.
    @Email String email,

    @Size(max = 100) String department,
    @Size(max = 100) String role,

    // If hireDate is provided, it still cannot be in the future.
    @PastOrPresent LocalDate hireDate,

    // managerId can be updated, or set to null (to remove a manager relationship).
    UUID managerId,

    // IMPORTANT: The client must send the current version number back with every PATCH.
    // Hibernate checks: is this version == the current version in the database?
    //   If yes → proceed with the update, increment version to version+1.
    //   If no  → throw OptimisticLockException (someone else updated this employee first).
    Long version

) {}`,
        },
        {
          lang: 'java',
          label: 'EmployeeResponse.java and PagedEmployeeResponse.java',
          code: `// What this file does:
// Defines what a single employee looks like in API responses.
// This is what clients receive from GET /{id}, POST (after create), and PATCH (after update).

package com.timetracker.employee.dto;

import com.timetracker.employee.EmployeeStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

// All fields in a response record are what the client will see in the JSON.
// Jackson (the JSON library) serialises record accessor methods to JSON keys:
//   firstName() → "firstName": "Alice"
//   hireDate()  → "hireDate": "2024-01-15"
public record EmployeeResponse(
    UUID id,
    String firstName,
    String lastName,
    String email,
    String department,
    String role,
    LocalDate hireDate,
    UUID managerId,          // null for top-level employees
    EmployeeStatus status,   // "ACTIVE" or "INACTIVE" in JSON (because of @Enumerated(STRING))
    Long version,            // The client reads this and sends it back with every PATCH
    Instant createdAt,       // e.g. "2024-01-15T10:30:00Z"
    Instant updatedAt
) {}


// ---

// What this file does:
// Wraps a page of employees with pagination metadata for the list endpoint.
// The client uses totalPages and page to know when it has reached the last page.

public record PagedEmployeeResponse(
    List<EmployeeResponse> content,   // The employees on this page
    int page,                         // Current page number (0 = first page)
    int size,                         // How many employees per page
    long totalElements,               // Total matching employees across ALL pages
    int totalPages                    // Total number of pages (= ceil(totalElements / size))
) {}`,
        },
      ],
      links: [
        { label: 'Jakarta Bean Validation — Built-in Constraints', url: 'https://jakarta.ee/specifications/bean-validation/3.0/jakarta-bean-validation-spec-3.0.html#builtinconstraints' },
        { label: 'Java Records (JEP 395)', url: 'https://openjdk.org/jeps/395' },
        { label: 'Baeldung — Java Record Classes', url: 'https://www.baeldung.com/java-record-keyword' },
      ],
    },
    {
      id: 'T-004-04',
      title: 'Employee Mapper',
      description:
        'A mapper is a class with methods that convert data from one shape to another — from a DTO ' +
        'to an entity, or from an entity to a DTO. It performs pure mechanical translation: copy ' +
        'this field from here to there, with no business logic and no database access.\n\n' +
        'The separation of responsibilities matters here. The mapper handles field-to-field ' +
        'translation. The service handles anything that requires a decision: "is this email already ' +
        'taken?" (requires querying the database), "is the manager active?" (also requires the ' +
        'database). The mapper knows nothing about these rules — it just copies fields.\n\n' +
        'Notice that the mapper\'s toEntity() method does NOT set the manager field. That is ' +
        'intentional. Setting the manager requires loading the manager entity from the database ' +
        '(which requires the repository), and the mapper does not have access to the repository. ' +
        'The service does: it validates the manager exists, loads it, and calls entity.setManager() ' +
        'after the mapper has run.\n\n' +
        'The updateEntity() method implements PATCH semantics: for each field in the update request, ' +
        'it checks if the value is non-null before applying it. A null value means "the client did ' +
        'not send this field" — so leave it unchanged. This is simpler than it sounds: ' +
        'if (req.firstName() != null) e.setFirstName(req.firstName()) — check then set.',
      concepts: [
        {
          term: '@Component',
          explanation:
            'Marks a class as a Spring-managed bean. When Spring scans the com.timetracker.employee ' +
            'package at startup, it finds EmployeeMapper (because of @Component) and creates a single ' +
            'instance of it. Other classes (like EmployeeService) can receive this instance via ' +
            'constructor injection without creating it themselves.',
        },
        {
          term: 'Mapper class pattern',
          explanation:
            'A mapper is a class (or interface if using MapStruct) that translates between different ' +
            'object shapes. It knows about both the entity and the DTO, but has no dependencies on ' +
            'repositories, external services, or business rules. Pure field copying. This makes it ' +
            'easy to test in isolation — no database needed.',
        },
        {
          term: 'toEntity() method',
          explanation:
            'Converts a CreateEmployeeRequest DTO into an Employee entity ready to be saved. The ' +
            'mapper copies the straightforward fields (name, email, department, role, hireDate) and ' +
            'sets the default status to ACTIVE. It does NOT set the manager — that is resolved by ' +
            'the service after validating the manager exists.',
        },
        {
          term: 'toResponse() method',
          explanation:
            'Converts a managed Employee entity into an EmployeeResponse DTO for the API response. ' +
            'One subtlety: managerId is derived by calling e.getManager() (which may trigger a lazy ' +
            'load) and then getting its ID. The null check handles top-level employees who have no ' +
            'manager. This method should only be called while a Hibernate session is open.',
        },
        {
          term: 'updateEntity() method',
          explanation:
            'Applies the non-null fields of an UpdateEmployeeRequest to an existing Employee entity. ' +
            'Each field is guarded by a null check: only update if the client sent a value. This is ' +
            'the PATCH pattern — partial updates. The method does not return anything (void) because ' +
            'it modifies the entity in-place.',
        },
      ],
      checklist: [
        'Create the file src/main/java/com/timetracker/employee/EmployeeMapper.java annotated with @Component (import from org.springframework.stereotype.Component).',
        'Implement toEntity(CreateEmployeeRequest req) — copy firstName, lastName, email, department, role, hireDate. Set status to EmployeeStatus.ACTIVE. Do NOT set the manager — leave it null, the service will set it.',
        'Implement toResponse(Employee e) — copy all fields. For managerId, use: e.getManager() != null ? e.getManager().getId() : null to safely handle the null manager case.',
        'Implement updateEntity(Employee e, UpdateEmployeeRequest req) — wrap each setter in a null check: if (req.firstName() != null) e.setFirstName(req.firstName());',
        'Write a unit test for each mapper method (no Spring context needed — just new EmployeeMapper() and plain Java objects). Verify each field is correctly mapped.',
        'Commit: feat(S1-004): add EmployeeMapper component',
      ],
      examples: [
        {
          lang: 'java',
          label: 'EmployeeMapper.java — the complete mapper',
          code: `// What this file does:
// Translates between Employee entities and DTOs.
// Contains NO business logic and NO database access.
// The service calls these methods before and after interacting with the repository.

package com.timetracker.employee;

import com.timetracker.employee.dto.*;
import org.springframework.stereotype.Component;

// @Component marks this class as a Spring bean.
// Spring creates one instance at startup and injects it wherever it is needed.
// EmployeeService receives an EmployeeMapper instance via constructor injection.
@Component
public class EmployeeMapper {

    // Creates a new Employee entity from a create request DTO.
    // Think of this as "prepare an unsaved entity" — the entity has no ID yet
    // (Hibernate sets the ID when you call repository.save(entity)).
    //
    // Note what is NOT set here:
    //   - id: Hibernate generates it on save
    //   - manager: the service validates and sets this after calling toEntity()
    //   - version: Hibernate initialises this to 0 on first save
    //   - createdAt/updatedAt: @CreationTimestamp/@UpdateTimestamp handle these
    public Employee toEntity(CreateEmployeeRequest req) {
        var employee = new Employee();  // "var" infers the type — same as "Employee employee"
        employee.setFirstName(req.firstName());   // Record accessor: firstName() not getFirstName()
        employee.setLastName(req.lastName());
        employee.setEmail(req.email());
        employee.setDepartment(req.department());
        employee.setRole(req.role());
        employee.setHireDate(req.hireDate());
        employee.setStatus(EmployeeStatus.ACTIVE); // All new employees start ACTIVE
        // manager is intentionally not set here — the service handles it
        return employee;
    }

    // Creates an EmployeeResponse DTO from a managed Employee entity.
    // This is what gets serialised to JSON and sent to the client.
    //
    // The manager relationship is LAZY-loaded. Calling e.getManager() here will
    // trigger a SELECT if the manager has not been loaded yet. This method should
    // only be called while a Hibernate session is open (i.e., within the service method).
    public EmployeeResponse toResponse(Employee e) {
        return new EmployeeResponse(
            e.getId(),
            e.getFirstName(),
            e.getLastName(),
            e.getEmail(),
            e.getDepartment(),
            e.getRole(),
            e.getHireDate(),
            // managerId: null-safe — top-level employees have no manager
            e.getManager() != null ? e.getManager().getId() : null,
            e.getStatus(),
            e.getVersion(),    // Client reads this; must send it back on PATCH
            e.getCreatedAt(),
            e.getUpdatedAt()
        );
    }

    // Applies non-null fields from the update request to the existing entity.
    // This implements PATCH semantics: only update fields the client sent.
    // A null field in UpdateEmployeeRequest means "leave this field unchanged."
    //
    // Note: managerId changes are handled by the service (requires DB validation).
    // The service calls this method and then separately handles manager updates.
    public void updateEntity(Employee employee, UpdateEmployeeRequest req) {
        // For each field: only update if the client sent a non-null value.
        if (req.firstName()  != null) employee.setFirstName(req.firstName());
        if (req.lastName()   != null) employee.setLastName(req.lastName());
        if (req.email()      != null) employee.setEmail(req.email());
        if (req.department() != null) employee.setDepartment(req.department());
        if (req.role()       != null) employee.setRole(req.role());
        if (req.hireDate()   != null) employee.setHireDate(req.hireDate());
        // manager is handled by the service, not here
    }
}`,
        },
      ],
      links: [
        { label: 'MapStruct — annotation-based mapper (alternative for large projects)', url: 'https://mapstruct.org/' },
        { label: 'Baeldung — MapStruct Guide', url: 'https://www.baeldung.com/mapstruct' },
      ],
    },
  ],
};
