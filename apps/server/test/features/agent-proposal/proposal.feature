Feature: Agent proposal confirm and reject (GET / POST)
    As a professional I want to review and act on AI proposals
    so that the agent can create entities only after human approval.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Proposal Patient                |
            | documentId     | 100.200.300-41                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "proposal_patient"

    Scenario: List pending proposals
        Given a pending agent proposal of type "PATIENT_ALERT" exists as "list_proposal"
        When I send a "GET" request to "/api/v1/agent-proposals"
        Then the request should succeed with a 200 status code

    Scenario: Reject a pending proposal with a reason
        Given a pending agent proposal of type "PATIENT_ALERT" exists as "to_reject"
        When I send a "POST" request to "/api/v1/agent-proposals/${ref:id:agentProposal:to_reject}/reject" with:
            | reason | Proposta incorreta para este paciente |
        Then the request should succeed with a 200 status code

    Scenario: Reject a proposal without a reason
        Given a pending agent proposal of type "PATIENT_ALERT" exists as "to_reject_no_reason"
        When I send a "POST" request to "/api/v1/agent-proposals/${ref:id:agentProposal:to_reject_no_reason}/reject" with body:
            """JSON
            {}
            """
        Then the request should succeed with a 200 status code

    Scenario: Confirm a non-existent proposal returns 404
        When I send a "POST" request to "/api/v1/agent-proposals/01900000-0000-7000-8000-000000000000/confirm"
        Then the request should fail with a 404 status code

    Scenario: List proposals without authentication returns 401
        Given I sign out
        When I send a "GET" request to "/api/v1/agent-proposals"
        Then the request should fail with a 401 status code
