Feature: Authorization for patient clinical data
    A member must have both the role permission and patient access to read or edit clinical data.

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
        When I send a "PUT" request to "/api/v1/patients/${ref:id:patient:restricted}/clinical-profile" with:
            | responsibleProfessionalId | ${ref:id:professional:dr_alice} |
            | allergies                 | Aspirin                          |
        Then the request should succeed with a 200 status code
        When I send a "POST" request to "/api/v1/patients/${ref:id:patient:restricted}/alerts" with:
            | title    | Severe allergy |
            | severity | HIGH           |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patientAlert" id for "restricted"

    Scenario: A manager in another clinic cannot see clinical data
        Given I am signed in as "dr_bob"
        And a professional "dr_bob" exists with specialty "MEDICINA"
        And the clinic member "dr_bob" also has the role "OWNER"
        And I am signed in as "dr_bob" with professional "${ref:id:professional:dr_bob}"
        When I send a "GET" request to "/api/v1/patients/${ref:id:patient:restricted}/clinical-profile"
        Then the request should fail with a 403 status code
        When I send a "GET" request to "/api/v1/patients/${ref:id:patient:restricted}/alerts?limit=10"
        Then the request should fail with a 403 status code

    Scenario Outline: Clinical reads follow the patient's grant
        Given the clinic "dr_alice" has a plan for 2 professionals
        When I send a "POST" request to "/api/v1/clinic-members/invite" with:
            | userId    | ${ref:id:user:dr_bob} |
            | roles     | ["PROFESSIONAL"]     |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "clinicMember" id for "dr_bob"
        When I send a "POST" request to "/api/v1/clinic-patient-accesses" with:
            | clinicId    | ${ref:id:clinic:dr_alice}     |
            | memberId    | ${ref:id:clinicMember:dr_bob} |
            | patientId   | ${ref:id:patient:restricted} |
            | accessLevel | <accessLevel>                |
        Then the request should succeed with a 201 status code
        Given I am signed in as "dr_bob" with clinic member "${ref:id:clinicMember:dr_bob}"
        When I send a "GET" request to "/api/v1/patients/${ref:id:patient:restricted}"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | canReadClinicalData  | <canRead> |
            | canWriteClinicalData | false     |
        When I send a "GET" request to "/api/v1/patients/${ref:id:patient:restricted}/clinical-profile"
        Then the request should <result> with a <readStatus> status code
        When I send a "GET" request to "/api/v1/patients/${ref:id:patient:restricted}/alerts?limit=10"
        Then the request should <result> with a <readStatus> status code

        Examples:
            | accessLevel   | canRead | result  | readStatus |
            | READ_ONLY     | true    | succeed | 200        |
            | REGISTER_ONLY | false   | fail    | 403        |

    Scenario: A professional with read-only access cannot edit clinical data
        Given the clinic "dr_alice" has a plan for 2 professionals
        When I send a "POST" request to "/api/v1/clinic-members/invite" with:
            | userId    | ${ref:id:user:dr_bob} |
            | roles     | ["PROFESSIONAL"]     |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "clinicMember" id for "dr_bob"
        When I send a "POST" request to "/api/v1/clinic-patient-accesses" with:
            | clinicId    | ${ref:id:clinic:dr_alice}     |
            | memberId    | ${ref:id:clinicMember:dr_bob} |
            | patientId   | ${ref:id:patient:restricted} |
            | accessLevel | READ_ONLY                |
        Then the request should succeed with a 201 status code
        Given I am signed in as "dr_bob" with clinic member "${ref:id:clinicMember:dr_bob}"
        When I send a "PUT" request to "/api/v1/patients/${ref:id:patient:restricted}/clinical-profile" with:
            | responsibleProfessionalId | ${ref:id:professional:dr_alice} |
            | allergies                 | Updated allergy                  |
        Then the request should fail with a 403 status code
        When I send a "POST" request to "/api/v1/patients/${ref:id:patient:restricted}/alerts" with:
            | title    | Unauthorized alert |
            | severity | HIGH               |
        Then the request should fail with a 403 status code
        When I send a "PUT" request to "/api/v1/patients/${ref:id:patient:restricted}/alerts/${ref:id:patientAlert:restricted}" with:
            | isActive | false |
        Then the request should fail with a 403 status code
