Feature: Sign up
    As a new user, I want to sign up so that I can have access to the system

    Background:
        Given the following users exist:
            | Username | Email                | First name | Last name |
            | john_doe | john.doe@example.com | John       | Doe       |

    Scenario Outline: Signing up a new user
        Given the current date and time is "2024-01-01T05:00:00Z"
        When I send a "POST" request to "/user/sign-up" with:
            | username  | <Username>   |
            | email     | <Email>      |
            | password  | <Password>   |
            | firstName | <First name> |
            | lastName  | <Last name>  |
        Then the request should succeed with a 201 status code
        And the response should match:
            """YAML
            {
                "id": _.isEntityId,
                "username": "<Username>",
                "email": "<Email>",
                "firstName": "<First name>",
                "createdAt": "2024-01-01T05:00:00.000Z",
                "updatedAt": "2024-01-01T05:00:00.000Z"
                ...
            }
            """
        And the following events should be recorded:
            | Type           | Timestamp              |
            | USER_SIGNED_UP | "2024-01-01T05:00:00Z" |
        And should exist users with the following data:
            | Username   | Email                | First name   | Last name   |
            | john_doe   | john.doe@example.com | John         | Doe         |
            | <Username> | <Email>              | <First name> | <Last name> |

        Examples:
            | Username      | Email                     | Password   | First name | Last name |
            | william123    | william123@gmail.com      | W1lli@am   | William    | Bush      |
            | jane-curtis-1 | janecurstis1@ecxus.com.br | J@n3Curt1s | Jane       |           |
            | brenda_2      | littlebr@yahoo.com        | Br3nd@123  | Brenda     | Vega Frye |

    Scenario Outline: Choosing an invalid username
        When I send a "POST" request to "/user/sign-up" with:
            | username  | <Username>           |
            | email     | john.123@example.com |
            | password  | J0hn@d03             |
            | firstName | John                 |
        Then I should receive an invalid input error on "username" with reason "<Reason>"

        Examples:
            | Username                        | Reason                                                                                                                          |
            | john..doe                       | The username must be between 1 and 30 characters long and can only contain letters, numbers, hyphens, underscores, and periods. |
            | -john.doe!                      | The username must be between 1 and 30 characters long and can only contain letters, numbers, hyphens, underscores, and periods. |
            | john.doeeeeeeeeeeeeeeeeeeeeeeee | The username must be between 1 and 30 characters long and can only contain letters, numbers, hyphens, underscores, and periods. |

    Scenario Outline: Choosing an invalid email
        When I send a "POST" request to "/user/sign-up" with:
            | username  | john.doe |
            | email     | <Email>  |
            | password  | J0hn@d03 |
            | firstName | John     |
        Then I should receive an invalid input error on "email" with reason "<Reason>"

        Examples:
            | Email         | Reason               |
            | john          | Invalid email format |
            | john.doe@.    | Invalid email format |
            | john.doe@@com | Invalid email format |

    Scenario Outline: Choosing an invalid password
        When I send a "POST" request to "/user/sign-up" with:
            | username  | john.doe             |
            | email     | john.123@example.com |
            | password  | <Password>           |
            | firstName | John                 |
        Then I should receive an invalid input error on "password" with reason "<Reason>"

        Examples:
            | Password   | Reason                                                                                                                                                  |
            | "123"      | The password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one number, and one special character. |
            | "12345678" | The password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one number, and one special character. |
            | password   | The password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one number, and one special character. |
            | pa$sword1  | The password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one number, and one special character. |
            | Password1  | The password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one number, and one special character. |
            | Pa$$word   | The password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one number, and one special character. |

    Scenario Outline: Choosing an invalid first name
        When I send a "POST" request to "/user/sign-up" with:
            | username  | john.doe             |
            | email     | john.123@example.com |
            | password  | J0hn@d03             |
            | firstName | <First name>         |
        Then I should receive an invalid input error on "firstName" with reason "<Reason>"

        Examples:
            | First name | Reason                                      |
            | ""         | String must contain at least 1 character(s) |
            | 1          | Expected string, received number            |
            | true       | Expected string, received boolean           |

    Scenario Outline: Choosing an invalid last name
        When I send a "POST" request to "/user/sign-up" with:
            | username  | john.doe             |
            | email     | john.123@example.com |
            | password  | J0hn@d03             |
            | firstName | John                 |
            | lastName  | <Last name>          |
        Then I should receive an invalid input error on "lastName" with reason "<Reason>"

        Examples:
            | Last name | Reason                                      |
            | ""        | String must contain at least 1 character(s) |
            | 1         | Expected string, received number            |
            | true      | Expected string, received boolean           |

    Scenario Outline: Trying to sign up with a username already in use
        When I send a "POST" request to "/user/sign-up" with:
            | username  | <Username>           |
            | email     | john.123@example.com |
            | password  | J0hn@d03             |
            | firstName | John                 |
        Then I should receive a precondition failed error with message "Cannot create a user with a username already in use."

        Examples:
            | Username |
            | john_doe |
            | John_Doe |
            | jOhN_dOe |

    Scenario Outline: Trying to sign up with an email already in use
        When I send a "POST" request to "/user/sign-up" with:
            | username  | john.123 |
            | email     | <Email>  |
            | password  | J0hn@d03 |
            | firstName | John     |
            | lastName  | Doe      |
        Then I should receive a precondition failed error with message "Cannot create a user with an email already in use."

        Examples:
            | Email                |
            | john.doe@example.com |
            | JOHN.doe@example.com |
            | joHN.dOe@example.com |
