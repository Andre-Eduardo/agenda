Feature: Professional creation (POST)
    As an authenticated user I want to create professional profiles
    so that patients can be assigned to the right specialist.

    Background:
        Given the following users exist:
            | Name     | Username | Email                   | Password  |
            | Dr. House | dr_house | house@example.com       | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"

    Scenario: Create a professional with valid data
        When I send a "POST" request to "/api/v1/professionals" with:
            | name       | Dra. Smith           |
            | specialty  | PSICOLOGIA           |
            | documentId | 111.222.333-44       |
        Then the request should succeed with a 201 status code
        And the response should contain:
            | name      | Dra. Smith |
            | specialty | PSICOLOGIA |
        And I save the response field "id" as "professional" id for "dr_smith"

    Scenario: Create a professional without required field (name)
        When I send a "POST" request to "/api/v1/professionals" with:
            | specialty  | FISIOTERAPIA |
            | documentId | 222.333.444-55 |
        Then the request should fail with a 400 status code

    Scenario: Create a professional without authentication
        Given I sign out
        When I send a "POST" request to "/api/v1/professionals" with:
            | name      | No Auth Prof |
            | specialty | MEDICINA     |
            | documentId | 333.444.555-66 |
        Then the request should fail with a 401 status code
