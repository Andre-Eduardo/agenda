Feature: Patient deletion (DELETE)
    As an authenticated professional I want to delete patient records
    so that entries that should no longer be tracked disappear, while clinical history is retained.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        And the clinic member "dr_house" also has the role "OWNER"

    Scenario: Delete patient
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | To Be Deleted Patient           |
            | documentId     | 888.999.000-11                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "to_delete"
        When I send a "DELETE" request to "/api/v1/patients/${ref:id:patient:to_delete}"
        Then the request should succeed with a 200 status code

    Scenario: A deleted patient is soft deleted and hidden from every read
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Soft Deleted Patient            |
            | documentId     | 777.888.999-00                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "to_delete"
        And I save the response field "id" as "person" id for "to_delete"
        When I send a "DELETE" request to "/api/v1/patients/${ref:id:patient:to_delete}"
        Then the request should succeed with a 200 status code
        And the patient "to_delete" should be soft deleted
        And the person "to_delete" should be soft deleted
        When I send a "GET" request to "/api/v1/patients/${ref:id:patient:to_delete}"
        Then the request should fail with a 404 status code
        When I send a "GET" request to "/api/v1/patients" with the query:
            | search | Soft Deleted Patient |
            | limit  | 10                   |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
              "data": [],
              "totalCount": 0
            }
            """
        When I send a "DELETE" request to "/api/v1/patients/${ref:id:patient:to_delete}"
        Then the request should fail with a 404 status code

    Scenario: Deleting a patient keeps the clinical records but hides them from every read
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Patient With History            |
            | documentId     | 666.777.888-99                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "with_history"
        When I send a "POST" request to "/api/v1/records" with:
            | patientId                 | ${ref:id:patient:with_history}  |
            | responsibleProfessionalId | ${ref:id:professional:dr_house} |
            | description               | History that must be retained   |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "record" id for "retained"
        When I send a "DELETE" request to "/api/v1/patients/${ref:id:patient:with_history}"
        Then the request should succeed with a 200 status code
        And the record "retained" should not be soft deleted
        When I send a "GET" request to "/api/v1/records/${ref:id:record:retained}"
        Then the request should fail with a 404 status code
        When I send a "GET" request to "/api/v1/records" with the query:
            | patientId | ${ref:id:patient:with_history} |
            | limit     | 10                             |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
              "data": [],
              "totalCount": 0
            }
            """

    Scenario: Appointments of a deleted patient leave the agenda
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Patient With Agenda             |
            | documentId     | 555.444.333-22                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "with_agenda"
        And an appointment "future_visit" exists for patient "with_agenda" attended by "dr_house"
        When I send a "DELETE" request to "/api/v1/patients/${ref:id:patient:with_agenda}"
        Then the request should succeed with a 200 status code
        And the appointment "future_visit" should not be soft deleted
        When I send a "GET" request to "/api/v1/appointments/${ref:id:appointment:future_visit}"
        Then the request should fail with a 404 status code
        When I send a "GET" request to "/api/v1/appointments" with the query:
            | patientId | ${ref:id:patient:with_agenda} |
            | limit     | 10                            |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
              "data": [],
              "totalCount": 0
            }
            """

    Scenario: Delete patient without authentication
        Given I sign out
        When I send a "DELETE" request to "/api/v1/patients/01900000-0000-7000-8000-000000000000"
        Then the request should fail with a 401 status code
