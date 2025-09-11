Feature: View product category
    As a user, I want to view the product category and its details.

    Background:
        Given the following companies exist:
            | Name   |
            | Ecxus  |
            | Nortec |
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions             |
            | john_doe   | [product-category:view] |
            | william123 | []                      |
        And the following employees with system access in the company "Nortec" exist:
            | User     | Permissions             |
            | john_doe | [product-category:view] |
        And the following product categories exist in the company "Ecxus":
            | Name        | Created at               | Updated at               |
            | Drinks      | 2024-03-06T03:00:00.000Z | 2024-03-06T03:00:00.000Z |
            | Cleaning    | 2024-03-06T02:00:00.000Z | 2024-03-06T02:00:00.000Z |
            | Main Dishes | 2024-03-06T01:00:00.000Z | 2024-03-06T01:00:00.000Z |
        And the following product categories exist in the company "Nortec":
            | Name       | Created at               | Updated at               |
            | Decorating | 2024-03-06T03:00:00.000Z | 2024-03-06T03:00:00.000Z |
            | Desserts   | 2024-03-06T04:00:00.000Z | 2024-03-06T04:00:00.000Z |

    Scenario: Preventing unauthorized users from viewing product categories
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "GET" request to "/product-category"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Viewing product categories
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/product-category" with the query:
            | pagination.limit | 10 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:productCategory:Ecxus:Drinks}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Drinks",
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:productCategory:Ecxus:Cleaning}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Cleaning",
                        "createdAt": "2024-03-06T02:00:00.000Z",
                        "updatedAt": "2024-03-06T02:00:00.000Z"
                    },
                    {
                        "id": "${ref:id:productCategory:Ecxus:Main Dishes}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Main Dishes",
                        "createdAt": "2024-03-06T01:00:00.000Z",
                        "updatedAt": "2024-03-06T01:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Filtering product categories
        Given I am signed in as "john_doe" in the company "Nortec"
        When I send a "GET" request to "/product-category" with the query:
            | name             | Des                  |
            | pagination.limit | 10                   |
            | pagination.sort  | {"createdAt": "asc"} |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:productCategory:Nortec:Desserts}",
                        "companyId": "${ref:id:company:Nortec}",
                        "name": "Desserts",
                        "createdAt": "2024-03-06T04:00:00.000Z",
                        "updatedAt": "2024-03-06T04:00:00.000Z"
                    }
                ],
                "totalCount": 1,
                "nextCursor": null
            }
            """

    Scenario: Paginating product categories
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/product-category" with the query:
            | pagination.limit | 2                    |
            | pagination.sort  | {"createdAt": "asc"} |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:productCategory:Ecxus:Main Dishes}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Main Dishes",
                        "createdAt": "2024-03-06T01:00:00.000Z",
                        "updatedAt": "2024-03-06T01:00:00.000Z"
                    },
                         {
                        "id": "${ref:id:productCategory:Ecxus:Cleaning}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Cleaning",
                        "createdAt": "2024-03-06T02:00:00.000Z",
                        "updatedAt": "2024-03-06T02:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": "${ref:var:lastResponse.nextCursor}"
            }
            """
        And I send a "GET" request to "/product-category" with the query:
            | pagination.cursor | ${ref:var:lastResponse.nextCursor} |
            | pagination.limit  | 2                                  |
            | pagination.sort   | {"createdAt": "asc"}               |
        And the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "data": [
                    {
                        "id": "${ref:id:productCategory:Ecxus:Drinks}",
                        "companyId": "${ref:id:company:Ecxus}",
                        "name": "Drinks",
                        "createdAt": "2024-03-06T03:00:00.000Z",
                        "updatedAt": "2024-03-06T03:00:00.000Z"
                    }
                ],
                "totalCount": 3,
                "nextCursor": null
            }
            """

    Scenario: Viewing a product category
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "GET" request to "/product-category/${ref:id:productCategory:Ecxus:Drinks}"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:productCategory:Ecxus:Drinks}",
                "companyId": "${ref:id:company:Ecxus}",
                "name": "Drinks",
                "createdAt": "2024-03-06T03:00:00.000Z",
                "updatedAt": "2024-03-06T03:00:00.000Z"
            }
            """

    Scenario: Viewing a product category that does not exist
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            573a3ac3-a05a-48aa-80b1-1869a73bfe8c
            """
        When I send a "GET" request to "/product-category/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Product category not found"
