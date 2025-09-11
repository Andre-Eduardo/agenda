Feature: Create direct sale
    As a user, I want to make a direct sale so that I can sell my products outside of a rental

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User     | Permissions          |
            | john-doe | [direct-sale:create] |
            | anaa123  | []                   |
        And the following customers exist in the company "Ecxus":
            | Name | Document ID    |
            | Jane | 100.000.000-02 |
        And the following payment methods exist in the company 'Ecxus':
            | Name |
            | Cash |
        And a product category with name "Drinks" in the company "Ecxus" exists
        And the following products exist in the company "Ecxus" and product category "Drinks":
            | Code | Name    |
            | 12   | Whiskey |
        And "saleItems" is defined as:
            """JSON
            [
                {
                    "price": 23.4,
                    "quantity": 1,
                    "productId": "${ref:id:product:Ecxus:12}"
                },
                {
                    "price": 11.25,
                    "quantity": 2,
                    "productId": "${ref:id:product:Ecxus:12}",
                    "note": "This is a note"
                }
            ]
            """

    Scenario: Preventing unauthorized users from creating a direct sale
        Given I am signed in as "anaa123" in the company "Ecxus"
        When I send a "POST" request to "/direct-sale" with:
            | buyerId | ${ref:id:customer:Ecxus:10000000002} |
            | items   | ${ref:var:saleItems}                 |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Creating a direct sale
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john-doe" in the company "Ecxus"
        And "transactions" is defined as:
            """JSON
            [
                {
                    "amount": 25.9,
                    "paymentMethodId": "${ref:id:paymentMethod:Ecxus:Cash}"
                },
                {
                    "amount": 20,
                    "paymentMethodId": "${ref:id:paymentMethod:Ecxus:Cash}"
                }
            ]
            """
        When I send a "POST" request to "/direct-sale" with:
            | buyerId      | ${ref:id:customer:Ecxus:10000000002} |
            | items        | ${ref:var:saleItems}                 |
            | transactions | ${ref:var:transactions}              |
        Then the request should succeed with a 201 status code
        And the response should match:
            """YAML
            {
                "id": _.isEntityId,
                "companyId": "${ref:id:company:Ecxus}",
                "sellerId": "${ref:id:user:john-doe}",
                "buyerId": "${ref:id:customer:Ecxus:10000000002}",
                "items": [
                    {
                        "id": _.isEntityId,
                        "saleId": _.isEntityId,
                        "productId": "${ref:id:product:Ecxus:12}",
                        "price": 23.4,
                        "quantity": 1,
                        "note": null,
                        "canceledAt": null,
                        "canceledBy": null,
                        "canceledReason": null,
                        "createdAt": "2024-01-01T01:00:00.000Z",
                        "updatedAt": "2024-01-01T01:00:00.000Z"
                    },
                    {
                        "id": _.isEntityId,
                        "saleId": _.isEntityId,
                        "productId": "${ref:id:product:Ecxus:12}",
                        "price": 11.25,
                        "quantity": 2,
                        "note": "This is a note",
                        "canceledAt": null,
                        "canceledBy": null,
                        "canceledReason": null,
                        "createdAt": "2024-01-01T01:00:00.000Z",
                        "updatedAt": "2024-01-01T01:00:00.000Z",
                    }
                ],
                "note": null,
                "createdAt": "2024-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T01:00:00.000Z"
            }
            """
        And should exist direct sales in the company "Ecxus" with the following data:
            | Seller ID               | Buyer ID                             | Items                | note |
            | ${ref:id:user:john-doe} | ${ref:id:customer:Ecxus:10000000002} | ${ref:var:saleItems} |      |
        And should exist transactions in the company "Ecxus" with the following data:
            | Responsible ID          | Amount | Type   |
            | ${ref:id:user:john-doe} | 25.9   | INCOME |
            | ${ref:id:user:john-doe} | 20     | INCOME |
        And the following events in the company "Ecxus" should be recorded:
            | Type                | Timestamp              | User ID                   |
            | DIRECT_SALE_CREATED | "2024-01-01T01:00:00Z" | "${ref:id:user:john-doe}" |
            | TRANSACTION_CREATED | "2024-01-01T01:00:00Z" | "${ref:id:user:john-doe}" |
            | TRANSACTION_CREATED | "2024-01-01T01:00:00Z" | "${ref:id:user:john-doe}" |

    Scenario Outline: Choosing an invalid buyer ID
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "POST" request to "/direct-sale" with:
            | buyerId | <Buyer ID>           |
            | items   | ${ref:var:saleItems} |
        Then I should receive an invalid input error on "buyerId" with reason "<Reason>"

        Examples:
            | Buyer ID | Reason                                    |
            | "123"    | Malformed ID. Expected a valid entity ID. |
            | -1       | Expected string, received number          |
            | ssss     | Malformed ID. Expected a valid entity ID. |

    Scenario Outline: Choosing invalid items
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "POST" request to "/direct-sale" with:
            | buyerId | ${ref:id:customer:Ecxus:10000000002} |
            | items   | <Items>                              |
        Then I should receive an invalid input error on "items" with reason "<Reason>"

        Examples:
            | Items | Reason                                   |
            | ""    | Expected array, received string          |
            | []    | Array must contain at least 1 element(s) |
            | aaaa  | Expected array, received string          |
            | true  | Expected array, received boolean         |

    Scenario Outline: Choosing an invalid sale item
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "POST" request to "/direct-sale" with:
            | buyerId | ${ref:id:customer:Ecxus:10000000002} |
            | items   | [<Items>]                            |
        Then I should receive an invalid input error on "items.0.<Field>" with reason "<Reason>"

        Examples:
            | Items                                                                  | Field     | Reason                                    |
            | {"price": -1,"quantity": 1,"productId": "${ref:id:product:Ecxus:12}"}  | price     | Number must be greater than or equal to 0 |
            | {"price": "1","quantity": 1,"productId": "${ref:id:product:Ecxus:12}"} | price     | Expected number, received string          |
            | {"price": 1,"quantity": 0,"productId": "${ref:id:product:Ecxus:12}"}   | quantity  | Number must be greater than 0             |
            | {"price": 1,"quantity": 0,"productId": "123"}                          | productId | Malformed ID. Expected a valid entity ID. |
