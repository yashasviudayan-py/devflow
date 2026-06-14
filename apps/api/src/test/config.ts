// Connection string used by the integration test suite. Tests run real SQL
// against a migrated schema, so they need a reachable Postgres.
//
// - In CI, `TEST_DATABASE_URL` points at a dedicated Postgres service.
// - Locally it defaults to the `test` schema of the docker-compose `devflow`
//   database, which keeps test data fully isolated from dev data in `public`
//   (the reset between tests only ever truncates the `test` schema).
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://devflow_user:devflow_password@localhost:5432/devflow?schema=test";
