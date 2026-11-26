# Found offline test gates and measured baseline

References: [Found #4](https://github.com/favorchurch/found.favor.church/issues/4) and the exact-parity/sanitized-environment rules in [Connect Portal #338](https://github.com/favorchurch/connect.favor.church/issues/338).

## Commands and coverage

Requires Node.js 22.16+ for built-in TypeScript stripping and the VM-module test harness. No installed Jest/Vitest dependency, live service, authentication session, or `.env` file is necessary.

```bash
pnpm run test:unit
pnpm run test:full
# Or, with no dependency installation:
node scripts/run-tests.mjs unit
node scripts/run-tests.mjs full
```

| Tier | Discovery | Service boundary |
| --- | --- | --- |
| `test:unit` | Root `tests/*.{test,spec}.*` and recursively `tests/unit/`. Currently the original three pure-function suites, the Auth0/Rock admin guard (`requireAdmin`), admin server action gating, and proxy/signout/login-link logic. | All services are replaced with explicit stubs; offline only |
| `test:full` | All `*.test.*` / `*.spec.*` under `tests/` and `src/`, including future offline integration/performance tests. | Offline only, explicitly excludes first-level `live/` and `e2e/` directories |
| Live integration | No such suite exists. Future tests belong under `tests/live/`, in a separate credential-gated command and CI job. | Never part of either default gate |
| Browser E2E | No such suite exists. Future tests belong under `tests/e2e/`, with an explicit credential gate. | Never part of either default gate |

The runner prints the discovered file manifest. An unknown tier or empty discovery exits with code 2; test failures propagate as nonzero exits and remain visible in TAP output. The runner intentionally has **no worker cap**, changed-test shortcut, transform migration, warning suppression, failure masking, or snapshot update option. `test:full` means the complete **offline** gate; future live-service and browser tests are not silently part of it. If JSX/TSX tests are introduced, verify transform support and exact discovery parity before changing this Node-native runner.

The child runner receives only `PATH`, `HOME`, `NODE_ENV=test`, and `LANG=C`, rather than ambient application configuration. The auth and admin tests use Node VM modules to evaluate the **real TypeScript source** against only explicit in-memory Next, Auth0, Rock and Supabase stubs. Unexpected imports fail the test. They do not use real authentication, network clients, or a database. They are route-logic tests, not an end-to-end Next.js deployment test.

## Measured baseline

Setup: local isolated execution container; Node `v22.16.0`, GNU `/usr/bin/time -v`, four available logical CPUs, default Node test concurrency, and a freshly started Node process for each run. No pnpm install or .env file was used. The original measurements used all three existing test files and their imported pure source files copied from `main`. Expanded runs used those same original files, the actual auth/proxy source copied from `main`, plus the proposed new tests and runner.

Reproduce the original `main` suite with a minimal environment:

```bash
NODE_BIN="$(command -v node)"
env -i PATH="$(dirname "$NODE_BIN"):/usr/bin:/bin" HOME=/tmp NODE_ENV=test LC_ALL=C \
  /usr/bin/time -v "$NODE_BIN" --experimental-strip-types --test tests/*.test.mts
# Repeat immediately for the warm-process sample.
```

Reproduce the expanded branch:

```bash
NODE_BIN="$(command -v node)"
env -i PATH="$(dirname "$NODE_BIN"):/usr/bin:/bin" HOME=/tmp NODE_ENV=test LC_ALL=C \
  /usr/bin/time -v "$NODE_BIN" scripts/run-tests.mjs unit
# Repeat immediately for warm; then repeat both with "full" instead of "unit".
```

| Tier | Test files | Cases (pass/fail/skip) | First wall | Repeat wall | First user/system CPU | Repeat user/system CPU | First/repeat maximum RSS |
| --- | ---: | --- | ---: | ---: | --- | --- | --- |
| Before: original `main` | 3 | 12 (12/0/0) | 0.35 s | 0.21 s | 0.56 / 0.45 s | 0.45 / 0.13 s | 61,808 / 61,800 KiB |
| After (PR #6 head): `test:unit` | 5 | 28 (28/0/0) | 0.57 s | 0.47 s | 1.01 / 0.62 s | 0.94 / 0.29 s | 84,888 / 84,756 KiB |
| After (PR #6 head): `test:full` | 5 | 28 (28/0/0) | 0.45 s | 0.46 s | 0.90 / 0.34 s | 0.93 / 0.30 s | 82,452 / 82,460 KiB |

There are **0 snapshots, 0 skipped cases, and 0 existing failures** in both states. All original 3 files and 12 tests remain present, unchanged, and passing. The measured runs above had 16 new cases (28 total). Review then added 4 auth edge cases (empty `code`, development forwarded host, origin fallback, callback-path proxy), so the suite now has 20 new cases and 32 total in both `test:unit` and `test:full`; timings were not re-measured for those 4 cases. The increase in work is additional coverage, not an optimization comparison.

**Measurement caveats:** "First" means the first Node process in a measured pair, with the same command repeated immediately for "repeat"; the OS filesystem page cache was **not** cleared. This is process-cold vs. repeat, not guaranteed disk-cache-cold. GNU time's maximum RSS is the **largest measured process**, not aggregate parallel-worker RSS; CPU includes child processes. No Jest cache is involved and no worker cap is set. This is a test-runner baseline on a reconstructed source/test subset, not a measured full Next.js application build.

The tier selection was also exercised with temporary, uncommitted test fixtures: a new `tests/integration/*.test.mts` case appeared in `test:full` (29 cases at measurement time) but not `test:unit` (28); an intentionally failing `tests/live/*.test.mts` case ran in neither gate. The fixtures were removed.

## Next review gates

1. Review and merge this test-only baseline independently. Do not treat the mocked auth tests as proof of live authentication or RLS.
2. Defer worker caps, test tiers beyond the two default offline gates, transform changes, and resource optimization until repeatable measurement justifies them.
3. For any future tuning, use Connect Portal #338's **exact discovery, test-count, skip, snapshot, and failure-state parity**, with cold/warm wall time, user/system CPU, max RSS, cache state, and concurrency settings recorded in the same sanitized environment.
4. The Supabase-auth risks listed in the earlier baseline (proxy pass-through when Supabase configuration is unavailable) no longer apply: the proxy is the Auth0 middleware and admin access is enforced server-side by `requireAdmin`. The development-only mock admin remains and is limited to `NODE_ENV === 'development'` outside Vercel.

## Auth0 migration update

The Supabase Auth callback, signout and proxy cases and the `@favor.church` email-domain cases were replaced by tests for the Auth0 flow: `tests/adminGuard.test.mts` (14 cases: verified staff allowed; unverified email, missing/malformed `rock_person_id`, non-member, Rock errors, missing Rock env and no session refused; development mock limited to `next dev` outside Vercel), `tests/adminActions.test.mts` (6 cases: every admin server action refuses a non-staff or anonymous session before a Supabase client is created; audit columns carry the verified email) and `tests/authRoutes.test.mts` (8 cases, including the `AUTH0_AUDIENCE` override and default). `test:unit` and `test:full` now run 40 cases with the original 12 unchanged. The case counts and timing tables above describe the earlier Supabase-auth baseline (PR #6 head) and were not re-measured.
