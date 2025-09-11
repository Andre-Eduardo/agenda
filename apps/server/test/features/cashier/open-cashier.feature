Feature: Open cashier
    As a user, I want to open a cashier so that I can serve customers.

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User     | Permissions    |
            | john_doe | [cashier:open] |
            | anaa123  | []             |

    Scenario: Preventing unauthorized users from opening a cashier
        Given I am signed in as "anaa123" in the company "Ecxus"
        When I send a "POST" request to "/cashier" with:
            | userId | ${ref:id:user:john_doe} |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Opening a cashier
        Given the current date and time is "2024-01-01T05:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/cashier" with:
            | userId | ${ref:id:user:john_doe} |
        Then the request should succeed with a 201 status code
        And the response should match:
            """YAML
            {
                "id": _.isEntityId,
                "companyId": "${ref:id:company:Ecxus}",
                "userId": "${ref:id:user:john_doe}",
                "createdAt": "2024-01-01T05:00:00.000Z",
                "updatedAt": "2024-01-01T05:00:00.000Z",
                "closedAt": null
            }
            """
        And should exist cashiers in the company "Ecxus" with the following data:
            | User     | Created At           | Updated At           | Closed At |
            | john_doe | 2024-01-01T05:00:00Z | 2024-01-01T05:00:00Z | null      |
        And the following events in the company "Ecxus" should be recorded:
            | Type           | Timestamp            | User ID                 |
            | CASHIER_OPENED | 2024-01-01T05:00:00Z | ${ref:id:user:john_doe} |

    Scenario: Opening cashiers to different users
        Given the current date and time is "2024-01-01T05:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/cashier" with:
            | userId | ${ref:id:user:john_doe} |
        Then the request should succeed with a 201 status code
        And should exist cashiers in the company "Ecxus" with the following data:
            | User     | Created At           | Updated At           | Closed At |
            | john_doe | 2024-01-01T05:00:00Z | 2024-01-01T05:00:00Z | null      |
        And I wait 1 hour
        When I send a "POST" request to "/cashier" with:
            | userId | ${ref:id:user:anaa123} |
        Then the request should succeed with a 201 status code
        And should exist cashiers in the company "Ecxus" with the following data:
            | User    | Created At           | Updated At           | Closed At |
            | anaa123 | 2024-01-01T06:00:00Z | 2024-01-01T06:00:00Z | null      |
        And the following events in the company "Ecxus" should be recorded:
            | Type           | Timestamp            | User ID                 |
            | CASHIER_OPENED | 2024-01-01T05:00:00Z | ${ref:id:user:john_doe} |
            | CASHIER_OPENED | 2024-01-01T06:00:00Z | ${ref:id:user:john_doe} |

    Scenario Outline: Choosing an invalid user ID
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/cashier" with:
            | userId | <User ID> |
        Then I should receive an invalid input error on "userId" with reason "<Reason>"

        Examples:
            | User ID           | Reason                                    |
            | ""                | Malformed ID. Expected a valid entity ID. |
            | "188.888.888.888" | Malformed ID. Expected a valid entity ID. |
            | 188888888888      | Expected string, received number          |
            | true              | Expected string, received boolean         |

    Scenario: Trying to open more than one cashier to the same user
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/cashier" with:
            | userId | ${ref:id:user:john_doe} |
        And I send a "POST" request to "/cashier" with:
            | userId | ${ref:id:user:john_doe} |
        Then I should receive a precondition failed error with message "The user already has one opened cashier."
