Feature: Delete supplier
    As a user, I want to delete a supplier so that I can remove it from the system

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions       |
            | john_doe   | [supplier:delete] |
            | william123 | []                |
        And the following suppliers exist in the company "Ecxus":
            | Name  | Document ID    | Person type |
            | John  | 100.000.000-01 | LEGAL       |
            | Andre | 100.000.000-02 | NATURAL     |
            | Ana   | 100.000.000-03 | NATURAL     |

    Scenario: Preventing unauthorized users from deleting a supplier
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "DELETE" request to "/supplier/${ref:id:supplier:Ecxus:10000000002}"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Deleting a supplier
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "DELETE" request to "/supplier/${ref:id:supplier:Ecxus:10000000002}"
        Then the request should succeed with a 200 status code
        And no supplier with document ID "100.000.000.02" should exist in the company "Ecxus"
        And the following suppliers in the company "Ecxus" should exist:
            | Document ID   |
            | "10000000001" |
            | "10000000003" |
        And the following events in the company "Ecxus" should be recorded:
            | Type             | Timestamp              | User ID                   |
            | SUPPLIER_DELETED | "2024-01-01T01:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario: Deleting a supplier who is also a customer
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        And the following customers exist in the company "Ecxus":
            | ID                                   | Document ID   |
            | ${ref:id:supplier:Ecxus:10000000002} | "10000000002" |
        When I send a "DELETE" request to "/supplier/${ref:id:supplier:Ecxus:10000000002}"
        Then the request should succeed with a 200 status code
        And no supplier with document ID "100.000.000.02" should exist in the company "Ecxus"
        And the following suppliers in the company "Ecxus" should exist:
            | ID                                   |
            | ${ref:id:supplier:Ecxus:10000000001} |
            | ${ref:id:supplier:Ecxus:10000000003} |
        And the following customers in the company "Ecxus" should exist:
            | ID                                   |
            | ${ref:id:customer:Ecxus:10000000002} |
        And the following events in the company "Ecxus" should be recorded:
            | Type             | Timestamp              | User ID                   |
            | SUPPLIER_DELETED | "2024-01-01T01:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario: Deleting a supplier that does not exist
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            b937e300-3364-4c7d-b6ed-675deea6e89e
            """
        When I send a "DELETE" request to "/supplier/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Supplier not found"
