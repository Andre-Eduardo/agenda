Feature: Attendance flow — arrival, triage, call and finish
    The reception registers the arrival, the professional calls only their own patients
    (with the room prefilled) and finishes the visit. The reception can do the same for the
    agendas it can access. When the clinic requires triage, the patient is only callable
    after the reception releases it.

    Background:
        Given the following users exist:
            | Name       | Username  | Email               | Password   |
            | Dr. House  | dr_house  | house@example.com   | H0use.Dr!  |
            | Dr. Wilson | dr_wilson | wilson@example.com  | W1lson.Dr! |
            | Cuddy      | recep     | cuddy@example.com   | Cuddy.123! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        And the clinic member "dr_house" also has the role "OWNER"
        And the clinic "dr_house" has a plan for 5 professionals
        When I send a "POST" request to "/api/v1/clinic-members/invite" with:
            | userId      | ${ref:id:user:dr_wilson} |
            | roles       | ["PROFESSIONAL"]         |
            | displayName | Dr. Wilson               |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "clinicMember" id for "dr_wilson"
        When I send a "POST" request to "/api/v1/clinic-members/invite" with:
            | userId      | ${ref:id:user:recep} |
            | roles       | ["SECRETARY"]        |
            | displayName | Cuddy                |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "clinicMember" id for "recep"
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Attendance Patient              |
            | documentId     | 111.222.333-44                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "waiting"
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId          | ${ref:id:patient:waiting}                |
            | attendedByMemberId | ${ref:id:clinicMember:dr_house}          |
            | startAt            | ${ref:date:nextYear:07-01T09:00:00.000Z} |
            | endAt              | ${ref:date:nextYear:07-01T10:00:00.000Z} |
            | type               | FIRST_VISIT                              |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "appointment" id for "waiting"
        When I send a "PATCH" request to "/api/v1/appointments/${ref:id:appointment:waiting}/checkin"
        Then the request should succeed with a 200 status code

    Scenario: The attending professional sees the arrived patient, calls it to the room and finishes
        When I send a "GET" request to "/api/v1/attendance?scope=mine&dateFrom=${ref:date:nextYear:07-01T00:00:00.000Z}&dateTo=${ref:date:nextYear:07-01T23:59:59.999Z}"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {"triageRequired":false,"panelPublished":false,"items":[{"appointmentId":"${ref:id:appointment:waiting}","patientName":"Attendance Patient","status":"ARRIVED","callable":true,"mine":true,"triageReleased":false,"triageStarted":false,"callCount":0,"destination":null,"suggestedDestination":null,"patientId":"_.isString","attendedByMemberId":"${ref:id:clinicMember:dr_house}","attendedByName":"_.isString","startAt":"_.isString","arrivedAt":"_.isString","calledAt":null}]}
            """
        When I send a "POST" request to "/api/v1/attendance/${ref:id:appointment:waiting}/calls" with:
            | destination | Consultório 1 |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | status      | IN_PROGRESS   |
            | destination | Consultório 1 |
            | announced   | false         |
        When I send a "POST" request to "/api/v1/attendance/${ref:id:appointment:waiting}/finish"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | status | COMPLETED |

    Scenario: Another professional cannot call or finish a patient of someone else's agenda
        Given I am signed in as "dr_wilson" with clinic member "${ref:id:clinicMember:dr_wilson}"
        When I send a "GET" request to "/api/v1/attendance?scope=all&dateFrom=${ref:date:nextYear:07-01T00:00:00.000Z}&dateTo=${ref:date:nextYear:07-01T23:59:59.999Z}"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | items | [] |
        When I send a "POST" request to "/api/v1/attendance/${ref:id:appointment:waiting}/calls" with:
            | destination | Sala 9 |
        Then the request should fail with a 403 status code
        When I send a "PATCH" request to "/api/v1/appointments/${ref:id:appointment:waiting}/call"
        Then the request should fail with a 403 status code

    Scenario: Reception only operates the agendas it was granted
        Given I am signed in as "recep" with clinic member "${ref:id:clinicMember:recep}"
        When I send a "POST" request to "/api/v1/attendance/${ref:id:appointment:waiting}/calls" with:
            | destination | Sala 2 |
        Then the request should fail with a 403 status code
        Given I am signed in as "dr_house" with clinic member "${ref:id:clinicMember:dr_house}"
        When I send a "POST" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/agenda-access" with:
            | granteeMemberId | ${ref:id:clinicMember:recep} |
        Then the request should succeed with a 201 status code
        Given I am signed in as "recep" with clinic member "${ref:id:clinicMember:recep}"
        When I send a "GET" request to "/api/v1/attendance?scope=all&dateFrom=${ref:date:nextYear:07-01T00:00:00.000Z}&dateTo=${ref:date:nextYear:07-01T23:59:59.999Z}"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | items | [{"appointmentId":"${ref:id:appointment:waiting}","mine":false}] |
        When I send a "POST" request to "/api/v1/attendance/${ref:id:appointment:waiting}/calls" with:
            | destination | Sala 2 |
        Then the request should succeed with a 200 status code
        When I send a "POST" request to "/api/v1/attendance/${ref:id:appointment:waiting}/finish"
        Then the request should succeed with a 200 status code

    Scenario: With triage required the patient is callable only after the reception releases it
        When I send a "PATCH" request to "/api/v1/clinics/${ref:id:clinic:dr_house}" with:
            | triageRequired | true |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | triageRequired | true |
        When I send a "POST" request to "/api/v1/attendance/${ref:id:appointment:waiting}/calls" with:
            | destination | Sala 1 |
        Then the request should fail with a 409 status code
        When I send a "PATCH" request to "/api/v1/appointments/${ref:id:appointment:waiting}/call"
        Then the request should fail with a 409 status code
        Given I am signed in as "dr_wilson" with clinic member "${ref:id:clinicMember:dr_wilson}"
        When I send a "PUT" request to "/api/v1/attendance/${ref:id:appointment:waiting}/triage" with:
            | release | true |
        Then the request should fail with a 403 status code
        Given I am signed in as "dr_house" with clinic member "${ref:id:clinicMember:dr_house}"
        When I send a "POST" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/agenda-access" with:
            | granteeMemberId | ${ref:id:clinicMember:recep} |
        Then the request should succeed with a 201 status code
        Given I am signed in as "recep" with clinic member "${ref:id:clinicMember:recep}"
        When I send a "PUT" request to "/api/v1/attendance/${ref:id:appointment:waiting}/triage" with:
            | weightKg         | 72.5 |
            | systolicPressure | 120  |
            | release          | false |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | weightKg | 72.5  |
            | released | false |
        Given I am signed in as "dr_house" with clinic member "${ref:id:clinicMember:dr_house}"
        When I send a "POST" request to "/api/v1/attendance/${ref:id:appointment:waiting}/calls" with:
            | destination | Sala 1 |
        Then the request should fail with a 409 status code
        Given I am signed in as "recep" with clinic member "${ref:id:clinicMember:recep}"
        When I send a "PUT" request to "/api/v1/attendance/${ref:id:appointment:waiting}/triage" with:
            | release | true |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | released | true |
            | weightKg | null |
        Given I am signed in as "dr_house" with clinic member "${ref:id:clinicMember:dr_house}"
        When I send a "GET" request to "/api/v1/attendance?scope=mine&dateFrom=${ref:date:nextYear:07-01T00:00:00.000Z}&dateTo=${ref:date:nextYear:07-01T23:59:59.999Z}"
        Then the response should contain:
            | triageRequired | true                                         |
            | items          | [{"triageReleased":true,"callable":true}] |
        When I send a "POST" request to "/api/v1/attendance/${ref:id:appointment:waiting}/calls" with:
            | destination | Sala 1 |
        Then the request should succeed with a 200 status code

    Scenario: A published panel shows the call and a repeated call announces again
        When I send a "PUT" request to "/api/v1/patient-call/link"
        Then the request should succeed with a 200 status code
        When I send a "POST" request to "/api/v1/attendance/${ref:id:appointment:waiting}/calls" with:
            | destination | Sala 3 |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | announced | true |
        When I send a "POST" request to "/api/v1/attendance/${ref:id:appointment:waiting}/calls" with:
            | destination | Sala 3 |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | status    | IN_PROGRESS |
            | announced | true        |
        And appointment "waiting" has 2 recorded announcements
