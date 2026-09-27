/** Fixture hosts (D-233). All resolve to the local fixture server. */
/** `E2E_PORT` lets parallel runs (e.g. several worktrees) each serve the fixtures on their own port. */
export const E2E_PORT = Number(process.env.E2E_PORT ?? 4173);
export const fixtureUrl = (host: 'prod' | 'test' | 'new', page = '') =>
  `http://${host}.sitemark.test:${E2E_PORT}/${page}`;

/** The e2e build pre-grants these; `new.sitemark.test` stays ungranted for not-granted states. */
export const E2E_GRANTED_ORIGINS = ['*://prod.sitemark.test/*', '*://test.sitemark.test/*'];
