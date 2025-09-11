Feature: View transaction
    As a user, I want to find a transaction and view its details

    Background:
        Given the following companies exist:
            | Name  |
            | Ecxus |
            | Meta  |
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions        |
            | john_doe   | [transaction:view] |
            | william123 | []                 |
        And the following employees with system access in the company "Meta" exist:
            | User |
            | anna |
        And the following customers exist in the company "Ecxus":
            | Name | Document ID    |
            | john | 100.000.000-01 |
        And the following customers exist in the company "Meta":
            | Name | Document ID    |
            | john | 100.000.000-02 |
        And the following payment methods exist in the company "Ecxus":
            | Name |
            | Cash |
        And the following payment methods exist in the company "Meta":
            | Name |
            | Cash |
        And the following transactions exist in the company "Ecxus":
            | Counterparty ID                      | Responsible ID          | Amount | Description      | Type    | Payment method ID                  | Created at           | Updated at           |
            | ${ref:id:customer:Ecxus:10000000001} | ${ref:id:user:john_doe} | 100    | card transaction | INCOME  | ${ref:id:paymentMethod:Ecxus:Cash} | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            |                                      | ${ref:id:user:john_doe} | 50     | pix transaction  | INCOME  | ${ref:id:paymentMethod:Ecxus:Cash} | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | ${ref:id:customer:Ecxus:10000000001} | ${ref:id:user:john_doe} | 20     | update           | EXPENSE | ${ref:id:paymentMethod:Ecxus:Cash} | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
        And the following transactions exist in the company "Meta":
            | Counterparty ID                     | Responsible ID      | Amount | Description | Type    | Payment method ID                 | Created at           | Updated at           |
            | ${ref:id:customer:Meta:10000000002} | ${ref:id:user:anna} | 10     | transaction | EXPENSE | ${ref:id:paymentMethod:Meta:Cash} | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |

    Scenario: Preventing unauthorized users from viewing transactions
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "GET" request to "/transaction"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Viewing transactions
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/transaction" with the query:
            | pagination.limit | 10 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:transaction:Ecxus:INCOME:100}",
                        "counterpartyId": "${ref:id:customer:Ecxus:10000000001}",
                        "responsibleId": "${ref:id:user:john_doe}",
                        "amount": 100,
                        "paymentMethodId": "${ref:id:paymentMethod:Ecxus:Cash}",
                        "description": "card transaction",
                        "type": "INCOME",
                        "originId": null,
                        "originType": null,
                        "companyId": "${ref:id:company:Ecxus}",
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:transaction:Ecxus:INCOME:50}",
                        "counterpartyId": null,
                        "responsibleId": "${ref:id:user:john_doe}",
                        "amount": 50,
                        "paymentMethodId": "${ref:id:paymentMethod:Ecxus:Cash}",
                        "description": "pix transaction",
                        "type": "INCOME",
                        "originId": null,
                        "originType": null,
                        "companyId": "${ref:id:company:Ecxus}",
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:transaction:Ecxus:EXPENSE:20}",
                        "counterpartyId": "${ref:id:customer:Ecxus:10000000001}",
                        "responsibleId": "${ref:id:user:john_doe}",
                        "amount": 20,
                        "paymentMethodId": "${ref:id:paymentMethod:Ecxus:Cash}",
                        "description": "update",
                        "type": "EXPENSE",
                        "originId": null,
                        "originType": null,
                        "companyId": "${ref:id:company:Ecxus}",
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Filtering transactions
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/transaction" with the query:
            | description      | transaction       |
            | pagination.limit | 10                |
            | pagination.sort  | {"amount": "asc"} |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:transaction:Ecxus:INCOME:50}",
                        "counterpartyId": null,
                        "responsibleId": "${ref:id:user:john_doe}",
                        "amount": 50,
                        "paymentMethodId": "${ref:id:paymentMethod:Ecxus:Cash}",
                        "description": "pix transaction",
                        "type": "INCOME",
                        "originId": null,
                        "originType": null,
                        "companyId": "${ref:id:company:Ecxus}",
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:transaction:Ecxus:INCOME:100}",
                        "counterpartyId": "${ref:id:customer:Ecxus:10000000001}",
                        "responsibleId": "${ref:id:user:john_doe}",
                        "amount": 100,
                        "paymentMethodId": "${ref:id:paymentMethod:Ecxus:Cash}",
                        "description": "card transaction",
                        "type": "INCOME",
                        "originId": null,
                        "originType": null,
                        "companyId": "${ref:id:company:Ecxus}",
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    }
                ],
                "totalCount": 2,
                "nextCursor": null
            }
            """

    Scenario: Paginating transactions
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/transaction" with the query:
            | pagination.limit | 2                    |
            | pagination.sort  | {"createdAt": "asc"} |
        And the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:transaction:Ecxus:INCOME:100}",
                        "counterpartyId": "${ref:id:customer:Ecxus:10000000001}",
                        "responsibleId": "${ref:id:user:john_doe}",
                        "amount": 100,
                        "paymentMethodId": "${ref:id:paymentMethod:Ecxus:Cash}",
                        "description": "card transaction",
                        "type": "INCOME",
                        "originId": null,
                        "originType": null,
                        "companyId": "${ref:id:company:Ecxus}",
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:transaction:Ecxus:INCOME:50}",
                        "counterpartyId": null,
                        "responsibleId": "${ref:id:user:john_doe}",
                        "amount": 50,
                        "paymentMethodId": "${ref:id:paymentMethod:Ecxus:Cash}",
                        "description": "pix transaction",
                        "type": "INCOME",
                        "originId": null,
                        "originType": null,
                        "companyId": "${ref:id:company:Ecxus}",
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": "${ref:var:lastResponse.nextCursor}"
            }
            """
        And I send a "GET" request to "/transaction" with the query:
            | pagination.cursor | ${ref:var:lastResponse.nextCursor} |
            | pagination.limit  | 2                                  |
            | pagination.sort   | {"createdAt": "asc"}               |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:transaction:Ecxus:EXPENSE:20}",
                        "counterpartyId": "${ref:id:customer:Ecxus:10000000001}",
                        "responsibleId": "${ref:id:user:john_doe}",
                        "amount": 20,
                        "paymentMethodId": "${ref:id:paymentMethod:Ecxus:Cash}",
                        "description": "update",
                        "type": "EXPENSE",
                        "originId": null,
                        "originType": null,
                        "companyId": "${ref:id:company:Ecxus}",
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Viewing a transaction
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/transaction/${ref:id:transaction:Ecxus:INCOME:50}"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:transaction:Ecxus:INCOME:50}",
                "counterpartyId": null,
                "responsibleId": "${ref:id:user:john_doe}",
                "amount": 50,
                "paymentMethodId": "${ref:id:paymentMethod:Ecxus:Cash}",
                "description": "pix transaction",
                "type": "INCOME",
                "originId": null,
                "originType": null,
                "companyId": "${ref:id:company:Ecxus}",
                "createdAt": "2020-01-01T01:00:00.000Z",
                "updatedAt": "2020-01-01T01:00:00.000Z"
            }
            """

    Scenario: Viewing a transaction that does not exist
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            7e185aec-fd6f-4ff5-9d3a-6e0796057fcc
            """
        When I send a "GET" request to "/transaction/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Transaction not found"
