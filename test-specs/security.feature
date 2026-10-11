Feature: Security baseline

  Scenario: Anonymous user cannot read transactions
    Given no authenticated session
    When transactions are queried
    Then access is denied

  Scenario: AAL1 user cannot read financial data
    Given an authenticated AAL1 session
    When transactions are queried
    Then access is denied

  Scenario: AAL2 owner can read own financial data
    Given an authenticated AAL2 owner session
    When own transactions are queried
    Then access is allowed

  Scenario: Another user cannot read owner data
    Given user B has an AAL2 session
    When user B queries user A transactions
    Then zero user A rows are returned

  Scenario: Webhook with wrong secret is rejected
    Given a webhook request with the wrong secret
    When the webhook endpoint receives it
    Then the request is rejected
