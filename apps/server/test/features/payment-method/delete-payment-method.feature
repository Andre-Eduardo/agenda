Feature: Delete payment method
    As a user, I want to delete a payment method so that I cannot use it anymore for payments

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions             |
            | john_doe   | [payment-method:delete] |
            | william123 | []                      |
        And the following payment methods exist in the company "Ecxus":
            | Name          | Type        |
            | Cash          | CASH        |
            | Master credit | CREDIT_CARD |
            | Visa debit    | DEBIT_CARD  |
            | Pix           | PIX         |
            | Bank check    | OTHER       |

    Scenario: Preventing unauthorized users from deleting a payment method
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "DELETE" request to "/payment-method/${ref:id:paymentMethod:Ecxus:Bank check}"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Deleting a payment method
        Given the current date and time is "2024-01-01T12:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "DELETE" request to "/payment-method/${ref:id:paymentMethod:Ecxus:Bank check}"
        Then the request should succeed with a 200 status code
        And no payment method with name "Bank check" should exist in the company "Ecxus"
        And the following payment methods in the company "Ecxus" should exist:
            | Name          | Type        |
            | Cash          | CASH        |
            | Master credit | CREDIT_CARD |
            | Visa debit    | DEBIT_CARD  |
            | Pix           | PIX         |
        And the following events in the company "Ecxus" should be recorded:
            | Type                   | Timestamp              | User ID                   |
            | PAYMENT_METHOD_DELETED | "2024-01-01T12:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario: Deleting a payment method that does not exist
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            b937e300-3364-4c7d-b6ed-675deea6e89e
            """
        When I send a "DELETE" request to "/payment-method/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Payment method not found"
