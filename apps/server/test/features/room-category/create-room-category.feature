Feature: Create room category
    As a user, I want to create a room category so that I can organize my rooms.

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions            |
            | john_doe   | [room-category:create] |
            | william123 | []                     |

    Scenario: Preventing unauthorized users from creating a room category
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "POST" request to "/room-category" with:
            | name       | Lush |
            | acronym    | LS   |
            | guestCount | 2    |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Creating a room category
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/room-category" with:
            | name       | Lush |
            | acronym    | LS   |
            | guestCount | 2    |
        Then the request should succeed with a 201 status code
        And the response should match:
            """YAML
            {
                "id": _.isEntityId,
                "companyId": "${ref:id:company:Ecxus}",
                "name": "Lush",
                "acronym": "LS",
                "guestCount": 2,
                "createdAt": "2024-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T01:00:00.000Z"
            }
            """
        And should exist room categories in the company "Ecxus" with the following data:
            | Name | Acronym | Guest count |
            | Lush | LS      | 2           |
        And the following events in the company "Ecxus" should be recorded:
            | Type                  | Timestamp              | User ID                   |
            | ROOM_CATEGORY_CREATED | "2024-01-01T01:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario Outline: Choosing an invalid name
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/room-category" with:
            | name       | <Name> |
            | acronym    | C2     |
            | guestCount | 2      |
        Then I should receive an invalid input error on "name" with reason "<Reason>"

        Examples:
            | Name | Reason                                      |
            |      | Expected string, received null              |
            | 1    | Expected string, received number            |
            | true | Expected string, received boolean           |
            | ""   | String must contain at least 1 character(s) |

    Scenario Outline: Choosing an invalid acronym
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/room-category" with:
            | name       | BANGKOK   |
            | acronym    | <Acronym> |
            | guestCount | 2         |
        Then I should receive an invalid input error on "acronym" with reason "<Reason>"

        Examples:
            | Acronym | Reason                                      |
            |         | Expected string, received null              |
            | 1       | Expected string, received number            |
            | true    | Expected string, received boolean           |
            | ""      | String must contain at least 1 character(s) |
            | "ABC"   | String must contain at most 2 character(s)  |

    Scenario Outline: Choosing an invalid guest count
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/room-category" with:
            | name       | BALI          |
            | acronym    | BL            |
            | guestCount | <Guest count> |
        Then I should receive an invalid input error on "guestCount" with reason "<Reason>"

        Examples:
            | Guest count | Reason                            |
            |             | Expected number, received null    |
            | true        | Expected number, received boolean |
            | 0           | Number must be greater than 0     |
            | -1          | Number must be greater than 0     |
