Feature: Delete room category
    As a user, I want to delete a room category so that I can remove it from the system.

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions            |
            | john_doe   | [room-category:delete] |
            | william123 | []                     |
        And the following room categories exist in the company "Ecxus":
            | Name      | Acronym | Guest count |
            | Category1 | C1      | 2           |
            | Category2 | C2      | 2           |
            | Category3 | C3      | 2           |

    Scenario: Preventing unauthorized users from deleting a room category
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "DELETE" request to "/room-category/${ref:id:roomCategory:Ecxus:Category1}"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Deleting a room category
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "DELETE" request to "/room-category/${ref:id:roomCategory:Ecxus:Category1}"
        Then the request should succeed with a 200 status code
        And no room category with name "Category1" should exist in the company "Ecxus"
        And the following room categories in the company "Ecxus" should exist:
            | Name      | Acronym | Guest count |
            | Category2 | C2      | 2           |
            | Category3 | C3      | 2           |
        And the following events in the company "Ecxus" should be recorded:
            | Type                  | Timestamp              | User ID                   |
            | ROOM_CATEGORY_DELETED | "2024-01-01T01:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario: Deleting a non-existent room category
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            b937e300-3364-4c7d-b6ed-675deea6e89e
            """
        When I send a "DELETE" request to "/room-category/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Room category not found"
