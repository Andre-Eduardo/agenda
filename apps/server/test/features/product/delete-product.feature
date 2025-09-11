Feature: Delete product
    As a user I want to delete a product so that I can remove it from the system

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions      |
            | john_doe   | [product:delete] |
            | william123 | []               |
        And a product category with name "Drinks" in the company "Ecxus" exists
        And the following products exist in the company "Ecxus" and product category "Drinks":
            | Code | Name    | Price |
            | 1    | Whiskey | 100   |
            | 2    | Vodka   | 50    |
            | 3    | Rum     | 75    |

    Scenario: Preventing unauthorized users from deleting a product
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "DELETE" request to "/product/${ref:id:product:Ecxus:1}"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Deleting a product
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "DELETE" request to "/product/${ref:id:product:Ecxus:1}"
        Then the request should succeed with a 200 status code
        And the following products in the company "Ecxus" should exist:
            | Code | Name  | Price |
            | 2    | Vodka | 50    |
            | 3    | Rum   | 75    |
        And the following events in the company "Ecxus" should be recorded:
            | Type            | Timestamp            | User ID                 |
            | PRODUCT_DELETED | 2024-01-01T01:00:00Z | ${ref:id:user:john_doe} |

    Scenario: Deleting a product that does not exist
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            b937e300-3364-4c7d-b6ed-675deea6e89e
            """
        When I send a "DELETE" request to "/product/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Product not found"
