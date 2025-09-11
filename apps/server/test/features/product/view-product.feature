Feature: View product
    As a user, I want to view the product and its details.

    Background:
        Given the following companies exist:
            | Name   |
            | Ecxus  |
            | Nortec |
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions    |
            | john_doe   | [product:view] |
            | william123 | []             |
        And the following employees with system access in the company "Nortec" exist:
            | User     | Permissions    |
            | john_doe | [product:view] |
        And a product category with name "Drinks" in the company "Ecxus" exists
        And a product category with name "Snacks" in the company "Nortec" exists
        And a product category with name "Main Dishes" in the company "Nortec" exists
        And the following products exist in the company "Ecxus" and product category "Drinks":
            | Code | Name    | Price | Created at               | Updated at               |
            | 1    | Whiskey | 100   | 2024-03-06T03:00:00.000Z | 2024-03-06T03:00:00.000Z |
            | 2    | Vodka   | 50    | 2024-03-06T02:00:00.000Z | 2024-03-06T02:00:00.000Z |
            | 3    | Gin     | 75    | 2024-03-06T01:00:00.000Z | 2024-03-06T01:00:00.000Z |
        And the following products exist in the company "Nortec" and product category "Snacks":
            | Code | Name    | Price | Created at               | Updated at               |
            | 101  | Chips   | 10    | 2024-03-06T03:00:00.000Z | 2024-03-06T03:00:00.000Z |
            | 102  | Popcorn | 15    | 2024-03-06T02:00:00.000Z | 2024-03-06T02:00:00.000Z |
            | 103  | Pretzel | 20    | 2024-03-06T01:00:00.000Z | 2024-03-06T01:00:00.000Z |
        And the following products exist in the company "Nortec" and product category "Main Dishes":
            | Code | Name   | Price | Created at               | Updated at               |
            | 201  | Burger | 30    | 2024-03-06T03:00:00.000Z | 2024-03-06T03:00:00.000Z |

    Scenario: Preventing unauthorized users from viewing products
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "GET" request to "/product"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Viewing products
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/product" with the query:
            | pagination.limit | 10 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:product:Ecxus:1}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "categoryId": "${ref:id:productCategory:Ecxus:Drinks}",
                        "code": 1,
                        "name": "Whiskey",
                        "price": 100,
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:product:Ecxus:2}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "categoryId": "${ref:id:productCategory:Ecxus:Drinks}",
                        "code": 2,
                        "name": "Vodka",
                        "price": 50,
                        "createdAt": "2024-03-06T02:00:00.000Z",
                        "updatedAt": "2024-03-06T02:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:product:Ecxus:3}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "categoryId": "${ref:id:productCategory:Ecxus:Drinks}",
                        "code": 3,
                        "name": "Gin",
                        "price": 75,
                        "createdAt": "2024-03-06T01:00:00.000Z",
                        "updatedAt": "2024-03-06T01:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Paginating products
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/product" with the query:
            | pagination.limit | 2                    |
            | pagination.sort  | {"createdAt": "asc"} |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:product:Ecxus:3}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "categoryId": "${ref:id:productCategory:Ecxus:Drinks}",
                        "code": 3,
                        "name": "Gin",
                        "price": 75,
                        "createdAt": "2024-03-06T01:00:00.000Z",
                        "updatedAt": "2024-03-06T01:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:product:Ecxus:2}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "categoryId": "${ref:id:productCategory:Ecxus:Drinks}",
                        "code": 2,
                        "name": "Vodka",
                        "price": 50,
                        "createdAt": "2024-03-06T02:00:00.000Z",
                        "updatedAt": "2024-03-06T02:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": "${ref:var:lastResponse.nextCursor}"
            }
            """
        When I send a "GET" request to "/product" with the query:
            | pagination.cursor | ${ref:var:lastResponse.nextCursor} |
            | pagination.limit  | 2                                  |
            | pagination.sort   | {"createdAt": "asc"}               |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:product:Ecxus:1}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "categoryId": "${ref:id:productCategory:Ecxus:Drinks}",
                        "code": 1,
                        "name": "Whiskey",
                        "price": 100,
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Filtering products
        Given I am signed in as "john_doe" in the company "Nortec"
        When I send a "GET" request to "/product" with the query:
            | categoryId       | ${ref:id:productCategory:Nortec:Snacks} |
            | name             | P                                       |
            | pagination.limit | 10                                      |
            | pagination.sort  | {"createdAt": "asc"}                    |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:product:Nortec:103}",
                        "companyId": "${ref:id:company:Nortec}",
                        "categoryId": "${ref:id:productCategory:Nortec:Snacks}",
                        "code": 103,
                        "name": "Pretzel",
                        "price": 20,
                        "createdAt": "2024-03-06T01:00:00.000Z",
                        "updatedAt": "2024-03-06T01:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:product:Nortec:102}",
                        "companyId": "${ref:id:company:Nortec}",
                        "categoryId": "${ref:id:productCategory:Nortec:Snacks}",
                        "code": 102,
                        "name": "Popcorn",
                        "price": 15,
                        "createdAt": "2024-03-06T02:00:00.000Z",
                        "updatedAt": "2024-03-06T02:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:product:Nortec:101}",
                        "companyId": "${ref:id:company:Nortec}",
                        "categoryId": "${ref:id:productCategory:Nortec:Snacks}",
                        "code": 101,
                        "name": "Chips",
                        "price": 10,
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Viewing a product
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/product/${ref:id:product:Ecxus:1}"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:product:Ecxus:1}",
                "companyId": "${ref:id:company:Ecxus}",
                "categoryId": "${ref:id:productCategory:Ecxus:Drinks}",
                "code": 1,
                "name": "Whiskey",
                "price": 100,
                "createdAt": "2024-03-06T03:00:00.000Z",
                "updatedAt": "2024-03-06T03:00:00.000Z"
            }
            """

    Scenario: Viewing a product that does not exist
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            573a3ac3-a05a-48aa-80b1-1869a73bfe8c
            """
        When I send a "GET" request to "/product/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Product not found"
