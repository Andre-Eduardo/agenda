Feature: Reject an inspection
    As a user, I want to reject an inspection if a room has not been well cleaned to allow the room to be cleaned again

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User     | Permissions         |
            | john-doe | [inspection:reject] |
            | anaa123  | []                  |
        And a room category with name "Lush" in the company "Ecxus" exists
        And the following rooms exist in the company "Ecxus" and room category "Lush":
            | Number | State      |
            | 123    | VACANT     |
            | 456    | INSPECTION |
            | 789    | INSPECTION |
        And the following inspections exist in the company "Ecxus":
            | Room | Start user ID           | End user ID             | Started at           | Finished at          | End Reason | Created at           | Updated at           |
            | 123  | ${ref:id:user:john-doe} | ${ref:id:user:john-doe} | 2020-01-01T01:00:00Z | 2024-01-01T04:00:00Z | APPROVED   | 2020-01-01T01:00:00Z | 2024-01-01T04:00:00Z |
            | 456  | ${ref:id:user:john-doe} |                         | 2020-01-01T02:00:00Z |                      |            | 2020-01-01T02:00:00Z | 2020-01-01T02:00:00Z |
            | 789  | ${ref:id:user:john-doe} |                         | 2020-01-01T03:00:00Z |                      |            | 2020-01-01T03:00:00Z | 2020-01-01T03:00:00Z |

    Scenario: Preventing unauthorized users from rejecting an inspection
        Given I am signed in as "anaa123" in the company "Ecxus"
        When I send a "PATCH" request to "/inspection/room/${ref:id:room:Ecxus:456}/reject" with:
            | finishedById | ${ref:id:user:john-doe} |
            | note         | Inspection rejected     |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Rejecting an inspection
        Given the current date and time is "2024-01-01T05:00:00Z"
        And I am signed in as "john-doe" in the company "Ecxus"
        When I send a "PATCH" request to "/inspection/room/${ref:id:room:Ecxus:456}/reject" with:
            | finishedById | ${ref:id:user:john-doe} |
            | note         | Inspection rejected     |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:inspection:Ecxus:456}",
                "companyId": "${ref:id:company:Ecxus}",
                "roomId": "${ref:id:room:Ecxus:456}",
                "startedById": "${ref:id:user:john-doe}",
                "startedAt": "2020-01-01T02:00:00.000Z",
                "finishedById": "${ref:id:user:john-doe}",
                "finishedAt": "2024-01-01T05:00:00.000Z",
                "note": "Inspection rejected",
                "endReason": "REJECTED",
                "createdAt": "2020-01-01T02:00:00.000Z",
                "updatedAt": "2024-01-01T05:00:00.000Z"
            }
            """
        And should exist inspections in the company "Ecxus" with the following data:
            | Room | Start user ID           | End user ID             | Started at           | Finished at          | End Reason | Created at           |
            | 123  | ${ref:id:user:john-doe} | ${ref:id:user:john-doe} | 2020-01-01T01:00:00Z | 2024-01-01T04:00:00Z | APPROVED   | 2020-01-01T01:00:00Z |
            | 456  | ${ref:id:user:john-doe} | ${ref:id:user:john-doe} | 2020-01-01T02:00:00Z | 2024-01-01T05:00:00Z | REJECTED   | 2020-01-01T02:00:00Z |
            | 789  | ${ref:id:user:john-doe} |                         | 2020-01-01T03:00:00Z |                      |            | 2020-01-01T03:00:00Z |
        And should exist rooms in the company "Ecxus" with the following data:
            | Number | State      |
            | 123    | VACANT     |
            | 456    | DIRTY      |
            | 789    | INSPECTION |
        And the following events in the company "Ecxus" should be recorded:
            | Type                | Timestamp            | User ID                 |
            | INSPECTION_FINISHED | 2024-01-01T05:00:00Z | ${ref:id:user:john-doe} |
            | ROOM_STATE_CHANGED  | 2024-01-01T05:00:00Z | ${ref:id:user:john-doe} |

    Scenario Outline: Rejecting an inspection with invalid information
        Given the current date and time is "2024-01-01T05:00:00Z"
        And I am signed in as "john-doe" in the company "Ecxus"
        When I send a "PATCH" request to "/inspection/room/${ref:id:room:Ecxus:789}/reject" with:
            | <Field> | <Value> |
        Then I should receive an invalid input error on "<Field>" with reason "<Reason>"

        Examples:
            | Field        | Value             | Reason                                    |
            | finishedById | ""                | Malformed ID. Expected a valid entity ID. |
            | finishedById | "188.888.888.888" | Malformed ID. Expected a valid entity ID. |
            | finishedById | 188888888888      | Expected string, received number          |
            | finishedById | true              | Expected string, received boolean         |
            | note         | 1                 | Expected string, received number          |
            | note         | true              | Expected string, received boolean         |

    Scenario: Rejecting an inspection that does not exist
        Given I am signed in as "john-doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            b937e300-3364-4c7d-b6ed-675deea6e89e
            """
        When I send a "PATCH" request to "/inspection/room/${ref:var:unknown-id}/reject" with:
            | finishedById | ${ref:id:user:john-doe} |
            | note         | Inspection rejected     |
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Inspection not found"
