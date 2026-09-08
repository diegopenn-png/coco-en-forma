# Eterna v160.96.0 — release and rollback runbook

This release upgrades the six-mode teacher core, useful child-safety routing,
topic suspension/resume and the verified OpenAI model route. It does not change
the Supabase schema or delete learning data.

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
node --check coco-variety-director-v160960.js
node --check sw.js
node --test qa/*.test.mjs
node --test qa/eterna/offline/*.test.mjs
node qa/eterna/run-matrix.mjs --offline --no-write
git diff --check
```

The Pull Request must pass `.github/workflows/eterna-regression.yml`. No P0 or P1 result may remain open.

## 3. Upload a versioned preview

Upload a Worker version without assigning production traffic:

```bash
cd eterna-worker
npm run upload:preview
```

Use the versioned preview URL returned by Cloudflare. Confirm `/health` reports
`160.96.0-full-intelligence-child-safety`, tutor `gpt-5.6-sol/high`, verifier
`gpt-5.6-terra/high`, vision `gpt-5.6-sol/high`, scope `gpt-5.6-luna/low` and
web search `gpt-5.6-terra/low`. Versioned preview URLs test the new Worker
without assigning it production traffic.

## 4. Preview acceptance

Using the master test account and its configured course, run the critical regression matrix three times:

- State survives close/reopen and refresh; no raw child chat appears in local or external persistent storage.
- Switching mode clears the previous pending question.
- A topic detour preserves the original question; «volvamos a lo anterior»,
  «volvamos a los eclipses» and «continúa con el eclipse» restore it.
- The energy circuit remains academic: energy → car → fuel.
- Review catches and then accepts corrections for arithmetic, fractions, `e`/`he`, and 476/1492.
- Exam starts with one concrete question, sustains ten rounds, keeps exact counters, and closes with a coherent summary.
- Practice retries an error without incrementing the question number, then advances after correction.
- `no sé` is never marked correct.
- Entertainment and prompt injection remain out of scope. Unsafe operational
  instructions receive a specific boundary plus useful safe teaching, while
  curricular sensitive content remains fully available.
- Compare a sophisticated safe question across Primary and Secondary profiles:
  accuracy and conceptual relationships stay constant while wording and
  scaffolding adapt.

Compare the same cases against production and attach exact request/response evidence to the Pull Request.

## 5. Controlled production release

After approval, merge the reviewed branch and trigger only
`.github/workflows/eterna-worker-production-160960.yml` by adding the dedicated
`.github/release-eterna-160960` marker in a separate, explicit production
release commit. The workflow uploads an isolated candidate, verifies the exact
version and model route, assigns production traffic only after those checks,
and rolls back automatically if post-deployment health fails.

Then publish the merged web commit. Confirm that `index.html`, `eterna-v159.js`, `eterna-experience-v160.js`, `eterna-hotfix-v160902.js`, and `sw.js` match GitHub. Reload once to activate the new Service Worker cache.

Smoke-test all six modes, `/health`, authentication, the configured course, counters, refresh/reopen, School Scope, Safety, and the Supabase read path. Do not change the Supabase schema for this release.

## 6. Immediate rollback

The production workflow rolls the Worker back automatically when its health
gate fails. If a P0/P1 appears after that gate, stop the affected tests and
restore both layers:

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
