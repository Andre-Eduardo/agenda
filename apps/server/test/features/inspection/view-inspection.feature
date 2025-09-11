Feature: View inspection
    As a user, I want to find an inspection and view its details

    Background:
        Given the following companies exist:
            | Name  |
            | Ecxus |
            | Meta  |
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions                                              |
            | john-doe   | [inspection:view, inspection:approve, inspection:reject] |
            | anaa123    | []                                                       |
            | william123 | [inspection:view, inspection:approve, inspection:reject] |
        And the following employees with system access in the company "Meta" exist:
            | User  | Permissions       |
            | lucas | [inspection:view] |
        And a room category with name "Lush" in the company "Ecxus" exists
        And the following rooms exist in the company "Ecxus" and room category "Lush":
            | Number | State      |
            | 123    | VACANT     |
            | 456    | DIRTY      |
            | 789    | INSPECTION |
        And the following inspections exist in the company "Ecxus":
            | Room | Start user ID             | End user ID             | Started at           | Finished at          | End Reason | Created at           | Updated at           |
            | 123  | ${ref:id:user:john-doe}   | ${ref:id:user:john-doe} | 2020-01-01T01:00:00Z | 2024-01-01T05:00:00Z | APPROVED   | 2020-01-01T01:00:00Z | 2024-01-01T05:00:00Z |
            | 456  | ${ref:id:user:william123} | ${ref:id:user:john-doe} | 2020-01-01T02:00:00Z | 2024-01-01T05:00:00Z | REJECTED   | 2020-01-01T02:00:00Z | 2020-01-01T02:00:00Z |
            | 789  | ${ref:id:user:william123} |                         | 2020-01-01T03:00:00Z |                      |            | 2020-01-01T03:00:00Z | 2020-01-01T03:00:00Z |

    Scenario: Preventing unauthorized users from viewing inspections
        Given I am signed in as "anaa123" in the company "Ecxus"
        When I send a "GET" request to "/inspection"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Viewing inspections
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "GET" request to "/inspection" with the query:
            | pagination.limit | 10 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:inspection:Ecxus:123}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "roomId": "${ref:id:room:Ecxus:123}",
                        "startedById": "${ref:id:user:john-doe}",
                        "startedAt": "2020-01-01T01:00:00.000Z",
                        "finishedById":"${ref:id:user:john-doe}",
                        "finishedAt": "2024-01-01T05:00:00.000Z",
                        "note": null,
                        "endReason": "APPROVED",
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2024-01-01T05:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:inspection:Ecxus:456}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "roomId": "${ref:id:room:Ecxus:456}",
                        "startedById": "${ref:id:user:william123}",
                        "startedAt": "2020-01-01T02:00:00.000Z",
                        "finishedById": "${ref:id:user:john-doe}",
                        "finishedAt": "2024-01-01T05:00:00.000Z",
                        "note": null,
                        "endReason": "REJECTED",
                        "createdAt": "2020-01-01T02:00:00.000Z",
                        "updatedAt": "2020-01-01T02:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:inspection:Ecxus:789}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "roomId": "${ref:id:room:Ecxus:789}",
                        "startedById": "${ref:id:user:william123}",
                        "startedAt": "2020-01-01T03:00:00.000Z",
                        "finishedById": null,
                        "finishedAt": null,
                        "note": null,
                        "endReason": null,
                        "createdAt": "2020-01-01T03:00:00.000Z",
                        "updatedAt": "2020-01-01T03:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Filtering inspections
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "GET" request to "/inspection" with the query:
            | endReason        | REJECTED             |
            | pagination.limit | 10                   |
            | pagination.sort  | {"createdAt": "asc"} |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:inspection:Ecxus:456}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "roomId": "${ref:id:room:Ecxus:456}",
                        "startedById": "${ref:id:user:william123}",
                        "startedAt": "2020-01-01T02:00:00.000Z",
                        "finishedById": "${ref:id:user:john-doe}",
                        "finishedAt": "2024-01-01T05:00:00.000Z",
                        "note": null,
                        "endReason": "REJECTED",
                        "createdAt": "2020-01-01T02:00:00.000Z",
                        "updatedAt": "2020-01-01T02:00:00.000Z"
                    }
                ],
                "totalCount": 1,
                "nextCursor": null
            }
            """

    Scenario: Paginating inspections
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "GET" request to "/inspection" with the query:
            | pagination.limit | 2                    |
            | pagination.sort  | {"createdAt": "asc"} |
        And the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:inspection:Ecxus:123}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "roomId": "${ref:id:room:Ecxus:123}",
                        "startedById": "${ref:id:user:john-doe}",
                        "startedAt": "2020-01-01T01:00:00.000Z",
                        "finishedById": "${ref:id:user:john-doe}",
                        "finishedAt": "2024-01-01T05:00:00.000Z",
                        "note": null,
                        "endReason": "APPROVED",
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2024-01-01T05:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:inspection:Ecxus:456}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "roomId": "${ref:id:room:Ecxus:456}",
                        "startedById": "${ref:id:user:william123}",
                        "startedAt": "2020-01-01T02:00:00.000Z",
                        "finishedById": "${ref:id:user:john-doe}",
                        "finishedAt": "2024-01-01T05:00:00.000Z",
                        "note": null,
                        "endReason": "REJECTED",
                        "createdAt": "2020-01-01T02:00:00.000Z",
                        "updatedAt": "2020-01-01T02:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": "${ref:var:lastResponse.nextCursor}"
            }
            """
        And I send a "GET" request to "/inspection" with the query:
            | pagination.cursor | ${ref:var:lastResponse.nextCursor} |
            | pagination.limit  | 2                                  |
            | pagination.sort   | {"createdAt": "asc"}               |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:inspection:Ecxus:789}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "roomId": "${ref:id:room:Ecxus:789}",
                        "startedById": "${ref:id:user:william123}",
                        "startedAt": "2020-01-01T03:00:00.000Z",
                        "finishedById": null,
                        "finishedAt": null,
                        "note": null,
                        "endReason": null,
                        "createdAt": "2020-01-01T03:00:00.000Z",
                        "updatedAt": "2020-01-01T03:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Viewing an inspection
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "GET" request to "/inspection/${ref:id:inspection:Ecxus:123}"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:inspection:Ecxus:123}",
                "companyId": "${ref:id:company:Ecxus}",
                "roomId": "${ref:id:room:Ecxus:123}",
                "startedById": "${ref:id:user:john-doe}",
                "startedAt": "2020-01-01T01:00:00.000Z",
                "finishedById": "${ref:id:user:john-doe}",
                "finishedAt": "2024-01-01T05:00:00.000Z",
                "note": null,
                "endReason": "APPROVED",
                "createdAt": "2020-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T05:00:00.000Z"
            }
            """

    Scenario: Viewing an inspection that does not exist
        Given "unknown-id" is defined as:
            """
            fe8caf84-8558-4724-9a01-3023c8293b1e
            """
        And I am signed in as "john-doe" in the company "Ecxus"
        When I send a "GET" request to "/inspection/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Inspection not found"
