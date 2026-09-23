Feature: Clinical record deletion (DELETE)
    As an authenticated professional I want to delete clinical records
    so that entries created in error stop appearing, while the row is retained.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        And the clinic member "dr_house" also has the role "OWNER"
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Record Patient                  |
            | documentId     | 200.300.400-50                  |
            | responsibleProfessionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "rec_patient"

    Scenario: Delete record
        When I send a "POST" request to "/api/v1/records" with:
            | patientId      | ${ref:id:patient:rec_patient}   |
            | responsibleProfessionalId | ${ref:id:professional:dr_house} |
            | description    | To be deleted                   |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "record" id for "to_delete"
        When I send a "DELETE" request to "/api/v1/records/${ref:id:record:to_delete}"
        Then the request should succeed with a 200 status code

    Scenario: A deleted record is soft deleted and hidden from every read
        When I send a "POST" request to "/api/v1/records" with:
            | patientId      | ${ref:id:patient:rec_patient}   |
            | responsibleProfessionalId | ${ref:id:professional:dr_house} |
            | description    | Soft deleted record             |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "record" id for "to_delete"
        When I send a "DELETE" request to "/api/v1/records/${ref:id:record:to_delete}"
        Then the request should succeed with a 200 status code
        And the record "to_delete" should be soft deleted
        When I send a "GET" request to "/api/v1/records/${ref:id:record:to_delete}"
        Then the request should fail with a 404 status code
        When I send a "GET" request to "/api/v1/records" with the query:
            | patientId | ${ref:id:patient:rec_patient} |
            | limit     | 10                            |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
              "data": [],
              "totalCount": 0
            }
            """
        When I send a "DELETE" request to "/api/v1/records/${ref:id:record:to_delete}"
        Then the request should fail with a 404 status code

    Scenario: Delete record without authentication
        Given I sign out
        When I send a "DELETE" request to "/api/v1/records/01900000-0000-7000-8000-000000000000"
        Then the request should fail with a 401 status code
