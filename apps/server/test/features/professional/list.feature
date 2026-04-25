Feature: Professional listing and retrieval (GET)
    As an authenticated user I want to list and retrieve professional profiles
    so that I can find the right specialist.

    Background:
        Given the following users exist:
            | Name     | Username | Email                   | Password  |
            | Dr. House | dr_house | house@example.com       | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"

    Scenario: List professionals returns paginated results
        When I send a "GET" request to "/api/v1/professionals" with the query:
            | limit | 10 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
              "data": "_.isArray",
              "totalCount": "_.isNumber"
            }
            """

    Scenario: List professionals without authentication
        Given I sign out
        When I send a "GET" request to "/api/v1/professionals"
        Then the request should fail with a 401 status code

    Scenario: Get professional by ID
        When I send a "GET" request to "/api/v1/professionals/${ref:id:professional:dr_house}"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | id | ${ref:id:professional:dr_house} |

    Scenario: Get professional with unknown ID
        When I send a "GET" request to "/api/v1/professionals/01900000-0000-7000-8000-000000000000"
        Then the request should fail with a 404 status code
