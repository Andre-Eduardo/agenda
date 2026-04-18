Feature: Form template listing and retrieval (GET)
    As an authenticated professional I want to list and retrieve form templates
    so that I can pick the right one for each consultation.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"

    Scenario: List form templates returns results
        When I send a "POST" request to "/api/v1/form-templates" with:
            | code           | list_seed_${ref:var:contextId}   |
            | name           | List Seed Template               |
            | specialty      | MEDICINA                         |
            | professionalId | ${ref:id:professional:dr_house}  |
        Then the request should succeed with a 201 status code
        When I send a "GET" request to "/api/v1/form-templates"
        Then the request should succeed with a 200 status code

    Scenario: Filter templates by specialty
        When I send a "POST" request to "/api/v1/form-templates" with:
            | code           | psico_${ref:var:contextId}       |
            | name           | Psico Template                   |
            | specialty      | PSICOLOGIA                       |
            | professionalId | ${ref:id:professional:dr_house}  |
        Then the request should succeed with a 201 status code
        When I send a "GET" request to "/api/v1/form-templates" with the query:
            | specialty | PSICOLOGIA |
        Then the request should succeed with a 200 status code

    Scenario: Get form template by ID
        When I send a "POST" request to "/api/v1/form-templates" with:
            | code           | get_by_id_${ref:var:contextId}   |
            | name           | Get By Id Template               |
            | specialty      | MEDICINA                         |
            | professionalId | ${ref:id:professional:dr_house}  |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "form-template" id for "get_test"
        When I send a "GET" request to "/api/v1/form-templates/${ref:id:form-template:get_test}"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | id | ${ref:id:form-template:get_test} |

    Scenario: Get form template with unknown ID
        When I send a "GET" request to "/api/v1/form-templates/01900000-0000-7000-8000-000000000000"
        Then the request should fail with a 404 status code
