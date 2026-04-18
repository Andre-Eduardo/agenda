Feature: Form template creation (POST)
    As an authenticated professional I want to create form templates
    so that I can standardise data collection across patient consultations.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"

    Scenario: Create a private form template
        When I send a "POST" request to "/api/v1/form-templates" with:
            | code           | anamnese_${ref:var:contextId}    |
            | name           | Anamnese Inicial                 |
            | specialty      | MEDICINA                         |
            | isPublic       | false                            |
            | professionalId | ${ref:id:professional:dr_house}  |
        Then the request should succeed with a 201 status code
        And the response should contain:
            | name      | Anamnese Inicial |
            | specialty | MEDICINA         |
        And I save the response field "id" as "form-template" id for "anamnese"

    Scenario: Create a template with invalid code (uppercase)
        When I send a "POST" request to "/api/v1/form-templates" with:
            | code      | BAD_CODE                         |
            | name      | Bad Template                     |
            | specialty | MEDICINA                         |
        Then the request should fail with a 400 status code

    Scenario: Create a template without required specialty
        When I send a "POST" request to "/api/v1/form-templates" with:
            | code | no_specialty_${ref:var:contextId} |
            | name | No Specialty                      |
        Then the request should fail with a 400 status code

    Scenario: Create a template without authentication
        Given I sign out
        When I send a "POST" request to "/api/v1/form-templates" with:
            | code      | unauth_tpl |
            | name      | Unauth     |
            | specialty | MEDICINA   |
        Then the request should fail with a 401 status code
