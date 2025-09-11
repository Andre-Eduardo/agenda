Feature: Update service category
    As a user, I want to update a service category so that I can keep my service categories up to date.

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions               |
            | john-doe   | [service-category:update] |
            | william123 | []                        |
        And the following service categories exist in the company "Ecxus":
            | Name              | Created at               | Updated at               |
            | Technical support | 2024-03-06T03:00:00.000Z | 2024-03-06T03:00:00.000Z |
            | Maintenance       | 2024-03-06T02:00:00.000Z | 2024-03-06T02:00:00.000Z |

    Scenario: Preventing unauthorized users from updating a service category
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "PUT" request to "/service-category/${ref:id:serviceCategory:Ecxus:Maintenance}" with:
            | name | Cleaning |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Updating a service category
        Given the current date and time is "2024-03-06T04:00:00.000Z"
        And I am signed in as "john-doe" in the company "Ecxus"
        When I send a "PUT" request to "/service-category/${ref:id:serviceCategory:Ecxus:Maintenance}" with:
            | name | Preventive maintenance |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:serviceCategory:Ecxus:Maintenance}",
                "companyId": "${ref:id:company:Ecxus}",
                "name": "Preventive maintenance",
                "createdAt": "2024-03-06T02:00:00.000Z",
                "updatedAt": "2024-03-06T04:00:00.000Z"
            }
            """
        And should exist service categories in the company "Ecxus" with the following data:
            | Name                   | Created at               | Updated at               |
            | Technical support      | 2024-03-06T03:00:00.000Z | 2024-03-06T03:00:00.000Z |
            | Preventive maintenance | 2024-03-06T02:00:00.000Z | 2024-03-06T04:00:00.000Z |
        And the following events in the company "Ecxus" should be recorded:
            | Type                     | Timestamp              | User ID                   |
            | SERVICE_CATEGORY_CHANGED | "2024-03-06T04:00:00Z" | "${ref:id:user:john-doe}" |

    Scenario Outline: Updating a service category with invalid information
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "PUT" request to "/service-category/${ref:id:serviceCategory:Ecxus:Technical support}" with:
            | <Field> | <Value> |
        Then I should receive an invalid input error on "<Field>" with reason "<Reason>"

        Examples:
            | Field | Value | Reason                                      |
            | name  | ""    | String must contain at least 1 character(s) |
            | name  |       | Expected string, received null              |
