Feature: Imported document approval pipeline (GET / POST)
    As a professional I want to approve imported document drafts
    so that the clinic record contains all patient clinical history.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Pipeline Patient                |
            | documentId     | 300.100.200-43                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "pipeline_patient"

    Scenario: Full pipeline — import exists, get draft, approve, record created
        Given an imported document exists for patient "pipeline_patient" as "pipeline_doc"
        When I send a "GET" request to "/api/v1/imported-documents/${ref:id:importedDocument:pipeline_doc}/draft"
        Then the request should succeed with a 200 status code
        When I send a "POST" request to "/api/v1/imported-documents/${ref:id:importedDocument:pipeline_doc}/approve"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | status   | APPROVED |

    Scenario: Approve already approved document returns error
        Given an imported document exists for patient "pipeline_patient" as "already_approved_doc"
        When I send a "GET" request to "/api/v1/imported-documents/${ref:id:importedDocument:already_approved_doc}/draft"
        Then the request should succeed with a 200 status code
        When I send a "POST" request to "/api/v1/imported-documents/${ref:id:importedDocument:already_approved_doc}/approve"
        Then the request should succeed with a 200 status code
        When I send a "POST" request to "/api/v1/imported-documents/${ref:id:importedDocument:already_approved_doc}/approve"
        Then the request should fail with a 409 status code

    Scenario: Approve without authentication returns 401
        Given I sign out
        When I send a "POST" request to "/api/v1/imported-documents/01900000-0000-7000-8000-000000000000/approve"
        Then the request should fail with a 401 status code
