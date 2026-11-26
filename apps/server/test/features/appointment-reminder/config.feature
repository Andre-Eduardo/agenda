Feature: Clinic reminder config (PUT / GET)
    As a clinic owner I want to configure appointment reminder settings
    so that patients are notified automatically before their appointments.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And the clinic member "dr_house" also has the role "OWNER"
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
            {"enabledChannels": ["WHATSAPP"], "hoursBeforeList": [48], "isActive": true}
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
            | startAt            | ${ref:date:daysAhead:1:09:00:00.000Z}        |
            | endAt              | ${ref:date:daysAhead:1:10:00:00.000Z}        |
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

    Scenario: Get config before saving returns inactive defaults
        When I send a "GET" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/reminder-config"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | isActive            | false |
            | configured          | false |
            | usesDefaultTemplate | true  |

    Scenario: Save a custom reminder text
        When I send a "PUT" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/reminder-config" with body:
            """JSON
            {"enabledChannels": ["WHATSAPP", "EMAIL"], "hoursBeforeList": [2, 24], "messageTemplate": "Oi {{paciente}}, sua consulta é {{data}} às {{hora}}.", "isActive": true}
            """
        Then the request should succeed with a 200 status code
        And the response should contain:
            | messageTemplate     | Oi {{paciente}}, sua consulta é {{data}} às {{hora}}. |
            | usesDefaultTemplate | false                                                 |
            | configured          | true                                                  |

    Scenario: Reject a reminder text with an unknown variable
        When I send a "PUT" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/reminder-config" with body:
            """JSON
            {"enabledChannels": ["WHATSAPP"], "hoursBeforeList": [24], "messageTemplate": "Oi {{nome}}"}
            """
        Then the request should fail with a 400 status code

    Scenario: Reject SMS and lead times over one week
        When I send a "PUT" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/reminder-config" with body:
            """JSON
            {"enabledChannels": ["SMS"], "hoursBeforeList": [24]}
            """
        Then the request should fail with a 400 status code
        When I send a "PUT" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/reminder-config" with body:
            """JSON
            {"enabledChannels": ["WHATSAPP"], "hoursBeforeList": [169]}
            """
        Then the request should fail with a 400 status code

    Scenario: Preview a reminder text without saving it
        When I send a "POST" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/reminder-config/preview" with body:
            """JSON
            {"messageTemplate": "Oi {{paciente}}!"}
            """
        Then the request should succeed with a 200 status code
        And the response should contain:
            | message | Oi Maria Silva!      |
            | subject | Lembrete de consulta |

    Scenario: Another clinic config cannot be read or changed
        When I send a "GET" request to "/api/v1/clinics/0195c3d6-0000-7000-8000-000000000000/reminder-config"
        Then the request should fail with a 403 status code
        When I send a "PUT" request to "/api/v1/clinics/0195c3d6-0000-7000-8000-000000000000/reminder-config" with body:
            """JSON
            {"enabledChannels": ["WHATSAPP"], "hoursBeforeList": [24], "isActive": true}
            """
        Then the request should fail with a 403 status code
