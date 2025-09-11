Feature: Update direct sale
    As a user, I want to update a direct sale so that I can keep my payment information up to date.

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions          |
            | john-doe   | [direct-sale:update] |
            | william123 | [direct-sale:update] |
            | anaa123    | []                   |
        And the following customers exist in the company "Ecxus":
            | Name | Document ID    |
            | Jane | 100.000.000-02 |
        And a product category with name "Drinks" in the company "Ecxus" exists
        And the following products exist in the company "Ecxus" and product category "Drinks":
            | Code | Name    |
            | 1    | Whiskey |
            | 2    | Vodka   |
        And the following payment methods exist in the company "Ecxus":
            | Name |
            | Cash |
        And "saleItems1" is defined as:
            """JSON
            [
                {
                    "id": "${ref:id:product:Ecxus:1}",
                    "price": 23.4,
                    "quantity": 1,
                    "productId": "${ref:id:product:Ecxus:1}"
                }
            ]
            """
        And "saleItems2" is defined as:
            """JSON
            [
                {
                    "id": "${ref:id:product:Ecxus:2}",
                    "price": 55.55,
                    "quantity": 4,
                    "productId": "${ref:id:product:Ecxus:1}",
                    "note": "This is a note"
                }
            ]
            """
        And the following direct sales exist in the company "Ecxus":
            | Seller name | Buyer ID                             | Items                 | Created at               | Updated at               |
            | john-doe    |                                      | ${ref:var:saleItems1} | 2024-03-06T02:00:00.000Z | 2024-03-06T02:00:00.000Z |
            | william123  | ${ref:id:customer:Ecxus:10000000002} | ${ref:var:saleItems2} | 2024-03-06T01:00:00.000Z | 2024-03-06T01:00:00.000Z |
        And the following transactions exist in the company "Ecxus":
            | Amount | Type   | Responsible ID          | Origin ID                             | Origin type | Payment method ID                  |
            | 222.2  | INCOME | ${ref:id:user:john-doe} | ${ref:id:directSale:Ecxus:william123} | DIRECT_SALE | ${ref:id:paymentMethod:Ecxus:Cash} |

    Scenario: Preventing unauthorized users from updating a direct sale
        Given I am signed in as "anaa123" in the company "Ecxus"
        When I send a "PUT" request to "/direct-sale/${ref:id:user:anaa123}" with:
            | note | New note |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Updating a direct sale
        Given the current date and time is "2024-11-01T05:00:00Z"
        And I am signed in as "william123" in the company "Ecxus"
        And "newSaleItems" is defined as:
            """JSON
            [
                {
                    "id": "${ref:id:product:Ecxus:2}",
                    "quantity": 3,
                    "note": null
                },
                {
                    "price": 27.775,
                    "quantity": 2,
                    "productId": "${ref:id:product:Ecxus:2}"
                }
            ]
            """
        And "transactions" is defined as:
            """JSON
            [
                {
                    "amount": 55.55,
                    "paymentMethodId": "${ref:id:paymentMethod:Ecxus:Cash}"
                },
                {
                    "id": "${ref:id:transaction:Ecxus:INCOME:222.2}",
                    "amount": 166.65,
                    "paymentMethodId": "${ref:id:paymentMethod:Ecxus:Cash}"
                }
            ]
            """
        When I send a "PUT" request to "/direct-sale/${ref:id:directSale:Ecxus:william123}" with:
            | note         | New note                |
            | items        | ${ref:var:newSaleItems} |
            | transactions | ${ref:var:transactions} |
        Then the request should succeed with a 200 status code
        And the response should match:
            """YAML
            {
                "id": "${ref:id:directSale:Ecxus:william123}",
                "companyId": "${ref:id:company:Ecxus}",
                "sellerId": "${ref:id:user:william123}",
                "buyerId": "${ref:id:customer:Ecxus:10000000002}",
                "note": "New note",
                "items": [
                    {
                        "id": "${ref:id:product:Ecxus:2}",
                        "saleId": "${ref:id:directSale:Ecxus:william123}",
                        "productId": "${ref:id:product:Ecxus:1}",
                        "price": 55.55,
                        "quantity": 3,
                        "note": null,
                        "canceledAt": null,
                        "canceledBy": null,
                        "canceledReason": null,
                        "createdAt": "2024-03-06T01:00:00.000Z",
                        "updatedAt": "2024-11-01T05:00:00.000Z"
                    },
                    {
                        "id": _.isEntityId,
                        "saleId": "${ref:id:directSale:Ecxus:william123}",
                        "productId": "${ref:id:product:Ecxus:2}",
                        "price": 27.775,
                        "quantity": 2,
                        "note": null,
                        "canceledAt": null,
                        "canceledBy": null,
                        "canceledReason": null,
                        "createdAt": "2024-11-01T05:00:00.000Z",
                        "updatedAt": "2024-11-01T05:00:00.000Z"
                    }
                 ],
                "createdAt": "2024-03-06T01:00:00.000Z",
                "updatedAt": "2024-11-01T05:00:00.000Z"
            }
            """
        And should exist direct sales in the company "Ecxus" with the following data:
            | Seller ID  | Buyer ID                             | Items                   | Note     | Created at               | Updated at               |
            | john-doe   |                                      | ${ref:var:saleItems1}   |          | 2024-03-06T02:00:00.000Z | 2024-03-06T02:00:00.000Z |
            | william123 | ${ref:id:customer:Ecxus:10000000002} | ${ref:var:newSaleItems} | New note | 2024-03-06T01:00:00.000Z | 2024-11-01T05:00:00.000Z |
        And should exist transactions in the company "Ecxus" with the following data:
            | Responsible ID            | Amount |
            | ${ref:id:user:william123} | 55.55  |
            | ${ref:id:user:john-doe}   | 166.65 |
        And the following events in the company "Ecxus" should be recorded:
            | Type                | Timestamp              | User ID                     |
            | DIRECT_SALE_CHANGED | "2024-11-01T05:00:00Z" | "${ref:id:user:william123}" |
            | TRANSACTION_CHANGED | "2024-11-01T05:00:00Z" | "${ref:id:user:william123}" |
            | TRANSACTION_CREATED | "2024-11-01T05:00:00Z" | "${ref:id:user:william123}" |

    Scenario: Trying to update a direct sale with a different amount than the transaction
        Given I am signed in as "william123" in the company "Ecxus"
        And "newSaleItems" is defined as:
            """JSON
            [
                {
                    "id": "${ref:id:product:Ecxus:2}",
                    "quantity": 5,
                    "note": null
                }
            ]
            """
        When I send a "PUT" request to "/direct-sale/${ref:id:directSale:Ecxus:william123}" with:
            | note  | New note                |
            | items | ${ref:var:newSaleItems} |
        Then I should receive a precondition failed error with message "The total amount does not match the amount paid."

    Scenario: Trying to update a non-existent item from a direct sale
        Given I am signed in as "william123" in the company "Ecxus"
        And "newSaleItem" is defined as:
            """JSON
            [
                {
                    "id": "7f3c4fbe-bbb4-4c32-8cce-a68f3c992123",
                    "note": null
                }
            ]
            """
        When I send a "PUT" request to "/direct-sale/${ref:id:directSale:Ecxus:william123}" with:
            | items | ${ref:var:newSaleItem} |
        Then I should receive a resource not found error on "${ref:var:newSaleItem.0.id}" with reason "Sale item not found"

    Scenario: Trying to update a non-existent transaction from a direct sale
        Given I am signed in as "william123" in the company "Ecxus"
        And "transactions" is defined as:
            """JSON
            [
                {
                    "id": "7f3c4fbe-bbb4-4c32-8cce-a68f3c992123"
                }
            ]
            """
        When I send a "PUT" request to "/direct-sale/${ref:id:directSale:Ecxus:william123}" with:
            | transactions | ${ref:var:transactions} |
        Then I should receive a resource not found error on "${ref:var:transactions.0.id}" with reason "Transaction not found"

    Scenario Outline: Updating a direct sale with invalid note
        Given I am signed in as "john-doe" in the company "Ecxus"
        When I send a "PUT" request to "/direct-sale/${ref:id:directSale:Ecxus:john-doe}" with:
            | note | <Value> |
        Then I should receive an invalid input error on "note" with reason "<Reason>"

        Examples:
            | Value | Reason                                      |
            | ""    | String must contain at least 1 character(s) |
            | 1     | Expected string, received number            |
            | true  | Expected string, received boolean           |

    Scenario: Updating a direct sale that does not exist
        Given I am signed in as "john-doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            7f3c4fbe-bbb4-4c32-8cce-a68f3c992123
            """
        When I send a "PUT" request to "/direct-sale/${ref:var:unknown-id}" with:
            | note | New note |
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Direct sale not found"
