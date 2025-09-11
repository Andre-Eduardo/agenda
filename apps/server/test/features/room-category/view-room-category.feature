Feature: View room category
    As a user, I want to view the room category and its details.

    Background:
        Given the following companies exist:
            | Name   |
            | Ecxus  |
            | Nortec |
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions          |
            | john_doe   | [room-category:view] |
            | william123 | []                   |
        And the following employees with system access in the company "Nortec" exist:
            | User     | Permissions          |
            | john_doe | [room-category:view] |
        And the following room categories exist in the company "Ecxus":
            | Name         | Acronym | Guest count | Created at               | Updated at               |
            | LUSH         | LS      | 1           | 2024-03-06T03:00:00.000Z | 2024-03-06T03:00:00.000Z |
            | ACQUA MARINE | AM      | 2           | 2024-03-06T02:00:00.000Z | 2024-03-06T02:00:00.000Z |
            | ROYAL GARDEN | RG      | 3           | 2024-03-06T01:00:00.000Z | 2024-03-06T01:00:00.000Z |
        And the following room categories exist in the company "Nortec":
            | Name         | Acronym | Guest count | Created at               | Updated at               |
            | DRONE        | DR      | 4           | 2024-03-06T03:00:00.000Z | 2024-03-06T03:00:00.000Z |
            | DRONE SUPER  | DS      | 3           | 2024-03-06T04:00:00.000Z | 2024-03-06T04:00:00.000Z |
            | ACQUA MARINE | AM      | 5           | 2024-03-06T02:00:00.000Z | 2024-03-06T02:00:00.000Z |

    Scenario: Preventing unauthorized users from viewing room categories
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "GET" request to "/room-category"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Viewing room categories
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/room-category" with the query:
            | pagination.limit | 10 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:roomCategory:Ecxus:LUSH}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "LUSH",
                        "acronym": "LS",
                        "guestCount": 1,
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:roomCategory:Ecxus:ACQUA MARINE}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "ACQUA MARINE",
                        "acronym": "AM",
                        "guestCount": 2,
                        "createdAt": "2024-03-06T02:00:00.000Z",
                        "updatedAt": "2024-03-06T02:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:roomCategory:Ecxus:ROYAL GARDEN}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "ROYAL GARDEN",
                        "acronym": "RG",
                        "guestCount": 3,
                        "createdAt": "2024-03-06T01:00:00.000Z",
                        "updatedAt": "2024-03-06T01:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Filtering room categories
        Given I am signed in as "john_doe" in the company "Nortec"
        When I send a "GET" request to "/room-category" with the query:
            | name             | DRO                 |
            | pagination.limit | 10                  |
            | pagination.sort  | {"acronym": "desc"} |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:roomCategory:Nortec:DRONE SUPER}",
                        "companyId": "${ref:id:company:Nortec}",
                        "name": "DRONE SUPER",
                        "acronym": "DS",
                        "guestCount": 3,
                        "createdAt": "2024-03-06T04:00:00.000Z",
                        "updatedAt": "2024-03-06T04:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:roomCategory:Nortec:DRONE}",
                        "companyId": "${ref:id:company:Nortec}",
                        "name": "DRONE",
                        "acronym": "DR",
                        "guestCount": 4,
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    }
                ],
                "totalCount": 2,
                "nextCursor": null
            }
            """

    Scenario: Paginating room categories
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/room-category" with the query:
            | pagination.limit | 2                    |
            | pagination.sort  | {"createdAt": "asc"} |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:roomCategory:Ecxus:ROYAL GARDEN}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "ROYAL GARDEN",
                        "acronym": "RG",
                        "guestCount": 3,
                        "createdAt": "2024-03-06T01:00:00.000Z",
                        "updatedAt": "2024-03-06T01:00:00.000Z"
                    },
                    {
                      "id": "${ref:id:roomCategory:Ecxus:ACQUA MARINE}",
                      "companyId": "${ref:id:company:Ecxus}",
                      "name": "ACQUA MARINE",
                      "acronym": "AM",
                      "guestCount": 2,
                      "createdAt": "2024-03-06T02:00:00.000Z",
                      "updatedAt": "2024-03-06T02:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": "${ref:var:lastResponse.nextCursor}"
            }
            """
        And I send a "GET" request to "/room-category" with the query:
            | pagination.cursor | ${ref:var:lastResponse.nextCursor} |
            | pagination.limit  | 2                                  |
            | pagination.sort   | {"createdAt": "asc"}               |
        And the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:roomCategory:Ecxus:LUSH}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "LUSH",
                        "acronym": "LS",
                        "guestCount": 1,
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Viewing a room category
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/room-category/${ref:id:roomCategory:Ecxus:LUSH}"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:roomCategory:Ecxus:LUSH}",
                "companyId": "${ref:id:company:Ecxus}",
                "name": "LUSH",
                "acronym": "LS",
                "guestCount": 1,
                "createdAt": "2024-03-06T03:00:00.000Z",
                "updatedAt": "2024-03-06T03:00:00.000Z"
            }
            """

    Scenario: Viewing a room category that does not exist
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            573a3ac3-a05a-48aa-80b1-1869a73bfe8c
            """
        When I send a "GET" request to "/room-category/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Room category not found"
