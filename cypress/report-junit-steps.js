const { mkdir, readdir, readFile, stat, writeFile, unlink } = require('node:fs/promises')
const path = require('node:path')

function getReportPaths(projectRoot) {
  const resultsDirectory = path.join(projectRoot, 'results')

  return {
    resultsDirectory,
    cucumberReportPath: path.join(resultsDirectory, 'cucumber-report.json'),
  }
}

async function captureJunitReports(resultsDirectory) {
  await mkdir(resultsDirectory, { recursive: true })

  return {
    runStartedAt: Date.now(),
    reportsBeforeRun: new Set(
      (await readdir(resultsDirectory)).filter((file) => file.endsWith('.xml'))
    ),
  }
}

function decodeXml(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function getAttribute(attributes, name) {
  const match = attributes.match(new RegExp(`\\b${name}="([^"]*)"`))
  return match ? decodeXml(match[1]) : undefined
}

function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/')
}

async function appendCucumberStepsToJunit({
  resultsDirectory,
  cucumberReportPath,
  runStartedAt,
  reportsBeforeRun,
}) {
  const reportFiles = (await readdir(resultsDirectory)).filter((file) => file.endsWith('.xml'))
  const currentReports = []
  for (const file of reportFiles) {
    if (!reportsBeforeRun.has(file)) {
      currentReports.push(file)
      continue
    }

    const fileStat = await stat(path.join(resultsDirectory, file))
    if (fileStat.mtimeMs >= runStartedAt) {
      currentReports.push(file)
    }
  }

  const cucumberFeatures = JSON.parse(await readFile(cucumberReportPath, 'utf8'))
  if (!Array.isArray(cucumberFeatures)) {
    throw new Error('Cucumber JSON report must contain a feature array')
  }

  let updatedReports = 0

  for (const reportFile of currentReports) {
    const reportPath = path.join(resultsDirectory, reportFile)
    const xml = await readFile(reportPath, 'utf8')
    const suiteUris = [...xml.matchAll(/<testsuite\b([^>]*)>/g)]
      .map(([, attributes]) => getAttribute(attributes, 'file'))
      .filter(Boolean)
      .map(normalizePath)
    const scenarios = cucumberFeatures
      .filter((feature) => suiteUris.includes(normalizePath(feature.uri)))
      .flatMap((feature) => feature.elements.filter((element) => element.type === 'scenario'))

    if (scenarios.length === 0) {
      if (suiteUris.length > 0) {
        throw new Error(`No Cucumber scenarios matched JUnit report "${reportFile}"`)
      }

      continue
    }

    const usedScenarios = new Set()
    let matchedTestCases = 0
    const updatedXml = xml.replace(
      /<testcase\b([^>]*)>([\s\S]*?)<\/testcase>/g,
      (testCase, attributes, body) => {
        const scenarioName = getAttribute(attributes, 'classname')
        const scenarioIndex = scenarios.findIndex((scenario, index) => {
          if (usedScenarios.has(index)) {
            return false
          }

          return scenarioName === scenario.name
            || scenarioName?.startsWith(`${scenario.name} (example #`)
        })

        if (scenarioIndex === -1) {
          throw new Error(`No Cucumber scenario matched JUnit testcase "${scenarioName}"`)
        }

        const scenario = scenarios[scenarioIndex]
        usedScenarios.add(scenarioIndex)
        matchedTestCases += 1

        if (body.includes('<system-out>')) {
          throw new Error(`JUnit testcase "${scenarioName}" already contains system-out`)
        }

        const steps = scenario.steps
          .map(({ keyword, name, result }) => `${keyword}${name} [${result?.status ?? 'unknown'}]`)
          .join('\n')
        const output = escapeXml(`Cucumber steps:\n${steps}`)

        return `<testcase${attributes}>${body}<system-out>${output}</system-out></testcase>`
      }
    )

    if (matchedTestCases > 0) {
      await writeFile(reportPath, updatedXml)
      updatedReports += 1
    }
  }

  if (updatedReports > 0) {
    await unlink(cucumberReportPath)
  }
}

module.exports = {
  appendCucumberStepsToJunit,
  captureJunitReports,
  getReportPaths,
}
