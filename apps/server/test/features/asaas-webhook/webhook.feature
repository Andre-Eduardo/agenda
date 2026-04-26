Feature: Asaas payment webhook (POST)
    As a payment gateway I want to send payment events to the application
    so that subscription statuses are kept in sync automatically.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"

    Scenario: Invalid webhook token returns 401
        Given I set the header "asaas-access-token" to "wrong-token"
        When I send a "POST" request to "/api/v1/webhooks/asaas" with body:
            """JSON
            {"event": "PAYMENT_CONFIRMED", "payment": {"id": "pay_001", "customer": "cus_001", "value": 89.0, "billingType": "PIX", "status": "CONFIRMED", "dateCreated": "2026-01-01", "dueDate": "2026-01-10"}}
            """
        Then the request should fail with a 401 status code

    Scenario: Missing webhook token returns 401
        When I send a "POST" request to "/api/v1/webhooks/asaas" with body:
            """JSON
            {"event": "PAYMENT_CONFIRMED", "payment": {"id": "pay_002", "customer": "cus_001", "value": 89.0, "billingType": "PIX", "status": "CONFIRMED", "dateCreated": "2026-01-01", "dueDate": "2026-01-10"}}
            """
        Then the request should fail with a 401 status code

    Scenario: Valid token with unknown subscription ID is silently ignored (200)
        Given the Asaas webhook token is "test-webhook-token"
        And I set the header "asaas-access-token" to "test-webhook-token"
        When I send a "POST" request to "/api/v1/webhooks/asaas" with body:
            """JSON
            {"event": "PAYMENT_CONFIRMED", "payment": {"id": "pay_003", "subscription": "sub_unknown_xyz", "customer": "cus_001", "value": 89.0, "billingType": "PIX", "status": "CONFIRMED", "dateCreated": "2026-01-01", "dueDate": "2026-01-10"}}
            """
        Then the request should succeed with a 200 status code

    Scenario: Payload without payment field is silently ignored (200)
        Given the Asaas webhook token is "test-webhook-token"
        And I set the header "asaas-access-token" to "test-webhook-token"
        When I send a "POST" request to "/api/v1/webhooks/asaas" with body:
            """JSON
            {"event": "PAYMENT_AWAITING_RISK_ANALYSIS"}
            """
        Then the request should succeed with a 200 status code
