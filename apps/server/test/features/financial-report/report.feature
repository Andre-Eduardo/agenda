Feature: Financial report (GET)
    As a clinic owner I want to view revenue reports
    so that I can track income by period, professional and payment method.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Report Patient                  |
            | documentId     | 666.777.888-99                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "report_patient"
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId          | ${ref:id:patient:report_patient} |
            | attendedByMemberId | ${ref:id:clinicMember:dr_house}  |
            | startAt            | 2026-01-10T09:00:00.000Z         |
            | endAt              | 2026-01-10T10:00:00.000Z         |
            | type               | FIRST_VISIT                      |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "appointment" id for "report_appt"
        When I send a "POST" request to "/api/v1/appointments/${ref:id:appointment:report_appt}/payment" with:
            | paymentMethod | PIX |
            | amountBrl     | 250 |
        Then the request should succeed with a 201 status code

    Scenario: Revenue report returns entries for the payment period
        When I send a "GET" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/financial/report?startDate=2026-01-01&endDate=2026-01-31"
        Then the request should succeed with a 200 status code

    Scenario: Revenue summary returns aggregated totals
        When I send a "GET" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/financial/summary?startDate=2026-01-01&endDate=2026-01-31"
        Then the request should succeed with a 200 status code

    Scenario: Report filtered by professionalMemberId
        When I send a "GET" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/financial/report?startDate=2026-01-01&endDate=2026-01-31&professionalMemberId=${ref:id:clinicMember:dr_house}"
        Then the request should succeed with a 200 status code

    Scenario: Report filtered by paymentMethod
        When I send a "GET" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/financial/report?startDate=2026-01-01&endDate=2026-01-31&paymentMethod=PIX"
        Then the request should succeed with a 200 status code

    Scenario: Report without authentication returns 401
        Given I sign out
        When I send a "GET" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/financial/report?startDate=2026-01-01&endDate=2026-01-31"
        Then the request should fail with a 401 status code
