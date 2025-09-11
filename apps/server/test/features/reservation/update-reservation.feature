Feature: Update reservation
    As a user, I want to update a reservation so that I can keep my reservations up to date.

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User     | Permissions          |
            | john_doe | [reservation:update] |
            | anaa123  | []                   |
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
            | Room number | Room category name | Booked by               | Booked for                           | Check-in             | Created at           | Updated at           |
            | 123         |                    | ${ref:id:user:john_doe} | ${ref:id:customer:Ecxus:10000000001} | 2023-03-03T19:30:00Z | 2023-03-03T05:00:00Z | 2023-03-03T05:00:00Z |
            |             | Lush               | ${ref:id:user:john_doe} | ${ref:id:customer:Ecxus:10000000002} | 2022-02-02T13:00:00Z | 2022-02-02T05:00:00Z | 2022-02-02T05:00:00Z |
            | 789         |                    | ${ref:id:user:anaa123}  | ${ref:id:customer:Ecxus:10000000002} | 2021-01-01T23:30:00Z | 2021-01-01T05:00:00Z | 2021-01-01T05:00:00Z |

    Scenario: Preventing unauthorized users from updating a reservation
        Given I am signed in as "anaa123" in the company "Ecxus"
        When I send a "PUT" request to "/reservation/${ref:id:reservation:Ecxus:roomCategory:Lush}" with:
            | checkIn   | 2024-01-03T21:30:00.000Z             |
            | bookedFor | ${ref:id:customer:Ecxus:10000000001} |
            | note      | New note                             |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Updating a reservation
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/reservation/${ref:id:reservation:Ecxus:roomCategory:Lush}" with:
            | checkIn   | 2024-01-03T21:30:00.000Z             |
            | bookedFor | ${ref:id:customer:Ecxus:10000000001} |
            | note      | New note                             |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:reservation:Ecxus:roomCategory:Lush}",
                "companyId": "${ref:id:company:Ecxus}",
                "roomId": null,
                "roomCategoryId": "${ref:id:roomCategory:Ecxus:Lush}",
                "checkIn": "2024-01-03T21:30:00.000Z",
                "bookedBy": "${ref:id:user:john_doe}",
                "bookedFor": "${ref:id:customer:Ecxus:10000000001}",
                "canceledAt": null,
                "canceledBy": null,
                "canceledReason": null,
                "noShow": false,
                "note": "New note",
                "createdAt": "2022-02-02T05:00:00.000Z",
                "updatedAt": "2024-01-01T01:00:00.000Z"
            }
            """
        And should exist reservations in the company "Ecxus" with the following data:
            | Room number | Room category name | Booked by               | Booked for                           | Check-in             | Created at           | Updated at           |
            | 123         |                    | ${ref:id:user:john_doe} | ${ref:id:customer:Ecxus:10000000001} | 2023-03-03T19:30:00Z | 2023-03-03T05:00:00Z | 2023-03-03T05:00:00Z |
            |             | Lush               | ${ref:id:user:john_doe} | ${ref:id:customer:Ecxus:10000000001} | 2024-01-03T21:30:00Z | 2022-02-02T05:00:00Z | 2024-01-01T01:00:00Z |
            | 789         |                    | ${ref:id:user:anaa123}  | ${ref:id:customer:Ecxus:10000000002} | 2021-01-01T23:30:00Z | 2021-01-01T05:00:00Z | 2021-01-01T05:00:00Z |
        And the following events in the company "Ecxus" should be recorded:
            | Type                | Timestamp              | User ID                   |
            | RESERVATION_CHANGED | "2024-01-01T01:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario Outline: Updating a reservation with invalid information
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/reservation/${ref:id:reservation:Ecxus:room:123}" with:
            | <Field> | <Value> |
        Then I should receive an invalid input error on "<Field>" with reason "<Reason>"

        Examples:
            | Field   | Value                    | Reason                                                  |
            | checkIn | 2024-01-01T00:59:59.000Z | Check-in date can not be earlier than the current date. |
            | checkIn | 1                        | Expected string, received number                        |
            | checkIn |                          | Expected string, received null                          |
            | note    | 1                        | Expected string, received number                        |

    Scenario: Updating a reservation that does not exist
        Given "unknown-id" is defined as:
            """
            fe8caf84-8558-4724-9a01-3023c8293b1e
            """
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/reservation/${ref:var:unknown-id}" with:
            | note | New note |
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Reservation not found"
