Feature: Update payment method
    As a user, I want to update a payment method so that I can keep my payment information up to date.

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions             |
            | john_doe   | [payment-method:update] |
            | william123 | []                      |
        And the following payment methods exist in the company "Ecxus":
            | Name          | Type        | Created at           | Updated at           |
            | Cash          | CASH        | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | Master credit | CREDIT_CARD | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | Visa debit    | DEBIT_CARD  | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | Pix           | PIX         | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | Bank check    | OTHER       | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |

    Scenario: Preventing unauthorized users from updating a payment method
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "PUT" request to "/payment-method/${ref:id:paymentMethod:Ecxus:Visa debit}" with:
            | name | Visa credit |
            | type | CREDIT_CARD |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Updating a payment method
        Given the current date and time is "2024-01-01T05:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/payment-method/${ref:id:paymentMethod:Ecxus:Visa debit}" with:
            | name | Visa credit |
            | type | CREDIT_CARD |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:paymentMethod:Ecxus:Visa debit}",
                "companyId": "${ref:id:company:Ecxus}",
                "name": "Visa credit",
                "type": "CREDIT_CARD",
                "createdAt": "2020-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T05:00:00.000Z"
            }
            """
        And should exist payment methods in the company "Ecxus" with the following data:
            | Name          | Type        | Created at           | Updated at           |
            | Cash          | CASH        | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | Master credit | CREDIT_CARD | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | Visa credit   | CREDIT_CARD | 2020-01-01T01:00:00Z | 2024-01-01T05:00:00Z |
            | Pix           | PIX         | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | Bank check    | OTHER       | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
        And the following events in the company "Ecxus" should be recorded:
            | Type                   | Timestamp              | User ID                   |
            | PAYMENT_METHOD_CHANGED | "2024-01-01T05:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario Outline: Updating a user with invalid information
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/payment-method/${ref:id:paymentMethod:Ecxus:Visa debit}" with:
            | <Field> | <Value> |
        Then I should receive an invalid input error on "<Field>" with reason "<Reason>"

        Examples:
            | Field | Value | Reason                                                                                                                            |
            | name  | ""    | String must contain at least 1 character(s)                                                                                       |
            | name  | 1     | Expected string, received number                                                                                                  |
            | name  | true  | Expected string, received boolean                                                                                                 |
            | type  | aaaa  | Invalid enum value. Expected \'CASH\' \| \'PIX\' \| \'CREDIT_CARD\' \| \'DEBIT_CARD\' \| \'PAWN\' \| \'OTHER\', received \'aaaa\' |
            | type  | 1     | Invalid enum value. Expected \'CASH\' \| \'PIX\' \| \'CREDIT_CARD\' \| \'DEBIT_CARD\' \| \'PAWN\' \| \'OTHER\', received \'1\'    |
            | type  | true  | Expected \'CASH\' \| \'PIX\' \| \'CREDIT_CARD\' \| \'DEBIT_CARD\' \| \'PAWN\' \| \'OTHER\', received boolean                      |

    Scenario: Updating a payment method that does not exist
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            7f3c4fbe-bbb4-4c32-8cce-a68f3c992839
            """
        When I send a "PUT" request to "/payment-method/${ref:var:unknown-id}" with:
            | name | Visa credit |
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Payment method not found"
