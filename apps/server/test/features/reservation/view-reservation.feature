Feature: View reservation
    As a user, I want to find a reservation and view its details

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User     | Permissions        |
            | john_doe | [reservation:view] |
            | anaa123  | []                 |
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

    Scenario: Preventing unauthorized users from viewing reservations
        Given I am signed in as "anaa123" in the company "Ecxus"
        When I send a "GET" request to "/reservation"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Viewing reservations
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/reservation" with the query:
            | pagination.limit | 10 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:reservation:Ecxus:room:123}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "roomId": "${ref:id:room:Ecxus:123}",
                        "roomCategoryId": null,
                        "checkIn": "2023-03-03T19:30:00.000Z",
                        "bookedBy": "${ref:id:user:john_doe}",
                        "bookedFor": "${ref:id:customer:Ecxus:10000000001}",
                        "canceledAt": "2023-03-03T17:10:11.000Z",
                        "canceledBy": null,
                        "canceledReason": null,
                        "noShow": false,
                        "note": null,
                        "createdAt": "2023-03-03T05:00:00.000Z",
                        "updatedAt": "2023-03-03T17:10:11.000Z"
                    },
                    {
                        "id": "${ref:id:reservation:Ecxus:roomCategory:Lush}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "roomId": null,
                        "roomCategoryId": "${ref:id:roomCategory:Ecxus:Lush}",
                        "checkIn": "2022-02-02T13:00:00.000Z",
                        "bookedBy": "${ref:id:user:john_doe}",
                        "bookedFor": "${ref:id:customer:Ecxus:10000000002}",
                        "canceledAt": null,
                        "canceledBy": null,
                        "canceledReason": null,
                        "noShow": false,
                        "note": null,
                        "createdAt": "2022-02-02T05:00:00.000Z",
                        "updatedAt": "2022-02-02T05:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:reservation:Ecxus:room:789}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "roomId": "${ref:id:room:Ecxus:789}",
                        "roomCategoryId": null,
                        "checkIn": "2021-01-01T23:30:00.000Z",
                        "bookedBy": "${ref:id:user:anaa123}",
                        "bookedFor": "${ref:id:customer:Ecxus:10000000002}",
                        "canceledAt": null,
                        "canceledBy": null,
                        "canceledReason": null,
                        "noShow": false,
                        "note": null,
                        "createdAt": "2021-01-01T05:00:00.000Z",
                        "updatedAt": "2021-01-01T05:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Filtering reservations
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/reservation" with the query:
            | checkIn.from     | 2022-02-02T05:00:00.000Z |
            | checkIn.to       | 2024-04-04T04:00:00.000Z |
            | pagination.limit | 10                       |
            | pagination.sort  | {"checkIn": "asc"}       |
            | canceledAt       |                          |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                 {
                        "id": "${ref:id:reservation:Ecxus:roomCategory:Lush}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "roomId": null,
                        "roomCategoryId": "${ref:id:roomCategory:Ecxus:Lush}",
                        "checkIn": "2022-02-02T13:00:00.000Z",
                        "bookedBy": "${ref:id:user:john_doe}",
                        "bookedFor": "${ref:id:customer:Ecxus:10000000002}",
                        "canceledAt": null,
                        "canceledBy": null,
                        "canceledReason": null,
                        "noShow": false,
                        "note": null,
                        "createdAt": "2022-02-02T05:00:00.000Z",
                        "updatedAt": "2022-02-02T05:00:00.000Z"
                    }
                ],
                "totalCount": 1,
                "nextCursor": null
            }
            """

    Scenario: Paginating reservations
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/reservation" with the query:
            | pagination.limit | 2                    |
            | pagination.sort  | {"createdAt": "asc"} |
        And the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:reservation:Ecxus:room:789}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "roomId": "${ref:id:room:Ecxus:789}",
                        "roomCategoryId": null,
                        "checkIn": "2021-01-01T23:30:00.000Z",
                        "bookedBy": "${ref:id:user:anaa123}",
                        "bookedFor": "${ref:id:customer:Ecxus:10000000002}",
                        "canceledAt": null,
                        "canceledBy": null,
                        "canceledReason": null,
                        "noShow": false,
                        "note": null,
                        "createdAt": "2021-01-01T05:00:00.000Z",
                        "updatedAt": "2021-01-01T05:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:reservation:Ecxus:roomCategory:Lush}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "roomId": null,
                        "roomCategoryId": "${ref:id:roomCategory:Ecxus:Lush}",
                        "checkIn": "2022-02-02T13:00:00.000Z",
                        "bookedBy": "${ref:id:user:john_doe}",
                        "bookedFor": "${ref:id:customer:Ecxus:10000000002}",
                        "canceledAt": null,
                        "canceledBy": null,
                        "canceledReason": null,
                        "noShow": false,
                        "note": null,
                        "createdAt": "2022-02-02T05:00:00.000Z",
                        "updatedAt": "2022-02-02T05:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": "${ref:var:lastResponse.nextCursor}"
            }
            """
        And I send a "GET" request to "/reservation" with the query:
            | pagination.cursor | ${ref:var:lastResponse.nextCursor} |
            | pagination.limit  | 2                                  |
            | pagination.sort   | {"createdAt": "asc"}               |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:reservation:Ecxus:room:123}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "roomId": "${ref:id:room:Ecxus:123}",
                        "roomCategoryId": null,
                        "checkIn": "2023-03-03T19:30:00.000Z",
                        "bookedBy": "${ref:id:user:john_doe}",
                        "bookedFor": "${ref:id:customer:Ecxus:10000000001}",
                        "canceledAt": "2023-03-03T17:10:11.000Z",
                        "canceledBy": null,
                        "canceledReason": null,
                        "noShow": false,
                        "note": null,
                        "createdAt": "2023-03-03T05:00:00.000Z",
                        "updatedAt": "2023-03-03T17:10:11.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Viewing a reservation
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/reservation/${ref:id:reservation:Ecxus:room:789}"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:reservation:Ecxus:room:789}",
                "companyId": "${ref:id:company:Ecxus}",
                "roomId": "${ref:id:room:Ecxus:789}",
                "roomCategoryId": null,
                "checkIn": "2021-01-01T23:30:00.000Z",
                "bookedBy": "${ref:id:user:anaa123}",
                "bookedFor": "${ref:id:customer:Ecxus:10000000002}",
                "canceledAt": null,
                "canceledBy": null,
                "canceledReason": null,
                "noShow": false,
                "note": null,
                "createdAt": "2021-01-01T05:00:00.000Z",
                "updatedAt": "2021-01-01T05:00:00.000Z"
            }
            """

    Scenario: Viewing a reservation that does not exist
        Given "unknown-id" is defined as:
            """
            fe8caf84-8558-4724-9a01-3023c8293b1e
            """
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/reservation/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Reservation not found"
