Feature: Update employee
    As a user, I want to update an employee so that I can keep the employee information up to date

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions       |
            | john_doe   | [employee:update] |
            | william123 | []                |
        And the following employee positions exist in the company 'Ecxus':
            | Name    |
            | Manager |
            | Admin   |
        And the following employees exist in the company "Ecxus":
            | Name        | Document ID    | Position | Phone      | Gender | Person type | Allow system access | User        | Created at           | Updated at           |
            | Marie Curie | 100.000.000-01 | Admin    | "12345678" | FEMALE | NATURAL     | true                | marie.curie | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | Andre       | 100.000.000-02 | Admin    | "11111111" | MALE   | NATURAL     | false               |             | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | Lucas       | 100.000.000-03 | Admin    | "11111111" |        | LEGAL       | false               |             | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |

    Scenario: Preventing unauthorized users from updating an employee
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "PUT" request to "/employee/${ref:id:employee:Ecxus:10000000003}" with:
            | name        | Edu                                      |
            | phone       | "123456789"                              |
            | companyName | ACME                                     |
            | positionId  | ${ref:id:employeePosition:Ecxus:Manager} |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Updating a employee
        Given the current date and time is "2024-01-01T05:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/employee/${ref:id:employee:Ecxus:10000000003}" with:
            | name        | Edu                                      |
            | phone       | "123456789"                              |
            | companyName | ACME                                     |
            | positionId  | ${ref:id:employeePosition:Ecxus:Manager} |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:employee:Ecxus:10000000003}",
                "companyId": "${ref:id:company:Ecxus}",
                "name": "Edu",
                "personType": "LEGAL",
                "documentId": "10000000003",
                "positionId": "${ref:id:employeePosition:Ecxus:Manager}",
                "profiles": [
                    "EMPLOYEE"
                ],
                "phone": "123456789",
                "gender": null,
                "companyName": "ACME",
                "allowSystemAccess": false,
                "createdAt": "2020-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T05:00:00.000Z"
            }
            """
        And should exist employees in the company "Ecxus" with the following data:
            | Name        | Company name | Position | Document ID    | Phone       | Gender | Person type | Allow system access | User        | Created at           | Updated at           |
            | Marie Curie |              | Admin    | 100.000.000-01 | "12345678"  | FEMALE | NATURAL     | true                | marie.curie | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | Andre       |              | Admin    | 100.000.000-02 | "11111111"  | MALE   | NATURAL     | false               |             | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | Edu         | ACME         | Manager  | 100.000.000-03 | "123456789" |        | LEGAL       | false               |             | 2020-01-01T01:00:00Z | 2024-01-01T05:00:00Z |
        And the following events in the company "Ecxus" should be recorded:
            | Type             | Timestamp              | User ID                   |
            | EMPLOYEE_CHANGED | "2024-01-01T05:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario: Allowing system access to an employee
        Given the current date and time is "2024-01-01T05:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/employee/${ref:id:employee:Ecxus:10000000002}" with:
            | allowSystemAccess | true       |
            | username          | _andre_    |
            | password          | _@@ndR3@@_ |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:employee:Ecxus:10000000002}",
                "companyId": "${ref:id:company:Ecxus}",
                "name": "Andre",
                "personType": "NATURAL",
                "documentId": "10000000002",
                "positionId": "${ref:id:employeePosition:Ecxus:Admin}",
                "profiles": [
                    "EMPLOYEE"
                ],
                "phone": "11111111",
                "gender": "MALE",
                "companyName": null,
                "allowSystemAccess": true,
                "createdAt": "2020-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T05:00:00.000Z"
            }
            """
        And should exist employees in the company "Ecxus" with the following data:
            | Name        | Company name | Position | Document ID    | Phone      | Gender | Person type | Allow system access | User        | Created at           | Updated at           |
            | Marie Curie |              | Admin    | 100.000.000-01 | "12345678" | FEMALE | NATURAL     | true                | marie.curie | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | Andre       |              | Admin    | 100.000.000-02 | "11111111" | MALE   | NATURAL     | true                | _andre_     | 2020-01-01T01:00:00Z | 2024-01-01T05:00:00Z |
            | Lucas       |              | Admin    | 100.000.000-03 | "11111111" |        | LEGAL       | false               |             | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
        And should exist users with the following data:
            | Username | Email | First name | Last name |
            | _andre_  |       | Andre      |           |
        And the following events in the company "Ecxus" should be recorded:
            | Type             | Timestamp              | User ID                   |
            | EMPLOYEE_CHANGED | "2024-01-01T05:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario: Updating the username of an employee
        Given the current date and time is "2024-01-01T05:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/employee/${ref:id:employee:Ecxus:10000000001}" with:
            | allowSystemAccess | true     |
            | username          | marie123 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:employee:Ecxus:10000000001}",
                "companyId": "${ref:id:company:Ecxus}",
                "name": "Marie Curie",
                "personType": "NATURAL",
                "documentId": "10000000001",
                "positionId": "${ref:id:employeePosition:Ecxus:Admin}",
                "profiles": [
                    "EMPLOYEE"
                ],
                "phone": "12345678",
                "gender": "FEMALE",
                "companyName": null,
                "allowSystemAccess": true,
                "createdAt": "2020-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T05:00:00.000Z"
            }
            """
        And should exist employees in the company "Ecxus" with the following data:
            | Name        | Company name | Position | Document ID    | Phone      | Gender | Person type | Allow system access | User     | Created at           | Updated at           |
            | Marie Curie |              | Admin    | 100.000.000-01 | "12345678" | FEMALE | NATURAL     | true                | marie123 | 2020-01-01T01:00:00Z | 2024-01-01T05:00:00Z |
            | Andre       |              | Admin    | 100.000.000-02 | "11111111" | MALE   | NATURAL     | false               |          | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | Lucas       |              | Admin    | 100.000.000-03 | "11111111" |        | LEGAL       | false               |          | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
        And should exist users with the following data:
            | Username |
            | marie123 |
        And the following events in the company "Ecxus" should be recorded:
            | Type             | Timestamp              | User ID                   |
            | EMPLOYEE_CHANGED | "2024-01-01T05:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario: Removing system access from an employee
        Given the current date and time is "2024-01-01T05:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/employee/${ref:id:employee:Ecxus:10000000001}" with:
            | allowSystemAccess | false |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:employee:Ecxus:10000000001}",
                "companyId": "${ref:id:company:Ecxus}",
                "name": "Marie Curie",
                "personType": "NATURAL",
                "documentId": "10000000001",
                "positionId": "${ref:id:employeePosition:Ecxus:Admin}",
                "profiles": [
                    "EMPLOYEE"
                ],
                "phone": "12345678",
                "gender": "FEMALE",
                "companyName": null,
                "allowSystemAccess": false,
                "createdAt": "2020-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T05:00:00.000Z"
            }
            """
        And should exist employees in the company "Ecxus" with the following data:
            | Name        | Company name | Position | Document ID    | Phone      | Gender | Person type | Allow system access | User | Created at           | Updated at           |
            | Marie Curie |              | Admin    | 100.000.000-01 | "12345678" | FEMALE | NATURAL     | false               |      | 2020-01-01T01:00:00Z | 2024-01-01T05:00:00Z |
            | Andre       |              | Admin    | 100.000.000-02 | "11111111" | MALE   | NATURAL     | false               |      | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
            | Lucas       |              | Admin    | 100.000.000-03 | "11111111" |        | LEGAL       | false               |      | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |
        And should exist users with the following data:
            | Username    |
            | marie.curie |
        And the following users should not exist in the company "Ecxus":
            | Username    |
            | marie.curie |
        And the following events in the company "Ecxus" should be recorded:
            | Type             | Timestamp              | User ID                   |
            | EMPLOYEE_CHANGED | "2024-01-01T05:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario Outline: Updating a employee with invalid information
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/employee/${ref:id:employee:Ecxus:10000000001}" with:
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
            | positionId  | ""                 | Malformed ID. Expected a valid entity ID.                                                              |
            | positionId  | "188.888.888.888"  | Malformed ID. Expected a valid entity ID.                                                              |
            | positionId  | 188888888888       | Expected string, received number                                                                       |
            | positionId  | true               | Expected string, received boolean                                                                      |

    Scenario: Updating a natural employee person with a company name
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/employee/${ref:id:employee:Ecxus:10000000001}" with:
            | companyName | Lush |
        Then I should receive an invalid input error with message "Only legal persons can have a company name."

    Scenario: Updating a legal employee person with a gender
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/employee/${ref:id:employee:Ecxus:10000000003}" with:
            | gender | MALE |
        Then I should receive an invalid input error with message "Only natural persons can have a gender."

    Scenario: Updating an employee that does not exist
        Given I am signed in as "john_doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            7f3c4fbe-bbb4-4c32-8cce-a68f3c992839
            """
        When I send a "PUT" request to "/employee/${ref:var:unknown-id}" with:
            | name | Lush |
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Employee not found"

    Scenario Outline: Trying to update an employee giving system access without user credentials
        Given the current date and time is "2024-01-01T05:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/employee/${ref:id:employee:Ecxus:10000000002}" with:
            | allowSystemAccess | true       |
            | username          | <Username> |
            | password          | <Password> |
        Then I should receive a precondition failed error with message "The username and password are required to allow system access."

        Examples:
            | Username   | Password |
            | william123 |          |
            |            | W1lli@am |

    Scenario: Trying to update an employee with system access with a username already in use
        Given the current date and time is "2024-01-01T05:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "PUT" request to "/employee/${ref:id:employee:Ecxus:10000000001}" with:
            | allowSystemAccess | true     |
            | username          | john_doe |
        Then I should receive a precondition failed error with message "Cannot update the user with a username already in use."
