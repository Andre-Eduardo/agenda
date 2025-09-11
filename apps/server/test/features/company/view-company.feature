Feature: View company
    As a user, I want to find a company and view its details

    Background:
        Given the following users exist:
            | Username | Global role |
            | john_doe | OWNER       |
        And the following companies exist:
            | Name   | Created at           | Updated at           |
            | Fuego  | 2020-01-01T04:00:00Z | 2020-01-01T04:00:00Z |
            | Canada | 2020-01-01T03:00:00Z | 2020-01-01T03:00:00Z |
            | Calla  | 2020-01-01T02:00:00Z | 2020-01-01T02:00:00Z |
            | Lush   | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
        And the following employees with system access in the company "Fuego" exist:
            | User       | Permissions |
            | william123 | []          |

    Scenario: Preventing unauthorized users from viewing companies
        Given I am signed in as "william123"
        When I send a "GET" request to "/company"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Viewing companies
        Given I am signed in as "john_doe"
        When I send a "GET" request to "/company" with the query:
            | pagination.limit | 10 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                {
                        "id": "${ref:id:company:Fuego}",
                        "name": "Fuego",
                        "createdAt": "2020-01-01T04:00:00.000Z",
                        "updatedAt": "2020-01-01T04:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:company:Canada}",
                        "name": "Canada",
                        "createdAt": "2020-01-01T03:00:00.000Z",
                        "updatedAt": "2020-01-01T03:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:company:Calla}",
                        "name": "Calla",
                        "createdAt": "2020-01-01T02:00:00.000Z",
                        "updatedAt": "2020-01-01T02:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:company:Lush}",
                        "name": "Lush",
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    }
                ],
                "totalCount": 4,
                "nextCursor": null
            }
            """

    Scenario: Filtering companies
        Given I am signed in as "john_doe"
        When I send a "GET" request to "/company" with the query:
            | name             | Ca              |
            | pagination.limit | 10              |
            | pagination.sort  | {"name": "asc"} |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:company:Calla}",
                        "name": "Calla",
                        "createdAt": "2020-01-01T02:00:00.000Z",
                        "updatedAt": "2020-01-01T02:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:company:Canada}",
                        "name": "Canada",
                        "createdAt": "2020-01-01T03:00:00.000Z",
                        "updatedAt": "2020-01-01T03:00:00.000Z"
                    }
                ],
                "totalCount": 2,
                "nextCursor": null
            }
            """

    Scenario: Paginating companies
        Given I am signed in as "john_doe"
        When I send a "GET" request to "/company" with the query:
            | pagination.limit | 2                    |
            | pagination.sort  | {"createdAt": "asc"} |
        And the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:company:Lush}",
                        "name": "Lush",
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:company:Calla}",
                        "name": "Calla",
                        "createdAt": "2020-01-01T02:00:00.000Z",
                        "updatedAt": "2020-01-01T02:00:00.000Z"
                    }
                ],
                "totalCount": 4,
                "nextCursor": "${ref:var:lastResponse.nextCursor}"
            }
            """
        And I send a "GET" request to "/company" with the query:
            | pagination.cursor | ${ref:var:lastResponse.nextCursor} |
            | pagination.limit  | 2                                  |
            | pagination.sort   | {"createdAt": "asc"}               |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:company:Canada}",
                        "name": "Canada",
                        "createdAt": "2020-01-01T03:00:00.000Z",
                        "updatedAt": "2020-01-01T03:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:company:Fuego}",
                        "name": "Fuego",
                        "createdAt": "2020-01-01T04:00:00.000Z",
                        "updatedAt": "2020-01-01T04:00:00.000Z"
                    }
                ],
                "totalCount": 4,
                "nextCursor": null
            }
            """

    Scenario: Viewing a company
        Given I am signed in as "john_doe"
        When I send a "GET" request to "/company/${ref:id:company:Canada}"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:company:Canada}",
                "name": "Canada",
                "createdAt": "2020-01-01T03:00:00.000Z",
                "updatedAt": "2020-01-01T03:00:00.000Z"
            }
            """

    Scenario: Viewing a company that does not exist
        Given I am signed in as "john_doe"
        And "unknown-id" is defined as:
            """
            fe8caf84-8558-4724-9a01-3023c8293b1e
            """
        When I send a "GET" request to "/company/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Company not found"
