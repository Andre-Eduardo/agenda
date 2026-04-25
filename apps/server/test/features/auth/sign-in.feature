Feature: Sign in
    As a registered user I want to sign in so that I can access the application.

    Background:
        Given the following users exist:
            | Name     | Username | Email                  | Password  |
            | John Doe | john_doe | john@example.com       | J0hn.Do3! |

    Scenario: Signing in with valid credentials
        When I send a "POST" request to "/api/v1/auth/sign-in" with:
            | username | john_doe_${ref:var:contextId} |
            | password | J0hn.Do3!                     |
        Then the request should succeed with a 200 status code
        And I should be signed in as "john_doe"

    Scenario: Signing in with wrong password
        When I send a "POST" request to "/api/v1/auth/sign-in" with:
            | username | john_doe_${ref:var:contextId} |
            | password | wrong-password                |
        Then the request should fail with a 403 status code
        And I should be signed out

    Scenario: Signing in with unknown username
        When I send a "POST" request to "/api/v1/auth/sign-in" with:
            | username | nobody_${ref:var:contextId} |
            | password | J0hn.Do3!                   |
        Then the request should fail with a 403 status code
