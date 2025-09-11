Feature: Start an audit
    As a user, I want to start an audit so that I can check for issues in the room

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User     | Permissions   |
            | john_doe | [audit:start] |
            | anaa123  | []            |
        And a room category with name "Lush" in the company "Ecxus" exists
        And the following rooms exist in the company "Ecxus" and room category "Lush":
            | Number | State  |
            | 1      | VACANT |
            | 2      | DIRTY  |
            | 3      | VACANT |
            | 4      | AUDIT  |
        And the following audits exist in the company "Ecxus":
            | Room number | Start user ID           |
            | 4           | ${ref:id:user:john_doe} |

    Scenario: Preventing unauthorized users from starting an audit
        Given I am signed in as "anaa123" in the company "Ecxus"
        When I send a "POST" request to "/audit" with:
            | roomId      | ${ref:id:room:Ecxus:1}  |
            | startedById | ${ref:id:user:john_doe} |
            | reason      | audit reason            |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Starting an audit
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/audit" with:
            | roomId      | ${ref:id:room:Ecxus:1}  |
            | startedById | ${ref:id:user:john_doe} |
            | reason      | audit reason            |
        Then the request should succeed with a 201 status code
        And the response should match:
            """YAML
            {
                "id": _.isEntityId,
                "companyId": "${ref:id:company:Ecxus}",
                "roomId": "${ref:id:room:Ecxus:1}",
                "startedById": "${ref:id:user:john_doe}",
                "finishedById": null,
                "reason": "audit reason",
                "endReason": null,
                "note": null,
                "startedAt": "2024-01-01T01:00:00.000Z",
                "finishedAt": null,
                "createdAt": "2024-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T01:00:00.000Z"
            }
            """
        And should exist audits in the company "Ecxus" with the following data:
            | Room Number | Start Responsible ID    | Reason       | Started at           |
            | 1           | ${ref:id:user:john_doe} | audit reason | 2024-01-01T01:00:00Z |
        And should exist rooms in the company "Ecxus" with the following data:
            | Number | State |
            | 1      | AUDIT |
        And the following events in the company "Ecxus" should be recorded:
            | Type               | Timestamp              | User ID                   |
            | AUDIT_STARTED      | "2024-01-01T01:00:00Z" | "${ref:id:user:john_doe}" |
            | ROOM_STATE_CHANGED | "2024-01-01T01:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario: Starting an audit for a room that already has an audit in progress
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/audit" with:
            | roomId      | ${ref:id:room:Ecxus:4}  |
            | startedById | ${ref:id:user:john_doe} |
            | reason      | audit reason            |
        Then I should receive a precondition failed error with message "There is already an audit in this room."

    Scenario Outline: Choosing an invalid room ID
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/audit" with:
            | roomId      | <Room ID>               |
            | startedById | ${ref:id:user:john_doe} |
            | reason      | audit reason            |
        Then I should receive an invalid input error on "roomId" with reason "<Reason>"

        Examples:
            | Room ID           | Reason                                    |
            | ""                | Malformed ID. Expected a valid entity ID. |
            | "188.888.888.888" | Malformed ID. Expected a valid entity ID. |
            | 188888888888      | Expected string, received number          |
            | true              | Expected string, received boolean         |

    Scenario Outline: Choosing an invalid start user ID
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/audit" with:
            | roomId      | ${ref:id:room:Ecxus:1} |
            | startedById | <Start User ID>        |
            | reason      | audit reason           |
        Then I should receive an invalid input error on "startedById" with reason "<Reason>"

        Examples:
            | Start User ID     | Reason                                    |
            | ""                | Malformed ID. Expected a valid entity ID. |
            | "188.888.888.888" | Malformed ID. Expected a valid entity ID. |
            | 188888888888      | Expected string, received number          |
            | true              | Expected string, received boolean         |

    Scenario Outline: Choosing an invalid reason
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/audit" with:
            | roomId      | ${ref:id:room:Ecxus:1}  |
            | startedById | ${ref:id:user:john_doe} |
            | reason      | <Audit Reason>          |
        Then I should receive an invalid input error on "reason" with reason "<Reason>"

        Examples:
            | Audit Reason | Reason                                      |
            | ""           | String must contain at least 1 character(s) |
            |              | Expected string, received null              |
            | 1            | Expected string, received number            |
            | true         | Expected string, received boolean           |
