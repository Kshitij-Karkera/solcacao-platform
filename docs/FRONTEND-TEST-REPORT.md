# SolCacao frontend testing and corrections

Test date: October 27, 2026. Scope: the frontend work assigned to Students 1–5 in the submitted prototype.

## Results

| Check                              | Result                                         |
| ---------------------------------- | ---------------------------------------------- |
| Unit/component regression tests    | **25 passed**, 4 test files                    |
| Edge browser checks                | **25 passed**                                  |
| TypeScript (`npx tsc --noEmit`)    | **Passed**, no errors                          |
| ESLint (`npm run lint`)            | **Passed**, 0 errors, 13 fast-refresh warnings |
| Production build (`npm run build`) | **Passed**, client and server output generated |
| Browser JavaScript exceptions      | **None recorded** in the final browser run     |
| Responsive route checks            | **Passed** at 1440 × 1000 and 390 × 844        |

This is representative frontend testing of the submitted prototype. It is not a certification of production readiness, exhaustive accessibility compliance, backend security, or compatibility with every browser/device.

## Scope decisions

- The Project Overview identifies SQL Server as the intended backend; this is the database used by the project. No database was executed or changed during front-end testing.
- Nothing was sent to external recipients. The front end uses browser-local mock data.

## Student-by-student coverage

| Student and assignment                                                  | Checks performed                                                                                                                                                                                                                                            | Result and corrections                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1 — Aditi Vishal:** authentication, account and security UI           | Invalid registration, required B2B company, valid B2B registration, normalized profile data, refresh persistence, account view, sign-out, malformed saved profile, quote ownership, no password in stored user                                              | Passed. Use Zod's trimmed values rather than the original raw strings; clear submitted credential fields; validate stored profiles and quotes; filter displayed quote history by owner email; disclose mock authentication.                                                |
| **2 — I. Vinay Datta:** layout, routing and localization                | Home/catalog/product/wholesale/sampler/contact/account routes, missing product and unknown URL, EN/ES toggle and persistence, dictionary shape parity, document language, mobile menu and filter drawer, overflow checks, storage denial                    | Passed. Added safe shared storage access; guarded language storage reads/writes; added accessible names to search/newsletter inputs, slider thumbs and narrow-screen wizard steps; fixed formatting errors and added shared regression tests.                              |
| **3 — Hector Quinones:** catalog, search and cart                       | Existing origin/cacao/price filter tests, price sorting in browser, search and empty results, clear filters, product detail, cart add/merge/update/remove/clear, subtotal, refresh persistence, invalid quantities, corrupt saved cart, displayed stock cap | Passed. Validate saved cart structure; ignore invalid quantity actions; avoid initial persistence overwriting the saved cart during hydration; cap known-product cart quantities at mock stock; cap the product-page quantity selector; close cart before opening sign-in. |
| **4 — Kshitij Sadanand Karkera:** home, wholesale and quote wizard      | Landing/wholesale routes, four-step journey, blocked missing selections, optional file step, file extension and 20 MB boundary validation, estimate calculation, required contact name, profile prefill after refresh, local submission and account history | Passed. Enforce advertised upload limits; require contact name and valid email; populate details after asynchronous session restoration; retain contact, notes, deadline, finishes and quote ownership in local quote records; make local-only confirmation explicit.      |
| **5 — Suhas Surendra Kumar:** contact, sampler and notification bridges | Empty/invalid contact validation, valid demo contact submission/reset, encoded WhatsApp URL, empty sampler disabled, 6/12-piece selection, full-box guard, 12-to-6 truncation, sampler price/cart data, EN-to-ES cart translation                           | Passed. Store distinct English and Spanish sampler names; guard incomplete sampler additions; expose remove controls on keyboard focus; replace false delivery/subscription confirmations with accurate demo messages.                                                     |

## Principal defects corrected

1. **Sampler localization:** both cart-name fields previously used the currently selected language. Now each is generated from its own dictionary, so changing language after adding a sampler translates its name correctly.
2. **Invalid browser storage:** valid JSON with an unexpected structure could crash cart reductions or account rendering. Profile, quote and cart records are now validated; inaccessible or corrupt browser storage falls back to a usable session.
3. **Cart initialization:** a ref was marked hydrated before the initial persistence effect, allowing the initial empty cart to be written before the loaded state. Persistence now waits for a state-driven hydration flag.
4. **Account data normalization:** form validation trimmed values but the raw form was saved. The validated, normalized values are now stored; the password is not stored in the user record.
5. **Quote history leakage in the shared browser:** every business profile saw the same quote list. Quotes now record owner email and the account view filters by it. Legacy records without ownership remain stored but are not attributed to arbitrary users. This is a UI correction, not server-side authorization.
6. **Quote upload validation:** the file chooser's `accept` attribute was the only restriction despite the UI advertising a 20 MB limit. Type-extension and size checks now run before retaining the selected file. Real uploads still need server-side content validation.
7. **Quote completeness and prefill:** submission allowed a blank contact name, omitted entered details from local records, and initialized before the saved session was loaded. Required details are checked, data is retained locally, and restored profile details fill blank contact fields.
8. **Stock quantities:** repeated add/update actions could exceed displayed mock inventory. Known catalog products now respect their supplied stock count.
9. **Modal interaction:** opening auth from the cart left two modal surfaces open. The cart now closes first.
10. **Misleading confirmations:** contact and newsletter claimed delivery, and quote confirmation implied remote receipt. EN/ES copy now identifies the demo/local behavior. Cart copy no longer claims real account synchronization.
11. **Accessibility basics:** supplied search/newsletter inputs and sliders lacked clear accessible names; wizard step text disappears on narrow screens. Added names and current-step state; sampler remove controls become visible with keyboard focus.
12. **Lint failures:** normalized source formatting/line endings with the existing ESLint/Prettier setup. Most original lint errors were formatting-related; these changes do not constitute new features.

## Evidence and reproducibility

The checks are reproducible from the repository: `npm test`, `npx tsc --noEmit`, `npm run lint` and `npm run build` for the automated checks, and `tests/browser-test.cjs` for the browser journeys. `TESTING.md` explains how to run them. `tests/cross-browser-test.cjs` adds Chromium/Firefox/WebKit, tablet-size and keyboard checks.

The final browser checks cover 9 desktop routes, 7 mobile routes, 7 functional journeys, storage-corruption recovery and absence of uncaught exceptions. Invalid product and unknown URLs were checked as handled frontend states, not as a complete HTTP-status/SEO audit. No real WhatsApp message was sent.

Early test attempts hit Windows sandbox connectivity/temp-file restrictions and ambiguous test selectors. These were corrected in the test environment/harness, then all checks were rerun successfully. Those harness failures are not counted as application defects. The browser script waits after refresh for client hydration and before screenshots for transitions.

## Remaining prototype limitations

- **Authentication/security:** the submitted mock accepts structurally valid credentials; no password verification, JWT, server-side role guard or ownership enforcement exists. The UI now says this explicitly. Browser-local data is editable by its user; quote filtering is not a security boundary.
- **Account management:** the supplied panel displays a profile and local quote list. Profile editing, address management and real order history require additional implementation.
- **Commerce:** checkout is a demonstration that clears the local cart; no payment, durable order, live inventory reservation or account cart synchronization occurs. The stock cap uses bundled product data and cannot prevent real concurrent overselling.
- **Quotes/files:** quote metadata stays in the browser. The selected file itself is not uploaded or persisted; real file content checks, storage and staff notifications require the backend.
- **Contact/newsletter/notifications:** no SMTP or inquiry/subscription endpoint is connected. Contact validation is tested, but delivery cannot be tested. Contact details and the WhatsApp number are supplied placeholders and must be replaced with verified business details.
- **Localization:** main application flows and products support EN/ES. Some supplied metadata, country/weight strings, generic error/404 copy and shared primitive labels remain English. Full translation and assistive-technology audits were not completed.
- **Tooling/hosting:** 13 nonblocking `react-refresh/only-export-components` warnings remain in shared components/providers. Build emits plugin/optimization warnings. The site is hosted on Render.
- **Coverage boundaries:** The original run used Edge at desktop and phone sizes; `tests/cross-browser-test.cjs` has since been run in Chromium at phone, tablet and desktop sizes with keyboard checks. Firefox and WebKit (Safari) runs, physical mobile devices, a formal contrast/screen-reader audit, backend APIs, SQL execution and remote linked prototypes were outside this run.
