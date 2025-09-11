Feature: Update defect
    As a user I want to update a defect so that I can keep my defect information up to date

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions     |
            | john-doe   | [defect:update] |
            | william123 | []              |
        And a room category with name "Lush" in the company "Ecxus" exists
        And the following rooms exist in the company "Ecxus" and room category "Lush":
            | Number | Name    |
            | 1      | Suite 1 |
            | 2      | Suite 2 |
        And the following defect types exist in the company "Ecxus":
            | Name   |
            | Door   |
            | TV     |
            | Fridge |
        And the following defects exist in the company "Ecxus":
            | Note               | Room | Defect Type | Created by ID           | Created at           | Updated at           |
            | The door is broken | 1    | Door        | ${ref:id:user:john-doe} | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | The TV is broken   | 1    | TV          | ${ref:id:user:john-doe} | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |

    Scenario: Preventing unauthorized users from updating a defect
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "PUT" request to "/defect/${ref:id:defect:Ecxus:1:TV}" with:
            | note | The TV is missing |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Updating a defect
        Given the current date and time is "2024-01-06T04:00:00.000Z"
        And I am signed in as "john-doe" in the company "Ecxus"
        When I send a "PUT" request to "/defect/${ref:id:defect:Ecxus:1:TV}" with:
            | note         | The fridge is broken              |
            | roomId       | ${ref:id:room:Ecxus:2}            |
            | defectTypeId | ${ref:id:defectType:Ecxus:Fridge} |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:defect:Ecxus:1:TV}",
                "companyId": "${ref:id:company:Ecxus}",
                "note": "The fridge is broken",
                "roomId": "${ref:id:room:Ecxus:2}",
                "defectTypeId": "${ref:id:defectType:Ecxus:Fridge}",
                "createdById": "${ref:id:user:john-doe}",
                "finishedById": null,
                "finishedAt": null,
                "createdAt": "2020-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-06T04:00:00.000Z"
            }
            """
        And should exist defects in the company "Ecxus" with the following data:
            | Note                 | Room | Defect Type | Created by ID           |
            | The door is broken   | 1    | Door        | ${ref:id:user:john-doe} |
            | The fridge is broken | 2    | Fridge      | ${ref:id:user:john-doe} |
        And the following events in the company "Ecxus" should be recorded:
            | Type           | Timestamp              | User ID                   |
            | DEFECT_CHANGED | "2024-01-06T04:00:00Z" | "${ref:id:user:john-doe}" |

    Scenario Outline: Updating a defect with invalid information
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "PUT" request to "/defect/${ref:id:defect:Ecxus:1:Door}" with:
            | <Field> | <Value> |
        Then I should receive an invalid input error on "<Field>" with reason "<Reason>"

        Examples:
            | Field        | Value             | Reason                                      |
            | note         | ""                | String must contain at least 1 character(s) |
            | note         | 1                 | Expected string, received number            |
            | note         | true              | Expected string, received boolean           |
            | roomId       | ""                | Malformed ID. Expected a valid entity ID.   |
            | roomId       | true              | Expected string, received boolean           |
            | roomId       | "188.888.888.888" | Malformed ID. Expected a valid entity ID.   |
            | roomId       | 188888888888      | Expected string, received number            |
            | defectTypeId | ""                | Malformed ID. Expected a valid entity ID.   |
            | defectTypeId | true              | Expected string, received boolean           |
            | defectTypeId | "188.888.888.888" | Malformed ID. Expected a valid entity ID.   |
            | defectTypeId | 188888888888      | Expected string, received number            |

    Scenario: Updating a defect that does not exist
        Given I am signed in as "john-doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            7f3c4fbe-bbb4-4c32-8cce-a68f3c992839
            """
        When I send a "PUT" request to "/defect/${ref:var:unknown-id}" with:
            | note         | The door is missing             |
            | roomId       | ${ref:id:room:Ecxus:1}          |
            | defectTypeId | ${ref:id:defectType:Ecxus:Door} |
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Defect not found"
