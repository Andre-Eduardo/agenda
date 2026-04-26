Feature: Clinical record creation (POST)
    As an authenticated professional I want to create clinical records (evoluções)
    so that I can document patient consultations over time.

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

    Scenario: Create a record with free-text description
        When I send a "POST" request to "/api/v1/records" with:
            | patientId      | ${ref:id:patient:rec_patient}   |
            | responsibleProfessionalId | ${ref:id:professional:dr_house} |
            | description    | General clinical note           |
        Then the request should succeed with a 201 status code
        And the response should contain:
            | description | General clinical note |
        And I save the response field "id" as "record" id for "rec_1"

    Scenario: Create a SOAP record with structured fields
        When I send a "POST" request to "/api/v1/records" with:
            | patientId      | ${ref:id:patient:rec_patient}                     |
            | responsibleProfessionalId | ${ref:id:professional:dr_house}                   |
            | title          | Follow-up consultation                             |
            | subjective     | Patient reports persistent headache for 3 days    |
            | objective      | BP 120/80, no fever                               |
            | assessment     | Tension headache, likely stress-related            |
            | plan           | Analgesics as needed, return in 7 days             |
        Then the request should succeed with a 201 status code
        And the response should contain:
            | title      | Follow-up consultation |
            | subjective | Patient reports persistent headache for 3 days |
        And I save the response field "id" as "record" id for "rec_soap"

    Scenario: Create a record without required fields (no patientId)
        When I send a "POST" request to "/api/v1/records" with:
            | responsibleProfessionalId | ${ref:id:professional:dr_house} |
            | description    | Orphan note                     |
        Then the request should fail with a 400 status code

    Scenario: Create a record without authentication
        Given I sign out
        When I send a "POST" request to "/api/v1/records" with:
            | patientId      | ${ref:id:patient:rec_patient}   |
            | responsibleProfessionalId | ${ref:id:professional:dr_house} |
            | description    | Unauthorised note               |
        Then the request should fail with a 401 status code
