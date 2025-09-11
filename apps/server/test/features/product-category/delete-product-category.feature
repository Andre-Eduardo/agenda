Feature: Delete product category
    As a user, I want to delete a product category so that I can remove it from the system.

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions               |
            | john_doe   | [product-category:delete] |
            | william123 | []                        |
        And the following product categories exist in the company "Ecxus":
            | Name       |
            | Drinks     |
            | Erotic     |
            | Cleaning   |
            | Decorating |

    Scenario: Preventing unauthorized users from deleting a product category
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "DELETE" request to "/product-category/${ref:id:productCategory:Ecxus:Drinks}"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Deleting a product category
        Given the current date and time is "2024-01-01T12:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "DELETE" request to "/product-category/${ref:id:productCategory:Ecxus:Drinks}"
        Then the request should succeed with a 200 status code
        And no product category with name "Drinks" should exist in the company "Ecxus"
        And the following product categories in the company "Ecxus" should exist:
            | Name       |
            | Erotic     |
            | Cleaning   |
            | Decorating |
        And the following events in the company "Ecxus" should be recorded:
            | Type                     | Timestamp              | User ID                   |
            | PRODUCT_CATEGORY_DELETED | "2024-01-01T12:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario: Deleting a non-existent product category
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            b937e300-3364-4c7d-b6ed-675deea6e89e
            """
        When I send a "DELETE" request to "/product-category/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Product category not found"
