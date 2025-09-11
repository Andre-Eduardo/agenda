Feature: Create reservation
    As a user, I want to create a reservation so that a room can be reserved for a customer.

    Background:
        Given a company with name "Ecxus" exists
        And the following employees with system access in the company "Ecxus" exist:
            | User     | Permissions          |
            | john_doe | [reservation:create] |
            | anaa123  | []                   |
        And the following customers exist in the company "Ecxus":
            | Name | Document ID    |
            | Jane | 100.000.000-02 |
        And a room category with name "Lush" in the company "Ecxus" exists
        And the following rooms exist in the company "Ecxus" and room category "Lush":
            | Number |
            | 123    |
        And the following payment methods exist in the company 'Ecxus':
            | Name |
            | Cash |

    Scenario: Preventing unauthorized users from creating a reservation
        Given I am signed in as "anaa123" in the company "Ecxus"
        When I send a "POST" request to "/reservation" with:
            | roomId    | ${ref:id:room:Ecxus:123}                                                |
            | checkIn   | 2024-01-02T19:30:00Z                                                    |
            | bookedFor | ${ref:id:customer:Ecxus:10000000002}                                    |
            | deposits  | [{amount: 55.5, paymentMethodId: "${ref:id:paymentMethod:Ecxus:Cash}"}] |
        Then I should receive an access denied error with reason INSUFFICIENT_PERMISSIONS

    Scenario Outline: Creating a reservation
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/reservation" with:
            | roomId         | <Room>                                                                  |
            | roomCategoryId | <Room category>                                                         |
            | checkIn        | 2024-01-02T19:30:00Z                                                    |
            | bookedFor      | ${ref:id:customer:Ecxus:10000000002}                                    |
            | deposits       | [{amount: 55.5, paymentMethodId: "${ref:id:paymentMethod:Ecxus:Cash}"}] |
        Then the request should succeed with a 201 status code
        And the response should match:
            """YAML
            {
                "id": _.isEntityId,
                "companyId": "${ref:id:company:Ecxus}",
                "roomId": <Room>,
                "roomCategoryId": <Room category>,
                "checkIn": "2024-01-02T19:30:00.000Z",
                "bookedBy": "${ref:id:user:john_doe}",
                "bookedFor": "${ref:id:customer:Ecxus:10000000002}",
                "canceledAt": null,
                "canceledBy": null,
                "canceledReason": null,
                "noShow": false,
                "note": null,
                "createdAt": "2024-01-01T01:00:00.000Z",
                "updatedAt": "2024-01-01T01:00:00.000Z",
            }
            """
        And the following events in the company "Ecxus" should be recorded:
            | Type                | Timestamp              | User ID                   |
            | RESERVATION_CREATED | "2024-01-01T01:00:00Z" | "${ref:id:user:john_doe}" |
        And should exist reservations in the company "Ecxus" with the following data:
            | Room ID | Room category ID | Check-in             | Created At           | Updated At           |
            | <Room>  | <Room category>  | 2024-01-02T19:30:00Z | 2024-01-01T01:00:00Z | 2024-01-01T01:00:00Z |
        And should exist transactions in the company "Ecxus" with the following data:
            | Responsible ID          | Amount |
            | ${ref:id:user:john_doe} | 55.5   |

        Examples:
            | Room                       | Room category                       |
            | "${ref:id:room:Ecxus:123}" | null                                |
            | null                       | "${ref:id:roomCategory:Ecxus:Lush}" |

    Scenario Outline: Choosing an invalid check-in date
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/reservation" with:
            | roomId  | ${ref:id:room:Ecxus:123} |
            | checkIn | <Check-in>               |
        Then I should receive an invalid input error on "checkIn" with reason "<Reason>"

        Examples:
            | Check-in                 | Reason                                                  |
            | 2024-01-01T00:00:59.000Z | Check-in date can not be earlier than the current date. |
            | 188888888888             | Expected string, received number                        |
            | true                     | Expected string, received boolean                       |

    Scenario Outline: Choosing an invalid customer ID
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/reservation" with:
            | roomId    | ${ref:id:room:Ecxus:123} |
            | bookedFor | <Customer ID>            |
        Then I should receive an invalid input error on "bookedFor" with reason "<Reason>"

        Examples:
            | Customer ID       | Reason                                    |
            | ""                | Malformed ID. Expected a valid entity ID. |
            | "188.888.888.888" | Malformed ID. Expected a valid entity ID. |
            | 188888888888      | Expected string, received number          |
            | true              | Expected string, received boolean         |

    Scenario Outline: Choosing an invalid room ID
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/reservation" with:
            | roomId | <Room ID> |
        Then I should receive an invalid input error on "roomId" with reason "<Reason>"

        Examples:
            | Room ID           | Reason                                    |
            | ""                | Malformed ID. Expected a valid entity ID. |
            | "188.888.888.888" | Malformed ID. Expected a valid entity ID. |
            | 188888888888      | Expected string, received number          |
            | true              | Expected string, received boolean         |

    Scenario Outline: Choosing an invalid deposit
        Given I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/reservation" with:
            | deposits | [<Deposit>] |
        Then I should receive an invalid input error on "deposits.0.<Field>" with reason "<Reason>"

        Examples:
            | Deposit                 | Field           | Reason                                    |
            | {amount: ""}            | amount          | Expected number, received string          |
            | {amount: true}          | amount          | Expected number, received boolean         |
            | {amount: -1}            | amount          | Number must be greater than 0             |
            | {amount: 0}             | amount          | Number must be greater than 0             |
            | {paymentMethodId: ""}   | paymentMethodId | Malformed ID. Expected a valid entity ID. |
            | {paymentMethodId: 123}  | paymentMethodId | Expected string, received number          |
            | {paymentMethodId: true} | paymentMethodId | Expected string, received boolean         |

    Scenario: Trying to create a reservation without specifying a room or category
        Given the current date and time is "2024-01-01T01:00:00Z"
        And I am signed in as "john_doe" in the company "Ecxus"
        When I send a "POST" request to "/reservation" with:
            | checkIn   | 2024-01-02T19:30:00Z                 |
            | bookedFor | ${ref:id:customer:Ecxus:10000000002} |
        Then I should receive an invalid input error with message "Either room or room category must be provided."
