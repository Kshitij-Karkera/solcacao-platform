# SolCacao front-end testing

How to run the automated and browser tests for the front end (Students 1–5). The shared storage utility and regression tests were added by Student 2; the tests exercise all five subsystems.

## Run

Use Node.js 22.12 or newer (tested with Node 24 on Windows).

```powershell
npm install --legacy-peer-deps
npm run dev -- --host 127.0.0.1 --port 5174
```

Open http://127.0.0.1:5174. The app uses browser-local mock data. Demo sign-in does not verify credentials. Do not use a real password. Contact, newsletter, quote upload and checkout do not contact a backend or payment provider. WhatsApp destinations are placeholders.

## Automated checks

```powershell
npm test
npx tsc --noEmit
npm run lint
npm run build
```

Expected: 25 tests pass (4 test files), TypeScript passes, lint exits successfully with 13 fast-refresh warnings, production build passes. Warnings do not indicate a failed check. The hosted version runs on Render.

## Browser journeys

Keep the dev server running on port 5174. The browser script uses a fresh isolated profile and demo data. It never submits messages to real recipients or opens WhatsApp.

```powershell
npm install --no-save --package-lock=false playwright
node tests/browser-test.cjs
```

Microsoft Edge must be installed. To select installed Chrome, set `$env:BROWSER_CHANNEL = 'chrome'`. Set `$env:BASE_URL` to test another locally running instance. Results and screenshots are written under `test-results/`, or `$env:TEST_OUTPUT_DIR` if set. Only Edge was exercised for the supplied results.

The checks cover desktop (1440 × 1000) and mobile (390 × 844) routes, navigation, localization persistence, catalog search/sorting, product cart, registration, quote wizard, contact validation, sampler localization, browser storage recovery and uncaught browser exceptions. This is representative frontend coverage, not an exhaustive accessibility, security or cross-browser audit.

## Cross-browser, tablet and keyboard checks

`tests/cross-browser-test.cjs` runs the same routes in Chromium, Firefox and WebKit (Safari's engine) at phone (390 × 844), tablet (820 × 1180) and desktop (1440 × 1000) sizes. It checks that each page loads with one main landmark, has no horizontal overflow and raises no uncaught errors, and that the EN/ES switch works and persists. At desktop size it also tabs through every route: the first Tab must reach the skip link, the skip link must move focus into the main content, 40 further Tab presses must not trap focus, every focused element must show a focus style, and the cart drawer must open from the keyboard and close with Escape.

```powershell
npm install --no-save --package-lock=false playwright
npx playwright install chromium firefox webkit
node tests/cross-browser-test.cjs
```

Set `$env:BROWSERS = 'firefox'` to run one browser. A browser that is not installed is reported as SKIPPED, not passed. Results are written to `test-results/cross-browser-results.json`.

Run so far: Chromium only (35 checks passed, 0 failed). Firefox and WebKit have to be run on a machine where they can be installed. This is keyboard and layout coverage, not a full accessibility audit.
