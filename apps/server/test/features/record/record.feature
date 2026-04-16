Feature: Clinical record management
    As an authenticated professional I want to manage clinical records (evoluções)
    so that I can document patient consultations over time.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        # Create a patient to use across record scenarios
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Record Patient                  |
            | documentId     | 200.300.400-50                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "rec_patient"

    # ─────────────────────────────────────────────────────────────────────────────
    # Create
    # ─────────────────────────────────────────────────────────────────────────────

    Scenario: Create a record with free-text description
        When I send a "POST" request to "/api/v1/records" with:
            | patientId      | ${ref:id:patient:rec_patient}   |
            | professionalId | ${ref:id:professional:dr_house} |
            | description    | General clinical note           |
        Then the request should succeed with a 201 status code
        And the response should contain:
            | description | General clinical note |
        And I save the response field "id" as "record" id for "rec_1"

    Scenario: Create a SOAP record with structured fields
        When I send a "POST" request to "/api/v1/records" with:
            | patientId      | ${ref:id:patient:rec_patient}                     |
            | professionalId | ${ref:id:professional:dr_house}                   |
            | title          | Follow-up consultation                             |
            | subjective     | Patient reports persistent headache for 3 days    |
            | objective      | BP 120/80, no fever                               |
            | assessment     | Tension headache, likely stress-related            |
            | plan           | Analgesics as needed, return in 7 days             |
        Then the request should succeed with a 201 status code
        And the response should contain:
            | title      | Follow-up consultation |
            | subjective | Patient reports persistent headache for 3 days |
        And I save the response field "id" as "record" id for "rec_soap"

    Scenario: Create a record without required fields (no patientId)
        When I send a "POST" request to "/api/v1/records" with:
            | professionalId | ${ref:id:professional:dr_house} |
            | description    | Orphan note                     |
        Then the request should fail with a 400 status code

    Scenario: Create a record without authentication
        Given I sign out
        When I send a "POST" request to "/api/v1/records" with:
            | patientId      | ${ref:id:patient:rec_patient}   |
            | professionalId | ${ref:id:professional:dr_house} |
            | description    | Unauthorised note               |
        Then the request should fail with a 401 status code

    # ─────────────────────────────────────────────────────────────────────────────
    # List / search
    # ─────────────────────────────────────────────────────────────────────────────

    Scenario: List records returns paginated results
        When I send a "POST" request to "/api/v1/records" with:
            | patientId      | ${ref:id:patient:rec_patient}   |
            | professionalId | ${ref:id:professional:dr_house} |
            | description    | List seed record                |
        Then the request should succeed with a 201 status code
        When I send a "GET" request to "/api/v1/records" with the query:
            | page | 1  |
            | size | 10 |
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            {
              "data": "__array__",
              "total": "__number__",
              "page": 1,
              "size": 10
            }
            """

    Scenario: Filter records by patient
        When I send a "POST" request to "/api/v1/records" with:
            | patientId      | ${ref:id:patient:rec_patient}   |
            | professionalId | ${ref:id:professional:dr_house} |
            | description    | Patient-filtered record         |
        Then the request should succeed with a 201 status code
        When I send a "GET" request to "/api/v1/records" with the query:
            | patientId | ${ref:id:patient:rec_patient} |
            | page      | 1                             |
            | size      | 10                            |
        Then the request should succeed with a 200 status code

    Scenario: List records without authentication
        Given I sign out
        When I send a "GET" request to "/api/v1/records"
        Then the request should fail with a 401 status code

    # ─────────────────────────────────────────────────────────────────────────────
    # Get by ID
    # ─────────────────────────────────────────────────────────────────────────────

    Scenario: Get record by ID
        When I send a "POST" request to "/api/v1/records" with:
            | patientId      | ${ref:id:patient:rec_patient}   |
            | professionalId | ${ref:id:professional:dr_house} |
            | description    | Get by id record                |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "record" id for "get_test"
        When I send a "GET" request to "/api/v1/records/${ref:id:record:get_test}"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | id | ${ref:id:record:get_test} |

    Scenario: Get record with unknown ID
        When I send a "GET" request to "/api/v1/records/01900000-0000-7000-8000-000000000000"
        Then the request should fail with a 404 status code

    # ─────────────────────────────────────────────────────────────────────────────
    # Update
    # ─────────────────────────────────────────────────────────────────────────────

    Scenario: Update a record description
        When I send a "POST" request to "/api/v1/records" with:
            | patientId      | ${ref:id:patient:rec_patient}   |
            | professionalId | ${ref:id:professional:dr_house} |
            | description    | Before update                   |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "record" id for "to_update"
        When I send a "PUT" request to "/api/v1/records/${ref:id:record:to_update}" with:
            | description | After update |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | description | After update |

    Scenario: Update record SOAP fields
        When I send a "POST" request to "/api/v1/records" with:
            | patientId      | ${ref:id:patient:rec_patient}   |
            | professionalId | ${ref:id:professional:dr_house} |
            | subjective     | Initial complaint               |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "record" id for "soap_update"
        When I send a "PUT" request to "/api/v1/records/${ref:id:record:soap_update}" with:
            | subjective | Updated complaint |
            | assessment | Updated assessment |
            | plan       | Updated plan      |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | subjective | Updated complaint |

    Scenario: Update record with unknown ID
        When I send a "PUT" request to "/api/v1/records/01900000-0000-7000-8000-000000000000" with:
            | description | Ghost record |
        Then the request should fail with a 404 status code

    # ─────────────────────────────────────────────────────────────────────────────
    # Delete
    # ─────────────────────────────────────────────────────────────────────────────

    Scenario: Delete record
        When I send a "POST" request to "/api/v1/records" with:
            | patientId      | ${ref:id:patient:rec_patient}   |
            | professionalId | ${ref:id:professional:dr_house} |
            | description    | To be deleted                   |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "record" id for "to_delete"
        When I send a "DELETE" request to "/api/v1/records/${ref:id:record:to_delete}"
        Then the request should succeed with a 200 status code

    Scenario: Delete record without authentication
        Given I sign out
        When I send a "DELETE" request to "/api/v1/records/01900000-0000-7000-8000-000000000000"
        Then the request should fail with a 401 status code
