Feature: Update room category
    As a user, I want to update a room category so that I can keep my categories up to date.

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions            |
            | john_doe   | [room-category:update] |
            | william123 | []                     |
        And the following room categories exist in the company "Ecxus":
            | Name   | Acronym | Guest count | Created at               | Updated at               |
            | LUSH   | C1      | 1           | 2024-03-06T03:00:00.000Z | 2024-03-06T03:00:00.000Z |
            | BALI   | C2      | 2           | 2024-03-06T02:00:00.000Z | 2024-03-06T02:00:00.000Z |
            | VANDAL | C3      | 3           | 2024-03-06T01:00:00.000Z | 2024-03-06T01:00:00.000Z |

    Scenario: Preventing unauthorized users from updating a room category
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "PUT" request to "/room-category/${ref:id:roomCategory:Ecxus:LUSH}" with:
            | name       | LUSH updated |
            | acronym    | xx           |
            | guestCount | 10           |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Updating a room category
        Given the current date and time is "2024-03-06T04:00:00.000Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/room-category/${ref:id:roomCategory:Ecxus:LUSH}" with:
            | name       | LUSH updated |
            | acronym    | xx           |
            | guestCount | 10           |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:roomCategory:Ecxus:LUSH}",
                "companyId": "${ref:id:company:Ecxus}",
                "name": "LUSH updated",
                "acronym": "XX",
                "guestCount": 10,
                "createdAt": "2024-03-06T03:00:00.000Z",
                "updatedAt": "2024-03-06T04:00:00.000Z"
            }
            """
        And should exist room categories in the company "Ecxus" with the following data:
            | Name         | Acronym | Guest count | Created at               | Updated at               |
            | LUSH updated | XX      | 10          | 2024-03-06T03:00:00.000Z | 2024-03-06T04:00:00.000Z |
            | BALI         | C2      | 2           | 2024-03-06T02:00:00.000Z | 2024-03-06T02:00:00.000Z |
            | VANDAL       | C3      | 3           | 2024-03-06T01:00:00.000Z | 2024-03-06T01:00:00.000Z |
        And the following events in the company "Ecxus" should be recorded:
            | Type                  | Timestamp                  | User ID                   |
            | ROOM_CATEGORY_CHANGED | "2024-03-06T04:00:00.000Z" | "${ref:id:user:john_doe}" |

    Scenario Outline: Updating a room category with invalid information
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/room-category/${ref:id:roomCategory:Ecxus:LUSH}" with:
            | <Field> | <Value> |
        Then I should receive an invalid input error on "<Field>" with reason "<Reason>"

        Examples:
            | Field      | Value | Reason                                      |
            | name       | ""    | String must contain at least 1 character(s) |
            | name       |       | Expected string, received null              |
            | acronym    |       | Expected string, received null              |
            | acronym    | ""    | String must contain at least 1 character(s) |
            | acronym    | "ABC" | String must contain at most 2 character(s)  |
            | guestCount |       | Expected number, received null              |
            | guestCount | 0     | Number must be greater than 0               |
            | guestCount | -1    | Number must be greater than 0               |
