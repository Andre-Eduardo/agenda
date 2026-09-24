Feature: Critical resource authorization
    A clinic member may act only within the selected clinic and on patients explicitly accessible to them.

    Background:
        Given the following users exist:
            | Name      | Username | Email                | Password  |
            | Dr. Alice | dr_alice | alice@example.com    | Alice.1!  |
            | Dr. Bob   | dr_bob   | bob@example.com      | Bob.123!  |
        And I am signed in as "dr_alice"
        And a professional "dr_alice" exists with specialty "MEDICINA"
        And the clinic member "dr_alice" also has the role "OWNER"
        And I am signed in as "dr_alice" with professional "${ref:id:professional:dr_alice}"
        When I send a "POST" request to "/api/v1/patients" with:
            | name       | Restricted Patient |
            | documentId | 111.222.333-44     |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "restricted"
        When I send a "POST" request to "/api/v1/records" with:
            | patientId                 | ${ref:id:patient:restricted}       |
            | responsibleProfessionalId | ${ref:id:professional:dr_alice} |
            | description               | Confidential note                  |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "record" id for "restricted"

    Scenario: Another clinic cannot read patients, records, appointments, or team members
        Given an appointment "restricted" exists for patient "restricted" attended by "dr_alice"
        And I am signed in as "dr_bob"
        And a professional "dr_bob" exists with specialty "MEDICINA"
        And the clinic member "dr_bob" also has the role "OWNER"
        And I am signed in as "dr_bob" with professional "${ref:id:professional:dr_bob}"
        When I send a "GET" request to "/api/v1/patients/${ref:id:patient:restricted}"
        Then the request should fail with a 403 status code
        When I send a "GET" request to "/api/v1/records/${ref:id:record:restricted}"
        Then the request should fail with a 403 status code
        When I send a "GET" request to "/api/v1/appointments/${ref:id:appointment:restricted}"
        Then the request should fail with a 403 status code
        When I send a "GET" request to "/api/v1/clinic-members?clinicId=${ref:id:clinic:dr_alice}"
        Then the request should fail with a 403 status code
        When I send a "GET" request to "/api/v1/clinics/${ref:id:clinic:dr_alice}/financial/report?startDate=2026-01-01T00:00:00.000Z&endDate=2026-12-31T23:59:59.000Z"
        Then the request should fail with a 403 status code

    Scenario: Another clinic cannot access document templates or grant patient permissions
        Given I am signed in as "dr_bob"
        And a professional "dr_bob" exists with specialty "MEDICINA"
        And the clinic member "dr_bob" also has the role "OWNER"
        And I am signed in as "dr_bob" with professional "${ref:id:professional:dr_bob}"
        When I send a "GET" request to "/api/v1/clinics/${ref:id:clinic:dr_alice}/document-templates"
        Then the request should fail with a 403 status code
        When I send a "GET" request to "/api/v1/patients/${ref:id:patient:restricted}/clinical-documents"
        Then the request should fail with a 403 status code
        When I send a "POST" request to "/api/v1/clinic-patient-accesses" with:
            | clinicId    | ${ref:id:clinic:dr_alice}    |
            | memberId    | ${ref:id:clinicMember:dr_bob} |
            | patientId   | ${ref:id:patient:restricted}  |
            | accessLevel | FULL                         |
        Then the request should fail with a 403 status code
        When I send a "POST" request to "/api/v1/document-permissions" with:
            | clinicId   | ${ref:id:clinic:dr_alice}      |
            | memberId   | ${ref:id:clinicMember:dr_bob}  |
            | entityType | RECORD                         |
            | entityId   | ${ref:id:record:restricted}    |
            | canView    | true                           |
        Then the request should fail with a 403 status code

    Scenario: A viewer cannot access a patient or grant themselves access
        When I send a "POST" request to "/api/v1/clinic-members/invite" with:
            | userId      | ${ref:id:user:dr_bob} |
            | roles       | ["VIEWER"]           |
            | displayName | Dr. Bob              |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "clinicMember" id for "dr_bob"
        Given I am signed in as "dr_bob" with clinic member "${ref:id:clinicMember:dr_bob}"
        When I send a "GET" request to "/api/v1/patients/${ref:id:patient:restricted}"
        Then the request should fail with a 403 status code
        When I send a "GET" request to "/api/v1/records/${ref:id:record:restricted}"
        Then the request should fail with a 403 status code
        When I send a "POST" request to "/api/v1/clinic-patient-accesses" with:
            | clinicId    | ${ref:id:clinic:dr_alice}    |
            | memberId    | ${ref:id:clinicMember:dr_bob} |
            | patientId   | ${ref:id:patient:restricted}  |
            | accessLevel | FULL                         |
        Then the request should fail with a 403 status code

    Scenario: A viewer can read a patient after access is granted
        When I send a "POST" request to "/api/v1/clinic-members/invite" with:
            | userId      | ${ref:id:user:dr_bob} |
            | roles       | ["VIEWER"]           |
            | displayName | Dr. Bob              |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "clinicMember" id for "dr_bob"
        Given I am signed in as "dr_alice" with professional "${ref:id:professional:dr_alice}"
        When I send a "POST" request to "/api/v1/clinic-patient-accesses" with:
            | clinicId    | ${ref:id:clinic:dr_alice}    |
            | memberId    | ${ref:id:clinicMember:dr_bob} |
            | patientId   | ${ref:id:patient:restricted}  |
            | accessLevel | READ_ONLY                    |
        Then the request should succeed with a 201 status code
        Given I am signed in as "dr_bob" with clinic member "${ref:id:clinicMember:dr_bob}"
        When I send a "GET" request to "/api/v1/patients/${ref:id:patient:restricted}"
        Then the request should succeed with a 200 status code
        When I send a "GET" request to "/api/v1/records/${ref:id:record:restricted}"
        Then the request should succeed with a 200 status code

    Scenario: A document override denies record reads and removes the record from search
        When I send a "POST" request to "/api/v1/clinic-members/invite" with:
            | userId      | ${ref:id:user:dr_bob} |
            | roles       | ["VIEWER"]           |
            | displayName | Dr. Bob              |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "clinicMember" id for "dr_bob"
        When I send a "POST" request to "/api/v1/clinic-patient-accesses" with:
            | clinicId    | ${ref:id:clinic:dr_alice}    |
            | memberId    | ${ref:id:clinicMember:dr_bob} |
            | patientId   | ${ref:id:patient:restricted}  |
            | accessLevel | READ_ONLY                    |
        Then the request should succeed with a 201 status code
        Given I am signed in as "dr_alice" with professional "${ref:id:professional:dr_alice}"
        When I send a "POST" request to "/api/v1/document-permissions" with:
            | clinicId   | ${ref:id:clinic:dr_alice}      |
            | memberId   | ${ref:id:clinicMember:dr_bob}  |
            | entityType | RECORD                         |
            | entityId   | ${ref:id:record:restricted}    |
            | canView    | false                          |
        Then the request should succeed with a 201 status code
        Given I am signed in as "dr_bob" with clinic member "${ref:id:clinicMember:dr_bob}"
        When I send a "GET" request to "/api/v1/records/${ref:id:record:restricted}"
        Then the request should fail with a 403 status code
        When I send a "GET" request to "/api/v1/records" with the query:
            | patientId | ${ref:id:patient:restricted} |
            | limit     | 10                           |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
              "data": [],
              "totalCount": 0
            }
            """
