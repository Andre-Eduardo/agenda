Feature: Procedure and service catalog
    The clinic controls the set of schedulable procedures and their defaults.

    Background:
        Given the following users exist:
            | Name      | Username   | Email               | Password  |
            | Dr. House | dr_house   | house@example.com   | H0use.Dr! |
            | Dr. Adams | dr_adams   | adams@example.com   | A4ams.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        When I send a "POST" request to "/api/v1/patients" with:
            | name       | Procedure Patient |
            | documentId | 100.200.300-40    |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "procedure_patient"

    Scenario: A deactivated catalog item with appointments is listed only in the catalog
        Given the clinic member "dr_house" also has the role "OWNER"
        When I send a "POST" request to "/api/v1/procedures" with:
            | name            | Follow-up assessment |
            | durationMinutes | 45                   |
            | color           | GREEN                |
            | priceInCents    | 15650                |
            | modality        | REMOTE               |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "procedure" id for "assessment"
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId          | ${ref:id:patient:procedure_patient} |
            | attendedByMemberId | ${ref:id:clinicMember:dr_house}     |
            | startAt            | 2027-04-01T09:00:00.000Z            |
            | type               | PROCEDURE                          |
            | procedureId        | ${ref:id:procedure:assessment}     |
            | retroactive        | true                               |
        Then the request should succeed with a 201 status code
        When I send a "PUT" request to "/api/v1/procedures/${ref:id:procedure:assessment}" with:
            | name            | Updated assessment |
            | durationMinutes | 60                 |
            | color           | BLUE               |
            | priceInCents    | 19500              |
            | modality        | IN_PERSON          |
            | active          | false              |
        Then the request should succeed with a 200 status code
        When I send a "GET" request to "/api/v1/procedures"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            []
            """
        When I send a "GET" request to "/api/v1/procedures/catalog"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            [{"id":"${ref:id:procedure:assessment}","name":"Updated assessment","durationMinutes":60,"color":"BLUE","priceInCents":19500,"modality":"IN_PERSON","active":false}]
            """

    Scenario: An appointment keeps its procedure details when the catalog item changes
        Given the clinic member "dr_house" also has the role "OWNER"
        When I send a "POST" request to "/api/v1/procedures" with:
            | name            | Follow-up assessment |
            | durationMinutes | 45                   |
            | color           | GREEN                |
            | priceInCents    | 15650                |
            | modality        | REMOTE               |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "procedure" id for "assessment"
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId          | ${ref:id:patient:procedure_patient} |
            | attendedByMemberId | ${ref:id:clinicMember:dr_house}     |
            | startAt            | 2027-04-01T09:00:00.000Z            |
            | type               | PROCEDURE                          |
            | procedureId        | ${ref:id:procedure:assessment}     |
            | retroactive        | true                               |
        Then the request should succeed with a 201 status code
        And the response should contain:
            | endAt                 | 2027-04-01T09:45:00.000Z        |
            | durationMinutes       | 45                             |
            | procedure.id          | ${ref:id:procedure:assessment} |
            | procedure.name        | Follow-up assessment           |
            | procedure.color       | GREEN                          |
            | procedure.priceInCents | 15650                          |
            | procedure.modality    | REMOTE                         |
        And I save the response field "id" as "appointment" id for "assessment"
        When I send a "PUT" request to "/api/v1/procedures/${ref:id:procedure:assessment}" with:
            | name            | Updated assessment |
            | durationMinutes | 60                 |
            | color           | BLUE               |
            | priceInCents    | 19500              |
            | modality        | IN_PERSON          |
            | active          | false              |
        Then the request should succeed with a 200 status code
        When I send a "PUT" request to "/api/v1/appointments/${ref:id:appointment:assessment}" with:
            | startAt | 2027-04-01T11:00:00.000Z |
        Then the request should succeed with a 200 status code
        When I send a "GET" request to "/api/v1/appointments/${ref:id:appointment:assessment}"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | endAt                  | 2027-04-01T11:45:00.000Z |
            | durationMinutes        | 45                      |
            | procedure.name         | Follow-up assessment    |
            | procedure.color        | GREEN                   |
            | procedure.priceInCents | 15650                   |
            | procedure.modality     | REMOTE                  |

    Scenario: A deactivated catalog item cannot be used for a new appointment
        Given the clinic member "dr_house" also has the role "OWNER"
        When I send a "POST" request to "/api/v1/procedures" with:
            | name            | Follow-up assessment |
            | durationMinutes | 45                   |
            | color           | GREEN                |
            | priceInCents    | 15650                |
            | modality        | REMOTE               |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "procedure" id for "assessment"
        When I send a "PUT" request to "/api/v1/procedures/${ref:id:procedure:assessment}" with:
            | name            | Updated assessment |
            | durationMinutes | 60                 |
            | color           | BLUE               |
            | priceInCents    | 19500              |
            | modality        | IN_PERSON          |
            | active          | false              |
        Then the request should succeed with a 200 status code
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId          | ${ref:id:patient:procedure_patient} |
            | attendedByMemberId | ${ref:id:clinicMember:dr_house}     |
            | startAt            | 2027-04-02T09:00:00.000Z            |
            | type               | PROCEDURE                          |
            | procedureId        | ${ref:id:procedure:assessment}     |
            | retroactive        | true                               |
        Then the request should fail with a 404 status code

    Scenario: An authorized member can override defaults on a single appointment
        Given the clinic member "dr_house" also has the role "ADMIN"
        When I send a "POST" request to "/api/v1/procedures" with:
            | name            | Evaluation |
            | durationMinutes | 35         |
            | color           | BLUE       |
            | priceInCents    | 10000      |
            | modality        | IN_PERSON  |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "procedure" id for "evaluation"
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId                        | ${ref:id:patient:procedure_patient} |
            | attendedByMemberId               | ${ref:id:clinicMember:dr_house}     |
            | startAt                          | 2027-04-01T09:00:00.000Z            |
            | endAt                            | 2027-04-01T09:55:00.000Z            |
            | type                             | PROCEDURE                          |
            | procedureId                      | ${ref:id:procedure:evaluation}     |
            | procedureOverrides.color         | AMBER                              |
            | procedureOverrides.priceInCents  | 12000                              |
            | procedureOverrides.modality      | REMOTE                             |
            | retroactive                      | true                               |
        Then the request should succeed with a 201 status code
        And the response should contain:
            | durationMinutes        | 55     |
            | procedure.color        | AMBER  |
            | procedure.priceInCents | 12000  |
            | procedure.modality     | REMOTE |
        And I save the response field "id" as "appointment" id for "evaluation"
        When I send a "PUT" request to "/api/v1/appointments/${ref:id:appointment:evaluation}" with:
            | procedureOverrides.priceInCents | 0 |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | durationMinutes        | 55    |
            | procedure.color        | AMBER |
            | procedure.priceInCents | 0     |
        When I send a "GET" request to "/api/v1/procedures"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            [{"id":"${ref:id:procedure:evaluation}","name":"Evaluation","durationMinutes":35,"color":"BLUE","priceInCents":10000,"modality":"IN_PERSON","active":true}]
            """

    Scenario: A professional can read active procedures and needs permission to manage the catalog
        When I send a "GET" request to "/api/v1/procedures"
        Then the request should succeed with a 200 status code
        When I send a "GET" request to "/api/v1/procedures/catalog"
        Then the request should fail with a 403 status code
        When I send a "POST" request to "/api/v1/procedures" with:
            | name            | Evaluation |
            | durationMinutes | 35         |
            | color           | BLUE       |
            | priceInCents    | 10000      |
            | modality        | IN_PERSON  |
        Then the request should fail with a 403 status code

    Scenario: A new procedure appointment requires a catalog item
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId          | ${ref:id:patient:procedure_patient} |
            | attendedByMemberId | ${ref:id:clinicMember:dr_house}     |
            | startAt            | 2027-04-01T09:00:00.000Z            |
            | endAt              | 2027-04-01T09:30:00.000Z            |
            | type               | PROCEDURE                          |
            | retroactive        | true                               |
        Then the request should fail with a 400 status code

    Scenario: An administrator cannot see or update a procedure owned by another clinic
        Given the clinic member "dr_house" also has the role "OWNER"
        And I am signed in as "dr_adams"
        And a professional "dr_adams" exists with specialty "MEDICINA"
        And I am signed in as "dr_adams" with professional "${ref:id:professional:dr_adams}"
        And the clinic member "dr_adams" also has the role "OWNER"
        When I send a "POST" request to "/api/v1/procedures" with:
            | name            | Another clinic's evaluation |
            | durationMinutes | 40                          |
            | color           | BLUE                        |
            | priceInCents    | 15500                       |
            | modality        | IN_PERSON                   |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "procedure" id for "foreign_item"
        Given I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        When I send a "GET" request to "/api/v1/procedures"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            []
            """
        When I send a "PUT" request to "/api/v1/procedures/${ref:id:procedure:foreign_item}" with:
            | name            | Renamed evaluation |
            | durationMinutes | 40                 |
            | color           | BLUE               |
            | priceInCents    | 15500              |
            | modality        | IN_PERSON          |
            | active          | false              |
        Then the request should fail with a 404 status code

    Scenario: An administrator cannot use a procedure owned by another clinic
        Given the clinic member "dr_house" also has the role "OWNER"
        And I am signed in as "dr_adams"
        And a professional "dr_adams" exists with specialty "MEDICINA"
        And I am signed in as "dr_adams" with professional "${ref:id:professional:dr_adams}"
        And the clinic member "dr_adams" also has the role "OWNER"
        When I send a "POST" request to "/api/v1/procedures" with:
            | name            | Another clinic's evaluation |
            | durationMinutes | 40                          |
            | color           | BLUE                        |
            | priceInCents    | 15500                       |
            | modality        | IN_PERSON                   |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "procedure" id for "foreign_item"
        Given I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        When I send a "POST" request to "/api/v1/appointments" with:
            | patientId          | ${ref:id:patient:procedure_patient} |
            | attendedByMemberId | ${ref:id:clinicMember:dr_house}     |
            | startAt            | 2027-04-01T09:00:00.000Z            |
            | type               | PROCEDURE                          |
            | procedureId        | ${ref:id:procedure:foreign_item}   |
            | retroactive        | true                               |
        Then the request should fail with a 404 status code
