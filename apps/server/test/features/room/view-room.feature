Feature: View room
    As a user, I want to view the room and its details.

    Background:
        Given the following companies exist:
            | Name   |
            | Ecxus  |
            | Nortec |
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions |
            | john_doe   | [room:view] |
            | william123 | []          |
        And the following employees with system access in the company "Nortec" exist:
            | User     | Permissions |
            | john_doe | [room:view] |
        And a room category with name "Lush" in the company "Ecxus" exists
        And a room category with name "Premium" in the company "Nortec" exists
        And a room category with name "Pride" in the company "Nortec" exists
        And the following rooms exist in the company "Ecxus" and room category "Lush":
            | Number | Name    | State    | Created at               | Updated at               |
            | 1      | Suite 1 | VACANT   | 2024-03-06T03:00:00.000Z | 2024-03-06T03:00:00.000Z |
            | 2      | Suite 2 | OCCUPIED | 2024-03-06T02:00:00.000Z | 2024-03-06T02:00:00.000Z |
            | 3      | Suite 3 | DIRTY    | 2024-03-06T01:00:00.000Z | 2024-03-06T01:00:00.000Z |
        And the following rooms exist in the company "Nortec" and room category "Pride":
            | Number | Name    | State         | Created at               | Updated at               |
            | 101    | Suite 1 | CLEANING      | 2024-03-06T03:00:00.000Z | 2024-03-06T03:00:00.000Z |
            | 102    | Suite 2 | DEEP_CLEANING | 2024-03-06T02:00:00.000Z | 2024-03-06T02:00:00.000Z |
            | 103    | Suite 3 | BLOCKED       | 2024-03-06T01:00:00.000Z | 2024-03-06T01:00:00.000Z |
        And the following rooms exist in the company "Nortec" and room category "Premium":
            | Number | Name    | State | Created at               | Updated at               |
            | 104    | Suite 4 | AUDIT | 2024-03-06T03:00:00.000Z | 2024-03-06T03:00:00.000Z |

    Scenario: Preventing unauthorized users from viewing rooms
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "GET" request to "/room"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Viewing rooms
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/room" with the query:
            | pagination.limit | 10 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:room:Ecxus:1}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "categoryId": "${ref:id:roomCategory:Ecxus:Lush}",
                        "name": "Suite 1",
                        "number": 1,
                        "state": "VACANT",
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:room:Ecxus:2}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "categoryId": "${ref:id:roomCategory:Ecxus:Lush}",
                        "name": "Suite 2",
                        "number": 2,
                        "state": "OCCUPIED",
                        "createdAt": "2024-03-06T02:00:00.000Z",
                        "updatedAt": "2024-03-06T02:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:room:Ecxus:3}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "categoryId": "${ref:id:roomCategory:Ecxus:Lush}",
                        "name": "Suite 3",
                        "number": 3,
                        "state": "DIRTY",
                        "createdAt": "2024-03-06T01:00:00.000Z",
                        "updatedAt": "2024-03-06T01:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Paginating rooms
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/room" with the query:
            | pagination.limit | 2                    |
            | pagination.sort  | {"createdAt": "asc"} |
        And the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:room:Ecxus:3}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "categoryId": "${ref:id:roomCategory:Ecxus:Lush}",
                        "name": "Suite 3",
                        "number": 3,
                        "state": "DIRTY",
                        "createdAt": "2024-03-06T01:00:00.000Z",
                        "updatedAt": "2024-03-06T01:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:room:Ecxus:2}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "categoryId": "${ref:id:roomCategory:Ecxus:Lush}",
                        "name": "Suite 2",
                        "number": 2,
                        "state": "OCCUPIED",
                        "createdAt": "2024-03-06T02:00:00.000Z",
                        "updatedAt": "2024-03-06T02:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": "${ref:var:lastResponse.nextCursor}"
            }
            """
        And I send a "GET" request to "/room" with the query:
            | pagination.cursor | "${ref:var:lastResponse.nextCursor}" |
            | pagination.limit  | 2                                    |
            | pagination.sort   | {"createdAt": "asc"}                 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:room:Ecxus:1}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "categoryId": "${ref:id:roomCategory:Ecxus:Lush}",
                        "name": "Suite 1",
                        "number": 1,
                        "state": "VACANT",
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Filtering rooms
        Given I am signed in as "john_doe" in the company "Nortec"
        When I send a "GET" request to "/room" with the query:
            | categoryId       | ${ref:id:roomCategory:Nortec:Pride} |
            | name             | Suite                               |
            | pagination.limit | 10                                  |
            | pagination.sort  | {"name": "desc"}                    |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:room:Nortec:103}",
                        "companyId": "${ref:id:company:Nortec}",
                        "categoryId": "${ref:id:roomCategory:Nortec:Pride}",
                        "name": "Suite 3",
                        "number": 103,
                        "state": "BLOCKED",
                        "createdAt": "2024-03-06T01:00:00.000Z",
                        "updatedAt": "2024-03-06T01:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:room:Nortec:102}",
                        "companyId": "${ref:id:company:Nortec}",
                        "categoryId": "${ref:id:roomCategory:Nortec:Pride}",
                        "name": "Suite 2",
                        "number": 102,
                        "state": "DEEP_CLEANING",
                        "createdAt": "2024-03-06T02:00:00.000Z",
                        "updatedAt": "2024-03-06T02:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:room:Nortec:101}",
                        "companyId": "${ref:id:company:Nortec}",
                        "categoryId": "${ref:id:roomCategory:Nortec:Pride}",
                        "name": "Suite 1",
                        "number": 101,
                        "state": "CLEANING",
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Viewing a room
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/room/${ref:id:room:Ecxus:1}"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:room:Ecxus:1}",
                "companyId": "${ref:id:company:Ecxus}",
                "categoryId": "${ref:id:roomCategory:Ecxus:Lush}",
                "name": "Suite 1",
                "number": 1,
                "state": "VACANT",
                "createdAt": "2024-03-06T03:00:00.000Z",
                "updatedAt": "2024-03-06T03:00:00.000Z"
            }
            """

    Scenario: Viewing a room that does not exist
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            573a3ac3-a05a-48aa-80b1-1869a73bfe8c
            """
        When I send a "GET" request to "/room/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Room not found"
