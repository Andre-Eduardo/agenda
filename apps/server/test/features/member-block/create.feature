Feature: Member Block CRUD (POST / GET / DELETE)
    As an authenticated professional I want to manage my schedule blocks
    so that appointments cannot be booked during blocked periods.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"

    Scenario: Create a schedule block
        When I send a "POST" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/blocks" with:
            | startAt | 2026-07-01T09:00:00.000Z |
            | endAt   | 2026-07-01T12:00:00.000Z |
            | reason  | Medical conference       |
        Then the request should succeed with a 201 status code
        And the response should contain:
            | clinicMemberId | ${ref:id:clinicMember:dr_house} |
            | reason         | Medical conference              |
        And I save the response field "id" as "member_block" id for "conference"

    Scenario: Create a block without reason
        When I send a "POST" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/blocks" with:
            | startAt | 2026-07-02T08:00:00.000Z |
            | endAt   | 2026-07-02T09:00:00.000Z |
        Then the request should succeed with a 201 status code
        And the response should contain:
            | clinicMemberId | ${ref:id:clinicMember:dr_house} |

    Scenario: Appointment during a block returns 412
        When I send a "POST" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/blocks" with:
            | startAt | 2026-08-01T09:00:00.000Z |
            | endAt   | 2026-08-01T17:00:00.000Z |
            | reason  | On leave                 |
        Then the request should succeed with a 201 status code
        And the following users exist:
            | Name       | Username | Email            | Password  |
            | João Silva | joao     | joao@example.com | J0ao.Sv!  |
        When I send a "POST" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/working-hours" with:
            | dayOfWeek    | 5     |
            | startTime    | 08:00 |
            | endTime      | 18:00 |
            | slotDuration | 30    |
            | active       | true  |
        And I send a "POST" request to "/api/v1/patients" with:
            | name           | João Silva                          |
            | documentId     | 999.888.777-66                      |
            | professionalId | ${ref:id:professional:dr_house}     |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "joao"
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId          | ${ref:id:patient:joao}              |
            | attendedByMemberId | ${ref:id:clinicMember:dr_house}     |
            | startAt            | 2026-08-01T10:00:00.000Z            |
            | endAt              | 2026-08-01T11:00:00.000Z            |
            | type               | FIRST_VISIT                         |
        Then the request should fail with a 412 status code

    Scenario: List blocks for a member
        When I send a "POST" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/blocks" with:
            | startAt | 2026-09-01T08:00:00.000Z |
            | endAt   | 2026-09-01T10:00:00.000Z |
            | reason  | Training session         |
        Then the request should succeed with a 201 status code
        When I send a "POST" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/blocks" with:
            | startAt | 2026-09-02T14:00:00.000Z |
            | endAt   | 2026-09-02T16:00:00.000Z |
            | reason  | Personal appointment     |
        Then the request should succeed with a 201 status code
        When I send a "GET" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/blocks"
        Then the request should succeed with a 200 status code

    Scenario: List blocks filtered by period
        When I send a "POST" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/blocks" with:
            | startAt | 2026-10-01T08:00:00.000Z |
            | endAt   | 2026-10-01T10:00:00.000Z |
            | reason  | October block            |
        Then the request should succeed with a 201 status code
        When I send a "GET" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/blocks?startAt=2026-10-01T00:00:00.000Z&endAt=2026-10-31T23:59:59.000Z"
        Then the request should succeed with a 200 status code

    Scenario: Delete a schedule block
        When I send a "POST" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/blocks" with:
            | startAt | 2026-11-01T09:00:00.000Z |
            | endAt   | 2026-11-01T11:00:00.000Z |
            | reason  | To be deleted            |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "member_block" id for "to_delete"
        When I send a "DELETE" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/blocks/${ref:id:member_block:to_delete}"
        Then the request should succeed with a 204 status code

    Scenario: Create block with endAt before startAt returns 400
        When I send a "POST" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/blocks" with:
            | startAt | 2026-12-01T12:00:00.000Z |
            | endAt   | 2026-12-01T09:00:00.000Z |
        Then the request should fail with a 400 status code

    Scenario: Create block requires authentication
        Given I sign out
        When I send a "POST" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/blocks" with:
            | startAt | 2026-12-15T09:00:00.000Z |
            | endAt   | 2026-12-15T11:00:00.000Z |
        Then the request should fail with a 401 status code
