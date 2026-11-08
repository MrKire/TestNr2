# Cypress Cucumber Tests

This project runs Cypress end-to-end tests written in Gherkin and produces JUnit
XML reports that include the Cucumber steps and their results.

## Requirements

- Node.js and npm
- Dependencies installed from `package-lock.json`

## Setup

Install the project dependencies:

```bash
npm install
```

The Cypress Cucumber preprocessor connects `.feature` files to their step
definitions. The esbuild preprocessor bundles those definitions for Cypress,
and `mocha-junit-reporter` writes test results as JUnit XML.

The example feature is
[`cypress/e2e/1-getting-started/todo.feature`](cypress/e2e/1-getting-started/todo.feature).
Its step definitions are in
[`cypress/e2e/1-getting-started/todo.js`](cypress/e2e/1-getting-started/todo.js).

## Running the tests

Run the tests headlessly and generate reports:

```bash
npm run cypress:headless
```

To run only the todo feature:

```bash
npm run cypress:headless -- --spec "cypress/e2e/1-getting-started/todo.feature"
```

To open the Cypress interactive runner:

```bash
npm run cypress:gui
```

Step-enriched JUnit reports are produced by the headless run.

## Reports

Headless runs write JUnit reports to `results/test-results-[hash].xml`.
Each scenario remains a JUnit test case. Its `<system-out>` element contains
the Cucumber steps and each step's status, for example:

```xml
<system-out>Cucumber steps:
Given I open the todo app [passed]
Then I should see 2 todo items [passed]</system-out>
```

The Cucumber preprocessor temporarily writes
`results/cucumber-report.json`. After the run, the report integration matches
its scenarios to the JUnit test cases, adds the steps, and removes the
temporary JSON file. The XML report keeps the scenario's pass/fail result;
step details are additional output.

## Todo scenarios

The diagram below summarizes the six scenarios in the
[`todo.feature`](cypress/e2e/1-getting-started/todo.feature) file. Each scenario
starts with a fresh visit to the todo app.

```mermaid
flowchart TD
    A([Start scenario]) --> B[Open todo app]
    B --> C{Scenario}

    C -->|Display defaults| D[Check there are 2 todos]
    D --> D1[Check first: Pay electric bill]
    D1 --> D2[Check last: Walk the dog]

    C -->|Add todo| E[Add Feed the cat]
    E --> E1[Check there are 3 todos]
    E1 --> E2[Check Feed the cat is last]

    C -->|Complete todo| F[Complete Pay electric bill]
    F --> F1[Check it is marked completed]

    C -->|Filter todos| G[Complete Pay electric bill]
    G --> H{Choose filter}
    H -->|Active| I[Show Walk the dog; hide Pay electric bill]
    H -->|Completed| J[Show Pay electric bill; hide Walk the dog]

    C -->|Clear completed| K[Complete Pay electric bill]
    K --> L[Clear completed todos]
    L --> L1[Check one todo remains]
    L1 --> L2[Check Pay electric bill is gone]
    L2 --> L3[Check clear button is hidden]

    D2 --> M([Scenario passes])
    E2 --> M
    F1 --> M
    I --> M
    J --> M
    L3 --> M
```

## How report generation works

```mermaid
flowchart TD
    A["Run Cypress headlessly"] --> B["Run Gherkin feature and step definitions"]
    B --> C["Cucumber preprocessor records scenario and step results"]
    B --> D["mocha-junit-reporter writes JUnit XML"]
    C --> E["Write temporary Cucumber JSON report"]
    D --> F["Match feature URI and scenario to JUnit test case"]
    E --> F
    F --> G["Add step names and statuses to system-out"]
    G --> H["Save enriched XML in results/"]
    H --> I["Remove temporary Cucumber JSON"]
```

The report handling is configured in
[`cypress.config.ts`](cypress.config.ts) and implemented in
[`cypress/report-junit-steps.js`](cypress/report-junit-steps.js).
