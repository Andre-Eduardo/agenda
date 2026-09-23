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
        And the clinic member "dr_house" also has the role "OWNER"
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Appointment Patient             |
            | documentId     | 100.200.300-40                  |
            | attendedByMemberId | ${ref:id:clinicMember:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "appt_patient"

    Scenario: Delete appointment
        Given an appointment "to_delete" exists for patient "appt_patient" attended by "dr_house"
        When I send a "DELETE" request to "/api/v1/appointments/${ref:id:appointment:to_delete}"
        Then the request should succeed with a 200 status code

    Scenario: A deleted appointment is soft deleted and hidden from every read
        Given an appointment "to_delete" exists for patient "appt_patient" attended by "dr_house"
        When I send a "DELETE" request to "/api/v1/appointments/${ref:id:appointment:to_delete}"
        Then the request should succeed with a 200 status code
        And the appointment "to_delete" should be soft deleted
        When I send a "GET" request to "/api/v1/appointments/${ref:id:appointment:to_delete}"
        Then the request should fail with a 404 status code
        When I send a "GET" request to "/api/v1/appointments" with the query:
            | patientId | ${ref:id:patient:appt_patient} |
            | limit     | 10                             |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
              "data": [],
              "totalCount": 0
            }
            """
        When I send a "DELETE" request to "/api/v1/appointments/${ref:id:appointment:to_delete}"
        Then the request should fail with a 404 status code

    Scenario: Delete appointment without authentication
        Given I sign out
        When I send a "DELETE" request to "/api/v1/appointments/01900000-0000-7000-8000-000000000000"
        Then the request should fail with a 401 status code
