Feature: Finish an audit
    As a user, I want to finish an audit so that the room can be used again

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User     | Permissions                 |
            | john-doe | [audit:start, audit:finish] |
            | anaa123  | []                          |
        And a room category with name "Lush" in the company "Ecxus" exists
        And the following rooms exist in the company "Ecxus" and room category "Lush":
            | Number | State  |
            | 1      | VACANT |
            | 2      | AUDIT  |
        And the following audits exist in the company "Ecxus":
            | Room number | Start user ID           | End user ID             | Reason         | End reason | Started at           | Finished at          | Created at           | Updated at           |
            | 1           | ${ref:id:user:john-doe} | ${ref:id:user:john-doe} | audit 1 reason | COMPLETED  | 2024-01-01T01:00:00Z | 2024-01-01T02:00:00Z | 2024-01-01T01:00:00Z | 2024-01-01T02:00:00Z |
            | 2           | ${ref:id:user:john-doe} |                         | audit 2 reason |            | 2024-01-01T03:00:00Z |                      | 2024-01-01T03:00:00Z | 2024-01-01T03:00:00Z |

    Scenario: Preventing unauthorized users from finishing an audit
        Given I am signed in as "anaa123" in the company "Ecxus"
        When I send a "PATCH" request to "/audit/room/${ref:id:room:Ecxus:1}/finish" with:
            | finishedById  | ${ref:id:user:john-doe} |
            | note          |                         |
            | nextRoomState | VACANT                  |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario Outline: Finishing an audit
        Given the current date and time is "2024-01-06T04:00:00.000Z"
        And I am signed in as "john-doe" in the company "Ecxus"
        When I send a "PATCH" request to "/audit/room/${ref:id:room:Ecxus:2}/finish" with:
            | finishedById  | ${ref:id:user:john-doe} |
            | nextRoomState | <Value>                 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:audit:Ecxus:2}",
                "companyId": "${ref:id:company:Ecxus}",
                "roomId": "${ref:id:room:Ecxus:2}",
                "startedById": "${ref:id:user:john-doe}",
                "finishedById": "${ref:id:user:john-doe}",
                "reason": "audit 2 reason",
                "endReason": "COMPLETED",
                "note": null,
                "startedAt": "2024-01-01T03:00:00.000Z",
                "finishedAt": "2024-01-06T04:00:00.000Z",
                "createdAt": "2024-01-01T03:00:00.000Z",
                "updatedAt": "2024-01-06T04:00:00.000Z"
            }
            """
        And should exist audits in the company "Ecxus" with the following data:
            | Room number | Start user ID           | End user ID             | Reason         | End reason | Started at           | Finished at          | Created at           | Updated at           |
            | 1           | ${ref:id:user:john-doe} | ${ref:id:user:john-doe} | audit 1 reason | COMPLETED  | 2024-01-01T01:00:00Z | 2024-01-01T02:00:00Z | 2024-01-01T01:00:00Z | 2024-01-01T02:00:00Z |
            | 2           | ${ref:id:user:john-doe} | ${ref:id:user:john-doe} | audit 2 reason | COMPLETED  | 2024-01-01T03:00:00Z | 2024-01-06T04:00:00Z | 2024-01-01T03:00:00Z | 2024-01-06T04:00:00Z |
        And should exist rooms in the company "Ecxus" with the following data:
            | Number | State   |
            | 1      | VACANT  |
            | 2      | <Value> |
        And the following events in the company "Ecxus" should be recorded:
            | Type               | Timestamp              | User ID                   |
            | AUDIT_FINISHED     | "2024-01-06T04:00:00Z" | "${ref:id:user:john-doe}" |
            | ROOM_STATE_CHANGED | "2024-01-06T04:00:00Z" | "${ref:id:user:john-doe}" |

        Examples:
            | Value   |
            | DIRTY   |
            | VACANT  |
            | BLOCKED |

    Scenario: Expiring an audit after the audit timeout
        Given the current date and time is "2024-01-06T04:00:00.000Z"
        And I am signed in as "john-doe" in the company "Ecxus"
        And I send a "POST" request to "/audit" with:
            | roomId      | ${ref:id:room:Ecxus:1}  |
            | startedById | ${ref:id:user:john-doe} |
            | reason      | audit reason            |
        And the request should succeed with a 201 status code
        And should exist rooms in the company "Ecxus" with the following data:
            | Number | State |
            | 1      | AUDIT |
        When I wait 2 hours
        And I wait 100 milliseconds for asynchronous operations to complete
        Then should exist audits in the company "Ecxus" with the following data:
            | Room number | End reason |
            | 1           | EXPIRED    |
        And should exist rooms in the company "Ecxus" with the following data:
            | Number | State  |
            | 1      | VACANT |

    Scenario Outline: Finishing an audit with invalid information
        Given the current date and time is "2024-01-01T05:00:00Z"
        And I am signed in as "john-doe" in the company "Ecxus"
        When I send a "PATCH" request to "/audit/room/${ref:id:room:Ecxus:2}/finish" with:
            | <Field> | <Value> |
        Then I should receive an invalid input error on "<Field>" with reason "<Reason>"

        Examples:
            | Field         | Value             | Reason                                                                                                    |
            | note          | ""                | String must contain at least 1 character(s)                                                               |
            | note          | 1                 | Expected string, received number                                                                          |
            | note          | true              | Expected string, received boolean                                                                         |
            | nextRoomState | ""                | Invalid enum value. Expected \\'DIRTY\\' \| \\'VACANT\\' \| \\'BLOCKED\\', received ''                    |
            | nextRoomState | "188.888.888.888" | Invalid enum value. Expected \\'DIRTY\\' \| \\'VACANT\\' \| \\'BLOCKED\\', received \\'188.888.888.888\\' |
            | nextRoomState | aaaa              | Invalid enum value. Expected \\'DIRTY\\' \| \\'VACANT\\' \| \\'BLOCKED\\', received \\'aaaa\\'            |
            | nextRoomState | true              | Expected \\'DIRTY\\' \| \\'VACANT\\' \| \\'BLOCKED\\', received boolean                                   |

    Scenario: Finishing an audit that does not exist
        Given I am signed in as "john-doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            7f3c4fbe-bbb4-4c32-8cce-a68f3c992839
            """
        When I send a "PATCH" request to "/audit/room/${ref:var:unknown-id}/finish" with:
            | finishedById  | ${ref:id:user:john-doe} |
            | nextRoomState | VACANT                  |
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Audit not found for room"
