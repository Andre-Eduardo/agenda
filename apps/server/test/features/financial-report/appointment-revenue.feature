Feature: Appointment revenue reconciliation
    Clinic staff see the same financial amounts in the agenda and the revenue report.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And the clinic member "dr_house" also has the role "OWNER"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        When I send a "POST" request to "/api/v1/patients" with:
            | name       | Revenue Patient |
            | documentId | 111.222.333-44  |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "revenue_patient"
        When I send a "POST" request to "/api/v1/procedures" with:
            | name            | Evaluation |
            | durationMinutes | 30         |
            | color           | BLUE       |
            | priceInCents    | 15725      |
            | modality        | IN_PERSON  |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "procedure" id for "evaluation"
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId          | ${ref:id:patient:revenue_patient}   |
            | attendedByMemberId | ${ref:id:clinicMember:dr_house}      |
            | startAt            | ${ref:date:nextYear:01-31T19:00:00.000Z} |
            | type               | PROCEDURE                            |
            | procedureId        | ${ref:id:procedure:evaluation}       |
            | retroactive        | true                                 |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "appointment" id for "evaluation"

    Scenario: A scheduled procedure remains in the same report period after payment
        When I send a "GET" request to "/api/v1/appointments/${ref:id:appointment:evaluation}"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | revenue.expectedBrl   | 157.25  |
            | revenue.receivedBrl   | 0       |
            | revenue.pendingBrl    | 157.25  |
            | revenue.paymentMethod | null    |
            | revenue.status        | PENDING |
        When I send a "GET" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/financial/report?startDate=${ref:date:nextYear:01-01}&endDate=${ref:date:nextYear:01-31}&status=PENDING"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | summary.totalBrl     | 157.25 |
            | summary.totalPaid    | 0      |
            | summary.totalPending | 157.25 |
            | pagination.total     | 1      |
            | payments             | [{"appointmentId":"${ref:id:appointment:evaluation}","paymentId":null,"procedureName":"Evaluation","paymentMethod":null,"expectedBrl":157.25,"receivedBrl":0,"pendingBrl":157.25}] |
        When I send a "POST" request to "/api/v1/appointments/${ref:id:appointment:evaluation}/payment" with:
            | paymentMethod | PIX |
        Then the request should succeed with a 201 status code
        And the response should contain:
            | amountBrl | 157.25 |
            | status    | PAID   |
        When I send a "GET" request to "/api/v1/appointments/${ref:id:appointment:evaluation}"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | revenue.expectedBrl   | 157.25 |
            | revenue.receivedBrl   | 157.25 |
            | revenue.pendingBrl    | 0      |
            | revenue.paymentMethod | PIX    |
        When I send a "GET" request to "/api/v1/appointments?limit=50"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | data | [{"id":"${ref:id:appointment:evaluation}","revenue":{"expectedBrl":157.25,"receivedBrl":157.25,"pendingBrl":0,"paymentMethod":"PIX"}}] |
        When I send a "GET" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/financial/report?startDate=${ref:date:nextYear:01-01}&endDate=${ref:date:nextYear:01-31}&paymentMethod=PIX&status=PAID"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | summary.totalBrl     | 157.25 |
            | summary.totalPaid    | 157.25 |
            | summary.totalPending | 0      |
            | payments             | [{"appointmentId":"${ref:id:appointment:evaluation}","procedureName":"Evaluation","paymentMethod":"PIX","expectedBrl":157.25,"receivedBrl":157.25,"pendingBrl":0}] |
        When I send a "GET" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/financial/summary?startDate=${ref:date:nextYear:01-01}&endDate=${ref:date:nextYear:01-31}"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | summary.totalBrl     | 157.25 |
            | summary.totalPaid    | 157.25 |
            | summary.totalPending | 0      |

    Scenario: A cancelled appointment without a payment leaves the forecast
        When I send a "PATCH" request to "/api/v1/appointments/${ref:id:appointment:evaluation}/cancel" with:
            | reason | Patient cancelled |
        Then the request should succeed with a 200 status code
        When I send a "GET" request to "/api/v1/appointments/${ref:id:appointment:evaluation}"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | revenue | null |
        When I send a "GET" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/financial/report?startDate=${ref:date:nextYear:01-01}&endDate=${ref:date:nextYear:01-31}"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | summary.totalPending | 0  |
            | pagination.total     | 0  |
            | payments             | [] |

    Scenario Outline: A prepaid appointment records coverage without charging the session again
        When I send a "POST" request to "/api/v1/<plans>" with:
            | name    | Prepaid assessment |
            | <quota> | 4                  |
            | priceBrl | 500               |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "plan" id for "coverage"
        When I send a "POST" request to "/api/v1/patients/${ref:id:patient:revenue_patient}/<patientCoverage>" with:
            | <planKey>    | ${ref:id:plan:coverage} |
            | paymentMethod | PIX                  |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "coverage" id for "prepaid"
        When I send a "PATCH" request to "/api/v1/appointments/${ref:id:appointment:evaluation}/checkin"
        Then the request should succeed with a 200 status code
        When I send a "PATCH" request to "/api/v1/appointments/${ref:id:appointment:evaluation}/call"
        Then the request should succeed with a 200 status code
        When I send a "PATCH" request to "/api/v1/appointments/${ref:id:appointment:evaluation}/complete"
        Then the request should succeed with a 200 status code
        When I send a "POST" request to "/api/v1/appointments/${ref:id:appointment:evaluation}/payment" with:
            | paymentMethod | <method>                    |
            | <coverageKey> | ${ref:id:coverage:prepaid}  |
        Then the request should succeed with a 201 status code
        And the response should contain:
            | amountBrl | 0 |
        When I send a "GET" request to "/api/v1/appointments/${ref:id:appointment:evaluation}"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | revenue.expectedBrl   | 0        |
            | revenue.receivedBrl   | 0        |
            | revenue.pendingBrl    | 0        |
            | revenue.paymentMethod | <method> |
        When I send a "GET" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/financial/report?startDate=${ref:date:nextYear:01-01}&endDate=${ref:date:nextYear:01-31}&paymentMethod=<method>"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | summary.totalBrl     | 0 |
            | summary.totalPaid    | 0 |
            | summary.totalPending | 0 |
            | pagination.total     | 1 |
            | payments             | [{"appointmentId":"${ref:id:appointment:evaluation}","paymentMethod":"<method>","expectedBrl":0,"receivedBrl":0,"pendingBrl":0}] |

        Examples:
            | method       | plans                      | quota                   | patientCoverage | planKey            | coverageKey           |
            | PACKAGE      | package-plans              | totalCredits            | packages        | packagePlanId      | patientPackageId      |
            | SUBSCRIPTION | patient-subscription-plans | monthlyAppointmentQuota | subscriptions   | subscriptionPlanId | patientSubscriptionId |

    Scenario: An insurance claim updates received revenue on both surfaces
        When I send a "POST" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/insurance-plans" with:
            | name | Test insurance |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "insurancePlan" id for "test"
        When I send a "POST" request to "/api/v1/patients/${ref:id:patient:revenue_patient}/insurance-enrollments" with:
            | insurancePlanId | ${ref:id:insurancePlan:test} |
        Then the request should succeed with a 201 status code
        When I send a "POST" request to "/api/v1/appointments/${ref:id:appointment:evaluation}/payment" with:
            | paymentMethod   | INSURANCE                    |
            | insurancePlanId | ${ref:id:insurancePlan:test} |
        Then the request should succeed with a 201 status code
        And the response should contain:
            | amountBrl | 157.25  |
            | status    | PENDING |
        And I save the response field "id" as "appointmentPayment" id for "insurance"
        And I save the claim for payment "insurance" as "evaluation"
        When I send a "GET" request to "/api/v1/appointments/${ref:id:appointment:evaluation}"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | revenue.expectedBrl   | 157.25    |
            | revenue.receivedBrl   | 0         |
            | revenue.pendingBrl    | 157.25    |
            | revenue.paymentMethod | INSURANCE |
        When I send a "PATCH" request to "/api/v1/insurance-claims/${ref:id:insuranceClaim:evaluation}/submit"
        Then the request should succeed with a 200 status code
        When I send a "PATCH" request to "/api/v1/insurance-claims/${ref:id:insuranceClaim:evaluation}/paid" with:
            | approvedAmountBrl | 140.10 |
        Then the request should succeed with a 200 status code
        When I send a "GET" request to "/api/v1/appointments/${ref:id:appointment:evaluation}"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | revenue.expectedBrl   | 140.10    |
            | revenue.receivedBrl   | 140.10    |
            | revenue.pendingBrl    | 0         |
            | revenue.paymentMethod | INSURANCE |
            | revenue.status        | PAID      |
        When I send a "GET" request to "/api/v1/clinics/${ref:id:clinic:dr_house}/financial/report?startDate=${ref:date:nextYear:01-01}&endDate=${ref:date:nextYear:01-31}&status=PAID"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | summary.totalBrl     | 140.10 |
            | summary.totalPaid    | 140.10 |
            | summary.totalPending | 0      |
            | payments             | [{"appointmentId":"${ref:id:appointment:evaluation}","insurancePlanName":"Test insurance","paymentMethod":"INSURANCE","expectedBrl":140.10,"receivedBrl":140.10,"pendingBrl":0,"status":"PAID"}] |
