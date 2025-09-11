Feature: Delete stock
    As a user I want to delete a stock so that I can remove it from the system

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions    |
            | john-doe   | [stock:delete] |
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
            | Name          | Room number | Type    | Parent ID                       | Created by ID           | Created at           | Updated at           |
            | Stock hallway |             | HALLWAY | ${ref:id:stock:Ecxus:main:MAIN} | ${ref:id:user:john-doe} | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            |               | 1           | ROOM    | ${ref:id:stock:Ecxus:main:MAIN} | ${ref:id:user:john-doe} | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
        And the following stocks exist in the company "Ecxus":
            | Name        | Room number | Type  | Parent ID                                   | Created by ID           | Created at           | Updated at           |
            | Other stock |             | OTHER | ${ref:id:stock:Ecxus:hallway:Stock hallway} | ${ref:id:user:john-doe} | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |

    Scenario: Preventing unauthorized users from deleting a stock
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "DELETE" request to "/stock/${ref:id:stock:Ecxus:hallway:Stock hallway}"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Deleting a stock
        Given the current date and time is "2020-01-01T01:00:00Z"
        And I am signed in as "john-doe" in the company "Ecxus"
        When I send a "DELETE" request to "/stock/${ref:id:stock:Ecxus:room:1}"
        Then the request should succeed with a 200 status code
        And the following stocks in the company "Ecxus" should exist:
            | Name          | Type    | Created By ID           |
            |               | MAIN    | ${ref:id:user:john-doe} |
            | Stock hallway | HALLWAY | ${ref:id:user:john-doe} |
            | Other stock   | OTHER   | ${ref:id:user:john-doe} |
        And the following events in the company "Ecxus" should be recorded:
            | Type          | Timestamp            | User ID                 |
            | STOCK_DELETED | 2020-01-01T01:00:00Z | ${ref:id:user:john-doe} |

    Scenario: Deleting the main stock
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "DELETE" request to "/stock/${ref:id:stock:Ecxus:main:MAIN}"
        Then I should receive a precondition failed error with message "Cannot delete the main stock."

    Scenario: Deleting a stock with children
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "DELETE" request to "/stock/${ref:id:stock:Ecxus:hallway:Stock hallway}"
        Then I should receive a precondition failed error with message "Cannot delete a stock with children."

    Scenario: Deleting a stock that does not exist
        Given I am signed in as "john-doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            b937e300-3364-4c7d-b6ed-675deea6e89e
            """
        When I send a "DELETE" request to "/stock/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Stock not found"
