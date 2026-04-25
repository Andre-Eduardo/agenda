Feature: Appointment reminder dispatch (POST)
    As a clinic owner I want to manually trigger reminder dispatch
    so that due pending reminders are sent to patients and their status is updated.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with clinic member "${ref:id:clinicMember:dr_house}"
        When I send a "PUT" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/reminder-config" with:
            | enabledChannels | ["WHATSAPP"] |
            | hoursBeforeList | [1700]       |
            | isActive        | true         |
        Then the request should succeed with a 200 status code
        When I send a "POST" request to "/api/v1/patients" with:
            | name       | Reminder Test Patient |
            | documentId | 100.200.300-99        |
            | phone      | 5511999990099         |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "reminder_patient"

    Scenario: Pending reminder due for dispatch transitions to SENT
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId          | ${ref:id:patient:reminder_patient} |
            | attendedByMemberId | ${ref:id:clinicMember:dr_house}    |
            | startAt            | 2026-07-01T00:00:00.000Z           |
            | endAt              | 2026-07-01T01:00:00.000Z           |
            | type               | FIRST_VISIT                        |
        Then the request should succeed with a 201 status code
        When I send a "GET" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/reminders/pending"
        Then the request should succeed with a 200 status code
        When I send a "POST" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/reminders/dispatch"
        Then the request should succeed with a 204 status code
        When I send a "GET" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/reminders/pending"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            []
            """

    Scenario: Dispatching twice is idempotent — already SENT reminders are not re-dispatched
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId          | ${ref:id:patient:reminder_patient} |
            | attendedByMemberId | ${ref:id:clinicMember:dr_house}    |
            | startAt            | 2026-07-02T00:00:00.000Z           |
            | endAt              | 2026-07-02T01:00:00.000Z           |
            | type               | RETURN                             |
        Then the request should succeed with a 201 status code
        When I send a "POST" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/reminders/dispatch"
        Then the request should succeed with a 204 status code
        When I send a "POST" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/reminders/dispatch"
        Then the request should succeed with a 204 status code
        When I send a "GET" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/reminders/pending"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            []
            """

    Scenario: CANCELLED reminders are ignored by dispatch
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId          | ${ref:id:patient:reminder_patient} |
            | attendedByMemberId | ${ref:id:clinicMember:dr_house}    |
            | startAt            | 2026-07-03T00:00:00.000Z           |
            | endAt              | 2026-07-03T01:00:00.000Z           |
            | type               | RETURN                             |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "appointment" id for "to_cancel"
        When I send a "PATCH" request to "/api/v1/appointments/${ref:id:appointment:to_cancel}/cancel" with:
            | reason | Patient requested cancellation |
        Then the request should succeed with a 200 status code
        When I send a "POST" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/reminders/dispatch"
        Then the request should succeed with a 204 status code
        When I send a "GET" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/reminders/pending"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            []
            """

    Scenario: Dispatch without authentication is rejected
        Given I sign out
        When I send a "POST" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/reminders/dispatch"
        Then the request should fail with a 401 status code
