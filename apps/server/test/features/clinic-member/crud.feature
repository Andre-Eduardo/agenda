Feature: Clinic member CRUD (POST / GET)
    As a clinic owner I want to invite and list members
    so that I can control who has access to the clinic.

    Background:
        Given the following users exist:
            | Name       | Username  | Email               | Password  |
            | Dr. House  | dr_house  | house@example.com   | H0use.Dr! |
            | Dr. Wilson | dr_wilson | wilson@example.com  | W1ls0n!   |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with clinic member "${ref:id:clinicMember:dr_house}"

    Scenario: Invite a member and verify invitedByMemberId is populated
        When I send a "POST" request to "/api/v1/clinic-members" with:
            | clinicId    | ${ref:id:clinic:dr_house}   |
            | userId      | ${ref:id:user:dr_wilson}    |
            | role        | PROFESSIONAL                |
            | displayName | Dr. Wilson                  |
        Then the request should succeed with a 201 status code
        And the response should contain:
            | clinicId          | ${ref:id:clinic:dr_house}       |
            | role              | PROFESSIONAL                    |
            | invitedByMemberId | ${ref:id:clinicMember:dr_house} |

    Scenario: List clinic members
        When I send a "GET" request to "/api/v1/clinic-members?clinicId=${ref:id:clinic:dr_house}"
        Then the request should succeed with a 200 status code

    Scenario: Create member with invalid role returns 400
        When I send a "POST" request to "/api/v1/clinic-members" with:
            | clinicId | ${ref:id:clinic:dr_house} |
            | userId   | ${ref:id:user:dr_wilson}  |
            | role     | INVALID_ROLE              |
        Then the request should fail with a 400 status code

    Scenario: Create member without authentication returns 401
        Given I sign out
        When I send a "POST" request to "/api/v1/clinic-members" with:
            | clinicId | ${ref:id:clinic:dr_house} |
            | userId   | ${ref:id:user:dr_wilson}  |
            | role     | SECRETARY                 |
        Then the request should fail with a 401 status code
