Feature: View account
    As a user, I want to view the account and its details.

    Background:
        Given the following companies exist:
            | Name   |
            | Ecxus  |
            | Nortec |
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions    |
            | john_doe   | [account:view] |
            | william123 | []             |
        And the following employees with system access in the company "Nortec" exist:
            | User     | Permissions    |
            | john_doe | [account:view] |
        And the following accounts exist in the company "Ecxus":
            | Name      | Type     | Bank ID | Agency Number | Agency Digit | Account Number | Account Digit | Created at           | Updated at           |
            | Santander | BANK     | 1       | 2599          | "1"          | 12345          | "1"           | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | BRB       | BANK     | 255     | 123           | "1"          | 12345          | "1"           | 2020-01-02T01:00:00Z | 2020-01-02T01:00:00Z |
            | Caixa     | INTERNAL | null    | null          | null         | null           | null          | 2020-01-03T01:00:00Z | 2020-01-03T01:00:00Z |
        And the following accounts exist in the company "Nortec":
            | Name   | Type     | Bank ID | Agency Number | Agency Digit | Account Number | Account Digit | Created at           | Updated at           |
            | Nubank | BANK     | 123     | 25            | "1"          | 12345          | "1"           | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | Caixa  | INTERNAL | null    | null          | null         | null           | null          | 2020-01-01T02:00:00Z | 2020-02-01T01:00:00Z |

    Scenario: Preventing unauthorized users from viewing accounts
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "GET" request to "/account"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Viewing accounts
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/account" with the query:
            | pagination.limit | 10 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:account:Ecxus:Santander}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Santander",
                        "type": "BANK",
                        "bankId": 1,
                        "agencyNumber": 2599,
                        "agencyDigit": "1",
                        "accountNumber": 12345,
                        "accountDigit": "1",
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:account:Ecxus:BRB}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "BRB",
                        "type": "BANK",
                        "bankId": 255,
                        "agencyNumber": 123,
                        "agencyDigit": "1",
                        "accountNumber": 12345,
                        "accountDigit": "1",
                        "createdAt": "2020-01-02T01:00:00.000Z",
                        "updatedAt": "2020-01-02T01:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:account:Ecxus:Caixa}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Caixa",
                        "type": "INTERNAL",
                        "bankId": null,
                        "agencyNumber": null,
                        "agencyDigit": null,
                        "accountNumber": null,
                        "accountDigit": null,
                        "createdAt": "2020-01-03T01:00:00.000Z",
                        "updatedAt": "2020-01-03T01:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Paginating accounts
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/account" with the query:
            | pagination.limit | 2                    |
            | pagination.sort  | {"createdAt": "asc"} |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:account:Ecxus:Santander}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Santander",
                        "type": "BANK",
                        "bankId": 1,
                        "agencyNumber": 2599,
                        "agencyDigit": "1",
                        "accountNumber": 12345,
                        "accountDigit": "1",
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:account:Ecxus:BRB}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "BRB",
                        "type": "BANK",
                        "bankId": 255,
                        "agencyNumber": 123,
                        "agencyDigit": "1",
                        "accountNumber": 12345,
                        "accountDigit": "1",
                        "createdAt": "2020-01-02T01:00:00.000Z",
                        "updatedAt": "2020-01-02T01:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": "${ref:var:lastResponse.nextCursor}"
            }
            """
        When I send a "GET" request to "/account" with the query:
            | pagination.cursor | ${ref:var:lastResponse.nextCursor} |
            | pagination.limit  | 2                                  |
            | pagination.sort   | {"createdAt": "asc"}               |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:account:Ecxus:Caixa}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Caixa",
                        "type": "INTERNAL",
                        "bankId": null,
                        "agencyNumber": null,
                        "agencyDigit": null,
                        "accountNumber": null,
                        "accountDigit": null,
                        "createdAt": "2020-01-03T01:00:00.000Z",
                        "updatedAt": "2020-01-03T01:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Filtering accounts
        Given I am signed in as "john_doe" in the company "Nortec"
        When I send a "GET" request to "/account" with the query:
            | type             | BANK                 |
            | pagination.limit | 10                   |
            | pagination.sort  | {"createdAt": "asc"} |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:account:Nortec:Nubank}",
                        "companyId": "${ref:id:company:Nortec}",
                        "name": "Nubank",
                        "type": "BANK",
                        "bankId": 123,
                        "agencyNumber": 25,
                        "agencyDigit": "1",
                        "accountNumber": 12345,
                        "accountDigit": "1",
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    }
                ],
                "totalCount": 1,
                "nextCursor": null
            }
            """

    Scenario: Viewing an account
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/account/${ref:id:account:Ecxus:Santander}"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:account:Ecxus:Santander}",
                "companyId": "${ref:id:company:Ecxus}",
                "name": "Santander",
                "type": "BANK",
                "bankId": 1,
                "agencyNumber": 2599,
                "agencyDigit": "1",
                "accountNumber": 12345,
                "accountDigit": "1",
                "createdAt": "2020-01-01T01:00:00.000Z",
                "updatedAt": "2020-01-01T01:00:00.000Z"
            }
            """

    Scenario: Viewing an account that does not exist
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            573a3ac3-a05a-48aa-80b1-1869a73bfe8c
            """
        When I send a "GET" request to "/account/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Account not found"
