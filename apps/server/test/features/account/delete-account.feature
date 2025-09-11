Feature: Delete account
    As a user I want to delete an account so that I can remove it from the system

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions      |
            | john_doe   | [account:delete] |
            | william123 | []               |
        And the following accounts exist in the company "Ecxus":
            | Name      |
            | Santander |
            | Caixa     |
            | Nubank    |

    Scenario: Preventing unauthorized users from deleting an account
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "DELETE" request to "/account/${ref:id:account:Ecxus:Caixa}"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Deleting an account
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "DELETE" request to "/account/${ref:id:account:Ecxus:Caixa}"
        Then the request should succeed with a 200 status code
        And the following accounts in the company "Ecxus" should exist:
            | Name      |
            | Santander |
            | Nubank    |
        And the following events in the company "Ecxus" should be recorded:
            | Type            | Timestamp            | User ID                 |
            | ACCOUNT_DELETED | 2024-01-01T01:00:00Z | ${ref:id:user:john_doe} |

    Scenario: Deleting an account that does not exist
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            b937e300-3364-4c7d-b6ed-675deea6e89e
            """
        When I send a "DELETE" request to "/account/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Account not found"
