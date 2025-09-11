Feature: Update user
    As a user, I want to update my information so that I can keep my profile up to date

    Background:
        Given a company with name "Ecxus" exists
        And the following users exist:
            | Username   | Email                | Password    | First name | Last name | Global role | Companies | Created at           | Updated at           |
            | john_doe   | john.doe@ecxus.com   | J0hn.Do3    | John       | Doe       | OWNER       | [Ecxus]   | 2020-01-01T03:00:00Z | 2020-01-01T03:00:00Z |
            | jorge-bush | jorge-bush@ecxus.com | j00rG3@123  | Jorge      |           | OWNER       | [Ecxus]   | 2020-01-01T02:00:00Z | 2020-01-01T02:00:00Z |
            | anaa123    | anaa123@ecxus.com    | "@naAa4321" | Ana        | Collen    | NONE        | [Ecxus]   | 2020-01-01T01:00:00Z | 2020-01-01T01:00:00Z |

    Scenario: Preventing unauthorized users from updating a user
        Given I am signed in as "anaa123"
        When I send a "PUT" request to "/user/${ref:id:user:anaa123}" with:
            | username        | anaa1234            |
            | email           | aaanaa123@ecxus.com |
            | firstName       | Anna                |
            | lastName        |                     |
            | currentPassword | "@naAa4321"         |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Updating a user
        Given the current date and time is "2024-01-01T05:00:00Z"
        And I am signed in as "john_doe"
        When I send a "PUT" request to "/user/${ref:id:user:anaa123}" with:
            | username        | anaa1234            |
            | email           | aaanaa123@ecxus.com |
            | firstName       | Anna                |
            | lastName        |                     |
            | currentPassword | "@naAa4321"         |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
                "id": "${ref:id:user:anaa123}",
                "username": "anaa1234",
                "email": "aaanaa123@ecxus.com",
                "firstName": "Anna",
                "lastName": null,
                "createdAt": "2020-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T05:00:00.000Z"
            }
            """
        And should exist users with the following data:
            | Username   | Email                | First name | Last name | Created at           | Updated at           |
            | john_doe   | john.doe@ecxus.com   | John       | Doe       | 2020-01-01T03:00:00Z | 2020-01-01T03:00:00Z |
            | jorge-bush | jorge-bush@ecxus.com | Jorge      |           | 2020-01-01T02:00:00Z | 2020-01-01T02:00:00Z |
            | anaa1234   | aaanaa123@ecxus.com  | Anna       |           | 2020-01-01T01:00:00Z | 2024-01-01T05:00:00Z |
        And the following events should be recorded:
            | Type         | Timestamp              | User ID                   |
            | USER_CHANGED | "2024-01-01T05:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario Outline: Updating a user with invalid information
        Given I am signed in as "john_doe"
        When I send a "PUT" request to "/user/${ref:id:user:john_doe}" with:
            | <Field>         | <Value>  |
            | currentPassword | J0hn.Do3 |
        Then I should receive an invalid input error on "<Field>" with reason "<Reason>"

        Examples:
            | Field     | Value                           | Reason                                                                                                                          |
            | username  | john..doe                       | The username must be between 1 and 30 characters long and can only contain letters, numbers, hyphens, underscores, and periods. |
            | username  | -john.doe!                      | The username must be between 1 and 30 characters long and can only contain letters, numbers, hyphens, underscores, and periods. |
            | username  | john.doeeeeeeeeeeeeeeeeeeeeeeee | The username must be between 1 and 30 characters long and can only contain letters, numbers, hyphens, underscores, and periods. |
            | email     | john                            | Invalid email format                                                                                                            |
            | email     | john.doe@.                      | Invalid email format                                                                                                            |
            | email     | john.doe@@com                   | Invalid email format                                                                                                            |
            | firstName | ""                              | String must contain at least 1 character(s)                                                                                     |
            | firstName | 1                               | Expected string, received number                                                                                                |
            | firstName | true                            | Expected string, received boolean                                                                                               |
            | lastName  | ""                              | String must contain at least 1 character(s)                                                                                     |
            | lastName  | 1                               | Expected string, received number                                                                                                |
            | lastName  | true                            | Expected string, received boolean                                                                                               |

    Scenario Outline: Trying to update with a username already in use
        Given I am signed in as "jorge-bush"
        When I send a "PUT" request to "/user/${ref:id:user:jorge-bush}" with:
            | username        | <Username> |
            | currentPassword | j00rG3@123 |
        Then I should receive a precondition failed error with message "Cannot update the user with a username already in use."

        Examples:
            | Username |
            | john_doe |
            | John_Doe |
            | jOhN_dOe |

    Scenario Outline: Trying to update with an email already in use
        Given I am signed in as "jorge-bush"
        When I send a "PUT" request to "/user/${ref:id:user:jorge-bush}" with:
            | email           | <Email>    |
            | currentPassword | j00rG3@123 |
        Then I should receive a precondition failed error with message "Cannot update the user with an email already in use."

        Examples:
            | Email              |
            | john.doe@ecxus.com |
            | JOHN.doe@ecxus.com |
            | joHN.dOe@ecxus.com |

    Scenario: Trying to update the user providing an incorrect password
        Given I am signed in as "jorge-bush"
        When I send a "PUT" request to "/user/${ref:id:user:jorge-bush}" with:
            | username        | jorge       |
            | currentPassword | "@naAa4321" |
        Then I should receive an access denied error with message "Incorrect password." and reason BAD_CREDENTIALS

    Scenario: Updating a user that does not exist
        Given I am signed in as "john_doe"
        And "unknown-id" is defined as:
            """
            b3326988-6c94-4f2c-b88e-923c4450e8f7
            """
        When I send a "PUT" request to "/user/${ref:var:unknown-id}" with:
            | username        | anaa1234    |
            | currentPassword | "@naAa4321" |
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "User not found."
