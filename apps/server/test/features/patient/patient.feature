Feature: Patient management
    As an authenticated professional I want to manage patient records
    so that I can track and coordinate patient care.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"

    # ─────────────────────────────────────────────────────────────────────────────
    # Create
    # ─────────────────────────────────────────────────────────────────────────────

    Scenario: Create a patient with minimal required data
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | João da Silva                             |
            | documentId     | 123.456.789-09                            |
            | professionalId | ${ref:id:professional:dr_house}           |
        Then the request should succeed with a 201 status code
        And the response should contain:
            | name | João da Silva |
        And I save the response field "id" as "patient" id for "joao"

    Scenario: Create a patient with all optional fields
        When I send a "POST" request to "/api/v1/patients" with:
            | name                   | Maria Souza                         |
            | documentId             | 987.654.321-00                      |
            | professionalId         | ${ref:id:professional:dr_house}     |
            | birthDate              | 1990-05-15T00:00:00.000Z            |
            | gender                 | FEMALE                              |
            | email                  | maria_${ref:var:contextId}@test.com |
            | emergencyContactName   | José Souza                          |
            | emergencyContactPhone  | (11) 99999-8888                     |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "maria"

    Scenario: Create a patient without required field (name)
        When I send a "POST" request to "/api/v1/patients" with:
            | documentId     | 000.000.000-00                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should fail with a 400 status code

    Scenario: Create a patient without authentication
        Given I sign out
        When I send a "POST" request to "/api/v1/patients" with:
            | name       | No Auth Patient |
            | documentId | 111.222.333-44  |
        Then the request should fail with a 401 status code

    # ─────────────────────────────────────────────────────────────────────────────
    # List / search
    # ─────────────────────────────────────────────────────────────────────────────

    Scenario: List patients returns paginated results
        # Create a patient first to ensure there is data
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | List Test Patient               |
            | documentId     | 555.666.777-88                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        When I send a "GET" request to "/api/v1/patients" with the query:
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

    Scenario: Search patients by name fragment
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Busca Unica ${ref:var:contextId} |
            | documentId     | 444.555.666-77                   |
            | professionalId | ${ref:id:professional:dr_house}  |
        Then the request should succeed with a 201 status code
        When I send a "GET" request to "/api/v1/patients" with the query:
            | search | Busca Unica ${ref:var:contextId} |
            | page   | 1                                |
            | size   | 10                               |
        Then the request should succeed with a 200 status code

    Scenario: List patients without authentication
        Given I sign out
        When I send a "GET" request to "/api/v1/patients"
        Then the request should fail with a 401 status code

    # ─────────────────────────────────────────────────────────────────────────────
    # Get by ID
    # ─────────────────────────────────────────────────────────────────────────────

    Scenario: Get patient by ID
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Get By Id Patient               |
            | documentId     | 321.654.987-00                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "get_test"
        When I send a "GET" request to "/api/v1/patients/${ref:id:patient:get_test}"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | id | ${ref:id:patient:get_test} |

    Scenario: Get patient with unknown ID
        When I send a "GET" request to "/api/v1/patients/01900000-0000-7000-8000-000000000000"
        Then the request should fail with a 404 status code

    # ─────────────────────────────────────────────────────────────────────────────
    # Update
    # ─────────────────────────────────────────────────────────────────────────────

    Scenario: Update patient name and contact
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Before Update                   |
            | documentId     | 777.888.999-00                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "to_update"
        When I send a "PUT" request to "/api/v1/patients/${ref:id:patient:to_update}" with:
            | name  | After Update |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | name | After Update |

    Scenario: Update patient with unknown ID
        When I send a "PUT" request to "/api/v1/patients/01900000-0000-7000-8000-000000000000" with:
            | name | Ghost Patient |
        Then the request should fail with a 404 status code

    # ─────────────────────────────────────────────────────────────────────────────
    # Delete
    # ─────────────────────────────────────────────────────────────────────────────

    Scenario: Delete patient
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | To Be Deleted Patient           |
            | documentId     | 888.999.000-11                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "to_delete"
        When I send a "DELETE" request to "/api/v1/patients/${ref:id:patient:to_delete}"
        Then the request should succeed with a 200 status code

    Scenario: Delete patient without authentication
        Given I sign out
        When I send a "DELETE" request to "/api/v1/patients/01900000-0000-7000-8000-000000000000"
        Then the request should fail with a 401 status code
