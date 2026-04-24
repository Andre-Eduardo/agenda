Feature: User deletion (DELETE)
    As an authenticated user I want to delete my account
    so that my data is removed from the application.

    Background:
        Given the following users exist:
            | Name     | Username | Email                  | Password  |
            | John Doe | john_doe | john@example.com       | J0hn.Do3! |
            | Jane Doe | jane_doe | jane@example.com       | J@n3.Do3! |

    Scenario: Delete user
        Given I am signed in as "jane_doe"
        When I send a "DELETE" request to "/api/v1/user/${ref:id:user:jane_doe}" with:
            | password | J@n3.Do3! |
        Then the request should succeed with a 200 status code

    Scenario: Delete user without authentication
        When I send a "DELETE" request to "/api/v1/user/${ref:id:user:john_doe}"
        Then the request should fail with a 401 status code
