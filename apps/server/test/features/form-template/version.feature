Feature: Form template versions
    As an authenticated professional I want to create and list template versions
    so that I can evolve a template while preserving past definitions.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"

    Scenario: Create a template version (DRAFT)
        When I send a "POST" request to "/api/v1/form-templates" with:
            | code           | versioned_${ref:var:contextId}   |
            | name           | Versioned Template               |
            | specialty      | MEDICINA                         |
            | professionalId | ${ref:id:professional:dr_house}  |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "form-template" id for "versioned"
        When I send a "POST" request to "/api/v1/form-templates/${ref:id:form-template:versioned}/versions" with body:
            """JSON
            {
              "definitionJson": {
                "id": "versioned_${ref:var:contextId}",
                "name": "Versioned Template",
                "specialty": "MEDICINA",
                "sections": [
                  {
                    "id": "section_1",
                    "label": "Dados Gerais",
                    "order": 0,
                    "fields": [
                      {
                        "id": "nome",
                        "type": "text",
                        "label": "Nome completo",
                        "order": 0
                      }
                    ]
                  }
                ]
              }
            }
            """
        Then the request should succeed with a 201 status code
        And the response should contain:
            | status | DRAFT |
        And I save the response field "id" as "form-template-version" id for "v1"

    Scenario: List template versions
        # TODO: This scenario depends on having a template with at least one version.
        #       Currently the version creation scenario above is separate.
        #       Consider refactoring into a Background once versioning flow is stable.
        When I send a "POST" request to "/api/v1/form-templates" with:
            | code           | list_ver_${ref:var:contextId}    |
            | name           | List Versions Template           |
            | specialty      | MEDICINA                         |
            | professionalId | ${ref:id:professional:dr_house}  |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "form-template" id for "list_ver"
        When I send a "GET" request to "/api/v1/form-templates/${ref:id:form-template:list_ver}/versions"
        Then the request should succeed with a 200 status code

    # ─────────────────────────────────────────────────────────────────────────────
    # Publish / Deprecate version
    # ─────────────────────────────────────────────────────────────────────────────
    # TODO: The publish and deprecate scenarios require that a template version ID
    #       be available.  Since Cucumber Background cannot run a multi-step
    #       "create template → create version" setup easily, these scenarios are
    #       left as TODOs.
    #
    # Scenario: Publish a DRAFT version
    #   Given a form template version "v1" in DRAFT status exists
    #   When I send a "POST" request to "/api/v1/form-templates/versions/${ref:id:form-template-version:v1}/publish"
    #   Then the request should succeed with a 200 status code
    #   And the response should contain:
    #     | status | PUBLISHED |
    #
    # Scenario: Deprecate a PUBLISHED version
    #   Given a form template version "v1" in PUBLISHED status exists
    #   When I send a "POST" request to "/api/v1/form-templates/versions/${ref:id:form-template-version:v1}/deprecate"
    #   Then the request should succeed with a 200 status code
    #   And the response should contain:
    #     | status | DEPRECATED |
    #
    # Scenario: Publish a version that is already PUBLISHED
    #   When I send a "POST" request to "/api/v1/form-templates/versions/${ref:id:form-template-version:v1}/publish"
    #   Then the request should fail with a 422 status code

    # ─────────────────────────────────────────────────────────────────────────────
    # Clone public template
    # ─────────────────────────────────────────────────────────────────────────────
    # TODO: Clone requires a PUBLIC template to exist.  There is no seed for public
    #       templates in this test environment.  Implement once a fixture mechanism
    #       or admin endpoint for seeding public templates is available.
    #
    # Scenario: Clone a public template
    #   Given a public form template "public_anamnese" exists
    #   When I send a "POST" request to "/api/v1/form-templates/${ref:id:form-template:public_anamnese}/clone"
    #   Then the request should succeed with a 201 status code
    #   And the response should contain:
    #     | isPublic | false |
