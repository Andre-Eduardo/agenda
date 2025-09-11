Feature: Start deep cleaning
    As a user, I want to start deep cleaning the room so it can be used again.

    Background:
        Given a company with name "Index" exists
        And the following employees with system access in the company "Index" exist:
            | User       | Permissions           |
            | john_doe   | [deep-cleaning:start] |
            | william123 | []                    |
        And a room category with name "Master" in the company "Index" exists
        And the following rooms exist in the company "Index" and room category "Master":
            | Number | State    |
            | 1      | DIRTY    |
            | 2      | CLEANING |
        And the following deep cleanings exist in the company "Index":
            | Room | Start user ID           |
            | 2    | ${ref:id:user:john_doe} |

    Scenario: Preventing unauthorized users from starting a deep cleaning
        Given I am signed in as "william123" in the company "Index"
        When I send a "POST" request to "/deep-cleaning" with:
            | roomId | ${ref:id:room:Index:1} |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Starting a deep cleaning
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Index"
        When I send a "POST" request to "/deep-cleaning" with:
            | roomId | ${ref:id:room:Index:1} |
        Then the request should succeed with a 201 status code
        And the response should match:
            """YAML
            {
               "id": _.isEntityId,
                "companyId": "${ref:id:company:Index}",
                "roomId": "${ref:id:room:Index:1}",
                "finishedAt": null,
                "endReason": null,
                "startedById": "${ref:id:user:john_doe}",
                "finishedById": null,
                "startedAt": "2024-01-01T01:00:00.000Z",
                "createdAt": "2024-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T01:00:00.000Z"
            }
            """
        And should exist deep cleanings in the company "Index" with the following data:
            | Room | Started at           | Start user ID           |
            | 1    | 2024-01-01T01:00:00Z | ${ref:id:user:john_doe} |
        And should exist rooms in the company "Index" with the following data:
            | Room | State         |
            | 1    | DEEP_CLEANING |
        And the following events in the company "Index" should be recorded:
            | Type                  | Timestamp              | User ID                   |
            | DEEP_CLEANING_STARTED | "2024-01-01T01:00:00Z" | "${ref:id:user:john_doe}" |
            | ROOM_STATE_CHANGED    | "2024-01-01T01:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario: Starting a deep cleaning for a room that already has a cleaning in progress
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Index"
        When I send a "POST" request to "/deep-cleaning" with:
            | roomId | ${ref:id:room:Index:2} |
        Then I should receive a precondition failed error with message "There is already a deep cleaning in this room."

    Scenario Outline: Choosing an invalid room ID
        Given I am signed in as "john_doe" in the company "Index"
        When I send a "POST" request to "/deep-cleaning" with:
            | roomId | <Room ID> |
        Then I should receive an invalid input error on "roomId" with reason "<Reason>"

        Examples:
            | Room ID           | Reason                                    |
            | ""                | Malformed ID. Expected a valid entity ID. |
            | "188.888.888.888" | Malformed ID. Expected a valid entity ID. |
            | 188888888888      | Expected string, received number          |
            | true              | Expected string, received boolean         |
