Feature: Create an employee position
    As a user, I want to create an employee position so that I can assign employees to it.

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions                |
            | john_doe   | [employee-position:create] |
            | william123 | []                         |

    Scenario: Preventing unauthorized users from creating an employee position
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "POST" request to "/employee-position" with:
            | name        | Manager                                      |
            | permissions | [room:view, room:create, reservation:create] |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Create an employee position
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/employee-position" with:
            | name        | Manager                                      |
            | permissions | [room:view, room:create, reservation:create] |
        Then the request should succeed with a 201 status code
        And the response should match:
            """YAML
            {
                "id": _.isEntityId,
                "name": "Manager",
                "permissions": ["room:view", "room:create", "reservation:create"],
                "companyId": "${ref:id:company:Ecxus}",
                "createdAt": "2024-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T01:00:00.000Z"
            }
            """
        And should exist employee positions in the company "Ecxus" with the following data:
            | Name    | CompanyId |
            | Manager | Ecxus     |
        And the following events in the company "Ecxus" should be recorded:
            | Type                      | Timestamp              | User ID                   |
            | EMPLOYEE_POSITION_CREATED | "2024-01-01T01:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario Outline: Choosing an invalid name
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/employee-position" with:
            | name        | <Name> |
            | permissions | []     |
        Then I should receive an invalid input error on "name" with reason "<Reason>"

        Examples:
            | Name | Reason                                      |
            |      | Expected string, received null              |
            | 1    | Expected string, received number            |
            | true | Expected string, received boolean           |
            | ""   | String must contain at least 1 character(s) |
