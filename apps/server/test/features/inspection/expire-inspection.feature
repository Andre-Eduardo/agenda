Feature: Expire inspection
    An inspection should be expired if it has not been approved or rejected within a certain amount of time

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User     | Permissions                           |
            | john-doe | [cleaning:finish, inspection:approve] |
            | anaa123  | []                                    |
        And a room category with name "Lush" in the company "Ecxus" exists
        And the following rooms exist in the company "Ecxus" and room category "Lush":
            | Number | State    |
            | 456    | CLEANING |
        And the following cleanings exist in the company "Ecxus":
            | Room | Start user ID           | Started at           | Created at           |
            | 456  | ${ref:id:user:john-doe} | 2024-01-01T02:00:00Z | 2024-01-01T02:00:00Z |

    Scenario: Expiring an inspection after the inspection timeout
        Given the current date and time is "2024-01-01T02:00:00Z"
        And I am signed in as "john-doe" in the company "Ecxus"
        And I send a "PATCH" request to "/cleaning/room/${ref:id:room:Ecxus:456}/finish" with:
            | id        | ${ref:id:room:Ecxus:456} |
            | endReason | FINISHED                 |
        And the request should succeed with a 200 status code
        And should exist rooms in the company "Ecxus" with the following data:
            | Number | State      |
            | 456    | INSPECTION |
        When I wait 2 hours
        And I wait 100 milliseconds for asynchronous operations to complete
        Then should exist inspections in the company "Ecxus" with the following data:
            | Room | End reason |
            | 456  | EXPIRED    |
        And the following events in the company "Ecxus" should be recorded:
            | Type                | Timestamp                | User ID                 |
            | CLEANING_FINISHED   | 2024-01-01T02:00:00Z     | ${ref:id:user:john-doe} |
            | INSPECTION_STARTED  | 2024-01-01T02:00:00Z     | ${ref:id:user:john-doe} |
            | INSPECTION_FINISHED | 2024-01-01T04:00:00.100Z |                         |
