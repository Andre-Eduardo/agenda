Feature: Create service category
    As a user, I want to create a service category so that I can organize my services.

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions               |
            | john-doe   | [service-category:create] |
            | william123 | []                        |

    Scenario: Preventing unauthorized users from creating a service category
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "POST" request to "/service-category" with:
            | name | Maintenance |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Creating a service category
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john-doe" in the company "Ecxus"
        When I send a "POST" request to "/service-category" with:
            | name | Maintenance |
        Then the request should succeed with a 201 status code
        And the response should match:
            """YAML
            {
                "id": _.isEntityId,
                "companyId": "${ref:id:company:Ecxus}",
                "name": "Maintenance",
                "createdAt": "2024-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T01:00:00.000Z"
            }
            """
        And should exist service categories in the company "Ecxus" with the following data:
            | Name        |
            | Maintenance |
        And the following events in the company "Ecxus" should be recorded:
            | Type                     | Timestamp              | User ID                   |
            | SERVICE_CATEGORY_CREATED | "2024-01-01T01:00:00Z" | "${ref:id:user:john-doe}" |

    Scenario Outline: Choosing an invalid name
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "POST" request to "/service-category" with:
            | name | <Name> |
        Then I should receive an invalid input error on "name" with reason "<Reason>"

        Examples:
            | Name | Reason                                      |
            | ""   | String must contain at least 1 character(s) |
            |      | Expected string, received null              |
            | 1    | Expected string, received number            |
            | true | Expected string, received boolean           |
