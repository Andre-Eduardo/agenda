Feature: Create product
    As a user, I want to create a product so I can sell it to customers.

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions      |
            | john_doe   | [product:create] |
            | william123 | []               |
        And a product category with name "Drinks" in the company "Ecxus" exists

    Scenario: Preventing unauthorized users from creating a product
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "POST" request to "/product" with:
            | categoryId | ${ref:id:productCategory:Ecxus:Drinks} |
            | code       | 1                                      |
            | name       | Whiskey                                |
            | price      | 100                                    |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Creating a product
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/product" with:
            | categoryId | ${ref:id:productCategory:Ecxus:Drinks} |
            | code       | 1                                      |
            | name       | Whiskey                                |
            | price      | 100                                    |
        Then the request should succeed with a 201 status code
        And the response should match:
            """YAML
            {
                "id": _.isEntityId,
                "companyId": "${ref:id:company:Ecxus}",
                "categoryId": "${ref:id:productCategory:Ecxus:Drinks}",
                "code": 1,
                "name": "Whiskey",
                "price": 100,
                "createdAt": "2024-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T01:00:00.000Z"
            }
            """
        And should exist products in the company "Ecxus" with the following data:
            | Code | Name    | Price |
            | 1    | Whiskey | 100   |
        And the following events in the company "Ecxus" should be recorded:
            | Type            | Timestamp            | User ID                 |
            | PRODUCT_CREATED | 2024-01-01T01:00:00Z | ${ref:id:user:john_doe} |

    Scenario Outline: Choosing an invalid code
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/product" with:
            | categoryId | ${ref:id:productCategory:Ecxus:Drinks} |
            | code       | <Code>                                 |
            | name       | Whiskey                                |
            | price      | 100                                    |
        Then I should receive an invalid input error on "code" with reason "<Reason>"

        Examples:
            | Code | Reason                            |
            |      | Expected number, received null    |
            | 0    | Number must be greater than 0     |
            | "P1" | Expected number, received string  |
            | true | Expected number, received boolean |

    Scenario Outline: Choosing an invalid name
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/product" with:
            | categoryId | ${ref:id:productCategory:Ecxus:Drinks} |
            | code       | 1                                      |
            | name       | <Name>                                 |
            | price      | 100                                    |
        Then I should receive an invalid input error on "name" with reason "<Reason>"

        Examples:
            | Name | Reason                                      |
            | ""   | String must contain at least 1 character(s) |
            |      | Expected string, received null              |
            | 1    | Expected string, received number            |
            | true | Expected string, received boolean           |

    Scenario Outline: Choosing an invalid price
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/product" with:
            | categoryId | ${ref:id:productCategory:Ecxus:Drinks} |
            | code       | 1                                      |
            | name       | Whiskey                                |
            | price      | <Price>                                |
        Then I should receive an invalid input error on "price" with reason "<Reason>"

        Examples:
            | Price | Reason                                    |
            |       | Expected number, received null            |
            | -1    | Number must be greater than or equal to 0 |
            | "P1"  | Expected number, received string          |
            | true  | Expected number, received boolean         |

    Scenario: Choosing a code already in use by another product
        Given I am signed in as "john_doe" in the company "Ecxus"
        And the following products exist in the company "Ecxus" and product category "Drinks":
            | Code | Price |
            | 1    | 100   |
        When I send a "POST" request to "/product" with:
            | categoryId | ${ref:id:productCategory:Ecxus:Drinks} |
            | name       | Whiskey                                |
            | price      | 100                                    |
            | code       | 1                                      |
        Then I should receive a precondition failed error with message "Cannot create a product with a code already in use."
