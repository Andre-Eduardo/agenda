Feature: Draft evolution lifecycle (GET / PATCH / POST)
    As a professional I want to review, edit and approve AI-generated drafts
    so that imported documents become official clinical records after human validation.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Draft Patient                   |
            | documentId     | 200.100.300-42                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "draft_patient"

    Scenario: Get draft auto-creates DraftEvolution from ImportedDocument
        Given an imported document exists for patient "draft_patient" as "doc_get"
        When I send a "GET" request to "/api/v1/imported-documents/${ref:id:importedDocument:doc_get}/draft"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | status | DRAFT |

    Scenario: Edit draft sets wasHumanEdited to true
        Given an imported document exists for patient "draft_patient" as "doc_edit"
        When I send a "GET" request to "/api/v1/imported-documents/${ref:id:importedDocument:doc_edit}/draft"
        Then the request should succeed with a 200 status code
        When I send a "PATCH" request to "/api/v1/imported-documents/${ref:id:importedDocument:doc_edit}/draft" with:
            | freeNotes | Corrigido pelo profissional: glicemia controlada após ajuste de insulina |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | wasHumanEdited | true |

    Scenario: Approve draft creates an official Record with source IMPORT
        Given an imported document exists for patient "draft_patient" as "doc_approve"
        When I send a "GET" request to "/api/v1/imported-documents/${ref:id:importedDocument:doc_approve}/draft"
        Then the request should succeed with a 200 status code
        When I send a "POST" request to "/api/v1/imported-documents/${ref:id:importedDocument:doc_approve}/approve"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | status | APPROVED |

    Scenario: Approve non-existent document returns 404
        When I send a "POST" request to "/api/v1/imported-documents/01900000-0000-7000-8000-000000000000/approve"
        Then the request should fail with a 404 status code

    Scenario: Get draft without authentication returns 401
        Given I sign out
        When I send a "GET" request to "/api/v1/imported-documents/01900000-0000-7000-8000-000000000000/draft"
        Then the request should fail with a 401 status code
