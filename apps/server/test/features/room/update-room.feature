Feature: Update room
    As a user, I want to update a room so that I can keep my room information up to date.

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions   |
            | john_doe   | [room:update] |
            | william123 | []            |
        And a room category with name "Lush" in the company "Ecxus" exists
        And the following rooms exist in the company "Ecxus" and room category "Lush":
            | Number | Name    | Created at               | Updated at               |
            | 1      | Suite 1 | 2024-01-06T04:00:00.000Z | 2024-01-06T04:00:00.000Z |
            | 2      | Suite 2 | 2024-01-06T04:00:00.000Z | 2024-01-06T04:00:00.000Z |
            | 3      | Suite 3 | 2024-01-06T04:00:00.000Z | 2024-01-06T04:00:00.000Z |

    Scenario: Preventing unauthorized users from updating a room
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "PUT" request to "/room/${ref:id:room:Ecxus:1}" with:
            | name   | nova suite |
            | number | 1000       |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Updating a room
        Given the current date and time is "2024-01-06T04:00:00.000Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/room/${ref:id:room:Ecxus:1}" with:
            | name   | nova suite |
            | number | 1000       |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:room:Ecxus:1}",
                "companyId": "${ref:id:company:Ecxus}",
                "categoryId": "${ref:id:roomCategory:Ecxus:Lush}",
                "name": "nova suite",
                "number": 1000,
                "state": "VACANT",
                "createdAt": "2024-01-06T04:00:00.000Z",
                "updatedAt": "2024-01-06T04:00:00.000Z"
            }
            """
        And should exist rooms in the company "Ecxus" with the following data:
            | Number | Name       | State  | Created At               | Updated At               |
            | 1000   | nova suite | VACANT | 2024-01-06T04:00:00.000Z | 2024-01-06T04:00:00.000Z |
            | 2      | Suite 2    | VACANT | 2024-01-06T04:00:00.000Z | 2024-01-06T04:00:00.000Z |
            | 3      | Suite 3    | VACANT | 2024-01-06T04:00:00.000Z | 2024-01-06T04:00:00.000Z |
        And the following events in the company "Ecxus" should be recorded:
            | Type         | Timestamp                  | User ID                   |
            | ROOM_CHANGED | "2024-01-06T04:00:00.000Z" | "${ref:id:user:john_doe}" |

    Scenario Outline: Updating a room with invalid information
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/room/${ref:id:room:Ecxus:1}" with:
            | <Field> | <Value> |
        Then I should receive an invalid input error on "<Field>" with reason "<Reason>"

        Examples:
            | Field  | Value | Reason                                      |
            | name   | ""    | String must contain at least 1 character(s) |
            | name   | 1     | Expected string, received number            |
            | name   | true  | Expected string, received boolean           |
            | number | 0     | Number must be greater than 0               |
            | number | -1    | Number must be greater than 0               |
            | number | 1.5   | Expected integer, received float            |
            | number | true  | Expected number, received boolean           |
            | number | "1"   | Expected number, received string            |

    Scenario: Updating a room that does not exist
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            7f3c4fbe-bbb4-4c32-8cce-a68f3c992839
            """
        When I send a "PUT" request to "/room/${ref:var:unknown-id}" with:
            | name   | nova suite |
            | number | 1000       |
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Room not found"
