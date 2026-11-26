Feature: Follow-up appointments from a clinical note
    A professional can schedule the next visit for the patient and link it to the originating care plan.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
            | Dr. Other | dr_other | other@example.com   | Other.1!  |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        When I send a "POST" request to "/api/v1/patients" with:
            | name       | Follow-up Patient |
            | documentId | 100.200.300-40    |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "follow_up"
        When I send a "POST" request to "/api/v1/records" with:
            | patientId                 | ${ref:id:patient:follow_up}    |
            | responsibleProfessionalId | ${ref:id:professional:dr_house} |
            | plan                      | Review treatment next month     |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "record" id for "follow_up"

    Scenario: Schedule and retrieve the return from its originating note
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId            | ${ref:id:patient:follow_up}             |
            | attendedByMemberId   | ${ref:id:clinicMember:dr_house}         |
            | startAt              | ${ref:date:nextYear:06-01T09:00:00.000Z} |
            | endAt                | ${ref:date:nextYear:06-01T10:00:00.000Z} |
            | type                 | RETURN                                    |
            | followUpFromRecordId | ${ref:id:record:follow_up}              |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "appointment" id for "follow_up"
        And the response should contain:
            | note   | null      |
            | status | SCHEDULED |
        When I send a "GET" request to "/api/v1/appointments/follow-ups/${ref:id:record:follow_up}"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            [{
              "id": "${ref:id:appointment:follow_up}",
              "startAt": "${ref:date:nextYear:06-01T09:00:00.000Z}",
              "status": "SCHEDULED"
            }]
            """

    Scenario: An appointment for another patient cannot use the note
        When I send a "POST" request to "/api/v1/patients" with:
            | name       | A different patient |
            | documentId | 100.200.300-41      |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "different"
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId            | ${ref:id:patient:different}            |
            | attendedByMemberId   | ${ref:id:clinicMember:dr_house}         |
            | startAt              | ${ref:date:nextYear:06-01T09:00:00.000Z} |
            | endAt                | ${ref:date:nextYear:06-01T10:00:00.000Z} |
            | type                 | RETURN                                    |
            | followUpFromRecordId | ${ref:id:record:follow_up}              |
        Then the request should fail with a 400 status code
        And the response should contain:
            | detail | appointment.follow_up_patient_mismatch |

    Scenario: A follow-up cannot be scheduled retroactively
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId            | ${ref:id:patient:follow_up}     |
            | attendedByMemberId   | ${ref:id:clinicMember:dr_house} |
            | startAt              | 2000-06-01T09:00:00.000Z         |
            | endAt                | 2000-06-01T10:00:00.000Z         |
            | type                 | RETURN                            |
            | retroactive          | true                              |
            | followUpFromRecordId | ${ref:id:record:follow_up}      |
        Then the request should fail with a 400 status code

    Scenario: Another clinic cannot list follow-ups or link its own appointments to the note
        Given I am signed in as "dr_other"
        And a professional "dr_other" exists with specialty "MEDICINA"
        And I am signed in as "dr_other" with professional "${ref:id:professional:dr_other}"
        When I send a "GET" request to "/api/v1/appointments/follow-ups/${ref:id:record:follow_up}"
        Then the request should fail with a 403 status code
        When I send a "POST" request to "/api/v1/patients" with:
            | name       | Patient from another clinic |
            | documentId | 100.200.300-42              |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "other"
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId            | ${ref:id:patient:other}                 |
            | attendedByMemberId   | ${ref:id:clinicMember:dr_other}         |
            | startAt              | ${ref:date:nextYear:06-01T09:00:00.000Z} |
            | endAt                | ${ref:date:nextYear:06-01T10:00:00.000Z} |
            | type                 | RETURN                                    |
            | followUpFromRecordId | ${ref:id:record:follow_up}              |
        Then the request should fail with a 403 status code
