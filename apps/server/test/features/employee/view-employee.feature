Feature: View employee
    As a user, I want to find an employee and view its details

    Background:
        Given the following companies exist:
            | Name  |
            | Ecxus |
            | Meta  |
        And the following employee positions exist in the company 'Ecxus':
            | Name    | Permissions     |
            | Manager | [employee:view] |
            | Admin   | [employee:view] |
        And an employee position with name "Maid" in the company "Meta" exists
        And the following employees with system access in the company "Ecxus" exist:
            | Name | Document ID    | Position | Phone    | Gender | Person type | Allow system access | User     | Created at           | Updated at           |
            | john | 100.000.000-01 | Manager  | "123456" | MALE   | NATURAL     | true                | john_doe | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
        And the following employees exist in the company "Ecxus":
            | Name  | Document ID    | Position | Phone    | Gender | Person type | Allow system access | User | Created at           | Updated at           |
            | Andre | 100.000.000-02 | Admin    | "111111" | MALE   | NATURAL     | false               |      | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | Lucas | 100.000.000-03 | Admin    | "111111" | MALE   | NATURAL     | false               |      | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
        And the following employees exist in the company "Meta":
            | Name | Document ID    | Position | Phone    | Gender | Person type | Allow system access | User    | Created at           | Updated at           |
            | Ana  | 100.000.000-05 | Maid     | "123777" | FEMALE | NATURAL     | true                | ana_doe | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |

    Scenario: Preventing unauthorized users from viewing employees
        Given I am signed in as "ana_doe" in the company "Meta"
        When I send a "GET" request to "/employee"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Viewing employees
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/employee" with the query:
            | pagination.limit | 10 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:employee:Ecxus:10000000001}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "john",
                        "positionId": "${ref:id:employeePosition:Ecxus:Manager}",
                        "documentId": "10000000001",
                        "phone": "123456",
                        "gender": "MALE",
                        "companyName": null,
                        "personType": "NATURAL",
                        "profiles": [
                            "EMPLOYEE"
                        ],
                        "allowSystemAccess": true,
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:employee:Ecxus:10000000002}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Andre",
                        "positionId": "${ref:id:employeePosition:Ecxus:Admin}",
                        "documentId": "10000000002",
                        "phone": "111111",
                        "gender": "MALE",
                        "companyName": null,
                        "personType": "NATURAL",
                        "profiles": [
                            "EMPLOYEE"
                        ],
                        "allowSystemAccess": false,
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:employee:Ecxus:10000000003}",
                        "name": "Lucas",
                        "positionId": "${ref:id:employeePosition:Ecxus:Admin}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "documentId": "10000000003",
                        "phone": "111111",
                        "gender": "MALE",
                        "companyName": null,
                        "personType": "NATURAL",
                        "profiles": [
                            "EMPLOYEE"
                        ],
                        "allowSystemAccess": false,
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Filtering employees
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/employee" with the query:
            | name             | a               |
            | pagination.limit | 10              |
            | pagination.sort  | {"name": "asc"} |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:employee:Ecxus:10000000002}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Andre",
                        "positionId": "${ref:id:employeePosition:Ecxus:Admin}",
                        "documentId": "10000000002",
                        "phone": "111111",
                        "gender": "MALE",
                        "companyName": null,
                        "personType": "NATURAL",
                        "profiles": [
                            "EMPLOYEE"
                        ],
                        "allowSystemAccess": false,
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:employee:Ecxus:10000000003}",
                        "name": "Lucas",
                        "positionId": "${ref:id:employeePosition:Ecxus:Admin}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "documentId": "10000000003",
                        "phone": "111111",
                        "gender": "MALE",
                        "companyName": null,
                        "personType": "NATURAL",
                        "profiles": [
                            "EMPLOYEE"
                        ],
                        "allowSystemAccess": false,
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    }
                ],
                "totalCount": 2,
                "nextCursor": null
            }
            """

    Scenario: Paginating employees
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/employee" with the query:
            | pagination.limit | 2                    |
            | pagination.sort  | {"createdAt": "asc"} |
        And the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:employee:Ecxus:10000000001}",
                        "name": "john",
                        "positionId": "${ref:id:employeePosition:Ecxus:Manager}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "documentId": "10000000001",
                        "phone": "123456",
                        "gender": "MALE",
                        "companyName": null,
                        "personType": "NATURAL",
                        "profiles": [
                            "EMPLOYEE"
                        ],
                        "allowSystemAccess": true,
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:employee:Ecxus:10000000002}",
                        "name": "Andre",
                        "positionId": "${ref:id:employeePosition:Ecxus:Admin}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "documentId": "10000000002",
                        "phone": "111111",
                        "gender": "MALE",
                        "companyName": null,
                        "personType": "NATURAL",
                        "profiles": [
                            "EMPLOYEE"
                        ],
                        "allowSystemAccess": false,
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": "${ref:var:lastResponse.nextCursor}"
            }
            """
        And I send a "GET" request to "/employee" with the query:
            | pagination.cursor | ${ref:var:lastResponse.nextCursor} |
            | pagination.limit  | 2                                  |
            | pagination.sort   | {"createdAt": "asc"}               |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:employee:Ecxus:10000000003}",
                        "name": "Lucas",
                        "positionId": "${ref:id:employeePosition:Ecxus:Admin}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "documentId": "10000000003",
                        "phone": "111111",
                        "gender": "MALE",
                        "companyName": null,
                        "personType": "NATURAL",
                        "profiles": [
                            "EMPLOYEE"
                        ],
                        "allowSystemAccess": false,
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Viewing an employee
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/employee/${ref:id:employee:Ecxus:10000000003}"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:employee:Ecxus:10000000003}",
                "name": "Lucas",
                "positionId": "${ref:id:employeePosition:Ecxus:Admin}",
                "companyId": "${ref:id:company:Ecxus}",
                "documentId": "10000000003",
                "phone": "111111",
                "gender": "MALE",
                "companyName": null,
                "personType": "NATURAL",
                "profiles": [
                    "EMPLOYEE"
                ],
                "allowSystemAccess": false,
                "createdAt": "2020-01-01T01:00:00.000Z",
                "updatedAt": "2020-01-01T01:00:00.000Z"
            }
            """

    Scenario: Viewing an employee that does not exist
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            97eea94f-4b58-49f7-9879-073bd59e169b
            """
        When I send a "GET" request to "/employee/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Employee not found"
