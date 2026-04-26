Feature: Insurance plan CRUD (POST / GET)
    As a clinic owner I want to manage insurance plans
    so that payments can be associated with the correct convenio.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with clinic member "${ref:id:clinicMember:dr_house}"

    Scenario: Create an insurance plan
        When I send a "POST" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/insurance-plans" with:
            | name | Unimed Nacional |
            | code | UNIMED-001      |
        Then the request should succeed with a 201 status code
        And the response should contain:
            | name     | Unimed Nacional |
            | code     | UNIMED-001      |
            | isActive | true            |
        And I save the response field "id" as "insurance_plan" id for "unimed"

    Scenario: List insurance plans includes created plan
        When I send a "POST" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/insurance-plans" with:
            | name | Bradesco Saúde |
            | code | BRADESCO-001   |
        Then the request should succeed with a 201 status code
        When I send a "GET" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/insurance-plans"
        Then the request should succeed with a 200 status code

    Scenario: Create plan without name returns 400
        When I send a "POST" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/insurance-plans" with:
            | code | NO-NAME-001 |
        Then the request should fail with a 400 status code

    Scenario: Create plan without authentication returns 401
        Given I sign out
        When I send a "POST" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/insurance-plans" with:
            | name | Plano Sem Auth |
            | code | AUTH-000       |
        Then the request should fail with a 401 status code
