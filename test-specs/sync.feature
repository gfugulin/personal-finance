Feature: Pluggy synchronization

  Scenario: Duplicate webhook is idempotent
    Given webhook event event-123 was processed
    When event event-123 is delivered again
    Then no financial record is duplicated

  Scenario: Duplicate provider transaction is idempotent
    Given external transaction tx-1 exists for account acc-1
    When tx-1 is received again with updated description
    Then exactly one local transaction exists
    And its description is updated

  Scenario: Provider outage keeps last valid data
    Given the last successful balance is 5000.00
    When the next synchronization fails
    Then the displayed last valid balance remains 5000.00
    And the connection is marked as stale or attention-required
