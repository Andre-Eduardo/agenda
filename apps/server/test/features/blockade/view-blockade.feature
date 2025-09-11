Feature: View blockade
    As a user, I want to view the blockade and its details

    Background:
        Given the following companies exist:
            | Name   |
            | Ecxus  |
            | Nortec |
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions     |
            | john       | [blockade:view] |
            | william123 | []              |
        And the following employees with system access in the company "Nortec" exist:
            | User     | Permissions     |
            | john_doe | [blockade:view] |
        And a room category with name "Luxo" in the company "Ecxus" exists
        And a room category with name "Super Luxo" in the company "Nortec" exists
        And the following rooms exist in the company "Ecxus" and room category "Luxo":
            | Number |
            | 1      |
        And the following rooms exist in the company "Nortec" and room category "Super Luxo":
            | Number |
            | 15     |
            | 16     |
        And the following defect types exist in the company "Nortec":
            | Name  |
            | Door  |
            | Light |
        And the following defect types exist in the company "Ecxus":
            | Name |
            | TV   |
        And the following defects exist in the company "Nortec":
            | Note                | Room | Defect Type | Created by ID           | Created at           | Updated at           |
            | The door is broken  | 15   | Door        | ${ref:id:user:john_doe} | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | The light is broken | 16   | Light       | ${ref:id:user:john_doe} | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
        And the following defects exist in the company "Ecxus":
            | Note             | Room | Defect Type | Created by ID       | Created at           | Updated at           |
            | The TV is broken | 1    | TV          | ${ref:id:user:john} | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
        And the following blockades exist in the company "Nortec":
            | Room | Start user ID           | Started at               | Created at               | Updated at               | Note               | Defects                              |
            | 15   | ${ref:id:user:john_doe} | 2024-01-01T01:00:00.000Z | 2024-01-01T01:00:00.000Z | 2024-01-01T01:00:00.000Z | The door is broken | ["${ref:id:defect:Nortec:15:Door}"]  |
            | 16   | ${ref:id:user:john_doe} | 2024-01-01T01:00:00.000Z | 2024-01-01T01:00:00.000Z | 2024-01-01T01:00:00.000Z | The light is off   | ["${ref:id:defect:Nortec:16:Light}"] |
        And the following blockades exist in the company "Ecxus":
            | Room | Start user ID       | Started at               | Created at               | Updated at               | Note      | Defects                         |
            | 1    | ${ref:id:user:john} | 2024-01-01T01:00:00.000Z | 2024-01-01T01:00:00.000Z | 2024-01-01T01:00:00.000Z | TV broken | ["${ref:id:defect:Ecxus:1:TV}"] |

    Scenario: Preventing unauthorized users from viewing blockades
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "GET" request to "/blockade"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Viewing blockades
        Given I am signed in as "john_doe" in the company "Nortec"
        When I send a "GET" request to "/blockade" with the query:
            | pagination.limit | 10 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:blockade:Nortec:15}",
                        "companyId": "${ref:id:company:Nortec}",
                        "roomId": "${ref:id:room:Nortec:15}",
                        "note": "The door is broken",
                        "defects": [
                            {
                                "id": "${ref:id:defect:Nortec:15:Door}",
                                "createdAt": "2020-01-01T01:00:00.000Z",
                                "updatedAt": "2020-01-01T01:00:00.000Z",
                                "companyId": "${ref:id:company:Nortec}",
                                "note": "The door is broken",
                                "roomId": "${ref:id:room:Nortec:15}",
                                "defectTypeId": "${ref:id:defectType:Nortec:Door}",
                                "createdById": "${ref:id:user:john_doe}",
                                "finishedById": null,
                                "finishedAt": null
                            }
                        ],
                        "finishedAt": null,
                        "startedById": "${ref:id:user:john_doe}",
                        "finishedById": null,
                        "startedAt": "2024-01-01T01:00:00.000Z",
                        "createdAt": "2024-01-01T01:00:00.000Z",
                        "updatedAt": "2024-01-01T01:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:blockade:Nortec:16}",
                        "companyId": "${ref:id:company:Nortec}",
                        "roomId": "${ref:id:room:Nortec:16}",
                        "note": "The light is off",
                        "defects": [
                            {
                                "id": "${ref:id:defect:Nortec:16:Light}",
                                "createdAt": "2020-01-01T01:00:00.000Z",
                                "updatedAt": "2020-01-01T01:00:00.000Z",
                                "companyId": "${ref:id:company:Nortec}",
                                "note": "The light is broken",
                                "roomId": "${ref:id:room:Nortec:16}",
                                "defectTypeId": "${ref:id:defectType:Nortec:Light}",
                                "createdById": "${ref:id:user:john_doe}",
                                "finishedById": null,
                                "finishedAt": null
                            }
                        ],
                        "finishedAt": null,
                        "startedById": "${ref:id:user:john_doe}",
                        "finishedById": null,
                        "startedAt": "2024-01-01T01:00:00.000Z",
                        "createdAt": "2024-01-01T01:00:00.000Z",
                        "updatedAt": "2024-01-01T01:00:00.000Z"
                    }
                ],
                "totalCount": 2,
                "nextCursor": null
            }
            """

    Scenario: Filtering blockades
        Given I am signed in as "john_doe" in the company "Nortec"
        When I send a "GET" request to "/blockade" with the query:
            | roomId           | "${ref:id:room:Nortec:15}" |
            | pagination.limit | 10                         |
            | pagination.sort  | {"createdAt": "asc"}       |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:blockade:Nortec:15}",
                        "companyId": "${ref:id:company:Nortec}",
                        "roomId": "${ref:id:room:Nortec:15}",
                        "note": "The door is broken",
                        "defects": [
                            {
                                "id": "${ref:id:defect:Nortec:15:Door}",
                                "createdAt": "2020-01-01T01:00:00.000Z",
                                "updatedAt": "2020-01-01T01:00:00.000Z",
                                "companyId": "${ref:id:company:Nortec}",
                                "note": "The door is broken",
                                "roomId": "${ref:id:room:Nortec:15}",
                                "defectTypeId": "${ref:id:defectType:Nortec:Door}",
                                "createdById": "${ref:id:user:john_doe}",
                                "finishedById": null,
                                "finishedAt": null
                            }
                        ],
                        "finishedAt": null,
                        "startedById": "${ref:id:user:john_doe}",
                        "finishedById": null,
                        "startedAt": "2024-01-01T01:00:00.000Z",
                        "createdAt": "2024-01-01T01:00:00.000Z",
                        "updatedAt": "2024-01-01T01:00:00.000Z"
                    }
                ],
                "totalCount": 1,
                "nextCursor": null
            }
            """

    Scenario: Paginating blockades
        Given I am signed in as "john_doe" in the company "Nortec"
        When I send a "GET" request to "/blockade" with the query:
            | pagination.limit | 1                    |
            | pagination.sort  | {"createdAt": "asc"} |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:blockade:Nortec:15}",
                        "companyId": "${ref:id:company:Nortec}",
                        "roomId": "${ref:id:room:Nortec:15}",
                        "note": "The door is broken",
                        "defects": [
                            {
                                "id": "${ref:id:defect:Nortec:15:Door}",
                                "createdAt": "2020-01-01T01:00:00.000Z",
                                "updatedAt": "2020-01-01T01:00:00.000Z",
                                "companyId": "${ref:id:company:Nortec}",
                                "note": "The door is broken",
                                "roomId": "${ref:id:room:Nortec:15}",
                                "defectTypeId": "${ref:id:defectType:Nortec:Door}",
                                "createdById": "${ref:id:user:john_doe}",
                                "finishedById": null,
                                "finishedAt": null
                            }
                        ],
                        "finishedAt": null,
                        "startedById": "${ref:id:user:john_doe}",
                        "finishedById": null,
                        "startedAt": "2024-01-01T01:00:00.000Z",
                        "createdAt": "2024-01-01T01:00:00.000Z",
                        "updatedAt": "2024-01-01T01:00:00.000Z"
                    }
                ],
                "totalCount": 2,
                "nextCursor": "${ref:var:lastResponse.nextCursor}"
            }
            """
        When I send a "GET" request to "/blockade" with the query:
            | pagination.cursor | ${ref:var:lastResponse.nextCursor} |
            | pagination.limit  | 1                                  |
            | pagination.sort   | {"createdAt": "asc"}               |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:blockade:Nortec:16}",
                        "companyId": "${ref:id:company:Nortec}",
                        "roomId": "${ref:id:room:Nortec:16}",
                        "note": "The light is off",
                        "defects": [
                            {
                                "id": "${ref:id:defect:Nortec:16:Light}",
                                "createdAt": "2020-01-01T01:00:00.000Z",
                                "updatedAt": "2020-01-01T01:00:00.000Z",
                                "companyId": "${ref:id:company:Nortec}",
                                "note": "The light is broken",
                                "roomId": "${ref:id:room:Nortec:16}",
                                "defectTypeId": "${ref:id:defectType:Nortec:Light}",
                                "createdById": "${ref:id:user:john_doe}",
                                "finishedById": null,
                                "finishedAt": null
                            }
                        ],
                        "finishedAt": null,
                        "startedById": "${ref:id:user:john_doe}",
                        "finishedById": null,
                        "startedAt": "2024-01-01T01:00:00.000Z",
                        "createdAt": "2024-01-01T01:00:00.000Z",
                        "updatedAt": "2024-01-01T01:00:00.000Z"
                    }
                ],
                "totalCount": 2,
                "nextCursor": null
            }
            """

    Scenario: Viewing a blockade
        Given I am signed in as "john" in the company "Ecxus"
        When I send a "GET" request to "/blockade/${ref:id:blockade:Ecxus:1}"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:blockade:Ecxus:1}",
                "companyId": "${ref:id:company:Ecxus}",
                "roomId": "${ref:id:room:Ecxus:1}",
                "note": "TV broken",
                "defects": [
                    {
                        "id": "${ref:id:defect:Ecxus:1:TV}",
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z",
                        "companyId": "${ref:id:company:Ecxus}",
                        "note": "The TV is broken",
                        "roomId": "${ref:id:room:Ecxus:1}",
                        "defectTypeId": "${ref:id:defectType:Ecxus:TV}",
                        "createdById": "${ref:id:user:john}",
                        "finishedById": null,
                        "finishedAt": null
                    }
                ],
                "finishedAt": null,
                "startedById": "${ref:id:user:john}",
                "finishedById": null,
                "startedAt": "2024-01-01T01:00:00.000Z",
                "createdAt": "2024-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T01:00:00.000Z"
            }
            """

    Scenario: Viewing an open blockade of a room
        Given I am signed in as "john" in the company "Ecxus"
        When I send a "GET" request to "/blockade/room/${ref:id:room:Ecxus:1}"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:blockade:Ecxus:1}",
                "companyId": "${ref:id:company:Ecxus}",
                "roomId": "${ref:id:room:Ecxus:1}",
                "note": "TV broken",
                "defects": [
                    {
                        "id": "${ref:id:defect:Ecxus:1:TV}",
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z",
                        "companyId": "${ref:id:company:Ecxus}",
                        "note": "The TV is broken",
                        "roomId": "${ref:id:room:Ecxus:1}",
                        "defectTypeId": "${ref:id:defectType:Ecxus:TV}",
                        "createdById": "${ref:id:user:john}",
                        "finishedById": null,
                        "finishedAt": null
                    }
                ],
                "finishedAt": null,
                "startedById": "${ref:id:user:john}",
                "finishedById": null,
                "startedAt": "2024-01-01T01:00:00.000Z",
                "createdAt": "2024-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T01:00:00.000Z"
            }
            """

    Scenario: Viewing a blockade that does not exist
        Given I am signed in as "john" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            573a3ac3-a05a-48aa-80b1-1869a73bfe8c
            """
        When I send a "GET" request to "/blockade/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Blockade not found"

    Scenario: Viewing a non-existent blockade of a room
        Given I am signed in as "john" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            573a3ac3-a05a-48aa-80b1-1869a73bfe8c
            """
        When I send a "GET" request to "/blockade/room/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "No blockade found for the room."
