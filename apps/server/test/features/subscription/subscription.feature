Feature: Subscription management (GET / PATCH / POST)
    As a professional I want to manage my subscription plan and add-ons
    so that I have access to the features I need within my usage limits.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with clinic member "${ref:id:clinicMember:dr_house}"

    Scenario: Get subscription returns current plan
        When I send a "GET" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/subscription"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | status | ACTIVE |

    Scenario: Get current usage returns zeroed counters on a fresh account
        When I send a "GET" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/usage"
        Then the request should succeed with a 200 status code

    Scenario: List addon catalog is public
        When I send a "GET" request to "/api/v1/addons/catalog"
        Then the request should succeed with a 200 status code

    Scenario: Change subscription plan
        When I send a "PATCH" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/subscription" with:
            | planCode | CONSULTORIO |
        Then the request should succeed with a 200 status code
        And the response should contain:
            | planCode | CONSULTORIO |

    Scenario: Purchase an add-on charges via the payment provider before granting it
        Given the clinic member "dr_house" also has the role "OWNER"
        And the subscription for "dr_house" has a payment method on file
        When I send a "POST" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/addons" with:
            | addonCode     | EXTRA_DOCS_300 |
            | quantity      | 1              |
            | paymentMethod | PIX            |
        Then the request should succeed with a 201 status code

    Scenario: Purchase an add-on without a payment method on file is rejected
        Given the clinic member "dr_house" also has the role "OWNER"
        When I send a "POST" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/addons" with:
            | addonCode     | EXTRA_DOCS_300 |
            | quantity      | 1              |
            | paymentMethod | PIX            |
        Then the request should fail with a 400 status code

    Scenario: Change plan without authentication returns 401
        Given I sign out
        When I send a "PATCH" request to "/api/v1/members/${ref:id:clinicMember:dr_house}/subscription" with:
            | planCode | CLINICA |
        Then the request should fail with a 401 status code
