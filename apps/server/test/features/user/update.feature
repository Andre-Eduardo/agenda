Feature: User update and password change (PUT/PATCH)
    As an authenticated user I want to update my profile and password
    so that I can keep my account current and secure.

    Background:
        Given the following users exist:
            | Name     | Username | Email                  | Password  |
            | John Doe | john_doe | john@example.com       | J0hn.Do3! |

    Scenario: Update user name
        Given I am signed in as "john_doe"
        When I send a "PUT" request to "/api/v1/user/${ref:id:user:john_doe}" with:
            | name            | John Updated |
            | currentPassword | J0hn.Do3!    |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | name | John Updated |

    Scenario: Update user with wrong current password
        Given I am signed in as "john_doe"
        When I send a "PUT" request to "/api/v1/user/${ref:id:user:john_doe}" with:
            | name            | John Updated  |
            | currentPassword | wrong-pass    |
        Then the request should fail with a 401 status code

    Scenario: Change password with correct old password
        Given I am signed in as "john_doe"
        When I send a "PATCH" request to "/api/v1/user/change-password" with:
            | oldPassword | J0hn.Do3!  |
            | newPassword | N3wPass!1  |
        Then the request should succeed with a 200 status code

    Scenario: Change password with wrong old password
        Given I am signed in as "john_doe"
        When I send a "PATCH" request to "/api/v1/user/change-password" with:
            | oldPassword | wrong-pass  |
            | newPassword | N3wPass!1   |
        Then the request should fail with a 401 status code
