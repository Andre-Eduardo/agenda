Feature: Update transaction
    As a user, I want to update a transaction so that I can keep the transaction information up to date

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions          |
            | john_doe   | [transaction:update] |
            | william123 | []                   |
        And the following customers exist in the company "Ecxus":
            | Name | Document ID    |
            | john | 100.000.000-01 |
        And the following payment methods exist in the company "Ecxus":
            | Name |
            | Cash |
        And the following transactions exist in the company "Ecxus":
            | Counterparty ID                      | Responsible ID          | Amount | Description        | Type    | Payment method ID                  | Created at           | Updated at           |
            | ${ref:id:customer:Ecxus:10000000001} | ${ref:id:user:john_doe} | 100    | card transaction   | INCOME  | ${ref:id:paymentMethod:Ecxus:Cash} | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | ${ref:id:customer:Ecxus:10000000001} | ${ref:id:user:john_doe} | 50     | pix transaction    | INCOME  | ${ref:id:paymentMethod:Ecxus:Cash} | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | ${ref:id:customer:Ecxus:10000000001} | ${ref:id:user:john_doe} | 20     | update transaction | EXPENSE | ${ref:id:paymentMethod:Ecxus:Cash} | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |

    Scenario: Preventing unauthorized users from updating a transaction
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "PUT" request to "/transaction/${ref:id:transaction:Ecxus:EXPENSE:20}" with:
            | amount      | 30        |
            | description | Analysing |
            | type        | INCOME    |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Updating a transaction
        Given the current date and time is "2024-01-01T05:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/transaction/${ref:id:transaction:Ecxus:EXPENSE:20}" with:
            | amount      | 30        |
            | description | Analysing |
            | type        | INCOME    |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:transaction:Ecxus:EXPENSE:20}",
                "counterpartyId": "${ref:id:customer:Ecxus:10000000001}",
                "responsibleId": "${ref:id:user:john_doe}",
                "amount": 30,
                "paymentMethodId": "${ref:id:paymentMethod:Ecxus:Cash}",
                "description": "Analysing",
                "type": "INCOME",
                "originId": null,
                "originType": null,
                "companyId": "${ref:id:company:Ecxus}",
                "createdAt": "2020-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T05:00:00.000Z"
            }
            """
        And should exist transactions in the company "Ecxus" with the following data:
            | Counterparty ID                      | Responsible ID          | Amount | Description      | Type   | Created at           | Updated at           |
            | ${ref:id:customer:Ecxus:10000000001} | ${ref:id:user:john_doe} | 100    | card transaction | INCOME | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | ${ref:id:customer:Ecxus:10000000001} | ${ref:id:user:john_doe} | 50     | pix transaction  | INCOME | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | ${ref:id:customer:Ecxus:10000000001} | ${ref:id:user:john_doe} | 30     | Analysing        | INCOME | 2020-01-01T01:00:00Z | 2024-01-01T05:00:00Z |
        And the following events in the company "Ecxus" should be recorded:
            | Type                | Timestamp              | User ID                   |
            | TRANSACTION_CHANGED | "2024-01-01T05:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario Outline: Updating a transaction with invalid information
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/transaction/${ref:id:transaction:Ecxus:INCOME:100}" with:
            | <Field> | <Value> |
        Then I should receive an invalid input error on "<Field>" with reason "<Reason>"

        Examples:
            | Field          | Value             | Reason                                                                                     |
            | counterpartyId | ""                | Malformed ID. Expected a valid entity ID.                                                  |
            | counterpartyId | "188.888.888.888" | Malformed ID. Expected a valid entity ID.                                                  |
            | counterpartyId | 188888888888      | Expected string, received number                                                           |
            | counterpartyId | true              | Expected string, received boolean                                                          |
            | responsibleId  | ""                | Malformed ID. Expected a valid entity ID.                                                  |
            | responsibleId  | "188.888.888.888" | Malformed ID. Expected a valid entity ID.                                                  |
            | responsibleId  | 188888888888      | Expected string, received number                                                           |
            | responsibleId  | true              | Expected string, received boolean                                                          |
            | description    | ""                | String must contain at least 1 character(s)                                                |
            | description    | 1                 | Expected string, received number                                                           |
            | description    | true              | Expected string, received boolean                                                          |
            | amount         | ""                | Expected number, received string                                                           |
            | amount         | "123--123"        | Expected number, received string                                                           |
            | amount         | true              | Expected number, received boolean                                                          |
            | type           | ""                | Invalid enum value. Expected \\'INCOME\\' \| \\'EXPENSE\\', received ''                    |
            | type           | "188.888.888.888" | Invalid enum value. Expected \\'INCOME\\' \| \\'EXPENSE\\', received \\'188.888.888.888\\' |
            | type           | aaaa              | Invalid enum value. Expected \\'INCOME\\' \| \\'EXPENSE\\', received \\'aaaa\\'            |
            | type           | true              | Expected \\'INCOME\\' \| \\'EXPENSE\\', received boolean                                   |

    Scenario: Updating a transaction that does not exist
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            7f3c4fbe-bbb4-4c32-8cce-a68f3c992839
            """
        When I send a "PUT" request to "/transaction/${ref:var:unknown-id}" with:
            | amount | 500 |
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Transaction not found"
