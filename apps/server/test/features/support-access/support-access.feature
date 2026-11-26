Feature: Global support access
    A global support user enters any clinic to check its configuration without being one of its
    employees: read-only, without clinical data, and every step recorded in the clinic audit log.

    Background:
        Given the following users exist:
            | Name          | Username | Email            | Password |
            | Dr. Alice     | dr_alice | alice@example.com | Alice.1! |
            | Ana (Suporte) | ana      | ana@example.com   | Ana.123! |
        And I am signed in as "dr_alice"
        And a professional "dr_alice" exists with specialty "MEDICINA"
        And the clinic member "dr_alice" also has the role "OWNER"
        And the user "ana" has the global role "SUPPORT"

    Scenario: A support user enters a clinic, reads it, and cannot change it
        Given I am signed in as "ana"
        When I send a "GET" request to "/api/v1/admin/clinics?limit=20"
        Then the request should succeed with a 200 status code
        When I send a "POST" request to "/api/v1/support-access/clinics/${ref:id:clinic:dr_alice}"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | supportAccess | true |
        And the audit trail of clinic "dr_alice" should show "SUPPORT_ACCESS:ENTER" by "ana"
        When I send a "GET" request to "/api/v1/clinic-members/me"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | supportAccess | true |
        When I send a "GET" request to "/api/v1/rooms"
        Then the request should succeed with a 200 status code
        When I send a "POST" request to "/api/v1/rooms" with:
            | name | Sala do suporte |
        Then the request should fail with a 403 status code
        And the audit trail of clinic "dr_alice" should show a denied "POST:createRoom" by "ana"
        When I send a "GET" request to "/api/v1/records"
        Then the request should fail with a 403 status code
        When I send a "POST" request to "/api/v1/support-access/leave"
        Then the request should succeed with a 204 status code
        And the audit trail of clinic "dr_alice" should show "SUPPORT_ACCESS:LEAVE" by "ana"
        When I send a "GET" request to "/api/v1/rooms"
        Then the request should fail with a 403 status code

    Scenario: The support user does not show up in the clinic team
        Given I am signed in as "ana"
        When I send a "POST" request to "/api/v1/support-access/clinics/${ref:id:clinic:dr_alice}"
        Then the request should succeed with a 200 status code
        Given I am signed in as "dr_alice" with professional "${ref:id:professional:dr_alice}"
        When I send a "GET" request to "/api/v1/clinic-members?clinicId=${ref:id:clinic:dr_alice}"
        Then the request should succeed with a 200 status code
        And the response list should not contain the user "ana"

    Scenario: A user without a global support role cannot enter other clinics
        Given the following users exist:
            | Name    | Username | Email           | Password |
            | Dr. Bob | dr_bob   | bob@example.com | Bob.123! |
        And I am signed in as "dr_bob"
        When I send a "POST" request to "/api/v1/support-access/clinics/${ref:id:clinic:dr_alice}"
        Then the request should fail with a 403 status code
        When I send a "GET" request to "/api/v1/admin/support-users"
        Then the request should fail with a 403 status code

    Scenario: A revoked support user loses the clinic at once
        Given I am signed in as "ana"
        When I send a "POST" request to "/api/v1/support-access/clinics/${ref:id:clinic:dr_alice}"
        Then the request should succeed with a 200 status code
        Given the user "ana" has the global role "NONE"
        When I send a "GET" request to "/api/v1/rooms"
        Then the request should fail with a 403 status code

    Scenario: A super admin creates and revokes support users
        Given the user "dr_alice" has the global role "SUPER_ADMIN"
        And I am signed in as "dr_alice"
        When I send a "POST" request to "/api/v1/admin/support-users" with:
            | name     | Carla (Suporte)       |
            | username | carla_${ref:var:contextId}    |
            | password | Carla.123!            |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "user" id for "carla"
        When I send a "GET" request to "/api/v1/admin/support-users"
        Then the request should succeed with a 200 status code
        When I send a "DELETE" request to "/api/v1/admin/support-users/${ref:id:user:carla}"
        Then the request should succeed with a 204 status code
