Feature: Professional deletion (DELETE)
    As an authenticated user I want to delete professional profiles
    so that obsolete entries no longer appear in the directory.

    Background:
        Given the following users exist:
            | Name       | Username  | Email                  | Password  |
            | Dr. House  | dr_house  | house@example.com      | H0use.Dr! |
            | Dr. Smith  | dr_smith  | smith@example.com      | Sm1th.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        And a clinic member "dr_smith" with role "PROFESSIONAL" in clinic "${ref:id:clinic:dr_house}"

    Scenario: Delete professional
        When I send a "POST" request to "/api/v1/professionals" with:
            | clinicMemberId | ${ref:id:clinicMember:dr_smith} |
            | specialty      | MEDICINA                        |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "professional" id for "to_delete"
        When I send a "DELETE" request to "/api/v1/professionals/${ref:id:professional:to_delete}"
        Then the request should succeed with a 200 status code

    Scenario: Delete professional without authentication
        Given I sign out
        When I send a "DELETE" request to "/api/v1/professionals/${ref:id:professional:dr_house}"
        Then the request should fail with a 401 status code
