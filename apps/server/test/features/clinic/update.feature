Feature: Clinic update (PATCH)
    As an authenticated clinic owner I want to update clinic information
    so that address, logo, and specialties stay current.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with clinic member "${ref:id:clinicMember:dr_house}"

    Scenario: Update clinic name
        When I send a "PATCH" request to "/api/v1/clinics/${ref:id:clinic:dr_house}" with:
            | name | Clínica Atualizada |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | name | Clínica Atualizada |

    Scenario: Update clinic full address
        When I send a "PATCH" request to "/api/v1/clinics/${ref:id:clinic:dr_house}" with:
            | street       | Rua das Flores |
            | number       | 123A           |
            | complement   | Apto 4         |
            | neighborhood | Centro         |
            | city         | São Paulo      |
            | state        | SP             |
            | zipCode      | 01310-100      |
            | country      | BR             |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | street | Rua das Flores |
            | number | 123A           |
            | city   | São Paulo      |
            | state  | SP             |

    Scenario: Update clinic logo
        When I send a "PATCH" request to "/api/v1/clinics/${ref:id:clinic:dr_house}" with:
            | logoUrl | https://example.com/logo.png |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | logoUrl | https://example.com/logo.png |

    Scenario: Update clinic specialties
        When I send a "PATCH" request to "/api/v1/clinics/${ref:id:clinic:dr_house}" with body:
            """JSON
            {"clinicSpecialties": ["MEDICINA_ESPECIALIZADA", "SAUDE_MENTAL"]}
            """
        Then the request should succeed with a 200 status code

    Scenario: Update attempt without clinic member context returns 403
        Given the following users exist:
            | Name          | Username    | Email                    | Password    |
            | No Member     | no_member   | nomember@example.com     | N0Member.!  |
        And I am signed in as "no_member"
        When I send a "PATCH" request to "/api/v1/clinics/${ref:id:clinic:dr_house}" with:
            | name | New Name |
        Then the request should fail with a 403 status code
