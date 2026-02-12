# T-010-03: Unit Tests for Search

| Field | Value |
|---|---|
| **Task ID** | T-010-03 |
| **Story** | [S1-010: Search Employees](../../../stories/stage1/S1-010-search-employees.md) |
| **Status** | Pending |

---

## Objective

Test search logic including case insensitivity, minimum query validation, and active-only filtering.

---

## Checklist

- [ ] Test: search returns matching employees
- [ ] Test: search is case-insensitive (query "JOHN" matches "john")
- [ ] Test: search with query shorter than 2 characters throws `IllegalArgumentException`
- [ ] Test: search with null query throws `IllegalArgumentException`
- [ ] Test: search returns only `ACTIVE` employees
- [ ] Test: search with no results returns empty page (not exception)
- [ ] Use `@DisplayName` for readable test names
- [ ] Commit: `test(S1-010): add unit tests for search`

---

## Details

### Test cases

<details>
<summary>Expand for guidance</summary>

```java
@ExtendWith(MockitoExtension.class)
class EmployeeServiceSearchTest {

    @Mock private EmployeeRepository repository;
    @Mock private EmployeeMapper mapper;
    @InjectMocks private EmployeeService service;

    @Test
    @DisplayName("search() returns paginated results matching the query")
    void search_returnsMatchingEmployees() {
        var pageable = PageRequest.of(0, 20);
        var employees = List.of(createActiveEmployee("John", "Doe"));
        var page = new PageImpl<>(employees, pageable, 1);
        when(repository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);
        when(mapper.toResponse(any())).thenReturn(createResponse());

        var result = service.search("john", pageable);

        assertThat(result.content()).hasSize(1);
        assertThat(result.totalElements()).isEqualTo(1);
    }

    @Test
    @DisplayName("search() throws IllegalArgumentException for query shorter than 2 chars")
    void search_throwsForShortQuery() {
        assertThatThrownBy(() -> service.search("j", PageRequest.of(0, 20)))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("at least 2 characters");
    }

    @Test
    @DisplayName("search() returns empty page when no employees match")
    void search_returnsEmptyPageWhenNoMatch() {
        var pageable = PageRequest.of(0, 20);
        when(repository.findAll(any(Specification.class), eq(pageable)))
            .thenReturn(Page.empty(pageable));

        var result = service.search("zzzzz", pageable);

        assertThat(result.content()).isEmpty();
        assertThat(result.totalElements()).isZero();
    }
}
```

Use `ArgumentCaptor<Specification<Employee>>` to verify the specification combines name search with active-only filter if needed, though this is more of an integration test concern.

</details>

---

## Development Log

| Date | Entry |
|---|---|
| — | *No entries yet* |

---

## References

- [GUIDELINES.md](../../../../docs/GUIDELINES.md) — Section 7: Testing strategy
