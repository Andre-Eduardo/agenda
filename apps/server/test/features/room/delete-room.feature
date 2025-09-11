Feature: Delete room
    As a user I want to delete a room so that I can remove it from the system

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions   |
            | john_doe   | [room:delete] |
            | william123 | []            |
        And a room category with name "Lush" in the company "Ecxus" exists
        And the following rooms exist in the company "Ecxus" and room category "Lush":
            | Number | Name    |
            | 1      | Suite 1 |
            | 2      | Suite 2 |
            | 3      | Suite 3 |

    Scenario: Preventing unauthorized users from deleting a room
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "DELETE" request to "/room/${ref:id:room:Ecxus:1}"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Deleting a room
        Given the current date and time is "2024-01-01T12:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "DELETE" request to "/room/${ref:id:room:Ecxus:1}"
        Then the request should succeed with a 200 status code
        And the following rooms in the company "Ecxus" should exist:
            | Number | Name    |
            | 2      | Suite 2 |
            | 3      | Suite 3 |
        And the following events in the company "Ecxus" should be recorded:
            | Type         | Timestamp              | User ID                   |
            | ROOM_DELETED | "2024-01-01T12:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario: Deleting a room that does not exist
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            b937e300-3364-4c7d-b6ed-675deea6e89e
            """
        When I send a "DELETE" request to "/room/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Room not found"
