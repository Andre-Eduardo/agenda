Feature: User deletion (DELETE)
    As an authenticated user I want to delete my account
    so that I can no longer sign in, while the data needed for retention is kept.

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

    Scenario: A deleted user is soft deleted and can no longer sign in
        Given I am signed in as "jane_doe"
        When I send a "DELETE" request to "/api/v1/user/${ref:id:user:jane_doe}" with:
            | password | J@n3.Do3! |
        Then the request should succeed with a 200 status code
        And the user "jane_doe" should be soft deleted
        Given I sign out
        When I send a "POST" request to "/api/v1/auth/sign-in" with:
            | username | jane_doe_${ref:var:contextId} |
            | password | J@n3.Do3!                     |
        Then the request should fail with a 403 status code
        And I should be signed out

    Scenario: A deleted user keeps the username reserved
        Given I am signed in as "jane_doe"
        When I send a "DELETE" request to "/api/v1/user/${ref:id:user:jane_doe}" with:
            | password | J@n3.Do3! |
        Then the request should succeed with a 200 status code
        When I send a "POST" request to "/api/v1/user/sign-up" with:
            | name     | Another Jane                  |
            | username | jane_doe_${ref:var:contextId} |
            | email    | another_jane_${ref:var:contextId}@example.com |
            | password | J@n3.Do3!                     |
        Then the request should fail with a 409 status code

    Scenario: Deleting a user revokes their clinic memberships
        Given I am signed in as "john_doe"
        And a professional "john_doe" exists with specialty "MEDICINA"
        And I am signed in as "john_doe" with professional "${ref:id:professional:john_doe}"
        And the clinic member "john_doe" also has the role "OWNER"
        When I send a "DELETE" request to "/api/v1/user/${ref:id:user:john_doe}" with:
            | password | J0hn.Do3! |
        Then the request should succeed with a 200 status code
        And the user "john_doe" should be soft deleted
        And the clinicMember "john_doe" should be soft deleted
        When I send a "GET" request to "/api/v1/patients"
        Then the request should fail with a 403 status code

    Scenario: Delete user without authentication
        When I send a "DELETE" request to "/api/v1/user/${ref:id:user:john_doe}"
        Then the request should fail with a 401 status code
