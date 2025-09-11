Feature: Create company
    As a user, I want to create a company so that I can run my business

    Background:
        Given the following users exist:
            | Username | Global role |
            | john_doe | OWNER       |
        And a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions |
            | william123 | []          |

    Scenario: Preventing unauthorized users from creating a company
        Given I am signed in as "william123"
        When I send a "POST" request to "/company" with:
            | name | Company 1 |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Creating a company
        Given the current date and time is "2020-01-01T03:00:00Z"
        And I am signed in as "john_doe"
        When I send a "POST" request to "/company" with:
            | name | Company 1 |
        Then the request should succeed with a 201 status code
        And the response should match:
            """YAML
            {
                "id": _.isEntityId,
                "name": "Company 1",
                "createdAt": "2020-01-01T03:00:00.000Z",
                "updatedAt": "2020-01-01T03:00:00.000Z"
            }
            """
        And a company with name "Company 1" should exist
        And the following events should be recorded:
            | Type            | Timestamp              | User ID                   |
            | COMPANY_CREATED | "2020-01-01T03:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario Outline: Choosing an invalid name
        Given I am signed in as "john_doe"
        When I send a "POST" request to "/company" with:
            | name | <Name> |
        Then I should receive an invalid input error on "name" with reason "<Reason>"

        Examples:
            | Name | Reason                                      |
            | ""   | String must contain at least 1 character(s) |
            | 1    | Expected string, received number            |
            | true | Expected string, received boolean           |
