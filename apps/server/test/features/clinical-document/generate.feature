Feature: Clinical document creation and PDF generation (POST)
    As a professional I want to create clinical documents and generate PDFs
    so that I can issue prescriptions and certificates to patients.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        When I send a "POST" request to "/api/v1/patients" with:
            | name           | Doc Patient                     |
            | documentId     | 777.888.999-00                  |
            | professionalId | ${ref:id:professional:dr_house} |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "patient" id for "doc_patient"

    Scenario: Create a prescription draft
        When I send a "POST" request to "/api/v1/clinical-documents" with body:
            """JSON
            {
                "type": "PRESCRIPTION",
                "patientId": "${ref:id:patient:doc_patient}",
                "responsibleProfessionalId": "${ref:id:professional:dr_house}",
                "contentJson": {
                    "__type": "PRESCRIPTION",
                    "medications": [
                        {"name": "Amoxicilina", "dosage": "500mg", "frequency": "8/8h", "duration": "7 dias", "instructions": "Tomar com água"}
                    ]
                }
            }
            """
        Then the request should succeed with a 201 status code
        And the response should contain:
            | type   | PRESCRIPTION |
            | status | DRAFT        |
        And I save the response field "id" as "clinicalDocument" id for "prescription"

    Scenario: Generate PDF for a prescription
        When I send a "POST" request to "/api/v1/clinical-documents" with body:
            """JSON
            {
                "type": "PRESCRIPTION",
                "patientId": "${ref:id:patient:doc_patient}",
                "responsibleProfessionalId": "${ref:id:professional:dr_house}",
                "contentJson": {
                    "__type": "PRESCRIPTION",
                    "medications": [
                        {"name": "Dipirona", "dosage": "500mg", "frequency": "6/6h", "duration": "3 dias"}
                    ]
                }
            }
            """
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "clinicalDocument" id for "rx_to_gen"
        When I send a "POST" request to "/api/v1/clinical-documents/${ref:id:clinicalDocument:rx_to_gen}/generate"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | status | GENERATED |

    Scenario: Create a medical certificate
        When I send a "POST" request to "/api/v1/clinical-documents" with body:
            """JSON
            {
                "type": "MEDICAL_CERTIFICATE",
                "patientId": "${ref:id:patient:doc_patient}",
                "responsibleProfessionalId": "${ref:id:professional:dr_house}",
                "contentJson": {
                    "__type": "MEDICAL_CERTIFICATE",
                    "reason": "Síndrome gripal",
                    "daysOff": 2,
                    "startDate": "2026-07-01"
                }
            }
            """
        Then the request should succeed with a 201 status code
        And the response should contain:
            | type   | MEDICAL_CERTIFICATE |
            | status | DRAFT               |

    Scenario: Create document without type returns 400
        When I send a "POST" request to "/api/v1/clinical-documents" with body:
            """JSON
            {
                "patientId": "${ref:id:patient:doc_patient}",
                "responsibleProfessionalId": "${ref:id:professional:dr_house}",
                "contentJson": {"__type": "PRESCRIPTION", "medications": []}
            }
            """
        Then the request should fail with a 400 status code

    Scenario: Create document without authentication returns 401
        Given I sign out
        When I send a "POST" request to "/api/v1/clinical-documents" with body:
            """JSON
            {
                "type": "PRESCRIPTION",
                "patientId": "${ref:id:patient:doc_patient}",
                "responsibleProfessionalId": "${ref:id:professional:dr_house}",
                "contentJson": {"__type": "PRESCRIPTION", "medications": []}
            }
            """
        Then the request should fail with a 401 status code
