Feature: Document permission override (POST)
    As a clinic owner I want to grant or revoke per-document permissions
    so that specific members can access records outside their normal scope.

    Background:
        Given the following users exist:
            | Name       | Username  | Email               | Password  |
            | Dr. House  | dr_house  | house@example.com   | H0use.Dr! |
            | Dr. Wilson | dr_wilson | wilson@example.com  | W1ls0n!1   |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Permission Patient              |
            | documentId     | 444.555.666-77                  |
            | responsibleProfessionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "perm_patient"
        When I send a "POST" request to "/api/v1/records" with:
            | patientId      | ${ref:id:patient:perm_patient}  |
            | responsibleProfessionalId | ${ref:id:professional:dr_house} |
            | description    | Evolução restrita               |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "record" id for "restricted_record"
        When I send a "POST" request to "/api/v1/clinic-members" with:
            | clinicId    | ${ref:id:clinic:dr_house}   |
            | userId      | ${ref:id:user:dr_wilson}    |
            | role        | PROFESSIONAL                |
            | displayName | Dr. Wilson                  |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "clinicMember" id for "dr_wilson"

    Scenario: Grant view permission on a record
        When I send a "POST" request to "/api/v1/document-permissions" with:
            | clinicId   | ${ref:id:clinic:dr_house}          |
            | memberId   | ${ref:id:clinicMember:dr_wilson}   |
            | entityType | RECORD                             |
            | entityId   | ${ref:id:record:restricted_record} |
            | canView    | true                               |
            | reason     | Segundo parecer solicitado         |
        Then the request should succeed with a 201 status code
        And the response should contain:
            | canView    | true   |
            | entityType | RECORD |

    Scenario: Revoke permission sets canView to false
        When I send a "POST" request to "/api/v1/document-permissions" with:
            | clinicId   | ${ref:id:clinic:dr_house}          |
            | memberId   | ${ref:id:clinicMember:dr_wilson}   |
            | entityType | RECORD                             |
            | entityId   | ${ref:id:record:restricted_record} |
            | canView    | false                              |
        Then the request should succeed with a 201 status code
        And the response should contain:
            | canView | false |

    Scenario: Create permission with invalid entityType returns 400
        When I send a "POST" request to "/api/v1/document-permissions" with:
            | clinicId   | ${ref:id:clinic:dr_house}          |
            | memberId   | ${ref:id:clinicMember:dr_house}    |
            | entityType | INVALID_TYPE                       |
            | entityId   | ${ref:id:record:restricted_record} |
            | canView    | true                               |
        Then the request should fail with a 400 status code

    Scenario: Create permission without authentication returns 401
        Given I sign out
        When I send a "POST" request to "/api/v1/document-permissions" with:
            | clinicId   | ${ref:id:clinic:dr_house}          |
            | memberId   | ${ref:id:clinicMember:dr_house}    |
            | entityType | RECORD                             |
            | entityId   | ${ref:id:record:restricted_record} |
            | canView    | true                               |
        Then the request should fail with a 401 status code
