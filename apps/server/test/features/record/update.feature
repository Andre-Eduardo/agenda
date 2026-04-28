Feature: Clinical record update (PUT)
    As an authenticated professional I want to update clinical records
    so that consultation notes can be corrected or expanded.

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

    Scenario: Update a record description
        When I send a "POST" request to "/api/v1/records" with:
            | patientId      | ${ref:id:patient:rec_patient}   |
            | responsibleProfessionalId | ${ref:id:professional:dr_house} |
            | description    | Before update                   |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "record" id for "to_update"
        When I send a "PUT" request to "/api/v1/records/${ref:id:record:to_update}" with:
            | description | After update |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | description | After update |

    Scenario: Update record SOAP fields
        When I send a "POST" request to "/api/v1/records" with:
            | patientId      | ${ref:id:patient:rec_patient}   |
            | responsibleProfessionalId | ${ref:id:professional:dr_house} |
            | subjective     | Initial complaint               |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "record" id for "soap_update"
        When I send a "PUT" request to "/api/v1/records/${ref:id:record:soap_update}" with:
            | subjective | Updated complaint |
            | assessment | Updated assessment |
            | plan       | Updated plan      |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | subjective | Updated complaint |

    Scenario: Update record with unknown ID
        When I send a "PUT" request to "/api/v1/records/01900000-0000-7000-8000-000000000000" with:
            | description | Ghost record |
        Then the request should fail with a 404 status code
