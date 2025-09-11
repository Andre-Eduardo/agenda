Feature: Start cleaning
    As a user, I want to start cleaning the room so it can be used again.

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions      |
            | john_doe   | [cleaning:start] |
            | william123 | []               |
        And a room category with name "Luxo" in the company "Ecxus" exists
        And the following rooms exist in the company "Ecxus" and room category "Luxo":
            | Number | State    |
            | 1      | DIRTY    |
            | 2      | CLEANING |
        And the following cleanings exist in the company "Ecxus":
            | Room | Start user ID           |
            | 2    | ${ref:id:user:john_doe} |

    Scenario: Preventing unauthorized users from starting a cleaning
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "POST" request to "/cleaning" with:
            | roomId | ${ref:id:room:Ecxus:1} |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Starting a cleaning
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/cleaning" with:
            | roomId | ${ref:id:room:Ecxus:1} |
        Then the request should succeed with a 201 status code
        And the response should match:
            """YAML
            {
               "id": _.isEntityId,
                "companyId": "${ref:id:company:Ecxus}",
                "roomId": "${ref:id:room:Ecxus:1}",
                "finishedAt": null,
                "endReason": null,
                "startedById": "${ref:id:user:john_doe}",
                "finishedById": null,
                "startedAt": "2024-01-01T01:00:00.000Z",
                "createdAt": "2024-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T01:00:00.000Z"
            }
            """
        And should exist cleanings in the company "Ecxus" with the following data:
            | Room | Started at           | Start user ID           |
            | 1    | 2024-01-01T01:00:00Z | ${ref:id:user:john_doe} |
        And should exist rooms in the company "Ecxus" with the following data:
            | Number | State    |
            | 1      | CLEANING |
        And the following events in the company "Ecxus" should be recorded:
            | Type               | Timestamp              | User ID                   |
            | CLEANING_STARTED   | "2024-01-01T01:00:00Z" | "${ref:id:user:john_doe}" |
            | ROOM_STATE_CHANGED | "2024-01-01T01:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario: Starting a cleaning for a room that already has a cleaning in progress
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/cleaning" with:
            | roomId | ${ref:id:room:Ecxus:2} |
        Then I should receive a precondition failed error with message "There is already a cleaning in this room."

    Scenario Outline: Choosing an invalid room ID
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/cleaning" with:
            | roomId | <Room ID> |
        Then I should receive an invalid input error on "roomId" with reason "<Reason>"

        Examples:
            | Room ID           | Reason                                    |
            | ""                | Malformed ID. Expected a valid entity ID. |
            | "188.888.888.888" | Malformed ID. Expected a valid entity ID. |
            | 188888888888      | Expected string, received number          |
            | true              | Expected string, received boolean         |
