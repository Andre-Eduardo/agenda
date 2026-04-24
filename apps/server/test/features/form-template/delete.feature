Feature: Form template deletion (DELETE)
    As an authenticated professional I want to soft-delete form templates
    so that obsolete templates no longer appear as options.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"

    Scenario: Soft-delete a form template
        When I send a "POST" request to "/api/v1/form-templates" with:
            | code           | deleteme_${ref:var:contextId}    |
            | name           | To Be Deleted                    |
            | specialty      | MEDICINA                         |
            | professionalId | ${ref:id:professional:dr_house}  |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "form-template" id for "to_delete"
        When I send a "DELETE" request to "/api/v1/form-templates/${ref:id:form-template:to_delete}"
        Then the request should succeed with a 204 status code
        # TODO: Verify the template no longer appears in the listing after soft-delete.

    Scenario: Delete form template without authentication
        Given I sign out
        When I send a "DELETE" request to "/api/v1/form-templates/01900000-0000-7000-8000-000000000000"
        Then the request should fail with a 401 status code
