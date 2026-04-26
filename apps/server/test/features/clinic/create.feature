Feature: Clinic creation (POST)
    As an authenticated user I want to create a clinic
    so that I can manage appointments and members under it.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"

    Scenario: Create a clinic with a name
        When I send a "POST" request to "/api/v1/clinics" with:
            | name            | Clínica Central |
            | isPersonalClinic | false           |
        Then the request should succeed with a 201 status code
        And the response should contain:
            | name            | Clínica Central |
            | isPersonalClinic | false           |

    Scenario: Create a personal clinic
        When I send a "POST" request to "/api/v1/clinics" with:
            | name            | Consultório Dr. House |
            | isPersonalClinic | true                  |
        Then the request should succeed with a 201 status code
        And the response should contain:
            | name            | Consultório Dr. House |
            | isPersonalClinic | true                  |

    Scenario: Create a clinic without a name returns 400
        When I send a "POST" request to "/api/v1/clinics" with:
            | isPersonalClinic | false |
        Then the request should fail with a 400 status code

    Scenario: Create a clinic without authentication returns 401
        Given I sign out
        When I send a "POST" request to "/api/v1/clinics" with:
            | name            | Clínica Sem Auth |
            | isPersonalClinic | false            |
        Then the request should fail with a 401 status code
