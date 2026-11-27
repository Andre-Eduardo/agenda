Feature: Patient call queue and reception display

    Background:
        Given the following users exist:
            | Name          | Username  | Email             | Password  |
            | Dr. House     | dr_house  | house@example.com | H0use.Dr! |
            | Dr. Wilson    | dr_wilson | wilson@example.com| W1lson.Dr!|
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        And the clinic member "dr_house" also has the role "OWNER"
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Call Queue Patient              |
            | documentId     | 111.222.333-44                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "waiting"
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId          | ${ref:id:patient:waiting}                   |
            | attendedByMemberId | ${ref:id:clinicMember:dr_house}              |
            | startAt            | ${ref:date:nextYear:07-01T09:00:00.000Z}     |
            | endAt              | ${ref:date:nextYear:07-01T10:00:00.000Z}     |
            | type               | FIRST_VISIT                                  |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "appointment" id for "waiting"
        When I send a "PUT" request to "/api/v1/patient-call/link"
        Then the request should succeed with a 200 status code
        And I save the response field "publicToken" as "panel" id for "house"

    Scenario: Concurrent check-ins share one queue entry and only one operator can call it
        When the check-in for appointment "waiting" is submitted twice concurrently
        Then the appointment "waiting" has a single arrival transition
        When I send a "GET" request to "/api/v1/patient-call/queue"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            [{"appointmentId":"${ref:id:appointment:waiting}","callCount":0,"patientName":"Call Queue Patient","arrivedAt":"_.isString","destination":null}]
            """
        When operators concurrently call appointment "waiting" to room 3
        Then appointment "waiting" has 1 recorded announcement
        When I send a "GET" request to "/api/v1/appointments/${ref:id:appointment:waiting}"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | status | ARRIVED |
        When I send a "PATCH" request to "/api/v1/appointments/${ref:id:appointment:waiting}/start"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | status | IN_PROGRESS |
        When I send a "GET" request to "/api/v1/patient-call/queue"
        Then the response should match:
            """JSON
            []
            """

    Scenario: The anonymous display exposes only the public announcement and hides it when it expires
        When I send a "PATCH" request to "/api/v1/appointments/${ref:id:appointment:waiting}/checkin"
        Then the request should succeed with a 200 status code
        When I send a "POST" request to "/api/v1/patient-call/queue/${ref:id:appointment:waiting}/announcements" with:
            | place  | DESK |
            | number | 5    |
        Then the request should succeed with a 200 status code
        Given I sign out
        And I set the header "x-patient-call-token" to "${ref:id:panel:house}"
        Then the public panel displays patient "Call Queue Patient" for "Guichê 5" with only display fields
        When the announcement for appointment "waiting" has expired
        And I send a "GET" request to "/api/v1/patient-call/display"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | call | null |
        And the public panel shows no recent calls

    Scenario: The manager can retain recent names on the TV and hide them again
        Given appointment "waiting" is checked in and announced to room 3
        When I turn the public call history "on"
        And the announcement for appointment "waiting" has expired
        Given I set the header "x-patient-call-token" to "${ref:id:panel:house}"
        When I send a "GET" request to "/api/v1/patient-call/display"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | call | null |
        And the public panel lists "Call Queue Patient" for "Sala 3" as the only recent call
        When I turn the public call history "off"
        And I send a "GET" request to "/api/v1/patient-call/display"
        Then the request should succeed with a 200 status code
        And the public panel shows no recent calls

    Scenario: The history excludes announcements older than thirty minutes
        Given appointment "waiting" is checked in and announced to room 3
        When I turn the public call history "on"
        And the announcement for appointment "waiting" expired 31 minutes ago
        Given I set the header "x-patient-call-token" to "${ref:id:panel:house}"
        When I send a "GET" request to "/api/v1/patient-call/display"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | call | null |
        And the public panel shows no recent calls

    Scenario: A professional cannot publish a clinic's TV link without a management role
        Given I am signed in as "dr_wilson"
        And a professional "dr_wilson" exists with specialty "MEDICINA"
        And I am signed in as "dr_wilson" with professional "${ref:id:professional:dr_wilson}"
        When I send a "PUT" request to "/api/v1/patient-call/link"
        Then the request should fail with a 403 status code

    Scenario: A second clinic cannot operate the first clinic's queue or see its announcements on its own TV
        Given appointment "waiting" is checked in and announced to room 3
        And I am signed in as "dr_wilson"
        And a professional "dr_wilson" exists with specialty "MEDICINA"
        And I am signed in as "dr_wilson" with professional "${ref:id:professional:dr_wilson}"
        And the clinic member "dr_wilson" also has the role "OWNER"
        When I send a "PUT" request to "/api/v1/patient-call/link"
        Then I save the response field "publicToken" as "panel" id for "wilson"
        When I send a "GET" request to "/api/v1/patient-call/queue"
        Then the response should match:
            """JSON
            []
            """
        When I send a "POST" request to "/api/v1/patient-call/queue/${ref:id:appointment:waiting}/announcements" with:
            | place  | ROOM |
            | number | 2    |
        Then the request should fail with a 404 status code
        Given I set the header "x-patient-call-token" to "${ref:id:panel:wilson}"
        When I send a "GET" request to "/api/v1/patient-call/display"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | call | null |

    Scenario: Rotating and revoking links invalidates each previous TV address
        When I send a "PUT" request to "/api/v1/patient-call/link"
        Then the request should succeed with a 200 status code
        And I save the response field "publicToken" as "panel" id for "rotated"
        Given I set the header "x-patient-call-token" to "${ref:id:panel:house}"
        When I send a "GET" request to "/api/v1/patient-call/display"
        Then the request should fail with a 404 status code
        Given I set the header "x-patient-call-token" to "${ref:id:panel:rotated}"
        When I send a "GET" request to "/api/v1/patient-call/display"
        Then the request should succeed with a 200 status code
        When I send a "DELETE" request to "/api/v1/patient-call/link"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | enabled     | true |
            | publicToken | null |
        When I send a "GET" request to "/api/v1/patient-call/display"
        Then the request should fail with a 404 status code

    Scenario: A recall repeats the destination and removal preserves the appointment's arrival
        When I send a "PATCH" request to "/api/v1/appointments/${ref:id:appointment:waiting}/checkin"
        Then the request should succeed with a 200 status code
        When I send a "POST" request to "/api/v1/patient-call/queue/${ref:id:appointment:waiting}/announcements" with:
            | place  | ROOM |
            | number | 3    |
        Then the request should succeed with a 200 status code
        When I send a "POST" request to "/api/v1/patient-call/queue/${ref:id:appointment:waiting}/recalls" with:
            | callCount | 1 |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | destination | Sala 3 |
            | callCount   | 2      |
        And appointment "waiting" has 2 recorded announcements
        When I send a "POST" request to "/api/v1/patient-call/queue/${ref:id:appointment:waiting}/removals" with:
            | reason | Patient left the waiting room |
        Then the request should succeed with a 204 status code
        And appointment "waiting" was withdrawn for "Patient left the waiting room"
        When I send a "PATCH" request to "/api/v1/appointments/${ref:id:appointment:waiting}/checkin"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | status             | ARRIVED |
            | inPatientCallQueue | false   |

    Scenario: Cancelling an arrived appointment closes its queue entry
        When I send a "PATCH" request to "/api/v1/appointments/${ref:id:appointment:waiting}/checkin"
        Then the request should succeed with a 200 status code
        When I send a "PATCH" request to "/api/v1/appointments/${ref:id:appointment:waiting}/cancel" with:
            | reason | Patient cancelled at reception |
        Then the request should succeed with a 200 status code
        When I send a "GET" request to "/api/v1/patient-call/queue"
        Then the response should match:
            """JSON
            []
            """
