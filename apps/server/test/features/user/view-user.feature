Feature: View user
    As a user, I want to find a user and view its details

    Background:
        Given a company with name "Ecxus" exists
        And the following users exist:
            | Username   | Email                | First name | Last name | Global role | Companies | Created at           | Updated at           |
            | john_doe   | john.doe@ecxus.com   | John       | Doe       | OWNER       | [Ecxus]   | 2020-01-01T03:00:00Z | 2020-01-01T03:00:00Z |
            | jorge-bush | jorge-bush@ecxus.com | Jorge      |           | OWNER       | [Ecxus]   | 2020-01-01T02:00:00Z | 2020-01-01T02:00:00Z |
            | anaa123    | anaa123@ecxus.com    | Ana        | Collen    | NONE        | [Ecxus]   | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |

    Scenario: Preventing unauthorized users from viewing users
        Given I am signed in as "anaa123"
        When I send a "GET" request to "/user/${ref:id:user:jorge-bush}"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Viewing a user
        Given I am signed in as "john_doe"
        When I send a "GET" request to "/user/${ref:id:user:jorge-bush}"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:user:jorge-bush}",
                "username": "jorge-bush",
                "email": "jorge-bush@ecxus.com",
                "firstName": "Jorge",
                "lastName": null,
                "createdAt": "2020-01-01T02:00:00.000Z",
                "updatedAt": "2020-01-01T02:00:00.000Z"
            }
            """

    Scenario: Viewing my own user
        Given I am signed in as "john_doe"
        When I send a "GET" request to "/user/me"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:user:john_doe}",
                "username": "john_doe",
                "email": "john.doe@ecxus.com",
                "firstName": "John",
                "lastName": "Doe",
                "createdAt": "2020-01-01T03:00:00.000Z",
                "updatedAt": "2020-01-01T03:00:00.000Z"
            }
            """

    Scenario: Viewing a user that does not exist
        Given I am signed in as "john_doe"
        And "unknown-id" is defined as:
            """
            14b89734-70e4-4432-a20e-ede887cf3681
            """
        When I send a "GET" request to "/user/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "User not found."
