Feature: View service category
    As a user, I want to view the service category and its details.

    Background:
        Given the following companies exist:
            | Name   |
            | Ecxus  |
            | Nortec |
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions             |
            | john-doe   | [service-category:view] |
            | william123 | []                      |
        And the following employees with system access in the company "Nortec" exist:
            | User     | Permissions             |
            | john-doe | [service-category:view] |
        And the following service categories exist in the company "Ecxus":
            | Name              | Created at               | Updated at               |
            | Maintenance       | 2024-03-06T03:00:00.000Z | 2024-03-06T03:00:00.000Z |
            | Technical support | 2024-03-06T02:00:00.000Z | 2024-03-06T02:00:00.000Z |
        And the following service categories exist in the company "Nortec":
            | Name     | Created at               | Updated at               |
            | Cleaning | 2024-03-06T04:00:00.000Z | 2024-03-06T04:00:00.000Z |

    Scenario: Preventing unauthorized users from viewing service categories
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "GET" request to "/service-category"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Viewing service categories
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "GET" request to "/service-category" with the query:
            | pagination.limit | 10 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:serviceCategory:Ecxus:Maintenance}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Maintenance",
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:serviceCategory:Ecxus:Technical support}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Technical support",
                        "createdAt": "2024-03-06T02:00:00.000Z",
                        "updatedAt": "2024-03-06T02:00:00.000Z"
                    }
                ],
                "totalCount": 2,
                "nextCursor": null
            }
            """

    Scenario: Filtering service categories
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "GET" request to "/service-category" with the query:
            | name             | Main                 |
            | pagination.limit | 10                   |
            | pagination.sort  | {"createdAt": "asc"} |
        Then the request should succeed with a 200 status code
        And the response should match:
              """JSON
               {
                    "data": [
                        {
                            "id": "${ref:id:serviceCategory:Ecxus:Maintenance}",
                            "companyId": "${ref:id:company:Ecxus}",
                            "name": "Maintenance",
                            "createdAt": "2024-03-06T03:00:00.000Z",
                            "updatedAt": "2024-03-06T03:00:00.000Z"
                        }
                     ],
                    "totalCount": 1,
                    "nextCursor": null
               }
               """

    Scenario: Paginating service categories
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "GET" request to "/service-category" with the query:
            | pagination.limit | 1                    |
            | pagination.sort  | {"createdAt": "asc"} |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:serviceCategory:Ecxus:Technical support}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Technical support",
                        "createdAt": "2024-03-06T02:00:00.000Z",
                        "updatedAt": "2024-03-06T02:00:00.000Z"
                    }
                ],
                "totalCount": 2,
                "nextCursor": "${ref:var:lastResponse.nextCursor}"
           }
           """
        And I send a "GET" request to "/service-category" with the query:
            | pagination.cursor | ${ref:var:lastResponse.nextCursor} |
            | pagination.limit  | 2                                  |
            | pagination.sort   | {"createdAt": "asc"}               |
        And the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:serviceCategory:Ecxus:Maintenance}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Maintenance",
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    }
                ],
                "totalCount": 2,
                "nextCursor": null
            }
            """

    Scenario: Viewing a service category
        Given I am signed in as "john-doe" in the company "Nortec"
        When I send a "GET" request to "/service-category/${ref:id:serviceCategory:Nortec:Cleaning}"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:serviceCategory:Nortec:Cleaning}",
                "companyId": "${ref:id:company:Nortec}",
                "name": "Cleaning",
                "createdAt": "2024-03-06T04:00:00.000Z",
                "updatedAt": "2024-03-06T04:00:00.000Z"
            }
            """

    Scenario: Viewing a service category that does not exist
        Given I am signed in as "john-doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            573a3ac3-a05a-48aa-80b1-1869a73bfe8c
            """
        When I send a "GET" request to "/service-category/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Service category not found"
