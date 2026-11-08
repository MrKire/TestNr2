Feature: Todo list
  As a user
  I want to manage todo items
  So that I can keep track of my tasks

  Background:
    Given I open the todo app

  Scenario: Display the default todo items
    Then I should see 2 todo items
    Then the first todo item should be "Pay electric bill"
    Then the last todo item should be "Walk the dog"

  Scenario: Add a todo item
    When I add a todo item "Feed the cat"
    Then I should see 3 todo items
    And the last todo item should be "Feed the cat"

  Scenario: Complete a todo item
    When I mark "Pay electric bill" as completed
    Then "Pay electric bill" should be marked as completed

  Scenario Outline: Filter completed and active todo items
    Given I mark "Pay electric bill" as completed
    When I filter todo items by "<filter>"
    Then I should see 1 todo item "<visible item>"
    And I should not see the todo item "<hidden item>"

    Examples:
      | filter    | visible item      | hidden item       |
      | Active    | Walk the dog      | Pay electric bill |
      | Completed | Pay electric bill | Walk the dog      |

  Scenario: Delete all completed todo items
    Given I mark "Pay electric bill" as completed
    When I clear completed todo items
    Then I should see 1 todo item
    And I should not see the todo item "Pay electric bill"
    And the clear completed button should not be visible
