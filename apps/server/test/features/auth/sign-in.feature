Feature: Sign in
    As a registered user, I want to sign in to my account so that I can access the application.

    Background:
        Given a company with name "Ecxus" exists
        And the following users exist:
            | Username   | Password | Global role | Companies |
            | john_doe   | J0hn.Do3 | OWNER       | [Ecxus]   |
            | william123 | W1lli@am | NONE        | [Ecxus]   |

    Scenario: Signing in with valid credentials as owner
        When I send a "POST" request to "/auth/sign-in" with:
            | username | john_doe |
            | password | J0hn.Do3 |
        Then the request should succeed with a 200 status code
        And I should be signed in as "john_doe"
        And my authentication should be remembered for 1 day

    Scenario: Signing in with valid credentials as regular user
        When I send a "POST" request to "/auth/sign-in" with:
            | username | william123 |
            | password | W1lli@am   |
        Then the request should succeed with a 200 status code
        And I should be signed in as "william123"
        And my authentication should be remembered for 1 day

    Scenario: Signing in with invalid credentials
        When I send a "POST" request to "/auth/sign-in" with:
            | username | john_doe |
            | password | wrong    |
        Then I should receive an access denied error with message "Incorrect password." and reason BAD_CREDENTIALS
        And I should be signed out

    Scenario: Signing in with non-existent user
        When I send a "POST" request to "/auth/sign-in" with:
            | username | foo      |
            | password | J0hn.Do3 |
        Then I should receive an access denied error with message "No user found with username \"foo\"." and reason UNKNOWN_USER
