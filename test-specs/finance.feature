Feature: Financial accounting semantics

  Scenario: Credit card invoice does not double count spending
    Given a credit card purchase of 100.00 classified as EXPENSE
    And a bank transaction of 100.00 classified as CARD_PAYMENT
    When monthly spending is calculated
    Then monthly spending is 100.00

  Scenario: Own transfer does not become income
    Given an outgoing owned-account transfer of 1000.00
    And a matching incoming owned-account transfer of 1000.00
    When monthly income and spending are calculated
    Then income is 0.00
    And spending is 0.00

  Scenario: Investment contribution is not lifestyle spending
    Given a bank outflow of 500.00 classified as INVESTMENT
    When monthly spending is calculated
    Then spending is 0.00
    And invested capital is 500.00

  Scenario: Free money can be negative
    Given cash is 1000.00
    And card liability is 600.00
    And expected remaining expenses are 300.00
    And reserve floor is 300.00
    When free money is calculated
    Then free money is -200.00
