Feature: Professional creation (POST)
    As an authenticated user I want to create professional profiles
    so that patients can be assigned to the right specialist.

    Background:
        Given the following users exist:
            | Name       | Username  | Email                  | Password  |
            | Dr. House  | dr_house  | house@example.com      | H0use.Dr! |
            | Dr. Smith  | dr_smith  | smith@example.com      | Sm1th.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        And a clinic member "dr_smith" with role "PROFESSIONAL" in clinic "${ref:id:clinic:dr_house}"

    Scenario: Create a professional with valid data
        When I send a "POST" request to "/api/v1/professionals" with:
            | clinicMemberId | ${ref:id:clinicMember:dr_smith} |
            | specialty      | PSICOLOGIA                      |
        Then the request should succeed with a 201 status code
        And the response should contain:
            | specialty | PSICOLOGIA |
        And I save the response field "id" as "professional" id for "dr_smith"

    Scenario: Create a professional with an invalid clinicMemberId returns 400
        When I send a "POST" request to "/api/v1/professionals" with:
            | clinicMemberId | not-a-valid-uuid |
            | specialty      | FISIOTERAPIA     |
        Then the request should fail with a 400 status code

    Scenario: Create a professional without authentication
        Given I sign out
        When I send a "POST" request to "/api/v1/professionals" with:
            | clinicMemberId | ${ref:id:clinicMember:dr_smith} |
            | specialty      | MEDICINA                        |
        Then the request should fail with a 401 status code
