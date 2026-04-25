Feature: Appointment creation (POST)
    As an authenticated professional I want to create appointments
    so that I can organise my schedule and track patient visits.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Appointment Patient             |
            | documentId     | 100.200.300-40                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "appt_patient"

    Scenario: Create an appointment with valid data
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId      | ${ref:id:patient:appt_patient}  |
            | professionalId | ${ref:id:professional:dr_house} |
            | startAt        | 2026-06-01T09:00:00.000Z        |
            | endAt          | 2026-06-01T10:00:00.000Z        |
            | type           | FIRST_VISIT                     |
        Then the request should succeed with a 201 status code
        And the response should contain:
            | type | FIRST_VISIT |

    Scenario: Create an appointment with a note
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId      | ${ref:id:patient:appt_patient}  |
            | professionalId | ${ref:id:professional:dr_house} |
            | startAt        | 2026-07-01T14:00:00.000Z        |
            | endAt          | 2026-07-01T15:00:00.000Z        |
            | type           | RETURN                          |
            | note           | Patient has allergy to penicillin |
        Then the request should succeed with a 201 status code
        And the response should contain:
            | note | Patient has allergy to penicillin |

    Scenario: Create an appointment without required fields
        When I send a "POST" request to "/api/v1/appointments" with:
            | startAt | 2026-08-01T09:00:00.000Z |
            | endAt   | 2026-08-01T10:00:00.000Z |
            | type    | CONSULTATION             |
        Then the request should fail with a 400 status code

    Scenario: Create an appointment without authentication
        Given I sign out
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId      | ${ref:id:patient:appt_patient}  |
            | professionalId | ${ref:id:professional:dr_house} |
            | startAt        | 2026-09-01T09:00:00.000Z        |
            | endAt          | 2026-09-01T10:00:00.000Z        |
            | type           | FIRST_VISIT                     |
        Then the request should fail with a 401 status code
