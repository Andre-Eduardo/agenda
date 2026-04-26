Feature: Clinical record deletion (DELETE)
    As an authenticated professional I want to delete clinical records
    so that entries created in error can be removed.

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

    Scenario: Delete record without authentication
        Given I sign out
        When I send a "DELETE" request to "/api/v1/records/01900000-0000-7000-8000-000000000000"
        Then the request should fail with a 401 status code
