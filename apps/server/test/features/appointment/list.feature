Feature: Appointment listing and retrieval (GET)
    As an authenticated professional I want to list and retrieve appointments
    so that I can review scheduled and past visits.

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
