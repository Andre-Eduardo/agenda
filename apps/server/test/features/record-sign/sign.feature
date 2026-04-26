Feature: Record sign and reopen (POST)
    As a professional I want to sign and reopen clinical records
    so that the audit trail reflects when records were locked and by whom.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Sign Patient                    |
            | documentId     | 333.444.555-66                  |
            | responsibleProfessionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "sign_patient"

    Scenario: Sign a record — isLocked becomes true and signedAt is set
        When I send a "POST" request to "/api/v1/records" with:
            | patientId      | ${ref:id:patient:sign_patient}  |
            | responsibleProfessionalId | ${ref:id:professional:dr_house} |
            | description    | Consulta de rotina              |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "record" id for "to_sign"
        When I send a "POST" request to "/api/v1/records/${ref:id:record:to_sign}/sign"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | isLocked | true |

    Scenario: Reopen a signed record with justification creates a RecordAmendment
        When I send a "POST" request to "/api/v1/records" with:
            | patientId      | ${ref:id:patient:sign_patient}  |
            | responsibleProfessionalId | ${ref:id:professional:dr_house} |
            | description    | Evolução para reabrir           |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "record" id for "to_reopen"
        When I send a "POST" request to "/api/v1/records/${ref:id:record:to_reopen}/sign"
        Then the request should succeed with a 200 status code
        When I send a "POST" request to "/api/v1/records/${ref:id:record:to_reopen}/reopen" with:
            | justification | Correção de dados clínicos inseridos incorretamente |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | isLocked | false |

    Scenario: List amendments after reopening
        When I send a "POST" request to "/api/v1/records" with:
            | patientId      | ${ref:id:patient:sign_patient}  |
            | responsibleProfessionalId | ${ref:id:professional:dr_house} |
            | description    | Evolução com amendment          |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "record" id for "with_amendment"
        When I send a "POST" request to "/api/v1/records/${ref:id:record:with_amendment}/sign"
        Then the request should succeed with a 200 status code
        When I send a "POST" request to "/api/v1/records/${ref:id:record:with_amendment}/reopen" with:
            | justification | Revisão solicitada pelo paciente |
        Then the request should succeed with a 200 status code
        When I send a "GET" request to "/api/v1/records/${ref:id:record:with_amendment}/amendments"
        Then the request should succeed with a 200 status code

    Scenario: Reopen without justification returns 400
        When I send a "POST" request to "/api/v1/records" with:
            | patientId      | ${ref:id:patient:sign_patient}  |
            | responsibleProfessionalId | ${ref:id:professional:dr_house} |
            | description    | Evolução sem justificativa      |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "record" id for "no_justification"
        When I send a "POST" request to "/api/v1/records/${ref:id:record:no_justification}/sign"
        Then the request should succeed with a 200 status code
        When I send a "POST" request to "/api/v1/records/${ref:id:record:no_justification}/reopen" with body:
            """JSON
            {}
            """
        Then the request should fail with a 400 status code

    Scenario: Sign without authentication returns 401
        Given I sign out
        When I send a "POST" request to "/api/v1/records/01900000-0000-7000-8000-000000000000/sign"
        Then the request should fail with a 401 status code
