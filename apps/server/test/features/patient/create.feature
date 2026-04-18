Feature: Patient creation (POST)
    As an authenticated professional I want to create patient records
    so that I can start tracking and coordinating their care.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"

    Scenario: Create a patient with minimal required data
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | João da Silva                             |
            | documentId     | 123.456.789-09                            |
            | professionalId | ${ref:id:professional:dr_house}           |
        Then the request should succeed with a 201 status code
        And the response should contain:
            | name | João da Silva |
        And I save the response field "id" as "patient" id for "joao"

    Scenario: Create a patient with all optional fields
        When I send a "POST" request to "/api/v1/patients" with:
            | name                   | Maria Souza                         |
            | documentId             | 987.654.321-00                      |
            | professionalId         | ${ref:id:professional:dr_house}     |
            | birthDate              | 1990-05-15T00:00:00.000Z            |
            | gender                 | FEMALE                              |
            | email                  | maria_${ref:var:contextId}@test.com |
            | emergencyContactName   | José Souza                          |
            | emergencyContactPhone  | (11) 99999-8888                     |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "maria"

    Scenario: Create a patient without required field (name)
        When I send a "POST" request to "/api/v1/patients" with:
            | documentId     | 000.000.000-00                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should fail with a 400 status code

    Scenario: Create a patient without authentication
        Given I sign out
        When I send a "POST" request to "/api/v1/patients" with:
            | name       | No Auth Patient |
            | documentId | 111.222.333-44  |
        Then the request should fail with a 401 status code
