Feature: Clinical profile management
    As an authenticated professional I want to manage a patient's clinical profile
    so that I have a consolidated medical summary at hand before each consultation.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        # Create a patient used throughout this feature
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Profile Patient                 |
            | documentId     | 300.400.500-60                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "profile_patient"

    # ─────────────────────────────────────────────────────────────────────────────
    # Get — before any profile exists (should return empty / 404 or empty object)
    # ─────────────────────────────────────────────────────────────────────────────

    # TODO: Clarify the API contract when no clinical profile exists for a patient.
    #       Currently it is not clear if the endpoint returns 404 or an empty
    #       profile object.  Once decided, replace the pending scenario below with
    #       a concrete assertion.
    #
    # Scenario: Get clinical profile when none has been created yet
    #   When I send a "GET" request to "/api/v1/patients/${ref:id:patient:profile_patient}/clinical-profile"
    #   Then the request should ??? (404 or 200 with empty fields)

    # ─────────────────────────────────────────────────────────────────────────────
    # Upsert (PUT = create or update)
    # ─────────────────────────────────────────────────────────────────────────────

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
        # First create
        When I send a "PUT" request to "/api/v1/patients/${ref:id:patient:profile_patient}/clinical-profile" with:
            | professionalId | ${ref:id:professional:dr_house} |
            | allergies      | Aspirin                         |
        Then the request should succeed with a 200 status code
        # Then update
        When I send a "PUT" request to "/api/v1/patients/${ref:id:patient:profile_patient}/clinical-profile" with:
            | professionalId | ${ref:id:professional:dr_house}       |
            | allergies      | Aspirin, Codeine                      |
            | generalNotes   | Updated during follow-up appointment  |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | allergies    | Aspirin, Codeine                     |
            | generalNotes | Updated during follow-up appointment |

    Scenario: Upsert clinical profile without required professionalId
        # TODO: verify the exact validation error shape returned by the API.
        #       The professionalId field is required in the DTO so a 400 is expected
        #       but this scenario has not been validated against the actual endpoint.
        When I send a "PUT" request to "/api/v1/patients/${ref:id:patient:profile_patient}/clinical-profile" with:
            | allergies | Aspirin |
        Then the request should fail with a 400 status code

    Scenario: Upsert clinical profile without authentication
        Given I sign out
        When I send a "PUT" request to "/api/v1/patients/${ref:id:patient:profile_patient}/clinical-profile" with:
            | professionalId | ${ref:id:professional:dr_house} |
            | allergies      | Aspirin                         |
        Then the request should fail with a 401 status code

    # ─────────────────────────────────────────────────────────────────────────────
    # Get — after profile has been created
    # ─────────────────────────────────────────────────────────────────────────────

    Scenario: Get clinical profile after creation
        # Seed the profile
        When I send a "PUT" request to "/api/v1/patients/${ref:id:patient:profile_patient}/clinical-profile" with:
            | professionalId | ${ref:id:professional:dr_house} |
            | allergies      | Latex                           |
            | surgicalHistory| Appendectomy 2010               |
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
