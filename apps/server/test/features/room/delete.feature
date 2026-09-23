Feature: Room deletion (DELETE)
    As a clinic owner I want to delete rooms
    so that they stop being offered for scheduling, while past appointments keep their room reference.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with professional "${ref:id:professional:dr_house}"
        And the clinic member "dr_house" also has the role "OWNER"

    Scenario: A deleted room is soft deleted and hidden from every read
        When I send a "POST" request to "/api/v1/rooms" with:
            | name | Sala 1 |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "room" id for "to_delete"
        When I send a "DELETE" request to "/api/v1/rooms/${ref:id:room:to_delete}"
        Then the request should succeed with a 204 status code
        And the room "to_delete" should be soft deleted
        When I send a "GET" request to "/api/v1/rooms"
        Then the request should succeed with a 200 status code
        And the response should match:
            """JSON
            []
            """
        When I send a "DELETE" request to "/api/v1/rooms/${ref:id:room:to_delete}"
        Then the request should fail with a 404 status code

    Scenario: Delete room without authentication
        Given I sign out
        When I send a "DELETE" request to "/api/v1/rooms/01900000-0000-7000-8000-000000000000"
        Then the request should fail with a 401 status code
