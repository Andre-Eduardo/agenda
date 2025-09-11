Feature: Create transaction
    As a user, I want to create a transaction so that I can keep track of the company's financial transactions

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions          |
            | john_doe   | [transaction:create] |
            | william123 | []                   |
        And the following customers exist in the company "Ecxus":
            | Name | Document ID    |
            | john | 100.000.000-01 |
        And a room category with name "Lush" in the company "Ecxus" exists
        And the following reservations exist in the company "Ecxus":
            | Room category name | Booked by               | Booked for                           |
            | Lush               | ${ref:id:user:john_doe} | ${ref:id:customer:Ecxus:10000000001} |
        And the following payment methods exist in the company "Ecxus":
            | Name |
            | Cash |

    Scenario: Preventing unauthorized users from creating a transaction
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "POST" request to "/transaction" with:
            | counterpartyId  | ${ref:id:customer:Ecxus:10000000001} |
            | responsibleId   | ${ref:id:user:john_doe}              |
            | amount          | 100.00                               |
            | type            | EXPENSE                              |
            | description     | Transaction description              |
            | paymentMethodId | ${ref:id:paymentMethod:Ecxus:Cash}   |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Creating a transaction
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/transaction" with:
            | counterpartyId  | ${ref:id:customer:Ecxus:10000000001} |
            | responsibleId   | ${ref:id:user:john_doe}              |
            | amount          | 100.00                               |
            | type            | EXPENSE                              |
            | description     | Transaction description              |
            | paymentMethodId | ${ref:id:paymentMethod:Ecxus:Cash}   |
        Then the request should succeed with a 201 status code
        And the response should match:
            """YAML
            {
                "id": _.isEntityId,
                "companyId": "${ref:id:company:Ecxus}",
                "counterpartyId": "${ref:id:customer:Ecxus:10000000001}",
                "responsibleId": "${ref:id:user:john_doe}",
                "amount": 100,
                "paymentMethodId": "${ref:id:paymentMethod:Ecxus:Cash}",
                "type": "EXPENSE",
                "description": "Transaction description",
                "originId": null,
                "originType": null,
                "createdAt": "2024-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T01:00:00.000Z"
            }
            """
        And should exist transactions in the company "Ecxus" with the following data:
            | Counterparty ID                      | Responsible ID          | Amount | Description             |
            | ${ref:id:customer:Ecxus:10000000001} | ${ref:id:user:john_doe} | 100.0  | Transaction description |
        And the following events in the company "Ecxus" should be recorded:
            | Type                | Timestamp              | User ID                   |
            | TRANSACTION_CREATED | "2024-01-01T01:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario Outline: Choosing an invalid responsible ID
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/transaction" with:
            | amount         | 100.00                               |
            | type           | EXPENSE                              |
            | responsibleId  | <Responsible ID>                     |
            | counterpartyId | ${ref:id:customer:Ecxus:10000000001} |
        Then I should receive an invalid input error on "responsibleId" with reason "<Reason>"

        Examples:
            | Responsible ID    | Reason                                    |
            | ""                | Malformed ID. Expected a valid entity ID. |
            | "188.888.888.888" | Malformed ID. Expected a valid entity ID. |
            | 188888888888      | Expected string, received number          |
            | true              | Expected string, received boolean         |

    Scenario Outline: Choosing an invalid counterparty ID
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/transaction" with:
            | amount         | 100.00                  |
            | type           | EXPENSE                 |
            | counterpartyId | <Counterparty ID>       |
            | responsibleId  | ${ref:id:user:john_doe} |
        Then I should receive an invalid input error on "counterpartyId" with reason "<Reason>"

        Examples:
            | Counterparty ID   | Reason                                    |
            | ""                | Malformed ID. Expected a valid entity ID. |
            | "188.888.888.888" | Malformed ID. Expected a valid entity ID. |
            | 188888888888      | Expected string, received number          |
            | true              | Expected string, received boolean         |

    Scenario Outline: Choosing an invalid amount
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/transaction" with:
            | amount         | <Amount>                             |
            | type           | EXPENSE                              |
            | counterpartyId | ${ref:id:customer:Ecxus:10000000001} |
            | responsibleId  | ${ref:id:user:john_doe}              |
        Then I should receive an invalid input error on "amount" with reason "<Reason>"

        Examples:
            | Amount            | Reason                            |
            | ""                | Expected number, received string  |
            | "188.888.888.888" | Expected number, received string  |
            | -188              | Number must be greater than 0     |
            | 0                 | Number must be greater than 0     |
            | true              | Expected number, received boolean |

    Scenario Outline: Choosing an invalid type
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/transaction" with:
            | amount         | 100                                  |
            | type           | <Type>                               |
            | counterpartyId | ${ref:id:customer:Ecxus:10000000001} |
            | responsibleId  | ${ref:id:user:john_doe}              |
        Then I should receive an invalid input error on "type" with reason "<Reason>"

        Examples:
            | Type              | Reason                                                                                     |
            | ""                | Invalid enum value. Expected \\'INCOME\\' \| \\'EXPENSE\\', received ''                    |
            | "188.888.888.888" | Invalid enum value. Expected \\'INCOME\\' \| \\'EXPENSE\\', received \\'188.888.888.888\\' |
            | aaaa              | Invalid enum value. Expected \\'INCOME\\' \| \\'EXPENSE\\', received \\'aaaa\\'            |
            | true              | Expected \\'INCOME\\' \| \\'EXPENSE\\', received boolean                                   |
