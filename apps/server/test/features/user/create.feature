Feature: User sign-up (POST)
    As a new user I want to create an account so that I can access the application.

    Background:
        Given the following users exist:
            | Name     | Username | Email                  | Password  |
            | John Doe | john_doe | john@example.com       | J0hn.Do3! |

    Scenario: Sign-up with valid data
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
