# Dropa2z bug-fix batch — 3 November 2026

## Current state

- Backend changes deployed. Original files, environment and affected database tables were backed up to `/home/dropa2z/dropa2z-backups/20261103T071917Z-bugfix`.
- Public secure WebSocket subscription, Laravel publishing and message receipt passed a diagnostic-channel check. This did not create a booking, account or notification for an app user.
- Redis queue and Reverb workers are running. Cron checks every minute and uses locks to avoid duplicate workers. The scheduler now explicitly uses PHP 8.3.
- With user approval, archived 320 waiting jobs, 13 delayed jobs and their wake-up notifications under `queues:archived-20261103-071954*`. They were not deleted or replayed. The previous 26 failed jobs were preserved.
- Four goods offerings configured: Bike Parcel, Auto Parcel, Bike Freight and Auto Freight. Current Admin prices retained; added editable included minutes. Final-drop handoff and pickup OTP guards deployed.
- Three ticket priorities and General Support department restored because both tables had no active records. Sample coupon 9 disabled, with its previous record saved outside the website.
- Admin now gets its WebSocket settings at runtime instead of connecting to the visitor's localhost. Its browser script received a new cache-busted filename; original assets are preserved.
- Updated universal release APKs were built on 3 November and saved to both PC Downloads and A142 Download. Both signatures, bundled JavaScript and four ABIs were verified. They were not installed or functionally tested: the user paused testing and requested APK files instead.
- Phone use was limited to connection/package inspection and screenshots, as requested. No forms, OTPs, bookings, payments, cancellations or account settings were operated on the phone.
- English remains the only configured language by user choice. User will add other languages through Admin.

## Manual checks after installing updated apps

All checks below are pending user confirmation. A source fix or server deployment is not a passed phone test.

### Rider

- [ ] R1 — Try registration with an existing email. A clear error must remain visible, and registration must not continue. A fresh verified email should complete normally.
- [ ] R2 — Language: confirm the saved selection survives reopening. After adding an enabled language and its app translations in Admin, switch to it; failed requests must show an error instead of silently applying an incomplete change.
- [ ] R3 — Create a real enabled coupon in Admin with valid service/vehicle/date/spend rules. Apply it, confirm the discount and booking payload, then remove it. Invalid codes must show an error. The old Demo offer is intentionally disabled.
- [ ] R4 — Add a titled saved location, reopen the list, edit it and remove it. Verify its exact map point and address. Empty title or unavailable coordinates must prevent saving.
- [ ] R4 UI — Open Preferences, Payment, Myself and Coupons. Confirm sheets slide correctly and keyboard input remains visible. Invalid main-sheet index calls were removed; coupon input uses the sheet-aware text field.
- [ ] R5 — Open Add Balance, including with the keyboard visible. The button must stay above the navigation area and payment methods must remain reachable. Do not make a real payment unless intended.
- [ ] R6 — Service registration selection belongs to Driver; see D-service below. Rider Services should show the four configured Parcel/Freight choices, with no test-cab cards in that screen.
- [ ] R7 — Home must show current backend services, recent deliveries and real offers. The repeated Demo coupon must be absent. No offers is valid until Admin creates a real offer.
- [ ] R8 — Signed-out opening must show readable onboarding slides and explicit Continue/Skip actions. Empty Admin onboarding uses three branded fallback slides; the last slide must not auto-dismiss.
- [ ] R9 — Rebook a completed Parcel and Freight delivery, including one with more than three intermediate stops. Preserve all addresses/coordinates, collect receiver/weight details and obtain a fresh fare. Legacy Cab-history rebooking still needs separate confirmation.

### Driver

- [ ] D1 — Name: reject blank/numeric/special-character-only values. Accept a valid name; retain the entered text and display a useful error.
- [ ] D2 — Registration number: reject arbitrary special characters and malformed plates; accept a correctly formatted Indian registration such as MH19AB1234. Both registration and vehicle-update APIs validate the plate.
- [ ] D3 — Guided-tour title should read “Need a guided tour?”.
- [ ] D4 — Mobile: reject letters, punctuation and invalid Indian mobile numbers before claiming an OTP was sent. The backend also validates mobile requests.
- [ ] D5 — Profile email/mobile verification: after sending the code, show the OTP sheet without a second competing Verify action beneath it. A wrong code must keep verification available for retry.
- [ ] D6–D7 — Edit email: normal field background/text, valid email keyboard, visible validation and no code request for an invalid address. Enter the code for the same normalized address.
- [ ] D8 — Change profile picture and save. Reopen profile and restart the app; the server image should remain. Cancelling an unsaved preview must not persist it as an uploaded photo. Failed HTTP uploads must not report success.
- [ ] D9 — Wallet card and Add Balance screen: buttons must be visible, aligned and above system navigation on small and large screens. The fixed-height offset on the top-up screen was removed.
- [ ] D10 — Enter an incorrect/expired OTP; display its error visibly and allow correction. No duplicate automatic verification request should occur.
- [ ] D11–D13 — “Resend OTP” label and countdown; resend clears old digits, repeated taps are guarded, and the verification instruction clearly identifies the destination address/number.
- [ ] D14 — Create Ticket: priorities and General Support department must be selectable. Submit an intended ticket with valid fields and confirm Admin receives it. No fabricated IDs or placeholder IMAP credentials were added.
- [ ] D15 — Cancel from Rider while Driver displays the booking. It must disappear from active work through live events; list refresh is a five-second foreground fallback. Reopening the screen must show the same server status.
- [ ] D16 — For an accepted/not-started delivery, use Cancel delivery, review the confirmation and confirm cancellation in both apps/Admin. This changes the backend booking and may invoke configured cancellation fees. Started deliveries cannot be force-cleared locally.
- [ ] D17 — Dashboard uses real backend figures, refreshes when focused and handles an empty chart without NaN. Compare totals with Admin for the same driver/zone.
- [ ] D-service — Switch Parcel to Freight during vehicle registration. Category/vehicle choices must refresh and stale selections must reset. Test categories must not appear in the new goods selection list.

### Shared booking and realtime checks

- [ ] Keep Driver online; book from Rider. Confirm the new request appears without manually refreshing.
- [ ] Accept once and verify both apps/Admin show the same assignment. Check cancellation from Rider and Admin separately using new bookings.
- [ ] Normal parcel: accepted → arrived at pickup → one pickup OTP → started → final Parcel delivered → cash received/payment → completed. Do not invent or bypass payment confirmation.
- [ ] Multiple drops: preserve the chosen order and show a Parcel delivered action for every intermediate stop and the final destination. Completion/payment must not skip outstanding handoffs. There is no delivery OTP at the drops.
- [ ] Confirm road-route distance and a fresh quote for different routes/stop counts using current Admin rates. Existing quotes/bookings must not silently receive new invented prices.
- [ ] Refresh Admin with Ctrl+F5 once to load the new browser script. Confirm live bookings/chat/notifications connect securely and do not attempt ws://127.0.0.1:8080.

## Build commands for the user — not executed by Codex

Use one PowerShell terminal per build, one app at a time. These release builds bundle JavaScript and run without Metro. Existing signing configuration is retained.

Rider:

```powershell
cd D:\DROPA2Z\dropa2z-src\Taxido_user\android
.\gradlew.bat assembleRelease --no-daemon
```

Driver:

```powershell
cd D:\DROPA2Z\dropa2z-src\Taxido_driver\android
.\gradlew.bat assembleRelease --no-daemon
```

Only after BUILD SUCCESSFUL, select the newly generated universal release APK (or app-release.apk if ABI splits are disabled) under that app's `android\app\build\outputs\apk\release`. Do not install a debug APK or an older APK by mistake. Copy/install commands should use the exact resulting filename after checking the build output.

## Limits and follow-up

- No claim of a completed end-to-end phone test in this batch. User requested visual-only phone use.
- Install the newly supplied release APKs to see the latest app changes. A separately installed debug build is needed for Fast Refresh; the existing release apps cannot use Metro.
- The earlier visual inspection showed a white square behind the auto marker. This additional cosmetic finding is recorded; it was not fixed by changing an image in this batch.
- Public-launch readiness, receiver-unavailable/return workflows, structured package dimensions and per-drop receiver details remain separate work from this bug batch.


## Delivered APK files

Both PC `C:\Users\mishr\Downloads` and phone `/sdcard/Download` contain:

- `Dropa2z-3.0.0-universal-20261103.apk` - 93,651,261 bytes; package com.dropa2z.rider; app label Dropa2z; versionCode 1.
- `Dropa2z-Driver-3.0.0-universal-20261103.apk` - 85,624,312 bytes; package com.dropa2z.driver; label DropA2Z Driver; versionCode 5.

Both are version 3.0.0 standalone release APKs with armeabi-v7a, arm64-v8a, x86 and x86_64, embedded JavaScript, Hermes VM, React Native, Worklets and Reanimated libraries. Phone copies were SHA-256 matched to the PC copies. No APK was installed.

## Latest OTP follow-up - shared Driver/customer email

- Deployed: a verified existing Driver can enter the customer app with the same email, using the same account with both roles. Driver profile and wallet are retained; a separate customer wallet/session/push token is used.
- Server transactional checks and PHP syntax passed. Diagnostic changes rolled back; no real email/OTP used.
- Pending: request a fresh OTP in the customer app with the existing Driver email, verify it and confirm dashboard opens without registration. Then confirm Driver app still opens the original Driver account.
- Latest frontend runs through Rider Metro on A142; older standalone APK files in Downloads do not receive hot reload changes.

## Services cards follow-up

- Fixed dead navigation: Bike/Auto Parcel/Freight cards now open registered Delivery booking screen instead of missing Ride route, retaining selected offering parameters.
- Babel compilation passed. Phone tap confirmation pending; hot reload only, no APK rebuild.

## Pickup/destination keyboard flicker follow-up

- Fixed conflicting Android height adjustment in shared LocationDrop. Native adjustResize handles Android; iOS keeps padding avoidance.
- Before/after seven-second recordings confirmed the repeated footer jumping stopped while the destination keyboard was open. Babel passed; delivered through existing Rider Fast Refresh. Final pickup/destination reopen test by user pending; release APK not rebuilt.

## Swap and service dropdown

- Added pickup/destination Swap (address + coordinates together), enabled when both locations are selected; existing intermediate stop order is retained.
- Added inline delivery-service dropdown on the location form, preserving route input and passing the selected backend service/category/vehicle to booking. Choose destination, optionally swap/change service, then press Proceed.
- Babel passed; goods-service mapping tests passed 3/3. New controls visually visible on A142 through Metro. User phone test pending: select both endpoints, swap, choose each service and check next screen/quote reflects the selection. No new standalone APK built.

## Parcel picture optional

- Picture of Your Packed Parcel now explicitly says (Optional).
- Confirmed frontend accepts an absent image and live booking image-ID validation is nullable. Babel passed; hot reload only. User may continue without a photo after filling receiver details/weight.

## Active-delivery cancellation popup

- Fixed null-reason crash, stuck spinner, unexpected-response handling and duplicate taps. Empty live reason list now allows a typed reason instead of blocking cancellation. No fabricated distance in cancellation payload.
- Only leaves the booking after server cancelled status; reads latest status after an uncertain response, with bounded request timeouts and visible errors.
- Babel passed; 6/6 cancellation tests passed. Hot reload applied; phone returned Home during refresh. User live cancellation test via History/Active remains pending. Codex did not cancel a booking during this fix.

## Button/route source audit - awaiting selected fixes

- Full report: DROPA2Z_BUTTON_ROUTE_AUDIT_2026-11-03.md.
- 1,519 src files parsed, 819 event attributes, no parser failures. 17 calls to missing screens (15 Rider, 2 Driver), plus no-action UI findings grouped by current/conditional/dormant flow.
- Prioritize Driver Ride links (bidding card and RideInfo), Rider expired-session Login reset and email-only guest SignInWithMail links. Fleet refresh is empty. Old invoice/offer/taxi/rental UI is separately listed to avoid assuming it is shown in today's Parcel/Freight flow.
- Audit only; no application fixes/deployment/build/device tests performed in this task. User to choose next implementation scope.

## India-wide local deliveries - deployed

- Scope approved: local deliveries within any Indian city; pickup, intermediate stops and final destination must all stay in the same city. Prior Jalgaon-only requirement superseded.
- Rider country-restricted search and India-only saved-address resolution hot-reloaded. Backend validates country/city for quotes, new bookings and address changes.
- Admin zone70 India Local Deliveries enabled with copies of existing Bike/Auto rates. Jalgaon zone69/rates preserved and still preferred locally. Other cities use zone70; nearby eligible drivers are still required.
- PHP policy unit checks passed 6 tests/11 assertions; 9 related JS tests passed. Live quotes passed for all four choices across Jalgaon, Mumbai, Pune and Delhi. Intercity and Nepal were rejected422. No delivery completed/created during these checks.
- Test on phone: choose two Jalgaon addresses -> Continue to quote -> choose vehicle; test same-city multiple stops. Then try another Indian city and verify city-local route/price; intercity should show an explanation.
- No APK rebuilt: current debug phone uses Metro. Downloaded release APK snapshots require rebuilding to include India-wide frontend search before sharing with the manager.

## Driver hot reload ready on A142

- Existing arm64 debug build installed (Driver had been absent). Driver Metro8082/session66895, USB reverse8082 and app-specific debug server preference configured.
- Latest Driver JS bundled and Metro connection verified; Rider remains separate on8081. No new APK build and no login/booking submitted.

## Driver OTP keyboard overlap - visually verified

- Replaced the fixed-height, bottom-positioned OTP panel with a scrollable layout bounded by the keyboard's visible top edge. Hides the decorative illustration while typing and keeps OTP inputs, Verify and Resend above the keyboard.
- Babel compilation passed for the three changed Driver OTP files. Applied through Metro8082; one JS reload cleared the stale Fast Refresh hook state. No APK build or authentication logic change.
- User opened Driver OTP with the numeric keyboard on A142. Screenshot D:/DROPA2Z/dropa2z-driver-otp-verified-layout.png confirms all six boxes, Verify and Resend are fully visible above the keyboard. No code entered, submitted or resent by Codex; OTP authentication itself was not retested in this visual check.

## Green and charcoal app refresh - hot reload

- User approved green/charcoal and explicitly required existing functions to remain unchanged. New original parcel/arrow SVG logo and delivery illustration, locally bundled ISC-licensed Lucide icons, shared palette, rounded controls/cards and reduced-motion-aware splash entrance applied to both apps.
- 118 source files compiled; all 12 original event-handler attributes in changed components matched backup. Rider/Driver Metro bundles both200. A142 Rider Settings and Driver registration visually checked. Other screens still need user visual review. Details and asset licences: DROPA2Z_DESIGN_REFRESH_2026-11-03.md; local illustrative preview: DROPA2Z_DESIGN_PREVIEW.html.
- Native Android launcher artwork prepared; requires a later native build. No APK built. Metro sessions: Rider4698/8081, Driver16935/8082.

## Registration Too Many Attempts - fixed and deployed

- User observed429 on Driver registration during visual review, then explicitly approved fixing the shared limit. Isolated all18 auth endpoint buckets, retaining five attempts/minute per endpoint. Login attempts no longer consume verification/registration quotas or another app's login quota.
- PHP syntax passed; 3 tests/15 assertions passed before and after deployment. Confirmed live Driver register route uses its unique prefix. No accounts registered, verification bypassed or quotas cleared during testing.
- Existing-account investigation: dhavalchorwadkar@gmail.com has active Rider/Fleet records but no active Driver profile. Asked user to confirm the exact current login email before further authentication changes.

## Existing Rider email rejected at final Driver registration - fixed/deployed

- User confirmed dhavalchorwadkar@gmail.com and reproduced email already taken after completing Driver registration. Earlier explanation that Driver setup was missing did not resolve the conflicting global email-uniqueness check.
- Driver login/social-login/registration now resolve existing Driver first, then eligible Rider, avoiding a staff/fleet record with the same email. Verified Rider email can add Driver to its existing account instead of creating a duplicate User. Existing Driver goes to login; staff-only/fleet-only/disabled identities receive an explanation rather than a dead-end Driver form.
- Existing Rider password/email, roles and customer wallet retained; Driver wallet remains separate. Registration still requires email OTP/Google proof and the configured Driver approval. No account roles changed automatically during deployment; user's own final Register action remains required.
- Five transactional tests/21 assertions passed against staged and live code. Fixtures rolled back, no emails sent. Actual public endpoint rejected a deliberately invalid proof with422 Please verify your email before registering, rather than email already taken. Live read-only resolver selected Rider179, preserving Admin160/Fleet175.
- Backup: /home/dropa2z/dropa2z-backups/driver-registration-20261103-113133. No APK build. User test: press Register once on current form; if proof has expired, verify a fresh OTP and retry.

## Latest scope: original full green brand + new vehicle graphics + Documents

- User clarified that Bike and Auto graphics should be revamped, but the main brand must use the ORIGINAL FULL green Dropa2z backend logo seen on opening. The black D-only/pin icon and new parcel-arrow brand were explicitly rejected. Current BrandLogo/BrandMark and Android launcher resources now use the original dropa2z-backend-logo.jpeg in both apps. Bike/Auto SVGs, green/charcoal theme, other screens and features remain updated.
- New original Bike-with-parcel and passenger-auto-with-parcel SVGs wired into17 source files across service choices, vehicle quotes, active details and history. Original vehicle IDs, prices and button callbacks preserved; unknown vehicle types keep their existing image source. Tracking-map behaviour not changed.
- Documents structure explicitly approved: Rider policy list; Driver/Fleet uploaded documents with expiry/status/replace. Rider entry available to guests and signed-in users. Both apps have policies routes using published Admin pages and configured privacy URL. Live API has Terms of Service and Privacy Policy; demo page excluded. Delivery rules are not published and were not invented.
- Driver Documents now loads Driver+Vehicle definitions (Fleet definitions separately), supports JPG/PNG/PDF up to2MB, shows real approval/expiry status, sends only selected changes without an explicit multipart header, guards duplicate submissions and retains selection on failure. Required expiry validated, footer respects safe area. Existing approved documents can be replaced and submitted for review.
- Backend update/document deployed: token-owner/role scoped; active appropriate-type slug validation; required file/new-document validation; future expiry; expiry-only update keeps original media; changed documents pending; Fleet uses fleet_documents rather than driver_documents; uploaded media cleaned on failure. Backup /home/dropa2z/dropa2z-backups/documents-20261103-120135.
- Validation: Driver UI helper4 tests and Rider policy-link3 tests passed. Server document regression5 tests/19 assertions passed staged and deployed, including real PDF bytes on isolated fake storage and rolled-back fixture rows. Both app bundles returned200. Source compilation passed. New source screen visual check is pending: the phone showed an old debug bundle-connection error; USB reverses restored. No claim of completed phone upload/Admin approval/booking tests.

## Production signing and APK delivery status

- Owner confirmed Google Play developer account exists and NO apps uploaded. Generated separate production upload keys outside Git in C:/Users/mishr/.dropa2z-signing, restricted ACL and Windows-encrypted credential XML. Public certificate fingerprints saved there; no passwords printed. scripts/Load-ReleaseSigning.ps1 loads secrets only into that terminal's process environment.
- release-signing.gradle configures real-key signing, release HTTPS and debug Metro HTTP. Validation rejects missing/debug credentials for production releases. Both projects' validateDropa2zReleaseSigning passed. Google/Firebase certificate registration for new production keys remains required.
- Initial full universal builds passed: Rider2m45s, Driver3m29s. Phone copies are non-debuggable standalone release binaries re-signed with each project's existing tested certificate to preserve current Google sign-in/update compatibility. They are full APKs, not Metro debug builds; not Play production uploads.
- Original initial copies (parcel-arrow icon) were placed in PC Downloads and A142 Download. User then corrected main logo; an intermediate D-only restoration build was cancelled, and full-green-logo builds are now running. Final corrected copies will overwrite the same Updated filenames after verification.
- Filenames: Dropa2z-Full-20261103-Updated.apk and Dropa2z-Driver-Full-20261103-Updated.apk. Copy script verifies embedded JS, new Documents/vehicle assets, signatures against prior debug artifacts, all four ABIs, non-debuggable flag,16KB ZIP alignment and PC/phone SHA256 equality.
- Production NOT cleared: new production certificates need Google/Firebase setup, known route-audit gaps remain, and complete release-build booking/payment/cancellation/document-approval and device-layout acceptance are pending. See DROPA2Z_PRODUCTION_RELEASE.md.

### Final full-green-logo APK delivery verified � 3 November 2026
- Final Rider build succeeded in 1m53s; Driver in 2m9s. Both original full green logo images verified byte-for-byte inside the packaged APKs (Android resource names optimized).
- Overwrote PC Downloads and A142 /sdcard/Download with Dropa2z-Full-20261103-Updated.apk (93,873,616 bytes; SHA256 c3cbbfffadcb19dd2f7b56e851184e0850c65aa6c51921c2e79389ec02d50106) and Dropa2z-Driver-Full-20261103-Updated.apk (85,843,427 bytes; SHA256 b9a5119e3d2fe3bbec8b9ffeb79ac68133e7df1cf549c84f54793fa76b60cc55).
- Verified phone/PC checksums, signatures matching previous test certificate, non-debuggable release flags, embedded latest JS/Documents/Bike-Auto graphics and ZIP alignment. Files copied only; no automatic installation, login or booking performed.
- These are standalone testing APKs using existing test certificates, not Play production uploads. Public production readiness remains unverified: production certificate configuration, known route-audit fixes and complete release end-to-end acceptance still pending.

### 4 November 2026 � Named screenshots from both installed phone apps
- A142 (00077344Q001174): Rider app opened. A009P (00382769S001692): Driver opened; initial no-internet state resolved after owner connected it.
- Saved 53 named original PNGs (27 User, 26 Driver) under C:/Users/mishr/Downloads/Dropa2z screens/User and /Driver. Added index.html gallery, README coverage notes, and SHA256 manifest. Copied all folders to Download/Dropa2z screens on both phones; counts and manifest hashes checked.
- Deleted and retook the Snapchat-banner frame. Removed transition, duplicate, incorrectly named and cancellation-toast frames. Status-bar icons remain, but external notification banners/shade excluded. App's own Notifications screen retained.
- Captured existing installed versions; Rider is green, A009P Driver has older blue UI. No rebuild or install. No save/upload/ticket/payment/review submission or OTP request. Logged-out/onboarding/Fleet and states requiring a new booking/payment are outside captured coverage.
- Observed during capture: Driver document page blank except Update; Rider map picker initially blank, saved-location map loaded. A cancellation-success toast appeared while navigating existing Rider delivery details without tapping Cancel; recorded for investigation, no claim of an end-to-end test.

### 4 November 2026 — Homepage functionality, design decision deferred
- Owner supplied five homepage references and explicitly said not to design anything until the manager chooses. Kept existing layout, dropdown, service offerings, icons, colours and swap-button position. Two-category versus three-icon service selector and visual positioning remain pending that decision.
- Added deliveryPlaces normalization for both legacy recent-address formats, a separate five-place MRU store, exact coordinates, deduplication and exclusion of invalid/error placeholders. Selecting search/map/saved addresses records a recent search immediately; focus refreshes it, and tapping a recent address selects the intended field. No booking required to create history.
- Saved Locations now uses stored coordinates rather than geocoding every saved label again; legacy addresses use an India-restricted fallback. Cards are selectable when opened from a booking, and current service/vehicle parameters are retained. Existing edit/delete actions preserved.
- Map picker initializes at the selected endpoint, keeps its camera stable across GPS updates, uses an India manual-selection fallback rather than San Francisco, ignores outdated reverse-geocode responses, and disables confirmation for failed/unresolved addresses. Selecting a destination no longer overwrites persisted pickup coordinates. Returning to Home navigates to the existing tab instead of replacing it.
- Consumed map/saved return parameters once so GPS updates cannot undo subsequent edits/swaps. Background Home refresh no longer replaces a populated booking form with a loader. Protected manually edited pickup against a late initial GPS response. Stale suggestion responses cannot replace the latest results.
- Saved-location editor now respects the configured OSM provider and cannot save a geocoding-error string as an address. Exact source/destination swap functionality retained; visual redesign intentionally deferred.
- Verification: 19 Jest tests passed (deliveryPlaces, LocationSelect, existing goodsServiceOptions); Babel parsing passed for all five changed screens. Map component tests cover preserved Home navigation, destination not overwriting pickup, failed address confirmation, stale-response race, stable GPS camera and selected-endpoint initialization. No APK built, no backend deployment, no booking placed. A142 connected but installed Rider is non-debuggable; updated code is LOCAL and not yet visually accepted on the phone.
- Google sign-in branding is Google Cloud configuration, not a React Native label. Confirmed project ID dropa2z-two from Rider google-services.json. Gave owner exact Branding steps and official documentation; owner chose to make that change themselves. No Cloud settings changed by agent. Google brand verification may be required before the custom name is displayed.
### 4 November 2026 — Saved places behaviour requested to work like Uber
- Owner requested Uber-style saved places; retained existing Dropa2z design. Consulted Uber official Saved Places/Help guides for named favourites and quick reuse.
- Added debounced India-only address search to the existing saved-place map editor. Select a prediction to resolve its exact Place ID, full address and coordinates; map recentres. Existing Home/Work/Other labels, custom title, map selection and add/update backend routes retained. Typed but unselected text cannot be saved. Provider failures/unverified/foreign locations are rejected; search results use existing theme colours.
- Homepage pickup/drop/stop search also matches stored Home, Work, custom labels and addresses locally, retaining saved coordinates and avoiding geocoding a familiar name such as Home. Existing service choice and booking actions retained.
- Saved-place cards opened from booking select the target pickup/destination/stop in one tap. Cards opened from Settings open editing; explicit copy/edit/delete controls remain available.
- Fixed reducer success handling: successful add/edit/delete updates the list immediately and clears pending state. Save and Delete have duplicate-tap guards. Corrected token-expiry cleanup to remove only the token instead of clearing all AsyncStorage preferences/history. Search map source memoized to remain stable during typing.
- Existing Laravel LocationController/Repository already provide account-scoped list/create/update/delete, coordinate/title validation and ownership checks; no backend files changed or deployed for this task.
- Verification: 31 tests passed across five suites (savedLocations, savedPlaceSearch, deliveryPlaces, locationSelect, goodsServiceOptions). UI component tests verify exact coordinate return without geocoding for pickup, destination and stop; Settings edit navigation; reducer add/edit/delete. API tests use mocked Google responses; no paid Google requests, real saved-place writes, bookings, new APK or installation performed. Babel checks passed for changed screens/reducer. Changes remain LOCAL; actual phone acceptance with updated code is pending.
### 4 November 2026 — UI deferred; accepted-booking details fixed locally
- Owner supplied C:/Users/mishr/Downloads/revamped_screens and asked to revamp both apps except their homepages, then load both APKs. Inspected all non-home previews. Verified 580 supplied SVGs share the same home-icon hash; asset directories contain screenshot references rather than separated illustrations. No supplied assets overwritten.
- Owner later supplied DROP A2Z logo 12 Brand Guidelines.pdf. Read and rendered all nine pages, noted the new hands/location-pin wordmark, explored palettes and Dingos typeface. Owner selected orange/black outside the homepage, then explicitly said functionality first and finally stopped UI work for now. That colour/design decision is DEFERRED, not implemented. Restored all 80 staged visual-only files from per-file backups and reversed shared-header/service-card experiments. Removed unused ReferenceChrome files. Homepage and existing appearance retained. Backup/report: D:/DROPA2Z/revamp-backup-20261104.
- Owner explicitly confirmed missing-details behaviour: after acceptance, Rider should see assigned driver name/photo/vehicle/contact; Driver should see customer and parcel-receiver information. This is the current functional scope.
- Rider RideActive now merges the current same-booking API snapshot into the original acceptance data instead of displaying stale route data. Rejects another ride's cache, older timestamps and old driver identity fields after reassignment. Initial status fetch/polling starts before waiting for the websocket connection, so a failed socket cannot hide details.
- Added an assigned-driver card to Rider accepted-delivery details with real driver photo/name, available vehicle model/plate and existing ChatScreen route/call action. Hidden for requested/pending/cancelled states; historical completed details do not expose active contact actions. Safe phone formatting uses country code, rejects invalid strings; no tel:undefined calls. Missing ratings display zero rather than NaN.
- DriverProfile now resolves incomplete accepted-booking payloads from the existing authenticated ride endpoint, uses rider profile_image_url and customer rating rather than the driver's own rating, supports a failed-photo fallback, and shows recorded receiver name/contact with a call action during active accepted/arrived/started delivery. Uses the latest RideComplete snapshot; removed a fixed OTP-screen customer-card height that clipped details. Existing chat, pickup OTP, payment and completion actions preserved.
- Verification: Rider seven suites/45 tests passed; Driver customer-details suite/1 test passed. New tests cover incomplete accepted payload hydration, correct photo/receiver, same-ride updates, reassignment/cache isolation, phone validation, state-gated driver display and chat parameters. All affected functional screens passed Babel syntax/worklet transformation with correct absolute paths. No live booking or external call/message was made; phone acceptance remains pending.
- Both standalone release builds started in parallel with 6 GB Gradle heaps, existing project architecture settings and secure signing loader. Logs: D:/DROPA2Z/rider-functional-20261104-build.log and driver-functional-20261104-build.log. Final APK verification/copy/install status will be appended after completion. No backend change/deployment is required for these display fixes; uses existing authenticated ride resources.
#### Functional APK delivery — 4 November 2026
- Original wrapper stopped on native stderr because signing loader leaves ErrorActionPreference=Stop; corrected the build helper to capture native exit codes. Then encountered React Native Foojay0.5/Gradle9 IBM_SEMERU incompatibility. Added scripts/gradle9-foojay.init.gradle to override only that resolver to1.0.0 (official Gradle compatibility fix).
- Java17 was absent and parallel auto-downloads contended on a toolchain lock. Downloaded Microsoft's official portable Java17 archive once to D:/DROPA2Z/.tools/jdk17/jdk-17.0.21.0.2+1, verified java-version and used that private JDK for both builds. System Java unchanged. Build-PhoneTestRelease.ps1 selects it and preserves secure signing.
- Final Rider assembleRelease succeeded in3m2s; Driver in3m37s. Both universal standalone APKs have embedded JS and all four ABIs, are non-debuggable, passed signature/ZIP-alignment checks, and retain the existing phone test certificate for update/Google compatibility. Not Play production uploads.
- PC Downloads and A142 /sdcard/Download: Dropa2z-Full-20261104-Functional.apk (93,885,904 bytes, SHA256 91f20160ebeb86f6a7755794da21436d0650bdec3a4c4a6c1e272102e812be43) and Dropa2z-Driver-Full-20261104-Functional.apk (85,847,523 bytes, SHA256 98f36b57df156c474bea45d1a68233720eff769bd20cc6227505a9c69b4660bf). Verified phone/PC hash equality and updated feature markers in both embedded bundles.
- Both installed successfully with adb install-r and launched via their observed MainActivity components. Rider showed Sign In; Driver showed Sign In plus an optional overlay-permission prompt, which was dismissed via Cancel without changing device permissions. Driver logged401 driver/self (stored session unauthenticated), not a startup crash. No AndroidRuntime crash observed. Screenshots: D:/DROPA2Z/rider-functional-start-20261104.png and driver-functional-start-20261104.png.
- Asked owner to sign in to the intended Rider/Driver accounts for live accepted-booking verification. No OTP requested, real booking placed, call made or message sent. Existing UI retained; orange/black redesign and new logo/font remain deferred at owner's explicit request.

## 2026-11-04 ? supplied-screen UI update

See DROPA2Z_UI_REVAMP_2026-11-04.md for implementation mapping, functional route fixes, 53 passing tests and verification limits. Rider and Driver full APK builds are in progress under tag 20261104-Revamped. Homepage and launcher icon are retained.

### Homepage approved and orange logo

User approved User/01_Home festive design and orange logos throughout both apps. Implemented native working homepage with four services, retained endpoints and existing booking route; fixed clipped Settings SVG. 54 regression tests pass. APKs are rebuilding under 20261104-Revamped-HomeOrange; earlier Revamped APKs predate this steering. See UI report for evidence and limitations.

### 2026-11-04 follow-up
- [x] Homepage Bike Freight removed; remaining three service routes preserved.
- [x] Proceed placed above Recent Search. A142 live tap opened Parcel Details; missing selected coordinates now show guidance. Regression tests cover both paths.
- [x] Green/orange UI and artwork colour swap applied. Exact atlas edit saved as approved-home-swapped.png in both apps.
- [x] Booking Review implemented: addresses, real fare/discount data, goods selector, restriction confirmation, optional GSTIN and invoice business details. Coins excluded by user.
- [x] Guarded backend deployment and additive migration completed; isolated DB round-trip test passed. Server HTTP 200.
- [x] Settings Delete Account/Logout shadow artifacts removed and visually verified on A142; no destructive action submitted.
- [ ] Live end-to-end booking with newly added goods/GST and review screen still needs confirmation. Targeted Rider/Driver unit tests and backend tests passed; do not treat this as completed live payment testing.


## 2026-11-05 — live booking Home card, notification inbox and recent searches
- Added persistent Rider booking observer independent of screen/map listeners, using its own authenticated Echo connection. Private rider + user notification channels verified subscribed on connected A142. Live events refresh authoritative data; foreground/reconnect checks and 15-second recovery polling cover missed events. Failed API responses preserve last confirmed booking state.
- Live Delivery cards appear between Proceed and Recent Search only while searching/accepted/arrived/started. Tapping resolves the latest booking and opens search, assigned-partner or in-transit screen. No card wrapper remains when inactive; active bookings remain accessible even if a new service-area lookup fails.
- Recent searches show two entries by default; View More/View Less toggles the retained history without deleting entries. Button shares the title row to save space; address suggestion results remain unchanged.
- Search resume preserves the server expiry, original request ID, selected vehicle, parcel weight and receiver details. Starts no new booking. Removed pre-submit timer start; resume does not reset the existing countdown.
- Standard themed notification cards/inbox now include a live booking card; Android uses one quiet ongoing progress notification with native countdown, booking navigation IDs and search timeout. Status pushes update/clear only the matching ongoing delivery. Notification taps are persisted across cold start and open after authenticated navigation is ready.
- Server now saves templated push alerts into the canonical User notification inbox, deduplicates delivery-status entries by deterministic ID, and immediately broadcasts notification.created on the existing private user channel. Payload includes routing/status fields and excludes tokens. Additive request resource exposes find_driver_expires_at; Rider push metadata includes status/ride number. Preserved other live listener logic through surgical deployment anchors.
- Deployment: /home/dropa2z/.dropa2z-deploy/live-booking-20261105/backup-112012; six PHP files linted, 3 unit tests / 10 assertions passed. Additional isolated SQLite integration passed actual inbox persistence, canonical morph access, duplicate protection and one private event; no production test rows/emails created.
- Phone: A142 debug app connected to Metro 8081; /reload returned OK. Source changes visible via Fast Refresh. Live request #100257 card confirmed on Home, then absent after search ended. #100258 (request 191) card tap confirmed BookRide/search map with 0:25 remaining and stack MyTabs > BookRide, bypassing Parcel Details. Initial resume quote omitted weight; fixed and regression assertion added. Home transport error no longer means Service Unavailable.
- Checks: 8 Rider suites / 29 tests passed; scoped Echo lifecycle regression subsequently passed (one additional test). No Driver booking/payment logic changed. Acceptance/completion/cancel transitions covered in automated tests; fresh two-phone acceptance/payment and background OS tap delivery still require live confirmation. No new APK built for this feature.


### 2026-11-05 - unsolicited Parcel Details navigation
- Confirmed Parcel Details on A142 after user reported navigation without tapping. Root cause: LocationDrop retained isInitialFetchDone after Proceed and observed shared Redux zoneValue; subsequent Home/live-booking zone refreshes ran gotoNext again.
- Removed the global-zone navigation effect and obsolete completion flag. The explicit Proceed operation now awaits its own service-zone response and passes that exact result to vehicle/parcel routing. Embedded Home no longer auto-navigates on destination coordinate updates.
- Added regression: press Proceed once, change shared zone in background, rerender Home; no additional navigation and selected address preserved. Homepage + booking provider + scoped Echo suites: 7 tests passed. Source parsed successfully.
- Hot refresh on A142 completed and Home visibly loaded. No server deployment or APK build needed for this correction. Await user confirmation during the next booking.

### 2026-11-05 - Recent Deliveries opens the existing delivery
- Home compact Recent Deliveries card previously invoked the rebooking handler and sent Parcel/Freight customers to Outstation (Parcel Details). It now fetches the selected ride by internal ID, validates the returned ID, and opens the existing delivery record or its current active screen. The separate Book Again action retains rebooking.
- Added a duplicate-tap guard, loading state and retryable API failure handling. No new booking is created by the card; no design changes made.
- Live check exposed a second issue: viewing an already-cancelled record immediately showed a cancellation toast and returned Home. PendingRideScreen now returns Home only for a newly observed cancellation; historical cancelled records remain visible.
- Checks: four Rider suites / 16 tests passed (recent delivery navigation, Home booking, live booking observer, cancellation). A142 hot-reloaded; tapped #100251 (internal ride 66), verified its Cancelled Delivery details remain visible after refresh, with stored route, fare and cancellation reason. Evidence: D:\DROPA2Z\ui-crosscheck-20261104\rider\recent-delivery-verified.png. No booking/cancellation/payment mutation submitted during this check. No server deployment or APK rebuild required for the debug session; standalone APKs still need a later rebuild to include this fix.

### 2026-11-05 - Recent Deliveries intermittent network error
- User reported Network Error after opening Recent Deliveries. Live retry on A142 returned HTTP 200 for ride/66, payment-methods, cancellationReason and the detail refresh; route confirmed PendingRideScreen. The reported transport failure was not reproduced, so its underlying cause remains unconfirmed.
- Added transport-failure recovery for already-loaded, structurally complete completed/cancelled records only. Active bookings still require a fresh server response; HTTP authorization/server failures never fall back to cached data. Network errors now give a clear connection/retry message, and the tap lock is always released. Existing layout and booking/payment actions preserved.
- Four Rider suites / 22 tests passed, covering completed/cancelled offline history, rejection for cached active status, HTTP 403 protection, existing navigation, Home booking observer and cancellation behavior.
- Source updated for Fast Refresh; final visual recheck deferred because Rider was no longer foreground. No network settings were changed, no server deployment or APK build performed. Ask user to reopen Rider and retry Recent Deliveries.

### 2026-11-05 - Rider profile photo says saved but is missing
- A142 Profile Settings showed the initial instead of a photo. Read-only rider/self check returned HTTP 200 for Rider 179 with no profile_image_id or profile_image_url, confirming no photo persisted at inspection time.
- Rider's upload manually supplied Content-Type multipart/form-data and read the selfData Axios wrapper as a profile object. Replaced the duplicated upload/removal code with a shared multipart POST helper using the authenticated client, generated boundary and fallback photo name/MIME type. It now awaits self refresh, reads response.data, verifies the uploaded/removed photo state before showing success, and surfaces API validation failures. Local gallery previews are no longer persisted as if already uploaded.
- Kept photo selection, name/email/mobile fields, screen layout and other app behavior unchanged. Photo removal shares the verified save path and no longer clears the preview before the server confirms it.
- Verification: profile upload + Recent Deliveries suites passed (13 tests); EditProfile Babel parsing passed. Fast Refresh left Profile Settings visible on A142. Requested user reselect their own photo and press Update Profile; real-photo persistence/display confirmation pending. No arbitrary personal image was selected/uploaded by automation, no APK build or backend deployment.

### 2026-11-05 - Profile save blocked by existing email
- User retry surfaced backend email-uniqueness validation, preventing photo upload. Existing API UpdateProfileRequest excludes the current row but rejects an unchanged identity shared with another role account. Phone was also required even for email-verified users without a number.
- Prepared a local backend fix: unchanged email/phone retain their current identity; changed values still validate format and uniqueness against active users. Phone is optional when not configured; an existing phone cannot be cleared by submitting a blank value. Uses authenticated user ID only.
- Added isolated SQLite PHPUnit coverage for unchanged shared email, unchanged shared phone, optional phone, changed duplicate/invalid email and phone, and preventing deletion of an existing phone. Both PHP files pass syntax checks. PHPUnit execution pending: local Laravel vendor dependencies are absent and remote server currently inaccessible.
- Deployment NOT performed. Desktop Commander currently reports account pranavtoolzbuy@gmail.com with both registered server.tejum.cloud devices offline (IDs b16380fc-001e-4c1f-9524-a66542628d83 and 0f79a155-5987-47a0-8e9b-230529c817cd). Explained account matching and provided logout/reconnect command. Latest user-requested connection check still shows both offline. Rider photo fix already local/hot-reloaded; final real-photo save depends on deploying this validation correction.

### 2026-11-05 - Profile identity validation deployed
- Reconnected server.tejum.cloud device 6c89c500-74ef-4c86-ac24-2fedfe76b2be. Compared live UpdateProfileRequest with the expected original and preserved backup at /home/dropa2z/.dropa2z-deploy/profile-photo-20261105/UpdateProfileRequest.before.php. Only this validation file was deployed, with hash guards and atomic replacement.
- Isolated SQLite PHPUnit tests passed: 5 tests / 12 assertions, covering unchanged shared email/phone, changed duplicate/invalid contacts, optional phone and the legacy email-only phone placeholder 0.
- First live read-only account-validation probe exposed legacy phone 0 failing digits validation. Adjusted to validate phone format/uniqueness only for a changed value; existing valid numbers cannot be cleared by submitting blank. Final read-only validation for Rider 179 passed with no error fields. No account data, photo, emails or bookings were mutated by these probes.
- User instructed to reopen Rider, select their photo and Update Profile again. Real-photo persistence/display still awaits that retry. Rider was not foreground at the final capture attempt, so no taps or screenshots were performed. No APK rebuild needed for backend correction.


### 2026-11-05 - Matching home banners and categorized places
- Rider Home now has four banners with the same text/artwork split, background, spacing and image sizing. Smooth looping horizontal paging runs every 2.5 seconds; swipe/dots remain usable, autoplay pauses offscreen, in the background and for reduced motion. Uses approved PDF brand artwork.
- Replaced the homepage Recent Search/View More block with Your Places icons: Home, Work, Office and Add new. Users explicitly create named/icon categories, assign a searched address, or open the existing searchable map save form with its category prefilled. Selecting an address fills the focused booking endpoint through the existing verified-address handler. Search suggestions remain functional.
- Addresses use the existing authenticated saved-location API and exact coordinates. Custom empty categories/icon choices use per-account device storage; saved custom titles can be recovered from server addresses on another device with the default place icon. Searches are not guessed into private Home/Work categories. Save errors are shown and duplicate submissions locked.
- Latest steering: removed the redundant Saved Location quick-action from Rider Home only; Locate on Map now spans that row. Existing Settings saved-location management/API and saved addresses are retained.
- Verification: six focused Jest suites passed, 26 tests (banner layout/timer/wrap/reduced motion, category persistence/API payload/error handling, map form prefill, homepage service/endpoints and recent delivery routing). A142 Fast Refresh visibly shows banners and category shortcuts. No personal category/address or booking was created by automation; real account save/reopen confirmation remains a user test. No APK build or backend deployment needed for these source changes.
- Earlier revamp verification: Rider/Driver source Babel parsing passed before this increment; approved orange/black logo and native branded loaders/theme applied, profile photo visibly displayed on A142. Rider white screen recovered by restarting its app process after restoring USB Metro reverse. Generic App.test smoke suites retain pre-existing native/ESM mock failures; full production readiness and Driver visual review are not claimed.


### 2026-11-05 - Rider layout, stable suggestions, delete places and PDF typography
- Restored source clear control. Rebuilt the homepage address card with equal native input/action columns: pickup and destination clear buttons align, long values cannot render underneath clear/add-stop controls, Swap stays alongside the fields, and multi-stop add/remove handlers are unchanged.
- Enlarged the four matching banners (hero width ratio .67, 250-340 dp) and reduced service illustration height from 48 to 34 dp. Autoplay pauses while a location field is focused.
- Found and corrected a real refresh loop: the category shortcuts were unmounted whenever suggestions appeared; remounting refreshed saved places and cleared/restarted the suggestions. Categories remain mounted. Search is debounced, stale responses are invalidated and search results float above the service cards.
- Added a bounded, persistent-scrollbar suggestion list. Moved its touch layer out of the card/outer ScrollView to the screen root, measured against the address card, and disabled outer scrolling while the list is open. The initial swipe check exposed old code because Metro had stopped; restarted Rider Metro (8081), restored USB forwarding after reconnect, and requested the latest bundle. Final physical scrolling confirmation still pending; do not claim it based on a scrollbar prop alone.
- Added a confirmed Delete action to each Your Places saved address using the existing authenticated delete action. API-confirmed removal updates Redux and refreshes; errors remain visible. No personal addresses were deleted by automation.
- Rider-wide visual pass: consistent font adapter for native text/inputs (175 Rider imports, 131 Driver imports), shared headers/fields/buttons, and 219 card/field surface finishes across 83 Rider style files. Coverage is recorded in Taxido_user/src/design/rider-surface-coverage.json. Wallet uses native charcoal/orange graphics and flowing content; empty delivery history uses approved delivery artwork. Existing routes, API calls and prices are preserved. Full manual review of every screen is not claimed.
- Typography correction: brand PDF explicitly names Glacial Indifference. Replaced the earlier GT Walsheim pass with Glacial Indifference Regular/Bold in both apps' shared font definitions/adapters. Downloaded and validated TrueType files from Font Library; checked embedded copyright, OFL licence and PostScript name. Font files and licence/attribution are included in Android assets; react-native.config.js declares the source font directory. Native Rider debug rebuild started to package the new fonts; installation/phone font confirmation pending. Driver font assets/source are prepared, not rebuilt in this step.
- Verification so far: Rider 26 focused suites / 116 tests passed, Driver 5 suites / 13 tests passed (known generic App.test native/ESM mock failures excluded). Both apps parse (Rider 868 and Driver 704 source files). New tests cover pickup clear, exact suggestion coordinates, stable category mounting, nested suggestion scrolling configuration, category address deletion confirmation, and typography inheritance/handlers. No APK release or backend deployment in this step.


### 2026-11-05 - Individual Rider pages and native PDF font build
- User correctly flagged that shared style changes were not a complete individual-page redesign. Full screen-by-screen revamp remains in progress; do not mark every screen complete.
- Individually redesigned Saved Locations into compact branded cards with clear Copy/Select, Edit and Delete actions, full readable addresses, an address-book intro and an orange Add action. Original exact-pin selection/edit/delete callbacks remain. Profile image header now uses native charcoal/orange artwork; History tabs have minimum 44 dp targets; Services has coloured section rails, live option counts and refined descriptions. Wallet balance card now flows in normal layout with native brand graphics and 44 dp controls.
- Typography: Glacial Indifference confirmed in the PDF. Verified regular font PostScript name GlacialIndifference-Regular and embedded OFL/copyright metadata. Font Library TrueType files (Regular 52404 bytes, Bold 53100 bytes) included in both apps source and Android assets with licence/notice. No GT Walsheim/Lexend references remain in app-owned TS/TSX.
- Rider arm64 debug build completed successfully in 4m53s (826 tasks, 34 executed, 792 up to date), with a 5 GB Gradle heap and six workers. Inspected APK ZIP to confirm both Glacial fonts and licence files are packaged. Installed with adb install -r successfully on A142, preserving app data; reopened Rider. Actual phone font and page checks continue. Driver font source/assets are prepared but Driver has not been rebuilt in this step.
- Saved-location selection/editing, profile upload, active services and homepage suites passed (15 tests) after individual page changes. Previous full focused Rider run passed 116 tests, Driver 13; generic smoke-test mock failures remain excluded as documented.


### 2026-11-05 - Rider individual cards, onboarding and dark mode
- Confirmed the native Glacial Indifference font on A142. The first launch after installing the font debug build logged a Fabric native SIGSEGV (MountingCoordinator::pullTransaction, 16:47:41); a second cold launch succeeded. Root cause of that one native crash is not established; do not mark it resolved from this observation.
- Added a reusable icon heading to booking review (GST, offers, fare, goods, delivery instructions), payment summary/top-up, support tickets, parcel details, referral cards and Profile details. Buttons retain existing handlers; no fares, wallet formulas or booking payloads changed.
- Individually refreshed offer cards, account summary/wallet shortcut, support cards, referral hero/code/history cards, parcel form/photo/description sections and delivery-history actions. Profile edit uses flowing content rather than fixed card/percentage heights; phone/email rows use flexible widths.
- Inspected App Settings on A142: grey shadows/bands behind Theme and Language were real layout defects. Removed card shadows from inner rows, aligned icon/text/control slots and verified the new layout in light and dark mode. Toggled Theme on and off successfully. Language did not open its previous sheet during the phone check; replaced that presentation with a bounded native Modal and scrollable language list, preserving translation/service reload, storage, RTL and failure rollback. Three regression tests pass; final phone opening check remains to be recorded.
- Rider onboarding now uses the approved orange wordmark, three branded delivery illustrations, icon badges, Glacial typography and responsive scrolling with Next / Skip / Get Started. Configured Admin slide titles, descriptions and images are preserved; string image URLs normalized for native rendering. Verified first slide visually on A142 without logging the account out. Tests confirm final slide waits for explicit action and configured content/Skip remain functional. Driver onboarding has not been changed in this pass.
- Dark-mode fixes: homepage banner/header/actions, address separators/placeholders, service card borders and transparent native vehicle art, category icons/borders, selected/unselected bottom-tab contrast, Services secondary text and account/referral secondary text. Latest A142 capture confirms dark home improvements. Full dark-mode sign-off of every routed screen is still pending.
- Verification: focused Rider run 28 suites / 121 tests passed (generic App.test native mock failure remains excluded). After later dark/Home changes, 3 affected suites / 11 tests passed; source parse checks pending latest rerun. No backend deploy, release APK build, real booking/payment or personal-address deletion performed in this pass. Rider Metro remains on 8081. The full screen-by-screen revamp is in progress; shared style coverage alone is not completion evidence.

### 2026-11-05 - Rider dark-mode phone checks and requested standalone APKs
- Confirmed Language dialog opens on A142; dismissed without changing language. Confirmed dark Profile fields/Update button, Referral cards, Wallet, Offers, Support, Documents and Notifications visually.
- Corrected Wallet action contrast and transaction-row outlines/flexible widths, dark saved-place description and icon contrast, top-up placeholders, Documents body/footnote/border/icon contrast, and full-screen border on Offers. Added themed icon empty states for Offers and Support; original actions and data sources preserved.
- Latest focused Rider verification: 28 suites / 121 tests passed; source parser checked 871 TS/TSX files with zero syntax errors before the final small contrast edits. Generic App.test native-mock failure remains excluded. Screenshots: D:\DROPA2Z\ui-crosscheck-20261104\rider\dark-*-final.png and dark-documents-corrected.png. Saved Locations loaded existing Home entries after the request settled; no addresses changed/deleted.
- User requested full Rider and Driver APKs copied to A142 Download. Started both current-source standalone release builds using existing signing/build/copy scripts; copy scripts retain existing phone-test certificate and verify embedded bundle, non-debuggable manifest, signature/alignment and phone SHA-256. Build/copy completion is pending.
- Scope: latest individual dark-mode/onboarding changes are Rider-only. Driver uses its current code; no claim that this Rider pass redesigned every Driver screen. Full screen-by-screen and live booking acceptance checks remain separate from a successful APK build.

### 2026-11-05 - Live testing corrections and standalone phone packages
- Both universal standalone APK builds succeeded (Rider initial build 3m47s, Driver 4m31s), copied to PC Downloads and A142 /sdcard/Download as Dropa2z-Full-20261105-1748-Updated.apk and Dropa2z-Driver-Full-20261105-1748-Updated.apk. Copy scripts verify embedded JS, signature, alignment, non-debuggable manifest and matching phone SHA-256. Existing phone-test certificates retained; these are not Play upload artifacts.
- During user testing, corrected History tabs to equal-width orange selected segments without nested card shadows; replaced oversized empty-state frame and removed negative list offset. Existing Upcoming/Active/Past filters and booking callbacks unchanged. Focused Rider suite rerun: 28 suites / 121 tests passed; 871 TS/TSX files parse.
- Found Parcel Details ScrollView inside an unbounded Header container. Moved ScrollView below Header with flex:1, safe-area bottom padding and keyboard tap/dismiss handling. Source fixed; physical scroll recheck pending because user moved on to the booking screen.
- Replaced the booking action strip's BottomSheetScrollView with the installed gesture-handler ScrollView, bounded height, nested scrolling and interruption protection. Physically swiped right and left on A142: Preference fully visible at one end, Coupons fully visible at the other. Screenshots booking-actions-swiped-right.png / booking-actions-swiped-left.png. No booking submitted by automation.
- User caught remaining green controls in Review Booking. Corrected links to dark orange/pale orange, primary CTA to orange with charcoal text, dark surfaces/borders and duplicate Android top inset; switched back glyph to shared SVG icon. Phone screenshot review-theme-updated.png confirms actual new UI. Six booking-review tests passed, preserving GST validation, goods selection, coupon and confirm callbacks.
- Final Rider rebuild/copy is running to include all of these live-test corrections; Driver already copied successfully. Final build result/hash must be recorded after completion. No claim that every routed screen or full live booking flow has been verified.
- Final Rider rebuild completed successfully in 37 seconds. Final source-map checks confirm exact current source for booking action strip, Review Booking, Parcel Details scrolling and History tabs. Final copied Rider SHA-256: 3b00520397ed43359fc35d88f04c3a5982418063068cdcbd8873e159dea54d65; Driver: c0acac454503cbd8399cefc78213080d48d1ae881f4f810fe708b8edd202902b. Both files confirmed in A142 Download and PC Downloads; matching phone checksums verified by the copy script. Rider 100149778 bytes, Driver 90186053 bytes. Standalone embedded bundles, all four ABIs; no Metro needed. These files were copied, not installed over the user's current live test session.

### 2026-11-06 - Driver visual refresh and live debug preview
- Refreshed Driver dashboard, onboarding, delivery tabs, profile/settings, wallet/top-up, bank/vehicle forms, documents, support/chat/referral and subscription presentation with the approved orange wordmark, charcoal/orange palette, Glacial Indifference and icon cards. Existing API/payment/booking callbacks retained; Rider untouched.
- Driver debug build succeeded in 3m11s, installed on A142 with account data retained; Metro remains on 8082. Visually checked core screens, opened language sheet, toggled dark mode and restored light mode. No business form or booking submitted.
- Fixed invalid module-level useValues hook in topupWallet payment-option styles found during reload. Corrected readonly dark input contrast, bank duplicate heading and support header consistency.
- Validation: 6 focused Jest suites / 15 tests passed; all 713 source/test TS/TSX files parsed. Generic App.test native/ESM mock issue remains excluded. No backend deployment or release APK build in this pass.
- Detailed evidence and remaining live-delivery/device checks: DROPA2Z_DRIVER_UI_STATUS_2026-11-06.md. Previous standalone APKs do not contain this new Driver refresh.

### 2026-11-06 - Delivery flow additions, integrated navigation and manual test handover
- Added Google Navigation SDK React Native 0.16.3 (compatible with RN 0.82) and a themed DeliveryNavigation route. Existing Google navigation buttons now target pickup before arrival and next undelivered drop during delivery. Native Driver debug build succeeded in 3m07s and installed on A009P. Cold-start check authorized successfully; route shown as 7 min / 2.8 km with turn instructions and voice-guidance enabled. Audible voice and physical travel/rerouting not verified. Initial HMR activity-context failure cleared after cold launch; monitor reload/retry lifecycle.
- Added separate stop arrival before handoff using DeliveryProgress transitions. Only assigned Driver can update a started delivery; earlier drops must be handed over first. Repeated taps preserve original timestamps. Pickup still has one OTP only. Existing completion guards continue to require all goods drops, including final drop.
- Added Rider pickup-vehicle confirmation, persisted under parcel_delivery_progress and broadcast to the existing ride-status channel. Rider cannot confirm another customer's booking. Rider active screen has confirmation button; Driver pickup screen and Admin detail show confirmation. Added Rider in-progress delivery status card, fixed polling comparison to include parcel progress and added live Admin progress rendering.
- Minimal backend patches were staged against the live source, linted, tested (6 tests / 13 assertions) and deployed to /home/dropa2z/public_html with backup /home/dropa2z/delivery-flow-backup-20261106-060220. Cache cleared and new confirmation route verified. Progress broadcasts are immediate with logged failure fallback; full three-platform live update observation is still pending.
- Pickup ETA now uses road-route duration and traffic duration where returned, replacing fixed 25 km/h straight-line calculation. Errors show ETA unavailable. No claim of traffic availability for every route/API configuration.
- Unified Home vehicle artwork across both apps' VehicleGraphic, Driver map/pickup/trip/fleet maps and Rider pending/active/in-progress maps through shared vehicleArtwork source. Phone screenshot confirms Driver auto marker matches Home art. Unknown vehicle types preserve server artwork. More legacy routes and native Google navigation's own location indicator have not been individually checked.
- Rider debug build succeeded in 32s, installed on A142; Metro 8081 active. Driver Metro 8082 active on A009P. Tests: Rider 28 suites / 121 passed plus new pickup confirmation 3 tests; Driver 6 suites / 15 passed; source parse 873 Rider / 708 Driver files passed. Generic App.test native/mock failures remain excluded.
- User explicitly authorized Driver 195 wallet reset: -25.13 to 0, compensating credit history ID 80 retained; no history deleted. Initial adjustment failed because live history schema lacked currency columns; transaction rolled back before successful retry with actual columns.
- User explicitly authorized Admin driver_min_wallet_balance change for all drivers: 10 to 0 (TaxidoSetting ID 2). Both phone state and backend confirm Driver 195 wallet 0 and online=1, is_on_ride=0. These are persistent live settings/account changes.
- Began UI preparation only: Rider 179 selected Auto Parcel and searched a Jalgaon destination. No booking submitted by automation. User then said they will test; automated phone navigation stopped. Driver remains online for their test. No simulated parcel handoff, pickup OTP, cash receipt, rating or completed booking was performed in this pass.
- Not complete: live end-to-end acceptance, confirmation, OTP, arrival/handoff, payment, rating and Admin realtime checks. No new full standalone APK copied; changes are available through the connected debug apps.

## 2026-11-06 - Rider driver-details white-screen correction
- User reported Rider turning white after tapping the assigned driver. Captured A142 white screen read-only.
- Found unsafe nested access to driver.vehicle_info.model / plate_number in DriverInfo; absent vehicle_info could throw during rendering. Also guarded absent route params.
- Driver profile navigation now includes the booking vehicle snapshot; details use booking model/plate before profile fallbacks. Header has a safe Driver details title.
- Verification: four React render regression tests passed for absent params, absent/null vehicle_info and a real booking vehicle fallback. Hot reload recovered Rider to Home with live delivery #100267 still present; no booking, OTP, payment or cancellation was submitted.
- Pending manual confirmation: reopen the active delivery and tap the driver to verify the full details screen on A142.

## 2026-11-06 - Imported ride-motion and pickup-card references
- Inspected both user ZIPs and their placement guides. Browser simulation controls, example contacts and demo PIN 4826 are not used by the apps.
- Implemented native orange/charcoal motion scenes for searching, approaching, arrived and delivery in progress. Status comes from LiveBookingProvider; no simulated GPS/ETA is displayed. Motion stops for reduced-motion/background states; arrived vehicle remains stationary.
- Rider Home now has one active-booking motion strip in normal layout immediately above bottom navigation, removed when inactive and hidden while typing. Tap uses the existing openBooking route resolver. Notification page retains the same booking card.
- Rider arrived screen and Driver pickup PIN screen use matching PickupCard components, actual booking people, vehicle plate, pickup address and existing call/chat routes. Driver retains goods/receiver data and a scrollable PIN form.
- Driver PIN is submitted only by the explicit Verify PIN & start delivery button through the existing server verification. Four-digit validation and an in-flight guard prevent empty/double submissions; errors remain visible. No extra delivery OTP added.
- Pickup cards merge confirmed realtime snapshots; existing read-only recovery remains. Rider route-derived ETA is shared with the Home card and native notification, expires after two minutes and is not reused for the wrong trip phase.
- One quiet ongoing Android notification is updated in place, with actual booking IDs/deep link, search countdown, pickup wait chronometer, actual address and available route ETA. Android renders its own notification layout; the HTML notification was a design reference, not embedded animated lock-screen content. Completion/cancellation clears it.
- Verification: Rider 13 relevant tests and Driver 5 tests passed (phase mapping, multi-drop next address, missing/stale ETA, contacts, native notifications, booking identity). Earlier four Rider driver-details render tests and three pickup vehicle confirmation tests also passed. Changed TSX sources parse successfully.
- Read-only screenshots confirmed the arrived live strip on A142; Driver was on Home. User chose to test pickup screens and booking progression themselves. No PIN, booking, payment, cancellation or contact action submitted during this integration; full cross-phone journey confirmation remains with user testing.
- Debug apps hot-reloaded; no new standalone/release APK built. Source references extracted under D:\DROPA2Z\design-imports-20261106.

## 2026-11-06 - Incoming request vehicle mismatch confirmed
- User reported Rider booking missing on connected Driver. Read-only device and live database checks confirmed Driver 195 is online, verified and idle, registered with Auto vehicle type 16 / category 43.
- Latest Rider 179 requests #100271 and #100270 requested Bike vehicle type 15 / category 42 and had no assigned driver. The connected Auto driver is not eligible for these Bike requests.
- No vehicle assignments, matching rules, booking statuses or account data changed. Asked user to book Auto Parcel for this paired-phone test. This diagnosis does not establish realtime dispatch success; an eligible Auto booking still needs confirmation.

## 2026-11-06 - Driver incoming request slider integration
- Imported dropa2z-driver-request-slider.zip and placement guide. Recreated its native orange/charcoal offer card for Parcel/Freight/package requests; no demo replay/sample amount/sample route used. Existing unrelated service cards and bidding routes remain available.
- Card shows actual vehicle artwork, goods/weight/description, server driver earnings (driver_commission); total-only fallbacks are accurately labelled Booking fare. Shows every intermediate drop plus pickup distance when the existing route request provides it.
- Native horizontal slider requires 95% swipe completion, protects pending/successful submissions from duplicate gestures, supports accessibility activation, resets after rejection and calls the existing acceptance API. Pickup opens only after confirmed assignment; offers assigned to another driver are rejected locally after server response.
- Decline now waits for confirmed API success before removing the request. HTTP/business errors stay retryable. Removed duplicate imperative-ref declarations and duplicate local decline callbacks for this component.
- Offer availability uses server deadlines; terminal/assigned/expired offers are removed from the incoming list. Driver acceptance deadline/current driver ID are now included in the HTTP resource so polling does not lose the deadline already present in broadcasts.
- Additive resource fields deployed after PHP lint; backup /home/dropa2z/driver-offer-resource-backup-20261106-071449.php. No database, assignment rules or wallet changes.
- Nine focused tests passed across request slider/card, expiry/earnings and accept/decline API errors. Changed TSX parses and connected A009P Driver runtime responds. Hot reload active, no APK build or automated live acceptance/decline performed. Next eligible booking requires user confirmation for physical swipe/assignment result.
- Read-only runtime inspection shows Driver 195 wallet now -25.96 after user testing. Left unchanged; existing wallet eligibility may affect subsequent request delivery.

## 2026-11-06 - User-authorized negative wallet reset for all Riders and Drivers
- Reset every negative non-deleted Driver/Rider wallet to zero in one locked database transaction; positive and zero balances were not updated. No historical wallet transactions deleted, no pricing or future commission rules changed.
- Four Driver wallets credited: accounts 181 (+168.60), 182 (+67.64), 183 (+20.16), 195 (+25.96); Driver history IDs 84-87.
- Three Rider wallets credited: accounts 179 (+55.00), 184 (+55.00), 193 (+25.00); Rider history IDs 25-27. Total adjustments 417.36.
- Operation negative-reset-20261106-125126; private pre-change snapshot /home/dropa2z/negative-reset-20261106-125126-before.json, permissions 0600. Retained one-off script outside public_html at /home/dropa2z/reset-negative-wallets-20261106.php.
- First invocation used the home directory default PHP 8.2 and stopped before Laravel boot/database writes. Executed successfully with explicit cPanel PHP 8.3 from public_html.
- Post-commit verification: remaining negative Driver wallets 0; remaining negative Rider wallets 0. App wallet display may require reopening Wallet to refresh.

## 2026-11-06 - Driver pickup PIN hidden by keyboard
- Read-only screenshot on A009P confirmed the new pickup card pushed the PIN below the numeric keyboard. Legacy react-native-otp-textinput did not register focus with the Gorhom bottom sheet.
- Replaced this pickup-only input with a controlled BottomSheetTextInput, four numeric digits, same server verification callback and explicit Verify PIN & start delivery action. Kept PIN input in the brand font.
- Sheet uses fillParent keyboard behavior with adjustResize. Focus and keyboard-show events measure the PIN section inside its content and scroll it into view. Removed callbacks that repeatedly forced a sheet snap during keyboard transitions.
- No verification, trip state, wallet, payment or cancellation submitted. Source parses. Reopened Driver after a blank hot-reload screen, without clearing data. Phone later showed Android Home; asked user to reopen the active pickup for final keyboard visibility confirmation.
- Prior missing-request investigation: last Auto request #100277 was created before the wallet reset and later cancelled; subsequent server read confirmed Driver 195 eligible and nearby with balance zero. User then created a fresh Auto request and reached the Driver pickup PIN screen. Did not independently submit or complete the booking.

## 2026-11-06 - Driver startup recovery after PIN hot reload
- User reported Driver would not start. Confirmed Metro 8082 running and USB reverse configured; launched existing debug app without clearing data or installing anything.
- A009P screenshot startup-after-keyboard-fix.png confirms Driver Home rendered; app PID 8169 remained alive on follow-up.
- Android crash buffer identifies a native SIGSEGV in librnscreens.so: rnscreens::NativeProxy::cleanupExpiredMountingCoordinators / nativeAddMutationsListener at 13:04:16, during a previous reload (not the current successful process). This is distinct from JavaScript PIN validation. Saved trace ui-crosscheck-20261104/driver/native-navigation-reload-crash.txt.
- Recovery confirmed, permanent native reload-crash correction remains pending. No OTP, booking, payment or wallet action submitted.

## 2026-11-06 - Repeat-booking wallet eligibility correction
- Confirmed first cash delivery #100278 completed and Driver195 remained online/idle, but wallet fell to -29.11 from commission/tax/platform debits. Next Auto request #100280 had no driver candidates because matching always enforced wallet >=0 despite Admin Allow Negative Balance=1.
- Added DriverWalletPolicy::minimumRequired and made candidate wallet filtering respect the existing Admin negative-balance setting. Missing/disabled allowance still enforces the nonnegative configured minimum; an existing wallet is still required. No fee records or balances overwritten.
- Driver Home low-balance prompt now uses the same policy, normalizes string/boolean settings and updates when Admin config changes.
- Verification: 8 Driver unit cases passed, server PHP unit tests 2 tests/10 assertions passed, PHP lint passed. Deployed trait backup /home/dropa2z/driver-wallet-trait-backup-20261106-075532.php. Existing Admin setting unchanged.
- Later read-only check with reconnected server 1430d62a-587a-42b1-9add-4adb5575e983: request #100283 candidate list includes195, demonstrating matching now passes the negative-wallet driver. That request is now cancelled. Driver195 currently offline/idle, wallet -61.18; wallet gate null as intended. Full receipt/acceptance of a fresh repeat booking still needs user confirmation while online.
- Both phones authorized via USB, Metro8081/8082 running, reverse ports restored and apps launched. No booking/OTP/payment/cancellation/online state submitted by the agent.

## 2026-11-06 - Refined launcher icons and vehicle-choice artwork
- User confirmed the repeat-booking request fix works in their manual test.
- Imported supplied dropa2z-app-icons-refined.zip and dropa2z-app-vehicle-assets.zip, without redesigning their contents. Rider uses customer orange icon; Driver uses charcoal/orange driver icon. Packaged Android legacy/adaptive sizes and iOS app-icon slots. In-app wordmarks remain unchanged.
- Choose a Vehicle rows and Review Booking use supplied local WebP imagery. Existing selected-vehicle details panel shows full-width 1040:720 illustration. Mappings use backend names/slugs for bike, classic auto, roof-rack auto, electric rickshaw and cargo auto; unknown vehicles retain the existing image fallback. No extra vehicle options, prices, capacity limits or booking routes added.
- Dimension illustrations are explicitly labelled examples, not enforceable vehicle load limits. Existing selection, fare, coupon and confirmation handlers retained.
- Validation: five changed TS/TSX files parsed successfully; all 6 existing booking-review tests passed. Android debug Rider build passed in 1m48s and installed on A142. Driver build/install verification recorded below. iOS artwork packaged only, no iOS build performed on Windows.
- Driver debug build passed in 2m12s; installed successfully on A009P. Metro8081/8082 running. Rider Home screenshot confirms startup. Driver hit native SIGSEGV on first post-install startup; reopened for recovery. New launcher assets and chooser visuals do not resolve the pre-existing native startup stability issue. No live booking submitted during this asset update.
- Recovery: Driver PID5409 remained alive and screenshot refined-icons-reopened.png captured after reopening. Crash top frame was React Native MountingCoordinator::pullTransaction / FabricUIManagerBinding (not confirmed identical to the earlier rnscreens crash). Physical Choose a Vehicle artwork/selection remains for user visual testing; six review regressions passed.

## 2026-11-06 ? Rider/Driver change batch, registration photos and mandatory practice
- Detailed implementation and honest test status: DROPA2Z_CHANGES_2026-11-06.md.
- Rider: Home/Shop/Godown (user confirmed), receiver contact import, removed parcel Description/toll notice, shared-pool Scooter choice, delivery Home back controls, compact pickup actions.
- Driver: separated map controls, Nearby label, higher request sheet, compact/scrollable pickup/drop panels, four PIN boxes, photo aliases, logout confirmation, functional unverified vehicle form and clear verified lock, supplied vehicle-photo gallery.
- Driver onboarding reordered to contact proof ? personal info ? vehicle ? KYC ? Admin review. Added server-backed six-step practice and Pro Driver status after approval; captured real on-device practice examples without writing progress. Existing drivers grandfathered, new drivers gated before online; live Admin driver details shows training status.
- Backend deployed with backup /home/dropa2z/nov6-driver-flow-backup-20261106-161359; migration applied; minimum set to 10 with Allow Negative Balance=1 unchanged. Queue worker confirmed running.
- Checks: 21 Rider + 16 Driver + 3 PHP tests passed (40 tests total); PHP training tests 16 assertions; staged PHP lint and changed TSX parsing passed. Live accepted-booking/PIN keyboard, contacts permission, unverified vehicle save, fresh signup/Admin approval/training completion and logout still require manual confirmation. No standalone release build performed for this batch.

- Additional verification: live Admin Driver Details Blade template compiled and passed PHP syntax checking. Driver authenticated read snapshot confirms minimumWalletBalance=10, existing account training.required=false, progress0/pro_driver=false. Vehicle Registration and supplied photo gallery rendered on A009P; Rider Home/Shop/Godown confirmed by user.

- Replaced the temporary Scooter vector with the supplied scooter.webp (58,882 bytes), byte-identical in both apps. Rider vehicle chooser/review/details and Driver registration thumbnails/expanded photo now use it. Selection, shared Bike pricing and dispatch unchanged. Asset hashes and TSX parsing verified.

### 2026-11-06 16:48 IST - Authorized live Rider/Driver reset
- User explicitly confirmed clearing live Rider/Driver accounts for fresh testing while preserving Admin/staff.
- Created private full database backup before mutation: /home/dropa2z/account-reset-20261106/before.sql (3,108,281 bytes, mode 0600); manifest/checksum, affected-row snapshot and result stored alongside it outside public_html.
- Soft-deleted 25 active app-only accounts: 19 Rider roles and 7 Driver roles, one shared Rider/Driver identity. Previously archived app accounts remain archived; disabled their app presence and cleared push/session credentials.
- Archived 24 visible scoped deliveries, 84 scoped requests, 4 addresses, 18 Rider wallets, 7 Driver wallets and 7 vehicle profiles. Historical financial transactions and uploaded files retained; no cancellation fees or booking notifications triggered by this administrative archival.
- Revoked 36 scoped app access tokens, removed 39 stale offer links and 36 scoped OTP records. Identifiers shared with protected accounts were excluded from OTP removal.
- Preserved all non-app-only identities, including Admin, dispatcher, custom staff and Fleet roles. Protected user rows, role links and access-token rows verified byte-equivalent before commit; 7 active protected accounts remain.
- Independent post-check: Rider model count 0, Driver model count 0, cleared accounts online 0, visible scoped deliveries 0, scoped app access tokens 0. App accounts remain recoverable in Trash; this is not a permanent financial-history purge.
- No APK build or installation required. Reopen/logout of cached app session and register fresh; native fresh registration/KYC/Admin approval/practice flow still needs user testing.

### 2026-11-06 - Latest standalone APK delivery
- Built both current release variants in parallel with 6GB heap and six Gradle workers each; Rider BUILD SUCCESSFUL in 3m38s, Driver BUILD SUCCESSFUL in 11m21s.
- Saved PC Downloads/Dropa2z-Full-20261106-Latest.apk (102,546,392 bytes) and Dropa2z-Driver-Full-20261106-Latest.apk (144,082,472 bytes).
- Checked signatures, existing test-certificate compatibility, 16KB zip alignment, non-debuggable manifest, embedded JS bundles, all four native ABIs, latest receiver import/Driver practice markers, supplied Scooter asset by SHA256, and training screenshot bundle reference.
- Phone copies use the existing test certificate for update/Google credential compatibility; original Gradle artifacts retain configured production upload signing. These delivered standalone APKs are for sharing/testing, not Play upload artifacts or a production-readiness certification.
- Package helper now checks current Nov6 assets; handles Android resource-name shortening using image-content hash rather than filename.
- Both APKs copied to both connected phones (A142/A009P) Download folders; device SHA256 checked against PC files. Existing debug apps not replaced, preserving hot reload.
- User asked whether all bugs verified would imply production readiness: explained conditional readiness, while fresh signup/KYC/training/complete live booking checks remain pending.

### 2026-11-10 - Search, saved-place and delivery-form changes
- Reviewed all three JPEG examples from Downloads/WhatsApp Unknown 2026-11-10 at 12.25.27.zip; extracted privately to D:/DROPA2Z/design-imports-20261110. User clarified: remove Bike Freight only, retain Bike Parcel/Scooter; remove Receiver/Parcel words from form labels only, retain contact and delivery data.
- Rider offering list now Bike Parcel, Auto Parcel, Cargo Auto. Bike Freight removed from getGoodsServiceOptions across Home/Services. Cargo Auto preserves the existing freight API IDs, category slug and rate/matching configuration. Shared display wording in Rider/Driver maps Freight/Auto Freight to Cargo Auto without changing API keys.
- Driver registration excludes ride-freight-bike, and the photo gallery cannot select the Freight Bike category; Parcel Bike/Scooter remain supported. Driver sources parsed; no second phone connected to visually verify Driver today.
- Delivery form: Delivery details, Contact name, Contact number, Enter weight and optional packed-item photo wording. Contact chooser says Choose the contact; actual permission, selection, editable name/number and payload preserved.
- Home pickup marker/outline green, destination marker/outline orange. Each endpoint and intermediate stop gets a right-hand map icon with Choose on map (latest exact user wording) routed to that specific field. Separate Locate on Map above Proceed removed on Home.
- Select multistop control added beside the plus. Intermediate drops and final destination can be reordered with drag handles; the selected address, full address and coordinates move together into the quote/booking payload. Pickup stays fixed. Existing max three intermediate stops retained.
- Dropdown suggestions retain scrolling and keyboard taps. Each result has an independent bookmark save action using the authenticated saved-location API; saving does not select a different booking endpoint. Home/Shop/Godown category icons replace orange text buttons; selecting an icon arms automatic categorized save when the next address suggestion is selected. Duplicate saves are prevented; errors shown; Redux refresh updates Your places.
- User explicitly confirmed the new Home-icon -> address selection -> Your places/Home persistence works on phone.
- Banner collapses to its header while editing so suggestions remain above the keyboard; restores when editing ends. Existing banner carousel preserved.
- Booking Preferences trigger/sheet/payload removed; empty stable preference selection prevents hidden optional preference fees. Payment, Myself, coupons and core fare logic preserved. Myself icon enlarged to 28px.
- A142 connected (00077344Q001174). Existing matching debug APK installed without clearing app data; Metro 8081 started and reverse set. Source updates loaded by hot reload; full reload performed after hook structure changes. No standalone APK rebuilt, no backend settings or live bookings changed.
- Verification: 19 focused Jest tests passed across five suites (service routing/removal, address+coordinate reordering, map target callbacks, independent bookmark action, category icon callbacks/payloads, duplicate prevention, API failures and existing saved-place CRUD). Changed TSX modules parsed. Screenshots saved under D:/DROPA2Z/ui-crosscheck-20261104/rider/nov10-*.png. Physical drag/order-to-fare confirmation, contact permission and quote/booking controls remain user live checks; no test booking submitted.

### 2026-11-10 - Follow-up category layout and Settings organisation
- Latest user wording overrides earlier map wording: Choose on map icon reduced from 19 to 15px and caption from 9 to 8px in pickup/drop; right-side targets retained.
- Removed Your places tabs/address blocks from Home entirely. Existing saved addresses retained and visible through Settings -> Saved Locations, grouped under Home, Shop, Godown and custom categories. Legacy address types/titles remain visible; Edit/Delete/Copy/select callbacks unchanged. Category icons shared between dropdown and Settings cards.
- Dropdown category icons now include name captions. Added an always-accessible plus and horizontally scrolling category row with scrollbar. Plus opens validated category-name modal, persists under the account-scoped category key, and preselects the new category for the next chosen suggestion. Custom category locations are stored through the existing authenticated API; empty custom-category labels remain account-scoped on device, as in previous Your places design.
- Preserved automatic category save (user had confirmed Home and Shop save earlier), duplicate prevention, refresh and visible error handling. Creating a category returns focus to the same address field; no booking submitted or profile/contact data edited by automation.
- A142 visual check: Home has smaller map labels and no Your places section; Settings shows Home(1), Shop(1), Godown(0) with existing user addresses. Returned phone to Home. Screenshots nov10-home-final.png, nov10-saved-groups.png and nov10-labelled-categories.png saved in prior crosscheck folder.
- Final focused verification: 23 tests passed across six suites, including category creation/persistence/reload, custom grouping without address loss, scrolling-row plus callback, auto-save payloads/duplicates/failure, map targets and delivery coordinate reordering. Changed modules parsed; hot reload running. No APK build or backend deployment performed.

- 2026-11-10: two-service-only policy deployed (Bike Parcel / Auto Parcel); Freight/Cargo Auto and old test categories disabled with backup. Server validation 6/6 passed; Rider focused tests 26/26. Outside-dropdown dismissal visually verified on A142. Category-delete, common keyboard and two-banner source changes loaded; Driver physical matrix pending. See DROPA2Z_CHANGES_2026-11-10.md for evidence and limitations.

- 2026-11-10 16:27 IST: both full standalone APKs built, verified, copied to A142 Download with matching SHA256, and installed successfully. Rider Home and Driver onboarding opened. Current filename tag 20261110-Latest; see Nov10 changes log for checks, hashes and test-signing scope.

### Nov11 Services and deletion follow-up
- [x] Square Rider service cards with live rates, capacity and honest ETA description.
- [x] Approved actual Bike9/km, Auto14/km rates deployed; Auto90kg/Bike20kg boundaries checked.
- [x] Settings spacing; two-step self-deletion, Admin-unlockable restriction after second deletion; isolated tests and physical cancellation check.
- [ ] User visual confirmation of Services and Admin registration-unlock screen; real-account deletion not attempted.
See DROPA2Z_CHANGES_2026-11-11.md for evidence and APK.
