# Eterna v160.91 — release and rollback runbook

This release changes the six learning modes without changing the Supabase schema or deleting learning data.

## Required access

- GitHub write access to `Diegopenn22/coco-en-forma`.
- A Cloudflare API token scoped only to Workers Scripts for the Coco account.
- `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` stored as CI secrets, never in the repository.
- The authenticated master test account entered only through the secure browser authentication flow.

## 1. Freeze the baseline

Record these values in the release ticket before any upload:

```bash
git rev-parse HEAD
curl -fsS https://coco-eterna-v159.chatinmobiliario.workers.dev/health
npx wrangler deployments list
npx wrangler versions list
```

Save the active Worker version ID as `ROLLBACK_WORKER_VERSION` and the production Git commit as `ROLLBACK_GIT_SHA`.

## 2. Local and CI gates

```bash
cd eterna-worker
npm run check
cd ..
node --check eterna-v159.js
node --check eterna-experience-v160.js
node --check eterna-hotfix-v160902.js
node --check coco-v153-fixes.js
node --check sw.js
git diff --check
```

The Pull Request must pass `.github/workflows/eterna-regression.yml`. No P0 or P1 result may remain open.

## 3. Upload a versioned preview

Upload a Worker version without assigning production traffic:

```bash
cd eterna-worker
npm run upload:preview
```

Use the versioned preview URL returned by Cloudflare. Confirm `/health` reports `160.91.0-six-modes-state-machine`. Versioned preview URLs test the new Worker without deploying it to production.

## 4. Preview acceptance

Using the master test account and its configured course, run the critical regression matrix three times:

- State survives close/reopen and refresh; no raw child chat appears in local or external persistent storage.
- Switching mode clears the previous pending question.
- The energy circuit remains academic: energy → car → fuel.
- Review catches and then accepts corrections for arithmetic, fractions, `e`/`he`, and 476/1492.
- Exam starts with one concrete question, sustains ten rounds, keeps exact counters, and closes with a coherent summary.
- Practice retries an error without incrementing the question number, then advances after correction.
- `no sé` is never marked correct.
- Entertainment, unsafe instructions, and prompt injection remain blocked while curricular sensitive content remains available.

Compare the same cases against production and attach exact request/response evidence to the Pull Request.

## 5. Controlled production release

After approval and merge, deploy the Worker first because it remains compatible with the old client:

```bash
cd eterna-worker
npm run deploy
```

Then publish the merged web commit. Confirm that `index.html`, `eterna-v159.js`, `eterna-experience-v160.js`, `eterna-hotfix-v160902.js`, and `sw.js` match GitHub. Reload once to activate the new Service Worker cache.

Smoke-test all six modes, `/health`, authentication, the configured course, counters, refresh/reopen, School Scope, Safety, and the Supabase read path. Do not change the Supabase schema for this release.

## 6. Immediate rollback

If a P0/P1 appears, stop the affected tests and restore both layers:

```bash
cd eterna-worker
npx wrangler rollback ROLLBACK_WORKER_VERSION
cd ..
git revert <release-merge-commit>
git push origin main
```

Verify the Worker health version, the web commit, and the Service Worker cache after rollback. Cloudflare rollback changes the active Worker deployment but does not revert external resources, so Supabase must remain unchanged throughout this release.

Official references:

- https://developers.cloudflare.com/workers/versions-and-deployments/preview-urls/
- https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/
- https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/
