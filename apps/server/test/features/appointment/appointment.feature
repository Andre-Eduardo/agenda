Feature: Appointment management
    As an authenticated professional I want to manage appointments
    so that I can organise my schedule and track patient visits.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        # Create a patient to use across scenarios
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Appointment Patient             |
            | documentId     | 100.200.300-40                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "appt_patient"

    # ─────────────────────────────────────────────────────────────────────────────
    # Create
    # ─────────────────────────────────────────────────────────────────────────────

    Scenario: Create an appointment with valid data
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId      | ${ref:id:patient:appt_patient}  |
            | professionalId | ${ref:id:professional:dr_house} |
            | startAt        | 2026-06-01T09:00:00.000Z        |
            | endAt          | 2026-06-01T10:00:00.000Z        |
            | type           | CONSULTATION                    |
        Then the request should succeed with a 201 status code
        And the response should contain:
            | type | CONSULTATION |
        And I save the response field "id" as "appointment" id for "appt_1"

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
        # Missing patientId and professionalId
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
            | type           | CONSULTATION                    |
        Then the request should fail with a 401 status code

    # ─────────────────────────────────────────────────────────────────────────────
    # List / search
    # ─────────────────────────────────────────────────────────────────────────────

    Scenario: List appointments returns paginated results
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId      | ${ref:id:patient:appt_patient}  |
            | professionalId | ${ref:id:professional:dr_house} |
            | startAt        | 2026-10-01T09:00:00.000Z        |
            | endAt          | 2026-10-01T10:00:00.000Z        |
            | type           | CONSULTATION                    |
        Then the request should succeed with a 201 status code
        When I send a "GET" request to "/api/v1/appointments" with the query:
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

    Scenario: Filter appointments by patient
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId      | ${ref:id:patient:appt_patient}  |
            | professionalId | ${ref:id:professional:dr_house} |
            | startAt        | 2026-11-01T09:00:00.000Z        |
            | endAt          | 2026-11-01T10:00:00.000Z        |
            | type           | CONSULTATION                    |
        Then the request should succeed with a 201 status code
        When I send a "GET" request to "/api/v1/appointments" with the query:
            | patientId | ${ref:id:patient:appt_patient} |
            | page      | 1                              |
            | size      | 10                             |
        Then the request should succeed with a 200 status code

    # ─────────────────────────────────────────────────────────────────────────────
    # Get by ID
    # ─────────────────────────────────────────────────────────────────────────────

    Scenario: Get appointment by ID
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId      | ${ref:id:patient:appt_patient}  |
            | professionalId | ${ref:id:professional:dr_house} |
            | startAt        | 2026-12-01T09:00:00.000Z        |
            | endAt          | 2026-12-01T10:00:00.000Z        |
            | type           | CONSULTATION                    |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "appointment" id for "get_test"
        When I send a "GET" request to "/api/v1/appointments/${ref:id:appointment:get_test}"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | id | ${ref:id:appointment:get_test} |

    Scenario: Get appointment with unknown ID
        When I send a "GET" request to "/api/v1/appointments/01900000-0000-7000-8000-000000000000"
        Then the request should fail with a 404 status code

    # ─────────────────────────────────────────────────────────────────────────────
    # Update
    # ─────────────────────────────────────────────────────────────────────────────

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

    # ─────────────────────────────────────────────────────────────────────────────
    # Cancel
    # ─────────────────────────────────────────────────────────────────────────────

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

    # ─────────────────────────────────────────────────────────────────────────────
    # Delete
    # ─────────────────────────────────────────────────────────────────────────────

    Scenario: Delete appointment
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId      | ${ref:id:patient:appt_patient}  |
            | professionalId | ${ref:id:professional:dr_house} |
            | startAt        | 2027-04-01T09:00:00.000Z        |
            | endAt          | 2027-04-01T10:00:00.000Z        |
            | type           | CONSULTATION                    |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "appointment" id for "to_delete"
        When I send a "DELETE" request to "/api/v1/appointments/${ref:id:appointment:to_delete}"
        Then the request should succeed with a 200 status code

    Scenario: Delete appointment without authentication
        Given I sign out
        When I send a "DELETE" request to "/api/v1/appointments/01900000-0000-7000-8000-000000000000"
        Then the request should fail with a 401 status code
