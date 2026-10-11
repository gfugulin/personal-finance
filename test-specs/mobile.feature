Feature: Mobile-first experience

  Scenario: Primary navigation fits mobile
    Given a 360 by 800 viewport
    When the authenticated app loads
    Then the four primary tabs are visible
    And no horizontal page scrolling is required

  Scenario: Today is the default screen
    Given an authenticated owner
    When the app root opens
    Then Hoje is shown

  Scenario: Transaction review is touch-friendly
    Given a transaction requiring review
    When the owner taps it
    Then classification controls open without navigating to a desktop-only table
