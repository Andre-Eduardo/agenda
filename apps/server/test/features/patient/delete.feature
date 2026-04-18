Feature: Patient deletion (DELETE)
    As an authenticated professional I want to delete patient records
    so that I can remove entries that should no longer be tracked.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"

    Scenario: Delete patient
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | To Be Deleted Patient           |
            | documentId     | 888.999.000-11                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "to_delete"
        When I send a "DELETE" request to "/api/v1/patients/${ref:id:patient:to_delete}"
        Then the request should succeed with a 200 status code

    Scenario: Delete patient without authentication
        Given I sign out
        When I send a "DELETE" request to "/api/v1/patients/01900000-0000-7000-8000-000000000000"
        Then the request should fail with a 401 status code
