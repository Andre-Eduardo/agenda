Feature: View stock
    As a user, I want to view the stock details

    Background:
        Given the following companies exist:
            | Name   |
            | Ecxus  |
            | Nortec |
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions  |
            | john-doe   | [stock:view] |
            | william123 | []           |
        And the following employees with system access in the company "Nortec" exist:
            | User     | Permissions  |
            | john-doe | [stock:view] |
        And a room category with name "Lush" in the company "Ecxus" exists
        And a room category with name "Basic" in the company "Nortec" exists
        And the following rooms exist in the company "Ecxus" and room category "Lush":
            | Number | Name    |
            | 1      | Suite 1 |
            | 2      | Suite 2 |
        And the following rooms exist in the company "Nortec" and room category "Basic":
            | Number | Name    |
            | 101    | Suite 1 |
            | 102    | Suite 2 |
        And the following stocks exist in the company "Ecxus":
            | type | Created By ID           | Created at           | Updated at           |
            | MAIN | ${ref:id:user:john-doe} | 2024-03-06T03:00:00Z | 2024-03-06T03:00:00Z |
        And the following stocks exist in the company "Nortec":
            | type | Created By ID           | Created at           | Updated at           |
            | MAIN | ${ref:id:user:john-doe} | 2024-03-06T03:00:00Z | 2024-03-06T03:00:00Z |
        And the following stocks exist in the company "Ecxus":
            | Name | Room number | Type    | Parent ID                       | Created by ID           | Created at           | Updated at           |
            |      | 1           | ROOM    | ${ref:id:stock:Ecxus:main:MAIN} | ${ref:id:user:john-doe} | 2024-03-06T03:00:00Z | 2024-03-06T03:00:00Z |
            |      | 2           | ROOM    | ${ref:id:stock:Ecxus:main:MAIN} | ${ref:id:user:john-doe} | 2024-03-06T03:00:00Z | 2024-03-06T03:00:00Z |
            | Red  |             | HALLWAY | ${ref:id:stock:Ecxus:main:MAIN} | ${ref:id:user:john-doe} | 2024-03-06T03:00:00Z | 2024-03-06T03:00:00Z |
        And the following stocks exist in the company "Nortec":
            | Name  | Room number | Type    | Parent ID                        | Created by ID           | Created at           | Updated at           |
            |       | 101         | ROOM    | ${ref:id:stock:Nortec:main:MAIN} | ${ref:id:user:john-doe} | 2024-03-06T03:00:00Z | 2024-03-06T03:00:00Z |
            |       | 102         | ROOM    | ${ref:id:stock:Nortec:main:MAIN} | ${ref:id:user:john-doe} | 2024-03-06T03:00:00Z | 2024-03-06T03:00:00Z |
            | Green |             | HALLWAY | ${ref:id:stock:Nortec:main:MAIN} | ${ref:id:user:john-doe} | 2024-03-06T03:00:00Z | 2024-03-06T03:00:00Z |
            | Main  |             | OTHER   | ${ref:id:stock:Nortec:main:MAIN} | ${ref:id:user:john-doe} | 2024-03-06T03:00:00Z | 2024-03-06T03:00:00Z |

    Scenario: Preventing unauthorized users from viewing stocks
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "GET" request to "/stock"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Viewing stocks
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "GET" request to "/stock" with the query:
            | pagination.limit | 10 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:stock:Ecxus:main:MAIN}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": null,
                        "roomId": null,
                        "type": "MAIN",
                        "parentId": null,
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:stock:Ecxus:room:1}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": null,
                        "roomId": "${ref:id:room:Ecxus:1}",
                        "type": "ROOM",
                        "parentId": "${ref:id:stock:Ecxus:main:MAIN}",
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:stock:Ecxus:room:2}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": null,
                        "roomId": "${ref:id:room:Ecxus:2}",
                        "type": "ROOM",
                        "parentId": "${ref:id:stock:Ecxus:main:MAIN}",
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:stock:Ecxus:hallway:Red}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Red",
                        "roomId": null,
                        "type": "HALLWAY",
                        "parentId": "${ref:id:stock:Ecxus:main:MAIN}",
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    }
                ],
                "totalCount": 4,
                "nextCursor": null
            }
            """

    Scenario: Paginating stocks
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "GET" request to "/stock" with the query:
            | pagination.limit | 2                    |
            | pagination.sort  | {"createdAt": "asc"} |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:stock:Ecxus:main:MAIN}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": null,
                        "roomId": null,
                        "type": "MAIN",
                        "parentId": null,
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:stock:Ecxus:room:1}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": null,
                        "roomId": "${ref:id:room:Ecxus:1}",
                        "type": "ROOM",
                        "parentId": "${ref:id:stock:Ecxus:main:MAIN}",
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    }
                ],
                "totalCount": 4,
                "nextCursor": "${ref:var:lastResponse.nextCursor}"
            }
            """
        When I send a "GET" request to "/stock" with the query:
            | pagination.cursor | ${ref:var:lastResponse.nextCursor} |
            | pagination.limit  | 2                                  |
            | pagination.sort   | {"createdAt": "asc"}               |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:stock:Ecxus:room:2}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": null,
                        "roomId": "${ref:id:room:Ecxus:2}",
                        "type": "ROOM",
                        "parentId": "${ref:id:stock:Ecxus:main:MAIN}",
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:stock:Ecxus:hallway:Red}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Red",
                        "roomId": null,
                        "type": "HALLWAY",
                        "parentId": "${ref:id:stock:Ecxus:main:MAIN}",
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    }
                ],
                "totalCount": 4,
                "nextCursor": null
            }
            """

    Scenario: Filtering stocks
        Given I am signed in as "john-doe" in the company "Nortec"
        When I send a "GET" request to "/stock" with the query:
            | pagination.limit | 10                   |
            | pagination.sort  | {"createdAt": "asc"} |
            | type             | ROOM                 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:stock:Nortec:room:101}",
                        "companyId": "${ref:id:company:Nortec}",
                        "name": null,
                        "roomId": "${ref:id:room:Nortec:101}",
                        "type": "ROOM",
                        "parentId": "${ref:id:stock:Nortec:main:MAIN}",
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:stock:Nortec:room:102}",
                        "companyId": "${ref:id:company:Nortec}",
                        "name": null,
                        "roomId": "${ref:id:room:Nortec:102}",
                        "type": "ROOM",
                        "parentId": "${ref:id:stock:Nortec:main:MAIN}",
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    }
                ],
                "totalCount": 2,
                "nextCursor": null
            }
            """

    Scenario: Viewing a stock
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "GET" request to "/stock/${ref:id:stock:Ecxus:room:1}"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:stock:Ecxus:room:1}",
                "companyId": "${ref:id:company:Ecxus}",
                "name": null,
                "roomId": "${ref:id:room:Ecxus:1}",
                "type": "ROOM",
                "parentId": "${ref:id:stock:Ecxus:main:MAIN}",
                "createdAt": "2024-03-06T03:00:00.000Z",
                "updatedAt": "2024-03-06T03:00:00.000Z"
            }
            """

    Scenario: Viewing a stock that does not exist
        Given I am signed in as "john-doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            573a3ac3-a05a-48aa-80b1-1869a73bfe8c
            """
        When I send a "GET" request to "/stock/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Stock not found"
