Feature: Patient alert update (PUT)
    As an authenticated professional I want to update clinical alerts for a patient
    so that their severity and content stay accurate.

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

    Scenario: Update alert title and severity
        When I send a "POST" request to "/api/v1/patients/${ref:id:patient:alert_patient}/alerts" with:
            | professionalId | ${ref:id:professional:dr_house}  |
            | title          | Before update                    |
            | severity       | LOW                              |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "alert" id for "to_update"
        When I send a "PUT" request to "/api/v1/patients/${ref:id:patient:alert_patient}/alerts/${ref:id:alert:to_update}" with:
            | professionalId | ${ref:id:professional:dr_house} |
            | title          | After update                    |
            | severity       | HIGH                            |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | title    | After update |
            | severity | HIGH         |

    Scenario: Update alert with unknown ID
        # TODO: Verify actual 404 behaviour — the endpoint might return 422 if the
        #       alertId in the URL doesn't belong to the given patient.
        When I send a "PUT" request to "/api/v1/patients/${ref:id:patient:alert_patient}/alerts/01900000-0000-7000-8000-000000000000" with:
            | professionalId | ${ref:id:professional:dr_house} |
            | title          | Ghost alert update              |
        Then the request should fail with a 404 status code
