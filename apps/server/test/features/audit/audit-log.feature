Feature: Immutable clinic audit trail
    Clinical access and denied audit-log access leave a trace that only clinic administrators can read.

    Background:
        Given the following users exist:
            | Name      | Username | Email             | Password |
            | Dr. Alice | dr_alice | alice@example.com | Alice.1! |
            | Dr. Bob   | dr_bob   | bob@example.com   | Bob.123! |
        And I am signed in as "dr_alice"
        And a professional "dr_alice" exists with specialty "MEDICINA"
        And the clinic member "dr_alice" also has the role "OWNER"
        And I am signed in as "dr_alice" with professional "${ref:id:professional:dr_alice}"
        When I send a "POST" request to "/api/v1/patients" with:
            | name       | Audit Patient  |
            | documentId | 111.222.333-44 |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "audited"

    Scenario: Clinical reading is recorded and visible to the clinic owner
        When I send a "GET" request to "/api/v1/patients/${ref:id:patient:audited}"
        Then the request should succeed with a 200 status code
        And the audit trail for patient "audited" should show a successful read by "dr_alice"
        When I send a "GET" request to "/api/v1/audit-logs"
        Then the request should succeed with a 200 status code
        And the audit response should contain the patient "audited"

    Scenario: A viewer cannot read the audit trail and the denial is recorded
        When I send a "POST" request to "/api/v1/clinic-members/invite" with:
            | userId      | ${ref:id:user:dr_bob} |
            | roles       | ["VIEWER"]           |
            | displayName | Dr. Bob              |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "clinicMember" id for "dr_bob"
        Given I am signed in as "dr_bob" with clinic member "${ref:id:clinicMember:dr_bob}"
        When I send a "GET" request to "/api/v1/audit-logs"
        Then the request should fail with a 403 status code
        And the audit trail should show access denied for "dr_bob" in clinic "dr_alice"

    Scenario: Another clinic cannot read the first clinic's trail
        Given I am signed in as "dr_bob"
        And a professional "dr_bob" exists with specialty "MEDICINA"
        And the clinic member "dr_bob" also has the role "OWNER"
        And I am signed in as "dr_bob" with professional "${ref:id:professional:dr_bob}"
        When I send a "GET" request to "/api/v1/audit-logs"
        Then the request should succeed with a 200 status code
        And the audit response should not contain the patient "audited"
