Feature: Create payment method
    As a user, I want to create a payment method so that I can define how the company will receive and make payments

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions             |
            | john_doe   | [payment-method:create] |
            | william123 | []                      |

    Scenario: Preventing unauthorized users from creating a payment method
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "POST" request to "/payment-method" with:
            | name | Master credit |
            | type | CREDIT_CARD   |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Create a payment method
        Given the current date and time is "2024-01-01T12:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/payment-method" with:
            | name | Master credit |
            | type | CREDIT_CARD   |
        Then the request should succeed with a 201 status code
        And the response should match:
            """YAML
            {
                "id": _.isEntityId,
                "companyId": "${ref:id:company:Ecxus}",
                "name": "Master credit",
                "type": "CREDIT_CARD",
                "createdAt": "2024-01-01T12:00:00.000Z",
                "updatedAt": "2024-01-01T12:00:00.000Z"
            }
            """
        And should exist payment methods in the company "Ecxus" with the following data:
            | Name          | Type        |
            | Master credit | CREDIT_CARD |
        And the following events in the company "Ecxus" should be recorded:
            | Type                   | Timestamp              | User ID                   |
            | PAYMENT_METHOD_CREATED | "2024-01-01T12:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario Outline: Choosing an invalid name
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/payment-method" with:
            | name | <Name>      |
            | type | CREDIT_CARD |
        Then I should receive an invalid input error on "name" with reason "<Reason>"

        Examples:
            | Name | Reason                                      |
            | ""   | String must contain at least 1 character(s) |
            | 1    | Expected string, received number            |
            | true | Expected string, received boolean           |

    Scenario Outline: Choosing an invalid type
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/payment-method" with:
            | name | Master credit |
            | type | <Type>        |
        Then I should receive an invalid input error on "type" with reason "<Reason>"

        Examples:
            | Type | Reason                                                                                                                            |
            | aaaa | Invalid enum value. Expected \'CASH\' \| \'PIX\' \| \'CREDIT_CARD\' \| \'DEBIT_CARD\' \| \'PAWN\' \| \'OTHER\', received \'aaaa\' |
            | 1    | Invalid enum value. Expected \'CASH\' \| \'PIX\' \| \'CREDIT_CARD\' \| \'DEBIT_CARD\' \| \'PAWN\' \| \'OTHER\', received \'1\'    |
            | true | Expected \'CASH\' \| \'PIX\' \| \'CREDIT_CARD\' \| \'DEBIT_CARD\' \| \'PAWN\' \| \'OTHER\', received boolean                      |
