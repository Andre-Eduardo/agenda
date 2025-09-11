Feature: Update supplier
    As a user, I want to update a supplier so that I can keep the supplier information up to date

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions       |
            | john_doe   | [supplier:update] |
            | william123 | []                |
        And the following suppliers exist in the company "Ecxus":
            | Name  | Document ID    | Phone      | Gender | Person type | Created at           | Updated at           |
            | john  | 100.000.000-01 | "12345678" | MALE   | NATURAL     | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | Andre | 100.000.000-02 | "11111111" | MALE   | NATURAL     | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | Lucas | 100.000.000-03 | "11111111" |        | LEGAL       | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |

    Scenario: Preventing unauthorized users from updating a supplier
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "PUT" request to "/supplier/${ref:id:supplier:Ecxus:10000000003}" with:
            | name        | Edu         |
            | phone       | "123456789" |
            | companyName | ACME        |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Updating a supplier
        Given the current date and time is "2024-01-01T05:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/supplier/${ref:id:supplier:Ecxus:10000000003}" with:
            | name        | Edu         |
            | phone       | "123456789" |
            | companyName | ACME        |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:supplier:Ecxus:10000000003}",
                "companyId": "${ref:id:company:Ecxus}",
                "name": "Edu",
                "personType": "LEGAL",
                "documentId": "10000000003",
                "profiles": [
                    "SUPPLIER"
                ],
                "phone": "123456789",
                "gender": null,
                "companyName": "ACME",
                "createdAt": "2020-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T05:00:00.000Z"
            }
            """
        Given should exist suppliers in the company "Ecxus" with the following data:
            | Name  | Company name | Document ID    | Phone       | Gender | Person type | Created at           | Updated at           |
            | john  |              | 100.000.000-01 | "12345678"  | MALE   | NATURAL     | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | Andre |              | 100.000.000-02 | "11111111"  | MALE   | NATURAL     | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | Edu   | ACME         | 100.000.000-03 | "123456789" |        | LEGAL       | 2020-01-01T01:00:00Z | 2024-01-01T05:00:00Z |
        And the following events in the company "Ecxus" should be recorded:
            | Type             | Timestamp              | User ID                   |
            | SUPPLIER_CHANGED | "2024-01-01T05:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario Outline: Updating a supplier with invalid information
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/supplier/${ref:id:supplier:Ecxus:10000000001}" with:
            | <Field> | <Value> |
        Then I should receive an invalid input error on "<Field>" with reason "<Reason>"

        Examples:
            | Field       | Value              | Reason                                                                                                 |
            | name        | ""                 | String must contain at least 1 character(s)                                                            |
            | name        | 1                  | Expected string, received number                                                                       |
            | name        | true               | Expected string, received boolean                                                                      |
            | companyName | ""                 | String must contain at least 1 character(s)                                                            |
            | companyName | 1                  | Expected string, received number                                                                       |
            | companyName | true               | Expected string, received boolean                                                                      |
            | phone       | ""                 | Invalid phone                                                                                          |
            | phone       | "123--123"         | Invalid phone                                                                                          |
            | phone       | 1                  | Expected string, received number                                                                       |
            | phone       | true               | Expected string, received boolean                                                                      |
            | documentId  | ""                 | Invalid document ID                                                                                    |
            | documentId  | "188.888.888..888" | Invalid document ID                                                                                    |
            | documentId  | 188888888888       | Expected string, received number                                                                       |
            | documentId  | true               | Expected string, received boolean                                                                      |
            | gender      | ""                 | Invalid enum value. Expected \\'MALE\\' \| \\'FEMALE\\' \| \\'OTHER\\', received ''                    |
            | gender      | "188.888.888.888"  | Invalid enum value. Expected \\'MALE\\' \| \\'FEMALE\\' \| \\'OTHER\\', received \\'188.888.888.888\\' |
            | gender      | aaaa               | Invalid enum value. Expected \\'MALE\\' \| \\'FEMALE\\' \| \\'OTHER\\', received \\'aaaa\\'            |
            | gender      | true               | Expected \\'MALE\\' \| \\'FEMALE\\' \| \\'OTHER\\', received boolean                                   |
            | personType  | ""                 | Invalid enum value. Expected \\'NATURAL\\' \| \\'LEGAL\\', received ''                                 |
            | personType  | "188.888.888.888"  | Invalid enum value. Expected \\'NATURAL\\' \| \\'LEGAL\\', received \\'188.888.888.888\\'              |
            | personType  | aaaa               | Invalid enum value. Expected \\'NATURAL\\' \| \\'LEGAL\\', received \\'aaaa\\'                         |
            | personType  | true               | Expected \\'NATURAL\\' \| \\'LEGAL\\', received boolean                                                |

    Scenario: Updating a natural supplier person with a company name
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/supplier/${ref:id:supplier:Ecxus:10000000001}" with:
            | companyName | Lush |
        Then I should receive an invalid input error with message "Only legal persons can have a company name."

    Scenario: Updating a legal supplier person with a gender
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/supplier/${ref:id:supplier:Ecxus:10000000003}" with:
            | gender | MALE |
        Then I should receive an invalid input error with message "Only natural persons can have a gender."

    Scenario: Updating a supplier that does not exist
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            7f3c4fbe-bbb4-4c32-8cce-a68f3c992839
            """
        When I send a "PUT" request to "/supplier/${ref:var:unknown-id}" with:
            | name | Lush |
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Supplier not found"
