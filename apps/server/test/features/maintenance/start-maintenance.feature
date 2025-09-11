Feature: Start maintenance
    As a user, I want to start maintenance to resolve room defects

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions         |
            | john_doe   | [maintenance:start] |
            | william123 | []                  |
        And a room category with name "Lush" in the company "Ecxus" exists
        And the following rooms exist in the company "Ecxus" and room category "Lush":
            | Number | Name    | State  |
            | 1      | Suite 1 | VACANT |
            | 3      | Suite 3 | VACANT |
        And the following defect types exist in the company "Ecxus":
            | Name |
            | Door |
            | TV   |
        And the following defects exist in the company "Ecxus":
            | Note               | Room | Defect Type | Created by ID           | Created at           | Updated at           | Finished by ID          | Finished at          |
            | The door is broken | 1    | Door        | ${ref:id:user:john_doe} | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |                         |                      |
            | The door is broken | 3    | Door        | ${ref:id:user:john_doe} | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |                         |                      |
            | The TV is broken   | 1    | TV          | ${ref:id:user:john_doe} | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |                         |                      |
            | Finish defect      | 3    | TV          | ${ref:id:user:john_doe} | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z | ${ref:id:user:john_doe} | 2020-01-01T01:00:00Z |

    Scenario: Preventing unauthorized users from creating a maintenance
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "POST" request to "/maintenance" with:
            | roomId  | ${ref:id:room:Ecxus:1}            |
            | note    | "Defect in the room"              |
            | defects | ["${ref:id:defect:Ecxus:1:Door}"] |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Start a maintenance
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/maintenance" with:
            | roomId  | ${ref:id:room:Ecxus:1}            |
            | note    | "Defect in the room"              |
            | defects | ["${ref:id:defect:Ecxus:1:Door}"] |
        Then the request should succeed with a 201 status code
        And the response should match:
            """YAML
            {
                "id": _.isEntityId,
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
                "finishedAt": null,
                "startedById": "${ref:id:user:john_doe}",
                "finishedById": null,
                "startedAt": "2024-01-01T01:00:00.000Z",
                "createdAt": "2024-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T01:00:00.000Z"
            }
            """
        And should exist maintenances in the company "Ecxus" with the following data:
            | Room | Started at           | Start user ID           | Note               | Defects                           |
            | 1    | 2024-01-01T01:00:00Z | ${ref:id:user:john_doe} | Defect in the room | ["${ref:id:defect:Ecxus:1:Door}"] |
        And should exist rooms in the company "Ecxus" with the following data:
            | Number | Status      |
            | 1      | MAINTENANCE |
        And the following events in the company "Ecxus" should be recorded:
            | Type                | Timestamp              | User ID                   |
            | MAINTENANCE_CREATED | "2024-01-01T01:00:00Z" | "${ref:id:user:john_doe}" |
            | ROOM_STATE_CHANGED  | "2024-01-01T01:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario: Starting maintenance on an invalid room
        Given I am signed in as "john_doe" in the company "Ecxus"
        And the following maintenances exist in the company "Ecxus":
            | Room | Start user ID           | Started at               | Created at               | Updated at               | Note               | Defects                           |
            | 3    | ${ref:id:user:john_doe} | 2024-01-01T01:00:00.000Z | 2024-01-01T01:00:00.000Z | 2024-01-01T01:00:00.000Z | Defect in the room | ["${ref:id:defect:Ecxus:1:Door}"] |
        When I send a "POST" request to "/maintenance" with:
            | roomId  | ${ref:id:room:Ecxus:3}            |
            | note    | "Defect in the room"              |
            | defects | ["${ref:id:defect:Ecxus:3:Door}"] |
        Then I should receive a precondition failed error with message "There is already maintenance in this room."

    Scenario: Starting maintenance with finished defects
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/maintenance" with:
            | roomId  | ${ref:id:room:Ecxus:3}          |
            | note    | "Defect in the room"            |
            | defects | ["${ref:id:defect:Ecxus:3:TV}"] |
        Then I should receive a precondition failed error with message "A maintenance cannot be performed with finished defects."

    Scenario Outline: Choosing an invalid room ID
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/maintenance" with:
            | roomId | <Room ID> |
        Then I should receive an invalid input error on "roomId" with reason "<Reason>"

        Examples:
            | Room ID           | Reason                                    |
            | ""                | Malformed ID. Expected a valid entity ID. |
            | "188.888.888.888" | Malformed ID. Expected a valid entity ID. |
            | 188888888888      | Expected string, received number          |
            | true              | Expected string, received boolean         |

    Scenario Outline: Choosing an invalid note
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/maintenance" with:
            | note | <Note> |
        Then I should receive an invalid input error on "note" with reason "<Reason>"

        Examples:
            | Note         | Reason                                      |
            | ""           | String must contain at least 1 character(s) |
            | 188888888888 | Expected string, received number            |
            | true         | Expected string, received boolean           |

    Scenario Outline: Choosing an invalid defects
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/maintenance" with:
            | <Field> | <Value> |
        Then I should receive an invalid input error on "<Field Error>" with reason "<Reason>"

        Examples:
            | Field   | Field Error | Value            | Reason                                    |
            | defects | defects     | ""               | Expected array, received string           |
            | defects | defects     | 188888888888     | Expected array, received number           |
            | defects | defects     | true             | Expected array, received boolean          |
            | defects | defects.0   | ["188888888888"] | Malformed ID. Expected a valid entity ID. |
            | defects | defects     | []               | Array must contain at least 1 element(s)  |
