Feature: Update employee position
    As a user I want to update an employee position, so that I can keep the positions up to date

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions                |
            | john_doe   | [employee-position:update] |
            | william123 | []                         |
        And the following employee positions exist in the company "Ecxus":
            | Name    | Created at               | Updated at               |
            | Manager | 2024-01-01T03:00:00.000Z | 2024-01-01T03:00:00.000Z |
            | Admin   | 2024-01-01T02:00:00.000Z | 2024-01-01T02:00:00.000Z |
            | Maid    | 2024-01-01T01:00:00.000Z | 2024-01-01T01:00:00.000Z |

    Scenario: Preventing unauthorized users from updating an employee position
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "PUT" request to "/employee-position/${ref:id:employeePosition:Ecxus:Maid}" with:
            | name | Recepcionista |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Updating an employee position
        Given the current date and time is "2024-01-01T04:00:00.000Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/employee-position/${ref:id:employeePosition:Ecxus:Maid}" with:
            | name        | Recepcionista |
            | permissions | [room:view]   |
        Then the request should succeed with a 200 status code
        And the response should match:
             """JSON
            {
                "id": "${ref:id:employeePosition:Ecxus:Maid}",
                "name": "Recepcionista",
                "permissions": ["room:view"],
                "companyId": "${ref:id:company:Ecxus}",
                "createdAt": "2024-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T04:00:00.000Z"
            }
            """
        And should exist employee positions in the company "Ecxus" with the following data:
            | Name          | Created at               | Updated at               |
            | Manager       | 2024-01-01T03:00:00.000Z | 2024-01-01T03:00:00.000Z |
            | Admin         | 2024-01-01T02:00:00.000Z | 2024-01-01T02:00:00.000Z |
            | Recepcionista | 2024-01-01T01:00:00.000Z | 2024-01-01T04:00:00.000Z |
        And the following events in the company "Ecxus" should be recorded:
            | Type                      | Timestamp                  | User ID                   |
            | EMPLOYEE_POSITION_CHANGED | "2024-01-01T04:00:00.000Z" | "${ref:id:user:john_doe}" |

    Scenario Outline: Updating an employee position with an invalid name
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/employee-position/${ref:id:employeePosition:Ecxus:Maid}" with:
            | name | <Value> |
        Then I should receive an invalid input error on "name" with reason "<Reason>"

        Examples:
            | Value | Reason                                      |
            |       | Expected string, received null              |
            | 1     | Expected string, received number            |
            | true  | Expected string, received boolean           |
            | ""    | String must contain at least 1 character(s) |
