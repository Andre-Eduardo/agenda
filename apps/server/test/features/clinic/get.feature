Feature: Get clinic (GET)
    As an authenticated clinic member I want to retrieve clinic data
    so that I can display it in the interface.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with clinic member "${ref:id:clinicMember:dr_house}"

    Scenario: Get an existing clinic by ID
        When I send a "GET" request to "/api/v1/clinics/${ref:id:clinic:dr_house}"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | id | ${ref:id:clinic:dr_house} |

    Scenario: Get a non-existent clinic returns 404
        When I send a "GET" request to "/api/v1/clinics/01900000-0000-7000-8000-000000000000"
        Then the request should fail with a 404 status code

    Scenario: Get clinic without authentication returns 401
        Given I sign out
        When I send a "GET" request to "/api/v1/clinics/${ref:id:clinic:dr_house}"
        Then the request should fail with a 401 status code
