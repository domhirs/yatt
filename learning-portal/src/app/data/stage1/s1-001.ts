import { Story } from '../../models/step.model';

export const S1_001: Story = {
  id: 'S1-001',
  title: 'S1-001 — Project Setup',
  tasks: [
    {
      id: 'T-001-01',
      title: 'Initialize Spring Boot 4 Project',
      description:
        'Spring Boot is a framework that takes the enormous Java ecosystem and gives it sensible defaults ' +
        'so you can write a production-ready web server in a few dozen lines instead of hundreds. It sits ' +
        'on top of the Spring Framework (which has existed since 2003) and handles all the wiring — you ' +
        'declare what you need, and Spring figures out how to connect it.\n\n' +
        'Maven is the build tool for this project. Think of it like npm for Java: it downloads libraries, ' +
        'compiles your code, and packages it into a runnable JAR file. The pom.xml file is the equivalent ' +
        'of package.json — it lists your dependencies and how to build the project.\n\n' +
        'The "parent POM" concept is unique to Maven. By declaring spring-boot-starter-parent as your ' +
        'parent, your project inherits hundreds of pre-configured settings: compiler flags, plugin ' +
        'versions, dependency versions, and sensible defaults. This is why you do not need to specify ' +
        'version numbers for most Spring dependencies — the parent already pins them to a tested set.\n\n' +
        'The entry point of any Spring Boot application is a class annotated with @SpringBootApplication ' +
        'that calls SpringApplication.run(). This one method starts the embedded web server (Tomcat by ' +
        'default), scans your classes for components, and initialises the entire application context. ' +
        'You will see the Spring banner appear in the logs when it starts.',
      concepts: [
        {
          term: 'Spring Boot',
          explanation:
            'A framework that auto-configures the Spring ecosystem so you can build a runnable server ' +
            'application with minimal boilerplate. When Spring Boot sees certain libraries on the classpath ' +
            '(like spring-boot-starter-web), it automatically configures an embedded Tomcat server, a ' +
            'Jackson JSON mapper, and much more — all without any XML configuration files.',
        },
        {
          term: 'Maven and pom.xml',
          explanation:
            'Maven is the standard Java build tool. pom.xml (Project Object Model) declares everything ' +
            'Maven needs: the Java version, libraries your code depends on, plugins that transform your ' +
            'source code, and how to package the final artifact. Running ./mvnw package produces a single ' +
            'runnable .jar file containing your code and all its dependencies.',
        },
        {
          term: 'Spring starters',
          explanation:
            'A starter is a single dependency that pulls in everything needed for a feature. For example, ' +
            'spring-boot-starter-web brings in Tomcat, Spring MVC, Jackson (JSON), and validation support ' +
            '— all properly versioned to work together. Instead of hunting for compatible versions of a ' +
            'dozen libraries, you add one starter and Spring Boot handles the rest.',
        },
        {
          term: '@SpringBootApplication',
          explanation:
            'A convenience annotation that combines three annotations: @Configuration (this class defines ' +
            'beans), @EnableAutoConfiguration (activate Spring Boot\'s auto-wiring magic), and ' +
            '@ComponentScan (scan this package and sub-packages for classes annotated with @Service, ' +
            '@Repository, @Controller, etc.). You only need one of these per application.',
        },
        {
          term: 'SpringApplication.run()',
          explanation:
            'The single line that boots the entire application. It starts the embedded web server, loads ' +
            'configuration files, runs database migrations, connects to the database, and makes your ' +
            'REST endpoints available — all in a few seconds. If anything fails during startup, the ' +
            'application exits immediately with a descriptive error.',
        },
        {
          term: 'Package structure (package-by-feature)',
          explanation:
            'Java organises code into packages (like folders). In this project, everything related to ' +
            'employees lives under com.timetracker.employee. This "package by feature" approach means ' +
            'related classes (entity, repository, service, controller) sit next to each other rather ' +
            'than separated into generic layers like com.timetracker.controllers.',
        },
      ],
      checklist: [
        'Go to https://start.spring.io and generate a project with: Group=com.timetracker, Artifact=employee-service, Java 25, Maven, Spring Boot 4.0.x. Download and unzip it.',
        'Open pom.xml and verify the <parent> block references spring-boot-starter-parent version 4.0.0 — this is what gives you all the managed dependency versions.',
        'Inside <properties>, set <java.version>25</java.version> so Maven compiles with the correct Java version.',
        'Add all dependencies shown in the example below. The <scope>runtime</scope> on postgresql means it is available at runtime but not needed to compile your code. The <optional>true</optional> on devtools means it is excluded from production builds.',
        'Create the main class: src/main/java/com/timetracker/employee/EmployeeServiceApplication.java — copy the example exactly, including the package declaration at the top.',
        'Run ./mvnw spring-boot:run from the employee-service directory. The app will fail with a DataSource error — that is expected because the database does not exist yet. Look for "Started EmployeeServiceApplication" or "Unable to determine" — either confirms the app wired up correctly.',
        'Commit: chore(S1-001): initialize Spring Boot 4 project',
      ],
      examples: [
        {
          lang: 'xml',
          label: 'pom.xml — parent + properties + all dependencies',
          code: `<!-- pom.xml -->
<!-- Maven reads this file to understand how to build your project. -->

<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>

  <!-- The parent POM from Spring Boot provides hundreds of pre-configured defaults.
       You inherit version management for all Spring libraries from here.
       Never change the version of individual Spring starters — let the parent control them. -->
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>4.0.0</version>
  </parent>

  <!-- Your project's coordinates — like an address for this artifact in the Maven ecosystem. -->
  <groupId>com.timetracker</groupId>
  <artifactId>employee-service</artifactId>
  <version>0.0.1-SNAPSHOT</version>
  <name>employee-service</name>

  <properties>
    <!-- Tell the Java compiler to use Java 25 language features. -->
    <java.version>25</java.version>
  </properties>

  <dependencies>

    <!-- Brings in: embedded Tomcat server, Spring MVC (routing), Jackson (JSON serialisation).
         This is what makes your class a web server. -->
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <!-- Brings in: Hibernate (JPA implementation), Spring Data JPA, HikariCP (connection pool).
         This is what lets you map Java classes to database tables. -->
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>

    <!-- Brings in: /actuator/health, /actuator/info, /actuator/metrics endpoints.
         Essential for knowing whether your running service is healthy. -->
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>

    <!-- Brings in: Hibernate Validator, Jakarta Bean Validation.
         Powers the @NotBlank, @Email, @Size annotations on your DTOs. -->
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>

    <!-- The PostgreSQL JDBC driver. "runtime" scope means it is only needed when
         the app is actually running — not when compiling your source code. -->
    <dependency>
      <groupId>org.postgresql</groupId>
      <artifactId>postgresql</artifactId>
      <scope>runtime</scope>
    </dependency>

    <!-- Flyway core library for running database migrations. -->
    <dependency>
      <groupId>org.flywaydb</groupId>
      <artifactId>flyway-core</artifactId>
    </dependency>

    <!-- Flyway's PostgreSQL-specific dialect support (required since Flyway 10). -->
    <dependency>
      <groupId>org.flywaydb</groupId>
      <artifactId>flyway-database-postgresql</artifactId>
    </dependency>

    <!-- Spring DevTools: restarts the app automatically when you change a class.
         "optional=true" ensures it is NEVER included in the production JAR. -->
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-devtools</artifactId>
      <scope>runtime</scope>
      <optional>true</optional>
    </dependency>

    <!-- JUnit 5 + Mockito + AssertJ — the test framework combo.
         "test" scope means this is only available when running tests, not in production. -->
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
    </dependency>

  </dependencies>

  <build>
    <plugins>
      <!-- The Spring Boot Maven plugin packages your app as a runnable "fat JAR"
           and provides the spring-boot:run goal used during development. -->
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
      </plugin>
    </plugins>
  </build>

</project>`,
        },
        {
          lang: 'java',
          label: 'EmployeeServiceApplication.java — the entry point',
          code: `// What this file does:
// This is the ONLY class Spring Boot requires you to write to start a server.
// Everything else is discovered automatically by @SpringBootApplication.

package com.timetracker.employee;
// ^^^^ This MUST match the directory structure:
//      src/main/java/com/timetracker/employee/EmployeeServiceApplication.java

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// @SpringBootApplication tells Spring Boot three things at once:
//   1. This class can define beans (@Configuration)
//   2. Enable auto-configuration based on what's on the classpath (@EnableAutoConfiguration)
//   3. Scan this package and all sub-packages for @Service, @Repository, @Controller, etc.
@SpringBootApplication
public class EmployeeServiceApplication {

    // Java programs start at main(). Spring Boot apps are no different.
    // String[] args passes any command-line arguments (e.g., --spring.profiles.active=dev).
    public static void main(String[] args) {
        // This single line starts EVERYTHING:
        //   - reads application.yaml
        //   - connects to the database
        //   - runs Flyway migrations
        //   - starts Tomcat on port 8080
        //   - registers all your REST endpoints
        SpringApplication.run(EmployeeServiceApplication.class, args);
    }
}`,
        },
      ],
      links: [
        { label: 'Spring Initializr — Generate a project', url: 'https://start.spring.io/' },
        { label: 'Spring Boot Reference — Getting Started', url: 'https://docs.spring.io/spring-boot/reference/getting-started/index.html' },
        { label: 'Spring Boot 4.0 Migration Guide', url: 'https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide' },
        { label: 'Maven — Introduction to the POM', url: 'https://maven.apache.org/guides/introduction/introduction-to-the-pom.html' },
      ],
    },
    {
      id: 'T-001-02',
      title: 'Configure Application Profiles',
      description:
        'A "profile" in Spring Boot is a named set of configuration that activates in a specific ' +
        'environment. You might run with the "dev" profile on your laptop (pointing at a local Docker ' +
        'database with debug logging turned on) and with the "prod" profile in production (reading ' +
        'credentials from environment variables with structured JSON logging).\n\n' +
        'Configuration lives in YAML files under src/main/resources. Spring Boot loads them in a ' +
        'specific order: first application.yaml (shared settings for all environments), then ' +
        'application-{profile}.yaml (environment-specific overrides). A dev-profile setting will ' +
        'silently override the matching base setting.\n\n' +
        'One critical security rule: production database passwords must NEVER appear in YAML files ' +
        'that get committed to git. Instead, use ${ENV_VAR_NAME} placeholders in application-prod.yaml. ' +
        'Spring Boot will substitute the real value from the environment at startup. If the variable ' +
        'is missing, the app refuses to start — which is better than connecting with wrong credentials.\n\n' +
        'The open-in-view: false setting deserves special mention. By default, Spring Boot keeps the ' +
        'database connection open for the entire duration of an HTTP request (including the time it ' +
        'takes to serialise the JSON response). This "Open Session in View" pattern causes subtle ' +
        'bugs and performance problems. Setting it to false closes the connection as soon as the ' +
        'service method returns.',
      concepts: [
        {
          term: 'Spring Profile',
          explanation:
            'A named configuration context that you activate at startup with -Dspring.profiles.active=dev ' +
            '(or via environment variable SPRING_PROFILES_ACTIVE=prod). Spring Boot loads the base ' +
            'application.yaml first, then layers the profile-specific YAML on top, merging and overriding ' +
            'matching keys.',
        },
        {
          term: 'YAML configuration',
          explanation:
            'Spring Boot uses YAML (a human-readable format using indentation) for configuration files. ' +
            'The key spring.datasource.url in YAML maps to the property spring.datasource.url — the ' +
            'dots represent nesting levels. YAML is whitespace-sensitive: use spaces, never tabs.',
        },
        {
          term: 'Environment variable placeholders (${VAR})',
          explanation:
            'Writing ${DB_URL} in a YAML value tells Spring Boot "read this from the environment at ' +
            'startup." In production, a deployment system (Kubernetes, Docker, CI/CD) injects these ' +
            'values. The app refuses to start if a required variable is missing, preventing silent ' +
            'misconfiguration.',
        },
        {
          term: 'open-in-view: false',
          explanation:
            'Controls whether Hibernate keeps a database connection open during the entire HTTP request ' +
            '(including response serialisation). The default is true, which causes lazy-loading to ' +
            'silently work in the wrong layer. Setting false enforces that all database access happens ' +
            'inside the service layer, which is the correct architecture.',
        },
        {
          term: 'ddl-auto: validate',
          explanation:
            'Tells Hibernate what to do with the database schema on startup. "validate" makes Hibernate ' +
            'check that the database schema matches your entity classes and throw an error if they differ ' +
            '— without changing anything. Never use "create" or "update" in production; use Flyway ' +
            'migrations instead.',
        },
        {
          term: 'Graceful shutdown',
          explanation:
            'server.shutdown: graceful tells Spring Boot that when the app receives a shutdown signal ' +
            '(SIGTERM from Docker or Kubernetes), it should finish processing in-flight requests before ' +
            'stopping, rather than cutting them off immediately. This prevents requests from failing ' +
            'during deployments.',
        },
      ],
      checklist: [
        'Open src/main/resources/application.yaml (create it if it does not exist) and add the shared settings shown in the first example below — these apply to ALL environments.',
        'Create src/main/resources/application-dev.yaml with the local database URL and DEBUG logging. The URL jdbc:postgresql://localhost:5432/employee_db points to the Docker container you will start in T-001-03.',
        'Create src/main/resources/application-prod.yaml. Use ${DB_URL}, ${DB_USERNAME}, ${DB_PASSWORD} as values — never hardcode production credentials. Notice clean-disabled: true prevents Flyway from wiping the production database.',
        'Test profile activation: run the app with -Dspring-boot.run.profiles=dev and look for "The following 1 profile is active: dev" in the startup logs.',
        'Verify jpa.open-in-view: false appears in the base application.yaml — this is a common misconfiguration to catch early.',
        'Commit: chore(S1-001): configure dev, test, and prod profiles',
      ],
      examples: [
        {
          lang: 'yaml',
          label: 'application.yaml — shared config (all environments)',
          code: `# application.yaml — loaded FIRST, for every environment.
# Profile-specific files (application-dev.yaml etc.) override or add to these.

spring:
  application:
    # This name appears in logs, metrics, and health endpoints.
    name: employee-service

  jpa:
    # IMPORTANT: set to false to prevent the "Open Session in View" antipattern.
    # With false, Hibernate releases the DB connection as soon as the service method returns.
    open-in-view: false

    hibernate:
      # "validate" = Hibernate checks the schema matches your entities, but makes NO changes.
      # Flyway is responsible for all schema changes. Hibernate just verifies.
      ddl-auto: validate

server:
  # All REST endpoints will be available at http://localhost:8080
  port: 8080

  # Graceful shutdown: finish handling in-flight requests before stopping.
  # Kubernetes and Docker send SIGTERM — this prevents requests from being cut off.
  shutdown: graceful

management:
  endpoints:
    web:
      exposure:
        # Only expose these three actuator endpoints over HTTP.
        # Never expose "env" or "beans" publicly — they reveal secrets.
        include: health, info, metrics`,
        },
        {
          lang: 'yaml',
          label: 'application-dev.yaml — local development',
          code: `# application-dev.yaml — activated with -Dspring.profiles.active=dev
# This file is safe to commit. It only contains local dev credentials.

spring:
  datasource:
    # Points to the PostgreSQL container started by Docker Compose.
    url: jdbc:postgresql://localhost:5432/employee_db
    username: employee_user
    password: employee_pass

  jpa:
    # Log every SQL statement Hibernate executes. Essential for debugging N+1 queries.
    show-sql: true
    properties:
      hibernate:
        # Format the SQL with line breaks so it is readable in the console.
        format_sql: true

logging:
  level:
    # DEBUG level for our own code — see every method entry, query, and decision.
    com.timetracker: DEBUG
    # See what Spring MVC does with each incoming HTTP request.
    org.springframework.web: DEBUG
    # See the actual SQL Hibernate generates (combine with show-sql: true).
    org.hibernate.SQL: DEBUG`,
        },
        {
          lang: 'yaml',
          label: 'application-prod.yaml — production (env vars only)',
          code: `# application-prod.yaml — activated with SPRING_PROFILES_ACTIVE=prod
# NEVER put real passwords here. Use environment variable placeholders.
# The deployment system (Docker, Kubernetes, CI/CD) injects the real values.

spring:
  datasource:
    # \${DB_URL} means "read the environment variable DB_URL at startup."
    # If DB_URL is not set, the app REFUSES to start — preventing misconfiguration.
    url: \${DB_URL}
    username: \${DB_USERNAME}
    password: \${DB_PASSWORD}

    hikari:
      # HikariCP is the connection pool Spring Boot uses by default.
      # 20 max connections is a good starting point for a single service.
      maximum-pool-size: 20
      minimum-idle: 5

  jpa:
    # Never show SQL in production logs — it can expose sensitive data.
    show-sql: false

  flyway:
    # CRITICAL: prevents Flyway from running "flyway clean" (which deletes ALL data).
    # Always set this to true in production. A "flyway clean" incident is catastrophic.
    clean-disabled: true

logging:
  structured:
    format:
      # Spring Boot 4 built-in ECS (Elastic Common Schema) JSON log format.
      # Log aggregators (Elasticsearch, Datadog) can parse this automatically.
      console: ecs
  level:
    com.timetracker: INFO
    # Only show warnings from the framework itself — reduce noise.
    org.springframework: WARN`,
        },
      ],
      links: [
        { label: 'Spring Boot — Profiles', url: 'https://docs.spring.io/spring-boot/reference/features/profiles.html' },
        { label: 'Spring Boot — Externalized Configuration', url: 'https://docs.spring.io/spring-boot/reference/features/external-config.html' },
        { label: 'Spring Boot — Logging', url: 'https://docs.spring.io/spring-boot/reference/features/logging.html' },
      ],
    },
    {
      id: 'T-001-03',
      title: 'Docker Compose for Dev Environment',
      description:
        'Docker lets you run a full PostgreSQL server on your laptop without installing PostgreSQL. ' +
        'You define the server as a "service" in a docker-compose.yaml file and Docker pulls the ' +
        'official image, starts a container, and manages its lifecycle. When you are done, ' +
        'docker compose down stops it and optionally removes all data.\n\n' +
        'This project uses two compose files: docker-compose.yaml (the base definition, used by ' +
        'all environments) and docker-compose.dev.yaml (a dev-only overlay that adds port ' +
        'forwarding so your laptop can reach the database). This split means the production ' +
        'deployment can use the same base file without accidentally exposing database ports.\n\n' +
        'The healthcheck block is important. It runs pg_isready inside the container on a schedule ' +
        'and marks the service as "healthy" only when PostgreSQL is actually accepting connections — ' +
        'not just when the container has started. Without a healthcheck, Spring Boot might try to ' +
        'connect before PostgreSQL is ready and crash on startup.\n\n' +
        'The volume postgres_data: declaration creates a named Docker volume — a persistent ' +
        'storage area that survives container restarts. Without this, every time you run ' +
        'docker compose down and up, your database would be empty.',
      concepts: [
        {
          term: 'Docker container',
          explanation:
            'A container is an isolated process that runs a pre-packaged environment (called an image). ' +
            'The postgres:17 image contains PostgreSQL 17 and all its dependencies. When you run it as a ' +
            'container, you get a fully functional database server that is isolated from your laptop, ' +
            'removed completely when you want, and identical across all developers\' machines.',
        },
        {
          term: 'Docker Compose service',
          explanation:
            'A "service" in docker-compose.yaml is a declaration of a container you want to run. It ' +
            'specifies the image, environment variables, port mappings, and health check. Running ' +
            'docker compose up reads this file and starts all defined services.',
        },
        {
          term: 'Port mapping (5432:5432)',
          explanation:
            'Containers have their own internal network. "5432:5432" means "forward port 5432 on your ' +
            'laptop to port 5432 inside the container." Without this mapping, your application running ' +
            'on your laptop cannot reach the database inside Docker. This port mapping lives in the ' +
            'dev overlay only — production does not expose the database port.',
        },
        {
          term: 'Named volume',
          explanation:
            'Docker volumes provide persistent storage that outlives container restarts. postgres_data:' +
            ' tells Docker to store the database files in a managed location on your host machine. ' +
            'Without this, every docker compose down would erase all your seed data and you would need ' +
            'to run Flyway migrations from scratch.',
        },
        {
          term: 'Compose file override',
          explanation:
            'Running docker compose with -f base.yaml -f override.yaml merges both files. The override ' +
            'can add, replace, or extend any setting from the base. The dev overlay adds port forwarding ' +
            'without duplicating the entire postgres service definition.',
        },
      ],
      checklist: [
        'Create docker-compose.yaml at the repository root (not inside employee-service/) — this is a shared infrastructure file. Copy the example exactly, including the healthcheck.',
        'Create docker-compose.dev.yaml at the same level. This file only adds port mapping; Docker Compose merges it with the base file.',
        'Start the database: run docker compose -f docker-compose.yaml -f docker-compose.dev.yaml up -d from the repository root. The -d flag runs it in the background.',
        'Wait about 10 seconds, then verify the container is healthy: run docker compose ps and look for "healthy" next to the postgres service.',
        'Now start the Spring Boot app: cd employee-service && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev. Look for "Started EmployeeServiceApplication" — this confirms the app connected to the database.',
        'Commit: chore(S1-001): add Docker Compose dev environment',
      ],
      examples: [
        {
          lang: 'yaml',
          label: 'docker-compose.yaml — base definition (all environments)',
          code: `# docker-compose.yaml
# Base service definitions shared across all environments.
# This file does NOT expose any ports — that is done in environment-specific overlays.

services:
  postgres:
    # Use the official PostgreSQL 17 image from Docker Hub.
    # Pinning to major version 17 (not "latest") ensures stability.
    image: postgres:17

    environment:
      # These environment variables configure PostgreSQL on first startup.
      # They create the database and the user your application will connect as.
      POSTGRES_DB: employee_db
      POSTGRES_USER: employee_user
      POSTGRES_PASSWORD: employee_pass

    volumes:
      # Mount a named volume so data persists between container restarts.
      # Without this, every "docker compose down" would wipe the database.
      - postgres_data:/var/lib/postgresql/data

    healthcheck:
      # pg_isready checks if PostgreSQL is accepting connections.
      # Docker marks the container "healthy" only after this succeeds.
      # Spring Boot's depends_on (if used) will wait for "healthy" before starting.
      test: ["CMD-SHELL", "pg_isready -U employee_user -d employee_db"]
      interval: 10s   # Check every 10 seconds
      timeout: 5s     # Give up if the check takes more than 5 seconds
      retries: 5      # Mark as unhealthy after 5 consecutive failures

# Named volumes are managed by Docker and persist until explicitly removed.
volumes:
  postgres_data:`,
        },
        {
          lang: 'yaml',
          label: 'docker-compose.dev.yaml — dev overlay (adds port forwarding)',
          code: `# docker-compose.dev.yaml
# This overlay adds development-specific settings to the base compose file.
# It is merged with docker-compose.yaml using:
#   docker compose -f docker-compose.yaml -f docker-compose.dev.yaml up -d

services:
  postgres:
    # Port mapping: host:container
    # "5432:5432" means your laptop's port 5432 forwards to the container's port 5432.
    # This is what lets jdbc:postgresql://localhost:5432/employee_db reach the container.
    # This port is intentionally NOT in docker-compose.yaml to keep production secure.
    ports:
      - "5432:5432"`,
        },
        {
          lang: 'bash',
          label: 'Start the database and run the app',
          code: `# From the repository root — start PostgreSQL in the background
docker compose -f docker-compose.yaml -f docker-compose.dev.yaml up -d

# Wait for PostgreSQL to be ready (check the "health" column)
docker compose ps

# From the employee-service directory — start Spring Boot with the dev profile
cd employee-service
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Expected output includes lines like:
# Flyway: Successfully applied 1 migrations
# Started EmployeeServiceApplication in 3.2 seconds`,
        },
      ],
      links: [
        { label: 'Docker Compose Reference', url: 'https://docs.docker.com/compose/compose-file/' },
        { label: 'PostgreSQL Docker Hub', url: 'https://hub.docker.com/_/postgres' },
        { label: 'Docker Compose — Merge Compose Files', url: 'https://docs.docker.com/compose/how-tos/multiple-compose-files/merge/' },
      ],
    },
    {
      id: 'T-001-04',
      title: 'Health Check & Actuator',
      description:
        'Spring Boot Actuator is a library that adds operational endpoints to your application — ' +
        'endpoints that tell you (and monitoring systems) whether the service is running correctly. ' +
        'The most important one is /actuator/health, which checks the database connection, disk ' +
        'space, and any other registered health indicators, then reports a single UP or DOWN status.\n\n' +
        'Actuator is used by orchestration systems like Kubernetes to decide whether to route ' +
        'traffic to your service. If /actuator/health returns DOWN, Kubernetes stops sending ' +
        'requests to that pod and eventually restarts it. This is called a "liveness probe" or ' +
        '"readiness probe" depending on the question being asked.\n\n' +
        'The show-details: when-authorized setting controls how much information the health endpoint ' +
        'reveals. Without this, an unauthenticated caller could see database connection strings and ' +
        'internal error messages. With this setting, anonymous callers only see {"status": "UP"} ' +
        'while authenticated admin users see the full breakdown.\n\n' +
        'The metrics endpoint exposes Micrometer metrics in a format compatible with Prometheus, ' +
        'Datadog, and other monitoring systems. You get JVM metrics, HTTP request counts, database ' +
        'pool statistics, and more — all for free, just by having the dependency on the classpath.',
      concepts: [
        {
          term: 'Spring Boot Actuator',
          explanation:
            'A library that adds management endpoints to your running application. The key endpoints ' +
            'are /actuator/health (is the service healthy?), /actuator/info (version, git commit), ' +
            'and /actuator/metrics (performance numbers). These are used by monitoring systems and ' +
            'load balancers to manage your service automatically.',
        },
        {
          term: '/actuator/health',
          explanation:
            'Returns a JSON object with a "status" field: UP, DOWN, or OUT_OF_SERVICE. Spring Boot ' +
            'automatically adds a database health check when Data JPA is on the classpath — it runs ' +
            'a simple SELECT 1 and marks status DOWN if it fails. You can add custom health indicators ' +
            'for any external dependency.',
        },
        {
          term: 'Liveness and readiness probes',
          explanation:
            'Kubernetes asks two questions: "Is the app alive?" (liveness — if no, restart it) and ' +
            '"Is the app ready to receive traffic?" (readiness — if no, stop routing requests to it). ' +
            'Spring Boot Actuator exposes /actuator/health/liveness and /actuator/health/readiness ' +
            'when probes.enabled: true is set.',
        },
        {
          term: 'Endpoint exposure',
          explanation:
            'By default, Actuator only exposes /actuator/health over HTTP. All other endpoints ' +
            '(info, metrics, env, beans) are disabled for security. You explicitly opt in with ' +
            'management.endpoints.web.exposure.include. Never expose "env" in production — it ' +
            'reveals environment variables including passwords.',
        },
      ],
      checklist: [
        'Confirm spring-boot-starter-actuator is in pom.xml (it was added in T-001-01).',
        'Open application.yaml and verify the management block from the example below is present. The include line controls which endpoints are accessible via HTTP.',
        'Add management.endpoint.health.show-details: when-authorized so anonymous callers only see the status summary, not internal details.',
        'Add management.endpoint.health.probes.enabled: true to enable the Kubernetes liveness/readiness sub-endpoints.',
        'Start the app (with Docker Compose running) and test: run curl http://localhost:8080/actuator/health and verify you get {"status":"UP"}.',
        'Also test that restricted endpoints are not exposed: curl http://localhost:8080/actuator/env should return 404.',
        'Commit: chore(S1-001): verify Actuator health endpoint',
      ],
      examples: [
        {
          lang: 'yaml',
          label: 'application.yaml — full Actuator configuration',
          code: `management:
  endpoints:
    web:
      exposure:
        # Whitelist of endpoints accessible via HTTP.
        # "health" is always useful. "info" shows version/git info. "metrics" powers dashboards.
        # Do NOT add "env" or "beans" here — they expose sensitive runtime information.
        include: health, info, metrics

  endpoint:
    health:
      # "when-authorized" means:
      #   - Anonymous callers see: {"status":"UP"}
      #   - Authenticated admin users see the full breakdown with component details.
      show-details: when-authorized

      probes:
        # Enables /actuator/health/liveness and /actuator/health/readiness
        # Required for Kubernetes health checks.
        enabled: true`,
        },
        {
          lang: 'bash',
          label: 'Verify the health endpoint works',
          code: `# Start the app first (Docker Compose must be running)
cd employee-service
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# In another terminal — check the health endpoint:
curl http://localhost:8080/actuator/health
# Expected response (anonymous caller sees summary only):
# {"status":"UP"}

# The DB health check is included automatically because spring-boot-starter-data-jpa
# is on the classpath. If PostgreSQL is down, you would see:
# {"status":"DOWN"}

# Check available actuator endpoints:
curl http://localhost:8080/actuator
# Returns a map of all enabled endpoint URLs`,
        },
      ],
      links: [
        { label: 'Spring Boot — Actuator Endpoints', url: 'https://docs.spring.io/spring-boot/reference/actuator/endpoints.html' },
        { label: 'Spring Boot — Health Information', url: 'https://docs.spring.io/spring-boot/reference/actuator/endpoints.html#actuator.endpoints.health' },
        { label: 'Micrometer — Application Metrics', url: 'https://micrometer.io/docs' },
      ],
    },
  ],
};
