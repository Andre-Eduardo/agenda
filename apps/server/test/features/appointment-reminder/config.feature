Feature: Clinic reminder config (PUT / GET)
    As a clinic owner I want to configure appointment reminder settings
    so that patients are notified automatically before their appointments.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with clinic member "${ref:id:clinicMember:dr_house}"

    Scenario: Create reminder config with WHATSAPP channel
        When I send a "PUT" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/reminder-config" with body:
            """JSON
            {"enabledChannels": ["WHATSAPP"], "hoursBeforeList": [24, 2], "isActive": true}
            """
        Then the request should succeed with a 200 status code
        And the response should contain:
            | isActive | true |

    Scenario: Get existing reminder config
        When I send a "PUT" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/reminder-config" with body:
            """JSON
            {"enabledChannels": ["EMAIL"], "hoursBeforeList": [48], "isActive": true}
            """
        Then the request should succeed with a 200 status code
        When I send a "GET" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/reminder-config"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | isActive | true |

    Scenario: Update existing config replaces it
        When I send a "PUT" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/reminder-config" with body:
            """JSON
            {"enabledChannels": ["WHATSAPP"], "hoursBeforeList": [12], "isActive": true}
            """
        Then the request should succeed with a 200 status code
        When I send a "PUT" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/reminder-config" with body:
            """JSON
            {"enabledChannels": ["EMAIL"], "hoursBeforeList": [6], "isActive": false}
            """
        Then the request should succeed with a 200 status code
        And the response should contain:
            | isActive | false |

    Scenario: Appointment created with active config generates a pending reminder
        When I send a "PUT" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/reminder-config" with body:
            """JSON
            {"enabledChannels": ["WHATSAPP"], "hoursBeforeList": [1700], "isActive": true}
            """
        Then the request should succeed with a 200 status code
        When I send a "POST" request to "/api/v1/patients" with:
            | name       | Reminder Patient |
            | documentId | 555.666.777-88   |
            | phone      | +5511999990099    |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "reminder_p"
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId          | ${ref:id:patient:reminder_p}    |
            | attendedByMemberId | ${ref:id:clinicMember:dr_house} |
            | startAt            | 2026-08-15T09:00:00.000Z        |
            | endAt              | 2026-08-15T10:00:00.000Z        |
            | type               | FIRST_VISIT                     |
        Then the request should succeed with a 201 status code
        When I send a "GET" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/reminders/pending"
        Then the request should succeed with a 200 status code

    Scenario: Config PUT without authentication returns 401
        Given I sign out
        When I send a "PUT" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/reminder-config" with body:
            """JSON
            {"enabledChannels": ["WHATSAPP"], "hoursBeforeList": [24], "isActive": true}
            """
        Then the request should fail with a 401 status code
