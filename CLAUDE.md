# AWS-Cloud-Resume

Emre Çancıoğlu's personal site: a resume/portfolio homepage plus an admin panel for manually tracking a TEFAS (Turkish mutual fund) portfolio. Hosted on AWS, deployed from this repo.

## Structure

```
apps/web/    Vite + React 19 + TypeScript + Tailwind v4 — the public site + admin panel UI
apps/api/    Lambda backend (Node 20, TypeScript, esbuild bundle) — REST-ish API behind API Gateway
infra/       Terraform — Cognito, DynamoDB, Lambda, API Gateway
```

No root-level build tooling — each app manages its own `package.json`/`node_modules`.

## apps/web (public site + admin panel)

- Public resume site: `src/sections/*`, `src/pages/Home.tsx`, English/Turkish i18n (`src/i18n/`), dark/light theme (`src/theme/`), all data hardcoded in `src/data/content.{en,tr}.ts`.
- Admin panel: lazy-loaded at `/admin/*` (see `src/pages/admin/AdminApp.tsx`) so the Cognito SDK + QR code lib never load for public visitors — only the public bundle (~435KB) loads on `/`; the admin chunk (~138KB) loads separately. Auth: `src/auth/AuthContext.tsx` wraps `amazon-cognito-identity-js` (SRP login, forced first-login password change, TOTP MFA setup via QR + verification, session persistence, silent token refresh via `getIdToken()`). `src/auth/cognitoConfig.ts` and `API_BASE_URL` are **hardcoded constants**, not env vars — same convention as the pre-existing visitor-counter Lambda URL (`src/lib/visitorCounter.ts`). These aren't secrets (public SPA client ids), so this is intentional, not a shortcut.
- **Always call the API through `getIdToken()`, never the static `idToken` field**, for anything other than a render-time display/gate check. `idToken` is a snapshot that goes stale after Cognito's 1-hour token validity window; `getIdToken()` (in `AuthContext`) transparently refreshes via the stored refresh token. `apiFetch()` (`src/auth/api.ts`) takes `getIdToken` as its first argument for this reason.
- Admin dashboard/fund management: `src/pages/admin/AdminDashboard.tsx` (add-fund form + total portfolio value card, fed by `GET /portfolio/summary`) and `FundRow.tsx` (per-fund edit/delete, price history CRUD, transaction/BUY-SELL CRUD, all inside an expandable row). Shared UI bits: `formFields.tsx` (`IconField`, `SubmitButton`, `plainInputClass`, `iconButtonClass`), `Toast.tsx` (`useToast().showToast(message, "success"|"error")`, mounted once in `AdminApp.tsx`), `format.ts` (`currencyFormatter`/`numberFormatter`, `tr-TR`/TRY).
- `vite.config.ts` has `define: { global: 'globalThis' }` — required because `amazon-cognito-identity-js` references Node's `global`, which doesn't exist in browsers. Don't remove this.
- Commands: `npm run dev`, `npm run build` (`tsc -b && vite build`), `npm run test` (Vitest), `npm run lint` (oxlint).
- Shared focus-ring styles live in `src/styles/focusRing.ts` (`focusRing`, `focusRingInset`, `focusRingOnAccent`) — use these instead of writing `focus-visible:outline-*` classes inline.
- Test coverage exists for `AuthContext` (mocks `amazon-cognito-identity-js` via `vi.hoisted` + regular `function` mocks — arrow functions can't be used as constructors, `new (() => {})()` throws), `ProtectedRoute`, `AdminLogin`, `AdminDashboard`, `FundRow` (the latter two mock `../../auth/api`'s `apiFetch` directly).

## apps/api (backend Lambda)

- Single Lambda function (`src/handler.ts`), routed by `event.routeKey` (API Gateway HTTP API v2 payload format), bundled to one file via esbuild (`npm run build` → `dist/index.mjs`, ESM, `@aws-sdk/*` marked external since the Lambda Node runtime provides them).
- Routes (all except `/health` require a Cognito JWT, `Authorization: Bearer <idToken>`):
  - `GET /health` — no auth.
  - `GET /portfolio` — list funds (raw). `GET /portfolio/summary` — funds + `netUnits`/`latestPrice`/`currentValue` per fund (nets BUY-minus-SELL transaction units × latest price) + `totalValue`. Prefer `/summary` for anything UI-facing.
  - `POST /funds`, `PUT /funds/{fundCode}`, `DELETE /funds/{fundCode}` (cascade-deletes all price/transaction rows under that fund via `BatchWriteItem`, chunked by 25).
  - `POST|GET /funds/{fundCode}/prices`, `PUT|DELETE /funds/{fundCode}/prices/{date}`.
  - `POST|GET /funds/{fundCode}/transactions`, `DELETE /funds/{fundCode}/transactions/{txnId}` (txnId is a `randomUUID()`; delete looks it up via a Query + in-memory `find`, no GSI for it — fine at personal scale).
- **No Lambda environment variables** — see "AWS account quirk" below. Config (e.g. the DynamoDB table name) is a hardcoded constant in `src/dynamo.ts`, not `process.env`.
- DynamoDB single-table design (see `infra/dynamodb.tf` header comment for the exact key schema): `pk=FUND#<code>`, `sk=METADATA|PRICE#<date>|TXN#<date>#<txnId>`, GSI1 `gsi1pk=FUND|PRICE|TXN`/`gsi1sk=<sortKey>`.
- Shared response helpers in `src/http.ts` (`jsonResponse`, `parseBody`).
- Test coverage: Vitest (`npm run test`), one file per route module, mocking `ddb.send` — cast it as `ddb.send as unknown as DdbSendMock` (from `src/test-utils.ts`), **don't use `vi.mocked(ddb.send)`** — the real `DynamoDBDocumentClient#send` overload union makes TS infer an unusable type for mock setup. `handler.test.ts` mocks each route module's exports directly to test only the routing switch.
- After changing anything under `apps/api/src`, you must `npm run build` (regenerates `dist/`) **and** `terraform apply` from `infra/` (Lambda code is deployed via Terraform's `archive_file` zipping `apps/api/dist`, not via GitHub Actions). `.github/workflows/ci-api.yml` runs typecheck/test/build on PRs and pushes touching `apps/api/**`, but never deploys.

## infra (Terraform)

- Resources: Cognito User Pool + admin user + app client (`cognito.tf`), DynamoDB table (`dynamodb.tf`), Lambda + API Gateway HTTP API + Cognito JWT authorizer + IAM roles + all routes (`lambda_api.tf`), AWS Budgets monthly cost alarm (`budget.tf`).
- **State is local** (`infra/terraform.tfstate`, gitignored) — deliberately, to keep first-time setup simple. Never delete this file; it's the only record of what's been created. See `infra/README.md` for how to migrate to an S3 backend later if needed.
- Applied via a dedicated least-privilege IAM user `terraform-personal-site` (NOT the CI/CD `githubActions` user, which is scoped only to S3 sync + CloudFront invalidation). Its policy is scoped to `emrecancioglu-personal-site-*` resources — see `infra/README.md` for the full, current JSON (kept up to date there — check it before assuming a Terraform change needs a *new* AWS resource type's permissions; it may already need updating instead). When adding new resource types, `terraform apply` fails with `AccessDenied` until the policy is extended — extend it, don't assume the Terraform code is wrong.
- Everything is designed to stay in AWS's free tier. **Never introduce a billable resource** (customer-managed KMS keys, provisioned capacity, NAT gateways, etc.) without asking first and getting explicit confirmation — this has been rejected before even at ~$1/month. (AWS Budgets itself is free for the first 2 budgets/account, which is why `budget.tf` was fine to add outright.)
- To apply: `cd apps/api && npm run build && cd ../../infra && terraform plan` (review!) `&& terraform apply`.

## Deployment

- **Frontend** (`apps/web`): auto-deploys via `.github/workflows/deploy-web.yml` on push to `main` — builds and syncs `apps/web/dist` to S3, then invalidates CloudFront (distribution ID is a GitHub Actions **Variable**, not a Secret — `vars.AWS_CLOUDFRONT_DISTRIBUTION_ID`). Uses `npm install`, not `npm ci` (see comment in the workflow file for why). Checkout has `lfs: true` (the hero video is stored in Git LFS). Note: this workflow does not run `npm run test` before deploying — only builds.
- **Backend** (`apps/api` + `infra`): manual only, via `terraform apply` from a local machine with the `terraform-personal-site` credentials. `.github/workflows/ci-api.yml` runs typecheck/test/build (no deploy, no AWS credentials) on PRs/pushes touching `apps/api/**` as a safety net, but nothing in CI touches AWS infra or the Lambda function itself.
- Only commit/push when explicitly asked — the repo owner does his own commits.

## Known gotchas (don't re-debug these)

- **AWS account quirk (761018862186, eu-north-1)**: the default Lambda-managed KMS key (`alias/aws/lambda`) fails to decrypt environment variables for this Lambda's execution role even with correct IAM + key-policy grants (confirmed reproducible, root cause never fully identified). Workaround already applied: the Lambda function has zero environment variables; any config is a hardcoded build-time constant instead. Don't reintroduce `environment { variables = {...} }` on `aws_lambda_function.api`, and don't spend time re-diagnosing this — it's a known dead end.
- **TEFAS auto-scraping is off the table.** Investigated thoroughly: no official/free API exists (SPK's public `ws.spk.gov.tr` service doesn't cover fund NAV data; Takasbank's feed is B2B-licensed only), and tefas.gov.tr runs a real bot-defense product (F5-style JS challenge), confirmed blocking requests from two different network origins. Portfolio data entry is intentionally manual, via the admin panel's "fon ekle" / "fiyat ekle" forms. Don't re-propose scraping tefas.gov.tr directly.
- The repo owner was doing Terraform/AWS CLI for the first time this project — if guiding through infra changes, give exact copy-paste commands one step at a time and confirm output before proceeding, don't assume CLI/terminal familiarity.

## Status as of 2026-07-06

Faz 0 (static → Vite/React migration + design modernization) and Faz 1 (i18n, animations, a11y, test coverage) are done and deployed. Faz 2 (Cognito + DynamoDB + Lambda + API Gateway) is applied and live. Faz 3 (admin panel with Cognito login/MFA + fund/price/transaction CRUD + portfolio value summary) is built, deployed to AWS (Terraform applied), and verified end-to-end against the live API — **not yet pushed to `main`**, so none of the admin UI is live on emrecancioglu.com yet (public resume site is unaffected either way, since the admin bundle is code-split). CloudFront's 403/404→`/index.html` SPA fallback is configured. An AWS Budgets cost alarm (`budget.tf`) is defined but its `terraform apply` + the `terraform-personal-site` IAM policy's `Budgets` statement may still need to be applied/added — check `terraform state list` for `aws_budgets_budget.monthly_cost` before assuming it's live. Test coverage now spans both apps (`apps/web`: 55 tests across 14 files; `apps/api`: 42 tests across 6 files, Vitest set up from scratch). Next planned phase: none decided yet beyond this point.
