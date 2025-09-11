Feature: View audit
    As a user, I want to find an audit and view its details

    Background:
        Given the following companies exist:
            | Name  |
            | Ecxus |
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions                             |
            | john-doe   | [audit:view, audit:start, audit:finish] |
            | anaa123    | []                                      |
            | william123 | [audit:view, audit:start, audit:finish] |
        And a room category with name "Lush" in the company "Ecxus" exists
        And the following rooms exist in the company "Ecxus" and room category "Lush":
            | Number | State  |
            | 1      | VACANT |
            | 2      | VACANT |
            | 3      | AUDIT  |
        And the following audits exist in the company "Ecxus":
            | Room number | Start user ID           | End user ID               | Reason         | End reason | Started at           | Finished at          | Created at           | Updated at           |
            | 1           | ${ref:id:user:john-doe} | ${ref:id:user:william123} | audit 1 reason | COMPLETED  | 2024-01-01T01:00:00Z | 2024-01-01T02:00:00Z | 2024-01-01T01:00:00Z | 2024-01-01T02:00:00Z |
            | 2           | ${ref:id:user:john-doe} | ${ref:id:user:john-doe}   | audit 2 reason | COMPLETED  | 2024-01-01T02:00:00Z | 2024-01-01T03:00:00Z | 2024-01-01T02:00:00Z | 2024-01-01T03:00:00Z |
            | 3           | ${ref:id:user:john-doe} |                           | audit 3 reason |            | 2024-01-01T04:00:00Z |                      | 2024-01-01T04:00:00Z | 2024-01-01T04:00:00Z |

    Scenario: Preventing unauthorized users from viewing an audit
        Given I am signed in as "anaa123" in the company "Ecxus"
        When I send a "GET" request to "/audit"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Viewing audits
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "GET" request to "/audit" with the query:
            | pagination.limit | 10 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:audit:Ecxus:1}",
                        "createdAt": "2024-01-01T01:00:00.000Z",
                        "updatedAt": "2024-01-01T02:00:00.000Z",
                        "companyId": "${ref:id:company:Ecxus}",
                        "roomId": "${ref:id:room:Ecxus:1}",
                        "startedById": "${ref:id:user:john-doe}",
                        "startedAt": "2024-01-01T01:00:00.000Z",
                        "finishedById": "${ref:id:user:william123}",
                        "finishedAt": "2024-01-01T02:00:00.000Z",
                        "reason": "audit 1 reason",
                        "endReason": "COMPLETED",
                        "note": null
                    },
                    {
                        "id": "${ref:id:audit:Ecxus:2}",
                        "createdAt": "2024-01-01T02:00:00.000Z",
                        "updatedAt": "2024-01-01T03:00:00.000Z",
                        "companyId": "${ref:id:company:Ecxus}",
                        "roomId": "${ref:id:room:Ecxus:2}",
                        "startedById": "${ref:id:user:john-doe}",
                        "startedAt": "2024-01-01T02:00:00.000Z",
                        "finishedById": "${ref:id:user:john-doe}",
                        "finishedAt": "2024-01-01T03:00:00.000Z",
                        "reason": "audit 2 reason",
                        "endReason": "COMPLETED",
                        "note": null
                    },
                    {
                        "id": "${ref:id:audit:Ecxus:3}",
                        "createdAt": "2024-01-01T04:00:00.000Z",
                        "updatedAt": "2024-01-01T04:00:00.000Z",
                        "companyId": "${ref:id:company:Ecxus}",
                        "roomId": "${ref:id:room:Ecxus:3}",
                        "startedById": "${ref:id:user:john-doe}",
                        "startedAt": "2024-01-01T04:00:00.000Z",
                        "finishedById": null,
                        "finishedAt": null,
                        "reason": "audit 3 reason",
                        "endReason": null,
                        "note": null
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Filtering audits
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "GET" request to "/audit" with the query:
            | reason           | audit 3 reason       |
            | pagination.limit | 10                   |
            | pagination.sort  | {"createdAt": "asc"} |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:audit:Ecxus:3}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "roomId": "${ref:id:room:Ecxus:3}",
                        "startedById": "${ref:id:user:john-doe}",
                        "finishedById": null,
                        "reason": "audit 3 reason",
                        "endReason": null,
                        "note": null,
                        "startedAt": "2024-01-01T04:00:00.000Z",
                        "finishedAt": null,
                        "createdAt": "2024-01-01T04:00:00.000Z",
                        "updatedAt": "2024-01-01T04:00:00.000Z"
                    }
                ],
                "totalCount": 1,
                "nextCursor": null
            }
            """

    Scenario: Paginating audits
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "GET" request to "/audit" with the query:
            | pagination.limit | 2                    |
            | pagination.sort  | {"createdAt": "asc"} |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:audit:Ecxus:1}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "roomId": "${ref:id:room:Ecxus:1}",
                        "startedById": "${ref:id:user:john-doe}",
                        "finishedById": "${ref:id:user:william123}",
                        "reason": "audit 1 reason",
                        "endReason": "COMPLETED",
                        "note": null,
                        "startedAt": "2024-01-01T01:00:00.000Z",
                        "finishedAt": "2024-01-01T02:00:00.000Z",
                        "createdAt": "2024-01-01T01:00:00.000Z",
                        "updatedAt": "2024-01-01T02:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:audit:Ecxus:2}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "roomId": "${ref:id:room:Ecxus:2}",
                        "startedById": "${ref:id:user:john-doe}",
                        "finishedById": "${ref:id:user:john-doe}",
                        "reason": "audit 2 reason",
                        "endReason": "COMPLETED",
                        "note": null,
                        "startedAt": "2024-01-01T02:00:00.000Z",
                        "finishedAt": "2024-01-01T03:00:00.000Z",
                        "createdAt": "2024-01-01T02:00:00.000Z",
                        "updatedAt": "2024-01-01T03:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": "${ref:var:lastResponse.nextCursor}"
            }
            """
        And I send a "GET" request to "/audit" with the query:
            | pagination.cursor | ${ref:var:lastResponse.nextCursor} |
            | pagination.limit  | 1                                  |
            | pagination.sort   | {"createdAt": "asc"}               |
        And the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:audit:Ecxus:3}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "roomId": "${ref:id:room:Ecxus:3}",
                        "startedById": "${ref:id:user:john-doe}",
                        "finishedById": null,
                        "reason": "audit 3 reason",
                        "endReason": null,
                        "note": null,
                        "startedAt": "2024-01-01T04:00:00.000Z",
                        "finishedAt": null,
                        "createdAt": "2024-01-01T04:00:00.000Z",
                        "updatedAt": "2024-01-01T04:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Viewing an audit
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "GET" request to "/audit/${ref:id:audit:Ecxus:3}"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:audit:Ecxus:3}",
                "companyId": "${ref:id:company:Ecxus}",
                "roomId": "${ref:id:room:Ecxus:3}",
                "startedById": "${ref:id:user:john-doe}",
                "finishedById": null,
                "reason": "audit 3 reason",
                "endReason": null,
                "note": null,
                "startedAt": "2024-01-01T04:00:00.000Z",
                "finishedAt": null,
                "createdAt": "2024-01-01T04:00:00.000Z",
                "updatedAt": "2024-01-01T04:00:00.000Z"
            }
            """

    Scenario: Viewing an audit that does not exist
        Given "unknown-id" is defined as:
            """
            fe8caf84-8558-4724-9a01-3023c8293b1e
            """
        And I am signed in as "john-doe" in the company "Ecxus"
        When I send a "GET" request to "/audit/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Audit not found"
