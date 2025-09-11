Feature: Delete defect
    As a user I want to delete a defect so that I can remove it from the system

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions     |
            | john-doe   | [defect:delete] |
            | william123 | []              |
        And a room category with name "Lush" in the company "Ecxus" exists
        And the following rooms exist in the company "Ecxus" and room category "Lush":
            | Number | Name    |
            | 1      | Suite 1 |
        And the following defect types exist in the company "Ecxus":
            | Name |
            | Door |
            | TV   |
        And the following defects exist in the company "Ecxus":
            | Note               | Room | Defect Type | Created by ID           | Created at           | Updated at           |
            | The door is broken | 1    | Door        | ${ref:id:user:john-doe} | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | The TV is broken   | 1    | TV          | ${ref:id:user:john-doe} | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |

    Scenario: Preventing unauthorized users from deleting a defect
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "DELETE" request to "/defect/${ref:id:defect:Ecxus:1:TV}"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Deleting a defect
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john-doe" in the company "Ecxus"
        When I send a "DELETE" request to "/defect/${ref:id:defect:Ecxus:1:TV}"
        Then the request should succeed with a 200 status code
        And the following defects in the company "Ecxus" should exist:
            | Note               | Room | Defect Type | Created By ID           |
            | The door is broken | 1    | Door        | ${ref:id:user:john-doe} |
        And the following events in the company "Ecxus" should be recorded:
            | Type           | Timestamp              | User ID                   |
            | DEFECT_DELETED | "2024-01-01T01:00:00Z" | "${ref:id:user:john-doe}" |

    Scenario: Deleting a defect that does not exist
        Given I am signed in as "john-doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            b937e300-3364-4c7d-b6ed-675deea6e89e
            """
        When I send a "DELETE" request to "/defect/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Defect not found"
