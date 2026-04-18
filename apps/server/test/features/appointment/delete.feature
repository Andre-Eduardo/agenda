Feature: Appointment deletion (DELETE)
    As an authenticated professional I want to delete appointments
    so that I can remove entries that should no longer appear on the schedule.

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
