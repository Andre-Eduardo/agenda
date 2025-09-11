Feature: View service
    As a user, I want to view the service and its details.

    Background:
        Given the following companies exist:
            | Name   |
            | Ecxus  |
            | Nortec |
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions    |
            | john-doe   | [service:view] |
            | william123 | []             |
        And the following employees with system access in the company "Nortec" exist:
            | User     | Permissions    |
            | john-doe | [service:view] |
        And a service category with name "Maintenance" in the company "Ecxus" exists
        And a service category with name "Package" in the company "Nortec" exists
        And the following services exist in the company "Ecxus" and service category "Maintenance":
            | Code | Name     | Price | Created at               | Updated at               |
            | 1    | Cleaning | 100   | 2024-03-06T03:00:00.000Z | 2024-03-06T03:00:00.000Z |
        And the following services exist in the company "Nortec" and service category "Package":
            | Code | Name               | Price | Created at               | Updated at               |
            | 5    | Massage            | 250   | 2024-03-06T02:00:00.000Z | 2024-03-06T02:00:00.000Z |
            | 11   | Foot spa           | 150   | 2024-03-06T03:00:00.000Z | 2024-03-06T03:00:00.000Z |
            | 45   | Special decorating | 99.90 | 2024-03-06T04:00:00.000Z | 2024-03-06T04:00:00.000Z |

    Scenario: Preventing unauthorized users from viewing services
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "GET" request to "/service"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Viewing services
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "GET" request to "/service" with the query:
            | pagination.limit | 10 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:service:Ecxus:1}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "categoryId": "${ref:id:serviceCategory:Ecxus:Maintenance}",
                        "code": 1,
                        "name": "Cleaning",
                        "price": 100,
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    }
                ],
                "totalCount": 1,
                "nextCursor": null
            }
            """

    Scenario: Paginating services
        Given I am signed in as "john-doe" in the company "Nortec"
        When I send a "GET" request to "/service" with the query:
            | pagination.limit | 2                    |
            | pagination.sort  | {"createdAt": "asc"} |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:service:Nortec:5}",
                        "companyId": "${ref:id:company:Nortec}",
                        "categoryId": "${ref:id:serviceCategory:Nortec:Package}",
                        "code": 5,
                        "name": "Massage",
                        "price": 250,
                        "createdAt": "2024-03-06T02:00:00.000Z",
                        "updatedAt": "2024-03-06T02:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:service:Nortec:11}",
                        "companyId": "${ref:id:company:Nortec}",
                        "categoryId": "${ref:id:serviceCategory:Nortec:Package}",
                        "code": 11,
                        "name": "Foot spa",
                        "price": 150,
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": "${ref:var:lastResponse.nextCursor}"
            }
            """
        When I send a "GET" request to "/service" with the query:
            | pagination.cursor | ${ref:var:lastResponse.nextCursor} |
            | pagination.limit  | 2                                  |
            | pagination.sort   | {"createdAt": "asc"}               |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:service:Nortec:45}",
                        "companyId": "${ref:id:company:Nortec}",
                        "categoryId": "${ref:id:serviceCategory:Nortec:Package}",
                        "code": 45,
                        "name": "Special decorating",
                        "price": 99.90,
                        "createdAt": "2024-03-06T04:00:00.000Z",
                        "updatedAt": "2024-03-06T04:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Filtering services
        Given I am signed in as "john-doe" in the company "Nortec"
        When I send a "GET" request to "/service" with the query:
            | categoryId       | ${ref:id:serviceCategory:Nortec:Package} |
            | name             | Foo                                      |
            | pagination.limit | 10                                       |
            | pagination.sort  | {"createdAt": "asc"}                     |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:service:Nortec:11}",
                        "companyId": "${ref:id:company:Nortec}",
                        "categoryId": "${ref:id:serviceCategory:Nortec:Package}",
                        "code": 11,
                        "name": "Foot spa",
                        "price": 150,
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    }
                ],
                "totalCount": 1,
                "nextCursor": null
            }
            """

    Scenario: Viewing a service
        Given I am signed in as "john-doe" in the company "Nortec"
        When I send a "GET" request to "/service/${ref:id:service:Nortec:5}"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:service:Nortec:5}",
                "companyId": "${ref:id:company:Nortec}",
                "categoryId": "${ref:id:serviceCategory:Nortec:Package}",
                "code": 5,
                "name": "Massage",
                "price": 250,
                "createdAt": "2024-03-06T02:00:00.000Z",
                "updatedAt": "2024-03-06T02:00:00.000Z"
            }
            """

    Scenario: Viewing a service that does not exist
        Given I am signed in as "john-doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            573a3ac3-a05a-48aa-80b1-1869a73bfe8c
            """
        When I send a "GET" request to "/service/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Service not found"
