Feature: Cancel reservation
    As a user, I want to cancel a reservation so that I can free up the room for other people.

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User     | Permissions          |
            | john_doe | [reservation:cancel] |
            | anaa123  | [reservation:create] |
        And the following customers exist in the company "Ecxus":
            | Name  | Document ID    |
            | John  | 100.000.000-01 |
            | Alice | 100.000.000-02 |
        And a room category with name "Lush" in the company "Ecxus" exists
        And the following rooms exist in the company "Ecxus" and room category "Lush":
            | Number |
            | 123    |
            | 789    |
        And the following reservations exist in the company "Ecxus":
            | Room number | Room category name | Booked by               | Booked for                           | Check-in             | Canceled at          | Created at           | Updated at           |
            | 123         |                    | ${ref:id:user:john_doe} | ${ref:id:customer:Ecxus:10000000001} | 2023-03-03T19:30:00Z | 2023-03-03T17:10:11Z | 2023-03-03T05:00:00Z | 2023-03-03T17:10:11Z |
            |             | Lush               | ${ref:id:user:john_doe} | ${ref:id:customer:Ecxus:10000000002} | 2022-02-02T13:00:00Z |                      | 2022-02-02T05:00:00Z | 2022-02-02T05:00:00Z |
            | 789         |                    | ${ref:id:user:anaa123}  | ${ref:id:customer:Ecxus:10000000002} | 2021-01-01T23:30:00Z |                      | 2021-01-01T05:00:00Z | 2021-01-01T05:00:00Z |

    Scenario: Preventing unauthorized users from canceling a reservation
        Given I am signed in as "anaa123" in the company "Ecxus"
        When I send a "PATCH" request to "/reservation/${ref:id:reservation:Ecxus:roomCategory:Lush}" with:
            | canceledReason | Reason to cancel |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Canceling a reservation
        Given the current date and time is "2024-04-04T05:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PATCH" request to "/reservation/${ref:id:reservation:Ecxus:roomCategory:Lush}" with:
            | canceledReason | Reason to cancel |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:reservation:Ecxus:roomCategory:Lush}",
                "companyId": "${ref:id:company:Ecxus}",
                "roomId": null,
                "roomCategoryId": "${ref:id:roomCategory:Ecxus:Lush}",
                "checkIn": "2022-02-02T13:00:00.000Z",
                "bookedBy": "${ref:id:user:john_doe}",
                "bookedFor": "${ref:id:customer:Ecxus:10000000002}",
                "canceledAt": "2024-04-04T05:00:00.000Z",
                "canceledBy": "${ref:id:user:john_doe}",
                "canceledReason": "Reason to cancel",
                "noShow": false,
                "note": null,
                "createdAt": "2022-02-02T05:00:00.000Z",
                "updatedAt": "2024-04-04T05:00:00.000Z"
            }
            """
        And should exist reservations in the company "Ecxus" with the following data:
            | Room number | Room category name | Booked by               | Booked for                           | Check-in             | Canceled at          | Created at           | Updated at           |
            | 123         |                    | ${ref:id:user:john_doe} | ${ref:id:customer:Ecxus:10000000001} | 2023-03-03T19:30:00Z | 2023-03-03T17:10:11Z | 2023-03-03T05:00:00Z | 2023-03-03T17:10:11Z |
            |             | Lush               | ${ref:id:user:john_doe} | ${ref:id:customer:Ecxus:10000000002} | 2022-02-02T13:00:00Z | 2024-04-04T05:00:00Z | 2022-02-02T05:00:00Z | 2024-04-04T05:00:00Z |
            | 789         |                    | ${ref:id:user:anaa123}  | ${ref:id:customer:Ecxus:10000000002} | 2021-01-01T23:30:00Z |                      | 2021-01-01T05:00:00Z | 2021-01-01T05:00:00Z |
        And the following events in the company "Ecxus" should be recorded:
            | Type                 | Timestamp              | User ID                   |
            | RESERVATION_CANCELED | "2024-04-04T05:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario: Trying to cancel an already canceled reservation
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PATCH" request to "/reservation/${ref:id:reservation:Ecxus:room:123}"
        Then I should receive a precondition failed error with message "Reservation is already canceled."

    Scenario: Canceling a reservation that does not exist
        Given "unknown-id" is defined as:
            """
            fe8caf84-8558-4724-9a01-3023c8293b1e
            """
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PATCH" request to "/reservation/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Reservation not found"
