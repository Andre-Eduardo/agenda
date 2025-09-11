Feature: Close cashier
    As a user, I want to close a cashier so that I can stop using it

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions     |
            | john_doe   | [cashier:close] |
            | jorge-bush | [cashier:close] |
            | anaa123    | [cashier:close] |
            | william123 | []              |
        And the following cashiers exist in the company "Ecxus":
            | User       | Created at           | Closed at            |
            | john_doe   | 2024-01-01T05:00:00Z |                      |
            | jorge-bush | 2024-01-01T05:00:00Z |                      |
            | anaa123    | 2024-01-01T05:00:00Z | 2024-04-04T05:00:00Z |

    Scenario: Preventing unauthorized users from closing a cashier
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "PATCH" request to "/cashier/${ref:id:cashier:Ecxus:john_doe}"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Closing a cashier
        Given the current date and time is "2024-04-04T05:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PATCH" request to "/cashier/${ref:id:cashier:Ecxus:john_doe}"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:cashier:Ecxus:john_doe}",
                "companyId": "${ref:id:company:Ecxus}",
                "userId": "${ref:id:user:john_doe}",
                "createdAt": "2024-01-01T05:00:00.000Z",
                "updatedAt": "2024-04-04T05:00:00.000Z",
                "closedAt": "2024-04-04T05:00:00.000Z"
            }
            """
        And should exist cashiers in the company "Ecxus" with the following data:
            | User       | Created at           | Closed at            |
            | john_doe   | 2024-01-01T05:00:00Z | 2024-04-04T05:00:00Z |
            | jorge-bush | 2024-01-01T05:00:00Z |                      |
            | anaa123    | 2024-01-01T05:00:00Z | 2024-04-04T05:00:00Z |
        And the following events in the company "Ecxus" should be recorded:
            | Type           | Timestamp            | User ID                 |
            | CASHIER_CLOSED | 2024-04-04T05:00:00Z | ${ref:id:user:john_doe} |

    Scenario: Trying to close an already closed cashier
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PATCH" request to "/cashier/${ref:id:cashier:Ecxus:anaa123}"
        Then I should receive a precondition failed error with message "Cashier is already closed."

    Scenario: Closing a cashier that does not exist
        Given "unknown-id" is defined as:
            """
            b937e300-3364-4c7d-b6ed-675deea6e89e
            """
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PATCH" request to "/cashier/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Cashier not found"
