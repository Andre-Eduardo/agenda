Feature: View customer
    As a user, I want to find a customer and view its details

    Background:
        Given the following companies exist:
            | Name  |
            | Ecxus |
            | Meta  |
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions     |
            | john_doe   | [customer:view] |
            | william123 | []              |
        And the following customers exist in the company "Ecxus":
            | Name  | Document ID    | Phone    | Gender | Person type | Created at           | Updated at           |
            | john  | 100.000.000-01 | "123456" | MALE   | NATURAL     | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | Andre | 100.000.000-02 | "111111" | MALE   | NATURAL     | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | Lucas | 100.000.000-03 | "111111" | MALE   | NATURAL     | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
        And the following customers exist in the company "Meta":
            | Name | Document ID    | Phone    | Gender | Person type | Created at           | Updated at           |
            | Ana  | 100.000.000-05 | "123777" | FEMALE | NATURAL     | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |

    Scenario: Preventing unauthorized users from viewing customers
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "GET" request to "/customer"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Viewing customers
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/customer" with the query:
            | pagination.limit | 10 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:customer:Ecxus:10000000001}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "john",
                        "documentId": "10000000001",
                        "phone": "123456",
                        "companyName": null,
                        "personType": "NATURAL",
                        "profiles": [
                            "CUSTOMER"
                        ],
                        "gender": "MALE",
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:customer:Ecxus:10000000002}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Andre",
                        "documentId": "10000000002",
                        "phone": "111111",
                        "companyName": null,
                        "personType": "NATURAL",
                        "profiles": [
                            "CUSTOMER"
                        ],
                        "gender": "MALE",
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:customer:Ecxus:10000000003}",
                        "name": "Lucas",
                        "companyId": "${ref:id:company:Ecxus}",
                        "documentId": "10000000003",
                        "phone": "111111",
                        "companyName": null,
                        "personType": "NATURAL",
                        "profiles": [
                            "CUSTOMER"
                        ],
                        "gender": "MALE",
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Filtering customers
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/customer" with the query:
            | name             | a               |
            | pagination.limit | 10              |
            | pagination.sort  | {"name": "asc"} |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:customer:Ecxus:10000000002}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Andre",
                        "documentId": "10000000002",
                        "phone": "111111",
                        "companyName": null,
                        "personType": "NATURAL",
                        "profiles": [
                            "CUSTOMER"
                        ],
                        "gender": "MALE",
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:customer:Ecxus:10000000003}",
                        "name": "Lucas",
                        "companyId": "${ref:id:company:Ecxus}",
                        "documentId": "10000000003",
                        "phone": "111111",
                        "companyName": null,
                        "personType": "NATURAL",
                        "profiles": [
                            "CUSTOMER"
                        ],
                        "gender": "MALE",
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    }
                ],
                "totalCount": 2,
                "nextCursor": null
            }
            """

    Scenario: Paginating customers
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/customer" with the query:
            | pagination.limit | 2                    |
            | pagination.sort  | {"createdAt": "asc"} |
        And the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:customer:Ecxus:10000000001}",
                        "name": "john",
                        "companyId": "${ref:id:company:Ecxus}",
                        "documentId": "10000000001",
                        "phone": "123456",
                        "gender": "MALE",
                        "companyName": null,
                        "personType": "NATURAL",
                        "profiles": [
                            "CUSTOMER"
                        ],
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:customer:Ecxus:10000000002}",
                        "name": "Andre",
                        "companyId": "${ref:id:company:Ecxus}",
                        "documentId": "10000000002",
                        "phone": "111111",
                        "gender": "MALE",
                        "companyName": null,
                        "personType": "NATURAL",
                        "profiles": [
                            "CUSTOMER"
                        ],
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": "${ref:var:lastResponse.nextCursor}"
            }
            """
        And I send a "GET" request to "/customer" with the query:
            | pagination.cursor | ${ref:var:lastResponse.nextCursor} |
            | pagination.limit  | 2                                  |
            | pagination.sort   | {"createdAt": "asc"}               |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:customer:Ecxus:10000000003}",
                        "name": "Lucas",
                        "companyId": "${ref:id:company:Ecxus}",
                        "documentId": "10000000003",
                        "phone": "111111",
                        "gender": "MALE",
                        "companyName": null,
                        "personType": "NATURAL",
                        "profiles": [
                            "CUSTOMER"
                        ],
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Viewing a customer
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/customer/${ref:id:customer:Ecxus:10000000003}"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:customer:Ecxus:10000000003}",
                "name": "Lucas",
                "companyId": "${ref:id:company:Ecxus}",
                "documentId": "10000000003",
                "phone": "111111",
                "gender": "MALE",
                "companyName": null,
                "personType": "NATURAL",
                "profiles": [
                    "CUSTOMER"
                ],
                "createdAt": "2020-01-01T01:00:00.000Z",
                "updatedAt": "2020-01-01T01:00:00.000Z"
            }
            """

    Scenario: Viewing a customer that does not exist
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            7e185aec-fd6f-4ff5-9d3a-6e0796057fcc
            """
        When I send a "GET" request to "/customer/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Customer not found"
