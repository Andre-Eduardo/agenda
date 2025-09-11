Feature: Finish maintenance
    As a user, I want to finish a maintenance in the room to indicate that the maintenance has been completed

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions          |
            | john_doe   | [maintenance:finish] |
            | william123 | []                   |
        And a room category with name "Lush" in the company "Ecxus" exists
        And the following rooms exist in the company "Ecxus" and room category "Lush":
            | Number | Name    | State       |
            | 1      | Suite 1 | MAINTENANCE |
        And the following defect types exist in the company "Ecxus":
            | Name |
            | Door |
            | TV   |
        And the following defects exist in the company "Ecxus":
            | Note               | Room | Defect Type | Created by ID           | Created at           | Updated at           |
            | The door is broken | 1    | Door        | ${ref:id:user:john_doe} | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
        And the following maintenances exist in the company "Ecxus":
            | Room | Start user ID           | Started at               | Created at               | Updated at               | Note               | Defects                           |
            | 1    | ${ref:id:user:john_doe} | 2024-01-01T01:00:00.000Z | 2024-01-01T01:00:00.000Z | 2024-01-01T01:00:00.000Z | Defect in the room | ["${ref:id:defect:Ecxus:1:Door}"] |

    Scenario: Preventing unauthorized users from finish a maintenance
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "PATCH" request to "/maintenance/room/${ref:id:room:Ecxus:1}/finish"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Finishing a maintenance
        Given the current date and time is "2024-01-06T04:00:00.000Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PATCH" request to "/maintenance/room/${ref:id:room:Ecxus:1}/finish"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:maintenance:Ecxus:1}",
                "companyId": "${ref:id:company:Ecxus}",
                "roomId": "${ref:id:room:Ecxus:1}",
                "note": "Defect in the room",
                "defects": [
                    {
                        "id": "${ref:id:defect:Ecxus:1:Door}",
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z",
                        "companyId": "${ref:id:company:Ecxus}",
                        "note": "The door is broken",
                        "roomId": "${ref:id:room:Ecxus:1}",
                        "defectTypeId": "${ref:id:defectType:Ecxus:Door}",
                        "createdById": "${ref:id:user:john_doe}",
                        "finishedById": null,
                        "finishedAt": null
                    }
                ],
                "finishedAt": "2024-01-06T04:00:00.000Z",
                "startedById": "${ref:id:user:john_doe}",
                "finishedById": "${ref:id:user:john_doe}",
                "startedAt": "2024-01-01T01:00:00.000Z",
                "createdAt": "2024-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-06T04:00:00.000Z"
            }
            """
        And should exist maintenances in the company "Ecxus" with the following data:
            | Room | Started at           | Start user ID           | Finished at             | Finish user ID          |
            | 1    | 2024-01-01T01:00:00Z | ${ref:id:user:john_doe} | 2024-01-06T04:00:00.00Z | ${ref:id:user:john_doe} |
        And should exist rooms in the company "Ecxus" with the following data:
            | Number | Status |
            | 1      | DIRTY  |
        And the following events in the company "Ecxus" should be recorded:
            | Type                 | Timestamp              | User ID                   |
            | MAINTENANCE_FINISHED | "2024-01-06T04:00:00Z" | "${ref:id:user:john_doe}" |
            | ROOM_STATE_CHANGED   | "2024-01-06T04:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario: Finishing a maintenance that does not exist
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            7f3c4fbe-bbb4-4c32-8cce-a68f3c992839
            """
        When I send a "PATCH" request to "/maintenance/room/${ref:var:unknown-id}/finish"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Maintenance not found"
