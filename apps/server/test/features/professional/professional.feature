Feature: Professional management
    As an authenticated user I want to manage professional profiles
    so that patients can be assigned to the right specialist.

    Background:
        Given the following users exist:
            | Name     | Username | Email                   | Password  |
            | Dr. House | dr_house | house@example.com       | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"

    # ─────────────────────────────────────────────────────────────────────────────
    # Create
    # ─────────────────────────────────────────────────────────────────────────────

    Scenario: Create a professional with valid data
        When I send a "POST" request to "/api/v1/professionals" with:
            | name       | Dra. Smith           |
            | specialty  | PSICOLOGIA           |
            | documentId | 111.222.333-44       |
        Then the request should succeed with a 201 status code
        And the response should contain:
            | name      | Dra. Smith |
            | specialty | PSICOLOGIA |
        And I save the response field "id" as "professional" id for "dr_smith"

    Scenario: Create a professional without required field (name)
        When I send a "POST" request to "/api/v1/professionals" with:
            | specialty  | FISIOTERAPIA |
            | documentId | 222.333.444-55 |
        Then the request should fail with a 400 status code

    Scenario: Create a professional without authentication
        Given I sign out
        When I send a "POST" request to "/api/v1/professionals" with:
            | name      | No Auth Prof |
            | specialty | MEDICINA     |
            | documentId | 333.444.555-66 |
        Then the request should fail with a 401 status code

    # ─────────────────────────────────────────────────────────────────────────────
    # List / search
    # ─────────────────────────────────────────────────────────────────────────────

    Scenario: List professionals returns paginated results
        When I send a "GET" request to "/api/v1/professionals" with the query:
            | page | 1  |
            | size | 10 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
              "data": "__array__",
              "total": "__number__",
              "page": 1,
              "size": 10
            }
            """

    Scenario: List professionals without authentication
        Given I sign out
        When I send a "GET" request to "/api/v1/professionals"
        Then the request should fail with a 401 status code

    # ─────────────────────────────────────────────────────────────────────────────
    # Get by ID
    # ─────────────────────────────────────────────────────────────────────────────

    Scenario: Get professional by ID
        When I send a "GET" request to "/api/v1/professionals/${ref:id:professional:dr_house}"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | id | ${ref:id:professional:dr_house} |

    Scenario: Get professional with unknown ID
        When I send a "GET" request to "/api/v1/professionals/01900000-0000-7000-8000-000000000000"
        Then the request should fail with a 404 status code

    # ─────────────────────────────────────────────────────────────────────────────
    # Update
    # ─────────────────────────────────────────────────────────────────────────────

    Scenario: Update professional specialty
        When I send a "PUT" request to "/api/v1/professionals/${ref:id:professional:dr_house}" with:
            | specialty | NEUROLOGIA |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | specialty | NEUROLOGIA |

    Scenario: Update professional with unknown ID
        When I send a "PUT" request to "/api/v1/professionals/01900000-0000-7000-8000-000000000000" with:
            | specialty | MEDICINA |
        Then the request should fail with a 404 status code

    # ─────────────────────────────────────────────────────────────────────────────
    # Delete
    # ─────────────────────────────────────────────────────────────────────────────

    Scenario: Delete professional
        # Creates a separate professional to delete so it does not break other tests
        When I send a "POST" request to "/api/v1/professionals" with:
            | name       | To Be Deleted  |
            | specialty  | MEDICINA       |
            | documentId | 999.888.777-66 |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "professional" id for "to_delete"
        When I send a "DELETE" request to "/api/v1/professionals/${ref:id:professional:to_delete}"
        Then the request should succeed with a 200 status code

    Scenario: Delete professional without authentication
        Given I sign out
        When I send a "DELETE" request to "/api/v1/professionals/${ref:id:professional:dr_house}"
        Then the request should fail with a 401 status code
