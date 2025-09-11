Feature: Delete service
    As a user I want to delete a service so that I can remove it from the system

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions      |
            | john-doe   | [service:delete] |
            | william123 | []               |
        And  a service category with name "Maintenance" in the company "Ecxus" exists
        And the following services exist in the company "Ecxus" and service category "Maintenance":
            | Code | Name       | Price |
            | 1    | Cleaning   | 100   |
            | 25   | Automation | 250   |

    Scenario: Preventing unauthorized users from deleting a service
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "DELETE" request to "/service/${ref:id:service:Ecxus:1}"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Deleting a service
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john-doe" in the company "Ecxus"
        When I send a "DELETE" request to "/service/${ref:id:service:Ecxus:1}"
        Then the request should succeed with a 200 status code
        And the following services in the company "Ecxus" should exist:
            | Code | Name       | Price |
            | 25   | Automation | 250   |
        And the following events in the company "Ecxus" should be recorded:
            | Type            | Timestamp              | User ID                   |
            | SERVICE_DELETED | "2024-01-01T01:00:00Z" | "${ref:id:user:john-doe}" |

    Scenario: Deleting a service that does not exist
        Given I am signed in as "john-doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            b937e300-3364-4c7d-b6ed-675deea6e89e
            """
        When I send a "DELETE" request to "/service/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Service not found"
