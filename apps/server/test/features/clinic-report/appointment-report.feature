Feature: Clinic appointment report (GET)
    As a clinic owner I want an operational report of the agenda
    so that I can follow attendance, no-shows and cancellations by period and professional.

    Background:
        Given the following users exist:
            | Name      | Username | Email             | Password  |
            | Dr. House | dr_house | house@example.com | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And the clinic member "dr_house" also has the role "OWNER"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Report Patient                  |
            | documentId     | 666.777.888-99                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "report_patient"
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId          | ${ref:id:patient:report_patient}         |
            | attendedByMemberId | ${ref:id:clinicMember:dr_house}          |
            | startAt            | ${ref:date:nextYear:01-10T09:00:00.000Z} |
            | endAt              | ${ref:date:nextYear:01-10T10:00:00.000Z} |
            | type               | FIRST_VISIT                              |
            | retroactive        | true                                     |
        Then the request should succeed with a 201 status code

    Scenario: Report covers the appointments of the period
        When I send a "GET" request to "/api/v1/reports/appointments?startDate=${ref:date:nextYear:01-01}&endDate=${ref:date:nextYear:01-31}&timeZone=America/Sao_Paulo"
        Then the request should succeed with a 200 status code

    Scenario: Report filtered by professional
        When I send a "GET" request to "/api/v1/reports/appointments?startDate=${ref:date:nextYear:01-01}&endDate=${ref:date:nextYear:01-31}&professionalMemberId=${ref:id:clinicMember:dr_house}"
        Then the request should succeed with a 200 status code

    Scenario: Report rejects a period that ends before it starts
        When I send a "GET" request to "/api/v1/reports/appointments?startDate=${ref:date:nextYear:01-31}&endDate=${ref:date:nextYear:01-01}"
        Then the request should fail with a 400 status code

    Scenario: Report rejects an unknown time zone
        When I send a "GET" request to "/api/v1/reports/appointments?startDate=${ref:date:nextYear:01-01}&endDate=${ref:date:nextYear:01-31}&timeZone=Mars/Olympus"
        Then the request should fail with a 400 status code

    Scenario: Report without authentication returns 401
        Given I sign out
        When I send a "GET" request to "/api/v1/reports/appointments?startDate=${ref:date:nextYear:01-01}&endDate=${ref:date:nextYear:01-31}"
        Then the request should fail with a 401 status code
