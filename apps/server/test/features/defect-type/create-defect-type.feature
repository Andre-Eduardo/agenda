Feature: Create defect type
    As a user, I want to create a defect type to register a defect.

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions          |
            | john_doe   | [defect-type:create] |
            | william123 | []                   |

    Scenario: Preventing unauthorized users from creating a defect type
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "POST" request to "/defect-type" with:
            | name | Automation |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Creating a defect type
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/defect-type" with:
            | name | Automation |
        Then the request should succeed with a 201 status code
        And the response should match:
            """YAML
            {
                "id": _.isEntityId,
                "companyId": "${ref:id:company:Ecxus}",
                "name": "Automation",
                "createdAt": "2024-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T01:00:00.000Z"
            }
            """
        And should exist defect types in the company "Ecxus" with the following data:
            | Name       |
            | Automation |
        And the following events in the company "Ecxus" should be recorded:
            | Type                | Timestamp              | User ID                   |
            | DEFECT_TYPE_CREATED | "2024-01-01T01:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario Outline: Choosing an invalid name
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/defect-type" with:
            | name | <Name> |
        Then I should receive an invalid input error on "name" with reason "<Reason>"

        Examples:
            | Name | Reason                                      |
            | ""   | String must contain at least 1 character(s) |
            |      | Expected string, received null              |
            | 1    | Expected string, received number            |
            | true | Expected string, received boolean           |

    Scenario: Choosing a name already in use by another defect type
        Given I am signed in as "john_doe" in the company "Ecxus"
        And the following defect types exist in the company "Ecxus":
            | Name       |
            | Electrical |
        When I send a "POST" request to "/defect-type" with:
            | name | Electrical |
        Then I should receive a precondition failed error with message "Cannot create a defect type with a name already in use."
