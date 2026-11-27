Feature: Attendance flow — arrival, triage, call and finish
    The reception registers the arrival, the professional calls only their own patients
    and finishes the visit. The reception can do the same for the agendas it can access.
    When the clinic requires triage, the patient is only callable once the reception releases it.

    Background:
        Given the following users exist:
            | Name       | Username  | Email              | Password   |
            | Dr. House  | dr_house  | house@example.com  | H0use.Dr!  |
            | Dr. Wilson | dr_wilson | wilson@example.com | W1lson.Dr! |
            | Cuddy      | recep     | cuddy@example.com  | Cuddy.123! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        And the clinic member "dr_house" also has the role "OWNER"
        And the clinic "dr_house" has a plan for 5 professionals
        And a clinic member "dr_wilson" with role "PROFESSIONAL" in clinic "dr_house"
        And a clinic member "recep" with role "SECRETARY" in clinic "dr_house"
        And patient "waiting" has arrived for an appointment with "dr_house"

    Scenario: The attending professional sees the arrived patient, calls it to the room and finishes
        Then the "mine" attendance queue lists appointment "waiting" with:
            | status   | ARRIVED |
            | callable | true    |
            | mine     | true    |
        And calling appointment "waiting" to "Consultório 1" responds 200
        And the last call was "not shown" on the TV
        And the "mine" attendance queue lists appointment "waiting" with:
            | status | IN_PROGRESS |
        And finishing appointment "waiting" responds 200
        And the "mine" attendance queue is empty

    Scenario: Another professional cannot see, call or finish a patient of someone else's agenda
        Given I am signed in as "dr_wilson" with clinic member "${ref:id:clinicMember:dr_wilson}"
        Then the "all" attendance queue is empty
        And calling appointment "waiting" to "Sala 9" responds 403
        And the legacy call of appointment "waiting" responds 403
        And finishing appointment "waiting" responds 403

    Scenario: Reception only operates the agendas it was granted
        Given I am signed in as "recep" with clinic member "${ref:id:clinicMember:recep}"
        Then the "all" attendance queue is empty
        And calling appointment "waiting" to "Sala 2" responds 403
        Given I am signed in as "dr_house" with clinic member "${ref:id:clinicMember:dr_house}"
        And the agenda of "dr_house" is granted to "recep"
        And I am signed in as "recep" with clinic member "${ref:id:clinicMember:recep}"
        Then the "all" attendance queue lists appointment "waiting" with:
            | mine | false |
        And calling appointment "waiting" to "Sala 2" responds 200
        And finishing appointment "waiting" responds 200

    Scenario: With triage required the patient is callable only after the reception releases it
        Given the clinic "dr_house" requires triage
        And the agenda of "dr_house" is granted to "recep"
        Then calling appointment "waiting" to "Sala 1" responds 409
        And the legacy call of appointment "waiting" responds 409
        Given I am signed in as "dr_wilson" with clinic member "${ref:id:clinicMember:dr_wilson}"
        Then saving the triage of appointment "waiting" with weight "72.5" and release "no" responds 403
        Given I am signed in as "recep" with clinic member "${ref:id:clinicMember:recep}"
        Then saving the triage of appointment "waiting" with weight "72.5" and release "no" responds 200
        And saving the triage of appointment "waiting" with weight "none" and release "yes" responds 200
        Given I am signed in as "dr_house" with clinic member "${ref:id:clinicMember:dr_house}"
        Then the "mine" attendance queue lists appointment "waiting" with:
            | triageReleased | true |
            | callable       | true |
        And calling appointment "waiting" to "Sala 1" responds 200

    Scenario: A published panel shows the call and a repeated call announces again
        When I send a "PUT" request to "/api/v1/patient-call/link"
        Then the request should succeed with a 200 status code
        And calling appointment "waiting" to "Sala 3" responds 200
        And the last call was "shown" on the TV
        And calling appointment "waiting" to "Sala 3" responds 200
        And the last call was "shown" on the TV
        And appointment "waiting" has 2 recorded announcements
