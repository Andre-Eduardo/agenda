Feature: File upload (POST /upload/prepare and /upload/local)
    As an authenticated user I want to upload files
    so that they can be associated with clinical documents and imported documents.

    Background:
        Given the following users exist:
            | Name      | Username | Email               | Password  |
            | Dr. House | dr_house | house@example.com   | H0use.Dr! |
        And I am signed in as "dr_house"
        And a professional "dr_house" exists with specialty "MEDICINA"
        And I am signed in as "dr_house" with clinic member "${ref:id:clinicMember:dr_house}"

    Scenario: Prepare upload returns a fileId
        When I send a "POST" request to "/api/v1/upload/prepare" with:
            | filename | report.pdf      |
            | mimeType | application/pdf |
            | size     | 102400          |
        Then the request should succeed with a 201 status code
        And I save the response field "id" as "upload_file" id for "prepared"

    Scenario: Prepare upload without filename returns 400
        When I send a "POST" request to "/api/v1/upload/prepare" with:
            | mimeType | application/pdf |
            | size     | 102400          |
        Then the request should fail with a 400 status code

    Scenario: Prepare upload without mimeType returns 400
        When I send a "POST" request to "/api/v1/upload/prepare" with:
            | filename | report.pdf |
            | size     | 102400     |
        Then the request should fail with a 400 status code

    Scenario: Prepare upload without authentication returns 401
        Given I sign out
        When I send a "POST" request to "/api/v1/upload/prepare" with:
            | filename | report.pdf      |
            | mimeType | application/pdf |
            | size     | 1024            |
        Then the request should fail with a 401 status code
