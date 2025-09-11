Feature: View supplier
    As a user, I want to find a supplier and view its details

    Background:
        Given the following companies exist:
            | Name  |
            | Ecxus |
            | Meta  |
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions     |
            | john_doe   | [supplier:view] |
            | william123 | []              |
        And the following suppliers exist in the company "Ecxus":
            | Name  | Document ID    | Company name | Phone    | Gender | Person type | Created at           | Updated at           |
            | john  | 100.000.000-01 |              | "123456" | MALE   | NATURAL     | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | Andre | 100.000.000-02 | ALPHA        | "111111" |        | LEGAL       | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | Lucas | 100.000.000-03 | BETA         | "111111" |        | LEGAL       | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
        And the following suppliers exist in the company "Meta":
            | Name | Document ID    | Company name | Phone    | Person type | Created at           | Updated at           |
            | Ana  | 100.000.000-05 | ACME         | "123777" | LEGAL       | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |

    Scenario: Preventing unauthorized users from viewing suppliers
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "GET" request to "/supplier"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Viewing suppliers
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/supplier" with the query:
            | pagination.limit | 10 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:supplier:Ecxus:10000000001}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "john",
                        "documentId": "10000000001",
                        "phone": "123456",
                        "companyName": null,
                        "personType": "NATURAL",
                        "profiles": [
                            "SUPPLIER"
                        ],
                        "gender": "MALE",
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:supplier:Ecxus:10000000002}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Andre",
                        "documentId": "10000000002",
                        "phone": "111111",
                        "companyName": "ALPHA",
                        "personType": "LEGAL",
                        "profiles": [
                            "SUPPLIER"
                        ],
                        "gender": null,
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:supplier:Ecxus:10000000003}",
                        "name": "Lucas",
                        "companyId": "${ref:id:company:Ecxus}",
                        "documentId": "10000000003",
                        "phone": "111111",
                        "companyName": "BETA",
                        "personType": "LEGAL",
                        "profiles": [
                            "SUPPLIER"
                        ],
                        "gender": null,
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Filtering suppliers
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/supplier" with the query:
            | name             | a               |
            | pagination.limit | 10              |
            | pagination.sort  | {"name": "asc"} |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:supplier:Ecxus:10000000002}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Andre",
                        "documentId": "10000000002",
                        "phone": "111111",
                        "companyName": "ALPHA",
                        "personType": "LEGAL",
                        "profiles": [
                            "SUPPLIER"
                        ],
                        "gender": null,
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:supplier:Ecxus:10000000003}",
                        "name": "Lucas",
                        "companyId": "${ref:id:company:Ecxus}",
                        "documentId": "10000000003",
                        "phone": "111111",
                        "companyName": "BETA",
                        "personType": "LEGAL",
                        "profiles": [
                            "SUPPLIER"
                        ],
                        "gender": null,
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    }
                ],
                "totalCount": 2,
                "nextCursor": null
            }
            """

    Scenario: Paginating suppliers
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/supplier" with the query:
            | pagination.limit | 2                    |
            | pagination.sort  | {"createdAt": "asc"} |
        And the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:supplier:Ecxus:10000000001}",
                        "name": "john",
                        "companyId": "${ref:id:company:Ecxus}",
                        "documentId": "10000000001",
                        "phone": "123456",
                        "gender": "MALE",
                        "companyName": null,
                        "personType": "NATURAL",
                        "profiles": [
                            "SUPPLIER"
                        ],
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:supplier:Ecxus:10000000002}",
                        "name": "Andre",
                        "companyId": "${ref:id:company:Ecxus}",
                        "documentId": "10000000002",
                        "phone": "111111",
                        "gender": null,
                        "companyName": "ALPHA",
                        "personType": "LEGAL",
                        "profiles": [
                            "SUPPLIER"
                        ],
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": "${ref:var:lastResponse.nextCursor}"
            }
            """
        And I send a "GET" request to "/supplier" with the query:
            | pagination.cursor | ${ref:var:lastResponse.nextCursor} |
            | pagination.limit  | 2                                  |
            | pagination.sort   | {"createdAt": "asc"}               |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:supplier:Ecxus:10000000003}",
                        "name": "Lucas",
                        "companyId": "${ref:id:company:Ecxus}",
                        "documentId": "10000000003",
                        "phone": "111111",
                        "gender": null,
                        "companyName": "BETA",
                        "personType": "LEGAL",
                        "profiles": [
                            "SUPPLIER"
                        ],
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Viewing a supplier
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/supplier/${ref:id:supplier:Ecxus:10000000003}"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:supplier:Ecxus:10000000003}",
                "name": "Lucas",
                "companyId": "${ref:id:company:Ecxus}",
                "documentId": "10000000003",
                "phone": "111111",
                "gender": null,
                "companyName": "BETA",
                "personType": "LEGAL",
                "profiles": [
                    "SUPPLIER"
                ],
                "createdAt": "2020-01-01T01:00:00.000Z",
                "updatedAt": "2020-01-01T01:00:00.000Z"
            }
            """

    Scenario: Viewing a supplier that does not exist
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            7e185aec-fd6f-4ff5-9d3a-6e0796057fcc
            """
        When I send a "GET" request to "/supplier/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Supplier not found"
