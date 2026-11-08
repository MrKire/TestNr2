import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor'

Given('I open the todo app', () => {
  cy.visit('https://example.cypress.io/todo')
})

Given('I visit the todo app', () => {
  cy.visit('https://example.cypress.io/todo')
})

Given('I mark {string} as completed', (item) => {
  cy.contains(item)
    .parent()
    .find('input[type=checkbox]')
    .check()
})

When('I add a todo item {string}', (item) => {
  cy.get('[data-test=new-todo]').type(`${item}{enter}`)
})

When('I filter todo items by {string}', (filter) => {
  cy.contains(filter).click()
})

When('I clear completed todo items', () => {
  cy.contains('Clear completed').click()
})

Then('I should see {int} todo items', (count) => {
  cy.get('.todo-list li').should('have.length', count)
})

Then('I should see {int} todo item', (count) => {
  cy.get('.todo-list li').should('have.length', count)
})

Then('I should see {int} todo item {string}', (count, item) => {
  cy.get('.todo-list li')
    .should('have.length', count)
    .first()
    .should('have.text', item)
})

Then('the first todo item should be {string}', (item) => {
  cy.get('.todo-list li').first().should('have.text', item)
})

Then('the last todo item should be {string}', (item) => {
  cy.get('.todo-list li').last().should('have.text', item)
})

Then('{string} should be marked as completed', (item) => {
  cy.contains(item).parents('li').should('have.class', 'completed')
})

Then('I should not see the todo item {string}', (item) => {
  cy.contains(item).should('not.exist')
})

Then('the clear completed button should not be visible', () => {
  cy.contains('Clear completed').should('not.exist')
})
