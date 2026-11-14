> Latest deployment, 3 November 2026: backend goods/validation fixes deployed; Redis/Reverb restored with a public TLS websocket proxy; original live files/database tables backed up. Updated standalone universal APKs are now built and saved in both PC and A142 Downloads; installation/testing is paused at user request. See `DROPA2Z_FIX_CHECKLIST_2026-11-03.md` for pending manual checks.

# Dropa2z — Project Context and Handoff

> Current product direction, 3 November 2026: DropA2Z is a goods-delivery app for Jalgaon. The launch choices are Parcel (Bike Parcel, Auto Parcel) and Freight (Bike Freight, Auto Freight). Autos are standard passenger auto-rickshaws, so do not advertise cargo-auto or heavy-freight capacity. Use the existing Admin vehicle/zone rates with base distance, extra distance/time, and an editable included-time allowance. The older passenger Phase 1 notes below are historical; the current implementation/deployment status is in `DROPA2Z_PROJECT_LOG.md`.

Last verified: 19 October 2026  
Status: Phase 1 — passenger service and Ride category enabled; Auto Rickshaw staged disabled; Bike not yet configured

This file is the durable context for a new developer, coding harness, or AI agent. Read it before editing the project or changing the live server.

## Product goal

Dropa2z is building an original local ride-booking platform. The first passenger offerings are:

1. Auto Rickshaw
2. Bike

The customer experience should be fast, simple, and familiar for local transport bookings, but it must use Dropa2z branding, copy, and original visual assets. Do not copy another company's branding, artwork, text, or source code.

The work is organised into four phases:

1. **Working/functionality:** make real Rider, Driver, and admin flows work with a simple UI.
2. **Design:** replace every visual element with Dropa2z's original design system, logo, illustrations, and motion.
3. **Testing:** test complete customer, driver, admin, security, and performance flows.
4. **Marketing:** prepare SEO, AEO, GEO, content, analytics, and launch assets.

The current detailed roadmap is `DROPA2Z_FOUR_PHASE_PLAN.md`.

## Non-negotiable working rule

**The backend is the source of truth.**

Never add, hard-code, or expose a Rider/Driver app service before its service, availability, operational zone, pricing, and booking rules exist and are verified in the backend.

Correct order for every new service:

1. Configure the service in the backend/admin system.
2. Verify the public API returns it correctly.
3. Verify the booking API accepts it only where it should.
4. Make the app read and display that active data.
5. Test an end-to-end booking on a real device.

## Local repository map

The repository root contains three main applications:

| Purpose | Local folder |
| --- | --- |
| Rider React Native app | `Taxido_user` |
| Driver React Native app | `Taxido_driver` |
| Laravel backend and web admin | `Taxido_laravel` |

The folder names are inherited vendor names. They are source-folder names only. All public-facing app names, package identifiers, labels, copy, branding, assets, and future documentation must use **Dropa2z**.

Important project documents:

- `DROPA2Z_FOUR_PHASE_PLAN.md` — current project plan.
- `DROPA2Z_PRODUCT_ROADMAP.md` — older background roadmap; use the four-phase plan when they differ.
- `Taxido_user/DROPA2Z_DEV_NOTES.md` — beginner-friendly notes and verified local commands.
- `DROPA2Z_CONTEXT.md` — this handoff file.

## Live environment

| Item | Verified value |
| --- | --- |
| Production API base URL | `https://dropa2z.com` |
| API prefix | `/api/` |
| cPanel account | `dropa2z` |
| Backend deployment folder | `/home/dropa2z/public_html` |
| Correct remote device ID | `464cf13a-04c4-4c61-bc77-aec8476dced2` (repaired 3 November 2026) |
| Server hostname | `server.tejum.cloud` |

There is an older offline remote device entry. Do not use it. It has ID `0f79a155-5987-47a0-8e9b-230529c817cd`.

The mobile apps call the public HTTPS API. They do **not** connect to cPanel directly.

## Current deployed backend state

Read-only verification on 19 October 2026 found:

- The public `GET /api/service?status=1` response currently contains only **Parcel** and **Freight**.
- The passenger service record is service ID `6`, with `type = cab`.
- It is named `Dropa2z Rides` and has `status = 1` (enabled).
- It has one enabled Ride category (ID `19`) and no linked vehicle types.
- The backend has ready-made admin controllers, models, tables, status toggles, zone assignment, and APIs for passenger service categories and vehicle types.

### Why this matters

The current Rider Services tab correctly mirrors the backend and therefore shows Parcel and Freight. It cannot show Auto Rickshaw or Bike as real services until the backend configuration exists.

The first backend task was completed without creating a duplicate record: service ID `6` was renamed `Dropa2z Rides`, assigned the description `On-demand Auto Rickshaw and Bike rides.`, and enabled after explicit confirmation.

### Production-change safety

Do not run the module's broad database seeder as a shortcut. Its default service seed can add other service records, not just the desired passenger service.

Use a narrow, reversible change against the existing passenger service record. Verify the API after every change. Do not change pricing, users, drivers, or active ride data at the same time.

## Phase 1 backend sequence

Complete these steps in order. Treat each write as a separate, verified deployment step.

### Step 1 — enable the parent passenger service — complete

Update existing service ID `6` only:

- Name: `Dropa2z Rides`
- Type: keep `cab`
- Description: `On-demand Auto Rickshaw and Bike rides.`
- Status: enabled

Verified: `GET /api/service?status=1` returns ID `6` as `Dropa2z Rides` with `status: 1`. Parcel and Freight remained active and unchanged.

### Step 2 — create one regular Ride category — complete

Created a category beneath the enabled passenger service:

- ID: `19`
- Name: `Ride`
- Service: passenger service / `cab`
- Category type: `ride`
- Slug: `ride`
- Status: enabled

Verified: `GET /api/service?status=1` now includes the active Ride category under Dropa2z Rides. Parcel and Freight remained unchanged.

Do not add intercity, rental, scheduled, package, or other categories during the first release unless the business explicitly approves them.

### Step 3 — create the first two vehicle types

Create exactly two vehicle types associated with the Ride category. Keep each disabled until its zone pricing, eligible Driver, and end-to-end booking test are complete:

| Vehicle type | Starting seats | Status |
| --- | ---: | --- |
| Auto Rickshaw | 3 | staged disabled — created as ID `14` |
| Bike | 1 | not yet created |

Auto Rickshaw ID `14` is linked to Dropa2z Rides, Ride category ID `19`, and Jalgaon zone ID `69`. It currently uses uploaded media IDs `990` (vehicle image) and `992` (map icon), has zero fare values, and is disabled. It is not customer-visible or bookable.

### Verified remaining dependencies

- No Bike/motorcycle/scooter image or map-icon media is currently uploaded to the backend. Bike must not be created through the normal admin workflow until both assets exist.
- Jalgaon has an active three-wheeler **delivery** vehicle with the following reference configuration: base fare `26.00`, base distance `1.50`, per-distance charge `17.14`, and `5%` commission. This is not an approved passenger fare and must not be copied into Auto Rickshaw without an explicit business decision.
- The only currently service-linked user is assigned to Parcel. There is no configured Dropa2z Rides Rider/Driver test pair yet.
- Do not weaken production OTP security to work around missing test users. Use a real configured SMS provider or an explicitly isolated development environment.

Each vehicle needs a Dropa2z-owned vehicle image and map icon. Never use an asset without an appropriate licence.

### Step 4 — operational configuration

Before either offering is made bookable, configure and verify:

- At least one live service zone.
- Vehicle-type-to-zone assignment.
- Base fare, per-distance fare, minimum fare, cancellation rules, and commission rules.
- Driver eligibility and document requirements.
- A test Driver who is approved for the corresponding vehicle type.
- A test Rider account.
- An intentional OTP policy: real SMS provider for production, or a clearly isolated development-only mode for testing.

### Step 5 — real booking test

Test a complete booking with a real Rider and eligible Driver:

1. Rider signs in.
2. Rider chooses Auto Rickshaw or Bike.
3. Fare/availability is returned for the selected zone.
4. Rider requests a trip.
5. Driver receives, accepts, starts, and completes it.
6. Both apps show the same service and ride status.

Only then should the service be considered ready for the Rider and Driver app UI work.

## Admin configuration direction

The future Dropa2z admin configuration area should contain two separate controls:

### Service availability

- A toggle per offering: Auto Rickshaw, Bike, and future offerings such as Truck or Freight.
- App visibility must come from this backend state.
- The booking API must reject new bookings for disabled services even if an old app tries to submit one.
- Existing accepted rides must remain unaffected when a service is disabled.

### Seasonal templates

- Maintain versioned, prebuilt templates: Default, Diwali, Dussehra, Holi, Gudi Padwa, and future campaigns.
- Only one template may be active at a time.
- The app and website fetch the active template as configuration.
- Provide preview, rollback, expiry date/time, cache versioning, and an audit trail.
- Templates must never provide executable content or override security/booking behavior.

This custom configuration feature has not been implemented yet.

## Rider app state

### Identity and local device

| Item | Value |
| --- | --- |
| Android application ID | `com.dropa2z.user` |
| JavaScript startup component | `Dropa2zUser` |
| Connected Android device serial | `00077344Q001174` |
| Android SDK | `C:\Users\Dhawal\AppData\Local\Android\Sdk` |
| Java JDK | `C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot` |

### Verified state

- The Rider debug APK builds and installs successfully.
- Metro has connected to the USB device and served its JavaScript bundle.
- The Guest route reaches the Dropa2z home screen.
- The Rider app's current Services tab displays the live Parcel/Freight backend catalog.
- The login flow is OTP-based. Legacy demonstration credentials do not belong to the Dropa2z backend and will not authenticate here.
- The OTP input component was updated with explicit readable colors, unmasked input, and focus handling; it can only be seen after the server successfully sends/navigates to OTP verification.

### Current Phase 1 app code

`Taxido_user/src/utils/initialVehicleOptions.ts` and its Jest test currently filter the booking vehicle list to enabled Auto/Rickshaw/Bike options. This was an early guard before the backend was correctly configured.

Once backend service configuration is live, replace this name-based client filter with server-driven availability. Do not treat a client-side text filter as an enforcement mechanism.

## Rider local commands

Use the short drive only for Android compilation, because it avoids the Windows native path-length limit:

```powershell
subst X: "C:\Users\Dhawal\Desktop\DROPA2Z\codecanyon-56450809-taxido-react-native-online-taxi-booking-with-cab-rental-bidding-parcel-admin-laravel-panel"
```

Build the Rider debug app:

```powershell
cd X:\Taxido_user\android
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot"
$env:ANDROID_HOME = "C:\Users\Dhawal\AppData\Local\Android\Sdk"
.\gradlew.bat assembleDebug -PreactNativeArchitectures=arm64-v8a
```

Run Metro from the **normal physical path**, not `X:`:

```powershell
cd "C:\Users\Dhawal\Desktop\DROPA2Z\codecanyon-56450809-taxido-react-native-online-taxi-booking-with-cab-rental-bidding-parcel-admin-laravel-panel\Taxido_user"
npx react-native start --reset-cache
```

Install and connect the device:

```powershell
$adb = "C:\Users\Dhawal\AppData\Local\Android\Sdk\platform-tools\adb.exe"

& $adb devices
& $adb install -r "X:\Taxido_user\android\app\build\outputs\apk\debug\app-arm64-v8a-debug.apk"
& $adb reverse tcp:8081 tcp:8081
& $adb shell monkey -p com.dropa2z.user 1
```

Run the focused existing Jest test:

```powershell
cd X:\Taxido_user
npx jest __tests__/initialVehicleOptions.test.ts --runInBand --cacheDirectory ".jest-cache"
```

Known limitation: a full TypeScript check has pre-existing project-wide failures. Do not claim it passes unless those failures are independently resolved.

## Driver app state

The Driver app is present in `Taxido_driver`. Its public Android identity is intended to be Dropa2z-specific. Do not make Driver UI/service changes until the backend has the verified Auto Rickshaw/Bike catalog and a test Driver can be configured against it.

## Backend source map

These deployed Laravel paths were inspected and are relevant for Phase 1:

| Purpose | Deployed path |
| --- | --- |
| Parent service admin controller | `Modules/Taxido/app/Http/Controllers/Admin/ServiceController.php` |
| Passenger service category controller | `Modules/Taxido/app/Http/Controllers/Admin/ServiceCategoryController.php` |
| Vehicle type admin controller | `Modules/Taxido/app/Http/Controllers/Admin/VehicleTypeController.php` |
| Parent service model | `Modules/Taxido/app/Models/Service.php` |
| Vehicle type model | `Modules/Taxido/app/Models/VehicleType.php` |
| Public service endpoint | `GET /api/service?status=1` |

Relevant relationships:

```text
Service (Dropa2z Rides / cab)
  └─ Service category (Ride)
       └─ Vehicle types (Auto Rickshaw, Bike)
            ├─ Zones
            ├─ Vehicle image and map icon
            ├─ Pricing / commission configuration
            └─ Eligible Driver configuration
```

## Security and production rules

- Never paste Firebase JSON, SSH private keys, `.env` contents, OTP provider credentials, or API tokens into source control, chat logs, or this file.
- Keep Firebase files ignored by Git.
- Do not enable a shared test OTP on production. If a development OTP mode is necessary, isolate it with an explicit environment flag and disable it before release.
- Do not run destructive Git commands (`reset --hard`, forced checkout) in this workspace.
- Do not run broad seeders or migrations on production without a dry run, backup/rollback plan, and explicit confirmation.
- Make server changes through version-controlled source and a repeatable deployment path whenever possible.
- Test with non-production customer data before exposing a service to real customers.

## Git and deployment expectation

Desired flow:

```text
Local tested change → GitHub → reviewed deployment to cPanel → API verification → mobile test
```

Before deployment, inspect the current server change and preserve unrelated user changes. Do not overwrite production files merely to make the local tree match.

## Immediate next action

The next production action is intentionally narrow:

> Obtain approved Auto Rickshaw test fares, Bike image and map-icon assets, and a secure test Rider/Driver/OTP path. Then configure and test a complete booking before enabling the vehicle type.

Do not proceed unless the user explicitly confirms the exact action after reviewing its production-change plan.

## Temporary scoped test login — 19 October 2026

For Phase 1 testing, the backend now contains a deliberately narrow test-login mechanism. It is **disabled by default** and is not a replacement for real OTP delivery.

It can only work when all three server-only environment values are set:

```dotenv
DROPA2Z_TEST_AUTH_ENABLED=true
DROPA2Z_TEST_AUTH_EMAILS=rider.test@dropa2z.com,driver.test@dropa2z.com
DROPA2Z_TEST_AUTH_EXPIRES_AT=<an ISO-8601 expiry date/time>
```

Rules:

- It is email-only; phone login and every email not on the exact allowlist continue using normal OTP.
- It issues a fresh one-time random server token instead of a shared code such as `123456`.
- The Rider and Driver apps immediately exchange that server token and skip the OTP screen only for the approved test accounts.
- The backend logs each scoped test-login issuance. Do not record tokens, `.env` values, or test-session tokens in Git or Markdown.
- Remove or set `DROPA2Z_TEST_AUTH_ENABLED=false` as soon as account testing is finished.


---

# Session log — 21 October 2026

**Headline: Dropa2z completed its first end-to-end rides.** The `rides` table, empty since installation in September, now holds completed rides. Dispatch, pricing, matching, acceptance, OTP, completion and cash settlement all verified working on live data through the public API.

Living documentation is in the Artifact **Dropa2z Backend — Functional Specification**
`https://claude.ai/artifact/VV8dRte5cvqdqRRBDAcKdW` — four tabs: Specification, Build checklist (234 items, 7 phases), Configuration audit, Bug tracker.

## Production changes made

### Configuration
| Change | From | To |
|---|---|---|
| `QUEUE_CONNECTION` | `sync` | `redis` |
| `FIREBASE_PROJECT_ID` | `dropa2z` | `dropa2z-cacf0` |
| `FIREBASE_AUTH_DOMAIN` | `dropa2z.firebaseapp.com` | `dropa2z-cacf0.firebaseapp.com` |
| `FIREBASE_STORAGE_BUCKET` | `dropa2z.firebasestorage.app` | `dropa2z-cacf0.firebasestorage.app` |
| `FIREBASE_MESSAGING_SENDER_ID` | `117357043695` | `730162045717` |
| `FIREBASE_CREDENTIALS` | `public/admin/assets/firebase.json` | `storage/app/firebase/service-account.json` |
| `taxido_settings.driver_commission.status` | `'0'` | `'1'` |

`FIREBASE_API_KEY`, `FIREBASE_APP_ID` and `FIREBASE_MEASUREMENT_ID` still point at the dead `dropa2z` project. They must be replaced together as a matched set once a web app is registered in `dropa2z-cacf0`.

### Data
- Seeded `ride_status` (8 rows) via the module's own `RideStatusSeeder`.
- Seeded `NotificationTemplateSeeder` — 26 push templates, 4 SMS templates.
- Auto Rickshaw (id 14) and Bike (id 15) priced for Jalgaon (zone 69) and enabled.
- Driver 147 provisioned: service 6, category 19, `vehicle_info` id 27, zone 69, wallet funded.

### Vendor source edits — first divergence from Taxido
All in `Modules/Taxido/app/Repositories/Api/RideRepository.php`, each marked `// BUG-nn`:
1. **BUG-13** — removed a duplicated `paymentStatus()` call in the cash branch.
2. **BUG-06/07/08** — in the driver completion branch: guard that rejects completion unless the ride is `started` or `arrived`; write `end_time`; write the `completed` status activity row.
3. **BUG-07** — in `startRide`: write the `started` status activity row.

## Root causes found

| Symptom | Real cause |
|---|---|
| Every ride request cancelled in the same second since September | `QUEUE_CONNECTION=sync` makes Laravel ignore `->delay()`, so the 30-second acceptance window expired instantly |
| Zero drivers ever matched | Redis `driver_locations` geo set was empty — no driver had ever gone online |
| `start-ride` returned HTTP 500 | `ride_status` table was never seeded, so `ride_status_id` was null |
| No commission ever collected | `driver_commission.status` was `'0'` in the admin panel |
| Driver appeared stuck after one ride | Not a bug — completing a ride needs **two** calls: `POST /api/ride/payment` *and* `PUT /api/ride/{id}` with `status=completed` |

## Critical for the apps

**The driver app must call `PUT /api/ride/{id}` with `status=completed`, not only the payment endpoint.** If it only takes payment, `is_on_ride` is never cleared and the driver is excluded from all future dispatch after one trip.

## Still open — needs you, not me

- **BUG-04** money stored as `double` across 35 columns. The `ALTER TABLE` to `DECIMAL(12,2)` was refused by the sandbox permission layer. Cheapest to do now, while there are few rides.
- **BUG-05** Google Maps key is HTTP-referrer restricted, so server-side distance always fails and the client's distance is trusted. Needs an IP-restricted server key plus Android-restricted keys per app, in Google Cloud Console.
- **BUG-11** privacy policy URLs blank — a hard Play Store blocker.
- **BUG-12** GST applied at 18%; confirm the correct rate for passenger transport with a CA.
- **Firebase** service account key still not uploaded. Target path `storage/app/firebase/service-account.json` exists, mode 750, confirmed not web-reachable.

## Operational warnings

- A queue worker was started by hand with `nohup`. It will **not** survive a reboot, and because `QUEUE_CONNECTION` is now `redis`, jobs stop entirely if it dies rather than running inline. The systemd unit is now load-bearing.
- `public/admin/assets/firebase.json` is served publicly (HTTP 200 from the open internet). Never place a service account key there.
- The Google OAuth client secret was exposed in a chat transcript during the configuration audit and should be rotated.
- `storage/logs/laravel.log` had grown to 127 MB. Still needs rotation.

## Backups taken
- `/home/dropa2z/env-backup-*.txt` — `.env` before each edit
- `/home/dropa2z/taxido_settings-backup-*.json` — before enabling commission
- `/home/dropa2z/fixbackup-*/` — `RideRepository.php`, `CommissionTrait.php`, and JSON dumps of `rides`, `ride_requests`, `driver_wallets`, `driver_wallet_histories`, `cab_commission_histories`, `ride_status_activities`

## Verified money flow, cash ride, 5.6 km Jalgaon
Rider pays ₹144.57 = ₹109.40 sub-total + ₹11.00 platform fee + ₹21.67 tax + ₹2.50 commission.
Driver collects ₹144.57 in cash; wallet debited ₹35.17; driver nets ₹109.40.
A driver cannot work on an empty wallet — top-ups are the business model, not an optional feature.

## Correction — 21 October, later

### Firebase: the canonical project is `dropa2z`, not `dropa2z-cacf0`

An original Firebase project existed that the sir had set up. Not knowing this, a second project `dropa2z-cacf0` was created. Access to the original has since been recovered, and **`dropa2z` (117357043695) is now the canonical project.**

The `.env` Firebase block has been reverted to `dropa2z`. The three web keys (`FIREBASE_API_KEY`, `FIREBASE_APP_ID`, `FIREBASE_MEASUREMENT_ID`) were never changed, so the whole block is now internally consistent again. `FIREBASE_CREDENTIALS` deliberately stays at `storage/app/firebase/service-account.json` — it must never go back to the public webroot.

The `settings` table already held `dropa2z` values, so no change was needed there.

**Outstanding, because the apps still carry the wrong project:**

| Where | Currently | Needs |
|---|---|---|
| `Taxido_user/android/app/google-services.json` | `dropa2z-cacf0` | regenerate from `dropa2z` |
| `Taxido_driver/android/app/google-services.json` | `dropa2z-cacf0` | regenerate from `dropa2z` |

`dropa2z` currently has only `com.dropa2z.destination` registered — a dead package. Both real packages, `com.dropa2z.user` and `com.dropa2z.driver`, must be added to it before the files can be downloaded. Nothing is lost by this switch; it is about twenty minutes of console work.

### Google Maps: the key is correct for the map, wrong for the REST calls

Earlier this file implied the Maps key was simply broken. More precisely:

- The **Maps JavaScript API** — the map widget visible on the admin pages — works correctly with the current HTTP-referrer-restricted key. Nothing to fix.
- The **REST web-service APIs** (Geocoding, Directions, Distance Matrix, Places) reject referrer-restricted keys from any caller. Verified with and without a `Referer` header; both return `REQUEST_DENIED`.

So `calculateRideDistance()` at `Helpers.php:1721` cannot work with this key, which is why the server falls back to the distance the client supplies.

**The fix is an additional key, not a change to the existing one.** Create an IP-restricted key for the server with the Routes or Distance Matrix API enabled, and Android-restricted keys per app package. Leave the working browser key alone.

### DECISION — `dropa2z-cacf0` is abandoned

**`dropa2z-cacf0` (730162045717) must not be used again.** The canonical and only Firebase project is **`dropa2z` (117357043695)**, the original account.

Sweep completed 21 October. Results:

| Location | Status |
|---|---|
| Server `.env`, `config/`, `app/`, `Modules/` | clean, no reference |
| Server `settings` and `taxido_settings` tables | clean, no reference |
| Effective runtime config | `dropa2z` / `117357043695` |
| `Taxido_user/android/app/google-services.json` | **still cacf0 — must be replaced** |
| `Taxido_driver/android/app/google-services.json` | **still cacf0 — must be replaced** |

Stale build output that embedded cacf0 was quarantined to `_stale-cacf0-<timestamp>/`, including a previously built debug APK. **Do not install that APK** — it points at the abandoned project. Gradle intermediates and generated google-services resources were cleared and regenerate on the next build.

Only two files still carry the old project, and both are replaced by downloading fresh `google-services.json` from `dropa2z` after registering `com.dropa2z.user` and `com.dropa2z.driver` in it.

## App build preparation — 21 October

Roadmap lives in the Artifact, tab **App build roadmap**.

### Build toolchain verified on this machine

| Component | Version |
|---|---|
| Node | 24.15.0 |
| npm | 11.12.1 |
| JDK | 17.0.20.1 |
| Android SDK | `C:/Users/Dhawal/AppData/Local/Android/Sdk` |
| Platforms | android-31, 33, 34, 35, 36, 37.0 |
| Build-tools | 34.0.0, 35.0.0, 36.0.0 |
| NDK | 26.1.10909125, 27.1.12297006 |

Both apps declare `compileSdk 36`, `targetSdk 36`, `minSdk 24`, `ndkVersion 27.1.12297006` — all present.

### Two build blockers found and fixed

**1. SDK path was a placeholder.** `Taxido_driver/android/local.properties` contained the literal string `sdk.dir="Enter Your SDK path here"`, and `Taxido_user` had no `local.properties` at all while `ANDROID_HOME` is unset. Neither app could have located the SDK. Both now contain:

```
sdk.dir=C:/Users/Dhawal/AppData/Local/Android/Sdk
```

Use forward slashes — escaped backslashes do not survive shell processing reliably.

**2. Driver `npm install` failed on a peer conflict.** The rider app pins `lottie-react-native` to `7.3.6`; the driver app used `^7.3.6`, which resolves to `7.5.0` and demands `react >= 19.2` while both apps are on `react 19.1.1`.

Fixed by pinning the driver to `7.3.6`, matching the rider app. **Deliberately not fixed with `--force` or `--legacy-peer-deps`** — those suppress the error and produce a build that fails at runtime instead of at install time. `package.json` backed up beside itself.

### Known user-visible defects in the rider app

The referral feature points at the **vendor's** Play Store listing, via two different wrong IDs:

| File | Wrong link |
|---|---|
| `src/.../profileScreen/ProfileContainer.tsx:117` | `id=com.taxidouser` |
| `src/screens/referralID/index.tsx:47` | `id=com.taxidouserui`, and the share text says "Taxido" |

Every referral sent today advertises a competitor. Both must point at `com.dropa2z.user`.

### Files still holding placeholder keys

| File | Line | Needs |
|---|---|---|
| `Taxido_user/src/utils/context/index.tsx` | 60–61, 63 | Maps key, Google Sign key |
| `Taxido_user/android/app/src/main/AndroidManifest.xml` | 33 | Maps key |
| `Taxido_user/src/utils/echo.ts` | 36–37 | Reverb key and host |
| `Taxido_driver/src/utils/context/index.tsx` | 42–43 | Maps key |
| `Taxido_driver/android/app/src/main/AndroidManifest.xml` | 36 | Maps key |

**The existing Maps key cannot be used in the apps.** It is HTTP-referrer restricted, which is correct for the admin panel's browser map but is rejected on Android. Three new keys are needed: Android-restricted per app package plus SHA-1, and one IP-restricted for the server. Do not alter the key that currently works.

### Result — both apps are dependency-ready

| | Rider | Driver |
|---|---|---|
| `node_modules` | present | **installed 21 Oct, exit 0** |
| react | 19.1.1 | 19.1.1 |
| react-native | 0.82.1 | 0.82.1 |
| lottie-react-native | 7.3.6 | 7.3.6 (pinned) |
| `gradlew` | present | present |
| `local.properties` | fixed | fixed |

Only deprecation warnings on install, no errors. **Both apps can now be built** — `cd android && ./gradlew assembleDebug` — but the resulting APKs will not be testable until the Firebase work lands, because login runs on Firebase Phone Auth.

## Production Google Social Login configuration bridge — 26 October

### Issue

The Admin Settings screen correctly stored Google Client ID and Client Secret in the `settings` record, but the original `SettingRepository::env()` method never copied either value to the Laravel environment. As a result, `config('services.google.client_id')` and `config('services.google.client_secret')` were empty at runtime.

### Fix deployed

`app/Repositories/Admin/SettingRepository.php` now writes these values whenever the Google Social Login settings are present:

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

The production file and `.env` were backed up to `/home/dropa2z/backup_google_social_20261026/` before the change. Existing credentials were transferred from the saved admin settings record without printing them, then Laravel caches were cleared.

### Verification

- Production PHP syntax check: passed.
- Both Google values now load through `config('services.google.*')`.
- Firebase Project ID and service JSON remain present.
- reCAPTCHA site key and secret remain present.
- Existing Maps key remains present; billing/API availability is still not verified.
- Website home page, Driver Portal login, and Admin login each returned HTTP 200 after the change.

### Scope and remaining work

This fixes storage of web OAuth credentials only. Android OAuth clients are still deferred. Before enabling public Google sign-in, the mobile/API login flow must verify the Google ID token on the backend; it must not trust a user profile supplied by the phone alone.

## Admin sidebar logo polish — 26 October

- Created a refined, transparent Dropa2z horizontal logo asset, preserving the black/charcoal and green brand colours and exact `Drop A2Z` wording.
- Saved project asset: `Taxido_laravel/public/images/branding/dropa2z-admin-logo-v2.png`.
- Updated the production admin sidebar template to render the brand inside a compact 144 × 42 px white-to-soft-green card with rounded corners, subtle border, and shadow. It collapses cleanly with the sidebar and expands again on hover.
- Production sidebar backup: `/home/dropa2z/backup_admin_logo_20261026/sidebar.blade.php`.
- `php artisan view:clear` and `php artisan view:cache` both completed successfully.
- The new image still needs to be uploaded through Admin Settings → General → Dark Logo so the production media setting points to it. The styling is already live and will apply automatically after that upload.

### Follow-up sizing correction

The transparent generated asset includes deliberate outer padding, which initially made the visible mark look too small. The live sidebar now safely clips that padding and sizes the logo canvas at 190 px within the 144 px brand card, producing a substantially larger visible wordmark without changing its colours or card dimensions. Blade views were cleared and cached again successfully.

### Dark-sidebar final treatment

The white logo card was intentionally removed because it did not visually belong on the dark-green sidebar. The sidebar now uses a compact inline SVG wordmark: a white location-pin and `Drop`, plus the existing Dropa2z green `A2Z`, on a transparent background. This keeps the logo crisp at all screen densities, requires no media upload, and does not alter the separately configured Light Logo, Dark Logo, or Favicon used elsewhere. Production views were cleared and re-cached successfully after deployment.

### Correction — final sidebar logo behaviour

The inline SVG experiment above was subsequently removed. The live sidebar is again driven by **Admin Settings → General → Dark Logo**, while the Light Logo remains used in its normal system locations. This is the intended final behaviour.

## General Settings Test Mail fix — 26 October

### Issue

The **General Settings → Email Configuration → Send Test Mail** button submitted `test_mail=true`, but the production settings update method did not act on that flag. It saved settings instead of calling the existing test-mail method. In addition, the existing test mail was queued, meaning it could report success before SMTP delivery had been attempted.

### Fix deployed

`app/Repositories/Admin/SettingRepository.php` now:

1. Detects a `test_mail` request before the normal settings update path.
2. Runs the test mail immediately using the submitted SMTP values, returning the real SMTP success or error to the administrator.

This affects only the admin Test Mail action; normal queued application notifications are unchanged. A recoverable production backup exists at `/home/dropa2z/backup_general_test_mail_20261026/SettingRepository.php`.

### Verification

- Production PHP syntax check passed.
- The production admin settings route exists.
- The changed production code contains both the `test_mail` branch and synchronous `send()` call.

## Current authentication decision - 3 November 2026

Verified Drivers may also use the customer app with the same email. The deployed OTP path adds customer role after verification and preserves Driver role/profile/wallet. App session roles and push tokens are separate. This supersedes earlier notes rejecting Driver-only emails from customer login. Server rollback checks passed; final user phone OTP retry pending. Latest Rider frontend is served by Metro 8081, not the older release snapshot.

## Geography scope changed - 3 November 2026

Dropa2z now supports LOCAL delivery within any Indian city, as explicitly chosen by the user. Remove/ignore earlier Jalgaon-only restrictions when making future changes. Pickup and every intermediate/final destination must be in the SAME Indian city; intercity delivery is not enabled. IndiaLocalDeliveryPolicy enforces this on quotes, booking creation and address changes. India Local Deliveries default zone70 is live, using copies of existing Bike/Auto rates; specific Jalgaon zone69 remains preferred. Real local quotes passed in Jalgaon/Mumbai/Pune/Delhi; intercity/foreign routes were rejected. Driver availability still depends on nearby eligible drivers. Frontend is updated in Rider Metro; older Downloads release APKs must be rebuilt before nationwide distribution. Backend backup: /home/dropa2z/dropa2z-backups/india-local-20261103-104138.
