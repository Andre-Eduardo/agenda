Feature: Delete defect type
    As a user I want to delete a defect type so that I can remove it from the system

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions          |
            | john_doe   | [defect-type:delete] |
            | william123 | []                   |
        And the following defect types exist in the company "Ecxus":
            | Name       |
            | Automation |
            | Lighting   |
            | Audio      |

    Scenario: Preventing unauthorized users from deleting a defect type
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "DELETE" request to "/defect-type/${ref:id:defectType:Ecxus:Automation}"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Deleting a defect type
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "DELETE" request to "/defect-type/${ref:id:defectType:Ecxus:Automation}"
        Then the request should succeed with a 200 status code
        And the following defect types in the company "Ecxus" should exist:
            | Name     |
            | Lighting |
            | Audio    |
        And the following events in the company "Ecxus" should be recorded:
            | Type                | Timestamp              | User ID                   |
            | DEFECT_TYPE_DELETED | "2024-01-01T01:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario: Deleting a defect type that does not exist
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            b937e300-3364-4c7d-b6ed-675deea6e89e
            """
        When I send a "DELETE" request to "/defect-type/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Defect type not found"
