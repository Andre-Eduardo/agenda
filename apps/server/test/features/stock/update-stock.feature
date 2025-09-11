Feature: Update stock
    As a user, I want to update a stock so that I can keep my stock information up to date

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions    |
            | john-doe   | [stock:update] |
            | william123 | []             |
        And a room category with name "Lush" in the company "Ecxus" exists
        And the following rooms exist in the company "Ecxus" and room category "Lush":
            | Number | Name    |
            | 1      | Suite 1 |
            | 2      | Suite 2 |
        And the following stocks exist in the company "Ecxus":
            | type | Created By ID           |
            | MAIN | ${ref:id:user:john-doe} |
        And the following stocks exist in the company "Ecxus":
            | Name | Room number | Type  | Parent ID                       | Created by ID           | Created at               | Updated at               |
            |      | 1           | ROOM  | ${ref:id:stock:Ecxus:main:MAIN} | ${ref:id:user:john-doe} | 2020-01-01T01:00:00.000Z | 2020-01-01T01:00:00.000Z |
            |      | 2           | ROOM  | ${ref:id:stock:Ecxus:main:MAIN} | ${ref:id:user:john-doe} | 2020-01-01T01:00:00.000Z | 2020-01-01T01:00:00.000Z |
            | Main |             | OTHER | ${ref:id:stock:Ecxus:main:MAIN} | ${ref:id:user:john-doe} | 2020-01-01T01:00:00.000Z | 2020-01-01T01:00:00.000Z |

    Scenario: Preventing unauthorized users from updating a stock
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "PUT" request to "/stock/${ref:id:stock:Ecxus:room:1}" with:
            | roomId | ${ref:id:room:Ecxus:2} |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Updating a stock
        Given the current date and time is "2024-01-06T04:00:00.000Z"
        And I am signed in as "john-doe" in the company "Ecxus"
        When I send a "PUT" request to "/stock/${ref:id:stock:Ecxus:other:Main}" with:
            | name | New Stock |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:stock:Ecxus:other:Main}",
                "companyId": "${ref:id:company:Ecxus}",
                "name": "New Stock",
                "roomId": null,
                "type": "OTHER",
                "parentId": "${ref:id:stock:Ecxus:main:MAIN}",
                "createdAt": "2020-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-06T04:00:00.000Z"
            }
            """
        And should exist stocks in the company "Ecxus" with the following data:
            | Name      | Room | type  | Parent ID                       | Created by ID           |
            | New Stock |      | OTHER | ${ref:id:stock:Ecxus:main:MAIN} | ${ref:id:user:john-doe} |
        And the following events in the company "Ecxus" should be recorded:
            | Type          | Timestamp                | User ID                 |
            | STOCK_CHANGED | 2024-01-06T04:00:00.000Z | ${ref:id:user:john-doe} |

    Scenario Outline: Updating a stock with invalid information
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "PUT" request to "/stock/${ref:id:stock:Ecxus:room:1}" with:
            | <Field> | <Value> |
        Then I should receive an invalid input error on "<Field>" with reason "<Reason>"

        Examples:
            | Field | Value | Reason                                      |
            | name  | ""    | String must contain at least 1 character(s) |
            | name  | 1     | Expected string, received number            |
            | name  | true  | Expected string, received boolean           |

    Scenario: Updating a stock that does not exist
        Given I am signed in as "john-doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            7f3c4fbe-bbb4-4c32-8cce-a68f3c992839
            """
        When I send a "PUT" request to "/stock/${ref:var:unknown-id}" with:
            | name | New Stock |
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Stock not found"
