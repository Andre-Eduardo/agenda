Feature: Clinical record listing and retrieval (GET)
    As an authenticated professional I want to list and retrieve clinical records
    so that I can review a patient's history.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Record Patient                  |
            | documentId     | 200.300.400-50                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "rec_patient"

    Scenario: List records returns paginated results
        When I send a "POST" request to "/api/v1/records" with:
            | patientId      | ${ref:id:patient:rec_patient}   |
            | professionalId | ${ref:id:professional:dr_house} |
            | description    | List seed record                |
        Then the request should succeed with a 201 status code
        When I send a "GET" request to "/api/v1/records" with the query:
            | limit | 10 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
              "data": "_.isArray",
              "totalCount": "_.isNumber"
            }
            """

    Scenario: Filter records by patient
        When I send a "POST" request to "/api/v1/records" with:
            | patientId      | ${ref:id:patient:rec_patient}   |
            | professionalId | ${ref:id:professional:dr_house} |
            | description    | Patient-filtered record         |
        Then the request should succeed with a 201 status code
        When I send a "GET" request to "/api/v1/records" with the query:
            | patientId | ${ref:id:patient:rec_patient} |
            | limit     | 10                            |
        Then the request should succeed with a 200 status code

    Scenario: List records without authentication
        Given I sign out
        When I send a "GET" request to "/api/v1/records"
        Then the request should fail with a 401 status code

    Scenario: Get record by ID
        When I send a "POST" request to "/api/v1/records" with:
            | patientId      | ${ref:id:patient:rec_patient}   |
            | professionalId | ${ref:id:professional:dr_house} |
            | description    | Get by id record                |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "record" id for "get_test"
        When I send a "GET" request to "/api/v1/records/${ref:id:record:get_test}"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | id | ${ref:id:record:get_test} |

    Scenario: Get record with unknown ID
        When I send a "GET" request to "/api/v1/records/01900000-0000-7000-8000-000000000000"
        Then the request should fail with a 404 status code
