# Dropa2z Project Log

Project-wide record for the Rider app, Driver app, Laravel backend, and Admin panel. This consolidates the work and reported issues from the conversation and the existing Rider developer notes. A code change is marked **implemented locally** until it is verified against the deployed backend and the apps on phones.

## Working agreement

- Work on one requested feature at a time; keep later features in the backlog until asked.
- Prefer live testing on the connected Rider and Driver phones.
- Do not build APKs unless testing requires a native rebuild or the user requests one. When a build is needed, report the command and target device.
- Do not treat a local backend change as deployed or a code edit as a confirmed fix.
- Current phone mapping: Rider phone `00077344Q001174` (A142), Driver phone `00382769S001692` (A009P). Rider Metro uses port `8081`; Driver Metro uses port `8082`.
- Related Rider notes: [Taxido_user/DROPA2Z_DEV_NOTES.md](Taxido_user/DROPA2Z_DEV_NOTES.md).

## Work completed or recorded so far

### Project setup and branding

- Set the Rider and Driver Android identities to Dropa2z package names and display names; adjusted app colors, logos/icons, and loading/splash branding in local source.
- Set both apps to use the Dropa2z backend URL.
- Kept separate Metro servers for simultaneous Rider and Driver testing.
- Earlier phone tests showed stale Taxido branding and white/localhost loading screens. Those screens depend on the installed native build and the correct Metro process; verify each branded screen on-device after changes.

### Maps, location, and search

- Rider location, city/address lookup, and destination suggestions were investigated after the app showed â€œAddress not foundâ€ and suggestions failed.
- The Rider Google Maps key was changed per the userâ€™s instruction. Geocoding and directions configuration were discussed and enabled by the user in Google Cloud.
- Local map/search changes exist in the working tree; verify them on the current phone and against the active backend/API keys before marking location search fixed.
- Never copy API key values into this log.

### Authentication and driver registration

- Rider supports phone OTP and Google sign-in; the user requested email OTP as a fallback where SMS is unavailable.
- Driver phone/email OTP login uses one identifier field. Helper text now explains phone â†’ SMS OTP and email â†’ email OTP.
- **Implemented locally today:** added Google Sign-In to Driver using the same React Native Google Sign-In package/configuration pattern as Rider; added a Laravel `driver/social/login` endpoint with Google ID-token verification; added registration proof handling so a driver can register after verifying phone, email OTP, or Google email.
- **Implemented locally today:** made phone and password optional for verified email/Google registration, and added a â€œadd mobile now or laterâ€ prompt after login/registration when a driver has no mobile number.
- Driver registration has previously failed to create an Admin-panel driver entry. The API/controller registration changes are in local source, but confirm the live Admin entry after deployment and registration.
- **Current live blocker:** Google account selection succeeds on Driver phone, but the request to the deployed API returns `404 api/driver/social/login`. The new Laravel route/controller is not present on the live backend yet. The checked local Laravel `.env` also has no `GOOGLE_CLIENT_ID`; configure the matching Rider web OAuth client on the deployed backend before retesting.

### Booking, rides, notifications, and Admin

The following issues were reported during Rider/Driver testing. Some related code has been changed locally across the apps and Laravel backend, but the user later reported that problems persisted. Keep these **open until reproduced and verified end-to-end**:

- Rider cancellation and Driver accept/cancel requests returning â€œtoo many requestsâ€ or server errors.
- Cancelled/previous rides remaining in the Driver active-rides list; Driver blocked from going offline by a stale active ride.
- Ride requests not appearing in real time for an active Driver; no new request visible to accept.
- Rider fare staying the same across trips.
- No Rider/Admin notifications, including no live Admin notification bar for bookings.
- Emergency contact selection not sticking.
- Android Back cancelling a pending ride without keeping it in History/Active rides.
- Wallet balance popup repeating or preventing a booking.
- Admin â€œGet Directionsâ€ failing until Directions API was enabled.
- Admin cancellation control missing or returning HTTP 500 after cancellation.
- A complete successful Rider â†’ Driver booking flow has not yet been confirmed.

Other Admin/backend topics reported: pages created in Admin not appearing on the public site, Admin booking notifications, and DNS verification. Track any live cPanel changes separately from local source changes.

## Current live test â€” 30 October 2026

- Confirmed both phones connected. Rider remains open on phone A142; Driver was open on phone A009P.
- Built and installed the updated ARM64 Driver debug APK on phone A009P because the new Google Sign-In dependency requires a native rebuild.
- Driver initially displayed â€œLoading from localhost:8082â€¦â€ because the existing Metro process was stale. Restarted the Driver Metro process on port `8082`; Metro then connected to `com.dropa2z.driver` and the Driver Home screen loaded.
- Used the existing Driver test session `9823971070` to reach Settings and sign out. No account data was deleted.
- On Driver Sign In, tapped **Continue with Google**. The Google account picker opened and returned successfully to the app.
- The backend call then failed with `404 api/driver/social/login`. This isolates the current test failure to the missing live Laravel route, not the native account picker. Do not claim full Google login works until the backend route is deployed and the phone test reaches Driver Home.
- The Driver login screen is live on phone A009P. The email OTP test result is recorded below; Rider was left untouched during this auth test.
- Continued on the same screen: entered the existing Driver test account email and requested OTP. The live API responded successfully; the app showed â€œOTP has been sentâ€ and opened the OTP verification screen for that email. This verifies the request/transition, not delivery or OTP code verification; the mailbox was not accessed.
- The Driver phone remains on the OTP Verification screen awaiting a code. No code was entered during this test window, so successful OTP verification and post-login navigation remain unverified.
- User clarified that this test should stay on Google sign-in. The email OTP check was outside the requested test; it was stopped, and Driver was returned to its sign-in screen. Future email-template work remains backlog only.

## Validation results

- Driver Metro bundle completed successfully.
- Laravel `DriverAuthController.php` and `routes/api/api.php` passed `php -l`.
- The changed Driver auth files passed the filtered TypeScript check. The project-wide TypeScript check reports unrelated baseline issues elsewhere.
- ESLint could not run because this checkout has no ESLint configuration.
- Driver debug build completed successfully and installed on phone A009P.
- Google account picker succeeded; API login is blocked by the live routeâ€™s 404, so end-to-end Google authentication is **not yet verified**.

## Backlog status - implemented locally on 30 October 2026

1. Rider email OTP: complete email verification, email-only new Rider registration, one-time proof consumption, and visible mail delivery errors.
2. Email templates: separate branded Rider and Driver sign-in code emails with 10-minute OTP validity.
3. Admin live booking bar: list waiting requests, assign an eligible online driver (who then confirms in the Driver app), or decline and notify the Rider and affected Drivers.

Status update (30 October 2026): Implemented locally. Changes are not deployed. Laravel/browser integration testing remains open because this checkout has no vendor directory.

## Append-only change note template

For each future task, append:

```text
### YYYY-MM-DD â€” Short task title
- Request:
- Changed locally:
- Deployed/live status:
- Test steps and results:
- Open bugs/blockers:
```

## 30 October 2026 â€” Driver/Fleet Google sign-in

- Request: add a clear Driver/Fleet role choice, then let the user continue with Google; use the same Google account that already works in Rider, and make the Google account chooser visible.
- Changed locally: Driver/Fleet role cards now show a selected border; Google sign-in waits for a role selection; the Google SDK clears its app-level remembered account before opening the chooser; Fleet Google service/action wiring was added.
- Deployed live: added `driver/social/login` and `fleet/social/login` routes with Google ID-token verification against the Rider web client ID already configured in the production environment. Driver registration accepts Google proof and can add Driver role/profile data to an existing Rider user row without duplicating that account. Production files were backed up in `/home/dropa2z/backup-driver-google-social-20261030-125255`.
- Tests: PHP syntax checks passed for both auth controllers and the API routes; Laravel route list shows all three Rider/Driver/Fleet social-login routes. On the connected Driver phone, selecting Driver â†’ Continue with Google displayed the account chooser; selecting the same Rider Google account opened Driver Create Account with the Google name/email filled in. No registration was submitted. Selecting Fleet â†’ Continue with Google reached the Fleet role check and correctly reported that this account has no Fleet Manager profile.
- Status: Google OAuth is verified and the Driver registration handoff works. This Google account is currently a Rider, so Driver Home is not expected until Driver registration is completed with the driver's service, vehicle, and documents. Fleet login needs an account with Fleet Manager role to test a successful Fleet Home sign-in.
- APK: none built. Changes were tested over Metro hot reload.

## 30 October 2026 â€” Driver registration document step white screen

- Request: fix the blank third registration step after the driver form.
- Cause: the live `api/document?type=driver` response returned an empty document list, and the screen rendered no content for that valid empty response. A failed document fetch also had no clear recovery state.
- Changed locally: the Driver document step now shows a loading indicator, a retry message if loading fails, and a clear empty state when no documents are configured. Next is disabled during loading and retries a failed fetch instead of silently skipping it.
- Test: over Metro hot reload on the connected Driver phone, the empty document state appeared with guidance. Tapping Next opened Vehicle Registration with service, category, and vehicle fields visible. No Android runtime errors appeared in the focused log output. No APK was built.
- Note: reloading Metro reset the unsaved registration form; the Google sign-in flow was reopened to verify this screen. No driver registration was submitted.

## 30 October 2026 - Email OTP and Admin live booking actions

- Request: complete Rider email OTP; create distinct Rider and Driver OTP email templates; add a live Admin booking bar with assign-driver and decline actions. Admin assignment sends the request to an online Driver, who confirms it in the Driver app.
- Findings: both apps already accepted email identifiers for OTP login. The backend used a generic email verification message, and new Rider email registration required a phone number and did not bind account creation to the verified OTP.
- Changed locally: added separate branded sign-in code emails; report real mail delivery failures and discard failed-send tokens; normalize emails and use a 10-minute OTP lifetime for login and registration proofs; bind Rider registration to the verified email/phone and support email-only registration. Rider login now shows mail errors.
- Changed locally: added Admin live-request polling, eligible online driver choices, stale-request checks, assignment with timeout handling, and decline that updates the request and notifies the Rider and affected Drivers.
- Tests: PHP lint passed for the changed Laravel controllers, Mailable classes, and Admin routes. The focused Rider TypeScript check showed no errors in changed files; the full project check exits non-zero for baseline errors outside those files. Laravel has no installed vendor directory, so framework, mail transport, database, and Admin browser tests could not run. No APK was built and nothing was deployed.
- Open: deploy and run end-to-end tests with production mail, Reverb/broadcasting, the queue worker, and an Admin account with `ride_request.index` and `ride_request.edit`. Confirm an eligible online driver appears in Admin and receives the assignment in the Driver app.

## 30 October 2026 - Rider and Driver email OTP deployed

- Deployed to the live Laravel app at `/home/dropa2z/public_html` after confirming its `public/index.php`, `.env`, and API routes. A timestamped backup is in `backup-email-otp-live-20261030-134903`.
- Added separate branded Rider and Driver OTP emails. Email delivery failures now return an error and remove the unsent token. Login and registration proofs expire after 10 minutes. Consumed codes are removed by token value because the production `auth_tokens` table has no `id` column. The temporary test-login token bypass was excluded from production.
- Live checks: PHP syntax checks passed; Rider and Driver login and verify-token endpoints each returned HTTP 200; login accepted the email and verification succeeded. `demo_mode=false`; no test token was included in either response. The Rider account verified as registered. The same email has no Driver account, so Driver OTP verification correctly returned `is_registered=false`.
- Test access token created during Rider verification was revoked; test OTP rows were consumed by verification. No APK was built.
- At the time of the OTP deployment, the Admin live-booking panel had not yet been deployed; it was deployed later the same day (see the follow-up entry below). The post-trip optional review popup is also implemented locally (see below).


## 30 October 2026 - Admin live bookings deployed and optional post-trip review prompt

- Admin live bookings: deployed a new ride-request notification controller, three permission-protected routes (feed, assign, decline), and the top-right live bookings panel with five-second polling. Production backup: `/home/dropa2z/public_html/backup-admin-live-bookings-20261030-135331`. PHP lint, route-list checks, and Blade view cache clear passed. Admin browser actions were not exercised against a live booking, to avoid changing a real ride during the OTP test.
- Rider review prompt: added an optional post-trip prompt in the live Payment screen and completed-ride details. It offers a close/skip action, persists dismissal per ride, requires a star rating to submit, and leaves the comment optional. The existing manual Review action remains available. Review submission refreshes the ride list.
- Tests: the active Rider Metro server compiled the Android JS bundle successfully (HTTP 200; about 22.6 MB). TypeScript reports no errors in the changed review prompt, Payment, or pending ride screen files; the full project type check still reports pre-existing errors in the untouched ambulance payment screen. No APK was built. ADB currently reports no connected devices, so the popup has not been visually exercised on a phone yet.

## 30 October 2026 - Driver login keyboard visibility

- Request: keep the email/phone identifier and typed text visible when the Android keyboard opens on Driver sign-in.
- Cause: the sign-in panel was absolutely positioned 30% down the screen with a fixed full-screen height, so Android's keyboard resize left the identifier input behind the keyboard.
- Changed locally: the panel now moves under the header while the keyboard is open, hides the decorative background artwork, and places the login content in a scrollable view with keyboard taps preserved.
- Live check: Driver Metro hot reload on port 8082; ADB reverse restored for the connected Driver phone. Opened the identifier field and entered `test@example.com`; the full value remained visible with the keyboard open. The sample was not submitted and no OTP was requested. No APK was built.

## 30 October 2026 - Rider and Driver test data reset (production)

- Request confirmed: clear Rider and Driver accounts and their related test data; preserve admin and staff accounts.
- Verified the target was the live production app at `dropa2z.com`, not the local `localhost` database. Created a full SQL backup before changes at `/home/dropa2z/dc-backups/dropa2z-db-reset-pre-20261030-164839.sql` (owner-only permissions).
- Soft-deleted 19 active Rider accounts and 6 active Driver accounts through their Laravel models. This also soft-deleted their associated account data (addresses, wallets, payment accounts, ride history, driver vehicles/documents, withdrawals, subscriptions, and reviews where present). One Rider already archived before this reset remains archived.
- Soft-deleted 47 active ride requests linked to these accounts; removed 12 request-driver links and 47 request-zone links; revoked 33 associated API tokens. No in-progress rides were found; the 4 linked rides were already cancelled or completed.
- Post-reset verification: 0 active Riders, 0 active Drivers, 0 active rides, and 0 active requests linked to the reset accounts. Preserved all other roles; active counts remain 3 admins, 1 dispatcher, 2 fleet managers, and 1 `Test Role`. One active ride request unrelated to the reset accounts remains.
- No APK was built. The soft-deleted data can be restored from the SQL backup if needed.
## 30 October 2026 - Rider Google account chooser

- Request: show the Google account chooser on Rider sign-in instead of immediately reopening the previously used account.
- Changed locally: Rider now calls `GoogleSignin.signOut()` before `GoogleSignin.signIn()`, matching the Driver sign-in behavior and allowing sign-out errors to fall through to the chooser.
- Live test: hot-reloaded the Rider app on the connected phone through Metro on port 8081. Tapping Google displayed the chooser with the device's available Google accounts and an `Add another account` option. No account was selected, and no Google login or backend registration was completed.
- No APK was built.
## 30 October 2026 - Rider OTP keyboard layout

- Request: keep the Rider OTP fields and Verify action accessible while the Android keyboard is open.
- Changed locally: the OTP screen now tracks keyboard visibility and passes it to the shared auth container. The container collapses its header and hides decorative artwork while the keyboard is open, moving the form to the top of the resized, scrollable view.
- Hot reload: Rider was reopened through Metro on port 8081 and returned to its Home screen without a white screen. The OTP screen was not opened in this pass, and no OTP was requested or submitted, so the keyboard layout still needs visual confirmation on that screen.
- No APK was built.
## 30 October 2026 - Driver email OTP keyboard layout

- Request: move the email OTP form upward when Android's keyboard opens so the code fields and Verify button remain visible.
- Changed locally: the OTP screen tracks keyboard visibility. While visible, the shared email-auth template hides the illustration area and expands the verification card to the resized window; Android already uses `adjustResize`.
- Hot reload: Driver Metro on port 8082 returned HTTP 200. After reload the app returned to Driver Sign In; the OTP route was reset, so the keyboard layout was not visually rechecked on that route. No OTP was requested or submitted, and no APK was built.

## 30 October 2026 - Driver universal release APK

- Request: build the Driver APK and save it in the Windows Downloads folder.
- Build: `assembleRelease` succeeded in 8m 42s. Produced a universal release APK containing `armeabi-v7a`, `arm64-v8a`, `x86`, and `x86_64` libraries.
- Delivered file: `C:\Users\mishr\Downloads\Dropa2z-Driver-Universal-2026-10-30.apk` (85,548,768 bytes; SHA-256 `BDB62BDBBC7216B4CBD502B386886644BCA95000AB8082D0029C4E52BE575631`).
- The temporary `universalApk true` setting used for this build was restored to `false`. The APK was not installed on a device. Release signing uses the project's configured debug keystore, so this artifact is for testing and is not a production Play Store-signed build.

## 30 October 2026 - Rider name and launch branding; install both apps on A142

- Request: label the main Rider app `Dropa2z`, add “Associated with SK Translines” below the logo on both app launch screens, and put both APKs on the A142 Nothing Phone 2a.
- Changed Rider Android launcher label to `Dropa2z`. Added the requested subtitle below the bundled Dropa2z logo on the Rider and Driver React Native splash screens.
- Built new universal release APKs successfully: Rider (`assembleRelease`, 2m 46s) and Driver (`assembleRelease`, 3m 20s). Both include `armeabi-v7a`, `arm64-v8a`, `x86`, and `x86_64`.
- Copied the APKs into `C:\Users\mishr\Downloads` and `/sdcard/Download` on device serial `00077344Q001174` (A142). Installed both APKs successfully; package paths were verified on-device.
- Captured the two live launch screens to `C:\Users\mishr\Downloads\Dropa2z-Rider-Splash-Preview.png` and `C:\Users\mishr\Downloads\Dropa2z-Driver-Splash-Preview.png`; the logo and subtitle are visible on both.
- Restored each project's temporary `universalApk` setting to `false`. These release APKs use the project's configured debug keystore and are for testing, not Play Store production signing.

## 31 October 2026 - Rider saved locations persistence

- Request: saved locations added from Rider Settings were not appearing in the saved locations list.
- Cause found: the shared API helpers return failed HTTP responses instead of throwing; the saved-location service propagated them as ordinary responses, so the save thunk could appear fulfilled and navigate away. The list also did not reload whenever the screen regained focus.
- Changed Rider: saved-location service now rejects non-2xx/network responses for create, read, update, and delete; location coordinates are represented in the request type; add/update awaits the write and list refresh before returning; Saved Locations reloads on focus.
- Verification: ARM64 Rider debug APK built successfully and installed on A142; Metro on port 8081 connected and Rider Home rendered. Added `Codex Saved Location 31Oct`, left Settings and reopened Saved Locations, and verified the entry was still present. Deleted the temporary test entry afterward and verified the list returned to empty. Full TypeScript check reports numerous existing errors in the app; no errors were reported in the saved-location service or data interface. Marked fixed by on-device test.
- ADB currently has both A142 and A009P connected. A142 is running the Rider debug build with Metro available for live testing.

## 31 October 2026 - Rider Settings cleanup

- Request: remove the RTL control, Driver Request entry, and Support Tickets entry from Rider Settings/App Pages.
- Changed Rider UI only: removed the Driver Request and Support Tickets rows from the profile menu and removed the RTL toggle from App Pages. Kept Arabic-triggered RTL behavior and layout support, chat with staff, and the underlying support-ticket and driver-request routes/features.
- Reloaded Rider on A142 through the existing Metro server on port 8081. The user confirmed all three entries are gone. No APK was built.

## 31 October 2026 - Rider pending-booking vehicle map

- Request: while a ride is awaiting acceptance, show the nearest available vehicle matching the selected type, its route to pickup, and distance in kilometers.
- A142 inspection showed the user was on the pre-booking Choose a Vehicle screen. The trip route was already requested there, but the map silently omitted the line when Google Directions returned an error.
- Changed Rider: the pre-booking trip map now draws a blue fallback line if road routing fails. During a pending request, the main booking flow refreshes online/idle drivers every 15 seconds, selects the nearest driver matching the chosen vehicle, and shows that vehicle's map icon, blue route to pickup, and route distance in km (straight-line distance fallback if routing fails). The selected vehicle ID is kept in sync with the booking request.
- Verification: Metro's Android bundle returned HTTP 200 and Rider relaunched on A142 through port 8081 without the previous Fast Refresh error. It returned to Home after the clean reload; visual booking verification is still pending. No APK was built.

## Queued bug - Admin table headers repeat at the bottom

- User reports that admin list pages show the ID/Name/Email/Status/Verified/Created At/Action column headings both above and below the table. The supplied screenshots show duplicate lower header rows on `/admin/user`, `/admin/rider`, and `/admin/driver`.
- Requested fix: keep the top column headers and remove the repeated bottom row across all Admin list pages. Audit other list pages for the same duplicated footer header before changing them.
- Status: queued; no Admin files changed for this issue.

## 31 October 2026 - Rider road-following booking route

- Follow-up to the booking-map report: the blue segment joined only the endpoints because the screen called the legacy Google Directions API, which returned `REQUEST_DENIED` for this project. The Routes API was enabled and returned a road route for the Jalgaon test coordinates.
- Changed `Taxido_user/src/screens/bookRide/mapBooking/index.tsx`: request road geometry from Google Routes API, decode its encoded polyline, draw that geometry for the pickup-to-destination route and pending nearest-vehicle-to-pickup route, and use the API's road distance for the km badge. Removed the legacy Directions/Leaflet routing calls and the straight-line fallback, plus the temporary diagnostic label.
- Verification: the Rider Metro Android bundle returned HTTP 200; both A142 and A009P remain connected. A142 is currently at Rider Home, so the refreshed road geometry has not yet been visually checked on the booking map. No APK was built.

## 31 October 2026 - Rider branded pickup/source marker

- Request: replace the default red source/pickup pin with a Dropa2z-specific marker.
- Changed Rider booking maps for Google Maps and OSM: the source/pickup now uses a blue-and-green Dropa2z pin with a white center and green “D”. Destination and intermediate-stop markers remain separate; pending vehicle marker remains unchanged.
- Verification: Rider Metro on port 8081 returned HTTP 200. A142 has its reverse connection to port 8081; visual confirmation on the booking map is pending because A142 is currently at Rider Home. No APK was built.

## 31 October 2026 - Admin decline reaches Rider and booking notice readability

- Report: Admin declined a pending booking, but the Rider app kept showing it. The live booking notification also rendered as a blank white toast and showed “Pickup location unavailable.”
- Root cause: Admin wrote a `cancelled` ride-request activity and a database notification, but sent no cancellation broadcast to the Rider’s existing private channel. Rider’s fallback polling only recovered accepted rides. The Admin notification formatter expected pickup data as an object while Rider submits location names as strings. Admin info-toast CSS set a white background without a readable text color.
- Changed Rider: listen for the Admin cancellation event and clear the pending state without issuing a second cancellation request; the existing 10-second request poll now also detects cancelled status as a fallback. Driverless-timeout handling no longer sends a duplicate cancellation update.
- Changed Admin: broadcast decline to the Rider’s private channel, display string or object pickup values, and set readable dark text for the white info toast.
- Deployed the Admin changes to `/home/dropa2z/public_html` using Remote Desktop Commander. Backup: `/home/dropa2z/public_html/backup-admin-decline-fix-20261031-122447`. Production PHP syntax checks passed and Laravel compiled views were cleared.
- Rider Metro bundle returned HTTP 200. The full Rider TypeScript check still reports existing project errors; it reports no type errors in the new decline handler or polling check. No APK was built. Two-phone live decline verification is pending; no live booking was changed during this implementation.

## 31 October 2026 - Admin live booking panel controls and trip locations

- Request: add minimize and maximize controls to the live booking card, make the request origin and destination visible, and make it clear where to open the map/details. The screenshot also showed blank white notice cards.
- Changed Admin panel: added accessible Minimize/Show and Maximize/Restore controls. The expanded panel grows to a 960px wide, viewport-height layout; the collapsed state keeps the header and request count visible.
- Changed live request data and card: normalize all location entries, show `From`, any intermediate `Via` stops, and `To`, and rename the existing map/details link to `View map & details`.
- Replaced Admin info toasts in the header with a visible, dismissible Dropa2z notice to avoid blank white toast cards.
- Deployed to `/home/dropa2z/public_html`. Backup: `/home/dropa2z/public_html/backup-live-booking-panel-20261031`.
- Verification: PHP syntax check passed locally and on production; `php artisan view:clear` succeeded; production grep confirmed controls, route fields, and notice handler are present. The current live request was not assigned or declined. Browser interaction test is pending user refresh and confirmation.

## 31 October 2026 - Compact minimized Admin booking panel

- Follow-up: the minimized booking header still overlapped too much of the Admin map page because it kept the expanded width and subtitle.
- Changed the minimized state to a 360px maximum width, shorter padding, hidden subtitle, and a position below the Admin toolbar. Minimizing now resets any maximized size; restoring opens the regular panel width.
- Deployed to `/home/dropa2z/public_html`. Backup: `/home/dropa2z/public_html/backup-live-booking-compact-20261031`.
- Verification: Laravel compiled views cleared successfully. User browser refresh and visual check are pending.

## 31 October 2026 - Place minimized Admin panel above map content

- Follow-up screenshot showed the compact live bookings strip still overlapping the Map View card because its top offset was below the toolbar-to-content gap.
- Moved the minimized strip to the top of that gap (76px from the viewport top), keeping the 360px compact width and short header.
- Deployed to `/home/dropa2z/public_html`; backup: `/home/dropa2z/public_html/backup-live-booking-position-20261031`.
- Cleared Laravel compiled views. Waiting for user hard refresh and visual confirmation.

## 31 October 2026 - Live Admin booking panel confirmed complete

- The user confirmed the Admin live booking panel work is complete. Marked the compact/minimize/maximize, map/details, and decline-to-Rider behavior items closed based on the user's confirmation.

## 31 October 2026 - Admin app chat visibility and reply access

- Next Admin bug: Rider/Driver conversations do not appear or cannot be replied to from Admin Chat. Root cause found: ride-chat room IDs contain ride, rider, and driver IDs, but Admin recent chats only queried rooms whose participant list already contained Admin. The list also keyed rows by person, which collapses separate ride conversations. The Admin's recent list did not refresh while app-only participants chatted.
- Changes: added a shared room authorization policy based on authenticated participants, the persisted ride/rider/driver relationship, or Admin `chat.index` permission; expose each ride conversation separately in Admin Recent Chats; keep Admin as an observer in ride rooms without dropping app participants; broadcast Admin unread updates and refresh the Admin chat list; protect the existing Admin chat AJAX endpoints with `chat.index`. Rider and Driver support chats now fetch the actual Admin ID instead of hardcoding ID `1`, while the backend keeps legacy support rooms accessible.
- Deployed to `/home/dropa2z/public_html`. Backup: `/home/dropa2z/public_html/backup-admin-chat-20261031-130440`. Production PHP syntax checks passed, Laravel route/view caches were cleared, and `api/chat/support` is registered.
- Rider and Driver TSX syntax checks passed; Metro produced Android bundles successfully for both apps (Rider on 8081 and Driver on 8082). ADB reverse is configured for A142 Rider and A009P Driver. No APK was built. End-to-end chat interaction remains pending user test.

## 31 October 2026 - Chat message refresh while conversations are open

- User reported that chat messages were not arriving live in Admin or the mobile apps. Found that both mobile Echo clients are explicitly disabled, while production Laravel resolves `broadcasting.default` to `null`. Reverb is running on loopback port 8080, and the public WebSocket URL returns 404, so the current host has no reachable WebSocket proxy.
- Added incremental message loading with `after_id`; initial history now returns the newest 100 messages. Rider and Driver chats check for new messages every 3 seconds while open. Admin checks an open conversation every 3 seconds and refreshes its inbox every 4 seconds. Only unseen messages are appended.
- Deployed the API and Admin page changes. Backup: `/home/dropa2z/public_html/backup-chat-live-sync-20261031-131350`. Production PHP syntax check passed and Laravel compiled views were cleared.
- Rider and Driver Metro bundles returned HTTP 200 after the changes. ADB reverse remains configured on A142:8081 and A009P:8082. No APK was built. Message exchange between two apps and Admin still needs user verification. This is near-live polling; true WebSocket push needs the host to proxy the existing Reverb service publicly.

### Follow-up: true chat push check

- Production still resolves `broadcasting.default` to `null`. Reverb has app credentials configured but listens only on `127.0.0.1:8080` over HTTP.
- Verified public TCP port 8080 is unreachable and `https://dropa2z.com/app/...` returns 404, so mobile/Admin clients cannot reach Reverb over secure WebSockets.
- The cPanel account cannot read Apache’s global configuration. A host-level WebSocket reverse proxy on TLS port 443 (or a managed public broadcaster) is required before enabling Echo clients and switching Laravel broadcasts to Reverb.

## Queued bug - Admin settings that control app behavior

- User requests an inventory of every Admin setting that is connected to Rider/Driver apps, with each setting marked whether changes propagate to the app and back to Admin.
- Requested workflow: first audit and report the list plus working/not-working status; wait for the user's direction before changing settings.
- Status: audited read-only on 31 October 2026; findings summarized below. No setting values were changed.

## 31 October 2026 - Admin settings-to-app connectivity audit

- Both apps fetch the general Admin settings endpoint (`/api/settings`) and the Taxido app-settings endpoint (`/api/cabbooking/settings?type=rider|driver`). Both live settings endpoints returned successfully. Admin repositories save these settings in the database; app changes are read on the next fetch, not pushed immediately. Apps do not write global Admin settings back.
- Taxido settings exposed to both apps include general branding/ambulance assets, app versions/splash/privacy links, map provider/key/radius, feature activation flags, ride limits/timing/units, wallet and commission settings, referrals, ads, and onboarding. `type=rider|driver` only filters onboarding; the rest of the settings bundle is the same for both clients.
- Connected app data outside the settings pages includes service categories, services/vehicle types, zones and pricing, languages/translations, payment methods, rider banners/coupons, and driver documents/rules/plans. These are fetched through their own APIs; app changes affect user/driver records, not these Admin configuration values.
- Static in the native apps: app name/icon and primary app colors. Taxido splash URLs are dynamic. The Google Maps API key is stored in Taxido settings and updates the Laravel environment, but the Android Maps SDK key is configured in the native manifest/build and is not read from the React Native settings object.
- Critical security finding: the unauthenticated `/api/settings` route returns the raw settings model. A read-only live check confirmed non-empty SMTP password, reCAPTCHA secret, Google OAuth client secret, and Firebase service-account private key fields in its response. No secret values were copied into this log. This needs a server-side safe-field response and credential rotation.
- No live setting was toggled to avoid changing production configuration. The endpoint and code paths were inspected; an Admin edit/save round-trip was not performed.

## 31 October 2026 - Driver chat composer visible with keyboard

- User reported that text typed in Driver chat was not visible while the keyboard was open. The composer was laid out below the keyboard because the chat screen did not use keyboard avoidance.
- Wrapped the Driver chat message list, image preview, and composer in `KeyboardAvoidingView`, matching the Rider chat behavior. The message list now flexes within the keyboard-adjusted area.
- Live-checked on A009P: opened Chat with Staff, focused the input, typed `DriverTest`, and confirmed the draft and composer remained visible above the keyboard. Cleared the unsent test draft afterward. No APK was built.

## 31 October 2026 - Admin settings app-side verification started

- Both physical devices are connected: A142 Rider and A009P Driver. Opened Rider to its home screen and Driver to its current verification-pending screen.
- Restored the USB Metro reverse mappings for Rider (device 8081 to host 8081) and Driver (device 8081 to host 8082); no APK or source changes were made.
- First reversible setting check is pending: compare Rider's Admin-configured splash image with the image shown after a fresh app launch. Waiting for the user to select a different already-uploaded Rider splash image in Admin and save it. No Admin setting has been changed by Codex.

### App-side settings test correction

- Source inspection showed Rider splash always renders the bundled DropA2Z logo; changing Admin's splash image would not be a valid propagation test. The first test is now Taxido Settings > General > Footer branding hashtag, which is rendered on Rider home by `BottomTitle`.
- During baseline navigation A142 stopped responding to ADB; the latest device list shows A009P online and A142 absent. No Admin setting was changed. Resume the Rider-side check after A142 reconnects and the user saves a temporary hashtag value.

### Rider Admin-setting propagation check

- User reported setting the Footer Hashtag to `#Demi` in Admin.
- A fresh, cache-busted GET of `/api/cabbooking/settings?type=rider` still returns `#Demo` for `general.footer_branding_hashtag`; the Admin save is not reflected by the Rider settings API yet.
- A142 remains absent from `adb devices`, so the Rider screen check is pending. No setting was changed by Codex.

### Diagnosis of unchanged Rider footer setting

- Source review found the Admin Taxido settings form reads its edit ID and values from the first `TaxidoSetting` row (`pluck(...)->first()`), while the Rider API returns the latest-created row. If production has duplicate settings rows, an Admin save could update a different row from the one the app reads. Duplicate-row count is not verified; no code or production data was changed.

- Correction: user clarified the intended hashtag is `#Demo`. The cache-busted Rider settings API returns `#Demo`, so the API-value check passes. On-device rendering remains unverified while A142 is disconnected from ADB.

### Test 1 passed - Rider Footer Hashtag

- Confirmed the live Rider settings API returns `#Demo` for the footer hashtag.
- Refreshed Rider on A142 through Metro and checked the home footer. It first showed the prior `#DropA2Z` value before a fresh launch, then showed `#Demo` after re-fetching settings. This confirms Admin-configured footer text is consumed by Rider after a fresh app launch; it is not an immediate live push.
- Driver was not part of this setting check. No APK or code changes were made.

### Driver footer hashtag applicability check

- Captured the connected Driver screen on A009P; it is on the home map. Source search found no Driver UI usage of `footer_branding_hashtag` or the Rider `BottomTitle` component, so this Admin value has no Driver-side display to verify.
- Next useful Driver propagation check: temporarily toggle `Activation > Referral Enable` in Admin and verify the Referral entry in Driver Settings after a fresh app launch. No Admin setting was changed.

## 31 October 2026 - Rider Home booking card UI

- User asked to make the pickup/destination card the primary Home card and remove the `Test Cab 1`, `Test Cab 2`, and test auto category strip from Home. Those labels are backend-provided `service_categories` rendered by the Home category carousel, not hardcoded text. The carousel is now hidden on Home; service categories remain available from the Services tab and backend data is unchanged.
- Reworked the Home card with separate stacked pickup and destination fields inspired by the supplied Ola screenshot. Pickup address wraps within the card, and the existing Proceed action opens the Location screen with pickup prefilled and destination ready for entry. Existing map, suggestions, saved locations, and recent searches remain in that flow.
- Reordered Home content so the booking card appears immediately under the header, before banners. No APK built; Rider Metro hot reload is still running on port 8081.
- Live checked on A142: Home shows the booking card without the test category strip; tapped Proceed and confirmed it opens the Location screen; typed `Jalgaon` and saw address suggestions; returned to Home. User visual confirmation is pending.

## 31 October 2026 - Rider location flow moved onto Home

- User clarified that the complete Location screen should be directly on the main Rider Home page, with no tap-through to a separate Location page. Embedded the existing pickup/destination form, map selection, saved locations, recent searches/address suggestions, and Proceed action directly below the Home header. The old Home test-category carousel is not shown; backend categories remain available in Services. Home banners, recent rides, coupons, and footer remain below the booking flow.
- Kept booking navigation and service parameters; map selection now returns to Home with the chosen location, and saved-location selection routes back to the Home tab with the selected field populated. The Proceed button is fixed above the bottom tab bar.
- Collapses the large Home header while the keyboard is open so destination suggestions remain visible; it returns when the keyboard closes.
- Hot-reload checked on A142: the full form is on Home, destination `Jalgaon` shows address suggestions, and the Proceed button remains visible. Cleared the temporary search text afterward. A Fast Refresh hook-order error occurred during the edit; hook placement was corrected and Rider was force-stopped/reopened once to reset React state. No APK was built. Metro remains on port 8081.

### Rider Home spacing fix

- Investigated the large gap between the Home booking/search content and recent rides. The embedded recent panel was reserving a fixed-height box, and its relative bottom offset left layout space behind after moving the panel upward.
- Made the embedded panel size to its rows, render saved recent-search rows in normal flow, and removed the offset and excess embedded spacing. The standalone Location screen keeps its existing fixed-height panel.
- Hot-reload checked the Rider Home on A142: pickup/destination card, map/saved-location controls, recent search, recent rides, and fixed Proceed action all render. No APK was built.

### Rider booking map road-route mismatch

- Compared the map visible in the working card with the map used by the booking screen. They are separate implementations: the working map uses Google Maps JavaScript `DirectionsService`; the booking map (`bookRide/mapBooking`) first calls the Routes API directly. If that request is rejected, it only logs a warning and leaves the map with markers or a straight connection.
- Added a `DirectionsService` fallback to the booking map for both the trip route and nearest-vehicle-to-pickup route, and passed its road distance back to the Rider UI. This reuses the road-routing method already working in the other card.
- The fare header used to show `0 km / 0 mins` because it displayed zero values from the vehicle quote even though the route was drawn. It now falls back to the measured road route when the quote reports zero.
- Hot reload briefly triggered a stale Hook-order error while BookRide was mounted; force-stopping and reopening Rider cleared the stale Fast Refresh state. Live checked on A142 with pickup `52 Ayodhya Nagar` and destination `GS Ground`: the street route appeared and the label showed `3.1 km / 9 mins`. The pickup pin is still the default red pin, so the custom pickup marker design remains unverified/failing.
- The vehicle lookup (`POST vehicleType/locations`) took a while to finish, then displayed Bike and Auto prices. Selected Auto at ₹46.16 and Cash; Rider is searching for a driver. A009P is online but has not shown the request card yet, so acceptance and trip completion remain unverified. No APK was built.

### 31 October 2026 - Driver eligibility check during live booking

- Continued the A142 Rider → A009P Driver booking test. The map route and fares loaded; the Rider request entered “Searching Drivers,” then timed out and returned to vehicle selection. The Driver showed no incoming request.
- Runtime checks on A009P showed the driver was marked online by the server, but the app’s wallet minimum check evaluated as below the configured minimum and disabled request polling. The backend also excludes drivers below that minimum, which explains why this request was not assigned. A successful trip cannot be tested until the driver wallet meets the current minimum (or the Admin setting is changed).
- Normalized the Driver app’s `is_online` value before comparing it, because the API type allows either a number or string. When wallet eligibility blocks online mode, the screen now also sets its displayed status to offline. Removed temporary diagnostic logging. Hot reload only; no APK built. Booking completion remains unverified.

### 31 October 2026 - Driver map launch prompt

- Removed the automatic Google Maps confirmation popup when the Driver opens the active ride map. It was triggered as soon as RideComplete mounted and could pull the driver out of the app flow without a deliberate action.
- Verified live on A009P in RideComplete: the ride screen opened without the popup. Tapped the map control and confirmed the manual Google Maps, Waze, and Bing map choices still appear. No external map was launched.
- No APK built. Driver map flicker remains queued for the next change.

### 31 October 2026 - Reduce live map flicker in Rider and Driver

- Rider active-trip map: kept the embedded WebView source stable across screen and location updates; memoized the map component; changed camera follow so it recenters only when the driver leaves the visible map area.
- Driver active-trip map: memoized the map HTML and WebView source; initialized the driver position and map center once, avoiding a stale location callback that kept changing the initial map center; memoized the map component to ignore unrelated ride timer renders.
- Rider Metro bundle and Driver Metro bundle both returned HTTP 200. A009P returned to Driver Home after hot refresh; sampled frames of its Home map stayed visually stable. A142 is on Rider Home, so active-trip map flicker still needs visual confirmation after reopening the trip screens. No APK built.

### 31 October 2026 - Keep Rider live booking map steady

- Found that Rider `bookRide/mapBooking` rebuilt its entire WebView whenever a nearby vehicle coordinate or route response changed. Changed live updates to move the existing vehicle marker and update the existing route line through injected JavaScript, keeping the underlying map and tiles loaded.
- Smoothly interpolates the nearby vehicle marker and limits road-route refreshes to once every 8 seconds while tracking, retaining the last good route between updates.
- Rider and Driver Metro bundles both return HTTP 200. Live screenshot check shows Rider is currently on the location-entry page (not the active tracking map) and Driver is on RideComplete; the active Rider tracking view still needs visual confirmation. No APK built.

### 31 October 2026 - Stop one-second Rider active-screen updates

- A142 was on the active Rider tracking screen while the map still appeared to flicker. Found that `RideActive` was requesting the Rider phone's GPS every second and setting screen state each time, even though the map tracks the Driver over the live channel. This forced unnecessary full-screen renders and used extra location/battery work.
- Removed that redundant GPS loop and calculate pickup ETA against the saved pickup coordinate, which is the destination the approaching Driver needs to reach. The Driver's live location remains the map's moving marker source.
- Rider Metro bundle returned HTTP 200. Captured five A142 frames about one second apart; the map remained rendered and visually stable across the samples. No APK built.

### 31 October 2026 - Remove repeated Admin table footer headings

- Fixed the queued Admin table bug in the shared `<x-table>` component: removed the footer row that rendered the same sortable column headings a second time. The top header row remains. This applies across Admin list pages, including Users, Riders, and Drivers; invoice-total footers are separate and unchanged.
- Change is local only; no deployment or Admin browser test has been done. User testing is pending after the update reaches the Admin site.

### 31 October 2026 - Rider tracking-map flicker follow-up

- Removed the Rider Payment screen's 3-second `mapKey` increment that remounted the map whenever driver coordinates were unavailable.
- Delayed creating the map until the ride destination has valid coordinates, preventing the map from initializing with an empty center while ride details load.
- Restarted Rider on A142 and opened existing ride #100201's tracking screen. The map remained rendered in screenshots captured about 8 seconds apart; no APK was built.

### 31 October 2026 - Cash booking with a negative Rider wallet and Driver review

- Deployed a targeted backend change so a negative Rider wallet no longer blocks cash or online ride requests. Wallet payment still requires enough funds for the quoted fare. Normal ride and rental request paths both pass the selected payment method and fare into the wallet check.
- Cash collection completes the ride's cash payment and driver commission flow; it does not credit the Rider wallet or erase any prior wallet debit. Existing wallet balances and transactions were left unchanged. The source of the Rider's current negative balance still needs to be identified from that account's wallet ledger before making any financial adjustment.
- Updated Driver completed-ride details so `Review Customer` is available once a ride is completed, regardless of whether its payment is completed. Invoice remains available only after payment completion.
- Verified on A009P that completed ride #100201 displays `Review Customer` and opens the rating form. Backed out without submitting a review. A142 remained on vehicle selection; no new ride was created. No APK was built.
- Production PHP lint passed for the deployed backend files; a dated backup is stored at `/home/dropa2z/backup-wallet-cash-booking-20261031-173807`. The Driver review change is local/Metro code and was confirmed on the connected phone; no APK was built.

### 31 October 2026 - Responsive Rider and Driver cards

- Made Rider location inputs consume the available card width and let the location action labels shrink to fit. Updated vehicle rows so the name/description can truncate within the remaining space while the image and price stay aligned.
- Updated Driver incoming-ride cards so rider names and long pickup/drop-off addresses shrink or wrap inside the card instead of forcing the row wider than the screen.
- Samsung's published Galaxy S23 FE display is FHD+ 1080×2340. The connected phones are Nothing devices, so this is a responsive layout adjustment guided by the published display dimensions, not a device-specific screenshot check.
- Rider and Driver Metro Android bundles returned HTTP 200; A142's vehicle-selection screen showed its vehicle cards and prices within the screen. No incoming request was present on A009P to visually check that specific card. Actual S23 FE confirmation remains pending. No APK was built.

### 31 October 2026 - Rider registration visibility in Admin

- Traced Rider app registration: it posts `name`, `email`, `country_code`, `phone`, `verification_token`, and password fields to `POST rider/register`. The Laravel controller validates the verification proof, creates a `Rider`, assigns the `rider` role, creates the wallet, and commits before returning success. Google social registration also creates/loads a Rider and assigns the same role.
- The Admin `Riders → All Riders` table queries the Rider model, whose role scope selects the `rider` role; it excludes system-reserved and soft-deleted rows. The users table migration defaults new rows to active (`status=1`) and non-reserved (`system_reserve=0`). No missing persistence or visibility filter was found for successful registrations in source.
- Root cause when looking at `Admin → Users`: that separate staff-user table only includes roles with `module IS NULL`. The seeded Rider role belongs to the Taxido module, so Rider app accounts are intentionally listed under `Admin → Riders`, not `Admin → Users`. No user data was read or changed.
- No code change or production deployment was made because adding riders to the generic Users table would duplicate the dedicated Riders list and expose them to generic User actions, which do not run Rider-specific deletion cleanup. Confirm a specific newly registered account under `Admin → Riders → All Riders`; if absent there, inspect the live registration response and database role assignment before changing code.

### 31 October 2026 - Branded ride-completion email

- Traced completion emails to `RideStatusListener` → `NotificationService` (queued in `notification_logs`) → `ProcessNotificationsCommand` → `GenericTemplateNotification`. The generic “Update from DropA2Z” subject is used when the Admin email-template record for the completion slug is absent.
- Added a dedicated DropA2Z HTML and plain-text email for Rider and Driver completion slugs only. It has a responsive branded header, completion status, ride number, pickup/destination, driver, fare, and payment details when available, with role-specific copy. Other email templates and the queued mail delivery path remain unchanged; the existing Admin template-disabled check is preserved.
- No real email was sent and nothing was deployed. PHP lint passed for the notification and listener. A local sample render of both Blade variants with sample ride values confirmed the expected ride details and that the Blade directives/placeholders resolve. Full Laravel Blade rendering could not be run because this checkout has no `vendor/autoload.php`.

- Follow-up: Responsive layout work is deferred per user request. Temporary Rider/Driver layout adjustments were rolled back before the current APK build; this release does not include those deferred dynamic changes.

### 2 November 2026 - Responsive layout verification and branded completion email

- Reopened responsive layout work for emulator verification. Checked the Rider booking/location screen at compact 720×1600 @ 320 dpi, wide 1200×2600 @ 420 dpi, and an S23 FE-sized 1080×2340 @ 420 dpi profile. The pickup/destination inputs, actions, header, and bottom Proceed area remained within the screen width; recent rides remain in the scrollable content behind the fixed Proceed area. Fixed the compact Rider service card so its description can wrap instead of clipping. Driver login, OTP, and registration forms fit the compact profile; an incoming ride card could not be checked because there was no live request. This is a multi-size spot check, not a claim of validation on every Android model. No APK was built. The user closed the emulator after the check.
- Deployed the role-specific Rider and Driver ride-completion email templates to production. They include the DropA2Z logo, ride number, pickup/destination, driver, fare, payment details when present, and plain-text alternatives. Completion details are added to the existing notification payload; other notification slugs and the Admin email-template enabled/disabled behavior are preserved.
- Backed up the original production PHP files at `/home/dropa2z/backup-ride-completion-email-20261102-110524`. PHP lint passed on production, `php artisan view:cache` completed successfully after correcting inline Blade conditionals, the public email-logo image returned HTTP 200, and two preview emails (Rider and Driver) were sent to the authorized address with sample trip data and a visible preview-only banner. No real ride event was generated.
- Gmail inbox avatar is separate from the email body logo. Public DNS currently has `_dmarc.dropa2z.com` set to `p=none` and no `default._bimi.dropa2z.com` record; no DNS change was made. Gmail logo display therefore remains a separate sender-domain/BIMI setup.

### 2 November 2026 - Rider multi-stop Proceed spinner

- Fixed the zone lookup continuation race on Rider's location-entry screen: the next step now runs when both the service-zone response and readiness state are available. Previously, if Redux updated the zone first, the screen could keep spinning without continuing.
- The Jalgaon service-zone and vehicle quote requests now each time out after 15 seconds. Failed HTTP/network responses are rejected rather than treated as successful Redux results; Rider stops the spinner and shows a plain-language retry message. Rejected zone lookups also clear Redux's loading state.
- Preserved the selected route coordinates in order: pickup, each selected intermediate stop, then destination. The flow continues to require every stop to come from a verified Jalgaon search result.
- Built and installed the arm64 Rider release APK on A142. Confirmed it opens to the Rider location-entry screen; a multi-stop quote/route still needs the user's retest. The test APK is at `Taxido_user/android/app/build/outputs/apk/release/app-arm64-v8a-release.apk`.

### 2 November 2026 - Multi-stop fare refresh and Driver route preview

- Inspected the live A142 Rider screen. Retrying Proceed successfully opened the multi-stop vehicle list with the ordered route at 11.1 km / 31 minutes and current Bike/Auto quotes. This confirmed the route quote request had recovered; the prior generic alert hid the server message.
- Updated vehicle quoting to request one Google Routes route for pickup, every waypoint, and destination with traffic-aware duration. This replaces one sequential route request per leg, avoids silently returning partial distance when a leg cannot be routed, and lets the fare update from the complete route.
- Standard cab fares now use the Admin-configured per-distance and per-minute zone rates for metered trips, together with the existing scheduled surge/tax/commission rules. No Uber-specific fixed price was copied; final amounts depend on DropA2Z's configured zone rates.
- Rider now clears the previous vehicle quote while the new itinerary is being priced and after a failed quote, so an old trip's fare cannot remain visible as if it matched the new stops. If a quote fails, the UI shows a safe server explanation when available.
- Driver incoming multi-stop request cards now show every stop in order before the driver accepts. The active Driver map already receives and draws the waypoint coordinates; its address panel now also lists every stop.
- The current trip flow still has one overall start and one final completion; separate per-stop arrival/delivery confirmations are not implemented in the backend.
- PHP lint and `git diff --check` passed. ESLint could not run because these app folders have no ESLint configuration. Project-wide TypeScript checks report many existing errors; no errors were reported in the new Driver itinerary/address-panel code, while Rider still has unrelated existing type errors in its location screen.
- Local code only. No cPanel deployment or APK build was made. A live fare comparison and Driver-device verification remain pending. Only A142 was connected during this check.

### 2 November 2026 - Production route-based cab fare deployment

- Traced repeated fares to the production route quote returning `0 km / 0 mins`. The server tried the web API key first; Google returned HTTP 403 `API_KEY_HTTP_REFERRER_BLOCKED` because server requests have no browser referrer. The old helper silently treated the denied route response as zero distance.
- Updated `calculateRideDistance` to prefer the configured server key, send the complete ordered itinerary in one traffic-aware Routes API request, and fail clearly instead of quoting zero when route calculation fails. Updated standard metered cab fares to apply the zone's per-kilometre and per-minute rates regardless of the unrelated additional-charge toggles; rentals and packages retain their existing rules.
- Backed up the two production PHP files under `/home/dropa2z/public_html/backup-fare-pricing-20261102-122933`, then deployed only `Helpers.php` and `BiddingTrait.php` to the live Laravel app. The configured server key successfully returned Routes API responses.
- Production PHP lint passed for both files. Live `vehicleType/locations` requests returned different route-based quotes: at 1.41 km Bike ₹29.64 / Auto ₹46.16; at 3.44 km Bike ₹45.66 / Auto ₹85.40. Jalgaon zone rates are Bike ₹7/km and Auto ₹17.14/km after the 1.5 km included base distance; per-minute rates are currently ₹0.
- No APK rebuild was needed for this server-side fare calculation change. Rider-device retest remains pending.

### 2 November 2026 - Driver blank ride map

- Fixed the Driver ride-completion map center to use the pickup coordinate from `location_coordinates[0]` before falling back to the Driver GPS location. Invalid and (0,0) coordinates are discarded; Jalgaon is used only when the ride and device provide no usable coordinate.
- Made the map provider follow the setting after Admin settings load, defaulting to Google Maps when a Google key is available. Previously the provider was captured once at first render and could remain on the wrong fallback provider.
- Replaced the Driver's straight-line fallback with the same Google Routes API v2 request used by Rider. It requests a driving route from the booked pickup, through valid intermediate stops, to the destination, then draws the returned road geometry. If the API returns an error or no road geometry, it clears the route line rather than displaying a misleading direct segment. GPS-origin refreshes are throttled to 30 seconds; booked itinerary changes request a new route immediately.
- A142 originally had a non-debuggable release app, so it could not hot-reload. The previously built Debug APK lacked `libworklets.so` and crashed at startup. Built and installed a matching arm64 Debug APK; Metro on port 8082 connected to `com.dropa2z.driver` successfully. The app now opens to Driver Home with map tiles visible. An insufficient-wallet modal is currently shown. Ride-completion map verification is still pending because the app reopened to Home.
- The app is currently on Driver → My Rides, where no active ride is available. Metro detected the saved change, but the road route has not yet been visually confirmed on a live ride. No release APK or backend deployment was made. The project-wide TypeScript check reports existing errors elsewhere; none were reported in the edited map component.
- Updated the Driver's new ride-request map as well: replaced its straight-line fallback with Google Routes API road geometry, selected the shortest-distance returned alternative, and inject the route into the existing WebView without reloading the map. If routing fails, it keeps the pickup/stop/destination markers and does not draw a fake connecting chord. Live visual verification still needs a ride request to be open in Driver.
- The Fleet signup switch belongs in Admin → App Settings → Activation, not Driver App Settings. Added the Admin setting and connected Driver sign-in to the API's `activation.fleet_registration` value: on shows the Driver/Fleet choices; off hides them and defaults to Driver. The fleet registration endpoint rejects new Fleet registrations while off. Missing settings default to on to preserve existing behavior. Removed the temporary local-only Driver switch. Deployed the Admin view, English strings, and API guard to production; backup: `/home/dropa2z/public_html/backup-fleet-registration-setting-20261102-134622`. Production PHP syntax checks passed and compiled views were cleared. Metro accepted a Driver JS reload on port 8082; user visual confirmation of the Admin switch and Driver signup behavior is pending. No APK was built. The Driver home map still ignores GPS heading while stationary (under 1 m/s) so the auto marker stays upright at a stop; heading rotation resumes while moving.

### 2 November 2026 - Multi-stop parcel stop confirmations

- Added persistent parcel stop progress to the Ride model and API responses, with a migration adding the JSON progress column.
- After the pickup OTP starts a parcel trip, the Driver screen lists each intermediate stop in order. Each stop has one `Parcel arrived` action; confirming a stop records it as delivered, marks it done, and unlocks the next stop. The backend rejects skipped or out-of-order stops and prevents ride completion while any booked intermediate stop is still unconfirmed.
- The existing pickup and final delivery OTP flow remains in place. Single-destination parcel trips do not show intermediate stop controls.
- PHP syntax checks passed for the changed model, resources, controller, repository, and migration. The project-wide Driver TypeScript check still reports many existing errors; filtered output shows existing errors in the ride completion screen's OTP sheet and map FAB props, with no errors in the new stop row or API action code.
- Deployed the route, controller, repository, Ride model/resources, and additive migration to production. Backup: `/home/dropa2z/public_html/backup-parcel-stop-flow-20261102-145247`. PHP lint passed for every changed production file; the migration completed and `POST api/ride/{ride}/parcel-stop` appears in Laravel's route list.
- Installed the latest Rider and Driver arm64 Debug builds on A142. Rider's `installDebug` completed successfully. Driver's Gradle build completed; the first parallel device install hit an ADB temporary-file collision, so the already-built Debug artifact was installed serially and succeeded. Both app package processes are running; ADB reverse ports 8081 and 8082 are set for the existing Metro servers. No release APK was built. Live multi-stop ride testing is pending.

### 2 November 2026 - Rider white screen after debug install

- Diagnosed the blank Rider screen on A142: Metro on port 8081 accepted connections but stopped answering requests. Restarting Rider Metro reported a corrupted disk cache and performed a fresh file crawl; Driver Metro on port 8082 was healthy and left running.
- After Metro served the bundle, Rider's Android log confirmed `Dropa2zRider` mounted and startup API requests began. A fresh device screenshot shows Rider Home rendered. No APK rebuild was needed.

### 2 November 2026 - Parcel stop actions and Driver availability

- Fixed Driver ride completion to fetch the full saved ride independently of Echo, merge fetched and realtime details with the navigation payload, and recognize intermediate stops from either itinerary coordinates or saved locations—even when the booking's service metadata is generic. The completion action now blocks until all known stops are marked delivered; it also shows whether stop details are still loading or no intermediate stops were saved.
- Updated the backend to calculate stop counts from the longer of saved coordinates and locations, and to apply handoff initialization, stop updates, final OTP validation, and completion guards to any multi-stop itinerary. This keeps the server behavior aligned when stop addresses and coordinates are stored in different fields or the service type is not labeled `parcel`.
- Fixed Driver Home presence handling so a low wallet warning does not locally switch an online driver offline after the completion screen refreshes account data. New ride dispatch still applies the configured wallet eligibility rule.
- Hot-reloaded Driver JS to A142 on Metro 8082. The active screen now displays `Parcel stops — 0/3 delivered`; Stop 1 is enabled and Stops 2–3 are waiting.
- Deployed the itinerary-based service detection and stop validation in `RideRepository.php`, preserving the live file at `/home/dropa2z/public_html/backup-parcel-stop-service-20261102-1530/RideRepository.php`. Production PHP lint passed. A previous backup of the stop-count helper is at `/home/dropa2z/public_html/backup-parcel-stop-counts-20261102-1515/RideRepository.php`.
- The Driver stop buttons are connected to the backend endpoint. During the device check, Stop 1 was tapped and the active test ride now shows 1/3 delivered; no other stop was changed and the ride was not completed. No APK was built.

### 2 November 2026 - One OTP at parcel pickup

- Kept the Driver's pickup OTP as the sole ride OTP. The backend validates it before starting the ride and records it as verified for parcel bookings.
- Removed the separate parcel-delivery OTP from Driver ride completion, Rider trip details, booking creation, and API resource responses. Parcel stops still require the Driver's handoff confirmation, and all stops must be confirmed before ride completion.
- Deployed the backend changes after backing up the seven PHP files to `/home/dropa2z/public_html/backup-one-otp-20261102-1540.tar.gz`. PHP syntax checks passed on all seven live files.
- Driver and Rider JS changes are local. Driver Metro on port 8082 reloaded on A142; the app returned to Driver Home. Rider screen verification remains pending.

### 2 November 2026 - Rider cancellation on Driver request screen

- Confirmed production sends `.driver.ride.request` with `type: cancelled` on the driver's private request channel when a Rider cancels.
- Found the Driver request screen listened only for the legacy `.cancel.bidding.ride.request` event. Home's listener is blurred while the request screen is open, so that screen stayed visible until a refresh.
- Updated the Driver request screen to handle the production cancellation event and the legacy bidding event, then return to Home for the matching request. Hot-reload and live cancellation verification remain pending.

### 2 November 2026 - Live multi-stop booking test (A142)

- Created a cash Auto Rickshaw booking for Demo 1 with 3 intermediate stops, 7.98 km / 27 minutes, and a quoted fare of ₹177.22. Driver accepted it; Rider showed the assigned Driver and one pickup/start PIN. Ride #100222 is visible in Driver's Active list.
- Driver marked arrival and the single pickup OTP verified successfully. No delivery OTP was requested. The OTP needed a second entry attempt because the first fast input did not fill all four boxes; pressing Android Back also left the OTP screen before verification. Treat this as a usability/test issue to fix later. The code itself was accepted on the second attempt.
- An earlier pending request expired while inspecting the Driver screen; Rider displayed “Your booking was declined or cancelled.” It was not counted as a successful booking.
- Only A142 was connected, so Rider and Driver were checked sequentially on the same phone. Driver confirmed Stops 1, 2, and 3 in order; progress reached 3/3, with no extra OTP at any stop. Driver then marked ride #100222 completed and opened Ride Details. Rider still displayed “Driver waits 1 min” and the old start PIN after reopening; no review prompt appeared. This is a Rider completion/realtime refresh bug to fix later.
- Driver Ride Details still says payment has not been completed and offers Refresh / Collect Cash. No payment was recorded and no cash was exchanged. After completion, the Driver remained online; tapping the availability control showed “Are You Sure You Want To Offline?”, and Cancel kept the Driver online.
- After force-stopping and relaunching Rider, ride #100222 moved from the stale waiting screen into the Past rides list. This confirms the server completion is available after a full app reload, but Rider did not update the active screen in real time and did not show the requested review prompt. The Past card shows a 0.0 rating; no rating was submitted.

### 2 November 2026 - E2E completion and cash flow follow-up

- Rider's active trip screen now starts its status check immediately, polls every five seconds while open, and refreshes when the app returns to the foreground. It only leaves the trip screen after both the ride and payment are complete. Completed rides open the optional review prompt once; unchanged poll results no longer force a map redraw.
- Driver cash collection now sends the entered extra charges to the server before the final completion request. The server calculates extra and waiting charges, records cash as received without completing the ride early, and calculates commission only after final completion. The completion API rejects unpaid cash rides and still requires every parcel stop to be confirmed.
- Validation: PHP syntax passed locally and on production; `php artisan optimize:clear` completed. Rider and Driver Android bundles both compiled with a 5 GB Node heap. Rider and Driver were opened sequentially on A142 with the existing Metro servers; Rider showed the completed ride in Past.
- Production `RideRepository.php` was backed up to `/home/dropa2z/public_html/backup-cash-completion-20261102-1635/RideRepository.php` before the focused cash-completion changes were deployed. No APK was built.
- Driver Metro on port 8082 stopped answering its status check. Restarted it without clearing the cache and set `NODE_OPTIONS=--max-old-space-size=5120`; Metro detected a damaged disk cache, rebuilt its file index, returned to ready, and reconnected to A142. Both Metro status endpoints now respond, and Android logs show no React Native JavaScript exception.
- No active ride was available on A142 for a new live run, and no cash was exchanged. The five-second Rider update and review prompt, cash amount collection, and final completion still need confirmation on the next real booking. The existing ride #100222 remains a prior test ride; no payment was recorded for it.

### 2 November 2026 - Universal Rider and Driver release APKs

- Enabled `universalApk true` in both Android app Gradle configurations so each release build produces a single APK containing all four supported ABIs, alongside the existing per-ABI APKs.
- Built Rider and Driver `assembleRelease` successfully. Rider needed a sequential retry after both initial parallel Metro bundle steps collided in the shared Windows temp cache; the retry used a Rider-specific temp folder.
- Copied standalone, bundled-JavaScript release APKs to `C:\Users\mishr\Downloads\DropA2Z-Rider-3.0.0-universal.apk` (93,642,605 bytes) and `C:\Users\mishr\Downloads\DropA2Z-Driver-3.0.0-universal.apk` (85,564,724 bytes).
- Verified both APK signatures with `apksigner` and confirmed package IDs, version `3.0.0`, minimum Android API 24, and target API 36. Both use the project's Android debug signing key, so they are for direct testing/sideloading rather than Play Store publishing.
- The APKs were not installed on A142; the user was testing on the phone.

### 2 November 2026 - Driver onboarding first-launch route

- Rider skips intro for an authenticated session and otherwise shows the server-configured onboarding slides. Driver had an incorrect signed-out path that sent new installs directly to Login even though its three-slide onboarding screen was present.
- Changed Driver startup so signed-out users go to OnBoarding; if no slides are configured, that screen still falls back to Login. Signed-in Driver sessions continue to the app.
- Rebuilt the universal Driver Release APK successfully and replaced `C:\Users\mishr\Downloads\DropA2Z-Driver-3.0.0-universal.apk`. `apksigner` verification passed.
- A142 disconnected before the updated Driver APK could be copied to the phone. The new file is only on the PC for now. To see onboarding, install it and sign out (or clear Driver app data); Rider also skips slides while signed in. The phone flow has not yet been re-tested.

### 3 November 2026 - Parcel delivery decisions (planning)

- The pickup OTP remains the only OTP. At the final drop, the Driver marks the parcel delivered with a tap; no receiver OTP, photo, or signature is required for this first flow.
- If the receiver is unavailable, the Driver contacts the sender. If the sender is also unreachable, the Driver marks a Delivery issue and Admin decides whether to retry delivery or return the parcel to pickup. There is no automatic return after a fixed timeout.
- These are agreed product rules, not a claim that the final-drop guard, Delivery issue state, or Admin resolution controls have been implemented or tested.
- Product goal: a Porter-style goods-delivery flow. Design and verify both single-drop and multi-stop bookings as part of the delivery flow; do not treat multi-stop as a later phase.
- Initial customer-facing service catalog: Parcel → Bike Parcel, Auto Parcel; Freight → Bike Freight, Auto Freight. The capacity, package rules, and pricing distinction between Parcel and Freight still need definition.
- Placement: show those four choices under Parcel and Freight in the Rider app's Services screen. Proposed copy: Bike Parcel for one small packed item; Auto Parcel for several or larger packed items; Bike Freight for compact shop stock, samples, or spare parts; Auto Freight for cartons, store supplies, or stock refills. Avoid promising heavy loads or different service levels until actual vehicle capacity and operations support them.

### 3 November 2026 - Goods services and pricing (local implementation)

- User requested a Porter-style delivery flow with working routes/actions and delivery wording throughout both apps. The user confirmed that Auto means a standard passenger auto-rickshaw, and approved retaining existing DropA2Z Admin rates with an editable included-time allowance. Porter public references: https://porter.in/two-wheelers/bangalore and https://porter.in/terms-of-service. Public city examples are not a Jalgaon tariff and were not copied as DropA2Z prices.
- Rider Services now renders Bike Parcel, Auto Parcel, Bike Freight, and Auto Freight only when their enabled canonical backend categories exist. It no longer exposes Cab or test-category cards. Each choice carries its backend service/category IDs and Bike/Auto preference through location selection, saved places, goods details, and quoting. The main Home booking card defaults to Bike Parcel and links to Services to change the option.
- Added narrow migration `2026_11_03_000001_add_dropa2z_goods_service_offerings.php` to create the four categories and link the existing active Bike and Auto/Auto Rickshaw vehicle records to Parcel and Freight, preserving existing records and prices. This migration has not been run on production.
- Both goods types now collect receiver details and a positive goods weight. Quote failures stay on the details screen with an error; they no longer navigate to an empty quote screen. Multi-stop coordinates and goods details are preserved during navigation and contact selection.
- Fixed booking vehicle validation to accept the vehicle's configured services relationship and reject mismatched service/category combinations. Goods dispatch uses the matching verified vehicle pool, so existing drivers with a legacy Cab service field can receive Parcel/Freight requests for their supported vehicle. Driver signup shows the goods services and canonical categories; changing categories resets the old vehicle choice and ignores stale vehicle-list responses.
- Parcel and Freight quotes now always meter the full booked route using the Admin's base fare/base distance and extra distance/time rates. Added migration `2026_11_03_000002_add_goods_included_minutes_to_vehicle_type_zones.php`, model/resource support, and a validated Admin zone-price input for included minutes. Default 0 preserves the current time-charge allowance; no new rupee rates or weight capacities were invented.
- Final destinations are now counted as required handoffs for both goods types. A single-drop delivery has one handoff; a multi-stop delivery includes each intermediate stop and the final drop. Driver shows the final drop and a Parcel delivered action. Cash collection/completion guards use the same expected count. No delivery OTP was added. Driver confirmation records its timestamp and driver ID, and stop updates lock the ride row.
- Goods pickup retains the required starting OTP even if the legacy ride-OTP switch is off. Starting an already-started delivery is idempotent and does not reset handoff progress; closed deliveries cannot be restarted. Directly changing goods status to started without OTP verification is rejected.
- Presentation translations and in-app toast messages convert Ride/Rides to Delivery/Deliveries and Rider/Riders to Sender/Senders while keeping API fields and navigation names stable. Updated 31 hardcoded display labels in 16 active screen/component files. Goods quote cards hide passenger-seat labels.
- Verification: 5 focused Jest tests passed for backend-driven service exposure and correct four-choice routing; 9 scenarios against the actual fare method passed (base allowance, distance/time, Freight parity, multi-stop totals, included-minute changes, weight charges/validation, and legacy cab calculation). 23 changed TS/TSX files compiled with the apps' Babel configurations, and all 10 changed/new PHP files passed syntax checks. Full project TypeScript checks still report existing typing problems, including Driver map FAB icons and legacy booking/rental dispatch/nullable-coordinate types; this is not a clean full-project type check.
- Deployment and live testing remain pending. The server Remote Desktop Commander device `b16380fc-001e-4c1f-9524-a66542628d83` was offline (last seen about 3 hours earlier), and `adb devices -l` listed no phone. No production files/database records were changed, no APK was built, and no complete booking was tested in this work batch.
- Remaining Porter-style work is not claimed complete: Delivery issue/authorized Admin retry-return controls are still agreed planning rules; separate receiver details per stop, structured package details, vehicle-specific weight/dimension matching, and broader business features still need implementation and testing.


## 3 November 2026 ? Bug batch continuation (local; not deployed)

- User requests phone visual inspection only; no interactive/device flow testing. A142 connected. Driver home screenshot inspected: gesture-bar overlap, legacy My Rides label in installed app, white background behind auto marker. No app navigation or submissions performed.
- Rider coupon: trust backend verification, show rejected/error result, guard repeated Apply, send coupon code instead of object, clear removed coupon. Fixed invalid main-sheet index and coupon keyboard-aware input.
- Onboarding: final slide waits for user; removed duplicate language callback; added three branded fallback slides if Admin has none; empty Admin slides no longer skip opening screen.
- Language: preserve saved selection; settings switch waits for translation and service requests and rolls back storage on failure. Additional enabled backend languages/translated content still require verification.
- Rebooking: both history and recent-booking paths preserve all intermediate stops; goods bookings collect receiver/weight before fare quote. Recent bookings still geocode saved address strings.
- Saved locations: validate finite coordinates/address before saving, safely ignore non-coordinate map messages, trim title, Jalgaon fallback replaces Surat. Existing refresh/error fix retained; device persistence not tested.
- Wallet: Rider footer uses safe-area padding, Driver wallet card expands with content and button minimum height. Driver bottom tab bar reserves bottom gesture inset. Visual verification of changed layouts pending; installed app not reloaded.
- Driver profile: remove explicit multipart header so fetch supplies boundary; failed HTTP updates stop success flow; await profile refresh and cache server image URL.
- Driver ticket priority/department: accept array and paginated response shapes; remove explicit multipart header for attachments. Backend priority records still need live check.
- Driver deliveries: focused/foreground list refresh every 5 seconds with overlap protection. This is fallback polling, not true realtime.
- Realtime: new public /api/realtime-config controller exposes valid public TLS connection details only, never secrets. Both apps replace disabled placeholder sockets with server-configured Echo and safe disabled fallback; 30-second config cache, 5-second fetch timeout. Requires deployment and a working public Pusher/Reverb server. Not confirmed live.
- Syntax compilation succeeded for 19 changed source files using each app Babel config. No APK build and no device functional tests.
- Outstanding: live realtime infrastructure/deployment, full manual verification, remaining dummy content and disabled languages, active-delivery cancel controls, complete final parcel booking/payment flow. Do not label entire bug batch fixed.
- Server RDC setup remains blocked: Node 22 installed; package launch now reports missing @modelcontextprotocol/sdk/server/stdio.js. Investigating dependency installation. Remote Commander connector also absent from current enabled tool catalog, so a running server process alone will not yet allow this session to deploy.


### 3 November 2026 ? Live bug deployment and realtime restoration

- RDC reconnected as the new authorized server device 464cf13a-04c4-4c61-bc77-aec8476dced2 (server.tejum.cloud). No further RDC installation is required. This supersedes the preceding offline/connector-blocked entries.
- Reviewed differences against production before deploying. Preserved existing live OTP authentication, booking start/completion audit records and sender identity assignment. Excluded the old local scoped-login bypass from Driver authentication. Preserved the existing public read-only quotation route.
- Deployed 18 reviewed backend/config/translation files and ran only the three named 2026-11-03 migrations. Backed up affected live files, environment, root htaccess and relevant database tables to /home/dropa2z/dropa2z-backups/20261103T071917Z-bugfix. No broad migrate, fresh database, account deletion or APK build was run.
- Confirmed production had broadcasting=null, no queue/Reverb workers, 320 waiting jobs, 13 delayed jobs, no ticket priorities and no departments. User explicitly authorized archiving old jobs before restarting; renamed Redis queue keys under queues:archived-20261103-071954, preserving job payloads and wake-up list. Kept the 26 earlier failed jobs unchanged. Archive receipt is /home/dropa2z/queue-archive-20261103-071954.json.
- Restored locked queue/Reverb workers and a per-minute cron watchdog. The account's default PHP inconsistently selected PHP 8.2; scheduler and workers now use /opt/cpanel/ea-php83/root/usr/bin/php explicitly. Worker script: /home/dropa2z/dropa2z-background-workers.sh. Original crontab saved outside public_html.
- Added a narrow Apache websocket upgrade proxy for /app/* to loopback Reverb. Public HTTPS websocket upgrade returned 101. Enabled Reverb broadcasting; internal publishing remains 127.0.0.1:8080 over HTTP, while public phone/browser settings use dropa2z.com:443 over TLS. Existing Reverb secrets were retained and never printed.
- Verified a random diagnostic channel can subscribe over HTTPS, receive a Laravel broadcast and return the websocket event. This was infrastructure verification only: it did not create accounts/bookings, send an app-user notification or operate either phone app.
- Admin's compiled JS still contained wsHost=127.0.0.1 and port 8080. Updated source Echo settings and Admin layout to consume the public runtime config. Applied the same narrow initializer change to the existing production bundle, generated a new cache-busted filename and updated the manifest, retaining original assets. No npm dependencies were installed on production for this change. Admin Blade compiled and passed PHP syntax validation.
- Canonical Bike/Auto Parcel/Freight categories are present on production. Included-minute pricing schema, full-route goods pricing, final-drop handoff guards, pickup OTP and coupon errors deployed. Restored High/Medium/Low ticket priorities plus General Support only because the corresponding tables were empty.
- Disabled sample coupon 9 whose description repeated Demo; saved its previous record outside public_html. No real offers or accounts were deleted. No real coupon currently exists for an Apply-discount test; Admin must create an intended offer first.
- User chose to keep English only and add languages through Admin later. Fixed app selection persistence/request failure handling; did not invent or enable other translations.
- Driver name/mobile/plate validation is enforced on the backend; nested vehicle plate is checked during registration too. Clear saved-location request validation and owner checks deployed, and GET location no longer accidentally creates a location.
- Additional local app fixes: real Cancel delivery action before trip start; live Driver-list event listener and non-overlapping focused fallback refresh; Rider history refresh; no global list shimmer on periodic Driver refresh; Driver dashboard focus/foreground updates and empty-chart guard; failed registration/upload/OTP API responses reject correctly.
- Corrected actual Driver TopUp page, not just wallet card: removed fixed top=63.3 percent and upward payment-list offsets, placed button in a safe-area footer and made payment-method space flexible. Rider footer and Driver bottom tab safe-area fixes remain local. Improved OTP instruction and guarded resend; old digits clear only after a successful resend. Unsaved profile preview is no longer persisted as an uploaded photo.
- App source syntax checks passed for 40 distinct changed files using each app Babel configuration. This is not a clean full-project TypeScript check or end-to-end phone test. No phone interactions or APK builds/installations were performed.
- A142 disconnected mid-work and reconnected on user request; current authorized serial remains 00077344Q001174, model A142, transport 19. Final visual screenshot showed Android Home. Both installed apps are release versions without DEBUGGABLE; they cannot load the new local JavaScript through Metro.
- Website HTTP 200, realtime-config HTTP 200 enabled=true/public TLS host, Admin redirect HTTP 301, four goods categories present, Redis waiting queue 0, workers running. All phone/user acceptance checks remain pending. Full checklist and user build commands: DROPA2Z_FIX_CHECKLIST_2026-11-03.md.


### 3 November 2026 - Updated standalone APKs delivered

- User first requested install/test, then explicitly paused. Later instruction changed scope to build two updated full APKs and copy them to phone Download. No install, signup, OTP request or phone functional test was performed after the pause.
- Built Rider assembleRelease successfully in 13m 57s (1595 tasks). Driver first encountered a Gradle CMake output snapshot error; targeted Worklets configure diagnostic succeeded without source changes. Driver assembleRelease retry succeeded in 12m 7s (1564 tasks).
- Used the existing phone Gradle cache, separate per-app TEMP/TMP folders, 5 GB Java heap per build and four Gradle workers; builds ran concurrently. Four ABIs retained. Logs: D:/DROPA2Z/rider-release-20261103.log and D:/DROPA2Z/driver-release-retry-20261103.log.
- Verified both APK signatures and embedded JS/native libraries, including libhermesvm.so, libworklets.so and libreanimated.so for all four ABIs. AAPT confirmed Rider label Dropa2z, package com.dropa2z.rider/versionCode 1; Driver label DropA2Z Driver, package com.dropa2z.driver/versionCode 5. Both versionName 3.0.0.
- Copied Dropa2z-3.0.0-universal-20261103.apk (93651261 bytes) and Dropa2z-Driver-3.0.0-universal-20261103.apk (85624312 bytes) to C:/Users/mishr/Downloads and A142 /sdcard/Download. SHA-256 matched phone files to PC copies.
- Fresh signup test email provided by user was already an Admin account. No role changed; asked whether separate Gmail +test aliases should be used. That question remains unanswered and testing is paused. Read-only permission inspection also showed Rider FINE_LOCATION appop ignored; permission needs checking when tests resume, with no permission changed here.
- Manual acceptance checks remain pending in DROPA2Z_FIX_CHECKLIST_2026-11-03.md. These builds are not claimed end-to-end tested or public-launch approved.


### 3 November 2026 - Rider OTP routing and hot reload

- User reported that OTP login for an existing email opened registration. Live lookup confirmed yellowbanana252@gmail.com is active Rider 184 (older deleted Rider 171 also exists); mayuu.awesom@gmail.com is Driver 192. No account roles or records changed during diagnosis.
- Deployed a narrow AuthController method patch, preserving unrelated live authentication code. Shared normalized identity lookup checks all active users, prefers actual Rider membership, rejects Driver/Admin-only identities before a Rider OTP is sent, and prevents those identities from reaching signup after verification. Existing multi-role Riders use hasRole instead of the first role. Only the newly issued Rider token receives Rider role_type; other session roles are preserved. Backup: /home/dropa2z/dropa2z-backups/otp-routing-20261103-151328.
- PHP syntax passed. Read-only reflection checks passed for active Rider, Driver rejection (403 with useful message), uppercase/whitespace normalization and unknown identity classification. No real OTP was sent or consumed in these checks. Phone OTP retry remains for the user.
- User requested hot reload. Verified the existing 2 November arm64 Rider debug APK is compatible with unchanged native dependencies/manifest and contains Hermes VM, React Native, Worklets and Reanimated libraries. Installed it with adb install -r, preserving app data; did not rebuild native code or change Driver.
- Metro session 34938 runs Rider on 127.0.0.1:8081 with four workers; USB reverse 8081 set for A142. Bundle completed and Metro confirmed connection to com.dropa2z.rider. Existing release APKs in Downloads remain standalone snapshots, not automatically updated by Fast Refresh.
- Local Rider JS now rejects failed OTP HTTP responses, shows actual server errors, awaits token storage before navigation and enters signup only for explicit success=true/is_registered=false. Metro excludes Android build/CMake folders. Latest Rider frontend edits are served by Metro; they have not been packaged into another release APK.

### 3 November 2026 - Driver email also works in the customer app

- Supersedes the earlier Driver-only identity rejection policy. The user clarified that a Driver must also be able to use the customer app with the same email.
- Deployed a narrow OTP authentication patch: after valid OTP verification, an existing active Driver gains Rider membership on the same account, without replacing Driver access or asking for duplicate registration. Existing customer identities resolve directly; unrelated staff identity is not converted.
- Customer wallet is created separately when missing. Existing Driver wallet/profile/documents remain in place. Session role is stored on the newly issued token only; request helpers use that session role. Driver self-resource explicitly returns Driver role.
- Added and ran only migration 2026_11_03_000004_separate_customer_driver_push_tokens. Customer and Driver push tokens are stored separately; a missing app-specific token cannot fall through to the other app's token. Queue restart requested after deployment.
- Backup: /home/dropa2z/dropa2z-backups/dual-app-20261103-152450. Preserved unrelated live authentication code.
- PHP syntax passed. Transactional production diagnostic passed: existing customer normalization, Driver OTP -> registered customer response, both roles retained, separate customer wallet, Driver wallet/push token unchanged, old session role unchanged, new Rider session role, both session-role helpers and complete diagnostic rollback. No email sent, no actual user OTP consumed, and no diagnostic role/session changes retained.
- Rider Metro remains listening on 127.0.0.1:8081; A142 is connected. Final user-operated OTP retry on the phone is pending. Downloaded release APKs are earlier snapshots and do not contain the latest frontend OTP edits; no additional APK was built for this fix.

### 3 November 2026 - Services cards did not open booking

- Visual inspection of A142 showed the four Bike/Auto Parcel/Freight service cards. Their onPress handlers navigated to "Ride", which is not registered in the active stack; the booking LocationDrop component is registered as "Delivery".
- Changed the shared handler to navigate to Delivery, preserving service ID, category ID/slug and preferred vehicle kind for every card. Added the registered Delivery route to navigation types and removed the handler's any navigation cast.
- Both changed TypeScript files compiled with the app Babel configuration. Delivered through existing Rider Metro/Fast Refresh, no native or release build. User must tap the desired service card to confirm the booking screen opens; no booking was submitted during this fix.

### 3 November 2026 - Pickup/destination keyboard flickering

- User reported flickering starts specifically when tapping pickup/destination and opening the keyboard. Captured seven screenshots with a requested 50 ms delay; actual screenshot intervals were roughly 0.5-1 second. Then recorded seven seconds and extracted seven frames at 20 fps (50 ms sampling), plus a full recording contact sheet.
- Recording confirmed the Proceed footer repeatedly jumped into the recent-search content while the keyboard remained open. Android already uses windowSoftInputMode=adjustResize; LocationDrop also applied KeyboardAvoidingView behavior=height, producing competing vertical adjustments.
- Disabled the JS keyboard-avoidance height adjustment on Android in the shared LocationDrop screen; retained iOS padding behavior. This covers the embedded home booking form and the Services booking screen.
- Babel compilation passed. Applied with Rider Fast Refresh. A second seven-second recording with the destination keyboard already open showed stable layout. No app taps, booking submission, server deployment or APK build in this fix. User confirmation after opening pickup and destination again remains pending.
- Evidence: D:/DROPA2Z/dropa2z-flicker-7s.mp4, dropa2z-flicker-after.mp4 and before/after contact sheets. Standalone release snapshots in Downloads do not include this frontend change yet.

### 3 November 2026 - Swap endpoints and change delivery service inline

- Added an accessible up/down Swap control inside the shared pickup/destination card. Requires both verified local addresses/coordinates; swaps coordinates and address metadata together, clears stale suggestions/route-ready state and retains intermediate stops in their existing order. Disabled during processing and while either endpoint is unresolved.
- Replaced Home's separate Change service navigation link with an inline dropdown in LocationDrop, used on Home and the Services booking screen. Lists enabled canonical Bike Parcel, Auto Parcel, Bike Freight and Auto Freight from backend service configuration. Selection changes service/category IDs and preferred vehicle kind used for the real booking/quote and map navigation, preserving addresses/stops without remounting the form.
- Goods bookings now remain in the location form after selecting destination, so users can swap/change service before explicitly pressing Proceed. The selected route and service then go through the existing zone/quote/goods-details flow. No new invented fares or backend endpoints.
- Babel compilation passed for the two changed screens; existing goods service tests passed (3/3), including service/category mapping and vehicle matching. Fast Refresh briefly required a Metro reload; final A142 screenshot showed Auto Parcel, filled pickup/destination, Swap and Proceed. Visual inspection only; final user swap/dropdown/quote confirmation pending. No APK build and no booking submitted.

### 3 November 2026 - Packed parcel photo marked optional

- User requested Picture of Your Packed Parcel be optional. Verified goods-detail validation only requires receiver name/phone and positive weight, BookRide appends cargo_image only when selected, and live CreateRideRequest declares cargo_image_id nullable. No new photo requirement was removed because it was already optional end to end in the inspected code.
- Added visible (Optional) to parcel photo label with a fallback title. Babel compilation passed. Delivered through Rider Fast Refresh, no backend change or APK rebuild. User can leave photo empty and Continue to quote after filling the required details; no booking submitted for this check.

### 3 November 2026 - Cancellation popup spinner and empty reasons

- Visual inspection found the active-delivery cancellation sheet had no reason choices and a stuck Confirm spinner. Live read-only query confirmed cancellation_reasons is empty. Frontend Confirm called selectedItem.title even when selectedItem was null, after setting loader=true; that synchronous error left the spinner active. HTTP error responses were also treated as fulfilled data with no loader reset on unexpected statuses.
- Added a custom cancellation-reason input (bottom-sheet-aware keyboard handling), empty-list guidance, selection guards and visible inline server errors. Confirm requires a chosen/typed reason. Fixed deselection to clear selectedItem. Added an immediate in-flight guard and guaranteed spinner cleanup in finally.
- Added cancelDelivery service with a 15s mutation timeout and 10s authoritative read-back on failure/uncertain response. Accepts success only when server reports cancelled; a saved cancellation after a lost response is recognized without issuing another mutation. Removed fabricated end_time/distance=8/distance_unit fields from this cancellation path. Other generic ride updates retain their existing behaviour.
- Cancellation-reason GET now rejects HTTP failures and times out after 10s instead of treating an error response as a valid list. Existing Driver-detail and cancellation sheets no longer share the same ref.
- Babel compilation passed for all 3 changed source files. Six focused cancellation tests passed: empty reason sends no request, trimmed real reason/minimal payload, visible server rejection, lost response with saved status, network failure and HTTP200 with non-cancelled status.
- Delivered through Rider Metro. Phone returned to Home during shared-module refresh; no cancellation was submitted by Codex. Final user test still required: History -> Active delivery -> Cancel -> enter reason -> Confirm; confirm server cancellation propagates to Driver/Admin. No backend database/config changes and no APK build.

### 3 November 2026 - Read-only Rider/Driver button and route audit

- User requested a full source audit of visible buttons without working routes/actions, not implementation. Parsed 833 Rider + 686 Driver src files (1,519), checked four app entrypoints, 819 event-handler attributes and stack/tab registration (83 Rider routes, 72 Driver routes). No parser failures.
- Confirmed 17 missing-route call sites: 15 Rider calls across 8 absent names, 2 Driver calls to absent Ride (registered screen Delivery). Reviewed named empty callbacks, no-handler buttons, Settings route maps, nested/reset targets and false-positive wrappers.
- Saved DROPA2Z_BUTTON_ROUTE_AUDIT_2026-11-03.md with 33 grouped findings, exact source links, current/conditional/dormant reachability notes and fix order. Raw scanner/inventory outside app folders: D:/DROPA2Z/button-route-audit.cjs and .json.
- Highest priority: Driver bidding-card tap and RideInfo Accept/Place Bid use missing Ride; Rider HTTP401 reset uses missing Login; email-only guest branches use missing SignInWithMail. Fleet refresh callback is empty. Gift Card explicitly coming soon. Many invoice/offer/carpooling/ambulance controls are legacy/dormant, not necessarily visible in current parcel UI.
- Excluded parent/child radio wrappers, static cards, modal containers and profile native-share/external-link actions from broken-route findings. Read-only document/vehicle controls are identified as possible intentional behaviour, not assumed backend failures.
- Source audit does not establish runtime success for all wired API actions or visibility of every legacy screen. No app code, server data, APK or phone state was changed during this audit. Findings await user-selected fixes.

### 3 November 2026 - India-wide local delivery coverage

- User changed scope from Jalgaon-only to local deliveries within any Indian city, explicitly excluding intercity delivery. This supersedes all earlier Jalgaon-only geography requirements.
- Rider autocomplete now uses includedRegionCodes=[in], with a soft 50km bias around pickup/current GPS rather than a hard Jalgaon rectangle. Selected Place IDs/coordinates remain authoritative. Place Details verifies country address components; fallback text geocoding uses components=country:IN. Old saved-address resolution no longer appends Jalgaon. Changed local-only copy/onboarding/service description to city-based wording.
- The broad India coordinate bounds are only a prefilter; they are not treated as national borders. Backend country and city are checked using Google geocoding components in English with a seven-day coordinate-keyed cache. Locality/postal town is used instead of district; missing city data fails with an explanation. Pickup and every intermediate/final drop must share the same state+city key; common city-name aliases are normalized.
- Added IndiaLocalDeliveryPolicy, enforced before Parcel/Freight quotes, new booking creation, address-change quotes and saved location-coordinate updates. Foreign points and intercity/mixed-city stops are rejected server-side, including from older APKs/API calls. Existing cancellation/status-only operations are unaffected.
- Existing production had only Jalgaon zone 69 and 10 vehicle-rate rows. Named migration 2026_11_03_000005_add_india_local_delivery_coverage added an is_india_local_default flag and new zone 70 (India Local Deliveries), copying existing Bike15/Auto16 rates and associated preference prices. Preserved all original Jalgaon zone/rates. Only two configured goods vehicle rates were added to zone70; no invented prices. Zone70 was created disabled, guards deployed, then enabled.
- Zone lookup keeps the smallest active polygon, so Jalgaon continues using zone69 while Mumbai/Pune use70. National/default zone lookup verifies Indian country data, preventing the broad polygon from accepting neighbouring countries. Driver zone lookup uses the same active coverage and existing nearest-driver matching; this does not create drivers in other cities. New zone rates can be edited separately in Admin.
- Live backup: /home/dropa2z/dropa2z-backups/india-local-20261103-104138, including affected files and zones/rates snapshot; additional RideRepository-before-location-guard.php preserves live code before that narrow patch. Ran only the named migration, linted staged PHP, preserved unrelated live code, and restarted queue workers.
- Validation: changed Rider files compiled; 9 existing JS goods/cancellation tests passed. New PHP policy test passed on server: 6 tests, 11 assertions. Local PHPUnit executable was absent; no dependencies were installed. Diagnostic real-geocoding checks passed Jalgaon/Mumbai/Pune local routes, mixed-city/intermediate-stop rejection, unknown-city handling and Nepal country rejection. No bookings/accounts were created by diagnostics.
- Actual public quotation endpoint results: Jalgaon Bike Parcel 200/34.10 INR; Mumbai Auto Parcel 200/46.16 INR; Pune Bike Freight 200/29.64 INR; Delhi Auto Freight 200/46.16 INR. Jalgaon-to-Mumbai and Nepal routes returned422 with clear restrictions. These are sample-route quotes at current Admin rates, not universal fares or completed-delivery tests.
- Rider Metro remains active on8081; A142 screenshot confirms app visible and current. Latest frontend served through hot reload. Driver relies on shared live zone/dispatch changes; its existing Jalgaon map center is only a no-coordinates fallback, not an availability restriction. No APK built; existing Downloads release snapshots still contain old frontend search restrictions and need rebuilding before sharing nationwide.
- User test pending: local Jalgaon route through quote/booking and, optionally, another Indian city with an eligible nearby driver. No claim of nationwide driver supply or a completed live trip in this task.
- API reference checked: https://developers.google.com/maps/documentation/places/web-service/place-autocomplete and https://developers.google.com/maps/documentation/geocoding/guides-v3/requests-geocoding.

### 3 November 2026 - Driver hot reload restored on A142

- A142 00077344Q001174 was connected/unlocked, but only com.dropa2z.rider was installed. Installed existing 2 November arm64 Driver debug APK with adb install -r after verifying package com.dropa2z.driver, debuggable flag, native libraries and unchanged native dependency/manifest dates. No Gradle/release build.
- Started Driver Metro session66895 on127.0.0.1:8082 with4workers. Set only Driver debug_http_host=localhost:8082, preserving other debug preferences, and reversed USB8082. Rider remains on its separate Metro8081.
- Bundle completed. Metro confirmed com.dropa2z.driver connection on A142; /json/list separately confirmed Rider on8081 and Driver on8082. Android permission settings were visible during user interaction; brought Driver MainActivity back to front. No account login/OTP/booking operation performed.

### 3 November 2026 - Driver OTP keyboard overlap fixed

- Updated src/screen/auth/otp/index.tsx and its otpView component/styles. Removed the absolute bottom panel and fixed panel height; placed the form in a persistent ScrollView with measured space above the keyboard. Decorative header/illustration hide while typing; compact spacing keeps the form usable. Avoided Android KeyboardAvoidingView height resizing because it previously conflicted with native resizing. OTP/authentication/resend handlers unchanged.
- Three changed files passed Babel compilation. Hot reload initially encountered stale hook-order state after adding screen hooks; one full JS reload resolved the refresh mismatch. No Gradle build.
- User manually opened Driver OTP and focused a box. Visually verified A142 with numeric keyboard open: all six input boxes, Verify button and Resend option are above the keyboard. Evidence: D:/DROPA2Z/dropa2z-driver-otp-verified-layout.png. No OTP entered/submitted/resent and no claim of a new authentication end-to-end test. Delivered through Driver Metro8082; standalone release APKs are unchanged.

### 3 November 2026 - App-wide green and charcoal visual refresh

- User requested both apps revamped with logo, SVGs, graphics, icons, forms and animations, chose green and charcoal, then explicitly prohibited functionality changes. Scope is Android Rider/Driver apps; earlier website wording was replaced by the app request.
- Original SVG parcel/forward-arrow mark and delivery artwork implemented in each src/design directory. New logo in launch/authentication/registration/Rider home; SK Translines launch subtitle retained. Native launcher vector/adaptive-icon resources staged for the next native build. No new bitmap library or native dependency. Existing fonts retained.
- Bundled selected Lucide0.468.0 icons from the official repository; retained complete ISC/Feather licence in each src/design/assets/LUCIDE-LICENSE. Replaced navigation and key action icons through the same exported names/props; updated remaining legacy brand-blue SVG fills. Primary#157A52, charcoal#172B26, canvas#F5F8F6, mint#B9E9CE, muted#65756D. Status/map functions unchanged.
- Shared button/input/card surfaces, Rider/Driver navigation styling, authentication decoration, wallet/history/settings/chat surfaces updated. Driver OTP layout fix retained. Rider onboarding fallback uses original parcel illustration; configured Admin artwork stays supported. One short native-driver splash fade honours reduced-motion settings and cleans up; existing event callbacks unchanged.
- Backed up every pre-existing modified file to D:/DROPA2Z/design-backup-20261103 before edits. Detailed manifest: D:/DROPA2Z/design-refresh-edited.json. Validation:118 changed JS/TS files compiled, all12 original JSX event-handler attributes matched backup; Rider/Driver full Metro bundles200. Initial missing-new-folder Metro resolution was resolved by restarting only the two verified project Metro processes. New sessions4698/8081 and16935/8082.
- Visual evidence: D:/DROPA2Z/dropa2z-green-live.png (Rider Settings), D:/DROPA2Z/dropa2z-driver-green-live.png (Driver registration). No Driver render exception observed via runtime debugger. User continued manual testing. Not all screens/dark modes/device sizes or full booking flows have been retested. No APK built and no website/backend appearance setting changed. Native launcher changes require a build later.
- Design notes/licences: DROPA2Z_DESIGN_REFRESH_2026-11-03.md. Illustrative local design preview: DROPA2Z_DESIGN_PREVIEW.html; sample controls/text in that document do not introduce app features.

### 3 November 2026 - Shared authentication throttle fixed during user review

- User's Driver registration screen displayed Too Many Attempts. Live route source and Laravel middleware confirmed that legacy throttle:5,1 endpoints all shared domain+IP signatures, so Rider/Driver/Fleet login/verification traffic could exhaust registration's same five-request window. User explicitly approved isolating the limit after the visual-only constraint.
- Added unique prefixes to18 existing auth routes, preserving five attempts/minute per endpoint and all controller/authentication behaviour. No quota reset, account conversion or verification bypass. Narrow live patch compared staged changes with original before atomic replacement; backup /home/dropa2z/dropa2z-backups/auth-throttle-20261103-111459. Cleared route cache; live route:list confirms Driver register isolated prefix.
- New AuthenticationThrottleIsolationTest passed3 tests/15 assertions before and after deploy: login exhaustion doesn't block verification/registration or Rider login, sixth same-step request remains429 with Retry-After, all18 route prefixes unique. Test uses in-memory cache and synthetic requests, no real emails/accounts created.
- Read-only account check for previously supplied dhavalchorwadkar@gmail.com found active Admin160, Fleet175 and Rider179; old Rider168 soft deleted. No Driver profile/role for this email. Explained why Driver would open registration and asked user to confirm current tested email. No roles or account records altered. Do not infer that every other existing Driver account has this issue.

### 3 November 2026 - Existing email Driver registration conflict resolved

- User confirmed the email then reported final registration said email already taken. Corrected earlier incomplete explanation: the missing Driver role legitimately requires Driver setup, but registration's all-users uniqueness rule incorrectly rejected that same verified Rider email. Existing Google linking also selected the first duplicate email row and attempted Driver::findOrFail before the Rider had Driver scope.
- Added resolveDriverLoginIdentity to prefer an existing Driver, then an eligible Rider when historical Staff/Fleet records share the email/contact. Case-normalized email and country-aware phone lookup. Existing disabled accounts remain blocked; Admin/staff-only and Fleet-only identities get clear pre-registration errors. Driver email OTP sending, OTP verification and Google sign-in use the same policy. Existing Drivers still receive Driver-scoped login tokens and their configured verification gate.
- Driver registration resolves existing Rider for email OTP or Google, permits its unchanged existing email rather than inserting a duplicate User, requires current ownership proof, and loads that one Rider under a row lock without the Driver-role global scope. Preserves soft-delete scope; rejects concurrent/repeated Driver registration and invalid/disabled/staff targets. Preserves existing password/email and Rider role, wallet/history; creates the separate Driver wallet, adds Driver role, and saves normal vehicle/documents. Driver approval logic retained. New-account uniqueness checks remain in place.
- Proof consumption now matches the verified token/contact/time tuple (auth_tokens has no id column), avoiding deleting a coincidental matching OTP belonging to another contact. Staged regression caught the initial id assumption before deployment; no faulty code deployed.
- Narrow live patch preserved unrelated server controller differences, including token formatting, and asserted source matched the backup before atomic replacement. Backup /home/dropa2z/dropa2z-backups/driver-registration-20261103-113133; local original D:/DROPA2Z/driver-registration-backup-20261103/DriverAuthController.php. Payload/staging diagnostics stored outside public_html.
- New tests/Feature/DriverRegistrationIdentityTest.php:5 tests/21 assertions passed before and after deployment. Tested duplicate Admin/Rider email selection, successful proof-based Rider-to-Driver linking without duplicate User or lost password/wallet, existing Driver OTP login, rejected invalid email proof, and blocked staff/disabled accounts. Fixture operations ran under outer DB transactions rolled back after each test; mail/queue/notifications/events faked and external HTTP prevented. No real account/OTP was consumed or registered by the tests.
- Live read-only lookup for dhavalchorwadkar@gmail.com chose Rider179, not Admin160 or Fleet175; no real roles modified. Actual HTTPS POST /api/driver/register with intentionally invalid proof returned422 Please verify your email before registering instead of duplicate-email error, confirming public PHP execution has the patch and still enforces proof. One rate-limit slot used for this check. No OTP sent and no user account altered.
- Backend-only fix; no APK rebuild/hot reload required. Asked user to press Register once on the current phone form. Final manual registration/approval pending; fresh OTP needed only if the earlier proof expires.

### 3 November 2026 - Vehicle artwork, Documents, release preparation and logo clarification

- User requested remaining logos revamped, Documents and production readiness. Approved Rider Terms/Privacy/delivery-rule list and Driver/Fleet document management. Later clarified Auto/Bike service graphics and main app logo; then explicitly rejected the new main parcel mark and the old black D-only/pin icon. Final required branding is the ORIGINAL FULL black-and-green Dropa2z backend wordmark seen at launch, for both apps. Current BrandLogo/BrandMark use the existing exact JPEG, with presentation-only white-margin clipping; opening screen logo enlarged. Android launcher adaptive/legacy resources now reference a bundled exact copy of that full JPEG on white. Original PNGs untouched. New vehicle SVGs and other UI updates retained.
- Added original green/charcoal Bike-with-parcel and standard passenger Auto-with-parcel SVGs to both src/design libraries. VehicleGraphic infers only Bike/Auto from existing vehicle names/slugs, preserves existing fallback Image for other vehicle types, and is decorative/pointerEvents none. Wired17 source files via source-aware JSX transformation, preserving old Image source and button actions. Excluded images with load/error handlers from automatic replacement. Booking IDs/categories/prices and route/map behaviour unchanged.
- Added LegalDocumentsPanel/policyLinks in both apps, Rider Documents route/menu for signed-in/guest, Driver LegalDocuments route/menu. Uses existing public /api/page?status=1 and configured privacy URL, only published legal pages, HTTPS-only links, loading/error/retry/empty states, bounded/cancelled fetches, no dummy policy text. Live list200: Terms of Service, Privacy Policy and demo; demo excluded. Delivery rules do not exist in published pages, so no invented rule document.
- Replaced Driver DocumentDetail internals while preserving its existing route/export. Loads active driver+vehicle definitions and own profile; Fleet loads its definitions. Displays real file/status/expiry, supports image/PDF up to2MB, optional/required labels, future-date picker, change-only uploads, replace approved files for review, duplicate-save guard, timeout/error retention, safe footer and policy navigation. Correct multipart boundary delegated to React Native. Existing old screen backed up outside app.
- Backend updateDocument patch enforces Driver/Fleet token role and owner ID, active allowed-type distinct slugs, file/type/size/date validation, preflight validation before media, original-image preservation for expiry-only edits, pending review for changes and failure cleanup of only new uploads. Fleet updates now target FleetDocument/fleet_manager_id rather than DriverDocument. No automatic approval or alteration to configured Driver approval policy. Staged/atomic guarded deployment preserved registration fixes; backup /home/dropa2z/dropa2z-backups/documents-20261103-120135.
- Tests:7 JS helper tests passed (Driver4, Rider3). Document backend5 transactional tests/19 assertions passed on staged and deployed code: image preserved on expiry update, owner scoping, required upload/past expiry, Rider forbidden, Fleet correct table, real PDF bytes saved to isolated fake disk. Fake fixtures rolled back; mail/notifications/queue/events faked. Initial fixture-only schema/disk/empty-PDF issues corrected before passing; no faulty backend deployed. Changed UI source compiled; both Metro bundles200. Phone was Home then old Rider Unable to load script, not a verified new-services view; restored adb reverse8081/8082. Do not claim full manual visual/upload/Admin flow test.
- Owner said Google Play developer account exists but no app uploaded. Generated two RSA3072 PKCS12 production upload keys in C:/Users/mishr/.dropa2z-signing, restrictive ACL, random passwords sealed in Windows-user DPAPI XML; no private material or plaintext passwords printed/committed. Public PEM/fingerprints saved beside keys. Owner must securely back up recoverable credentials before publication; DPAPI XML is machine/user bound. scripts/Load-ReleaseSigning.ps1 loads process-only signing env; shared release-signing.gradle mandates release keys, rejects debug credentials in production tasks, configures release HTTPS/debug local Metro HTTP. Both Gradle signing validation tasks succeeded (16s/31s). New SHA registrations in Firebase/Google Cloud remain an external requirement; current debug registrations preserved.
- User asked full APKs copied to connected A142 Download. Built both universal release variants in parallel using4workers/4GB heap each: Rider2m45s (1452tasks), Driver3m29s (1417tasks). New production-signed build outputs stay in project release folders. Phone/PC testing copies deliberately re-signed with the existing known Google-compatible test certificate, retaining non-debuggable release binary and embedded JS; not Play upload artifacts. Copy-PhoneTestApk.ps1 validates old/new certificate match, bundle/new feature strings,16KB ZIP alignment, app ID/name, all4ABIs, SHA256 after phone push. No app install, account login or booking submitted during copying.
- Initial copied Rider file93771104bytes SHA256 ed5a7a1dd9ba08c55ce6f1ac9e0fd68f2fc967c31b6376630dfd9981e229b31c; Driver85740915bytes SHA256 a35aec9003726f5a606e430b2826fdc7c7e5e23c7dc8f0dc07b43a505893dc61. These initial copies still had the new parcel mark; they are being superseded after the logo correction. Same destination filenames: Dropa2z-Full-20261103-Updated.apk and Dropa2z-Driver-Full-20261103-Updated.apk in PC Downloads and /sdcard/Download.
- Main-icon correction sequence: removed only four new qualifier overrides to expose original D-only PNGs; user rejected that image. Cancelled intermediate builds74699/51168, neither copied. User clarified full green logo and confirmed displayed original backend JPEG. Current builds20462(Rider) and2688(Driver) use full green logo, latest features unchanged. Logs rider-full-green-logo-20261103.log / driver-full-green-logo-20261103.log outside source root. Final copy/checksum pending.
- Production status explicitly answered NOT YET: Google/Firebase production SHA setup, remaining known route audit issues, release end-to-end booking/payment/cancellation/document approval and device acceptance still pending. No blanket production-readiness claim. Release setup/commands: DROPA2Z_PRODUCTION_RELEASE.md.

### Final full-green-logo APK delivery verified — 3 November 2026
- Final Rider build succeeded in 1m53s; Driver in 2m9s. Both original full green logo images verified byte-for-byte inside the packaged APKs (Android resource names optimized).
- Overwrote PC Downloads and A142 /sdcard/Download with Dropa2z-Full-20261103-Updated.apk (93,873,616 bytes; SHA256 c3cbbfffadcb19dd2f7b56e851184e0850c65aa6c51921c2e79389ec02d50106) and Dropa2z-Driver-Full-20261103-Updated.apk (85,843,427 bytes; SHA256 b9a5119e3d2fe3bbec8b9ffeb79ac68133e7df1cf549c84f54793fa76b60cc55).
- Verified phone/PC checksums, signatures matching previous test certificate, non-debuggable release flags, embedded latest JS/Documents/Bike-Auto graphics and ZIP alignment. Files copied only; no automatic installation, login or booking performed.
- These are standalone testing APKs using existing test certificates, not Play production uploads. Public production readiness remains unverified: production certificate configuration, known route-audit fixes and complete release end-to-end acceptance still pending.

### 4 November 2026 — Named screenshots from both installed phone apps
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

### 4 November 2026: live two-phone review
Rider A142 / Driver A009P checked concurrently. Fixed Driver availability state label, hidden offline confirmation buttons, false success on status API errors, erroneous Fleet tabs during profile load and safe-area spacing below Profile's update action. Driver's Dashboard cards refined against supplied reference. Real Rider saved-location Save succeeded for test entry UIcheck-20261104; cleanup/reopen check pending. 9 Driver regression tests passed. Full UI matrix and remaining checks: DROPA2Z_TWO_PHONE_UI_TEST_2026-11-04.md.

### 2026-11-04 — Homepage service cleanup
- Removed Bike Freight from the Rider festive homepage only. Bike Parcel, Auto Parcel and Auto Freight retain their existing booking handlers.
- Updated existing homepage booking test: passed, including endpoint preservation and Auto Freight routing.


### 2026-11-04 — Green/orange UI colour swap
- Swapped green and orange colour literals across both app themes, native UI components, gradients and vector assets (131 files). Existing API logic and callbacks preserved. Original files and mapping saved in D:\DROPA2Z\green-orange-ui-backup-20261104.
- Targeted checks: Rider 5 suites / 17 tests; Driver 4 suites / 9 tests passed. All changed TS/JS parsed successfully; changed JSON validated.
- Embedded bitmap illustrations/logos and third-party branding retain their original colours. Native launcher assets were not rebuilt. Phone visual reload verification pending.


- Phone verification: Driver reloaded successfully. Rider required an app restart to reconnect to Metro; A142 now displays the orange UI, green Proceed accent and three homepage services. Screenshot: D:\DROPA2Z\ui-crosscheck-20261104\rider\colour-swap-after-restart.png. Embedded image colours remain original.


### 2026-11-04 — Review Booking + homepage button position
- Moved native Proceed above Recent Search; existing gotoBook handler unchanged.
- Added themed Review Booking modal with all itinerary addresses, real quote/fare breakdown, existing coupon verification/removal, optional GSTIN/business details, goods selection and restricted-goods confirmation. Reward coins excluded per user instruction.
- Driver customer card displays selected goods type. GST stays out of Driver API/broadcast payloads and is printed on the customer invoice.
- Server deployed through guarded anchor patches, backups and additive migration. Backup /home/dropa2z/.dropa2z-deploy/review-booking-20261104/backup-171736. Backend tests: 4 passed / 13 assertions, including isolated SQLite request-to-delivery persistence. Rider 22 tests and Driver 9 tests passed before the button move; homepage test rerun after.
- Loading allowance shown only from current server goods_included_minutes (trip-fare allowance); no copied 25-minute loading guarantee, arbitrary rupee rate or sample ETA. Real-device booking-review visual check still in progress; no new booking/payment submitted.
- Colour-only artwork generated with built-in image tool. Both apps now consume src/design/assets/approved-home-swapped.png. Prompt: swap green/orange only; preserve composition, text and original atlas coordinates. Original atlas retained.


- Proceed bug follow-up: missing map coordinates previously caused a silent return. Added visible pickup/destination selection guidance and keyboard dismissal. Regression tests pass for typed-but-unselected destination and successful selected-route navigation. A142 tap now visibly starts route loading.


- Settings visual fix from user screen: removed card border/elevation styling from the inner Delete Account and Logout action row. This eliminates the grey raised bar and heavy text shadow; handlers unchanged and neither action submitted.


- Goods confirmation UX: moved required restriction checkbox into the fixed footer above Confirm Goods Type; selected goods label stays visible. Regression test checks confirmation is outside the scrolling list.
- Confirm Booking UX: invalid optional GST previously blocked submission with an error above the fold. Now shows an immediate Edit GSTIN / Continue without GST dialog and a visible footer warning; explicit continue omits invalid billing data. Regression test verifies the click reaches the booking callback without GST.
- Full APK builds started in parallel: 20261104-Revamped-BookingReview. Rider 24 targeted tests / Driver 9 tests passed. Plan: verify self-contained release artifacts, copy to each phone Downloads, install Rider A142 and Driver A009P, and inspect launch. Builds do not certify every booking/payment feature as production-ready.


- Latest branding correction: main Dropa2z logos in both apps explicitly use the original orange logo atlas via originalLogo prop; other theme/artwork colours stay swapped. Release-bundle verification must check this marker before installation.


### 2026-11-04 — final package additions
- Radar now projects pickup coordinates into Google/Leaflet container pixels and follows pan/zoom; non-interactive orange rings avoid blocking taps. Projection movement regression tests passed.
- Rider map supports pinch/double-tap, native zoom controls, bounded zoom and animated Leaflet route fitting; timers and driver updates keep stable map source and do not refit each tick.
- Consistent Dropa2z notification cards for banners/history, visible titles/body, dismiss action, safe object-message normalization; Android orange accent/white parcel status icon and expanded text added, existing channels and event timing preserved. OS controls notification outer layout.
- Preferences/Myself explicitly open at 70% with dynamic insertion disabled, preserving controls.
- Latest full APK rebuild required after these source/native notification updates; earlier BookingReview-tag APKs are intermediate.


- Final APK packaging: resolved Firebase notification accent manifest collision with an explicit android:resource override in both apps; added the tools namespace to Driver. Final artifact validation now requires orange-logo and dismissible-notification markers, plus Rider pickup radar and GST-choice markers.
- User temporarily disconnected A142. Continue PC artifact preparation and connected A009P Driver installation; Rider phone copy/install remains pending A142 reconnection.

### 2026-11-05 — authoritative design reference and GST wording
- User will attach a new logo/theme PDF and video. The new PDF is the authoritative design reference; use video only as supporting guidance. Do not implement speculative visual changes before receiving/reviewing the files.
- Removed character-count wording from Rider GSTIN placeholder, validation message and invalid-GST dialog; optional GST and checksum/format validation remain unchanged.
- App does not verify live government registration. User has no GSTIN to check currently; no actual taxpayer verification was performed. Live automatic verification needs a configured GST taxpayer-search API/provider; manual official portal lookup remains available.
- A142 is connected again (adb device state), currently showing Android launcher. Source parsing passed; phone UI for this wording change has not been visually checked.

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

### 2026-11-06 - Two-phone inspection and booking-flow comparison
- Confirmed both USB devices authorized: A142 (Rider opened) and A009P (Driver opened). Parallel screenshots: rider/paired-rider-loaded.png and driver/paired-driver-loaded.png in ui-crosscheck-20261104.
- Rider shows Home with source and no destination; Driver shows map with Go Online (offline). No active paired booking observed. Driver initially logged transient Network Error messages on launch, then its map loaded.
- Code comparison: request/accept, driver and customer details, call/chat, arrived/pickup OTP, started trip, payment/cash completion, sharing/SOS and both rating paths exist. The approaching ETA uses straight-line distance at a fixed 25 km/h, navigation opens a map-provider WebView rather than an integrated navigation SDK, and a separate destination-arrived state/vehicle-confirmation action was not found. These are code observations, not a successful ten-stage live test.
- Rider on A142 is a standalone install dated Nov 5; Driver on A009P is a Nov 4 debug shell. No install, booking, payment or availability change made in this inspection. Temporary unused Rider Metro stopped; Driver Metro 8082 remains running.

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

### 2026-11-10 - Latest scope: two services, categories, keyboard and banners
- Supersedes the earlier three-service/Scooter scope above: new Rider bookings now offer only Bike Parcel and Auto Parcel. Removed Freight/Cargo Auto and Scooter from Home, Services, vehicle choice and Driver registration choices. Kept the existing Bike/Auto IDs, rates and matching links; historical records are retained.
- RDC server reconnected with device d23c52d9-9991-460a-ab4a-e50401ce8c84. Deployed CreateRideRequest availability validation to /home/dropa2z/public_html: active non-deleted service/vehicle, active category belonging to selected service, and no Scooter alias for new bookings. No existing booking transitions changed.
- Live services/categories disabled instead of deleted: only service 7 Parcel and categories 42 Bike Parcel / 43 Auto Parcel remain enabled. Their original vehicle links 15 Bike / 16 Auto Rickshaw remain intact. Cab/Freight and old test categories are disabled for new activity. Backup: /home/dropa2z/service-options-backup-20261110-133513 (status snapshot and prior request source).
- Verification: live public service API reports Parcel enabled and Cab/Freight/Ambulance/Finddriver disabled. Six read-only server validation probes passed: Bike/Auto accepted; Freight, old test category, mismatched category and Scooter alias rejected. No booking created, no balances/prices edited.
- Category trash icon added beside plus. Custom-category deletion requires confirmation and moves its saved addresses into Other through the existing update API before removing the category label. Home/Shop/Godown/Other are protected. Unit-tested preservation and failures; no personal category was deleted during checks.
- Keyboard changes across both apps: native Android adjustResize owns resizing, nested Bottom Sheet KeyboardAvoidingView disabled, keyboard hide/show state debounced, auth content scrolls, and focus-switch blur delayed. A142 five-second sample stayed visible throughout with no repeated keyboard hide/show events. Driver physical verification and full OTP/chat matrix remain pending; do not claim every keyboard screen tested.
- Address dropdown now has outside touch dismissal and explicit input blur. Verified on A142: focus destination -> suggestions/keyboard open -> touch blank header -> both close, existing addresses unchanged. Category plus/trash and dropdown remain interactive.
- Replaced Home banners with exactly the two supplied 1320x600 JPEGs, 6-second interval, no image editing/cropping. Both visually checked on A142. Editing pauses/collapses the carousel.
- Rider source changes hot-reloaded; full reload used to refresh service policy. Phone screenshot confirms only Bike Parcel and Auto Parcel. Corrected illustration container sizing for two wider service cards. No new standalone APK built in this step.
- Focused Rider verification: 8 Jest suites / 26 tests passed (service policy, vehicle filtering, contact utility, category create/delete, keyboard state, map/dropdown actions, banners). Earlier stop reordering and save-category tests also passed; full live booking remains the user's test.

### 2026-11-10 - Continued connected-phone checks, 15:48-15:52 IST
- A142 reconnected; Rider opened and Metro reverse restored. Home loaded after initial skeleton, current Jalgaon address resolved.
- Physically opened category trash control: sheet shown, default Home/Shop/Godown protected, no custom categories available. Closed without deleting. Notification-contaminated capture removed immediately.
- Physically opened plus/add-category form and focused name input. Input and Create category button visible above keyboard. Closed without creating a category. Refocus returned to destination as intended.
- Fresh steady-state five-second keyboard sample: 46/46 visible, no show/hide events, one window height. Earlier sample while closing modal captured transition events and is not stability evidence; latest JSON replaces it.
- Both pickup and destination Choose on map controls opened real map picker; map tiles and reverse-geocoded Jalgaon address loaded, Confirm Location visible. Returned using Android Back without confirming/changing addresses. The center map pointer still uses legacy red artwork (visual inconsistency with green/orange endpoint scheme), noted for next visual fix.
- No booking, OTP, payment, address/category create/delete or logout submitted. Live booking completion and Driver-phone verification are not covered by these read-only checks. No APK build.

### 2026-11-10 - Notifications layout adjustment
- User requested layout adjustment while Notifications was displayed. Changed this screen only: one compact header row with Back, title and orange logo; removed separate logo tier and oversized top/list spacing.
- Added optional compact DeliveryNotification variant for inbox cards (smaller padding/icon); foreground notification banners keep existing size. Inbox cards use uniform 10px separators, safe bottom padding and consistent side margins. Content remains fully wrapping and tappable; existing notification navigation, refresh and live booking handlers unchanged.
- Hot-reloaded and visually checked on A142: header fits, six existing notifications readable, consistent gaps. Swipe performed without opening a delivery or sending data. Four changed TSX modules parsed successfully; no APK build/backend changes. Evidence: nov10-layout-before.png / nov10-notifications-compact.png.

### 2026-11-10 - Location overlap and stronger box outlines
- Fixed Home location/banner overlap: removed fixed 90px header budget and absolute banner placement. Logo/actions, city/address and carousel now occupy normal layout flow; banner remains mounted but collapses while editing. Address uses available width with single-line ellipsis, explicit line height and bottom spacing.
- Rider shared cards/field finish, Home address rows/container, vehicle options, suggestions and notification cards now use 2dp outlines. Neutral lines strengthened to #B7BEC6 (light) / #737B86 (dark where explicitly themed); pickup green, destination orange and selected-service orange preserved.
- Hot-reloaded and visually verified on A142 in dark mode: address is fully above the banner with clear separation; outlines visible and card actions remain unchanged. Evidence nov10-location-outline-before.png / nov10-location-outline-after.png. Eight source modules parsed; 5 focused banner/address-control Jest tests passed. No booking/API data writes or APK build. No exhaustive all-screen visual verification claimed.

### 2026-11-10 - Supplied Option B logo, transparent in-app assets
- Inspected all three pages of Downloads/DropA2Z.updtaed logos option b.pdf (scooter/truck/auto inside D). Original PDF preserved. Removed only its two full-page white rectangle paints in an in-memory PDF derivative, then exported original artwork with alpha at 2x; no generative redraw or raster recolouring used.
- Reproducible exporter: scripts/import-option-b-logo.py. New assets under both apps src/design/assets/brand-20261110. Three D marks, original embedded vehicle artwork with original alpha, wordmark tail/orange text, complete wordmark/association lockup exported. In-app BrandLogo/BrandSymbol use these assets, transparent containers, existing reduced-motion/AppState animation lifecycle and existing accessible names.
- Native dark-theme composition uses white lettering with the exact orange text/vehicle layers restored; light mode uses original black/orange. Removed old opaque white wordmark backing and animated overlay backing. Existing loader colour overrides preserved. No routing, booking, fares or backend changes; launcher icons not rebuilt in this step.
- A142 hot-reloaded and visually checked Home in light mode and App Settings in both themes; no white rectangle. Restored light theme after dark preview and returned to prior screen. Screenshots nov10-transparent-logo-preview.png / nov10-transparent-logo-dark.png / nov10-logo-option-b-final.png. Both app BrandLogo modules parsed. Driver device not connected; no full APK build or Driver runtime verification claimed.
- Download deliverable: C:/Users/mishr/Downloads/Dropa2z-option-b-transparent.png, 2540x494 RGBA, alpha range 0..255 and transparent corner verified. Asset payload about 598KB per app. Notes retained in project log.

### 2026-11-10 - Both full APKs delivered and installed, 16:27 IST
- Rider assembleRelease BUILD SUCCESSFUL in 6m25s (1596 tasks); Driver BUILD SUCCESSFUL in 8m54s (1607 tasks), concurrently 4GB heaps / four workers each. Latest outer address-card border removal and transparent Option B logo included.
- Phone-compatible standalone copies retain existing test certificate for installed-app/Google credential continuity; original Gradle outputs remain production-key signed. Delivered copies are not Play upload artifacts. Both verified non-debuggable, embedded Hermes JS bundle and all four native ABIs, signature/16KB zip alignment and current feature markers.
- Android recompressed Rider PNG resources, so byte hash differed; new read-only verify-apk-logo.py checked decoded RGBA pixel hash against exact source and passed. Driver source byte hash passed. No rebuild necessary; validator now handles legitimate PNG crunching without accepting a missing logo.
- PC Downloads and A142 /sdcard/Download: Dropa2z-Full-20261110-Latest.apk = 104029706 bytes, SHA256 b602e1e2dfb6e9e977c8970c6d1b9c7a1438b08d1788051a60856188f30e1000. Dropa2z-Driver-Full-20261110-Latest.apk = 144455656 bytes, SHA256 4e829dda19af84bf021a9470a93a5a7ef7d5372ad0e1b66e4d049c05e267dc72. Both phone hashes independently matched PC copies.
- adb install -r returned Success for both. Rider package versionCode1, lastUpdate16:25:01; Driver versionCode5, lastUpdate16:26:49; both versionName3.0.0, no DEBUGGABLE package flag. No uninstall/data wipe.
- Rider opened Home normally with two services, corrected location spacing, updated logo and no outer address border; nov10-full-apk-installed.png. Driver initially showed Android first-launch permission activity, then onboarding loaded with new transparent logo/Driver Partner label; nov10-install-permission.png captured onboarding after prompt had closed. No credentials, OTP, booking or payment submitted. No complete E2E verification claimed by launch checks.
- Both requested standalone files are on phone and both apps installed. These installed release apps do not require Metro; installing the separate debug variant is needed for future Fast Refresh.

### Nov 10: booking regression follow-up
Pickup PIN/Active/Home navigation fixes are recorded in DROPA2Z_CHANGES_2026-11-10.md. 26 focused checks pass; updated APK builds running. Live OTP comparison is still unverified because the Dropa2z RDC child process exits before connecting. Do not mark a live booking test complete from unit checks alone.

Nov10 BookingFix update: both APKs installed/copied to A142 Downloads. Server reconnected and deployed confirmed RideResource rider JSON/photo crash fix (pre-fix real rides failed; post-fix both serialize with unchanged PIN/status). 31 tests pass. Full live user retest remains pending; current Rider account 267 does not own booking #100291 (Rider279). See detailed Nov10 changes log.

Nov11: compact neutral Choose on map actions implemented in Rider pickup/destination/stop rows, label one line, icon12dp, transparent background. Updated Rider APK installed on A142 and copied to Downloads. Details in DROPA2Z_CHANGES_2026-11-11.md.

Nov11: Home Recent Deliveries replaced with functional Promos & coupons (Admin data; current live coupon list empty). Driver signup definitions were entirely absent; user chose only Driving Licence. Added active required licence + expiry, and deployed required-upload validation. Driver no longer treats unavailable configuration as no documents needed. 13 focused checks pass; both 20261111-PromosKyc full APKs installed/copied to A142 Downloads. Home/View all verified physically; fresh Driver signup remains for user testing. See DROPA2Z_CHANGES_2026-11-11.md for exact paths, hashes and backend backup.

Nov11: Square Rider Services cards deployed and installed on A142 (20261111-ServiceCards): Bike9/km20kg, Auto14/km90kg; approved live distance rates updated with bases/extras preserved. Rider Settings spacing and two-step deletion implemented, prospectively tracked two-deletion registration restriction with authorized Admin unlock. Tests and phone visual checks passed; no real account deleted. Details/backups/APK hash in DROPA2Z_CHANGES_2026-11-11.md.

Nov11: Square Rider Services cards deployed and installed on A142 (20261111-ServiceCards): Bike9/km20kg, Auto14/km90kg; approved live distance rates updated with bases/extras preserved. Rider Settings spacing and two-step deletion implemented, prospectively tracked two-deletion registration restriction with authorized Admin unlock. Tests and phone visual checks passed; no real account deleted. Details/backups/APK hash in DROPA2Z_CHANGES_2026-11-11.md.

Nov11: Versioned ARM64 standalone APKs delivered/installed: Rider3.0.2code3 (54.87MB) LeftMap; Driver3.0.1code6 (69.20MB) Compact. Whole map buttons verified LEFT of address inputs; Services cards verified both fit one screen. Signatures/phone hashes/versions checked.23 focused tests pass; live booking remains paused. See Nov11 changes and size-audit reports.


## 2026-11-12 ? vehicle-page delivery form, compact address actions and chats
See DROPA2Z_CHANGES_2026-11-12.md and DROPA2Z_MANUAL_TESTS_2026-11-12.md for scoped changes, checks and outstanding live tests. No real account deletion, message send or payment was performed.

Nov12: Integrated the supplied realistic north-facing Bike and Auto PNG markers into Rider route/active maps and Driver home/fleet/arrival/navigation maps. Existing live-heading rotation remains in place. Added app-local map marker helpers; did not change non-map vehicle artwork or booking behavior. No APK/build or device test performed for this asset-only update.

Nov12: Reproduced Rider 3.0.13 Google account-selection failure on A142. Found generic cancellation message hiding SDK errors and saved Firebase config listing a different Android certificate from the production APK. Corrected result/error handling locally; syntax check passed. Live Firebase release SHA registration remains to verify. Details: DROPA2Z_GOOGLE_SIGNIN_RELEASE_2026-11-12.md. No new APK produced for this diagnostic fix.

Nov12: User requested hot reload instead of another full APK, and requested future APKs use the original signing fingerprint (5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25). Switched A142 Rider to existing debug 3.0.12, started hidden Metro on 127.0.0.1:8081, set adb reverse and launched Rider. New release build was not requested. Current release 3.0.13 uses different production certificate; preserve this distinction for future builds.

Nov12: Rider address controls hot-reloaded on A142. Restored left pickup target/destination pin, moved compact borderless Choose on map action to right with icon followed by single-line label, retained map/clear/stop handlers. Suggestion shortcut row now has horizontal icon+label Home/Shop/Godown, equal widths filling the row; removed category add/delete controls from this row without deleting saved data. Three changed TSX files parse successfully; visually confirmed on phone. No APK build.

Nov12: Added 1/2/5/10/15/20 kg selectable presets (three columns, two rows) in integrated vehicle-page delivery details and the existing standalone form. Buttons write the same parcelWeight state used by fare recalculation/review/booking; manual entry and current limits remain. Parsed all three changed TSX files. Hot reload visibly exposed all six options on A142; selected 5 kg and checked field state without submitting a booking.

Nov12: Removed custom weight entry from both Rider delivery forms per user request. Weight is now chosen through the six existing presets only. TSX syntax check passed; hot reload applied.

Nov12: Fixed packed-items photo section hidden behind the fixed booking footer. Main sheet now reserves measured footer height through bottomInset (stable across keyboard visibility while editing), with a direct BottomSheetScrollView and handle-only sheet panning so content swipes scroll the form. Footer uses one visibility condition; no native keyboard setting changes. TSX parses. On A142, swiped form to the bottom and visually verified the entire photo button at y1354-1850 above footer start y1989; opened photo picker and returned without choosing/uploading an image or booking.

Nov12: Built shareable standalone Rider 3.0.14 (versionCode15), ARM64, 54,840,537 bytes. Explicit owner-requested existing signing mode validates SHA1 5e8f16062ea3cd2c4a0d547876baa6f38cabf625; normal production signing remains default. Command: gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a -Pdropa2zUseExistingRiderSigning=true --max-workers=8. BUILD SUCCESSFUL (3m46s). Verified APK signature, original fingerprint, no debuggable flag, embedded index.android.bundle, and matching SHA256 after transfer: 98bfc3fba6fdf8d20dce9d798640360ead6bea55b1c6519b1c1b13cbeda1ef42. Saved as C:\Users\mishr\Downloads\Dropa2z-v3.0.14-Full-arm64-v8a.apk and A142 /sdcard/Download/Dropa2z-v3.0.14-Full-arm64-v8a.apk; removed obsolete mismatched-signature 3.0.13 APK from phone Downloads. Installed hot-reload Rider remains in place; this full APK was copied, not installed.

Nov13: Fixed Rider delivery selection race. The Home card could retain a visible Bike/Auto highlight from navigation while the current quote had not yet supplied the matching vehicle object, which caused the Review button to say “Please choose vehicle.” Booking now resolves its selection only from the current filtered Bike/Auto quote, preserves the selection while that quote refreshes, and accepts Motorcycle-labelled Bike quotes. Hot reload sent to connected A142; focused vehicle/service tests passed 7/7. No booking submitted and no APK rebuilt.

Nov13: Improved local-delivery quote validation. Google may label city-edge map pins with a nearby suburb/village, producing a false “Vehicle fares unavailable” before Bike/Auto pricing is requested. The policy now retains the same-city rule, with a 20 km straight-line same-state fallback for nearby city-edge locations; other-city routes remain blocked. Cache version bumped so old location records do not bypass the new state check. PHP syntax check passed. Deployment still requires the responsive Dropa2z server session.

Nov13: Product decision changed: intercity parcel deliveries are allowed. Removed the same-city/local-radius block from the quote, booking and ride-update validation path. The policy still rejects non-India coordinates. Bike/Auto fares now proceed to normal route and zone pricing for Indian intercity trips. PHP syntax check passed; deployment is pending responsive server access.

Nov13: Deployed the intercity policy to the live Dropa2z Laravel server at /home/dropa2z/public_html. Server PHP lint passed, Laravel caches were cleared, and a server-side check confirmed the former same-city rejection is absent. Restarted Metro, restored A142 port reverse, triggered Rider reload, and launched the Rider package; no fatal Android/React Native errors found in the recent log.

Nov13: Rider/Driver pickup-screen fixes hot-reloaded on connected phones. Driver pickup PIN now uses four real boxes and spreads a pasted 4-digit code; Driver pickup card action buttons use compact equal-width layout; Rider pickup safety text now says “I have checked the vehicle.” Syntax checks passed. Created C:\Users\mishr\Downloads\Dropa2z Booking Flow Screens\User and \Driver. Captured Rider Proceed, delivery details, contact selection, review booking, goods type, confirm booking, and searching drivers screens. A real Bike booking was submitted from A142 (2 kg, receiver test contact); it remains in Searching Drivers. Driver A009P is offline and Go Online is blocked by the current ₹10 minimum wallet rule, so no Driver request/PIN/completion screenshots or complete delivery test could be captured. No wallet or admin setting was changed; booking is left pending for continuation after the Driver becomes eligible.

Nov14: Live Driver negative-balance setting disabled (activation.allow_negative_balance=0). Reset all three negative Driver wallets to ₹0.00 (two active, one soft-deleted), with wallet-history credit entries; total adjustment ₹107.85. No Rider wallets changed. Driver minimum remains ₹10. Before-change snapshot is privately stored on the server at /home/dropa2z/driver-negative-reset-20261114-122134-before.json (0600). Verified the setting is off and no Driver wallet remains negative. Follow-up risk: cash-ride commission settlement still uses unvalidated wallet debits, so a later cash trip can make a Driver wallet negative again; a hard zero floor needs a separate settlement policy that preserves commission accounting.
