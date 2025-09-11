Feature: Delete user
    As a user, I want to delete my account so that I can remove my personal information from the system.

    Background:
        Given the following users exist:
            | Username   | Password    | Global role |
            | john_doe   | J0hn.Do3    | OWNER       |
            | jorge-bush | j00rG3@123  | OWNER       |
            | anaa123    | "@naAa4321" | OWNER       |

    Scenario: Deleting a user
        Given the current date and time is "2020-01-01T03:00:00Z"
        And I am signed in as "john_doe"
        When I send a "DELETE" request to "/user/${ref:id:user:anaa123}" with:
            | password | "@naAa4321" |
        Then the request should succeed with a 200 status code
        And no user with username "anaa123" should exist
        And the following users should exist:
            | Username   |
            | john_doe   |
            | jorge-bush |
        And the following events should be recorded:
            | Type         | Timestamp              | User ID                   |
            | USER_DELETED | "2020-01-01T03:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario: Trying to delete a user with an incorrect password
        Given I am signed in as "john_doe"
        When I send a "DELETE" request to "/user/${ref:id:user:jorge-bush}" with:
            | password | "@naAa4321" |
        Then I should receive an access denied error with message "Incorrect password." and reason BAD_CREDENTIALS

    Scenario: Deleting a user that does not exist
        Given I am signed in as "john_doe"
        And "unknown-id" is defined as:
            """
            f90f6396-b7d5-4da2-b183-a3894b2f5f49
            """
        When I send a "DELETE" request to "/user/${ref:var:unknown-id}" with:
            | password | "@naAa4321" |
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "User not found."
