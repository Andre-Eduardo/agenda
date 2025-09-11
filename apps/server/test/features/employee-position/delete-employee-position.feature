Feature: Delete an employee position
    As a user, I want to delete an employee position so that I can remove an employee from the system.

    Background:
        Given a company with name "Ecxus" exists
        And the following employee positions exist in the company "Ecxus":
            | Name     | Permissions                |
            | Manager  | [employee-position:delete] |
            | Admin    | [employee-position:delete] |
            | Maid     | []                         |
            | Owner    | [employee-position:delete] |
            | Visitant | []                         |
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Position |
            | john_doe   | Owner    |
            | william123 | Visitant |

    Scenario: Preventing unauthorized users from deleting an employee position
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "DELETE" request to "/employee-position/${ref:id:employeePosition:Ecxus:Manager}"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Deleting an employee position
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "DELETE" request to "/employee-position/${ref:id:employeePosition:Ecxus:Manager}"
        Then the request should succeed with a 200 status code
        And No employee position with name "Manager" should exist in the company "Ecxus"
        And the following employee positions in the company "Ecxus" should exist:
            | Name     |
            | Admin    |
            | Maid     |
            | Owner    |
            | Visitant |
        And the following events in the company "Ecxus" should be recorded:
            | Type                      | Timestamp              | User ID                   |
            | EMPLOYEE_POSITION_DELETED | "2024-01-01T01:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario: Deleting a non-existent employee position
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            b937e300-3364-4c7d-b6ed-675deea6e89e
            """
        When I send a "DELETE" request to "/employee-position/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Employee position not found"
