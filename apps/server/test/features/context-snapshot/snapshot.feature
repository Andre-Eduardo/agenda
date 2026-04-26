Feature: Patient context snapshot (POST / GET)
    As a professional I want to build and query patient context snapshots
    so that the clinical AI agent has accurate patient history available.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Snapshot Patient                |
            | documentId     | 888.999.000-11                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "snap_patient"

    Scenario: Rebuild snapshot for a patient returns indexed count
        When I send a "POST" request to "/api/v1/clinical-chat/context/rebuild" with body:
            """JSON
            {"patientId": "${ref:id:patient:snap_patient}", "reindex": true}
            """
        Then the request should succeed with a 200 status code

    Scenario: Get snapshot after rebuild returns snapshot data
        When I send a "POST" request to "/api/v1/clinical-chat/context/rebuild" with body:
            """JSON
            {"patientId": "${ref:id:patient:snap_patient}", "reindex": true}
            """
        Then the request should succeed with a 200 status code
        When I send a "GET" request to "/api/v1/clinical-chat/context/snapshot/${ref:id:patient:snap_patient}"
        Then the request should succeed with a 200 status code

    Scenario: New record marks existing snapshot as stale after invalidation
        When I send a "POST" request to "/api/v1/clinical-chat/context/rebuild" with body:
            """JSON
            {"patientId": "${ref:id:patient:snap_patient}", "reindex": true}
            """
        Then the request should succeed with a 200 status code
        When I send a "POST" request to "/api/v1/records" with:
            | patientId      | ${ref:id:patient:snap_patient}  |
            | professionalId | ${ref:id:professional:dr_house} |
            | description    | Novo dado clínico para invalidar snapshot |
        Then the request should succeed with a 201 status code
        When I send a "POST" request to "/api/v1/clinical-chat/context/invalidate" with body:
            """JSON
            {"patientId": "${ref:id:patient:snap_patient}"}
            """
        Then the request should succeed with a 200 status code
        And the response should contain:
            | invalidated | true |

    Scenario: Rebuild without authentication returns 401
        Given I sign out
        When I send a "POST" request to "/api/v1/clinical-chat/context/rebuild" with body:
            """JSON
            {"patientId": "${ref:id:patient:snap_patient}"}
            """
        Then the request should fail with a 401 status code
