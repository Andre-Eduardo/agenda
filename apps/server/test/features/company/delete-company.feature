Feature: Delete company
    As a user, I want to delete a company so that I can remove it from the system

    Background:
        Given the following users exist:
            | Username | Global role |
            | john_doe | OWNER       |
        And the following companies exist:
            | Name   |
            | Fuego  |
            | Canada |
            | Calla  |
        And the following employees with system access in the company "Fuego" exist:
            | User       | Permissions |
            | william123 | []          |

    Scenario: Preventing unauthorized users from deleting a company
        Given I am signed in as "william123"
        When I send a "DELETE" request to "/company/${ref:id:company:Calla}"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Deleting a company
        Given the current date and time is "2020-01-01T03:00:00Z"
        And I am signed in as "john_doe"
        When I send a "DELETE" request to "/company/${ref:id:company:Calla}"
        Then the request should succeed with a 200 status code
        And no company with name "Calla" should exist
        And the following companies should exist:
            | Name   |
            | Fuego  |
            | Canada |
        And the following events should be recorded:
            | Type            | Timestamp              | User ID                   |
            | COMPANY_DELETED | "2020-01-01T03:00:00Z" | "${ref:id:user:john_doe}" |

    Scenario: Deleting a company that does not exist
        Given I am signed in as "john_doe"
        And "unknown-id" is defined as:
            """
            b937e300-3364-4c7d-b6ed-675deea6e89e
            """
        When I send a "DELETE" request to "/company/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Company not found"
