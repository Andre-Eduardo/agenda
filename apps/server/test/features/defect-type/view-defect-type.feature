Feature: View defect type
    As a user, I want to view the defect type and its details.

    Background:
        Given the following companies exist:
            | Name   |
            | Ecxus  |
            | Nortec |
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions        |
            | john_doe   | [defect-type:view] |
            | william123 | []                 |
        And the following employees with system access in the company "Nortec" exist:
            | User     | Permissions        |
            | john_doe | [defect-type:view] |
        And the following defect types exist in the company "Ecxus":
            | Name       | Created at               | Updated at               |
            | Automation | 2024-03-06T03:00:00.000Z | 2024-03-06T03:00:00.000Z |
            | Lighting   | 2024-03-06T02:00:00.000Z | 2024-03-06T02:00:00.000Z |
            | Audio      | 2024-03-06T01:00:00.000Z | 2024-03-06T01:00:00.000Z |
        And the following defect types exist in the company "Nortec":
            | Name            | Created at               | Updated at               |
            | Electrical      | 2024-03-06T03:00:00.000Z | 2024-03-06T03:00:00.000Z |
            | Air conditioner | 2024-03-06T02:00:00.000Z | 2024-03-06T02:00:00.000Z |
            | Internet        | 2024-03-06T01:00:00.000Z | 2024-03-06T01:00:00.000Z |

    Scenario: Preventing unauthorized users from viewing defect types
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "GET" request to "/defect-type"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Viewing defect types
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/defect-type" with the query:
            | pagination.limit | 10 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:defectType:Ecxus:Automation}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Automation",
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:defectType:Ecxus:Lighting}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Lighting",
                        "createdAt": "2024-03-06T02:00:00.000Z",
                        "updatedAt": "2024-03-06T02:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:defectType:Ecxus:Audio}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Audio",
                        "createdAt": "2024-03-06T01:00:00.000Z",
                        "updatedAt": "2024-03-06T01:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Paginating defect types
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/defect-type" with the query:
            | pagination.limit | 2                    |
            | pagination.sort  | {"createdAt": "asc"} |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:defectType:Ecxus:Audio}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Audio",
                        "createdAt": "2024-03-06T01:00:00.000Z",
                        "updatedAt": "2024-03-06T01:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:defectType:Ecxus:Lighting}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Lighting",
                        "createdAt": "2024-03-06T02:00:00.000Z",
                        "updatedAt": "2024-03-06T02:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": "${ref:var:lastResponse.nextCursor}"
            }
            """
        When I send a "GET" request to "/defect-type" with the query:
            | pagination.cursor | ${ref:var:lastResponse.nextCursor} |
            | pagination.limit  | 2                                  |
            | pagination.sort   | {"createdAt": "asc"}               |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:defectType:Ecxus:Automation}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Automation",
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Filtering defect-types
        Given I am signed in as "john_doe" in the company "Nortec"
        When I send a "GET" request to "/defect-type" with the query:
            | name             | air                  |
            | pagination.limit | 10                   |
            | pagination.sort  | {"createdAt": "asc"} |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:defectType:Nortec:Air conditioner}",
                        "companyId": "${ref:id:company:Nortec}",
                        "name": "Air conditioner",
                        "createdAt": "2024-03-06T02:00:00.000Z",
                        "updatedAt": "2024-03-06T02:00:00.000Z"
                     }
                ],
                "totalCount": 1,
                "nextCursor": null
            }
            """

    Scenario: Viewing a defect type
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/defect-type/${ref:id:defectType:Ecxus:Lighting}"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
             {
                "id": "${ref:id:defectType:Ecxus:Lighting}",
                "companyId": "${ref:id:company:Ecxus}",
                "name": "Lighting",
                "createdAt": "2024-03-06T02:00:00.000Z",
                "updatedAt": "2024-03-06T02:00:00.000Z"
             }
            """

    Scenario: Viewing a defect type that does not exist
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            573a3ac3-a05a-48aa-80b1-1869a73bfe8c
            """
        When I send a "GET" request to "/defect-type/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Defect type not found"
