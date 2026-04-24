Feature: User retrieval (GET)
    As an authenticated user I want to fetch my profile or another user by ID
    so that I can view account information.

    Background:
        Given the following users exist:
            | Name     | Username | Email                  | Password  |
            | John Doe | john_doe | john@example.com       | J0hn.Do3! |

    Scenario: Get current user when authenticated
        Given I am signed in as "john_doe"
        When I send a "GET" request to "/api/v1/user/me"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | username | john_doe_${ref:var:contextId} |

    Scenario: Get current user when unauthenticated
        When I send a "GET" request to "/api/v1/user/me"
        Then the request should fail with a 401 status code

    Scenario: Get user by ID
        Given I am signed in as "john_doe"
        When I send a "GET" request to "/api/v1/user/${ref:id:user:john_doe}"
        Then the request should succeed with a 200 status code
        And the response should contain:
            | id       | ${ref:id:user:john_doe}           |
            | username | john_doe_${ref:var:contextId}     |

    Scenario: Get user by unknown ID
        Given I am signed in as "john_doe"
        When I send a "GET" request to "/api/v1/user/01900000-0000-7000-8000-000000000000"
        Then the request should fail with a 404 status code
