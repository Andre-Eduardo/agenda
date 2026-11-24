Feature: AI module gating (GET /clinic-members/me/modules, GET /agent/metrics, POST /imported-documents/:id/approve)
    As the system I want every AI feature to stay behind its module
    so that a clinic only sees and uses the AI packages it actually contracted,
    and so a quota block still applies even when the module is released.

    Background:
        Given the following users exist:
            | Name      | Username | Email             | Password  |
            | Dr. House | dr_house | house@example.com | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"

    Scenario: A clinic without any AI package uses the core system and sees no AI module
        When I send a "GET" request to "/api/v1/clinic-members/me/modules"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {"modules": []}
            """
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Core Patient                    |
            | documentId     | 500.100.200-44                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "core_patient"
        When I send a "POST" request to "/api/v1/records" with:
            | patientId                 | ${ref:id:patient:core_patient}   |
            | responsibleProfessionalId | ${ref:id:professional:dr_house} |
            | description               | Evolução registrada sem nenhum pacote de IA |
        Then the request should succeed with a 201 status code
        When I send a "GET" request to "/api/v1/agent/metrics"
        Then the request should fail with a 403 status code
        And the response should contain:
            | reason | MODULE_NOT_ENABLED |

    Scenario: A professional not released by the clinic cannot use a contracted module
        Given the clinic "dr_house" has contracted the AI module "AI_AGENT"
        When I send a "GET" request to "/api/v1/clinic-members/me/modules"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {"modules": []}
            """
        When I send a "GET" request to "/api/v1/agent/metrics"
        Then the request should fail with a 403 status code
        And the response should contain:
            | reason | MODULE_NOT_ASSIGNED |

    Scenario: A released professional uses the contracted module normally
        Given the clinic "dr_house" has contracted the AI module "AI_AGENT"
        And the clinic member "dr_house" is released for the AI module "AI_AGENT"
        When I send a "GET" request to "/api/v1/clinic-members/me/modules"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {"modules": ["AI_AGENT"]}
            """
        When I send a "GET" request to "/api/v1/agent/metrics"
        Then the request should succeed with a 200 status code

    Scenario: The monthly quota still blocks even when the module is contracted and released
        Given the clinic "dr_house" has contracted the AI module "AI_DOCUMENT_IMPORT"
        And the clinic member "dr_house" is released for the AI module "AI_DOCUMENT_IMPORT"
        And the member "dr_house" has used 100% of their docs quota this month
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Quota Patient                   |
            | documentId     | 600.100.200-44                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "quota_patient"
        And an imported document exists for patient "quota_patient" as "quota_doc"
        When I send a "GET" request to "/api/v1/imported-documents/${ref:id:importedDocument:quota_doc}/draft"
        Then the request should succeed with a 200 status code
        When I send a "POST" request to "/api/v1/imported-documents/${ref:id:importedDocument:quota_doc}/approve"
        Then the request should fail with a 429 status code
