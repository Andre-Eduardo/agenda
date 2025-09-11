Feature: Change user password
    As a user, I want to change my password so that I can keep my account secure.

    Background:
        Given a company with name "Ecxus" exists
        And the following users exist:
            | Username   | Password    | Global role | Companies |
            | john_doe   | J0hn.Do3    | OWNER       | [Ecxus]   |
            | jorge-bush | j00rG3@123  | NONE        | [Ecxus]   |
            | anaa123    | "@naAa4321" | NONE        | [Ecxus]   |

    Scenario: Changing my user password
        Given the current date and time is "2020-01-01T03:00:00Z"
        And I am signed in as "jorge-bush"
        When I send a "PATCH" request to "/user/change-password" with:
            | oldPassword | j00rG3@123 |
            | newPassword | j00rG3@124 |
        Then the request should succeed with a 200 status code
        And the password of user "jorge-bush" is "j00rG3@124"
        And the following events should be recorded:
            | Type                  | Timestamp              | User ID                     |
            | USER_PASSWORD_CHANGED | "2020-01-01T03:00:00Z" | "${ref:id:user:jorge-bush}" |

    Scenario: Trying to change the password providing an incorrect old password
        Given I am signed in as "jorge-bush"
        When I send a "PATCH" request to "/user/change-password" with:
            | oldPassword | j00rG3@87654321 |
            | newPassword | j00rG3@12345678 |
        Then I should receive an access denied error with message "Incorrect password." and reason BAD_CREDENTIALS

    Scenario: Trying to change the password being signed out
        When I send a "PATCH" request to "/user/change-password" with:
            | oldPassword | j00rG3@123 |
            | newPassword | j00rG3@124 |
        Then I should receive an unauthenticated error
