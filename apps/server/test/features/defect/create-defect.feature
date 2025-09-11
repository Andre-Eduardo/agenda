Feature: Create defect
    As a user, I want to create a defect so I can monitor room problems.

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions     |
            | john-doe   | [defect:create] |
            | william123 | []              |
        And a room category with name "Lush" in the company "Ecxus" exists
        And the following rooms exist in the company "Ecxus" and room category "Lush":
            | Number | Name    |
            | 1      | Suite 1 |
        And the following defect types exist in the company "Ecxus":
            | Name |
            | Door |

    Scenario: Preventing unauthorized users from creating a defect
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "POST" request to "/defect" with:
            | note         | The door is broken              |
            | roomId       | ${ref:id:room:Ecxus:1}          |
            | defectTypeId | ${ref:id:defectType:Ecxus:Door} |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Creating a defect
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john-doe" in the company "Ecxus"
        When I send a "POST" request to "/defect" with:
            | note         | The door is broken              |
            | roomId       | ${ref:id:room:Ecxus:1}          |
            | defectTypeId | ${ref:id:defectType:Ecxus:Door} |
        Then the request should succeed with a 201 status code
        And the response should match:
            """YAML
            {
                "id": _.isEntityId,
                "companyId": "${ref:id:company:Ecxus}",
                "note": "The door is broken",
                "roomId": "${ref:id:room:Ecxus:1}",
                "defectTypeId": "${ref:id:defectType:Ecxus:Door}",
                "createdById": "${ref:id:user:john-doe}",
                "finishedById": null,
                "finishedAt": null,
                "createdAt": "2024-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T01:00:00.000Z"
            }
            """
        And should exist defects in the company "Ecxus" with the following data:
            | Note               | Room | Defect Type | Created By ID           |
            | The door is broken | 1    | Door        | ${ref:id:user:john-doe} |
        And the following events in the company "Ecxus" should be recorded:
            | Type           | Timestamp              | User ID                   |
            | DEFECT_CREATED | "2024-01-01T01:00:00Z" | "${ref:id:user:john-doe}" |

    Scenario Outline: Choosing an invalid note
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "POST" request to "/defect" with:
            | note         | <Note>                          |
            | roomId       | ${ref:id:room:Ecxus:1}          |
            | defectTypeId | ${ref:id:defectType:Ecxus:Door} |
        Then I should receive an invalid input error on "note" with reason "<Reason>"

        Examples:
            | Note | Reason                                      |
            | 0    | Expected string, received number            |
            | true | Expected string, received boolean           |
            | ""   | String must contain at least 1 character(s) |

    Scenario Outline: Choosing an invalid room ID
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "POST" request to "/defect" with:
            | note         | The door is broken              |
            | roomId       | <Room ID>                       |
            | defectTypeId | ${ref:id:defectType:Ecxus:Door} |
        Then I should receive an invalid input error on "roomId" with reason "<Reason>"

        Examples:
            | Room ID           | Reason                                    |
            | ""                | Malformed ID. Expected a valid entity ID. |
            | "188.888.888.888" | Malformed ID. Expected a valid entity ID. |
            | 188888888888      | Expected string, received number          |
            | true              | Expected string, received boolean         |

    Scenario Outline: Choosing an invalid defect type ID
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "POST" request to "/defect" with:
            | note         | The door is broken     |
            | roomId       | ${ref:id:room:Ecxus:1} |
            | defectTypeId | <Defect Type ID>       |
        Then I should receive an invalid input error on "defectTypeId" with reason "<Reason>"

        Examples:
            | Defect Type ID    | Reason                                    |
            | ""                | Malformed ID. Expected a valid entity ID. |
            | "188.888.888.888" | Malformed ID. Expected a valid entity ID. |
            | 188888888888      | Expected string, received number          |
            | true              | Expected string, received boolean         |
