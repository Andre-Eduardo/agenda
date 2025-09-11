Feature: Delete employee
    As a user, I want to delete an employee so that I can remove it from the system

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Document ID    | Permissions       |
            | john_doe   | 100.000.000-04 | [employee:delete] |
            | william123 | 100.000.000-05 | []                |
        And the following employee positions exist in the company 'Ecxus':
            | Name    |
            | Manager |
            | Admin   |
            | Maid    |
        And the following employees exist in the company "Ecxus":
            | Name  | Document ID    | Position | Person type |
            | john  | 100.000.000-01 | Manager  | LEGAL       |
            | Andre | 100.000.000-02 | Admin    | NATURAL     |
            | Ana   | 100.000.000-03 | Maid     | NATURAL     |

    Scenario: Preventing unauthorized users from deleting an employee
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "DELETE" request to "/employee/${ref:id:employee:Ecxus:10000000002}"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Deleting an employee
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "DELETE" request to "/employee/${ref:id:employee:Ecxus:10000000002}"
        Then the request should succeed with a 200 status code
        And no employee with document ID "100.000.000.02" should exist in the company "Ecxus"
        And the following employees in the company "Ecxus" should exist:
            | Document ID   |
            | "10000000001" |
            | "10000000003" |
            | "10000000004" |
            | "10000000005" |
        And the following events in the company "Ecxus" should be recorded:
            | Type             | Timestamp              | User ID                   |
            | EMPLOYEE_DELETED | "2024-01-01T01:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario: Deleting an employee who is also a customer
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        And the following customers exist in the company "Ecxus":
            | ID                                   | Document ID   |
            | ${ref:id:employee:Ecxus:10000000001} | "10000000001" |
        When I send a "DELETE" request to "/employee/${ref:id:employee:Ecxus:10000000001}"
        Then the request should succeed with a 200 status code
        And no employee with document ID "100.000.000.01" should exist in the company "Ecxus"
        And the following employees in the company "Ecxus" should exist:
            | ID                                   |
            | ${ref:id:employee:Ecxus:10000000002} |
            | ${ref:id:employee:Ecxus:10000000003} |
            | ${ref:id:employee:Ecxus:10000000004} |
            | ${ref:id:employee:Ecxus:10000000005} |
        And the following customers in the company "Ecxus" should exist:
            | ID                                   |
            | ${ref:id:customer:Ecxus:10000000001} |
        And the following events in the company "Ecxus" should be recorded:
            | Type             | Timestamp              | User ID                   |
            | EMPLOYEE_DELETED | "2024-01-01T01:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario: Deleting an employee that does not exist
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            b937e300-3364-4c7d-b6ed-675deea6e89e
            """
        When I send a "DELETE" request to "/employee/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Employee not found"
