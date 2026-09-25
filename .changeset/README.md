# Changesets

User-facing pull requests add a changeset (D-228). Run `pnpm changeset`, pick the bump type and write
one line for the changelog, in the user's words. Internal work (tests, tooling, docs) needs no changeset.

At release time `pnpm changeset version` bumps `package.json` (which WXT copies into the manifest) and
writes `CHANGELOG.md`. See [docs/repo-setup.md](../docs/repo-setup.md#6-tracking-and-workflow).
