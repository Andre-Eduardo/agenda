Feature: Delete service category
    As a user, I want to delete a service category so that I can remove it from the system.

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User       | Permissions               |
            | john-doe   | [service-category:delete] |
            | william123 | []                        |
        And the following service categories exist in the company "Ecxus":
            | Name              |
            | Maintenance       |
            | Technical support |

    Scenario: Preventing unauthorized users from deleting a service category
        Given I am signed in as "william123" in the company "Ecxus"
        When I send a "DELETE" request to "/service-category/${ref:id:serviceCategory:Ecxus:Maintenance}"
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario: Deleting a service category
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john-doe" in the company "Ecxus"
        When I send a "DELETE" request to "/service-category/${ref:id:serviceCategory:Ecxus:Maintenance}"
        Then the request should succeed with a 200 status code
        And no service category with name "Maintenance" should exist in the company "Ecxus"
        And the following service categories in the company "Ecxus" should exist:
            | Name              |
            | Technical support |
        And the following events in the company "Ecxus" should be recorded:
            | Type                     | Timestamp              | User ID                   |
            | SERVICE_CATEGORY_DELETED | "2024-01-01T01:00:00Z" | "${ref:id:user:john-doe}" |

    Scenario: Deleting a non-existent service category
        Given I am signed in as "john-doe" in the company "Ecxus"
        And "unknown-id" is defined as:
            """
            b937e300-3364-4c7d-b6ed-675deea6e89e
            """
        When I send a "DELETE" request to "/service-category/${ref:var:unknown-id}"
        Then I should receive a resource not found error on "${ref:var:unknown-id}" with reason "Service category not found"
