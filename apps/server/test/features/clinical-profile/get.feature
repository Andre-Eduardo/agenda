Feature: Clinical profile retrieval (GET)
    As an authenticated professional I want to retrieve a patient's clinical profile
    so that I can review their medical summary before each consultation.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Profile Patient                 |
            | documentId     | 300.400.500-60                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "profile_patient"

    Scenario: Get clinical profile after creation
        When I send a "PUT" request to "/api/v1/patients/${ref:id:patient:profile_patient}/clinical-profile" with:
            | responsibleProfessionalId | ${ref:id:professional:dr_house} |
            | allergies                 | Latex                           |
            | surgicalHistory           | Appendectomy 2010               |
        Then the request should succeed with a 200 status code
        When I send a "GET" request to "/api/v1/patients/${ref:id:patient:profile_patient}/clinical-profile"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | allergies       | Latex             |
            | surgicalHistory | Appendectomy 2010 |

    Scenario: Get clinical profile for unknown patient
        When I send a "GET" request to "/api/v1/patients/01900000-0000-7000-8000-000000000000/clinical-profile"
        Then the request should fail with a 404 status code

    Scenario: Get clinical profile without authentication
        Given I sign out
        When I send a "GET" request to "/api/v1/patients/${ref:id:patient:profile_patient}/clinical-profile"
        Then the request should fail with a 401 status code
