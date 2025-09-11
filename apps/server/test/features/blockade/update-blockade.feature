Feature: Update blockade
    As a user I want to update a blockade so that I can keep my blockade information up to date

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions       |
            | john_doe   | [blockade:update] |
            | william123 | []                |
        And a room category with name "Lush" in the company "Ecxus" exists
        And the following rooms exist in the company "Ecxus" and room category "Lush":
            | Number | Name    |
            | 1      | Suite 1 |
            | 3      | Suite 3 |
        And the following defect types exist in the company "Ecxus":
            | Name |
            | Door |
            | TV   |
        And the following defects exist in the company "Ecxus":
            | Note               | Room | Defect Type | Created by ID           | Created at           | Updated at           | Finished by ID          | Finished at          |
            | The door is broken | 1    | Door        | ${ref:id:user:john_doe} | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |                         |                      |
            | The TV is broken   | 1    | TV          | ${ref:id:user:john_doe} | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |                         |                      |
            | Finish defect      | 3    | TV          | ${ref:id:user:john_doe} | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z | ${ref:id:user:john_doe} | 2020-01-01T01:00:00Z |
        And the following blockades exist in the company "Ecxus":
            | Room | Start user ID           | Started at               | Created at               | Updated at               | Note              | Defects                           |
            | 1    | ${ref:id:user:john_doe} | 2024-01-01T01:00:00.000Z | 2024-01-01T01:00:00.000Z | 2024-01-01T01:00:00.000Z | Blockade the room | ["${ref:id:defect:Ecxus:1:Door}"] |
            | 3    | ${ref:id:user:john_doe} | 2024-01-01T01:00:00.000Z | 2024-01-01T01:00:00.000Z | 2024-01-01T01:00:00.000Z | Cleaning the room | ["${ref:id:defect:Ecxus:1:Door}"] |

    Scenario: Preventing unauthorized users from updating a blockade
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "PUT" request to "/blockade/${ref:id:blockade:Ecxus:1}" with:
            | note | Automation is off |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Updating a blockade
        Given the current date and time is "2024-01-06T04:00:00.000Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/blockade/${ref:id:blockade:Ecxus:1}" with:
            | note    | Automation is off                                               |
            | defects | ["${ref:id:defect:Ecxus:1:TV}","${ref:id:defect:Ecxus:1:Door}"] |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:blockade:Ecxus:1}",
                "companyId": "${ref:id:company:Ecxus}",
                "roomId": "${ref:id:room:Ecxus:1}",
                "note": "Automation is off",
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
                    },
                    {
                        "id": "${ref:id:defect:Ecxus:1:TV}",
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z",
                        "companyId": "${ref:id:company:Ecxus}",
                        "note": "The TV is broken",
                        "roomId": "${ref:id:room:Ecxus:1}",
                        "defectTypeId": "${ref:id:defectType:Ecxus:TV}",
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
                "updatedAt": "2024-01-06T04:00:00.000Z"
            }
            """
        And should exist blockades in the company "Ecxus" with the following data:
            | Room | Started at           | Start user ID           | Note              | Defects                                                         | Updated at               |
            | 1    | 2024-01-01T01:00:00Z | ${ref:id:user:john_doe} | Automation is off | ["${ref:id:defect:Ecxus:1:TV}","${ref:id:defect:Ecxus:1:Door}"] | 2024-01-06T04:00:00.000Z |
        And the following events in the company "Ecxus" should be recorded:
            | Type             | Timestamp                  | User ID                   |
            | BLOCKADE_CHANGED | "2024-01-06T04:00:00.000Z" | "${ref:id:user:john_doe}" |

    Scenario: Update a blockade with finished defects
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/blockade/${ref:id:blockade:Ecxus:1}" with:
            | defects | ["${ref:id:defect:Ecxus:3:TV}"] |
        Then I should receive a precondition failed error with message "A blockade cannot be performed with finished defects."

    Scenario Outline: Updating a blockade with invalid information
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/blockade/${ref:id:blockade:Ecxus:1}" with:
            | <Field> | <Value> |
        Then I should receive an invalid input error on "<Field Error>" with reason "<Reason>"

        Examples:
            | Field   | Field Error | Value            | Reason                                      |
            | note    | note        |                  | Expected string, received null              |
            | note    | note        | ""               | String must contain at least 1 character(s) |
            | note    | note        | true             | Expected string, received boolean           |
            | note    | note        | 1                | Expected string, received number            |
            | defects | defects     | ""               | Expected array, received string             |
            | defects | defects     | 188888888888     | Expected array, received number             |
            | defects | defects     | true             | Expected array, received boolean            |
            | defects | defects.0   | ["188888888888"] | Malformed ID. Expected a valid entity ID.   |
            | defects | defects     | []               | Array must contain at least 1 element(s)    |

    Scenario: Updating a blockade that does not exist
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            7f3c4fbe-bbb4-4c32-8cce-a68f3c992839
            """
        When I send a "PUT" request to "/blockade/${ref:var:unknown-id}" with:
            | note | Automation is off |
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Blockade not found"
