Feature: View payment method
    As a user, I want to find a payment method and view its details

    Background:
        Given the following companies exist:
            | Name  |
            | Ecxus |
            | Meta  |
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions           |
            | john_doe   | [payment-method:view] |
            | william123 | []                    |
        And the following payment methods exist in the company "Ecxus":
            | Name          | Type        | Created at           | Updated at           |
            | Cash          | CASH        | 2020-01-01T05:00:00Z | 2020-01-01T05:00:00Z |
            | Master credit | CREDIT_CARD | 2020-01-01T04:00:00Z | 2020-01-01T04:00:00Z |
            | Visa credit   | CREDIT_CARD | 2020-01-01T03:00:00Z | 2020-01-01T03:00:00Z |
            | Pix           | PIX         | 2020-01-01T02:00:00Z | 2020-01-01T02:00:00Z |
            | Bank check    | OTHER       | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
        And the following payment methods exist in the company "Meta":
            | Name        | Type        | Created at           | Updated at           |
            | Cash        | CASH        | 2020-01-01T05:00:00Z | 2020-01-01T05:00:00Z |
            | Amex credit | CREDIT_CARD | 2020-01-01T04:00:00Z | 2020-01-01T04:00:00Z |
            | Amex debit  | DEBIT_CARD  | 2020-01-01T03:00:00Z | 2020-01-01T03:00:00Z |
            | Transfer    | OTHER       | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |

    Scenario: Preventing unauthorized users from viewing payment methods
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "GET" request to "/payment-method"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Viewing payment methods
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/payment-method" with the query:
            | pagination.limit | 10 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:paymentMethod:Ecxus:Cash}",
                        "name": "Cash",
                        "type": "CASH",
                        "companyId": "${ref:id:company:Ecxus}",
                        "createdAt": "2020-01-01T05:00:00.000Z",
                        "updatedAt": "2020-01-01T05:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:paymentMethod:Ecxus:Master credit}",
                        "name": "Master credit",
                        "type": "CREDIT_CARD",
                        "companyId": "${ref:id:company:Ecxus}",
                        "createdAt": "2020-01-01T04:00:00.000Z",
                        "updatedAt": "2020-01-01T04:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:paymentMethod:Ecxus:Visa credit}",
                        "name": "Visa credit",
                        "type": "CREDIT_CARD",
                        "companyId": "${ref:id:company:Ecxus}",
                        "createdAt": "2020-01-01T03:00:00.000Z",
                        "updatedAt": "2020-01-01T03:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:paymentMethod:Ecxus:Pix}",
                        "name": "Pix",
                        "type": "PIX",
                        "companyId": "${ref:id:company:Ecxus}",
                        "createdAt": "2020-01-01T02:00:00.000Z",
                        "updatedAt": "2020-01-01T02:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:paymentMethod:Ecxus:Bank check}",
                        "name": "Bank check",
                        "type": "OTHER",
                        "companyId": "${ref:id:company:Ecxus}",
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    }
                ],
                "totalCount": 5,
                "nextCursor": null
            }
            """

    Scenario: Filtering payment methods
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/payment-method" with the query:
            | name             | a               |
            | pagination.limit | 10              |
            | pagination.sort  | {"type": "asc"} |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:paymentMethod:Ecxus:Cash}",
                        "name": "Cash",
                        "type": "CASH",
                        "companyId": "${ref:id:company:Ecxus}",
                        "createdAt": "2020-01-01T05:00:00.000Z",
                        "updatedAt": "2020-01-01T05:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:paymentMethod:Ecxus:Master credit}",
                        "name": "Master credit",
                        "type": "CREDIT_CARD",
                        "companyId": "${ref:id:company:Ecxus}",
                        "createdAt": "2020-01-01T04:00:00.000Z",
                        "updatedAt": "2020-01-01T04:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:paymentMethod:Ecxus:Visa credit}",
                        "name": "Visa credit",
                        "type": "CREDIT_CARD",
                        "companyId": "${ref:id:company:Ecxus}",
                        "createdAt": "2020-01-01T03:00:00.000Z",
                        "updatedAt": "2020-01-01T03:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:paymentMethod:Ecxus:Bank check}",
                        "name": "Bank check",
                        "type": "OTHER",
                        "companyId": "${ref:id:company:Ecxus}",
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    }
                ],
                "totalCount": 4,
                "nextCursor": null
            }
            """

    Scenario: Paginating payment methods
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/payment-method" with the query:
            | pagination.limit | 3                    |
            | pagination.sort  | {"createdAt": "asc"} |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:paymentMethod:Ecxus:Bank check}",
                        "name": "Bank check",
                        "type": "OTHER",
                        "companyId": "${ref:id:company:Ecxus}",
                        "createdAt": "2020-01-01T01:00:00.000Z",
                        "updatedAt": "2020-01-01T01:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:paymentMethod:Ecxus:Pix}",
                        "name": "Pix",
                        "type": "PIX",
                        "companyId": "${ref:id:company:Ecxus}",
                        "createdAt": "2020-01-01T02:00:00.000Z",
                        "updatedAt": "2020-01-01T02:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:paymentMethod:Ecxus:Visa credit}",
                        "name": "Visa credit",
                        "type": "CREDIT_CARD",
                        "companyId": "${ref:id:company:Ecxus}",
                        "createdAt": "2020-01-01T03:00:00.000Z",
                        "updatedAt": "2020-01-01T03:00:00.000Z"
                    }
                ],
                "totalCount": 5,
                "nextCursor": "${ref:var:lastResponse.nextCursor}"
            }
            """
        When I send a "GET" request to "/payment-method" with the query:
            | pagination.cursor | ${ref:var:lastResponse.nextCursor} |
            | pagination.limit  | 2                                  |
            | pagination.sort   | {"createdAt": "asc"}               |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:paymentMethod:Ecxus:Master credit}",
                        "name": "Master credit",
                        "type": "CREDIT_CARD",
                        "companyId": "${ref:id:company:Ecxus}",
                        "createdAt": "2020-01-01T04:00:00.000Z",
                        "updatedAt": "2020-01-01T04:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:paymentMethod:Ecxus:Cash}",
                        "name": "Cash",
                        "type": "CASH",
                        "companyId": "${ref:id:company:Ecxus}",
                        "createdAt": "2020-01-01T05:00:00.000Z",
                        "updatedAt": "2020-01-01T05:00:00.000Z"
                    }
                ],
                "totalCount": 5,
                "nextCursor": null
            }
            """

    Scenario: Viewing a payment method
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/payment-method/${ref:id:paymentMethod:Ecxus:Pix}"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:paymentMethod:Ecxus:Pix}",
                "name": "Pix",
                "type": "PIX",
                "companyId": "${ref:id:company:Ecxus}",
                "createdAt": "2020-01-01T02:00:00.000Z",
                "updatedAt": "2020-01-01T02:00:00.000Z"
            }
            """

    Scenario: Viewing a payment method that does not exist
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            7f3c4fbe-bbb4-4c32-8cce-a68f3c992839
            """
        When I send a "GET" request to "/payment-method/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Payment method not found"
