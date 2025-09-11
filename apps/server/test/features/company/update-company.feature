Feature: Update company
    As a user, I want to update my company so that I can keep my company information up to date

    Background:
        Given the following companies exist:
            | Name   | Created at           | Updated at           |
            | Fuego  | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | Canada | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | Calla  | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
        And the following employees with system access in the company "Canada" exist:
            | User       | Permissions      |
            | john_doe   | [company:update] |
            | william123 | []               |

    Scenario: Preventing unauthorized users from updating a company
        Given I am signed in as "william123"
        When I send a "PUT" request to "/company/${ref:id:company:Canada}" with:
            | name | Lush |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Updating a company
        Given the current date and time is "2024-01-01T05:00:00Z"
        And I am signed in as "john_doe"
        When I send a "PUT" request to "/company/${ref:id:company:Canada}" with:
            | name | Lush |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:company:Canada}",
                "name": "Lush",
                "createdAt": "2020-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T05:00:00.000Z"
            }
            """
        And should exist companies with the following data:
            | Name  | Created at           | Updated at           |
            | Fuego | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | Lush  | 2020-01-01T01:00:00Z | 2024-01-01T05:00:00Z |
            | Calla | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
        And the following events should be recorded:
            | Type            | Timestamp              | User ID                   |
            | COMPANY_CHANGED | "2024-01-01T05:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario Outline: Choosing an invalid name
        Given I am signed in as "john_doe"
        When I send a "PUT" request to "/company/${ref:id:company:Fuego}" with:
            | name | <Name> |
        Then I should receive an invalid input error on "name" with reason "<Reason>"

        Examples:
            | Name | Reason                                      |
            | ""   | String must contain at least 1 character(s) |
            | 1    | Expected string, received number            |
            | true | Expected string, received boolean           |

    Scenario: Updating a company that does not exist
        Given I am signed in as "john_doe"
        And "unknown-id" is defined as:
            """
            7f3c4fbe-bbb4-4c32-8cce-a68f3c992839
            """
        When I send a "PUT" request to "/company/${ref:var:unknown-id}" with:
            | name | Lush |
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Company not found"
