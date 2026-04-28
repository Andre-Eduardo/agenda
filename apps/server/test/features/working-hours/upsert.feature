Feature: Working Hours CRUD (POST / GET / DELETE)
    As an authenticated professional I want to manage my working hours
    so that the system can validate appointment scheduling against my availability.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"

    Scenario: Create working hours for Monday
        When I send a "POST" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/working-hours" with:
            | dayOfWeek    | 1     |
            | startTime    | 08:00 |
            | endTime      | 17:00 |
            | slotDuration | 30    |
            | active       | true  |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | dayOfWeek    | 1     |
            | startTime    | 08:00 |
            | endTime      | 17:00 |
            | slotDuration | 30    |
            | active       | true  |
        And I save the response field "id" as "working_hours" id for "monday"

    Scenario: Update existing working hours for Monday
        When I send a "POST" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/working-hours" with:
            | dayOfWeek    | 1     |
            | startTime    | 09:00 |
            | endTime      | 18:00 |
            | slotDuration | 60    |
            | active       | true  |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | dayOfWeek    | 1     |
            | startTime    | 09:00 |
            | endTime      | 18:00 |
            | slotDuration | 60    |
        When I send a "POST" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/working-hours" with:
            | dayOfWeek    | 1     |
            | startTime    | 10:00 |
            | endTime      | 16:00 |
            | slotDuration | 30    |
            | active       | true  |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | dayOfWeek    | 1     |
            | startTime    | 10:00 |
            | endTime      | 16:00 |

    Scenario: Deactivate a day (active=false)
        When I send a "POST" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/working-hours" with:
            | dayOfWeek    | 3     |
            | startTime    | 08:00 |
            | endTime      | 12:00 |
            | slotDuration | 30    |
            | active       | false |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | dayOfWeek | 3     |
            | active    | false |

    Scenario: List all working hours for a member
        When I send a "POST" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/working-hours" with:
            | dayOfWeek    | 1     |
            | startTime    | 08:00 |
            | endTime      | 17:00 |
            | slotDuration | 30    |
            | active       | true  |
        And I send a "POST" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/working-hours" with:
            | dayOfWeek    | 2     |
            | startTime    | 08:00 |
            | endTime      | 17:00 |
            | slotDuration | 30    |
            | active       | true  |
        When I send a "GET" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/working-hours"
        Then the request should succeed with a 200 status code

    Scenario: Delete a working hours entry
        When I send a "POST" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/working-hours" with:
            | dayOfWeek    | 5     |
            | startTime    | 08:00 |
            | endTime      | 12:00 |
            | slotDuration | 30    |
            | active       | true  |
        Then the request should succeed with a 200 status code
        And I save the response field "id" as "working_hours" id for "friday"
        When I send a "DELETE" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/working-hours/${ref:id:working_hours:friday}"
        Then the request should succeed with a 204 status code

    Scenario: Create appointment outside working hours returns error
        When I send a "POST" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/working-hours" with:
            | dayOfWeek    | 1     |
            | startTime    | 09:00 |
            | endTime      | 17:00 |
            | slotDuration | 30    |
            | active       | true  |
        And the following users exist:
            | Name        | Username | Email              | Password  |
            | João Silva  | joao     | joao@example.com   | J0ao.Sv!  |
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | João Silva                          |
            | documentId     | 999.888.777-66                      |
            | professionalId | ${ref:id:professional:dr_house}     |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "joao"
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId            | ${ref:id:patient:joao}              |
            | attendedByMemberId   | ${ref:id:clinicMember:dr_house}     |
            | startAt              | 2026-06-01T06:00:00.000Z            |
            | endAt                | 2026-06-01T07:00:00.000Z            |
            | type                 | FIRST_VISIT                         |
        Then the request should fail with a 409 status code

    Scenario: Upsert working hours requires authentication
        Given I sign out
        When I send a "POST" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/working-hours" with:
            | dayOfWeek    | 1     |
            | startTime    | 08:00 |
            | endTime      | 17:00 |
            | slotDuration | 30    |
            | active       | true  |
        Then the request should fail with a 401 status code

    Scenario: Upsert with invalid payload returns 400
        When I send a "POST" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/working-hours" with:
            | dayOfWeek | 9 |
        Then the request should fail with a 400 status code
