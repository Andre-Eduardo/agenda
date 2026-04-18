Feature: Professional update (PUT)
    As an authenticated user I want to update professional profiles
    so that their information stays current.

    Background:
        Given the following users exist:
            | Name     | Username | Email                   | Password  |
            | Dr. House | dr_house | house@example.com       | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"

    Scenario: Update professional specialty
        When I send a "PUT" request to "/api/v1/professionals/${ref:id:professional:dr_house}" with:
            | specialty | NEUROLOGIA |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | specialty | NEUROLOGIA |

    Scenario: Update professional with unknown ID
        When I send a "PUT" request to "/api/v1/professionals/01900000-0000-7000-8000-000000000000" with:
            | specialty | MEDICINA |
        Then the request should fail with a 404 status code
