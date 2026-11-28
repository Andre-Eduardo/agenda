Feature: Appointment payments in the clinic ledger
    As a receptionist I want each payment to record the money that came in and went out
    so that the clinic knows how much is in each account.

    Background:
        Given the following users exist:
            | Name      | Username | Email             | Password  |
            | Dr. House | dr_house | house@example.com | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And the clinic member "dr_house" also has the role "OWNER"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Ledger Patient                  |
            | documentId     | 333.444.555-66                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "ledger_patient"
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId          | ${ref:id:patient:ledger_patient}         |
            | attendedByMemberId | ${ref:id:clinicMember:dr_house}          |
            | startAt            | ${ref:date:nextYear:08-10T09:00:00.000Z} |
            | endAt              | ${ref:date:nextYear:08-10T10:00:00.000Z} |
            | type               | FIRST_VISIT                              |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "appointment" id for "ledger_appt"

    Scenario: The clinic starts with a cash drawer, a bank account and a card machine
        When I send a "GET" request to "/api/v1/financial-accounts"
        Then the request should succeed with a 200 status code
        And the response should contain the JSON:
            """JSON
            [
                {"type": "CASH_DRAWER", "name": "Caixa", "isDefault": true, "balanceBrl": 0},
                {"type": "BANK", "name": "Conta bancária", "isDefault": true, "balanceBrl": 0},
                {"type": "CARD_MACHINE", "name": "Maquininha", "isDefault": true, "balanceBrl": 0}
            ]
            """

    Scenario: A cash payment goes into the cash drawer
        When I send a "POST" request to "/api/v1/appointments/${ref:id:appointment:ledger_appt}/payment" with:
            | paymentMethod | CASH  |
            | amountBrl     | 150.5 |
        Then the request should succeed with a 201 status code
        When I send a "GET" request to "/api/v1/appointments/${ref:id:appointment:ledger_appt}/payment/ledger"
        Then the request should succeed with a 200 status code
        And the response should contain the JSON:
            """JSON
            {
                "tracked": true,
                "amountBrl": 150.5,
                "receivedBrl": 150.5,
                "remainingBrl": 0,
                "movements": [{"direction": "IN", "category": "PAYMENT", "paymentMethod": "CASH", "amountBrl": 150.5, "accountName": "Caixa"}]
            }
            """
        When I send a "GET" request to "/api/v1/financial-accounts"
        Then I save the default "CASH_DRAWER" account as "cash"
        When I send a "GET" request to "/api/v1/financial-accounts/${ref:id:financialAccount:cash}/statement"
        Then the request should succeed with a 200 status code
        And the response should contain the JSON:
            """JSON
            {
                "account": {"type": "CASH_DRAWER", "balanceBrl": 150.5},
                "totalCount": 1,
                "data": [{"direction": "IN", "paymentMethod": "CASH", "amountBrl": 150.5}]
            }
            """

    Scenario: A payment split between Pix and card is MIXED and paid
        When I send a "POST" request to "/api/v1/appointments/${ref:id:appointment:ledger_appt}/payment" with body:
            """JSON
            {
                "paymentMethod": "PIX",
                "amountBrl": 200,
                "parts": [
                    {"paymentMethod": "PIX", "amountBrl": 120},
                    {"paymentMethod": "CREDIT_CARD", "amountBrl": 80}
                ]
            }
            """
        Then the request should succeed with a 201 status code
        And the response should contain:
            | paymentMethod | MIXED |
            | status        | PAID  |
        When I send a "GET" request to "/api/v1/financial-accounts"
        Then the response should contain the JSON:
            """JSON
            [
                {"type": "CASH_DRAWER", "balanceBrl": 0},
                {"type": "BANK", "balanceBrl": 120},
                {"type": "CARD_MACHINE", "balanceBrl": 80}
            ]
            """

    Scenario: A payment received in parts stays pending until the rest comes in
        When I send a "POST" request to "/api/v1/appointments/${ref:id:appointment:ledger_appt}/payment" with body:
            """JSON
            {"paymentMethod": "PIX", "amountBrl": 200, "parts": [{"paymentMethod": "PIX", "amountBrl": 50}]}
            """
        Then the request should succeed with a 201 status code
        And the response should contain:
            | status | PENDING |
        When I send a "GET" request to "/api/v1/appointments/${ref:id:appointment:ledger_appt}"
        Then the response should contain the JSON:
            """JSON
            {"revenue": {"expectedBrl": 200, "receivedBrl": 50, "pendingBrl": 150, "status": "PENDING"}}
            """
        When I send a "POST" request to "/api/v1/appointments/${ref:id:appointment:ledger_appt}/payment/receipts" with body:
            """JSON
            {"parts": [{"paymentMethod": "CASH", "amountBrl": 200}]}
            """
        Then the request should fail with a 409 status code
        When I send a "POST" request to "/api/v1/appointments/${ref:id:appointment:ledger_appt}/payment/receipts" with body:
            """JSON
            {"parts": [{"paymentMethod": "CASH", "amountBrl": 150}]}
            """
        Then the request should succeed with a 201 status code
        And the response should contain the JSON:
            """JSON
            {"receivedBrl": 200, "remainingBrl": 0, "payment": {"paymentMethod": "MIXED", "status": "PAID"}}
            """

    Scenario: A refund needs a reason and takes the money out of each account
        When I send a "POST" request to "/api/v1/appointments/${ref:id:appointment:ledger_appt}/payment" with body:
            """JSON
            {
                "paymentMethod": "PIX",
                "amountBrl": 100,
                "parts": [{"paymentMethod": "PIX", "amountBrl": 60}, {"paymentMethod": "CASH", "amountBrl": 40}]
            }
            """
        Then the request should succeed with a 201 status code
        When I send a "POST" request to "/api/v1/appointments/${ref:id:appointment:ledger_appt}/payment/refund" with body:
            """JSON
            {"reason": " "}
            """
        Then the request should fail with a 400 status code
        When I send a "POST" request to "/api/v1/appointments/${ref:id:appointment:ledger_appt}/payment/refund" with body:
            """JSON
            {"reason": "Paciente desistiu do procedimento"}
            """
        Then the request should succeed with a 201 status code
        And the response should contain the JSON:
            """JSON
            {
                "receivedBrl": 0,
                "payment": {"status": "REFUNDED"},
                "movements": [
                    {"direction": "IN", "paymentMethod": "PIX", "amountBrl": 60},
                    {"direction": "IN", "paymentMethod": "CASH", "amountBrl": 40},
                    {"direction": "OUT", "category": "REFUND", "paymentMethod": "PIX", "amountBrl": 60, "reason": "Paciente desistiu do procedimento"},
                    {"direction": "OUT", "category": "REFUND", "paymentMethod": "CASH", "amountBrl": 40}
                ]
            }
            """
        When I send a "POST" request to "/api/v1/appointments/${ref:id:appointment:ledger_appt}/payment/refund" with body:
            """JSON
            {"reason": "De novo"}
            """
        Then the request should fail with a 409 status code

    Scenario: A pending payment marked as paid receives what is left
        When I send a "POST" request to "/api/v1/appointments/${ref:id:appointment:ledger_appt}/payment" with:
            | paymentMethod | DEBIT_CARD |
            | amountBrl     | 90         |
            | status        | PENDING    |
        Then the request should succeed with a 201 status code
        When I send a "PATCH" request to "/api/v1/appointments/${ref:id:appointment:ledger_appt}/payment" with:
            | status | PAID |
        Then the request should succeed with a 200 status code
        When I send a "GET" request to "/api/v1/appointments/${ref:id:appointment:ledger_appt}/payment/ledger"
        Then the response should contain the JSON:
            """JSON
            {"receivedBrl": 90, "movements": [{"paymentMethod": "DEBIT_CARD", "amountBrl": 90, "accountName": "Maquininha"}]}
            """
        When I send a "PATCH" request to "/api/v1/appointments/${ref:id:appointment:ledger_appt}/payment" with:
            | status | PENDING |
        Then the request should fail with a 409 status code

    Scenario: Accounts can be added and renamed, but a default account stays active
        When I send a "POST" request to "/api/v1/financial-accounts" with:
            | name | Banco Inter |
            | type | BANK        |
        Then the request should succeed with a 201 status code
        And the response should contain:
            | name      | Banco Inter |
            | isDefault | false       |
        And I save the response field "id" as "financialAccount" id for "inter"
        When I send a "POST" request to "/api/v1/appointments/${ref:id:appointment:ledger_appt}/payment" with body:
            """JSON
            {
                "paymentMethod": "PIX",
                "amountBrl": 70,
                "parts": [{"paymentMethod": "PIX", "amountBrl": 70, "accountId": "${ref:id:financialAccount:inter}"}]
            }
            """
        Then the request should succeed with a 201 status code
        When I send a "GET" request to "/api/v1/financial-accounts/${ref:id:financialAccount:inter}/statement"
        Then the response should contain the JSON:
            """JSON
            {"account": {"name": "Banco Inter", "balanceBrl": 70}, "totalCount": 1}
            """
        When I send a "GET" request to "/api/v1/financial-accounts"
        And I save the default "BANK" account as "bank"
        When I send a "PATCH" request to "/api/v1/financial-accounts/${ref:id:financialAccount:bank}" with body:
            """JSON
            {"active": false}
            """
        Then the request should fail with a 409 status code
