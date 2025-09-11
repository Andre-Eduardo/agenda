Feature: Update product category
    As a user, I want to update a product category so that I can keep my product categories up to date.

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions               |
            | john_doe   | [product-category:update] |
            | william123 | []                        |
        And the following product categories exist in the company "Ecxus":
            | Name       | Created at               | Updated at               |
            | Erotic     | 2024-03-06T03:00:00.000Z | 2024-03-06T03:00:00.000Z |
            | Food       | 2024-03-06T02:00:00.000Z | 2024-03-06T02:00:00.000Z |
            | Decorating | 2024-03-06T01:00:00.000Z | 2024-03-06T01:00:00.000Z |

    Scenario: Preventing unauthorized users from updating a product category
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "PUT" request to "/product-category/${ref:id:productCategory:Ecxus:Food}" with:
            | name | Food |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Updating a product category
        Given the current date and time is "2024-03-06T04:00:00.000Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/product-category/${ref:id:productCategory:Ecxus:Food}" with:
            | name | Food |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:productCategory:Ecxus:Food}",
                "companyId": "${ref:id:company:Ecxus}",
                "name": "Food",
                "createdAt": "2024-03-06T02:00:00.000Z",
                "updatedAt": "2024-03-06T04:00:00.000Z"
            }
            """
        And should exist product categories in the company "Ecxus" with the following data:
            | Name       | Created at               | Updated at               |
            | Erotic     | 2024-03-06T03:00:00.000Z | 2024-03-06T03:00:00.000Z |
            | Food       | 2024-03-06T02:00:00.000Z | 2024-03-06T04:00:00.000Z |
            | Decorating | 2024-03-06T01:00:00.000Z | 2024-03-06T01:00:00.000Z |
        And the following events in the company "Ecxus" should be recorded:
            | Type                     | Timestamp                  | User ID                   |
            | PRODUCT_CATEGORY_CHANGED | "2024-03-06T04:00:00.000Z" | "${ref:id:user:john_doe}" |

    Scenario Outline: Updating a product category with invalid information
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/product-category/${ref:id:productCategory:Ecxus:Decorating}" with:
            | <Field> | <Value> |
        Then I should receive an invalid input error on "<Field>" with reason "<Reason>"

        Examples:
            | Field | Value | Reason                                      |
            | name  | ""    | String must contain at least 1 character(s) |
            | name  |       | Expected string, received null              |
