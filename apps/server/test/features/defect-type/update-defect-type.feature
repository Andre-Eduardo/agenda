Feature: Update defect type
    As a user I want to update a defect type so that I can keep my defect type information up to date

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions          |
            | john_doe   | [defect-type:update] |
            | william123 | []                   |
        And the following defect types exist in the company "Ecxus":
            | Name       | Created at           | Updated at           |
            | Automation | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | Lighting   | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | Audio      | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |

    Scenario: Preventing unauthorized users from updating a defect type
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "PUT" request to "/defect-type/${ref:id:defectType:Ecxus:Lighting}" with:
            | name | Light |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Updating a defect type
        Given the current date and time is "2024-01-06T04:00:00.000Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/defect-type/${ref:id:defectType:Ecxus:Lighting}" with:
            | name | Light |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:defectType:Ecxus:Lighting}",
                "companyId": "${ref:id:company:Ecxus}",
                "name": "Light",
                "createdAt": "2020-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-06T04:00:00.000Z"
            }
            """
        And should exist defect types in the company "Ecxus" with the following data:
            | Name       |
            | Automation |
            | Light      |
            | Audio      |
        And the following events in the company "Ecxus" should be recorded:
            | Type                | Timestamp                  | User ID                   |
            | DEFECT_TYPE_CHANGED | "2024-01-06T04:00:00.000Z" | "${ref:id:user:john_doe}" |

    Scenario Outline: Updating a defect type with invalid information
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/defect-type/${ref:id:defectType:Ecxus:Audio}" with:
            | name | <Name> |
        Then I should receive an invalid input error on "name" with reason "<Reason>"

        Examples:
            | Name | Reason                                      |
            | ""   | String must contain at least 1 character(s) |
            |      | Expected string, received null              |
            | 1    | Expected string, received number            |
            | true | Expected string, received boolean           |

    Scenario: Updating a name already in use by another defect type
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/defect-type/${ref:id:defectType:Ecxus:Audio}" with:
            | name | Automation |
        Then I should receive a precondition failed error with message "Cannot update a defect type with a name already in use."

    Scenario: Updating a defect type that does not exist
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            7f3c4fbe-bbb4-4c32-8cce-a68f3c992839
            """
        When I send a "PUT" request to "/defect-type/${ref:var:unknown-id}" with:
            | name | Light |
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Defect type not found"
