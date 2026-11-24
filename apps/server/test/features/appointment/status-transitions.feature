Feature: Appointment status transitions
    As a clinic member I want valid appointment transitions and a traceable history
    so that the care team can see who changed the state and when.

    Background:
        Given the following users exist:
            | Name      | Username | Email             | Password  |
            | Dr. House | dr_house | house@example.com | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Transition Patient               |
            | documentId     | 100.200.300-40                   |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "transition_patient"

    Scenario: A valid care journey records each actor and time in order
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId          | ${ref:id:patient:transition_patient} |
            | attendedByMemberId | ${ref:id:clinicMember:dr_house}     |
            | startAt            | 2027-03-01T09:00:00.000Z            |
            | endAt              | 2027-03-01T10:00:00.000Z            |
            | type               | FIRST_VISIT                         |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "appointment" id for "care_journey"
        When I send a "PATCH" request to "/api/v1/appointments/${ref:id:appointment:care_journey}/confirm"
        Then the request should succeed with a 200 status code
        When I send a "PATCH" request to "/api/v1/appointments/${ref:id:appointment:care_journey}/checkin"
        Then the request should succeed with a 200 status code
        When I send a "PATCH" request to "/api/v1/appointments/${ref:id:appointment:care_journey}/call"
        Then the request should succeed with a 200 status code
        When I send a "PATCH" request to "/api/v1/appointments/${ref:id:appointment:care_journey}/complete"
        Then the request should succeed with a 200 status code
        When I send a "GET" request to "/api/v1/appointments/${ref:id:appointment:care_journey}/status-transitions"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            [
              {"id":"_.isString","appointmentId":"${ref:id:appointment:care_journey}","actorUserId":"_.isString","actorMemberId":"${ref:id:clinicMember:dr_house}","fromStatus":"SCHEDULED","toStatus":"CONFIRMED","reason":null,"occurredAt":"_.isString"},
              {"id":"_.isString","appointmentId":"${ref:id:appointment:care_journey}","actorUserId":"_.isString","actorMemberId":"${ref:id:clinicMember:dr_house}","fromStatus":"CONFIRMED","toStatus":"ARRIVED","reason":null,"occurredAt":"_.isString"},
              {"id":"_.isString","appointmentId":"${ref:id:appointment:care_journey}","actorUserId":"_.isString","actorMemberId":"${ref:id:clinicMember:dr_house}","fromStatus":"ARRIVED","toStatus":"IN_PROGRESS","reason":null,"occurredAt":"_.isString"},
              {"id":"_.isString","appointmentId":"${ref:id:appointment:care_journey}","actorUserId":"_.isString","actorMemberId":"${ref:id:clinicMember:dr_house}","fromStatus":"IN_PROGRESS","toStatus":"COMPLETED","reason":null,"occurredAt":"_.isString"}
            ]
            """

    Scenario: Direct completion is rejected and leaves no status history
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId          | ${ref:id:patient:transition_patient} |
            | attendedByMemberId | ${ref:id:clinicMember:dr_house}     |
            | startAt            | 2027-03-02T09:00:00.000Z            |
            | endAt              | 2027-03-02T10:00:00.000Z            |
            | type               | RETURN                              |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "appointment" id for "direct_complete"
        When I send a "PATCH" request to "/api/v1/appointments/${ref:id:appointment:direct_complete}/complete"
        Then the request should fail with a 409 status code
        When I send a "GET" request to "/api/v1/appointments/${ref:id:appointment:direct_complete}/status-transitions"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            []
            """

    Scenario: Cancellation records the reason and the member who acted
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId          | ${ref:id:patient:transition_patient} |
            | attendedByMemberId | ${ref:id:clinicMember:dr_house}     |
            | startAt            | 2027-03-03T09:00:00.000Z            |
            | endAt              | 2027-03-03T10:00:00.000Z            |
            | type               | RETURN                              |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "appointment" id for "cancel_with_reason"
        When I send a "PATCH" request to "/api/v1/appointments/${ref:id:appointment:cancel_with_reason}/cancel" with:
            | reason | Patient requested cancellation |
        Then the request should succeed with a 200 status code
        When I send a "GET" request to "/api/v1/appointments/${ref:id:appointment:cancel_with_reason}/status-transitions"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            [
              {"id":"_.isString","appointmentId":"${ref:id:appointment:cancel_with_reason}","actorUserId":"_.isString","actorMemberId":"${ref:id:clinicMember:dr_house}","fromStatus":"SCHEDULED","toStatus":"CANCELLED","reason":"Patient requested cancellation","occurredAt":"_.isString"}
            ]
            """
