Feature: Patient listing and retrieval (GET)
    As an authenticated professional I want to search and retrieve patient records
    so that I can locate their information during care.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"

    Scenario: List patients returns paginated results
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
