Feature: Update account
    As a user I want to update an account so that I can keep my account information up to date

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions      |
            | john_doe   | [account:update] |
            | william123 | []               |
        And the following accounts exist in the company "Ecxus":
            | Name      | Type     | Bank ID | Agency Number | Agency Digit | Account Number | Account Digit | Created at           | Updated at           |
            | Santander | BANK     | null    | null          | null         | null           | null          | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | Caixa     | INTERNAL | null    | null          | null         | null           | null          | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |

    Scenario: Preventing unauthorized users from updating an account
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "PUT" request to "/account/${ref:id:account:Ecxus:Santander}" with:
            | name | NUBANK |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Updating an account
        Given the current date and time is "2024-01-06T04:00:00.000Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/account/${ref:id:account:Ecxus:Santander}" with:
            | bankId        | 1     |
            | agencyNumber  | 1234  |
            | agencyDigit   | x     |
            | accountNumber | 12345 |
            | accountDigit  | "0"   |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:account:Ecxus:Santander}",
                "companyId": "${ref:id:company:Ecxus}",
                "name": "Santander",
                "type": "BANK",
                "bankId": 1,
                "agencyNumber": 1234,
                "agencyDigit": "x",
                "accountNumber": 12345,
                "accountDigit": "0",
                "createdAt": "2020-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-06T04:00:00.000Z"
            }
            """
        And should exist accounts in the company "Ecxus" with the following data:
            | Name      | Type     | Bank ID | Agency Number | Agency Digit | Account Number | Account Digit | Created at           | Updated at           |
            | Santander | BANK     | 1       | 1234          | x            | 12345          | "0"           | 2020-01-01T01:00:00Z | 2024-01-06T04:00:00Z |
            | Caixa     | INTERNAL | null    | null          | null         | null           | null          | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
        And the following events in the company "Ecxus" should be recorded:
            | Type            | Timestamp                  | User ID                   |
            | ACCOUNT_CHANGED | "2024-01-06T04:00:00.000Z" | "${ref:id:user:john_doe}" |

    Scenario: Updating internal account with bank information
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/account/${ref:id:account:Ecxus:Caixa}" with:
            | name   | Bradesco |
            | type   | INTERNAL |
            | bankId | 1        |
        Then I should receive an invalid input error with message "Internal accounts cannot have bank information."

    Scenario Outline: Updating an account with invalid information
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/account/${ref:id:account:Ecxus:Caixa}" with:
            | <Field> | <Value> |
        Then I should receive an invalid input error on "<Field>" with reason "<Reason>"

        Examples:
            | Field         | Value   | Reason                                                           |
            | name          | ""      | String must contain at least 1 character(s)                      |
            | name          | 1       | Expected string, received number                                 |
            | name          | true    | Expected string, received boolean                                |
            | type          | 0       | Invalid enum value. Expected 'INTERNAL' \| 'BANK', received '0'  |
            | type          | true    | Expected 'INTERNAL' \| 'BANK', received boolean                  |
            | type          | "P1"    | Invalid enum value. Expected 'INTERNAL' \| 'BANK', received 'P1' |
            | bankId        | "1"     | Expected number, received string                                 |
            | bankId        | -1      | Number must be greater than or equal to 0                        |
            | agencyNumber  | "1234"  | Expected number, received string                                 |
            | agencyNumber  | -1      | Number must be greater than or equal to 0                        |
            | agencyDigit   | -1      | Expected string, received number                                 |
            | accountNumber | "12345" | Expected number, received string                                 |
            | accountNumber | -1      | Number must be greater than or equal to 0                        |
            | accountDigit  | -1      | Expected string, received number                                 |

    Scenario: Updating an account that does not exist
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            7f3c4fbe-bbb4-4c32-8cce-a68f3c992839
            """
        When I send a "PUT" request to "/account/${ref:var:unknown-id}" with:
            | name  | Red Wine |
            | price | 200      |
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Account not found"
