Feature: Update service
    As a user I want to update a service so that I can keep my service information up to date

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions      |
            | john-doe   | [service:update] |
            | william123 | []               |
        And a service category with name "Maintenance" in the company "Ecxus" exists
        And the following services exist in the company "Ecxus" and service category "Maintenance":
            | Code | Name       | Price | Created at           | Updated at           |
            | 1    | Cleaning   | 100   | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | 2    | Automation | 250   | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |

    Scenario: Preventing unauthorized users from updating a service
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "PUT" request to "/service/${ref:id:service:Ecxus:1}" with:
            | name  | Cleaning |
            | price | 120      |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Updating a service
        Given the current date and time is "2024-01-06T04:00:00.000Z"
        And I am signed in as "john-doe" in the company "Ecxus"
        When I send a "PUT" request to "/service/${ref:id:service:Ecxus:1}" with:
            | name  | Cleaning |
            | price | 120      |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:service:Ecxus:1}",
                "companyId": "${ref:id:company:Ecxus}",
                "categoryId": "${ref:id:serviceCategory:Ecxus:Maintenance}",
                "code": 1,
                "name": "Cleaning",
                "price": 120,
                "createdAt": "2020-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-06T04:00:00.000Z"
            }
            """
        And should exist services in the company "Ecxus" with the following data:
            | Code | Name       | Price |
            | 1    | Cleaning   | 120   |
            | 2    | Automation | 250   |
        And the following events in the company "Ecxus" should be recorded:
            | Type            | Timestamp              | User ID                   |
            | SERVICE_CHANGED | "2024-01-06T04:00:00Z" | "${ref:id:user:john-doe}" |

    Scenario: Updating a name already in use by another service
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "PUT" request to "/service/${ref:id:service:Ecxus:1}" with:
            | name | Automation |
        Then I should receive a precondition failed error with message "Cannot update service with a name already in use."

    Scenario: Updating a code already in use by another service
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "PUT" request to "/service/${ref:id:service:Ecxus:2}" with:
            | code | 1 |
        Then I should receive a precondition failed error with message "Cannot update a service with a code already in use."

    Scenario Outline: Updating a service with invalid information
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "PUT" request to "/service/${ref:id:service:Ecxus:1}" with:
            | <Field> | <Value> |
        Then I should receive an invalid input error on "<Field>" with reason "<Reason>"

        Examples:
            | Field | Value | Reason                                      |
            | code  |       | Expected number, received null              |
            | code  | 0     | Number must be greater than 0               |
            | code  | true  | Expected number, received boolean           |
            | code  | "S1"  | Expected number, received string            |
            | name  | ""    | String must contain at least 1 character(s) |
            | name  | 1     | Expected string, received number            |
            | name  | true  | Expected string, received boolean           |
            | price | -1    | Number must be greater than or equal to 0   |
            | price | true  | Expected number, received boolean           |
            | price | "1"   | Expected number, received string            |

    Scenario: Updating a service that does not exist
        Given I am signed in as "john-doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            7f3c4fbe-bbb4-4c32-8cce-a68f3c992839
            """
        When I send a "PUT" request to "/service/${ref:var:unknown-id}" with:
            | name  | Cleaning |
            | price | 100      |
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Service not found"
