Feature: Solo account (autônomo)
    As an independent professional I want an account that is only mine
    so that clinic features (team, reception) stay out of my way
    and can only be turned on when I need them.

    Background:
        Given the following users exist:
            | Name      | Username | Email             | Password  |
            | Dr. House | dr_house | house@example.com | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And the clinic member "dr_house" also has the role "OWNER"
        And the clinic "dr_house" is a solo account
        And I am signed in as "dr_house" with clinic member "${ref:id:clinicMember:dr_house}"

    Scenario: A solo account has no clinic module
        When I send a "GET" request to "/api/v1/clinic-members/me/modules"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {"modules": [], "operationalModules": [], "accountType": "SOLO"}
            """

    Scenario: A solo account cannot add a team member
        When I send a "POST" request to "/api/v1/clinic-members/accounts" with:
            | name     | Maria Secretária                  |
            | username | maria_${ref:var:contextId}        |
            | email    | maria_${ref:var:contextId}@ex.com |
            | password | M4ria.Sec!                        |
            | roles    | ["SECRETARY"]                     |
        Then the request should fail with a 403 status code
        And the response should contain:
            | reason | MODULE_NOT_ENABLED |

    Scenario: A solo account has no reception until it turns it on
        When I send a "GET" request to "/api/v1/patient-call/settings"
        Then the request should fail with a 403 status code
        And the response should contain:
            | reason | MODULE_NOT_ENABLED |
        When I send a "PATCH" request to "/api/v1/clinics/${ref:id:clinic:dr_house}" with:
            | receptionEnabled | true |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | accountType      | SOLO |
            | receptionEnabled | true |
        When I send a "GET" request to "/api/v1/clinic-members/me/modules"
        Then the response should match:
            """JSON
            {"modules": [], "operationalModules": ["RECEPTION"], "accountType": "SOLO"}
            """
        When I send a "GET" request to "/api/v1/patient-call/settings"
        Then the request should succeed with a 200 status code

    Scenario: The owner turns the solo account into a clinic and adds a team
        When I send a "PUT" request to "/api/v1/clinics/me/account-type" with:
            | accountType | CLINIC |
        Then the request should fail with a 409 status code
        When I send a "PUT" request to "/api/v1/clinics/me/account-type" with:
            | accountType       | CLINIC |
            | confirmTeamAccess | true   |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | accountType      | CLINIC |
            | receptionEnabled | true   |
        When I send a "POST" request to "/api/v1/clinic-members/accounts" with:
            | name     | Maria Secretária                  |
            | username | maria_${ref:var:contextId}        |
            | email    | maria_${ref:var:contextId}@ex.com |
            | password | M4ria.Sec!                        |
            | roles    | ["SECRETARY"]                     |
        Then the request should succeed with a 201 status code
        When I send a "PUT" request to "/api/v1/clinics/me/account-type" with:
            | accountType | SOLO |
        Then the request should fail with a 409 status code
