Feature: Finish cleaning
    As a user, I want to finish cleaning the room so it can be ready to use again.

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions                      |
            | john_doe   | [cleaning:start,cleaning:finish] |
            | pedro_2    | [cleaning:finish]                |
            | william123 | []                               |
        And a room category with name "Luxo" in the company "Ecxus" exists
        And the following rooms exist in the company "Ecxus" and room category "Luxo":
            | Number | State    |
            | 1      | CLEANING |
            | 2      | CLEANING |
            | 3      | DIRTY    |
        And the following cleanings exist in the company "Ecxus":
            | Room | Start user ID           | Started at               | Created at               |
            | 1    | ${ref:id:user:john_doe} | 2024-03-06T03:00:00.000Z | 2024-03-06T03:00:00.000Z |
            | 2    | ${ref:id:user:john_doe} | 2024-01-06T03:00:00.000Z | 2024-01-06T03:00:00.000Z |

    Scenario: Preventing unauthorized users from finish a cleaning
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "PATCH" request to "/cleaning/room/${ref:id:room:Ecxus:1}/finish" with:
            | endReason | EXPIRED |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Finishing a cleaning
        Given the current date and time is "2024-01-06T04:00:00.000Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PATCH" request to "/cleaning/room/${ref:id:room:Ecxus:1}/finish" with:
            | endReason | FINISHED |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:cleaning:Ecxus:1}",
                "companyId": "${ref:id:company:Ecxus}",
                "roomId": "${ref:id:room:Ecxus:1}",
                "finishedAt": "2024-01-06T04:00:00.000Z",
                "endReason": "FINISHED",
                "startedById": "${ref:id:user:john_doe}",
                "finishedById": "${ref:id:user:john_doe}",
                "startedAt": "2024-03-06T03:00:00.000Z",
                "createdAt": "2024-03-06T03:00:00.000Z",
                "updatedAt": "2024-01-06T04:00:00.000Z"
            }
            """
        And should exist cleanings in the company "Ecxus" with the following data:
            | Room | End reason | Finished at              |
            | 1    | FINISHED   | 2024-01-06T04:00:00.000Z |
        And should exist rooms in the company "Ecxus" with the following data:
            | Number | State      |
            | 1      | INSPECTION |
        And the following events in the company "Ecxus" should be recorded:
            | Type               | Timestamp              | User ID                   |
            | CLEANING_FINISHED  | "2024-01-06T04:00:00Z" | "${ref:id:user:john_doe}" |
            | ROOM_STATE_CHANGED | "2024-01-06T04:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario: Canceling a cleaning
        Given the current date and time is "2024-01-06T04:00:00.000Z"
        And I am signed in as "pedro_2" in the company "Ecxus"
        When I send a "PATCH" request to "/cleaning/room/${ref:id:room:Ecxus:2}/finish" with:
            | endReason | CANCELED |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:cleaning:Ecxus:2}",
                "companyId": "${ref:id:company:Ecxus}",
                "roomId": "${ref:id:room:Ecxus:2}",
                "finishedAt": "2024-01-06T04:00:00.000Z",
                "endReason": "CANCELED",
                "startedById": "${ref:id:user:john_doe}",
                "finishedById": "${ref:id:user:pedro_2}",
                "startedAt": "2024-01-06T03:00:00.000Z",
                "createdAt": "2024-01-06T03:00:00.000Z",
                "updatedAt": "2024-01-06T04:00:00.000Z"
            }
            """
        And should exist cleanings in the company "Ecxus" with the following data:
            | Room | End reason | Finished at              |
            | 2    | CANCELED   | 2024-01-06T04:00:00.000Z |
        And should exist rooms in the company "Ecxus" with the following data:
            | Number | State |
            | 2      | DIRTY |
        And the following events in the company "Ecxus" should be recorded:
            | Type               | Timestamp              | User ID                  |
            | CLEANING_FINISHED  | "2024-01-06T04:00:00Z" | "${ref:id:user:pedro_2}" |
            | ROOM_STATE_CHANGED | "2024-01-06T04:00:00Z" | "${ref:id:user:pedro_2}" |

    Scenario: Expiring a cleaning after the cleaning timeout
        Given the current date and time is "2024-01-06T04:00:00.000Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        And I send a "POST" request to "/cleaning" with:
            | roomId | ${ref:id:room:Ecxus:3} |
        And the request should succeed with a 201 status code
        And should exist rooms in the company "Ecxus" with the following data:
            | Number | State    |
            | 3      | CLEANING |
        When I wait 2 hours
        And I wait 100 milliseconds for asynchronous operations to complete
        Then should exist cleanings in the company "Ecxus" with the following data:
            | Room | End reason |
            | 3    | EXPIRED    |
        And should exist rooms in the company "Ecxus" with the following data:
            | Number | State |
            | 3      | DIRTY |
        And the following events in the company "Ecxus" should be recorded:
            | Type              | Timestamp                | User ID |
            | CLEANING_FINISHED | 2024-01-06T06:00:00.100Z |         |

    Scenario: Finishing a cleaning that does not exist
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            7f3c4fbe-bbb4-4c32-8cce-a68f3c992839
            """
        When I send a "PATCH" request to "/cleaning/room/${ref:var:unknown-id}/finish" with:
            | endReason | CANCELED |
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Cleaning not found"
