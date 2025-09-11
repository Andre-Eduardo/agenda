Feature: View deep cleaning
    As a user, I want to view the deep cleaning and its details

    Background:
        Given the following companies exist:
            | Name   |
            | Ecxus  |
            | Nortec |
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions          |
            | john-doe   | [deep-cleaning:view] |
            | william123 | []                   |
        And the following employees with system access in the company "Nortec" exist:
            | User     | Permissions          |
            | john-doe | [deep-cleaning:view] |
        And a room category with name "Luxo" in the company "Ecxus" exists
        And a room category with name "Super Luxo" in the company "Nortec" exists
        And the following rooms exist in the company "Ecxus" and room category "Luxo":
            | Number |
            | 1      |
            | 3      |
        And the following rooms exist in the company "Nortec" and room category "Super Luxo":
            | Number |
            | 15     |
            | 16     |
        And the following deep cleanings exist in the company "Ecxus":
            | Room | Start user ID           | Created at           | Started at           | Updated at           |
            | 1    | ${ref:id:user:john-doe} | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
        And the following deep cleanings exist in the company "Nortec":
            | Room | Start user ID           | Created at           | Started at           | End Reason | Finished at          | Updated at           | Finish user ID          |
            | 15   | ${ref:id:user:john-doe} | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z | CANCELED   | 2024-01-01T03:00:00Z | 2024-01-01T03:00:00Z | ${ref:id:user:john-doe} |
            | 16   | ${ref:id:user:john-doe} | 2020-01-01T02:00:00Z | 2020-01-01T02:00:00Z | FINISHED   | 2024-01-01T03:00:00Z | 2024-01-01T03:00:00Z | ${ref:id:user:john-doe} |

    Scenario: Preventing unauthorized users from viewing deep cleanings
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "GET" request to "/deep-cleaning"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Viewing deep cleanings
        Given I am signed in as "john-doe" in the company "Nortec"
        When I send a "GET" request to "/deep-cleaning" with the query:
            | pagination.limit | 5 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:deepCleaning:Nortec:15}",
                        "companyId": "${ref:id:company:Nortec}",
                        "roomId": "${ref:id:room:Nortec:15}",
                        "startedById": "${ref:id:user:john-doe}",
                        "startedAt": "2020-01-01T01:00:00.000Z",
                        "finishedById": "${ref:id:user:john-doe}",
                        "endReason": "CANCELED",
                        "finishedAt": "2024-01-01T03:00:00.000Z",
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2024-01-01T03:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:deepCleaning:Nortec:16}",
                        "companyId": "${ref:id:company:Nortec}",
                        "roomId": "${ref:id:room:Nortec:16}",
                        "startedById": "${ref:id:user:john-doe}",
                        "startedAt": "2020-01-01T02:00:00.000Z",
                        "finishedById": "${ref:id:user:john-doe}",
                        "endReason": "FINISHED",
                        "finishedAt": "2024-01-01T03:00:00.000Z",
                        "createdAt": "2020-01-01T02:00:00.000Z",
                        "updatedAt": "2024-01-01T03:00:00.000Z"
                    }
                ],
                "totalCount": 2,
                "nextCursor": null
            }
            """

    Scenario: Filtering deep cleanings
        Given I am signed in as "john-doe" in the company "Nortec"
        When I send a "GET" request to "/deep-cleaning" with the query:
            | endReason        | FINISHED             |
            | pagination.limit | 10                   |
            | pagination.sort  | {"createdAt": "asc"} |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:deepCleaning:Nortec:16}",
                        "companyId": "${ref:id:company:Nortec}",
                        "roomId": "${ref:id:room:Nortec:16}",
                        "startedById": "${ref:id:user:john-doe}",
                        "startedAt": "2020-01-01T02:00:00.000Z",
                        "endReason": "FINISHED",
                        "finishedById": "${ref:id:user:john-doe}",
                        "finishedAt": "2024-01-01T03:00:00.000Z",
                        "createdAt": "2020-01-01T02:00:00.000Z",
                        "updatedAt": "2024-01-01T03:00:00.000Z"
                    }
                ],
                "totalCount": 1,
                "nextCursor": null
            }
            """

    Scenario: Paginating deep cleanings
        Given I am signed in as "john-doe" in the company "Nortec"
        When I send a "GET" request to "/deep-cleaning" with the query:
            | pagination.limit | 1                    |
            | pagination.sort  | {"createdAt": "asc"} |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:deepCleaning:Nortec:15}",
                        "companyId": "${ref:id:company:Nortec}",
                        "roomId": "${ref:id:room:Nortec:15}",
                        "startedById": "${ref:id:user:john-doe}",
                        "startedAt": "2020-01-01T01:00:00.000Z",
                        "finishedById": "${ref:id:user:john-doe}",
                        "endReason": "CANCELED",
                        "finishedAt": "2024-01-01T03:00:00.000Z",
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2024-01-01T03:00:00.000Z"
                    }
                ],
                "totalCount": 2,
                "nextCursor": "${ref:var:lastResponse.nextCursor}"
            }
            """
        When I send a "GET" request to "/deep-cleaning" with the query:
            | pagination.cursor | ${ref:var:lastResponse.nextCursor} |
            | pagination.limit  | 1                                  |
            | pagination.sort   | {"createdAt": "asc"}               |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                   {
                        "id": "${ref:id:deepCleaning:Nortec:16}",
                        "companyId": "${ref:id:company:Nortec}",
                        "roomId": "${ref:id:room:Nortec:16}",
                        "startedById": "${ref:id:user:john-doe}",
                        "startedAt": "2020-01-01T02:00:00.000Z",
                        "finishedById": "${ref:id:user:john-doe}",
                        "endReason": "FINISHED",
                        "finishedAt": "2024-01-01T03:00:00.000Z",
                        "createdAt": "2020-01-01T02:00:00.000Z",
                        "updatedAt": "2024-01-01T03:00:00.000Z"
                    }
                ],
                "totalCount": 2,
                "nextCursor": null
            }
            """

    Scenario: Viewing a deep cleaning
        Given I am signed in as "john-doe" in the company "Nortec"
        When I send a "GET" request to "/deep-cleaning/${ref:id:deepCleaning:Nortec:15}"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:deepCleaning:Nortec:15}",
                "companyId": "${ref:id:company:Nortec}",
                "roomId": "${ref:id:room:Nortec:15}",
                "startedById": "${ref:id:user:john-doe}",
                "startedAt": "2020-01-01T01:00:00.000Z",
                "finishedById": "${ref:id:user:john-doe}",
                "endReason": "CANCELED",
                "finishedAt": "2024-01-01T03:00:00.000Z",
                "createdAt": "2020-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T03:00:00.000Z"
            }
            """

    Scenario: Viewing a deep cleaning by room
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "GET" request to "/deep-cleaning/room/${ref:id:room:Ecxus:1}"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:deepCleaning:Ecxus:1}",
                "companyId": "${ref:id:company:Ecxus}",
                "roomId": "${ref:id:room:Ecxus:1}",
                "startedById": "${ref:id:user:john-doe}",
                "startedAt": "2020-01-01T01:00:00.000Z",
                "finishedById": null,
                "endReason": null,
                "finishedAt": null,
                "createdAt": "2020-01-01T01:00:00.000Z",
                "updatedAt": "2020-01-01T01:00:00.000Z"
            }
            """

    Scenario: Viewing a deep cleaning by room that does not exist
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "GET" request to "/deep-cleaning/room/${ref:id:room:Ecxus:3}"
        Then I should receive a resource not found error on "${ref:id:room:Ecxus:3}" with reason "Deep cleaning not found in room"

    Scenario: Viewing a deep cleaning that does not exist
        Given I am signed in as "john-doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            573a3ac3-a05a-48aa-80b1-1869a73bfe8c
            """
        When I send a "GET" request to "/deep-cleaning/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Deep cleaning not found"
