Feature: Create room
    As a user, I want to create a room so I can rent it to customers.

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions   |
            | john_doe   | [room:create] |
            | william123 | []            |
        And a room category with name "Lush" in the company "Ecxus" exists

    Scenario: Preventing unauthorized users from creating a room
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "POST" request to "/room" with:
            | categoryId | ${ref:id:roomCategory:Ecxus:Lush} |
            | number     | 1                                 |
            | name       | Lush 1                            |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Creating a room
        Given the current date and time is "2024-07-03T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/room" with:
            | categoryId | ${ref:id:roomCategory:Ecxus:Lush} |
            | number     | 1                                 |
            | name       | Lush 1                            |
        Then the request should succeed with a 201 status code
        And the response should match:
            """YAML
            {
                "id": _.isEntityId,
                "companyId": "${ref:id:company:Ecxus}",
                "categoryId": "${ref:id:roomCategory:Ecxus:Lush}",
                "number": 1,
                "name": "Lush 1",
                "state": "VACANT",
                "createdAt": "2024-07-03T01:00:00.000Z",
                "updatedAt": "2024-07-03T01:00:00.000Z"
            }
            """
        And should exist rooms in the company "Ecxus" with the following data:
            | Number | Name   |
            | 1      | Lush 1 |
        And the following events in the company "Ecxus" should be recorded:
            | Type         | Timestamp              | User ID                   |
            | ROOM_CREATED | "2024-07-03T01:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario Outline: Choosing an invalid number
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/room" with:
            | categoryId | ${ref:id:roomCategory:Ecxus:Lush} |
            | number     | <Number>                          |
        Then I should receive an invalid input error on "number" with reason "<Reason>"

        Examples:
            | Number | Reason                            |
            |        | Expected number, received null    |
            | 0      | Number must be greater than 0     |
            | "Ap 1" | Expected number, received string  |
            | true   | Expected number, received boolean |

    Scenario Outline: Choosing an invalid name
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/room" with:
            | categoryId | ${ref:id:roomCategory:Ecxus:Lush} |
            | number     | 1                                 |
            | name       | <Name>                            |
        Then I should receive an invalid input error on "name" with reason "<Reason>"

        Examples:
            | Name | Reason                                      |
            | ""   | String must contain at least 1 character(s) |
            | 1    | Expected string, received number            |
            | true | Expected string, received boolean           |

    Scenario: Choosing a number already in use by another room
        Given I am signed in as "john_doe" in the company "Ecxus"
        And the following rooms exist in the company "Ecxus" and room category "Lush":
            | Number |
            | 1      |
        When I send a "POST" request to "/room" with:
            | categoryId | ${ref:id:roomCategory:Ecxus:Lush} |
            | number     | 1                                 |
        Then I should receive a precondition failed error with message "Cannot create a room with a number already in use."
