Feature: Appointment check-in and call (PATCH)
    As a receptionist I want to check in patients and call them to the room
    so that the appointment status reflects their physical presence.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Checkin Patient                 |
            | documentId     | 111.222.333-44                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "checkin_patient"

    Scenario: Check in a scheduled appointment — status becomes ARRIVED
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId          | ${ref:id:patient:checkin_patient} |
            | attendedByMemberId | ${ref:id:clinicMember:dr_house}   |
            | startAt            | 2026-07-01T09:00:00.000Z          |
            | endAt              | 2026-07-01T10:00:00.000Z          |
            | type               | FIRST_VISIT                       |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "appointment" id for "appt_checkin"
        When I send a "PATCH" request to "/api/v1/appointments/${ref:id:appointment:appt_checkin}/checkin"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | status | ARRIVED |

    Scenario: Call patient after checkin — status becomes IN_PROGRESS
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId          | ${ref:id:patient:checkin_patient} |
            | attendedByMemberId | ${ref:id:clinicMember:dr_house}   |
            | startAt            | 2026-07-02T09:00:00.000Z          |
            | endAt              | 2026-07-02T10:00:00.000Z          |
            | type               | RETURN                            |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "appointment" id for "appt_call"
        When I send a "PATCH" request to "/api/v1/appointments/${ref:id:appointment:appt_call}/checkin"
        Then the request should succeed with a 200 status code
        When I send a "PATCH" request to "/api/v1/appointments/${ref:id:appointment:appt_call}/call"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | status | IN_PROGRESS |

    Scenario: Checkin a non-existent appointment returns 404
        When I send a "PATCH" request to "/api/v1/appointments/01900000-0000-7000-8000-000000000000/checkin"
        Then the request should fail with a 404 status code

    Scenario: Checkin without authentication returns 401
        Given I sign out
        When I send a "PATCH" request to "/api/v1/appointments/01900000-0000-7000-8000-000000000000/checkin"
        Then the request should fail with a 401 status code
