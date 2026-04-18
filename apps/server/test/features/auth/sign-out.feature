Feature: Sign out
    As an authenticated user I want to sign out so that my session is terminated.

    Background:
        Given the following users exist:
            | Name     | Username | Email                  | Password  |
            | John Doe | john_doe | john@example.com       | J0hn.Do3! |

    Scenario: Sign in and sign out
        Given I am signed in as "john_doe"
        When I send a "POST" request to "/api/v1/auth/sign-out"
        Then the request should succeed with a 200 status code
        And I should be signed out
