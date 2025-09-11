Feature: Finish deep cleaning
    As a user, I want to finish deep cleaning the room so it can be ready to use again.

    Background:
        Given a company with name "Index" exists
        And the following employees with system access in the company "Index" exist:
            | User       | Permissions            |
            | john_doe   | [deep-cleaning:finish] |
            | pedro_2    | [deep-cleaning:finish] |
            | william123 | []                     |
        And a room category with name "Master" in the company "Index" exists
        And the following rooms exist in the company "Index" and room category "Master":
            | Number | State         |
            | 1      | DEEP_CLEANING |
            | 2      | DEEP_CLEANING |
        And the following deep cleanings exist in the company "Index":
            | Room | Start user ID           | Started at               | Created at               |
            | 1    | ${ref:id:user:john_doe} | 2024-03-06T03:00:00.000Z | 2024-03-06T03:00:00.000Z |
            | 2    | ${ref:id:user:john_doe} | 2024-01-06T03:00:00.000Z | 2024-01-06T03:00:00.000Z |

    Scenario: Preventing unauthorized users from finish a deep cleaning
        Given I am signed in as "william123" in the company "Index"
        When I send a "PATCH" request to "/deep-cleaning/room/${ref:id:room:Index:1}/finish" with:
            | endReason | FINISHED |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Finishing a deep cleaning
        Given the current date and time is "2024-01-06T04:00:00.000Z"
        And I am signed in as "john_doe" in the company "Index"
        When I send a "PATCH" request to "/deep-cleaning/room/${ref:id:room:Index:1}/finish" with:
            | endReason | FINISHED |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:deepCleaning:Index:1}",
                "companyId": "${ref:id:company:Index}",
                "roomId": "${ref:id:room:Index:1}",
                "finishedAt": "2024-01-06T04:00:00.000Z",
                "endReason": "FINISHED",
                "startedById": "${ref:id:user:john_doe}",
                "finishedById": "${ref:id:user:john_doe}",
                "startedAt": "2024-03-06T03:00:00.000Z",
                "createdAt": "2024-03-06T03:00:00.000Z",
                "updatedAt": "2024-01-06T04:00:00.000Z"
            }
            """
        And should exist deep cleanings in the company "Index" with the following data:
            | Room | End Reason | Finished at              |
            | 1    | FINISHED   | 2024-01-06T04:00:00.000Z |
        And should exist rooms in the company "Index" with the following data:
            | Room | State      |
            | 1    | INSPECTION |
        And the following events in the company "Index" should be recorded:
            | Type                   | Timestamp              | User ID                   |
            | DEEP_CLEANING_FINISHED | "2024-01-06T04:00:00Z" | "${ref:id:user:john_doe}" |
            | ROOM_STATE_CHANGED     | "2024-01-06T04:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario: Canceling a deep cleaning
        Given the current date and time is "2024-01-06T04:00:00.000Z"
        And I am signed in as "pedro_2" in the company "Index"
        When I send a "PATCH" request to "/deep-cleaning/room/${ref:id:room:Index:2}/finish" with:
            | endReason | CANCELED |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:deepCleaning:Index:2}",
                "companyId": "${ref:id:company:Index}",
                "roomId": "${ref:id:room:Index:2}",
                "finishedAt": "2024-01-06T04:00:00.000Z",
                "endReason": "CANCELED",
                "startedById": "${ref:id:user:john_doe}",
                "finishedById": "${ref:id:user:pedro_2}",
                "startedAt": "2024-01-06T03:00:00.000Z",
                "createdAt": "2024-01-06T03:00:00.000Z",
                "updatedAt": "2024-01-06T04:00:00.000Z"
            }
            """
        And should exist deep cleanings in the company "Index" with the following data:
            | Room | End Reason | Finished at              |
            | 2    | CANCELED   | 2024-01-06T04:00:00.000Z |
        And should exist rooms in the company "Index" with the following data:
            | Number | State |
            | 2      | DIRTY |
        And the following events in the company "Index" should be recorded:
            | Type                   | Timestamp              | User ID                  |
            | DEEP_CLEANING_FINISHED | "2024-01-06T04:00:00Z" | "${ref:id:user:pedro_2}" |
            | ROOM_STATE_CHANGED     | "2024-01-06T04:00:00Z" | "${ref:id:user:pedro_2}" |

    Scenario: Finishing a deep cleaning that does not exist
        Given I am signed in as "john_doe" in the company "Index"
        And "unknown-id" is defined as:
            """
            7f3c4fbe-bbb4-4c32-8cce-a68f3c992839
            """
        When I send a "PATCH" request to "/deep-cleaning/room/${ref:var:unknown-id}/finish" with:
            | endReason | CANCELED |
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Deep cleaning not found"
