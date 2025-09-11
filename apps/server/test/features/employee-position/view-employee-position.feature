Feature: View employee position
    As a user, I want to view the employee position and its details.

    Background:
        Given the following companies exist:
            | Name   |
            | Ecxus  |
            | Nortec |
        And the following employee positions exist in the company "Ecxus":
            | Name              | Permissions              | Created at               | Updated at               |
            | Developer         | []                       | 2024-01-01T03:00:00.000Z | 2024-01-01T03:00:00.000Z |
            | Hardware Engineer | []                       | 2024-01-01T02:00:00.000Z | 2024-01-01T02:00:00.000Z |
            | Manager           | [employee-position:view] | 2024-01-01T01:00:00.000Z | 2024-01-01T01:00:00.000Z |
        And the following employee positions exist in the company "Nortec":
            | Name              | Permissions              | Created at               | Updated at               |
            | Designer          | []                       | 2024-01-01T03:00:00.000Z | 2024-01-01T03:00:00.000Z |
            | Salesman          | [employee-position:view] | 2024-01-01T02:00:00.000Z | 2024-01-01T02:00:00.000Z |
            | Hardware Engineer | []                       | 2024-01-01T01:00:00.000Z | 2024-01-01T01:00:00.000Z |
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Position  |
            | john_doe   | Manager   |
            | william123 | Developer |
        And the following employees with system access in the company "Nortec" exist:
            | User     | Position |
            | john_doe | Salesman |

    Scenario: Preventing unauthorized users from viewing employee positions
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "GET" request to "/employee-position"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Viewing employee positions
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/employee-position" with the query:
            | pagination.limit | 10 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:employeePosition:Ecxus:Developer}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Developer",
                        "permissions": [],
                        "createdAt": "2024-01-01T03:00:00.000Z",
                        "updatedAt": "2024-01-01T03:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:employeePosition:Ecxus:Hardware Engineer}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Hardware Engineer",
                        "permissions": [],
                        "createdAt": "2024-01-01T02:00:00.000Z",
                        "updatedAt": "2024-01-01T02:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:employeePosition:Ecxus:Manager}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Manager",
                        "permissions": ["employee-position:view"],
                        "createdAt": "2024-01-01T01:00:00.000Z",
                        "updatedAt": "2024-01-01T01:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Filtering employee positions
        Given I am signed in as "john_doe" in the company "Nortec"
        When I send a "GET" request to "/employee-position" with the query:
            | pagination.limit | 10              |
            | name             | er              |
            | pagination.sort  | {"name": "asc"} |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:employeePosition:Nortec:Designer}",
                        "companyId": "${ref:id:company:Nortec}",
                        "name": "Designer",
                        "permissions": [],
                        "createdAt": "2024-01-01T03:00:00.000Z",
                        "updatedAt": "2024-01-01T03:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:employeePosition:Nortec:Hardware Engineer}",
                        "companyId": "${ref:id:company:Nortec}",
                        "name": "Hardware Engineer",
                        "permissions": [],
                        "createdAt": "2024-01-01T01:00:00.000Z",
                        "updatedAt": "2024-01-01T01:00:00.000Z"
                    }
                ],
                "totalCount": 2,
                "nextCursor": null
            }
            """

    Scenario: Paginating employee positions
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/employee-position" with the query:
            | pagination.limit | 2                    |
            | pagination.sort  | {"createdAt": "asc"} |
        And the request should succeed with a 200 status code
        And the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:employeePosition:Ecxus:Manager}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Manager",
                        "permissions": ["employee-position:view"],
                        "createdAt": "2024-01-01T01:00:00.000Z",
                        "updatedAt": "2024-01-01T01:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:employeePosition:Ecxus:Hardware Engineer}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Hardware Engineer",
                        "permissions": [],
                        "createdAt": "2024-01-01T02:00:00.000Z",
                        "updatedAt": "2024-01-01T02:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": "${ref:var:lastResponse.nextCursor}"
            }
            """
        And I send a "GET" request to "/employee-position" with the query:
            | pagination.cursor | ${ref:var:lastResponse.nextCursor} |
            | pagination.limit  | 2                                  |
            | pagination.sort   | {"createdAt": "asc"}               |
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:employeePosition:Ecxus:Developer}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Developer",
                        "permissions": [],
                        "createdAt": "2024-01-01T03:00:00.000Z",
                        "updatedAt": "2024-01-01T03:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Viewing an employee position
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/employee-position/${ref:id:employeePosition:Ecxus:Developer}"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:employeePosition:Ecxus:Developer}",
                "companyId": "${ref:id:company:Ecxus}",
                "name": "Developer",
                "permissions": [],
                "createdAt": "2024-01-01T03:00:00.000Z",
                "updatedAt": "2024-01-01T03:00:00.000Z"
            }
            """

    Scenario: Viewing an employee position that does not exist
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            573a3ac3-a05a-48aa-80b1-1869a73bfe8c
            """
        When I send a "GET" request to "/employee-position/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Employee position not found"
