Feature: User management
    As an authenticated user I want to manage my account so that I can keep my profile up to date.

    Background:
        Given the following users exist:
            | Name     | Username | Email                  | Password  |
            | John Doe | john_doe | john@example.com       | J0hn.Do3! |
            | Jane Doe | jane_doe | jane@example.com       | J@n3.Do3! |

    # ─────────────────────────────────────────────────────────────────────────────
    # Sign-up
    # ─────────────────────────────────────────────────────────────────────────────

    Scenario: Sign-up with valid data
        # The users created in Background already exercise the sign-up endpoint.
        # Here we verify the response shape directly.
        When I send a "POST" request to "/api/v1/user/sign-up" with:
            | name     | New User                                      |
            | username | new_user_${ref:var:contextId}                 |
            | email    | new_user_${ref:var:contextId}@example.com     |
            | password | N3wUser!                                      |
        Then the request should succeed with a 201 status code
        And the response should contain:
            | username | new_user_${ref:var:contextId} |

    Scenario: Sign-up with duplicate username
        When I send a "POST" request to "/api/v1/user/sign-up" with:
            | name     | Duplicate User                            |
            | username | john_doe_${ref:var:contextId}             |
            | email    | other_${ref:var:contextId}@example.com    |
            | password | J0hn.Do3!                                 |
        Then the request should fail with a 422 status code

    Scenario: Sign-up with invalid email
        When I send a "POST" request to "/api/v1/user/sign-up" with:
            | name     | Bad User         |
            | username | bad_${ref:var:contextId} |
            | email    | not-an-email     |
            | password | J0hn.Do3!        |
        Then the request should fail with a 400 status code

    # ─────────────────────────────────────────────────────────────────────────────
    # Get current user (me)
    # ─────────────────────────────────────────────────────────────────────────────

    Scenario: Get current user when authenticated
        Given I am signed in as "john_doe"
        When I send a "GET" request to "/api/v1/user/me"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | username | john_doe_${ref:var:contextId} |

    Scenario: Get current user when unauthenticated
        When I send a "GET" request to "/api/v1/user/me"
        Then the request should fail with a 401 status code

    # ─────────────────────────────────────────────────────────────────────────────
    # Get user by ID
    # ─────────────────────────────────────────────────────────────────────────────

    Scenario: Get user by ID
        Given I am signed in as "john_doe"
        When I send a "GET" request to "/api/v1/user/${ref:id:user:john_doe}"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
              "id": "${ref:id:user:john_doe}",
              "username": "john_doe_${ref:var:contextId}"
            }
            """

    Scenario: Get user by unknown ID
        Given I am signed in as "john_doe"
        When I send a "GET" request to "/api/v1/user/01900000-0000-7000-8000-000000000000"
        Then the request should fail with a 404 status code

    # ─────────────────────────────────────────────────────────────────────────────
    # Update user
    # ─────────────────────────────────────────────────────────────────────────────

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

    # ─────────────────────────────────────────────────────────────────────────────
    # Change password
    # ─────────────────────────────────────────────────────────────────────────────

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

    # ─────────────────────────────────────────────────────────────────────────────
    # Delete user
    # ─────────────────────────────────────────────────────────────────────────────

    Scenario: Delete user
        Given I am signed in as "jane_doe"
        When I send a "DELETE" request to "/api/v1/user/${ref:id:user:jane_doe}"
        Then the request should succeed with a 200 status code

    Scenario: Delete user without authentication
        When I send a "DELETE" request to "/api/v1/user/${ref:id:user:john_doe}"
        Then the request should fail with a 401 status code
