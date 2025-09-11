Feature: Sign out
    As a signed in user, I want to be able to sign out so that I can protect my account from unauthorized access.

    Background:
        Given the following users exist:
            | Username | Password | Global role |
            | john_doe | J0hn.Do3 | OWNER       |

    Scenario: Signing out
        Given I am signed in as "john_doe"
        When I send a "POST" request to "/auth/sign-out"
        Then the request should succeed with a 200 status code
        And I should be signed out

    Scenario: Being signed out after the session expires
        Given the current date and time is "2024-01-01T05:00:00Z"
        And I am signed in as "john_doe"
        And I wait 23 hours
        * I should be signed in as "john_doe"
        When I wait 2 hour
        Then I should be signed out

    Scenario: Signing out when not signed in
        When I send a "POST" request to "/auth/sign-out"
        Then I should receive an unauthenticated error
