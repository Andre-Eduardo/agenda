Feature: Create stock
    As a user, I want to create a stock so that I can control the existing quantity of products

    Background:
        Given a company with name "Ecxus" exists
        And the following users exist:
            | Username | Global role |
            | john_doe | OWNER       |
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions    |
            | john-doe   | [stock:create] |
            | william123 | []             |
        And a room category with name "Lush" in the company "Ecxus" exists
        And the following rooms exist in the company "Ecxus" and room category "Lush":
            | Number |
            | 1      |
        And the following stocks exist in the company "Ecxus":
            | type | Created By ID           |
            | MAIN | ${ref:id:user:john-doe} |

    Scenario: Preventing unauthorized users from creating a stock
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "POST" request to "/stock" with:
            | roomId   | ${ref:id:room:Ecxus:1}          |
            | type     | ROOM                            |
            | parentId | ${ref:id:stock:Ecxus:main:MAIN} |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario Outline: Creating a stock
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john-doe" in the company "Ecxus"
        When I send a "POST" request to "/stock" with:
            | name     | <Name>                          |
            | roomId   | <Room ID>                       |
            | type     | <Type>                          |
            | parentId | ${ref:id:stock:Ecxus:main:MAIN} |
        Then the request should succeed with a 201 status code
        And the response should match:
            """YAML
            {
                "id": _.isEntityId,
                "companyId": "${ref:id:company:Ecxus}",
                "type": <Type>,
                "name": <Name>,
                "roomId": <Room ID>,
                "parentId": "${ref:id:stock:Ecxus:main:MAIN}",
                "createdAt": "2024-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T01:00:00.000Z"
            }
            """
        And should exist stocks in the company "Ecxus" with the following data:
            | Name   | Room ID   | Type   | Created By ID           |
            | <Name> | <Room ID> | <Type> | ${ref:id:user:john-doe} |
        And the following events in the company "Ecxus" should be recorded:
            | Type          | Timestamp            | User ID                 |
            | STOCK_CREATED | 2024-01-01T01:00:00Z | ${ref:id:user:john-doe} |

        Examples:
            | Name      | Room ID                  | Type      |
            | "Hallway" | null                     | "HALLWAY" |
            | null      | "${ref:id:room:Ecxus:1}" | "ROOM"    |
            | "Other"   | null                     | "OTHER"   |

    Scenario: Creating a main stock when the company was created
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe"
        When I send a "POST" request to "/company" with:
            | name | Test |
        Then a company with name "Test" should exist
        And the following events should be recorded:
            | Type            | Timestamp            | User ID                 |
            | COMPANY_CREATED | 2024-01-01T01:00:00Z | ${ref:id:user:john_doe} |
            | STOCK_CREATED   | 2024-01-01T01:00:00Z | ${ref:id:user:john_doe} |
        And the following stocks in the company "Test" should exist:
            | Type | Created By ID           |
            | MAIN | ${ref:id:user:john_doe} |

    Scenario Outline: Choosing an invalid stock name
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "POST" request to "/stock" with:
            | name     | <Name>                          |
            | roomId   | ${ref:id:room:Ecxus:1}          |
            | type     | OTHER                           |
            | parentId | ${ref:id:stock:Ecxus:main:MAIN} |
        Then I should receive an invalid input error on "name" with reason "<Reason>"

        Examples:
            | Name | Reason                                      |
            | 0    | Expected string, received number            |
            | true | Expected string, received boolean           |
            | ""   | String must contain at least 1 character(s) |

    Scenario Outline: Choosing an invalid room ID
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "POST" request to "/stock" with:
            | roomId | <Room ID> |
            | type   | ROOM      |
        Then I should receive an invalid input error on "roomId" with reason "<Reason>"

        Examples:
            | Room ID           | Reason                                    |
            | ""                | Malformed ID. Expected a valid entity ID. |
            | "188.888.888.888" | Malformed ID. Expected a valid entity ID. |
            | 188888888888      | Expected string, received number          |
            | true              | Expected string, received boolean         |

    Scenario Outline: Choosing an invalid type
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "POST" request to "/stock" with:
            | name | stock  |
            | type | <Type> |
        Then I should receive an invalid input error on "type" with reason "<Reason>"

        Examples:
            | Type | Reason                                                                                           |
            | aaaa | Invalid enum value. Expected \'ROOM\' \| \'HALLWAY\' \| \'OTHER\' \| \'MAIN\', received \'aaaa\' |
            | 1    | Invalid enum value. Expected \'ROOM\' \| \'HALLWAY\' \| \'OTHER\' \| \'MAIN\', received \'1\'    |
            | true | Expected \'ROOM\' \| \'HALLWAY\' \| \'OTHER\' \| \'MAIN\', received boolean                      |
