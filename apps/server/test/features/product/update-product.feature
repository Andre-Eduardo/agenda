Feature: Update product
    As a user I want to update a product so that I can keep my product information up to date

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions      |
            | john_doe   | [product:update] |
            | william123 | []               |
        And a product category with name "Drinks" in the company "Ecxus" exists
        And the following products exist in the company "Ecxus" and product category "Drinks":
            | Code | Name    | Price | Created at           | Updated at           |
            | 1    | Whiskey | 100   | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | 2    | Vodka   | 50    | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | 3    | Gin     | 75    | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |

    Scenario: Preventing unauthorized users from updating a product
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "PUT" request to "/product/${ref:id:product:Ecxus:1}" with:
            | name  | Red Wine |
            | price | 200      |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Updating a product
        Given the current date and time is "2024-01-06T04:00:00.000Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/product/${ref:id:product:Ecxus:1}" with:
            | name  | Red Wine |
            | price | 200      |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:product:Ecxus:1}",
                "companyId": "${ref:id:company:Ecxus}",
                "categoryId": "${ref:id:productCategory:Ecxus:Drinks}",
                "code": 1,
                "name": "Red Wine",
                "price": 200,
                "createdAt": "2020-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-06T04:00:00.000Z"
            }
            """
        And should exist products in the company "Ecxus" with the following data:
            | Code | Name     | Price |
            | 1    | Red Wine | 200   |
            | 2    | Vodka    | 50    |
            | 3    | Gin      | 75    |
        And the following events in the company "Ecxus" should be recorded:
            | Type            | Timestamp                  | User ID                   |
            | PRODUCT_CHANGED | "2024-01-06T04:00:00.000Z" | "${ref:id:user:john_doe}" |

    Scenario Outline: Updating a product with invalid information
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/product/${ref:id:product:Ecxus:1}" with:
            | <Field> | <Value> |
        Then I should receive an invalid input error on "<Field>" with reason "<Reason>"

        Examples:
            | Field | Value | Reason                                      |
            | code  |       | Expected number, received null              |
            | code  | 0     | Number must be greater than 0               |
            | code  | true  | Expected number, received boolean           |
            | code  | "P1"  | Expected number, received string            |
            | name  | ""    | String must contain at least 1 character(s) |
            | name  | 1     | Expected string, received number            |
            | name  | true  | Expected string, received boolean           |
            | price | -1    | Number must be greater than or equal to 0   |
            | price | true  | Expected number, received boolean           |
            | price | "1"   | Expected number, received string            |

    Scenario: Updating a product that does not exist
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            7f3c4fbe-bbb4-4c32-8cce-a68f3c992839
            """
        When I send a "PUT" request to "/product/${ref:var:unknown-id}" with:
            | name  | Red Wine |
            | price | 200      |
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Product not found"
