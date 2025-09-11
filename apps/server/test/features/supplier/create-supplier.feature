Feature: Create supplier
    As a user, I want to create a supplier so that he can offer products and other goods to me

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions       |
            | john_doe   | [supplier:create] |
            | william123 | []                |

    Scenario: Preventing unauthorized users from creating a supplier
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "POST" request to "/supplier" with:
            | name        | Supplier 1 |
            | documentId  | '11111'    |
            | phone       | '12341234' |
            | personType  | LEGAL      |
            | companyName | ACME       |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Creating a supplier
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/supplier" with:
            | name        | Supplier 1 |
            | documentId  | '11111'    |
            | phone       | '12341234' |
            | personType  | LEGAL      |
            | companyName | ACME       |
        Then the request should succeed with a 201 status code
        And the response should match:
            """YAML
            {
                "id": _.isEntityId,
                "companyId": "${ref:id:company:Ecxus}",
                "name": "Supplier 1",
                "companyName": "ACME",
                "personType": "LEGAL",
                "documentId": "11111",
                "profiles": ["SUPPLIER"],
                "phone": "12341234",
                "gender": null,
                "createdAt": "2024-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T01:00:00.000Z"
            }
            """
        And should exist suppliers in the company "Ecxus" with the following data:
            | Name       | Document ID | Phone      | Company name | Person type |
            | Supplier 1 | '11111'     | '12341234' | ACME         | LEGAL       |
        And the following events in the company "Ecxus" should be recorded:
            | Type             | Timestamp              | User ID                   |
            | SUPPLIER_CREATED | "2024-01-01T01:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario: Creating a supplier from a customer
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        And the following customers exist in the company "Ecxus":
            | Name | Document ID      | Phone      | Person type |
            | john | '01000000000112' | '12341234' | LEGAL       |
        When I send a "POST" request to "/supplier" with:
            | id | ${ref:id:customer:Ecxus:01000000000112} |
        Then the request should succeed with a 201 status code
        And the response should match:
            """YAML
            {
                "id": _.isEntityId,
                "companyId": "${ref:id:company:Ecxus}",
                "name": "john",
                "companyName": null,
                "personType": "LEGAL",
                "gender": null,
                "documentId": "01000000000112",
                "profiles": ["CUSTOMER", "SUPPLIER"],
                "phone": "12341234",
                "createdAt": "2024-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T01:00:00.000Z"
            }
            """
        And should exist suppliers in the company "Ecxus" with the following data:
            | Name | Document ID      | Phone      | Person type |
            | john | '01000000000112' | '12341234' | LEGAL       |
        And the following events in the company "Ecxus" should be recorded:
            | Type             | Timestamp              | User ID                   |
            | SUPPLIER_CREATED | "2024-01-01T01:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario Outline: Choosing an invalid name
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/supplier" with:
            | name        | <Name>         |
            | documentId  | 100.000.000-17 |
            | personType  | LEGAL          |
            | companyName | ACME           |
        Then I should receive an invalid input error on "name" with reason "<Reason>"

        Examples:
            | Name | Reason                                      |
            | ""   | String must contain at least 1 character(s) |
            | 1    | Expected string, received number            |
            | true | Expected string, received boolean           |

    Scenario Outline: Choosing an invalid company name
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/supplier" with:
            | name        | jonh           |
            | companyName | <Company name> |
            | documentId  | 100.000.000-17 |
            | personType  | LEGAL          |
        Then I should receive an invalid input error on "companyName" with reason "<Reason>"

        Examples:
            | Company name | Reason                                      |
            | ""           | String must contain at least 1 character(s) |
            | 1            | Expected string, received number            |
            | true         | Expected string, received boolean           |

    Scenario Outline: Choosing an invalid phone
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/supplier" with:
            | name        | Supplier 1     |
            | documentId  | 100.000.000-17 |
            | personType  | LEGAL          |
            | companyName | ACME           |
            | phone       | <Phone>        |
        Then I should receive an invalid input error on "phone" with reason "<Reason>"

        Examples:
            | Phone      | Reason                            |
            | ""         | Invalid phone                     |
            | "123--123" | Invalid phone                     |
            | 1          | Expected string, received number  |
            | true       | Expected string, received boolean |

    Scenario Outline: Choosing an invalid document ID
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/supplier" with:
            | name        | Supplier 1    |
            | documentId  | <Document ID> |
            | personType  | LEGAL         |
            | companyName | ACME          |
        Then I should receive an invalid input error on "documentId" with reason "<Reason>"

        Examples:
            | Document ID        | Reason                            |
            | ""                 | Invalid document ID               |
            | "188.888.888..888" | Invalid document ID               |
            | 188888888888       | Expected string, received number  |
            | true               | Expected string, received boolean |

    Scenario Outline: Choosing an invalid gender
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/supplier" with:
            | name       | Supplier 1     |
            | documentId | 000.000.000-17 |
            | gender     | <Gender>       |
            | personType | NATURAL        |
        Then I should receive an invalid input error on "gender" with reason "<Reason>"

        Examples:
            | Gender            | Reason                                                                                                 |
            | ""                | Invalid enum value. Expected \\'MALE\\' \| \\'FEMALE\\' \| \\'OTHER\\', received ''                    |
            | "188.888.888.888" | Invalid enum value. Expected \\'MALE\\' \| \\'FEMALE\\' \| \\'OTHER\\', received \\'188.888.888.888\\' |
            | aaaa              | Invalid enum value. Expected \\'MALE\\' \| \\'FEMALE\\' \| \\'OTHER\\', received \\'aaaa\\'            |
            | true              | Expected \\'MALE\\' \| \\'FEMALE\\' \| \\'OTHER\\', received boolean                                   |

    Scenario Outline: Choosing an invalid person type
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/supplier" with:
            | name       | Supplier 1     |
            | documentId | 000.000.000-17 |
            | gender     | MALE           |
            | personType | <Person type>  |
        Then I should receive an invalid input error on "personType" with reason "<Reason>"

        Examples:
            | Person type       | Reason                                                                                    |
            | ""                | Invalid enum value. Expected \\'NATURAL\\' \| \\'LEGAL\\', received ''                    |
            | "188.888.888.888" | Invalid enum value. Expected \\'NATURAL\\' \| \\'LEGAL\\', received \\'188.888.888.888\\' |
            | aaaa              | Invalid enum value. Expected \\'NATURAL\\' \| \\'LEGAL\\', received \\'aaaa\\'            |
            | true              | Expected \\'NATURAL\\' \| \\'LEGAL\\', received boolean                                   |
