Feature: View direct sale
    As a user, I want to find a direct sale and view its details

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions        |
            | john-doe   | [direct-sale:view] |
            | jorge-bush | []                 |
            | william123 | []                 |
            | anaa123    | []                 |
        And the following customers exist in the company "Ecxus":
            | Name  | Document ID    |
            | Alice | 100.000.000-02 |
        And a product category with name "Drinks" in the company "Ecxus" exists
        And the following products exist in the company "Ecxus" and product category "Drinks":
            | Code | Name    |
            | 1    | Whiskey |
            | 2    | Vodka   |
            | 3    | Rum     |
            | 4    | Gin     |
        And "saleItems1" is defined as:
            """JSON
            [
                {
                    "id": "${ref:id:product:Ecxus:1}",
                    "price": 23.4,
                    "quantity": 1,
                    "productId": "${ref:id:product:Ecxus:1}"
                },
                {
                    "id": "${ref:id:product:Ecxus:2}",
                    "price": 11.25,
                    "quantity": 2,
                    "productId": "${ref:id:product:Ecxus:2}",
                    "note": "This is a note"
                }
            ]
            """
        And "saleItems2" is defined as:
            """JSON
            [
                {
                    "id": "${ref:id:product:Ecxus:3}",
                    "price": 55.55,
                    "quantity": 4,
                    "productId": "${ref:id:product:Ecxus:2}"
                }
            ]
            """
        And "saleItems3" is defined as:
            """JSON
            [
                {
                    "id": "${ref:id:product:Ecxus:4}",
                    "price": 0.65,
                    "quantity": 30,
                    "productId": "${ref:id:product:Ecxus:2}"
                }
            ]
            """
        And the following direct sales exist in the company "Ecxus":
            | Seller name | Buyer ID                             | Items                 | Created at               | Updated at               |
            | john-doe    |                                      | ${ref:var:saleItems1} | 2024-03-06T03:00:00.000Z | 2024-03-06T03:00:00.000Z |
            | jorge-bush  | ${ref:id:customer:Ecxus:10000000002} | ${ref:var:saleItems2} | 2024-03-06T02:00:00.000Z | 2024-03-06T02:00:00.000Z |
            | william123  | ${ref:id:customer:Ecxus:10000000002} | ${ref:var:saleItems3} | 2024-03-06T01:00:00.000Z | 2024-03-06T01:00:00.000Z |

    Scenario: Preventing unauthorized users from viewing direct sales
        Given I am signed in as "anaa123" in the company "Ecxus"
        When I send a "GET" request to "/direct-sale"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Viewing direct sales
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "GET" request to "/direct-sale" with the query:
            | pagination.limit | 10 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:directSale:Ecxus:john-doe}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "buyerId": null,
                        "sellerId": "${ref:id:user:john-doe}",
                        "note": null,
                        "items": [
                            {
                                "id": "${ref:id:product:Ecxus:1}",
                                "saleId": "${ref:id:directSale:Ecxus:john-doe}",
                                "productId": "${ref:id:product:Ecxus:1}",
                                "price": 23.4,
                                "quantity": 1,
                                "note": null,
                                "canceledAt": null,
                                "canceledBy": null,
                                "canceledReason": null,
                                "createdAt": "2024-03-06T03:00:00.000Z",
                                "updatedAt": "2024-03-06T03:00:00.000Z"
                            },
                            {
                                "id": "${ref:id:product:Ecxus:2}",
                                "saleId": "${ref:id:directSale:Ecxus:john-doe}",
                                "productId": "${ref:id:product:Ecxus:2}",
                                "price": 11.25,
                                "quantity": 2,
                                "note": "This is a note",
                                "canceledAt": null,
                                "canceledBy": null,
                                "canceledReason": null,
                                "createdAt": "2024-03-06T03:00:00.000Z",
                                "updatedAt": "2024-03-06T03:00:00.000Z"
                            }
                        ],
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:directSale:Ecxus:jorge-bush}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "buyerId": "${ref:id:customer:Ecxus:10000000002}",
                        "sellerId": "${ref:id:user:jorge-bush}",
                        "note": null,
                        "items": [
                            {
                                "id": "${ref:id:product:Ecxus:3}",
                                "saleId": "${ref:id:directSale:Ecxus:jorge-bush}",
                                "productId": "${ref:id:product:Ecxus:2}",
                                "price": 55.55,
                                "quantity": 4,
                                "note": null,
                                "canceledAt": null,
                                "canceledBy": null,
                                "canceledReason": null,
                                "createdAt": "2024-03-06T02:00:00.000Z",
                                "updatedAt": "2024-03-06T02:00:00.000Z"
                            }
                        ],
                        "createdAt": "2024-03-06T02:00:00.000Z",
                        "updatedAt": "2024-03-06T02:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:directSale:Ecxus:william123}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "buyerId": "${ref:id:customer:Ecxus:10000000002}",
                        "sellerId": "${ref:id:user:william123}",
                        "note": null,
                        "items": [
                            {
                                "id": "${ref:id:product:Ecxus:4}",
                                "saleId": "${ref:id:directSale:Ecxus:william123}",
                                "productId": "${ref:id:product:Ecxus:2}",
                                "price": 0.65,
                                "quantity": 30,
                                "note": null,
                                "canceledAt": null,
                                "canceledBy": null,
                                "canceledReason": null,
                                "createdAt": "2024-03-06T01:00:00.000Z",
                                "updatedAt": "2024-03-06T01:00:00.000Z"
                            }
                        ],
                        "createdAt": "2024-03-06T01:00:00.000Z",
                        "updatedAt": "2024-03-06T01:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Filtering direct sales
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "GET" request to "/direct-sale" with the query:
            | buyerId          |                      |
            | items.quantity   | {"from": 2, "to": 4} |
            | pagination.limit | 10                   |
            | pagination.sort  | {"createdAt": "asc"} |
            | canceledAt       |                      |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:directSale:Ecxus:john-doe}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "buyerId": null,
                        "sellerId": "${ref:id:user:john-doe}",
                        "note": null,
                        "items": [
                            {
                                "id": "${ref:id:product:Ecxus:1}",
                                "saleId": "${ref:id:directSale:Ecxus:john-doe}",
                                "productId": "${ref:id:product:Ecxus:1}",
                                "price": 23.4,
                                "quantity": 1,
                                "note": null,
                                "canceledAt": null,
                                "canceledBy": null,
                                "canceledReason": null,
                                "createdAt": "2024-03-06T03:00:00.000Z",
                                "updatedAt": "2024-03-06T03:00:00.000Z"
                            },
                            {
                                "id": "${ref:id:product:Ecxus:2}",
                                "saleId": "${ref:id:directSale:Ecxus:john-doe}",
                                "productId": "${ref:id:product:Ecxus:2}",
                                "price": 11.25,
                                "quantity": 2,
                                "note": "This is a note",
                                "canceledAt": null,
                                "canceledBy": null,
                                "canceledReason": null,
                                "createdAt": "2024-03-06T03:00:00.000Z",
                                "updatedAt": "2024-03-06T03:00:00.000Z"
                            }
                        ],
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    }
                ],
                "totalCount": 1,
                "nextCursor": null
            }
            """

    Scenario: Paginating direct sales
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "GET" request to "/direct-sale" with the query:
            | pagination.limit | 2                    |
            | pagination.sort  | {"createdAt": "asc"} |
        And the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:directSale:Ecxus:william123}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "buyerId": "${ref:id:customer:Ecxus:10000000002}",
                        "sellerId": "${ref:id:user:william123}",
                        "note": null,
                        "items": [
                            {
                                "id": "${ref:id:product:Ecxus:4}",
                                "saleId": "${ref:id:directSale:Ecxus:william123}",
                                "productId": "${ref:id:product:Ecxus:2}",
                                "price": 0.65,
                                "quantity": 30,
                                "note": null,
                                "canceledAt": null,
                                "canceledBy": null,
                                "canceledReason": null,
                                "createdAt": "2024-03-06T01:00:00.000Z",
                                "updatedAt": "2024-03-06T01:00:00.000Z"
                            }
                        ],
                        "createdAt": "2024-03-06T01:00:00.000Z",
                        "updatedAt": "2024-03-06T01:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:directSale:Ecxus:jorge-bush}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "buyerId": "${ref:id:customer:Ecxus:10000000002}",
                        "sellerId": "${ref:id:user:jorge-bush}",
                        "note": null,
                        "items": [
                            {
                                "id": "${ref:id:product:Ecxus:3}",
                                "saleId": "${ref:id:directSale:Ecxus:jorge-bush}",
                                "productId": "${ref:id:product:Ecxus:2}",
                                "price": 55.55,
                                "quantity": 4,
                                "note": null,
                                "canceledAt": null,
                                "canceledBy": null,
                                "canceledReason": null,
                                "createdAt": "2024-03-06T02:00:00.000Z",
                                "updatedAt": "2024-03-06T02:00:00.000Z"
                            }
                        ],
                        "createdAt": "2024-03-06T02:00:00.000Z",
                        "updatedAt": "2024-03-06T02:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": "${ref:var:lastResponse.nextCursor}"
            }
            """
        And I send a "GET" request to "/direct-sale" with the query:
            | pagination.cursor | ${ref:var:lastResponse.nextCursor} |
            | pagination.limit  | 2                                  |
            | pagination.sort   | {"createdAt": "asc"}               |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:directSale:Ecxus:john-doe}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "buyerId": null,
                        "sellerId": "${ref:id:user:john-doe}",
                        "note": null,
                        "items": [
                            {
                                "id": "${ref:id:product:Ecxus:1}",
                                "saleId": "${ref:id:directSale:Ecxus:john-doe}",
                                "productId": "${ref:id:product:Ecxus:1}",
                                "price": 23.4,
                                "quantity": 1,
                                "note": null,
                                "canceledAt": null,
                                "canceledBy": null,
                                "canceledReason": null,
                                "createdAt": "2024-03-06T03:00:00.000Z",
                                "updatedAt": "2024-03-06T03:00:00.000Z"
                            },
                            {
                                "id": "${ref:id:product:Ecxus:2}",
                                "saleId": "${ref:id:directSale:Ecxus:john-doe}",
                                "productId": "${ref:id:product:Ecxus:2}",
                                "price": 11.25,
                                "quantity": 2,
                                "note": "This is a note",
                                "canceledAt": null,
                                "canceledBy": null,
                                "canceledReason": null,
                                "createdAt": "2024-03-06T03:00:00.000Z",
                                "updatedAt": "2024-03-06T03:00:00.000Z"
                            }
                        ],
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Viewing a direct sale
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "GET" request to "/direct-sale/${ref:id:directSale:Ecxus:william123}"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:directSale:Ecxus:william123}",
                "companyId": "${ref:id:company:Ecxus}",
                "buyerId": "${ref:id:customer:Ecxus:10000000002}",
                "sellerId": "${ref:id:user:william123}",
                "note": null,
                "items": [
                    {
                        "id": "${ref:id:product:Ecxus:4}",
                        "saleId": "${ref:id:directSale:Ecxus:william123}",
                        "productId": "${ref:id:product:Ecxus:2}",
                        "price": 0.65,
                        "quantity": 30,
                        "note": null,
                        "canceledAt": null,
                        "canceledBy": null,
                        "canceledReason": null,
                        "createdAt": "2024-03-06T01:00:00.000Z",
                        "updatedAt": "2024-03-06T01:00:00.000Z"
                    }
                ],
                "createdAt": "2024-03-06T01:00:00.000Z",
                "updatedAt": "2024-03-06T01:00:00.000Z"
            }
            """

    Scenario: Viewing a direct sale that does not exist
        Given "unknown-id" is defined as:
            """
            fe8caf84-8558-4724-9a01-3023c8293123
            """
        And I am signed in as "john-doe" in the company "Ecxus"
        When I send a "GET" request to "/direct-sale/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Direct sale not found"
