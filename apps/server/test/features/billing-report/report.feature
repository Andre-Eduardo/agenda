Feature: Billing report (GET)
    As a professional I want to view my AI usage costs
    so that I can understand my spending by model and service.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with clinic member "${ref:id:clinicMember:dr_house}"

    Scenario: Get member billing report for current month
        When I send a "GET" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/billing-report?year=2026&month=4"
        Then the request should succeed with a 200 status code

    Scenario: Get clinic billing report
        When I send a "GET" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/billing-report?year=2026&month=4"
        Then the request should succeed with a 200 status code

    Scenario: Member billing report without authentication returns 401
        Given I sign out
        When I send a "GET" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/billing-report?year=2026&month=4"
        Then the request should fail with a 401 status code
