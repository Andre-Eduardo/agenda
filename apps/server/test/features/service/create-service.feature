Feature: Create service
    As a user, I want to create a service so I can sell it to customers.

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions      |
            | john-doe   | [service:create] |
            | william123 | []               |
        And a service category with name "Maintenance" in the company "Ecxus" exists

    Scenario: Preventing unauthorized users from creating a service
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "POST" request to "/service" with:
            | categoryId | ${ref:id:serviceCategory:Ecxus:Maintenance} |
            | code       | 1                                           |
            | name       | Cleaning                                    |
            | price      | 100                                         |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Creating a service
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john-doe" in the company "Ecxus"
        When I send a "POST" request to "/service" with:
            | categoryId | ${ref:id:serviceCategory:Ecxus:Maintenance} |
            | code       | 1                                           |
            | name       | Cleaning                                    |
            | price      | 100                                         |
        Then the request should succeed with a 201 status code
        And the response should match:
            """YAML
            {
                "id": _.isEntityId,
                "companyId": "${ref:id:company:Ecxus}",
                "categoryId": "${ref:id:serviceCategory:Ecxus:Maintenance}",
                "code": 1,
                "name": "Cleaning",
                "price": 100,
                "createdAt": "2024-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T01:00:00.000Z"
            }
            """
        And should exist services in the company "Ecxus" with the following data:
            | Code | Name     | Price |
            | 1    | Cleaning | 100   |
        And the following events in the company "Ecxus" should be recorded:
            | Type            | Timestamp              | User ID                   |
            | SERVICE_CREATED | "2024-01-01T01:00:00Z" | "${ref:id:user:john-doe}" |

    Scenario: Choosing a name already in use by another service
        Given I am signed in as "john-doe" in the company "Ecxus"
        And the following services exist in the company "Ecxus" and service category "Maintenance":
            | Name       | Code | Price |
            | Electrical | 1    | 26    |
        When I send a "POST" request to "/service" with:
            | categoryId | ${ref:id:serviceCategory:Ecxus:Maintenance} |
            | name       | Electrical                                  |
            | code       | 56                                          |
            | price      | 250                                         |
        Then I should receive a precondition failed error with message "Cannot create a service with a name already in use."

    Scenario: Choosing a code already in use by another service
        Given I am signed in as "john-doe" in the company "Ecxus"
        And the following services exist in the company "Ecxus" and service category "Maintenance":
            | Name       | Code | Price |
            | Electrical | 6    | 350   |
        When I send a "POST" request to "/service" with:
            | categoryId | ${ref:id:serviceCategory:Ecxus:Maintenance} |
            | name       | Automation                                  |
            | code       | 6                                           |
            | price      | 350                                         |
        Then I should receive a precondition failed error with message "Cannot create a service with a code already in use."

    Scenario Outline: Choosing an invalid code
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "POST" request to "/service" with:
            | categoryId | ${ref:id:serviceCategory:Ecxus:Maintenance} |
            | code       | <Code>                                      |
            | name       | Automation                                  |
            | price      | 250                                         |
        Then I should receive an invalid input error on "code" with reason "<Reason>"

        Examples:
            | Code | Reason                            |
            |      | Expected number, received null    |
            | 0    | Number must be greater than 0     |
            | "P1" | Expected number, received string  |
            | true | Expected number, received boolean |

    Scenario Outline: Choosing an invalid name
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "POST" request to "/service" with:
            | categoryId | ${ref:id:serviceCategory:Ecxus:Maintenance} |
            | code       | 1                                           |
            | name       | <Name>                                      |
            | price      | 100                                         |
        Then I should receive an invalid input error on "name" with reason "<Reason>"

        Examples:
            | Name | Reason                                      |
            | ""   | String must contain at least 1 character(s) |
            |      | Expected string, received null              |
            | 1    | Expected string, received number            |
            | true | Expected string, received boolean           |

    Scenario Outline: Choosing an invalid price
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "POST" request to "/service" with:
            | categoryId | ${ref:id:serviceCategory:Ecxus:Maintenance} |
            | code       | 1                                           |
            | name       | Automation                                  |
            | price      | <Price>                                     |
        Then I should receive an invalid input error on "price" with reason "<Reason>"

        Examples:
            | Price | Reason                                    |
            |       | Expected number, received null            |
            | -1    | Number must be greater than or equal to 0 |
            | "P1"  | Expected number, received string          |
            | true  | Expected number, received boolean         |
