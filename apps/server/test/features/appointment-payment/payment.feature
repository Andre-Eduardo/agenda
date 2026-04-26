Feature: Appointment payment (POST / PATCH / GET)
    As a receptionist I want to register and manage appointment payments
    so that the clinic can track its revenue.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Payment Patient                 |
            | documentId     | 222.333.444-55                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "pay_patient"
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId          | ${ref:id:patient:pay_patient}   |
            | attendedByMemberId | ${ref:id:clinicMember:dr_house} |
            | startAt            | 2026-07-10T09:00:00.000Z        |
            | endAt              | 2026-07-10T10:00:00.000Z        |
            | type               | FIRST_VISIT                     |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "appointment" id for "pay_appt"

    Scenario: Register a cash payment
        When I send a "POST" request to "/api/v1/appointments/${ref:id:appointment:pay_appt}/payment" with:
            | paymentMethod | CASH  |
            | amountBrl     | 150   |
        Then the request should succeed with a 201 status code
        And the response should contain:
            | paymentMethod | CASH |
            | amountBrl     | 150  |
        And I save the response field "id" as "payment" id for "cash_payment"

    Scenario: Update payment status to PAID
        When I send a "POST" request to "/api/v1/appointments/${ref:id:appointment:pay_appt}/payment" with:
            | paymentMethod | PIX  |
            | amountBrl     | 200  |
            | status        | PENDING |
        Then the request should succeed with a 201 status code
        When I send a "PATCH" request to "/api/v1/appointments/${ref:id:appointment:pay_appt}/payment" with:
            | status | PAID |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | status | PAID |

    Scenario: Get registered payment
        When I send a "POST" request to "/api/v1/appointments/${ref:id:appointment:pay_appt}/payment" with:
            | paymentMethod | CREDIT_CARD |
            | amountBrl     | 300         |
        Then the request should succeed with a 201 status code
        When I send a "GET" request to "/api/v1/appointments/${ref:id:appointment:pay_appt}/payment"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | paymentMethod | CREDIT_CARD |

    Scenario: Register payment without required field returns 400
        When I send a "POST" request to "/api/v1/appointments/${ref:id:appointment:pay_appt}/payment" with:
            | amountBrl | 100 |
        Then the request should fail with a 400 status code

    Scenario: Register payment without authentication returns 401
        Given I sign out
        When I send a "POST" request to "/api/v1/appointments/${ref:id:appointment:pay_appt}/payment" with:
            | paymentMethod | CASH |
            | amountBrl     | 100  |
        Then the request should fail with a 401 status code
