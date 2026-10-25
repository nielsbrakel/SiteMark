# SiteMark — Releasing

How a release goes from `main` to the Chrome, Edge and Firefox stores, and what to do when something goes wrong.
How the pipeline works and which secrets it needs: [repo-setup.md §7](repo-setup.md#7-store-publishing-m8-d-227).

## Before the tag

1. `main` is green (`ci-ok`) on the commit you want to ship. The release guard refuses a commit whose `ci-ok` has not passed.
2. `package.json` `version` is the version you are about to tag (`1.2.0` for tag `v1.2.0`). The guard refuses any other tag.
3. `CHANGELOG.md` has a section for that version, in the user's words, and "Unreleased" is empty.
4. Firefox smoke test of the release build ([testing.md](testing.md#manual-smoke-checklist)): `pnpm build:firefox`, load it in `about:debugging`.
5. The store credentials have not expired (see [Renewing store credentials](repo-setup.md#renewing-store-credentials)). The Nightly run opens an issue 30 days before the Edge key expires.

## Cut the release

1. Push the protected tag on that `main` commit: `git tag vX.Y.Z && git push origin vX.Y.Z`. Only the owner can push `v*` tags.
2. `release.yml` builds the zips, attests them and waits in the `store` environment: **approve the deployment**.
3. The **submit-safari** job (macOS) uploads the build to App Store Connect. When processing is done (about 15 minutes), attach the build to the version there and press _Submit for Review_.
4. Each store has its own job: **submit (chrome)**, **submit (firefox)**, **submit (edge)** and **submit-safari**. A failing job does not stop the others. If one fails, fix its cause (usually its secret) and use _Re-run failed jobs_: only the failed store uploads again. To skip a store for a release, set its repository variable (`CHROME_SUBMIT`, `FIREFOX_SUBMIT`, `EDGE_SUBMIT` or `SAFARI_SUBMIT`) to `false`; delete it afterwards.
5. The **release** job attaches the zips and `SHA256SUMS` to a GitHub Release. Paste the release name and description below into it.

### Release name and description

```text
Name:  vX.Y.Z — <two or three words about the main change>

- <what a user will notice, in their words>
- <second user-facing change>
- <third, if any>
- Fixes: <one line, or leave out>
```

Example: **v1.1.0 — Kraft & Coral**: a new scrapbook look, a "Midnight Plum" dark theme, and an install button that suggests the store for your browser.

## After the upload

The stores review a version before it goes live. Check each dashboard, and record what you see in the release's GitHub Release notes or in `docs/tasks.md`:

| Store            | Where to look                                                        | Typical wait                        |
| ---------------- | -------------------------------------------------------------------- | ----------------------------------- |
| Chrome Web Store | Developer Dashboard → SiteMark → Status                              | hours to days                       |
| Edge Add-ons     | Partner Center → Microsoft Edge → SiteMark → Status                  | days                                |
| Firefox Add-ons  | addons.mozilla.org Developer Hub → SiteMark → Manage Status/Versions | minutes to days (source is checked) |

When all three show the new version, check that the website's install links still open the listings.

## When something goes wrong

**A bad version is live.** Stores only accept a higher version number, so there is no true rollback. Do both:

1. **Stop the spread.** In the dashboard of each store, unpublish the version or the whole listing for a moment (Chrome: _Unpublish_; Edge: _Unpublish_; Firefox: disable the version under _Manage Status & Versions_). The dashboards rename these now and then, so look for the wording on the page.
2. **Ship a fix.** Revert or fix on `main`, bump the patch version (`X.Y.Z+1`), add a `CHANGELOG.md` line and release as above. Every earlier zip is still in its GitHub Release, with `SHA256SUMS`, if you need to compare what shipped.

**The upload step failed for one store.** Read the step's log. An auth error means an expired or revoked credential: renew it, update the secret in the `store` environment and re-run the failed job. A store that says it already has this version needs nothing.

**The version was rejected in review.** The store's email and dashboard say why. Fix it, bump the patch version and release again; do not re-tag the same version.

**A security problem.** Follow [SECURITY.md](../SECURITY.md): fix privately, release the patch first, and describe it in the advisory once the stores have it.
