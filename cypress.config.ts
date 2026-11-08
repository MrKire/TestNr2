import { defineConfig } from "cypress";
// @ts-ignore -- this package may not provide TypeScript declarations.
import createBundler from "@bahmutov/cypress-esbuild-preprocessor";
import {
  addCucumberPreprocessorPlugin,
  afterRunHandler,
  beforeRunHandler,
} from "@badeball/cypress-cucumber-preprocessor";
import { createEsbuildPlugin } from "@badeball/cypress-cucumber-preprocessor/esbuild";
import {
  appendCucumberStepsToJunit,
  captureJunitReports,
  getReportPaths,
} from "./cypress/report-junit-steps.js";

export default defineConfig({
  e2e: {
    specPattern: "**/*.feature",
    reporter: "mocha-junit-reporter",
    reporterOptions: {
      mochaFile: "results/test-results-[hash].xml",
      toConsole: true,
    },
    async setupNodeEvents(
      on: Cypress.PluginEvents,
      config: Cypress.PluginConfigOptions
    ): Promise<Cypress.PluginConfigOptions> {
      if (config.isTextTerminal) {
        config.expose = {
          ...config.expose,
          jsonEnabled: true,
          jsonOutput: "results/cucumber-report.json",
        };
      }

      // This is required for the preprocessor to be able to generate JSON reports after each run, and more,
      await addCucumberPreprocessorPlugin(
        on,
        config,
        config.isTextTerminal
          ? {
              omitBeforeRunHandler: true,
              omitAfterRunHandler: true,
            }
          : undefined
      );

      on(
        "file:preprocessor",
        createBundler({
          plugins: [createEsbuildPlugin(config)],
        })
      );

      if (config.isTextTerminal) {
        const { resultsDirectory, cucumberReportPath } = getReportPaths(config.projectRoot);
        let reportSnapshot = {
          runStartedAt: 0,
          reportsBeforeRun: new Set<string>(),
        };

        on("before:run", async () => {
          await beforeRunHandler(config);
          reportSnapshot = await captureJunitReports(resultsDirectory);
        });

        on("after:run", async (results) => {
          await afterRunHandler(config, results);

          await appendCucumberStepsToJunit({
            resultsDirectory,
            cucumberReportPath,
            ...reportSnapshot,
          });
        });
      }

      // Make sure to return the config object as it might have been modified by the plugin.
      return config;
    },
  },
});