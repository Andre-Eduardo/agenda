Feature: Patient alert listing (GET)
    As an authenticated professional I want to list clinical alerts for a patient
    so that I can review active warnings before each encounter.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Alert Patient                   |
            | documentId     | 400.500.600-70                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "alert_patient"

    Scenario: List alerts returns paginated results
        When I send a "POST" request to "/api/v1/patients/${ref:id:patient:alert_patient}/alerts" with:
            | professionalId | ${ref:id:professional:dr_house} |
            | title          | List seed alert                 |
        Then the request should succeed with a 201 status code
        When I send a "GET" request to "/api/v1/patients/${ref:id:patient:alert_patient}/alerts" with the query:
            | limit | 10 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
              "data": "_.isArray",
              "totalCount": "_.isNumber"
            }
            """

    Scenario: List alerts without authentication
        Given I sign out
        When I send a "GET" request to "/api/v1/patients/${ref:id:patient:alert_patient}/alerts"
        Then the request should fail with a 401 status code
