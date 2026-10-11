Feature: Personal fiscal organization

  Scenario: Unknown incoming Pix is not automatically taxable
    Given an imported incoming Pix of 2000.00
    And there is no matching fiscal rule
    When fiscal classification runs
    Then fiscal treatment is REVIEW

  Scenario: Pró-labore can be classified as taxable by owner rule
    Given a verified owner rule for recurring pró-labore source
    And an incoming transaction matching that rule
    When fiscal classification runs
    Then fiscal treatment is TAXABLE_INCOME

  Scenario: Own transfer has no tax effect
    Given a transaction classified financially as TRANSFER
    When fiscal safety rules run
    Then fiscal treatment is NO_TAX_EFFECT

  Scenario: Zero estimated tax does not imply no filing obligation
    Given estimated annual tax is 0.00
    When IR summary is rendered
    Then the app does not state that filing is unnecessary
    And it tells the owner to verify official filing-obligation rules

  Scenario: Tax rules retain year
    Given a transaction from 2026
    When annual tax estimate is calculated
    Then the 2026 ruleset is used
