# Dropa2z app visual refresh — 3 November 2026

Approved direction: green and charcoal. Scope: Rider and Driver apps only, visual changes with existing behaviour preserved.

## Brand
- Primary green #157A52, charcoal #172B26, canvas #F5F8F6, mint #B9E9CE.
- New original parcel/forward-arrow mark and original delivery SVG illustration, authored for Dropa2z.
- System text rendering with the existing bundled typefaces; no new paid font dependency.
- Both apps retain their names and the Associated with SK Translines launch subtitle.

## Free source
Lucide icons: https://lucide.dev/ and https://github.com/lucide-icons/lucide (ISC licence).
Selected SVGs are bundled locally in each app's src/design/assets/lucide-icons.json.
Complete upstream licence is retained alongside them in LUCIDE-LICENSE, including Feather-derived notices.
Brand mark and delivery illustration are original vectors, not another company's logo or app artwork.

## Behaviour contract
Existing navigation names, button callbacks, disabled/loading behaviour, validation, network calls, state transitions, prices, OTPs, login and delivery flows must stay unchanged. Decorative artwork has pointerEvents=none. Entrance animation is one short native-driver fade, honours reduced motion, and creates no polling or map animation.

## Validation
118 changed JS/TS files compiled successfully. All 12 original JSX event-handler attributes in modified components matched their pre-refresh definitions. Existing business handlers were not edited for the design. Rider and Driver Metro bundles returned HTTP200 after one server restart to index the new directories. Rider Settings and Driver vehicle-registration screens visually checked on A142; Driver UI runtime observer reported no render exceptions. This does not establish end-to-end correctness of every screen or booking.

New vector logo is used in both launch screens, Rider home header, Rider authentication and Driver registration headers. Original delivery artwork replaces bundled taxi authentication artwork and the Rider onboarding fallback. Admin-supplied onboarding images remain honoured. Shared buttons/inputs, app palettes, navigation icons, settings/history/wallet/card styling and old brand-coloured SVGs were refreshed. Driver navigation has a charcoal background. Animation is a short reduced-motion-aware splash fade; normal touch feedback is retained.

Native Android launcher resources are prepared for the next build. They do not change the installed launcher icon through hot reload. Existing standalone APKs remain old snapshots until rebuilt. No APK or backend design configuration was deployed for this visual refresh.

Preview: DROPA2Z_DESIGN_PREVIEW.html (illustrative design samples, not extra in-app actions).

## Separate approved bug fix discovered during visual review
Driver registration showed Too Many Attempts. Confirmed live legacy throttle middleware shared one domain+IP signature across all unprefixed five-attempt auth routes. With user approval, isolated 18 authentication endpoints with unique prefixes while preserving five attempts/minute per endpoint. Controller logic, OTP verification and account roles unchanged. Deployed after 3 tests/15 assertions, including same-step sixth-attempt rejection; repeated tests passed against the deployed routes.

For dhavalchorwadkar@gmail.com, live active accounts have admin, fleet_manager and rider roles across existing records, and no Driver profile. Do not automatically convert an Admin/Fleet account or bypass driver registration. Await user's confirmation of the email used in this latest test.

Server backup: /home/dropa2z/dropa2z-backups/auth-throttle-20261103-111459. Local test: Taxido_laravel/tests/Unit/AuthenticationThrottleIsolationTest.php. No real OTP/login/registration submitted by Codex in this check.
Backups of pre-refresh files: D:/DROPA2Z/design-backup-20261103.
