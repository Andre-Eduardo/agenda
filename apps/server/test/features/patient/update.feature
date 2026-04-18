Feature: Patient update (PUT)
    As an authenticated professional I want to update patient records
    so that their information stays current.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"

    Scenario: Update patient name and contact
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Before Update                   |
            | documentId     | 777.888.999-00                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "to_update"
        When I send a "PUT" request to "/api/v1/patients/${ref:id:patient:to_update}" with:
            | name  | After Update |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | name | After Update |

    Scenario: Update patient with unknown ID
        When I send a "PUT" request to "/api/v1/patients/01900000-0000-7000-8000-000000000000" with:
            | name | Ghost Patient |
        Then the request should fail with a 404 status code
