Feature: Clinical profile upsert (PUT)
    As an authenticated professional I want to create or update a patient's clinical profile
    so that I have a consolidated medical summary at hand before each consultation.

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

    Scenario: Create clinical profile via upsert
        When I send a "PUT" request to "/api/v1/patients/${ref:id:patient:profile_patient}/clinical-profile" with:
            | professionalId     | ${ref:id:professional:dr_house} |
            | allergies          | Penicillin, NSAIDs              |
            | chronicConditions  | Type 2 Diabetes                 |
            | currentMedications | Metformin 500mg                 |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | allergies         | Penicillin, NSAIDs |
            | chronicConditions | Type 2 Diabetes    |

    Scenario: Update an existing clinical profile
        When I send a "PUT" request to "/api/v1/patients/${ref:id:patient:profile_patient}/clinical-profile" with:
            | professionalId | ${ref:id:professional:dr_house} |
            | allergies      | Aspirin                         |
        Then the request should succeed with a 200 status code
        When I send a "PUT" request to "/api/v1/patients/${ref:id:patient:profile_patient}/clinical-profile" with:
            | professionalId | ${ref:id:professional:dr_house}       |
            | allergies      | Aspirin, Codeine                      |
            | generalNotes   | Updated during follow-up appointment  |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | allergies    | Aspirin, Codeine                     |
            | generalNotes | Updated during follow-up appointment |

    Scenario: Upsert clinical profile without required professionalId
        When I send a "PUT" request to "/api/v1/patients/${ref:id:patient:profile_patient}/clinical-profile" with:
            | allergies | Aspirin |
        Then the request should fail with a 400 status code

    Scenario: Upsert clinical profile without authentication
        Given I sign out
        When I send a "PUT" request to "/api/v1/patients/${ref:id:patient:profile_patient}/clinical-profile" with:
            | professionalId | ${ref:id:professional:dr_house} |
            | allergies      | Aspirin                         |
        Then the request should fail with a 401 status code
