Feature: Create employee
    As a user, I want to create an employee so that I can offer my services to them

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions       |
            | john_doe   | [employee:create] |
            | william123 | []                |
        And an employee position with name "Manager" in the company "Ecxus" exists
        And the following customers exist in the company "Ecxus":
            | Name | Document ID    | Person type | Phone      | Gender | Created at           | Updated at           |
            | Carl | 100.000.000-01 | NATURAL     | '12341234' | MALE   | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |

    Scenario: Preventing unauthorized users from creating an employee
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "POST" request to "/employee" with:
            | name              | Employee 1                               |
            | documentId        | '100.000.000-17'                         |
            | phone             | '12341234'                               |
            | positionId        | ${ref:id:employeePosition:Ecxus:Manager} |
            | gender            | MALE                                     |
            | personType        | NATURAL                                  |
            | allowSystemAccess | false                                    |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Creating an employee
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/employee" with:
            | name              | Employee 1                               |
            | documentId        | '100.000.000-17'                         |
            | phone             | '12341234'                               |
            | positionId        | ${ref:id:employeePosition:Ecxus:Manager} |
            | gender            | MALE                                     |
            | personType        | NATURAL                                  |
            | allowSystemAccess | false                                    |
        Then the request should succeed with a 201 status code
        And the response should match:
            """YAML
            {
                "id": _.isEntityId,
                "companyId": "${ref:id:company:Ecxus}",
                "name": "Employee 1",
                "companyName": null,
                "documentId": "10000000017",
                "personType": "NATURAL",
                "profiles": ["EMPLOYEE"],
                "phone": "12341234",
                "positionId": "${ref:id:employeePosition:Ecxus:Manager}",
                "gender": "MALE",
                "allowSystemAccess": false,
                "createdAt": "2024-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T01:00:00.000Z"
            }
            """
        And should exist employees in the company "Ecxus" with the following data:
            | Name       | Document ID   | Position | Phone      | Gender | Person type | Allow system access |
            | Employee 1 | '10000000017' | Manager  | '12341234' | MALE   | NATURAL     | false               |
        And the following events in the company "Ecxus" should be recorded:
            | Type             | Timestamp              | User ID                   |
            | EMPLOYEE_CREATED | "2024-01-01T01:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario: Creating an employee from a customer
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/employee" with:
            | id                | ${ref:id:customer:Ecxus:10000000001}     |
            | positionId        | ${ref:id:employeePosition:Ecxus:Manager} |
            | allowSystemAccess | false                                    |
        Then the request should succeed with a 201 status code
        And the response should match:
            """YAML
            {
                "id": "${ref:id:customer:Ecxus:10000000001}",
                "companyId": "${ref:id:company:Ecxus}",
                "name": "Carl",
                "companyName": null,
                "documentId": "10000000001",
                "personType": "NATURAL",
                "profiles": ["CUSTOMER", "EMPLOYEE"],
                "phone": "12341234",
                "positionId": "${ref:id:employeePosition:Ecxus:Manager}",
                "gender": "MALE",
                "allowSystemAccess": false,
                "createdAt": "2024-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T01:00:00.000Z"
            }
            """
        And should exist employees in the company "Ecxus" with the following data:
            | Name | Document ID   | Position | Phone      | Gender | Allow system access |
            | Carl | '10000000001' | Manager  | '12341234' | MALE   | false               |
        And the following events in the company "Ecxus" should be recorded:
            | Type             | Timestamp              | User ID                   |
            | EMPLOYEE_CREATED | "2024-01-01T01:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario: Creating an employee with system access
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/employee" with:
            | name              | William Bush                             |
            | documentId        | 100.000.000-17                           |
            | phone             | '12341234'                               |
            | positionId        | ${ref:id:employeePosition:Ecxus:Manager} |
            | gender            | MALE                                     |
            | personType        | NATURAL                                  |
            | allowSystemAccess | true                                     |
            | username          | william_321                              |
            | password          | W1lli@am                                 |
        Then the request should succeed with a 201 status code
        And the response should match:
            """YAML
            {
                "id": _.isEntityId,
                "companyId": "${ref:id:company:Ecxus}",
                "name": "William Bush",
                "companyName": null,
                "documentId": "10000000017",
                "personType": "NATURAL",
                "profiles": ["EMPLOYEE"],
                "phone": "12341234",
                "positionId": "${ref:id:employeePosition:Ecxus:Manager}",
                "gender": "MALE",
                "allowSystemAccess": true,
                "createdAt": "2024-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T01:00:00.000Z"
            }
            """
        And should exist employees in the company "Ecxus" with the following data:
            | Name         | Document ID   | Position | Phone      | Gender | Person type | Allow system access |
            | William Bush | '10000000017' | Manager  | '12341234' | MALE   | NATURAL     | true                |
        And should exist users with the following data:
            | Username    | Email | First name | Last name |
            | william_321 |       | William    | Bush      |
        And the following events in the company "Ecxus" should be recorded:
            | Type             | Timestamp              | User ID                   |
            | EMPLOYEE_CREATED | "2024-01-01T01:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario: Creating an employee with system access from a customer
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/employee" with:
            | id                | ${ref:id:customer:Ecxus:10000000001}     |
            | positionId        | ${ref:id:employeePosition:Ecxus:Manager} |
            | allowSystemAccess | true                                     |
            | username          | carl.max                                 |
            | password          | C@rl_m4x                                 |
        Then the request should succeed with a 201 status code
        And the response should match:
            """YAML
            {
                "id": "${ref:id:customer:Ecxus:10000000001}",
                "companyId": "${ref:id:company:Ecxus}",
                "name": "Carl",
                "companyName": null,
                "documentId": "10000000001",
                "personType": "NATURAL",
                "profiles": ["CUSTOMER", "EMPLOYEE"],
                "phone": "12341234",
                "positionId": "${ref:id:employeePosition:Ecxus:Manager}",
                "gender": "MALE",
                "allowSystemAccess": true,
                "createdAt": "2024-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T01:00:00.000Z"
            }
            """
        And should exist employees in the company "Ecxus" with the following data:
            | Name | Document ID   | Position | Phone      | Gender | Allow system access |
            | Carl | '10000000001' | Manager  | '12341234' | MALE   | true                |
        And should exist users with the following data:
            | Username | Email | First name | Last name |
            | carl.max |       | Carl       |           |
        And the following events in the company "Ecxus" should be recorded:
            | Type             | Timestamp              | User ID                   |
            | EMPLOYEE_CREATED | "2024-01-01T01:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario Outline: Choosing an invalid name
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/employee" with:
            | name       | <Name>                                   |
            | documentId | 100.000.000-17                           |
            | positionId | ${ref:id:employeePosition:Ecxus:Manager} |
            | personType | NATURAL                                  |
        Then I should receive an invalid input error on "name" with reason "<Reason>"

        Examples:
            | Name | Reason                                      |
            | ""   | String must contain at least 1 character(s) |
            | 1    | Expected string, received number            |
            | true | Expected string, received boolean           |

    Scenario Outline: Choosing an invalid company name
        Given the current date and time is "2024-01-01T05:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/employee" with:
            | name        | jonh                                     |
            | companyName | <Company name>                           |
            | documentId  | 100.000.000-17                           |
            | positionId  | ${ref:id:employeePosition:Ecxus:Manager} |
            | personType  | LEGAL                                    |
        Then I should receive an invalid input error on "companyName" with reason "<Reason>"

        Examples:
            | Company name | Reason                                      |
            | ""           | String must contain at least 1 character(s) |
            | 1            | Expected string, received number            |
            | true         | Expected string, received boolean           |

    Scenario Outline: Choosing an invalid phone
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/employee" with:
            | name       | Employee 1                               |
            | documentId | 100.000.000-17                           |
            | positionId | ${ref:id:employeePosition:Ecxus:Manager} |
            | personType | NATURAL                                  |
            | phone      | <Phone>                                  |
        Then I should receive an invalid input error on "phone" with reason "<Reason>"

        Examples:
            | Phone      | Reason                            |
            | ""         | Invalid phone                     |
            | "123--123" | Invalid phone                     |
            | 1          | Expected string, received number  |
            | true       | Expected string, received boolean |

    Scenario Outline: Choosing an invalid document ID
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/employee" with:
            | name       | Employee 1                               |
            | documentId | <Document ID>                            |
            | positionId | ${ref:id:employeePosition:Ecxus:Manager} |
            | personType | NATURAL                                  |
        Then I should receive an invalid input error on "documentId" with reason "<Reason>"

        Examples:
            | Document ID        | Reason                            |
            | ""                 | Invalid document ID               |
            | "188.888.888..888" | Invalid document ID               |
            | 188888888888       | Expected string, received number  |
            | true               | Expected string, received boolean |

    Scenario Outline: Choosing an invalid position
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/employee" with:
            | name       | Employee 1     |
            | documentId | 000.000.000-17 |
            | positionId | <Position ID>  |
            | personType | NATURAL        |
        Then I should receive an invalid input error on "positionId" with reason "<Reason>"

        Examples:
            | Position ID       | Reason                                    |
            | ""                | Malformed ID. Expected a valid entity ID. |
            | "188.888.888.888" | Malformed ID. Expected a valid entity ID. |
            | 188888888888      | Expected string, received number          |
            | true              | Expected string, received boolean         |

    Scenario Outline: Choosing an invalid gender
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/employee" with:
            | name       | Employee 1                               |
            | documentId | 000.000.000-17                           |
            | positionId | ${ref:id:employeePosition:Ecxus:Manager} |
            | personType | NATURAL                                  |
            | gender     | <Gender>                                 |
        Then I should receive an invalid input error on "gender" with reason "<Reason>"

        Examples:
            | Gender            | Reason                                                                                                 |
            | ""                | Invalid enum value. Expected \\'MALE\\' \| \\'FEMALE\\' \| \\'OTHER\\', received ''                    |
            | "188.888.888.888" | Invalid enum value. Expected \\'MALE\\' \| \\'FEMALE\\' \| \\'OTHER\\', received \\'188.888.888.888\\' |
            | aaaa              | Invalid enum value. Expected \\'MALE\\' \| \\'FEMALE\\' \| \\'OTHER\\', received \\'aaaa\\'            |
            | true              | Expected \\'MALE\\' \| \\'FEMALE\\' \| \\'OTHER\\', received boolean                                   |

    Scenario Outline: Choosing an invalid person type
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/employee" with:
            | name       | Customer 1                               |
            | documentId | 000.000.000-17                           |
            | positionId | ${ref:id:employeePosition:Ecxus:Manager} |
            | gender     | MALE                                     |
            | personType | <Person type>                            |
        Then I should receive an invalid input error on "personType" with reason "<Reason>"

        Examples:
            | Person type       | Reason                                                                                    |
            | ""                | Invalid enum value. Expected \\'NATURAL\\' \| \\'LEGAL\\', received ''                    |
            | "188.888.888.888" | Invalid enum value. Expected \\'NATURAL\\' \| \\'LEGAL\\', received \\'188.888.888.888\\' |
            | aaaa              | Invalid enum value. Expected \\'NATURAL\\' \| \\'LEGAL\\', received \\'aaaa\\'            |
            | true              | Expected \\'NATURAL\\' \| \\'LEGAL\\', received boolean                                   |

    Scenario Outline: Trying to create an employee with system access without user credentials
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/employee" with:
            | name              | William Bush                             |
            | documentId        | 100.000.000-17                           |
            | positionId        | ${ref:id:employeePosition:Ecxus:Manager} |
            | personType        | NATURAL                                  |
            | allowSystemAccess | true                                     |
            | username          | <Username>                               |
            | password          | <Password>                               |
        Then I should receive a precondition failed error with message "The username and password are required to allow system access."

        Examples:
            | Username   | Password |
            | william123 |          |
            |            | W1lli@am |

    Scenario: Trying to create an employee with system access with a username already in use
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/employee" with:
            | name              | William Bush                             |
            | documentId        | 100.000.000-17                           |
            | positionId        | ${ref:id:employeePosition:Ecxus:Manager} |
            | personType        | NATURAL                                  |
            | allowSystemAccess | true                                     |
            | username          | john_doe                                 |
            | password          | W1lli@am                                 |
        Then I should receive a precondition failed error with message "Cannot create a user with a username already in use."
