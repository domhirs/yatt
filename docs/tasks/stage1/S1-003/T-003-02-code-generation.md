# T-003-02: Configure OpenAPI Code Generation

| Field | Value |
|---|---|
| **Task ID** | T-003-02 |
| **Story** | [S1-003: OpenAPI Specification](../../../stories/stage1/S1-003-openapi-spec.md) |
| **Status** | Pending |

---

## Objective

Set up `openapi-generator-maven-plugin` to generate DTOs and controller interfaces from the OpenAPI spec, so that the implementation stays in sync with the API contract and boilerplate code is automated.

---

## Checklist

- [ ] Add `openapi-generator-maven-plugin` to `pom.xml`
- [ ] Configure generator for Spring server
- [ ] Generate DTO classes (Java records or classes)
- [ ] Generate controller interfaces
- [ ] Verify generated code compiles
- [ ] Add generated sources to `.gitignore` if preferred
- [ ] Commit: `feat(S1-003): configure OpenAPI code generation plugin`

---

## Details

### Add `openapi-generator-maven-plugin` to `pom.xml`

<details>
<summary>Expand for guidance</summary>

Add the plugin to the `<build><plugins>` section in `employee-service/pom.xml`:

```xml
<plugin>
    <groupId>org.openapitools</groupId>
    <artifactId>openapi-generator-maven-plugin</artifactId>
    <version>7.12.0</version>
    <executions>
        <execution>
            <goals>
                <goal>generate</goal>
            </goals>
            <configuration>
                <inputSpec>${project.basedir}/../docs/api/employee-service.yaml</inputSpec>
                <generatorName>spring</generatorName>
                <apiPackage>com.timetracker.employee.api</apiPackage>
                <modelPackage>com.timetracker.employee.dto</modelPackage>
                <configOptions>
                    <useSpringBoot3>true</useSpringBoot3>
                    <interfaceOnly>true</interfaceOnly>
                    <useTags>true</useTags>
                    <dateLibrary>java8-localdatetime</dateLibrary>
                    <openApiNullable>false</openApiNullable>
                    <additionalModelTypeAnnotations>
                        @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
                    </additionalModelTypeAnnotations>
                </configOptions>
                <output>${project.build.directory}/generated-sources/openapi</output>
            </configuration>
        </execution>
    </executions>
</plugin>
```

Verify the plugin version is the latest stable release. Check [Maven Central](https://search.maven.org/artifact/org.openapitools/openapi-generator-maven-plugin) for the current version.

**Key configuration options explained:**

| Option | Purpose |
|---|---|
| `useSpringBoot3` | Generates Jakarta EE imports (`jakarta.validation.*`) instead of `javax.*` |
| `interfaceOnly` | Generates only interfaces, not full controller implementations |
| `useTags` | Groups endpoints into API interfaces based on OpenAPI tags |
| `dateLibrary=java8-localdatetime` | Uses `LocalDate` and `LocalDateTime` instead of `OffsetDateTime` |
| `openApiNullable=false` | Avoids `JsonNullable` wrapper types for simplicity in Stage 1 |

</details>

### Configure generator for Spring server

<details>
<summary>Expand for guidance</summary>

The `spring` generator with `interfaceOnly=true` produces:

1. **API interfaces** (e.g., `EmployeesApi.java`) with method signatures annotated with `@RequestMapping`, `@PathVariable`, `@RequestParam`, etc.
2. **Model classes** (e.g., `CreateEmployeeRequest.java`, `EmployeeResponse.java`) with Jackson annotations and Bean Validation annotations.

The generated interfaces will look like:

```java
@Tag(name = "Employees")
public interface EmployeesApi {

    @PostMapping(value = "/employees", consumes = "application/json", produces = "application/json")
    ResponseEntity<EmployeeResponse> createEmployee(@Valid @RequestBody CreateEmployeeRequest request);

    @GetMapping(value = "/employees/{id}", produces = "application/json")
    ResponseEntity<EmployeeResponse> getEmployee(@PathVariable("id") UUID id);

    // ... other endpoints
}
```

Your controller class then implements this interface, ensuring it matches the spec:

```java
@RestController
@RequestMapping("/api/v1")
public class EmployeeController implements EmployeesApi {
    // implement all methods
}
```

</details>

### Generate DTO classes

<details>
<summary>Expand for guidance</summary>

Run the Maven build to trigger code generation:

```bash
cd employee-service
./mvnw compile
```

The generated DTOs will appear in `target/generated-sources/openapi/`. Check that:

1. `CreateEmployeeRequest` has all fields from the spec with correct types.
2. `UpdateEmployeeRequest` has all fields as nullable/optional.
3. `EmployeeResponse` includes all response fields.
4. `ErrorResponse` and `ValidationErrorDetail` match the error contract.
5. `PagedResponse` wraps a list of `EmployeeResponse`.

**Note on records vs. classes**: The OpenAPI generator produces standard Java classes with getters/setters by default, not records. This is a known limitation. If you prefer records, you have two options:

1. Accept the generated classes as-is (they work fine, just verbose).
2. Hand-write DTOs as records (see T-004-03) and skip generating model classes.

</details>

### Generate controller interfaces

<details>
<summary>Expand for guidance</summary>

With `interfaceOnly=true` and `useTags=true`, the generator creates one interface per tag:

- `EmployeesApi.java` -- endpoints tagged with `Employees`
- `OrgChartApi.java` -- endpoints tagged with `Org Chart`

Inspect the generated interfaces to confirm:
- Method signatures match the spec.
- Parameter annotations are correct (`@PathVariable`, `@RequestParam`).
- Return types use `ResponseEntity<T>`.
- Validation annotations (`@Valid`) are present on request bodies.

</details>

### Verify generated code compiles

<details>
<summary>Expand for guidance</summary>

Run the full compile to ensure no errors:

```bash
cd employee-service
./mvnw compile
```

Common issues and fixes:

| Issue | Fix |
|---|---|
| Missing `jackson-databind-nullable` | Add dependency or set `openApiNullable=false` |
| `javax.*` imports instead of `jakarta.*` | Ensure `useSpringBoot3=true` is set |
| Swagger annotations not found | Add `springdoc-openapi-starter-webmvc-ui` dependency or set `useSwaggerAnnotations=false` |

If you encounter dependency issues, you may need to add:

```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.8.5</version>
</dependency>
```

</details>

### Add generated sources to `.gitignore` if preferred

<details>
<summary>Expand for guidance</summary>

Generated code in `target/` is already excluded by a standard Maven `.gitignore`. If you choose to generate into `src/generated/`, add it to `.gitignore`:

```gitignore
# OpenAPI generated sources
src/generated/
```

**Trade-off: generate vs. hand-write**

| Approach | Pros | Cons |
|---|---|---|
| **Generate from spec** | Guaranteed spec compliance, less boilerplate to write, catches drift | Generated code can be verbose, less control over style, adds build complexity |
| **Hand-write from spec** | Full control, cleaner code (records), deeper learning | Manual effort, risk of drift from spec, must validate manually |

For a **learning project**, hand-writing the DTOs and controller interfaces teaches more about Spring MVC annotations, validation, and Java records. Consider using code generation as a **validation step** (generate and compare) rather than as the primary source.

**Recommended hybrid approach**: Hand-write the code (T-004 tasks), keep the generator configured as a CI check to catch spec drift.

</details>

### Commit

<details>
<summary>Expand for guidance</summary>

```bash
git add employee-service/pom.xml
git commit -m "feat(S1-003): configure OpenAPI code generation plugin"
```

</details>

---

## Development Log

| Date | Entry |
|---|---|
| --- | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) -- Section 4 (API-first design, generate server stubs and client code from spec)
- [DESIGN.md](../../../../docs/DESIGN.md) -- Section 2 (employee-service is Spring Boot 4.0)
