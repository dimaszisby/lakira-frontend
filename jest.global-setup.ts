// Every suite runs in UTC, whatever the machine's zone. This has to happen here: Jest gives each
// test file its own copy of process.env, so assigning TZ in a setup file changes nothing, and
// suites ran in the machine's zone until #208. A test that needs another zone runs a child process
// with TZ set (src/features/data-visualizations/__tests__/viz-helpers.test.ts).
export default function globalSetup() {
  process.env.TZ = "UTC";
}
