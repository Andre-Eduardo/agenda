Feature: View defect
    As a user, I want to view the defect and its details.

    Background:
        Given the following companies exist:
            | Name   |
            | Ecxus  |
            | Nortec |
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions   |
            | john-doe   | [defect:view] |
            | william123 | []            |
        And the following employees with system access in the company "Nortec" exist:
            | User     | Permissions   |
            | john-doe | [defect:view] |
        And a room category with name "Lush" in the company "Ecxus" exists
        And a room category with name "Basic" in the company "Nortec" exists
        And the following rooms exist in the company "Ecxus" and room category "Lush":
            | Number | Name    |
            | 1      | Suite 1 |
        And the following rooms exist in the company "Nortec" and room category "Basic":
            | Number | Name    |
            | 2      | Suite 2 |
        And the following defect types exist in the company "Ecxus":
            | Name  |
            | Door  |
            | TV    |
            | Light |
        And the following defect types exist in the company "Nortec":
            | Name   |
            | Fridge |
            | Tray   |
        And the following defects exist in the company "Ecxus":
            | Note               | Room | Defect Type | Created by ID           | Created at           | Updated at           |
            | The door is broken | 1    | Door        | ${ref:id:user:john-doe} | 2024-03-06T03:00:00Z | 2024-03-06T03:00:00Z |
            | The TV is broken   | 1    | TV          | ${ref:id:user:john-doe} | 2024-03-06T03:00:00Z | 2024-03-06T03:00:00Z |
            | The light is off   | 1    | Light       | ${ref:id:user:john-doe} | 2024-03-06T03:00:00Z | 2024-03-06T03:00:00Z |
        And the following defects exist in the company "Nortec":
            | Note                  | Room | Defect Type | Created by ID           | Created at           | Updated at           |
            | The fridge is offline | 2    | Fridge      | ${ref:id:user:john-doe} | 2024-03-06T03:00:00Z | 2024-03-06T03:00:00Z |
            | The tray is offline   | 2    | Tray        | ${ref:id:user:john-doe} | 2024-03-06T03:00:00Z | 2024-03-06T03:00:00Z |

    Scenario: Preventing unauthorized users from viewing defects
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "GET" request to "/defect"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Viewing defects
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "GET" request to "/defect" with the query:
            | pagination.limit | 10 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:defect:Ecxus:1:Door}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "note": "The door is broken",
                        "roomId": "${ref:id:room:Ecxus:1}",
                        "defectTypeId": "${ref:id:defectType:Ecxus:Door}",
                        "createdById": "${ref:id:user:john-doe}",
                        "finishedById": null,
                        "finishedAt": null,
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:defect:Ecxus:1:TV}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "note": "The TV is broken",
                        "roomId": "${ref:id:room:Ecxus:1}",
                        "defectTypeId": "${ref:id:defectType:Ecxus:TV}",
                        "createdById": "${ref:id:user:john-doe}",
                        "finishedById": null,
                        "finishedAt": null,
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:defect:Ecxus:1:Light}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "note": "The light is off",
                        "roomId": "${ref:id:room:Ecxus:1}",
                        "defectTypeId": "${ref:id:defectType:Ecxus:Light}",
                        "createdById": "${ref:id:user:john-doe}",
                        "finishedById": null,
                        "finishedAt": null,
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Paginating defects
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "GET" request to "/defect" with the query:
            | pagination.limit | 2                    |
            | pagination.sort  | {"createdAt": "asc"} |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:defect:Ecxus:1:Door}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "note": "The door is broken",
                        "roomId": "${ref:id:room:Ecxus:1}",
                        "defectTypeId": "${ref:id:defectType:Ecxus:Door}",
                        "createdById": "${ref:id:user:john-doe}",
                        "finishedById": null,
                        "finishedAt": null,
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:defect:Ecxus:1:TV}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "note": "The TV is broken",
                        "roomId": "${ref:id:room:Ecxus:1}",
                        "defectTypeId": "${ref:id:defectType:Ecxus:TV}",
                        "createdById": "${ref:id:user:john-doe}",
                        "finishedById": null,
                        "finishedAt": null,
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": "${ref:var:lastResponse.nextCursor}"
            }
            """
        When I send a "GET" request to "/defect" with the query:
            | pagination.cursor | ${ref:var:lastResponse.nextCursor} |
            | pagination.limit  | 2                                  |
            | pagination.sort   | {"createdAt": "asc"}               |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:defect:Ecxus:1:Light}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "note": "The light is off",
                        "roomId": "${ref:id:room:Ecxus:1}",
                        "defectTypeId": "${ref:id:defectType:Ecxus:Light}",
                        "createdById": "${ref:id:user:john-doe}",
                        "finishedById": null,
                        "finishedAt": null,
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Filtering defects
        Given I am signed in as "john-doe" in the company "Nortec"
        When I send a "GET" request to "/defect" with the query:
            | note             | offline              |
            | pagination.limit | 10                   |
            | pagination.sort  | {"createdAt": "asc"} |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:defect:Nortec:2:Fridge}",
                        "companyId": "${ref:id:company:Nortec}",
                        "note": "The fridge is offline",
                        "roomId": "${ref:id:room:Nortec:2}",
                        "defectTypeId": "${ref:id:defectType:Nortec:Fridge}",
                        "createdById": "${ref:id:user:john-doe}",
                        "finishedById": null,
                        "finishedAt": null,
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:defect:Nortec:2:Tray}",
                        "companyId": "${ref:id:company:Nortec}",
                        "note": "The tray is offline",
                        "roomId": "${ref:id:room:Nortec:2}",
                        "defectTypeId": "${ref:id:defectType:Nortec:Tray}",
                        "createdById": "${ref:id:user:john-doe}",
                        "finishedById": null,
                        "finishedAt": null,
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    }
                ],
                "totalCount": 2,
                "nextCursor": null
            }
            """

    Scenario: Viewing a defect
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "GET" request to "/defect/${ref:id:defect:Ecxus:1:Door}"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:defect:Ecxus:1:Door}",
                "companyId": "${ref:id:company:Ecxus}",
                "note": "The door is broken",
                "roomId": "${ref:id:room:Ecxus:1}",
                "defectTypeId": "${ref:id:defectType:Ecxus:Door}",
                "createdById": "${ref:id:user:john-doe}",
                "finishedById": null,
                "finishedAt": null,
                "createdAt": "2024-03-06T03:00:00.000Z",
                "updatedAt": "2024-03-06T03:00:00.000Z"
            }
            """

    Scenario: Viewing a defect that does not exist
        Given I am signed in as "john-doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            573a3ac3-a05a-48aa-80b1-1869a73bfe8c
            """
        When I send a "GET" request to "/defect/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Defect not found"
