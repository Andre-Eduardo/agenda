Feature: Clinical agent ask (POST)
    As a professional I want to ask the clinical AI agent questions
    so that I can get evidence-based support during consultations.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"

    Scenario: Ask a simple clinical question and get an answer
        When I send a "POST" request to "/api/v1/agent/ask" with:
            | message | Qual é a dose usual de amoxicilina para adultos? |
        Then the request should succeed with a 200 status code

    Scenario: Ask with patient context returns a response
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Agent Patient                   |
            | documentId     | 999.111.222-33                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "agent_patient"
        When I send a "POST" request to "/api/v1/agent/ask" with:
            | message   | Resuma o histórico clínico do paciente          |
            | patientId | ${ref:id:patient:agent_patient}                 |
        Then the request should succeed with a 200 status code

    Scenario: Ask without message returns 400
        When I send a "POST" request to "/api/v1/agent/ask" with body:
            """JSON
            {}
            """
        Then the request should fail with a 400 status code

    Scenario: Ask without authentication returns 401
        Given I sign out
        When I send a "POST" request to "/api/v1/agent/ask" with:
            | message | Qual a dose de dipirona? |
        Then the request should fail with a 401 status code
