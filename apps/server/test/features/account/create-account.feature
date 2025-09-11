Feature: Create account
    As a user, I want to create an account so that I can manage my company's financial information.

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions      |
            | john_doe   | [account:create] |
            | william123 | []               |

    Scenario: Preventing unauthorized users from creating an account
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "POST" request to "/account" with:
            | name | Santander |
            | type | BANK      |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Creating a bank account
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/account" with:
            | name         | Santander |
            | type         | BANK      |
            | bankId       | 1         |
            | agencyNumber | 1234      |
        Then the request should succeed with a 201 status code
        And the response should match:
            """YAML
            {
                "id": _.isEntityId,
                "companyId": "${ref:id:company:Ecxus}",
                "name": "Santander",
                "type": "BANK",
                "bankId": 1,
                "agencyNumber": 1234,
                "agencyDigit": null,
                "accountNumber": null,
                "accountDigit": null,
                "createdAt": "2024-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T01:00:00.000Z"
            }
            """
        And should exist accounts in the company "Ecxus" with the following data:
            | Name      | Type | bank ID | Agency Number |
            | Santander | BANK | 1       | 1234          |
        And the following events in the company "Ecxus" should be recorded:
            | Type            | Timestamp            | User ID                 |
            | ACCOUNT_CREATED | 2024-01-01T01:00:00Z | ${ref:id:user:john_doe} |

    Scenario: Creating an internal account
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/account" with:
            | name | Santander |
            | type | INTERNAL  |
        Then the request should succeed with a 201 status code
        And the response should match:
            """YAML
            {
                "id": _.isEntityId,
                "companyId": "${ref:id:company:Ecxus}",
                "name": "Santander",
                "type": "INTERNAL",
                "bankId": null,
                "agencyNumber": null,
                "agencyDigit": null,
                "accountNumber": null,
                "accountDigit": null,
                "createdAt": "2024-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T01:00:00.000Z"
            }
            """
        And should exist accounts in the company "Ecxus" with the following data:
            | Name      | Type     |
            | Santander | INTERNAL |
        And the following events in the company "Ecxus" should be recorded:
            | Type            | Timestamp            | User ID                 |
            | ACCOUNT_CREATED | 2024-01-01T01:00:00Z | ${ref:id:user:john_doe} |

    Scenario: Choosing banking information for an internal account
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/account" with:
            | name   | Santander |
            | type   | INTERNAL  |
            | bankId | 1         |
        Then I should receive an invalid input error with message "Internal accounts cannot have bank information."

    Scenario Outline: Choosing an invalid name
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/account" with:
            | name | <Name>   |
            | type | INTERNAL |
        Then I should receive an invalid input error on "name" with reason "<Reason>"

        Examples:
            | Name | Reason                                      |
            | ""   | String must contain at least 1 character(s) |
            |      | Expected string, received null              |
            | 1    | Expected string, received number            |
            | true | Expected string, received boolean           |

    Scenario Outline: Choosing an invalid type
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/account" with:
            | name | Santander |
            | type | <Type>    |
        Then I should receive an invalid input error on "type" with reason "<Reason>"

        Examples:
            | Type | Reason                                                           |
            |      | Expected 'INTERNAL' \| 'BANK', received null                     |
            | 0    | Invalid enum value. Expected 'INTERNAL' \| 'BANK', received '0'  |
            | "P1" | Invalid enum value. Expected 'INTERNAL' \| 'BANK', received 'P1' |
            | true | Expected 'INTERNAL' \| 'BANK', received boolean                  |

    Scenario Outline: Choosing an invalid bank ID
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/account" with:
            | name   | Santander |
            | type   | BANK      |
            | bankId | <Bank ID> |
        Then I should receive an invalid input error on "bankId" with reason "<Reason>"

        Examples:
            | Bank ID | Reason                                    |
            | -1      | Number must be greater than or equal to 0 |
            | "P1"    | Expected number, received string          |
            | true    | Expected number, received boolean         |

    Scenario Outline: Choosing an invalid agency number
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/account" with:
            | name         | Santander       |
            | type         | BANK            |
            | agencyNumber | <Agency Number> |
        Then I should receive an invalid input error on "agencyNumber" with reason "<Reason>"

        Examples:
            | Agency Number | Reason                                    |
            | -1            | Number must be greater than or equal to 0 |
            | "P1"          | Expected number, received string          |
            | true          | Expected number, received boolean         |

    Scenario Outline: Choosing an invalid agency digit
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/account" with:
            | name        | Santander      |
            | type        | BANK           |
            | agencyDigit | <Agency Digit> |
        Then I should receive an invalid input error on "agencyDigit" with reason "<Reason>"

        Examples:
            | Agency Digit | Reason                            |
            | -1           | Expected string, received number  |
            | true         | Expected string, received boolean |

    Scenario Outline: Choosing an invalid account number
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/account" with:
            | name          | Santander        |
            | type          | BANK             |
            | accountNumber | <Account Number> |
        Then I should receive an invalid input error on "accountNumber" with reason "<Reason>"

        Examples:
            | Account Number | Reason                                    |
            | -1             | Number must be greater than or equal to 0 |
            | "P1"           | Expected number, received string          |
            | true           | Expected number, received boolean         |

    Scenario Outline: Choosing an invalid account digit
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/account" with:
            | name         | Santander       |
            | type         | BANK            |
            | accountDigit | <Account Digit> |
        Then I should receive an invalid input error on "accountDigit" with reason "<Reason>"

        Examples:
            | Account Digit | Reason                            |
            | -1            | Expected string, received number  |
            | true          | Expected string, received boolean |
