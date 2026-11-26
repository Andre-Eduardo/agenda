Feature: Password reset by e-mail
    As a user who forgot the password I want to receive a reset link
    so that I can choose a new password without help from support.

    Background:
        Given the following users exist:
            | Name      | Username | Email             | Password  |
            | Dr. House | dr_house | house@example.com | H0use.Dr! |

    Scenario: Requesting a reset for an unknown e-mail answers the same as for a known one
        When I send a "POST" request to "/api/v1/auth/password-reset/request" with:
            | email | nobody@example.com |
        Then the request should succeed with a 204 status code

    Scenario: Requesting a reset with an invalid e-mail returns 400
        When I send a "POST" request to "/api/v1/auth/password-reset/request" with:
            | email | not-an-email |
        Then the request should fail with a 400 status code

    Scenario: Confirming with an invalid token is rejected
        When I send a "POST" request to "/api/v1/auth/password-reset/confirm" with:
            | token       | not-a-real-token |
            | newPassword | N3w.Passw0rd!    |
        Then the request should fail with a 409 status code
