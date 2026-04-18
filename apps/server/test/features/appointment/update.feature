Feature: Appointment update and cancellation (PUT/PATCH)
    As an authenticated professional I want to update or cancel appointments
    so that the schedule reflects the latest plan for each patient.

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

    Scenario: Update appointment type and note
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId      | ${ref:id:patient:appt_patient}  |
            | professionalId | ${ref:id:professional:dr_house} |
            | startAt        | 2027-01-10T09:00:00.000Z        |
            | endAt          | 2027-01-10T10:00:00.000Z        |
            | type           | CONSULTATION                    |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "appointment" id for "to_update"
        When I send a "PUT" request to "/api/v1/appointments/${ref:id:appointment:to_update}" with:
            | type | RETURN           |
            | note | Updated note     |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | type | RETURN       |
            | note | Updated note |

    Scenario: Update appointment with unknown ID
        When I send a "PUT" request to "/api/v1/appointments/01900000-0000-7000-8000-000000000000" with:
            | type | CONSULTATION |
        Then the request should fail with a 404 status code

    Scenario: Cancel an appointment with a reason
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId      | ${ref:id:patient:appt_patient}  |
            | professionalId | ${ref:id:professional:dr_house} |
            | startAt        | 2027-02-01T09:00:00.000Z        |
            | endAt          | 2027-02-01T10:00:00.000Z        |
            | type           | CONSULTATION                    |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "appointment" id for "to_cancel"
        When I send a "PATCH" request to "/api/v1/appointments/${ref:id:appointment:to_cancel}/cancel" with:
            | reason | Patient requested cancellation |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | status | CANCELLED |

    Scenario: Cancel an appointment without a reason
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId      | ${ref:id:patient:appt_patient}  |
            | professionalId | ${ref:id:professional:dr_house} |
            | startAt        | 2027-03-01T09:00:00.000Z        |
            | endAt          | 2027-03-01T10:00:00.000Z        |
            | type           | CONSULTATION                    |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "appointment" id for "cancel_no_reason"
        When I send a "PATCH" request to "/api/v1/appointments/${ref:id:appointment:cancel_no_reason}/cancel" with:
            | reason |  |
        Then the request should fail with a 400 status code
