Feature: Solo onboarding (POST /onboarding/solo)
    As an independent professional I want to sign up by myself
    so that I get a ready solo account without asking anyone to create it.

    Scenario: An independent professional signs up and lands on a solo account
        When I send a "POST" request to "/api/v1/onboarding/solo" with:
            | name               | Dra. Ana Souza                  |
            | username           | ana_${ref:var:contextId}        |
            | email              | ana_${ref:var:contextId}@ex.com |
            | password           | An4.Souza!                      |
            | registrationNumber | CRP 06/12345                    |
            | specialty          | Psicologia                      |
            | acceptTerms        | true                            |
        Then the request should succeed with a 201 status code
        And the response should contain:
            | clinic.name             | Consultório de Dra. Ana Souza |
            | clinic.accountType      | SOLO                          |
            | clinic.receptionEnabled | false                         |
        And I save the response field "clinicMemberId" as "clinicMember" id for "ana"
        When I send a "POST" request to "/api/v1/auth/sign-in" with:
            | username       | ana_${ref:var:contextId}     |
            | password       | An4.Souza!                   |
            | clinicMemberId | ${ref:id:clinicMember:ana}   |
        Then the request should succeed with a 200 status code
        When I send a "GET" request to "/api/v1/clinic-members/me/modules"
        Then the response should match:
            """JSON
            {"modules": [], "operationalModules": [], "accountType": "SOLO"}
            """
        When I send a "GET" request to "/api/v1/clinic-members/me"
        Then the response should contain:
            | roles | ["OWNER", "PROFESSIONAL"] |

    Scenario: Signing up requires accepting the terms
        When I send a "POST" request to "/api/v1/onboarding/solo" with:
            | name        | Dr. Sem Aceite                   |
            | username    | sem_${ref:var:contextId}         |
            | email       | sem_${ref:var:contextId}@ex.com  |
            | password    | S3m.Aceite!                      |
            | acceptTerms | false                            |
        Then the request should fail with a 400 status code
