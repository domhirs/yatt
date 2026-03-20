import { Story } from '../../models/step.model';

export const S1_013: Story = {
  id: 'S1-013',
  title: 'S1-013 — Docker Containerization',
  tasks: [
    {
      id: 'T-013-01',
      title: 'Dockerfile',
      description:
        'What is a Dockerfile? It is a text file containing step-by-step instructions for building a Docker image. ' +
        'A Docker image is like a snapshot of a computer that contains your application, its runtime (the JRE), and everything it needs to run. ' +
        'Once you have an image, you can run it as a container on any machine that has Docker installed — no more "it works on my machine" problems.\n\n' +
        'We use a "multi-stage" Dockerfile, which means the file contains two FROM instructions — two separate build phases. ' +
        'The first stage uses the full JDK image to compile and package the application into a JAR file. ' +
        'The second stage uses a much smaller JRE-only image and just copies the JAR into it. ' +
        'The final image does not contain Maven, the source code, or any build tools — only what is needed to run the app. ' +
        'This matters because smaller images pull faster, use less storage, and have a smaller attack surface.\n\n' +
        'The dependency pre-caching step (RUN ./mvnw dependency:go-offline) is a Docker build optimization. ' +
        'Docker builds images in layers, and each instruction creates a new layer. ' +
        'If the source code changes but pom.xml does not, Docker can reuse the cached dependency layer — ' +
        'downloading all dependencies only takes a long time the first build. Subsequent builds reuse the cache and are much faster.\n\n' +
        'The ENTRYPOINT instruction is the command Docker runs when starting a container from this image. ' +
        'Using the array form ["java", "-jar", "app.jar"] is preferred over the shell form because it runs the process directly ' +
        'without a shell wrapper, which means Docker signals (like SIGTERM for graceful shutdown) are received correctly by the JVM.',
      concepts: [
        {
          term: 'Docker Image vs Container',
          explanation:
            'An image is a read-only blueprint — like a recipe or a template. ' +
            'A container is a running instance of an image — like a dish made from the recipe. ' +
            'You build an image once with "docker build" and then run it as many containers as you want with "docker run". ' +
            'Multiple containers from the same image are isolated from each other.',
        },
        {
          term: 'Multi-stage Build',
          explanation:
            'A Dockerfile technique that uses multiple FROM instructions to separate the build environment from the runtime environment. ' +
            'Stage 1 (AS build) compiles the code using the full JDK and Maven. ' +
            'Stage 2 copies only the compiled JAR into a slim JRE image. ' +
            'The final image contains no Maven, no source code, no .class files — just the JAR and the JRE needed to run it.',
        },
        {
          term: 'Docker Layer Cache',
          explanation:
            'Docker builds images one instruction at a time. Each instruction creates a cached layer. ' +
            'If an instruction and all instructions before it are unchanged, Docker reuses the cached layer instead of re-running the command. ' +
            'Copying pom.xml before src/ means the dependency download layer is only invalidated when pom.xml changes — not on every source code change.',
        },
        {
          term: 'EXPOSE',
          explanation:
            'A Dockerfile instruction that documents which port the container listens on. ' +
            'EXPOSE 8080 does not actually publish the port — it is documentation for humans and tools. ' +
            'The actual port mapping happens at runtime: "docker run -p 8080:8080 ..." maps port 8080 on the host to port 8080 in the container.',
        },
        {
          term: 'ENTRYPOINT vs CMD',
          explanation:
            'ENTRYPOINT defines the command that is always run when the container starts. ' +
            'CMD provides default arguments that can be overridden. ' +
            'Using ENTRYPOINT ["java", "-jar", "app.jar"] in exec form (array syntax) runs java directly as PID 1, ' +
            'which ensures the JVM receives OS signals (like SIGTERM for graceful shutdown) correctly.',
        },
        {
          term: 'eclipse-temurin',
          explanation:
            'The official OpenJDK distribution from the Eclipse Adoptium project, available on Docker Hub. ' +
            '"eclipse-temurin:25-jdk" is the full Java Development Kit — needed for compilation. ' +
            '"eclipse-temurin:25-jre" is the Java Runtime Environment — smaller, only needed to run JARs. ' +
            'Using JRE in the runtime stage cuts image size significantly.',
        },
      ],
      checklist: [
        'Create the file employee-service/Dockerfile (no file extension)',
        'Write Stage 1: FROM eclipse-temurin:25-jdk AS build',
        'Add: WORKDIR /app',
        'Add: COPY .mvn/ .mvn/ and COPY mvnw pom.xml ./ to copy the Maven wrapper and pom first',
        'Add: RUN ./mvnw dependency:go-offline -q to pre-cache all dependencies as a separate Docker layer',
        'Add: COPY src ./src to copy the source code',
        'Add: RUN ./mvnw package -DskipTests -q to compile and package the JAR',
        'Write Stage 2: FROM eclipse-temurin:25-jre (no AS label needed)',
        'Add: WORKDIR /app',
        'Add: COPY --from=build /app/target/*.jar app.jar to copy the JAR from Stage 1',
        'Add: EXPOSE 8080',
        'Add: ENTRYPOINT ["java", "-jar", "app.jar"]',
        'Build the image: docker build -t employee-service:latest employee-service/',
        'Run a quick test: docker run -e DB_URL=... -e DB_USERNAME=... -e DB_PASSWORD=... -p 8080:8080 employee-service:latest',
        'Commit: feat(S1-013): add multi-stage Dockerfile for employee service',
      ],
      examples: [
        {
          lang: 'bash',
          label: 'employee-service/Dockerfile — multi-stage build with comments',
          code: `# ============================================================
# Stage 1: BUILD
# Uses the full JDK image to compile and package the application.
# Everything in this stage is DISCARDED — it never appears in the final image.
# ============================================================
FROM eclipse-temurin:25-jdk AS build
# AS build names this stage so Stage 2 can reference it with --from=build

WORKDIR /app
# Sets the working directory inside the container. All subsequent commands run here.

# Copy the Maven wrapper and POM file BEFORE copying source code.
# WHY: Docker caches each layer. pom.xml changes rarely (only when you add dependencies).
# By copying pom.xml first and running dependency:go-offline, we create a cache layer
# for all dependencies. As long as pom.xml doesn't change, this layer is reused —
# no re-downloading of all dependencies on every build.
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Download all dependencies into the local Maven cache inside the container.
# -q = quiet mode (less verbose output during build)
# This is the slow step on first build (~2 minutes), but cached on subsequent builds.
RUN ./mvnw dependency:go-offline -q

# Now copy the source code. This layer is invalidated on every source change,
# but the dependency layer above remains cached — so re-builds are fast.
COPY src ./src

# Compile the code and build the JAR file.
# -DskipTests: skip tests in the Docker build — tests run in CI separately.
# Output: /app/target/employee-service-0.0.1-SNAPSHOT.jar (or similar)
RUN ./mvnw package -DskipTests -q

# ============================================================
# Stage 2: RUNTIME
# Starts fresh from a minimal JRE image — no JDK, no Maven, no source code.
# Only what is needed to RUN the application.
# ============================================================
FROM eclipse-temurin:25-jre
# JRE is smaller than JDK — it can run JARs but cannot compile Java source code.
# Final image size: ~200MB vs ~500MB for JDK image.

WORKDIR /app

# Copy ONLY the compiled JAR from the build stage. Nothing else carries over.
# --from=build: refers to the stage named "build" above
# /app/target/*.jar: the glob matches the JAR regardless of its exact version name
# app.jar: rename it to a predictable name for the ENTRYPOINT command
COPY --from=build /app/target/*.jar app.jar

# Document that the container listens on port 8080.
# This does NOT publish the port — just metadata. Actual mapping: docker run -p 8080:8080
EXPOSE 8080

# The command that runs when the container starts.
# Exec form (array) is preferred — runs java directly as PID 1, receives OS signals properly.
# This means graceful shutdown (SIGTERM) works correctly in Kubernetes/Docker Compose.
ENTRYPOINT ["java", "-jar", "app.jar"]`,
        },
        {
          lang: 'bash',
          label: 'Building and testing the Docker image locally',
          code: `# Build the image. Run from the project root (where employee-service/ folder is).
# -t employee-service:latest  →  tag the image with this name and "latest" version
# employee-service/           →  the build context (directory containing the Dockerfile)
docker build -t employee-service:latest employee-service/

# Verify the image was created and check its size
docker images employee-service

# Run the container locally (requires a running Postgres — use your dev one on host)
# -e  →  sets environment variables (Spring Boot reads these as config properties)
# -p 8080:8080  →  map host port 8080 to container port 8080
# --rm  →  automatically remove the container when it stops
docker run --rm \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e DB_URL="jdbc:postgresql://host.docker.internal:5432/employee_db" \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=postgres \
  -p 8080:8080 \
  employee-service:latest
# host.docker.internal resolves to the host machine from inside a container (Docker Desktop)

# Check the health endpoint
curl http://localhost:8080/actuator/health`,
        },
      ],
      links: [
        {
          label: 'Docker — Multi-stage Builds',
          url: 'https://docs.docker.com/build/building/multi-stage/',
        },
        {
          label: 'Eclipse Temurin — Official OpenJDK Docker Images',
          url: 'https://hub.docker.com/_/eclipse-temurin',
        },
        {
          label: 'Docker — Dockerfile Reference',
          url: 'https://docs.docker.com/reference/dockerfile/',
        },
        {
          label: 'Docker — Layer Caching Best Practices',
          url: 'https://docs.docker.com/build/cache/',
        },
      ],
    },
    {
      id: 'T-013-02',
      title: 'Docker Compose — Production Profile',
      description:
        'What is Docker Compose? It is a tool for defining and running multi-container applications. ' +
        'Instead of running multiple "docker run" commands with many flags, you describe all your containers, ' +
        'their configuration, and how they connect to each other in a YAML file. A single command — docker compose up — ' +
        'starts everything in the right order.\n\n' +
        'We already have docker-compose.yaml and docker-compose.dev.yaml for local development. ' +
        'Now we add docker-compose.prod.yaml for production. Docker Compose supports "merging" — ' +
        'you can specify multiple -f flags, and Compose merges the files together. The later files override earlier ones. ' +
        'This is the "override file" pattern: base config in docker-compose.yaml, environment-specific overrides in dev/prod files.\n\n' +
        'Credentials are passed via environment variables using the ${VAR_NAME} syntax. Compose reads these from the host shell ' +
        'or from a .env file. This means passwords never appear in the committed file — only placeholders. ' +
        'The actual secrets live in the host environment or a secrets manager.\n\n' +
        'The healthcheck on Postgres is critical. Without it, employee-service might start before Postgres is ready to accept connections, ' +
        'causing the application to fail on startup. The depends_on condition: service_healthy tells Compose to wait until ' +
        'the Postgres healthcheck passes before starting employee-service. This is a startup ordering guarantee.',
      concepts: [
        {
          term: 'Docker Compose Override Files',
          explanation:
            'When you pass multiple -f flags to docker compose, Compose deep-merges the files. ' +
            'Keys in later files override keys in earlier files. ' +
            'docker-compose.yaml has the base definition; docker-compose.prod.yaml adds or overrides prod-specific settings. ' +
            'This avoids repeating shared config (like the postgres service definition) across files.',
        },
        {
          term: 'Environment Variable Substitution (${VAR})',
          explanation:
            'In Docker Compose YAML, ${POSTGRES_PASSWORD} is replaced at runtime with the value of the POSTGRES_PASSWORD ' +
            'environment variable from the host shell (or from a .env file in the same directory). ' +
            'This keeps secrets out of the committed YAML file. If the variable is not set, Compose warns you and the container may fail to start.',
        },
        {
          term: 'Healthcheck',
          explanation:
            'A command that Docker runs periodically inside a container to determine if it is healthy. ' +
            '"pg_isready" is a Postgres utility that returns success if Postgres is accepting connections. ' +
            'Docker tracks the health state: starting → healthy or unhealthy. ' +
            'Other services can use condition: service_healthy to wait for the container to be truly ready.',
        },
        {
          term: 'depends_on with condition: service_healthy',
          explanation:
            'Tells Compose: "do not start this service until the named service is healthy." ' +
            'Without it, Compose only guarantees that Postgres is started — not that it is ready to accept connections. ' +
            'Postgres takes a second or two to initialize, and employee-service would fail if it tries to connect too early.',
        },
        {
          term: 'Named Volume (postgres_data)',
          explanation:
            'A Docker-managed storage location that persists data between container restarts. ' +
            'Without a volume, stopping and removing the Postgres container destroys all the database data. ' +
            'postgres_data:/var/lib/postgresql/data mounts the named volume to the directory where Postgres stores its files. ' +
            'The volume persists on the host until you explicitly delete it with "docker volume rm".',
        },
      ],
      checklist: [
        'Create docker-compose.prod.yaml in the project root (same directory as docker-compose.yaml)',
        'Define the postgres service using image: postgres:17',
        'Set POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD using ${VARIABLE_NAME} syntax (no hardcoded values)',
        'Add a named volume mount: postgres_data:/var/lib/postgresql/data for data persistence',
        'Add a healthcheck using pg_isready: test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]',
        'Set healthcheck interval: 10s, timeout: 5s, retries: 5',
        'Define the employee-service using image: employee-service:latest (the image built from your Dockerfile)',
        'Add ports: ["8080:8080"]',
        'Set environment variables: SPRING_PROFILES_ACTIVE: prod, DB_URL, DB_USERNAME, DB_PASSWORD',
        'Add depends_on with condition: service_healthy for postgres',
        'Add the top-level volumes section: volumes: { postgres_data: }',
        'Commit: feat(S1-013): add production Docker Compose file',
      ],
      examples: [
        {
          lang: 'yaml',
          label: 'docker-compose.prod.yaml — annotated',
          code: `# docker-compose.prod.yaml
# Used with: docker compose -f docker-compose.yaml -f docker-compose.prod.yaml up -d
# Compose deep-merges this file with docker-compose.yaml.

services:
  postgres:
    image: postgres:17
    environment:
      # \${VAR_NAME} syntax: Compose reads these from host environment or .env file.
      # Never hardcode passwords in YAML files that are committed to git.
      POSTGRES_DB: \${POSTGRES_DB}
      POSTGRES_USER: \${POSTGRES_USER}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
    volumes:
      # Named volume: postgres_data persists the database files between container restarts.
      # Without this, all data is lost when the container stops.
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      # pg_isready: Postgres built-in tool that checks if the server is accepting connections.
      # Returns exit code 0 (success) when ready, non-zero when not.
      test: ["CMD-SHELL", "pg_isready -U \${POSTGRES_USER} -d \${POSTGRES_DB}"]
      interval: 10s   # run the healthcheck every 10 seconds
      timeout: 5s     # if the check takes longer than 5s, count it as failed
      retries: 5      # mark as unhealthy after 5 consecutive failures

  employee-service:
    # This image is built from employee-service/Dockerfile via:
    # docker build -t employee-service:latest employee-service/
    image: employee-service:latest
    ports:
      # "hostPort:containerPort" — map host machine port 8080 to container port 8080.
      # Access the service at http://localhost:8080 from the host machine.
      - "8080:8080"
    environment:
      # Tell Spring Boot which profile to use.
      # The "prod" profile (application-prod.yaml) should use DB_URL, DB_USERNAME, DB_PASSWORD.
      SPRING_PROFILES_ACTIVE: prod
      # postgres://postgres refers to the Compose service name "postgres" above.
      # Compose sets up internal DNS so containers can reach each other by service name.
      DB_URL: jdbc:postgresql://postgres:5432/\${POSTGRES_DB}
      DB_USERNAME: \${POSTGRES_USER}
      DB_PASSWORD: \${POSTGRES_PASSWORD}
    depends_on:
      postgres:
        # Do not start employee-service until postgres healthcheck passes.
        # Without this, the app might start before Postgres is ready and fail on connect.
        condition: service_healthy

# Declare named volumes at the top level.
# Docker creates and manages these volumes automatically.
# Persist across container restarts; destroyed only by: docker volume rm postgres_data
volumes:
  postgres_data:`,
        },
        {
          lang: 'bash',
          label: 'How to set credentials and start the production stack',
          code: `# Option 1: export environment variables before running compose
export POSTGRES_DB=employee_db
export POSTGRES_USER=employee_user
export POSTGRES_PASSWORD=supersecretpassword

docker compose -f docker-compose.yaml -f docker-compose.prod.yaml up -d

# Option 2: use a .env file in the project root (Compose reads it automatically)
# .env file contents (DO NOT commit this file to git — add .env to .gitignore):
# POSTGRES_DB=employee_db
# POSTGRES_USER=employee_user
# POSTGRES_PASSWORD=supersecretpassword

# Verify both containers are running and healthy
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml ps

# View logs from employee-service
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml logs employee-service

# Stop everything (containers stop but volumes persist)
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml down

# Stop and remove volumes (WARNING: destroys all database data)
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml down -v`,
        },
      ],
      links: [
        {
          label: 'Docker Compose — depends_on and healthcheck',
          url: 'https://docs.docker.com/compose/compose-file/05-services/#depends_on',
        },
        {
          label: 'Docker Compose — Environment Variables',
          url: 'https://docs.docker.com/compose/how-tos/environment-variables/',
        },
        {
          label: 'Docker Compose — Multiple Compose Files (override pattern)',
          url: 'https://docs.docker.com/compose/how-tos/multiple-compose-files/',
        },
      ],
    },
    {
      id: 'T-013-03',
      title: 'Startup & Smoke Test',
      description:
        'What is a smoke test? The term comes from electronics: when you power on a new circuit board for the first time, ' +
        'if it doesn\'t smoke, the basic wiring is probably correct. In software, a smoke test is a minimal check ' +
        'that verifies the system starts and the most critical path works — not a thorough test, just enough to know it is alive.\n\n' +
        'Our smoke test has three goals: verify the container starts without crashing, ' +
        'verify Flyway ran the migrations (the database schema exists), and verify the API responds correctly to a basic request. ' +
        'If all three pass, we have reasonable confidence the containerized application works end-to-end.\n\n' +
        'The Spring Boot Actuator health endpoint (/actuator/health) is perfect for the first check. ' +
        'It returns {"status":"UP"} when Spring Boot considers itself healthy — database connection pool is working, ' +
        'Flyway migrations completed, and the application context started without errors. ' +
        'If any of those fail, the status will be "DOWN" and you can check the container logs.\n\n' +
        'The PRD requirement is that the service starts in under 10 seconds. ' +
        'You can verify this by looking at the first log line Spring Boot prints when it finishes starting: ' +
        '"Started EmployeeServiceApplication in X.XXX seconds." If X is under 10, the requirement is met.',
      concepts: [
        {
          term: 'Spring Boot Actuator',
          explanation:
            'A Spring Boot module that adds production-ready endpoints to your application. ' +
            '/actuator/health reports the health of the app and its dependencies (database, message broker, etc). ' +
            '/actuator/info provides build information. ' +
            'These endpoints are used by container orchestration tools (Kubernetes, Docker) to check if the app is ready to serve traffic.',
        },
        {
          term: 'Docker Compose Startup Order',
          explanation:
            'Even with depends_on and healthchecks, there is a brief window after Postgres is "healthy" ' +
            'where it might still be setting up databases or roles. ' +
            'Spring Boot and Flyway handle this gracefully — Flyway will retry if the connection is refused. ' +
            'If the service fails to start, check the logs: the error message will tell you exactly what failed.',
        },
        {
          term: 'curl | jq',
          explanation:
            'curl is a command-line HTTP client. It fetches URLs and prints the response. ' +
            'jq is a command-line JSON processor. Piping curl output to jq formats and filters the JSON. ' +
            '"curl http://localhost:8080/actuator/health | jq .status" fetches the health endpoint and extracts just the "status" field.',
        },
        {
          term: 'Container DNS (service names)',
          explanation:
            'Inside a Docker Compose network, containers can reach each other using service names as hostnames. ' +
            'employee-service connects to Postgres using the hostname "postgres" — the service name from docker-compose.prod.yaml. ' +
            'Docker\'s internal DNS resolves "postgres" to the Postgres container\'s IP address. ' +
            'This is why DB_URL uses "jdbc:postgresql://postgres:5432/..." instead of an IP address.',
        },
      ],
      checklist: [
        'Make sure the Docker image is built: docker build -t employee-service:latest employee-service/',
        'Set the required environment variables (POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD) in your shell or .env file',
        'Start the stack: docker compose -f docker-compose.yaml -f docker-compose.prod.yaml up -d',
        'Watch the logs for employee-service: docker compose logs -f employee-service',
        'Look for the line "Started EmployeeServiceApplication in X.XXX seconds" — verify X < 10',
        'Look for Flyway lines confirming migrations ran: "Successfully applied N migration(s)"',
        'Run the health check: curl http://localhost:8080/actuator/health | jq .status — should return "UP"',
        'Run a smoke test: POST a new employee and GET it back',
        'Commit: chore(S1-013): verify containerised startup and smoke test',
      ],
      examples: [
        {
          lang: 'bash',
          label: 'Full smoke test sequence',
          code: `# Step 1: Build the image (run from project root)
docker build -t employee-service:latest employee-service/

# Step 2: Start the full stack in detached mode (-d = run in background)
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml up -d

# Step 3: Wait for startup and check logs
# -f = follow (stream new log lines), Ctrl+C to stop following
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml logs -f employee-service

# You should see something like:
# employee-service | 2024-01-15 INFO  o.f.core.internal.command.DbValidate - Successfully validated 3 migrations
# employee-service | 2024-01-15 INFO  c.t.employee.EmployeeServiceApplication - Started EmployeeServiceApplication in 4.321 seconds

# Step 4: Check health endpoint
curl http://localhost:8080/actuator/health | jq .
# Expected: { "status": "UP", "components": { "db": { "status": "UP" }, ... } }

# Step 5: Create an employee
curl -s -X POST http://localhost:8080/api/v1/employees \\
  -H "Content-Type: application/json" \\
  -d '{
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane.doe@example.com",
    "department": "Engineering",
    "role": "Developer",
    "hireDate": "2024-01-15"
  }' | jq .
# Expected: 201 Created with employee body including "id" field

# Step 6: Retrieve the employee by ID (replace {id} with actual UUID from step 5)
curl -s http://localhost:8080/api/v1/employees/{id} | jq .email
# Expected: "jane.doe@example.com"

# Step 7: List all employees
curl -s http://localhost:8080/api/v1/employees | jq .totalElements
# Expected: 1 (or more if seed data was applied)

# Cleanup: stop the stack (data persists in named volume)
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml down`,
        },
        {
          lang: 'bash',
          label: 'Debugging startup failures',
          code: `# If the health check shows DOWN or the container exits immediately:

# Check what status the containers are in
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml ps

# View the full logs of the employee-service (not just following)
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml logs employee-service

# Common failure causes and what to look for in logs:

# 1. Database connection refused:
# "Connection refused (Connection refused)" or "Unable to acquire JDBC Connection"
# → Postgres is not ready yet, or DB_URL is wrong

# 2. Flyway migration error:
# "FlywayException: Found non-empty schema(s) with missing Flyway schema history table"
# → Schema mismatch — may need to clean the database volume

# 3. Wrong credentials:
# "FATAL: password authentication failed for user"
# → DB_USERNAME or DB_PASSWORD environment variables are wrong

# 4. Port already in use:
# "Ports are not available: address already in use"
# → Something else is running on port 8080. Stop it or change the port mapping.

# To remove data and start fresh (WARNING: deletes all database data):
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml down -v`,
        },
      ],
      links: [
        {
          label: 'Spring Boot Actuator — Health Endpoint',
          url: 'https://docs.spring.io/spring-boot/reference/actuator/endpoints.html#actuator.endpoints.health',
        },
        {
          label: 'Docker Compose — docker compose logs',
          url: 'https://docs.docker.com/reference/cli/docker/compose/logs/',
        },
        {
          label: 'jq — Command-line JSON Processor',
          url: 'https://jqlang.github.io/jq/',
        },
      ],
    },
  ],
};
