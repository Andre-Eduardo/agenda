Feature: Patient alert management
    As an authenticated professional I want to manage clinical alerts for a patient
    so that important warnings are surfaced before each encounter.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        # Create patient used throughout this feature
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Alert Patient                   |
            | documentId     | 400.500.600-70                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "alert_patient"

    # ─────────────────────────────────────────────────────────────────────────────
    # Create
    # ─────────────────────────────────────────────────────────────────────────────

    Scenario: Create an alert with HIGH severity
        When I send a "POST" request to "/api/v1/patients/${ref:id:patient:alert_patient}/alerts" with:
            | professionalId | ${ref:id:professional:dr_house}          |
            | title          | Penicillin allergy — severe reaction     |
            | description    | Patient had anaphylaxis in 2018          |
            | severity       | HIGH                                     |
        Then the request should succeed with a 201 status code
        And the response should contain:
            | title    | Penicillin allergy — severe reaction |
            | severity | HIGH                                 |
        And I save the response field "id" as "alert" id for "high_alert"

    Scenario: Create an alert with default severity (MEDIUM)
        When I send a "POST" request to "/api/v1/patients/${ref:id:patient:alert_patient}/alerts" with:
            | professionalId | ${ref:id:professional:dr_house}      |
            | title          | Fall risk — use non-slip footwear    |
        Then the request should succeed with a 201 status code
        And the response should contain:
            | severity | MEDIUM |
        And I save the response field "id" as "alert" id for "medium_alert"

    Scenario: Create an alert without required title
        When I send a "POST" request to "/api/v1/patients/${ref:id:patient:alert_patient}/alerts" with:
            | professionalId | ${ref:id:professional:dr_house} |
            | severity       | LOW                             |
        Then the request should fail with a 400 status code

    Scenario: Create an alert for unknown patient
        When I send a "POST" request to "/api/v1/patients/01900000-0000-7000-8000-000000000000/alerts" with:
            | professionalId | ${ref:id:professional:dr_house} |
            | title          | Ghost alert                     |
        Then the request should fail with a 404 status code

    Scenario: Create an alert without authentication
        Given I sign out
        When I send a "POST" request to "/api/v1/patients/${ref:id:patient:alert_patient}/alerts" with:
            | professionalId | ${ref:id:professional:dr_house} |
            | title          | Unauthorised alert              |
        Then the request should fail with a 401 status code

    # ─────────────────────────────────────────────────────────────────────────────
    # List
    # ─────────────────────────────────────────────────────────────────────────────

    Scenario: List alerts returns paginated results
        When I send a "POST" request to "/api/v1/patients/${ref:id:patient:alert_patient}/alerts" with:
            | professionalId | ${ref:id:professional:dr_house} |
            | title          | List seed alert                 |
        Then the request should succeed with a 201 status code
        When I send a "GET" request to "/api/v1/patients/${ref:id:patient:alert_patient}/alerts" with the query:
            | page | 1  |
            | size | 10 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
              "data": "__array__",
              "total": "__number__",
              "page": 1,
              "size": 10
            }
            """

    Scenario: List alerts without authentication
        Given I sign out
        When I send a "GET" request to "/api/v1/patients/${ref:id:patient:alert_patient}/alerts"
        Then the request should fail with a 401 status code

    # ─────────────────────────────────────────────────────────────────────────────
    # Update
    # ─────────────────────────────────────────────────────────────────────────────

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

    # ─────────────────────────────────────────────────────────────────────────────
    # Delete (soft-delete)
    # ─────────────────────────────────────────────────────────────────────────────

    Scenario: Soft-delete an alert
        When I send a "POST" request to "/api/v1/patients/${ref:id:patient:alert_patient}/alerts" with:
            | professionalId | ${ref:id:professional:dr_house} |
            | title          | To be deleted alert             |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "alert" id for "to_delete"
        When I send a "DELETE" request to "/api/v1/patients/${ref:id:patient:alert_patient}/alerts/${ref:id:alert:to_delete}"
        Then the request should succeed with a 200 status code
        # TODO: After soft-delete, verify that the alert is no longer returned
        #       in the listing endpoint (i.e. isActive=false or deletedAt is set).
        #       Add a subsequent GET /alerts step once the filter behaviour is confirmed.

    Scenario: Delete alert without authentication
        Given I sign out
        When I send a "DELETE" request to "/api/v1/patients/${ref:id:patient:alert_patient}/alerts/01900000-0000-7000-8000-000000000000"
        Then the request should fail with a 401 status code
