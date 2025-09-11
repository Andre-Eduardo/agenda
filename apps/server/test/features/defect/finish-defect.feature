Feature: Finish defect
    As a user, I want to close a defect after solving the problem

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions     |
            | john-doe   | [defect:finish] |
            | william123 | []              |
        And a room category with name "Lush" in the company "Ecxus" exists
        And the following rooms exist in the company "Ecxus" and room category "Lush":
            | Number | Name    |
            | 1      | Suite 1 |
        And the following defect types exist in the company "Ecxus":
            | Name |
            | Door |
        And the following defects exist in the company "Ecxus":
            | Note               | Room | Defect Type | Created by ID           | Created at           | Updated at           |
            | The door is broken | 1    | Door        | ${ref:id:user:john-doe} | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |

    Scenario: Preventing unauthorized users from finishing a defect
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "PATCH" request to "/defect/${ref:id:defect:Ecxus:1:Door}/finish" with:
            | note | The door is broken |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Finish a defect
        Given the current date and time is "2024-01-06T04:00:00.000Z"
        And I am signed in as "john-doe" in the company "Ecxus"
        When I send a "PATCH" request to "/defect/${ref:id:defect:Ecxus:1:Door}/finish"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:defect:Ecxus:1:Door}",
                "companyId": "${ref:id:company:Ecxus}",
                "note": "The door is broken",
                "roomId": "${ref:id:room:Ecxus:1}",
                "defectTypeId": "${ref:id:defectType:Ecxus:Door}",
                "createdById": "${ref:id:user:john-doe}",
                "finishedById": "${ref:id:user:john-doe}",
                "finishedAt": "2024-01-06T04:00:00.000Z",
                "createdAt": "2020-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-06T04:00:00.000Z"
            }
            """
        And should exist defects in the company "Ecxus" with the following data:
            | Note               | Room | Defect Type | Created by ID           | Finished by ID          | Finished at              |
            | The door is broken | 1    | Door        | ${ref:id:user:john-doe} | ${ref:id:user:john-doe} | 2024-01-06T04:00:00.000Z |
        And the following events in the company "Ecxus" should be recorded:
            | Type            | Timestamp              | User ID                   |
            | DEFECT_FINISHED | "2024-01-06T04:00:00Z" | "${ref:id:user:john-doe}" |

    Scenario: Finish a defect that does not exist
        Given I am signed in as "john-doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            7f3c4fbe-bbb4-4c32-8cce-a68f3c992839
            """
        When I send a "PATCH" request to "/defect/${ref:var:unknown-id}/finish" with:
            | note         | The door is missing             |
            | roomId       | ${ref:id:room:Ecxus:1}          |
            | defectTypeId | ${ref:id:defectType:Ecxus:Door} |
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Defect not found"
