Feature: Usage limit enforcement (POST /imported-documents/:id/approve)
    As the system I want to block document approvals when the quota is exhausted
    so that professionals cannot exceed their monthly plan limits.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Limit Patient                   |
            | documentId     | 400.100.200-44                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "limit_patient"

    Scenario: Approve succeeds when quota is under the limit (79%)
        Given the member "dr_house" has used 79% of their docs quota this month
        And an imported document exists for patient "limit_patient" as "under_limit_doc"
        When I send a "GET" request to "/api/v1/imported-documents/${ref:id:importedDocument:under_limit_doc}/draft"
        Then the request should succeed with a 200 status code
        When I send a "POST" request to "/api/v1/imported-documents/${ref:id:importedDocument:under_limit_doc}/approve"
        Then the request should succeed with a 200 status code

    Scenario: Approve is blocked when quota is fully exhausted (100%) — hard block returns 429
        Given the member "dr_house" has used 100% of their docs quota this month
        And an imported document exists for patient "limit_patient" as "at_limit_doc"
        When I send a "GET" request to "/api/v1/imported-documents/${ref:id:importedDocument:at_limit_doc}/draft"
        Then the request should succeed with a 200 status code
        When I send a "POST" request to "/api/v1/imported-documents/${ref:id:importedDocument:at_limit_doc}/approve"
        Then the request should fail with a 429 status code
