Feature: View cashier
    As a user, I want to find a cashier and view its details

    Background:
        Given the following companies exist:
            | Name  |
            | Ecxus |
            | Meta  |
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions    |
            | john_doe   | [cashier:view] |
            | jorge-bush | []             |
            | anaa123    | []             |
            | lucas      | []             |
        And the following employees with system access in the company "Meta" exist:
            | User     | Permissions    |
            | john_doe | [cashier:view] |
        And the following cashiers exist in the company "Meta":
            | User     | Created at           | Updated at           | Closed at |
            | john_doe | 2024-04-04T05:00:00Z | 2024-04-04T05:00:00Z | null      |
        And the following cashiers exist in the company "Ecxus":
            | User       | Created at           | Updated at           | Closed at            |
            | jorge-bush | 2023-03-03T05:00:00Z | 2023-03-04T15:30:00Z | 2023-03-04T15:30:00Z |
            | anaa123    | 2022-02-02T05:00:00Z | 2022-02-02T05:00:00Z |                      |
            | lucas      | 2021-01-01T05:00:00Z | 2021-01-01T05:00:00Z |                      |

    Scenario: Preventing unauthorized users from viewing cashiers
        Given I am signed in as "jorge-bush" in the company "Ecxus"
        When I send a "GET" request to "/cashier"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Viewing cashiers
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/cashier" with the query:
            | pagination.limit | 10 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:cashier:Ecxus:jorge-bush}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "userId": "${ref:id:user:jorge-bush}",
                        "createdAt": "2023-03-03T05:00:00.000Z",
                        "updatedAt": "2023-03-04T15:30:00.000Z",
                        "closedAt": "2023-03-04T15:30:00.000Z"
                    },
                    {
                        "id": "${ref:id:cashier:Ecxus:anaa123}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "userId": "${ref:id:user:anaa123}",
                        "createdAt": "2022-02-02T05:00:00.000Z",
                        "updatedAt": "2022-02-02T05:00:00.000Z",
                        "closedAt": null
                    },
                    {
                        "id": "${ref:id:cashier:Ecxus:lucas}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "userId": "${ref:id:user:lucas}",
                        "createdAt": "2021-01-01T05:00:00.000Z",
                        "updatedAt": "2021-01-01T05:00:00.000Z",
                        "closedAt": null
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Filtering cashiers
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/cashier" with the query:
            | pagination.limit | 10                       |
            | pagination.sort  | {"closedAt": "desc"}     |
            | createdAt.from   | 2022-02-02T05:00:00.000Z |
            | createdAt.to     | 2025-05-05T05:00:00.000Z |
            | closedAt         |                          |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:cashier:Ecxus:anaa123}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "userId": "${ref:id:user:anaa123}",
                        "createdAt": "2022-02-02T05:00:00.000Z",
                        "updatedAt": "2022-02-02T05:00:00.000Z",
                        "closedAt": null
                    }
                ],
                "totalCount": 1,
                "nextCursor": null
            }
            """

    Scenario: Paginating cashiers
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/cashier" with the query:
            | pagination.limit | 2                    |
            | pagination.sort  | {"createdAt": "asc"} |
        And the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:cashier:Ecxus:lucas}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "userId": "${ref:id:user:lucas}",
                        "createdAt": "2021-01-01T05:00:00.000Z",
                        "updatedAt": "2021-01-01T05:00:00.000Z",
                        "closedAt": null
                    },
                    {
                        "id": "${ref:id:cashier:Ecxus:anaa123}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "userId": "${ref:id:user:anaa123}",
                        "createdAt": "2022-02-02T05:00:00.000Z",
                        "updatedAt": "2022-02-02T05:00:00.000Z",
                        "closedAt": null
                    }
                ],
                "totalCount": 3,
                "nextCursor": "${ref:var:lastResponse.nextCursor}"
            }
            """
        And I send a "GET" request to "/cashier" with the query:
            | pagination.cursor | ${ref:var:lastResponse.nextCursor} |
            | pagination.limit  | 2                                  |
            | pagination.sort   | {"createdAt": "asc"}               |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:cashier:Ecxus:jorge-bush}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "userId": "${ref:id:user:jorge-bush}",
                        "createdAt": "2023-03-03T05:00:00.000Z",
                        "updatedAt": "2023-03-04T15:30:00.000Z",
                        "closedAt": "2023-03-04T15:30:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Viewing a cashier
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/cashier/${ref:id:cashier:Ecxus:lucas}"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:cashier:Ecxus:lucas}",
                "companyId": "${ref:id:company:Ecxus}",
                "userId": "${ref:id:user:lucas}",
                "createdAt": "2021-01-01T05:00:00.000Z",
                "updatedAt": "2021-01-01T05:00:00.000Z",
                "closedAt": null
            }
            """

    Scenario: Viewing a cashier that does not exist
        Given "unknown-id" is defined as:
            """
            fe8caf84-8558-4724-9a01-3023c8293b1e
            """
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/cashier/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Cashier not found"
