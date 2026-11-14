# Dropa2z App Developer Notes

This is the learning notebook for the Dropa2z User app. Each meaningful change should be recorded here with a short reason and the command used.

## The mental model

- **React Native source**: the JavaScript/TypeScript app you change.
- **Metro**: the local development server. It sends your JavaScript changes to the phone for Fast Refresh.
- **Android build**: converts the React Native app and Android libraries into an APK Android can install.
- **APK**: the installable Android app file.

## Daily development workflow

Open PowerShell window 1 and start the development server:

```powershell
cd X:\Taxido_user
npx react-native start
```

Keep it open. Then use a second PowerShell window to check the phone:

```powershell
adb devices
adb reverse tcp:8081 tcp:8081
```

`adb devices` must show one device with the word `device`, not `unauthorized`.

## Connecting your phone

Android's command-line tool is called **ADB** (Android Debug Bridge). In a new PowerShell window, make it available and check the phone:

```powershell
$env:Path += ";C:\Users\Dhawal\AppData\Local\Android\Sdk\platform-tools"
adb devices
```

**Result:** the connected phone was detected successfully as `00077344Q001174 device`.

If the result says `unauthorized`, unlock the phone and accept its **Allow USB debugging** popup.

## Why we use the `X:` drive

The starter project folder name is very long. Some Android C++ build tools fail when a file path is longer than 260 characters. `X:` is a temporary short drive mapping to the same existing project; it does not copy or move your files.

Create it after restarting Windows or if `X:` is missing:

```powershell
subst X: "C:\Users\Dhawal\Desktop\DROPA2Z\codecanyon-56450809-taxido-react-native-online-taxi-booking-with-cab-rental-bidding-parcel-admin-laravel-panel"
```

## Changes made so far

### Dropa2z Android identity

- User Android package changed to `com.dropa2z.user`.
- User app display name changed to `Dropa2z`.
- The React Native Android configuration now uses `com.dropa2z.user`.

**Why:** Android package names identify apps uniquely. Firebase must use the exact same name.

### Firebase setup

- The User Firebase configuration file is in `android/app/google-services.json`.
- Its package matches `com.dropa2z.user`.
- Firebase files are ignored by Git, so they are not pushed to GitHub accidentally.

### Development-only Google Ads setting

- Replaced the invalid Google Ads placeholder with Google's official Android **test app ID**.

**Why:** an Android app with an invalid Ads app ID closes immediately at startup. The test app ID lets us run and test the app safely. Replace it with your own AdMob app ID before publishing. Google documents this test ID in its [Android Mobile Ads setup guide](https://developers.google.com/admob/android/quick-start).

### Android build compatibility

- The Android Gradle tools were aligned with the installed React Native version.
- Java 17 and the Android NDK are used for the build.
- The Notifee local Android library source was added to the build configuration.

**Lesson:** a React Native library can include native Android code. Notifee includes its own Android package repository inside `node_modules`, so Gradle needs to be told where to find it.

### Faster phone builds

- Debug builds now read the `reactNativeArchitectures` build setting.
- For this connected phone we use `arm64-v8a`, rather than also compiling code for old 32-bit phones and Android emulators.

**Why:** the connected phone reports `arm64-v8a`; building only that architecture is quicker while developing.

### Current build goal

We are building the **User app debug APK** for standard 64-bit Android phones (`arm64-v8a`). Once it succeeds, we will install it on your phone and use Metro for Fast Refresh.

**Completed:** the User APK built successfully and was installed on the connected phone.

- APK: `android/app/build/outputs/apk/debug/app-arm64-v8a-debug.apk`
- Size: about 66 MB
- Android package: `com.dropa2z.user`
- Fast Refresh server: running at `http://localhost:8081`

## Useful commands

Build a debug APK for a 64-bit Android phone:

```powershell
cd X:\Taxido_user\android
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot"
.\gradlew.bat assembleDebug -PreactNativeArchitectures=arm64-v8a
```

Install a completed APK on the connected phone:

```powershell
adb install -r app\build\outputs\apk\debug\app-arm64-v8a-debug.apk
```

`-r` means reinstall while keeping the app's existing data when possible.

Start Fast Refresh after the app is installed:

```powershell
cd X:\Taxido_user
npx react-native start
```

Then connect the phone to that server:

```powershell
adb reverse tcp:8081 tcp:8081
```

## Next lesson

After the User app opens on the phone, we will learn one small screen change: find a text label, change it, save it, and watch Fast Refresh update the phone.

## Verified phone launch — 19 October 2026

- The repaired User APK installed successfully on the USB-connected phone.
- The app was launched as `com.dropa2z.user` and remained running after launch.
- Metro received the phone's JavaScript bundle request, so the phone is connected to the Fast Refresh server.

**What we fixed:** the old Ads configuration contained an invalid placeholder. We replaced it with Google's official development test app ID, rebuilt the APK, and reinstalled it. This is suitable for local testing only; use your own AdMob app ID before publishing.

### Metro path lesson

The short `X:` path is for **Android builds** because it avoids Windows' long native-file-path limit. Metro must run from the normal project folder instead, otherwise Windows can report the same source file under a different path and Metro cannot watch it.

**Verified:** Metro completed the first bundle and confirmed a connection to `com.dropa2z.user` on the USB phone. Fast Refresh is ready.

### React Native startup-name lesson

Android and JavaScript must use the exact same startup component name. The JavaScript app registers `Dropa2zUser`, so Android's `MainActivity` now requests `Dropa2zUser` too. If these names differ, React Native shows an “app has not been registered” error even while Metro is running correctly.

### Backend API connection

- Both the User and Driver apps now use `https://dropa2z.com` as their backend base URL.
- The apps automatically add `/api/` to this URL when making requests.
- Verified from cPanel: `https://dropa2z.com/api/settings` returns JSON with HTTP status `200`.

**Lesson:** the mobile app and Laravel server are separate. The mobile app talks to the Laravel API through a public HTTPS URL; it never connects to cPanel directly.

### Empty onboarding fallback

The live backend currently returns zero onboarding slides. The original onboarding screen only renders server-provided slides, so it looked blank. When a new Rider has no saved login session, the User app now goes directly to Sign In after startup settings are loaded. Later, adding onboarding content in the Laravel admin panel will restore the normal onboarding experience automatically.

## Phase 1 log

### Auto and Bike-only vehicle selection

- The Rider booking screen now shows only enabled vehicle options named or tagged as **Auto**, **Auto Rickshaw**, **Rickshaw**, or **Bike**.
- Unrelated options such as Truck are not shown during this first release phase.
- A disabled vehicle is not shown, even if it is named Bike or Auto.
- If the server returns no matching vehicle, the app shows no vehicle option instead of using old demo data.

**Why:** Auto and Bike are the only services planned for the first Dropa2z release. This is a basic functionality rule; the final admin-controlled service configuration will be added later in Phase 1.

**Important:** The server remains the final booking authority. When we add the admin toggle, the backend must also reject new bookings for a disabled service.

### Test command

```powershell
cd X:\Taxido_user
npx jest __tests__/initialVehicleOptions.test.ts --runInBand --cacheDirectory ".jest-cache"
```

**Verified:** 2 tests passed. They confirm that enabled Auto/Rickshaw and Bike options remain, while Truck and disabled Bike options are removed.

### Android build for this change

```powershell
cd X:\Taxido_user\android
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot"
$env:ANDROID_HOME = "C:\Users\Dhawal\AppData\Local\Android\Sdk"
.\gradlew.bat assembleDebug -PreactNativeArchitectures=arm64-v8a
```

**Verified:** the debug APK build completed successfully on 19 October 2026. The Android SDK path must be set in a new PowerShell window before building.

**Phone test status:** the ADB service was available, but no USB phone was listed at the time of the final check. Reconnect/unlock the phone and accept the USB debugging prompt before installation.

### Phone installation - Phase 1 Auto/Bike build

The new debug APK was installed successfully on the USB-connected phone and launched as `com.dropa2z.user`.

```powershell
$adb = "C:\Users\Dhawal\AppData\Local\Android\Sdk\platform-tools\adb.exe"

& $adb devices
& $adb install -r "X:\Taxido_user\android\app\build\outputs\apk\debug\app-arm64-v8a-debug.apk"
& $adb reverse tcp:8081 tcp:8081
& $adb shell monkey -p com.dropa2z.user 1
```

**Result:** Android installation returned `Success`; the app process remained running after launch.

### OTP input visibility

- The six OTP boxes now use an explicit readable foreground colour and a solid light/dark background.
- OTP is explicitly displayed as digits, not hidden as a password.
- The input reference now points to the real OTP component, so the final box can lose keyboard focus after six digits are entered.

**Why:** the earlier OTP component did not have an explicit background and its input reference was not attached. On some phones this made entered digits appear invisible.

**Login lesson:** the current Rider app is an OTP-login app. It does not send an email/password to the server. Old demo credentials only work against the old demo backend; Dropa2z needs its own test Rider account and a configured OTP method (real SMS or a deliberately enabled development OTP mode).

### Why a phone can show old React Native code

Android installed the new native APK, but the debug app still loads its JavaScript screens from **Metro** on port 8081. An old Metro process was serving an old bundle, so the OTP change was not visible at first.

**Fix used:** restarted the known Metro process from the normal project path with `--reset-cache`, then restarted the phone app. Metro confirmed both a new bundle request and a connection from `com.dropa2z.user`.

```powershell
cd "C:\Users\Dhawal\Desktop\DROPA2Z\codecanyon-56450809-taxido-react-native-online-taxi-booking-with-cab-rental-bidding-parcel-admin-laravel-panel\Taxido_user"
npx react-native start --reset-cache
```

### Verified service-catalog blocker — 19 October 2026

The connected phone was tested with the built-in **Guest** route. It reached the Dropa2z home screen successfully, so the installed app and basic navigation are working.

The visible Services tab currently receives these two active services from the live backend:

- Parcel
- Freight

This is why it does not yet show Auto Rickshaw and Bike. The app's vehicle filter runs later, after a passenger ride service has been selected; it cannot create a valid passenger booking service on the server.

**Phase 1 dependency:** create and enable one passenger ride service in the backend, with Auto Rickshaw and Bike vehicle types. The app can then show those two offerings and send valid booking requests. The service toggle feature will later make this server-controlled, so disabling Auto or Bike also prevents new bookings at the API level.

**Do not use the old demo accounts as a test:** they belong to a different backend. To test real login, create a Dropa2z Rider account and configure either a real SMS OTP provider or an explicitly development-only test OTP mode.

### Backend-first development rule — 19 October 2026

From this point, the backend is the source of truth. We will never add a service button to the Rider or Driver app before the service is configured and tested in the backend.

For the first passenger release, the backend sequence is:

1. Create and enable the passenger-ride parent service.
2. Create the normal **Ride** category under it.
3. Create two enabled vehicle types: **Auto Rickshaw** and **Bike**.
4. Assign them to the live operating zone, set the pricing rules, and make them available to eligible Drivers.
5. Create Dropa2z test Rider and Driver accounts, then test an end-to-end booking.
6. Make the apps show only the active backend vehicle types.

**What we verified in the deployed backend:** it already supports a passenger service type, Ride categories, vehicle-type status switches, zone assignment, and vehicle images/map icons. The current database is simply missing the active passenger parent service, so the admin screen cannot yet provide Auto Rickshaw or Bike as bookable offerings.

### Live backend update — Dropa2z Rides enabled

The first backend Phase 1 step is complete. The existing disabled passenger service was safely reused instead of creating a duplicate:

- Service ID: `6`
- Customer-facing name: **Dropa2z Rides**
- Type: passenger ride service (`cab` internally)
- Description: `On-demand Auto Rickshaw and Bike rides.`
- Status: enabled

**Verified:** the public service API now returns Dropa2z Rides as active. Parcel and Freight were not changed. There are intentionally still no passenger Ride categories or vehicle types; those will be added in separate, verified production steps.

### Live backend update — Ride category created

The second backend Phase 1 step is complete:

- Category ID: `19`
- Name: **Ride**
- Parent service: **Dropa2z Rides** (service ID `6`)
- Internal booking type and slug: `ride`
- Status: enabled
- Description: `Book an Auto Rickshaw or Bike ride.`

**Verified:** the public service API returns this Ride category under Dropa2z Rides. Parcel and Freight were not changed. The next separate backend step is to create the Auto Rickshaw vehicle type, then verify it before creating Bike.

### Live backend update — Auto Rickshaw staged safely

The Auto Rickshaw vehicle type has been created as a **disabled staging record**, not a customer-visible service:

- Vehicle type ID: `14`
- Name: **Auto Rickshaw**
- Parent service/category: Dropa2z Rides → Ride
- Service zone: Jalgaon (zone ID `69`)
- Seats: 3
- Status: disabled
- Fare fields: all `0.00`

**Verified:** it has exactly one service link, one Ride link, and one Jalgaon zone link. It is intentionally disabled because pricing and an eligible test Driver have not been configured yet. Never enable a vehicle type with zero fares or without a successful end-to-end booking test.

### What is still needed before launch

- Approved passenger pricing for Auto Rickshaw in Jalgaon. An existing delivery-vehicle price is only a reference, not a passenger-price decision.
- A Bike vehicle image and separate Bike map icon uploaded to the backend.
- A Dropa2z test Rider and a properly approved test Driver linked to the new passenger service.
- A secure OTP test path. Do not enable a shared or predictable OTP on production just to speed up testing.

### Temporary scoped test login — 19 October 2026

For short Phase 1 testing, the app now recognizes an explicit server response for exactly two test emails:

- `rider.test@dropa2z.com`
- `driver.test@dropa2z.com`

This is not a global OTP-off switch. The server keeps the feature disabled unless it has an enabled flag, the exact email allowlist, and an expiry date/time. When enabled, it returns a fresh single-use server token only to one of those test emails; the app immediately verifies it and opens the correct logged-in area without showing the OTP boxes.

**Developer lesson:** authentication rules belong to the server. The app only obeys a signed-in result returned by the API; it does not contain an OTP bypass switch or a secret test code. This means you can test quickly while real users remain protected by their normal OTP flow.

To turn it off after testing, set `DROPA2Z_TEST_AUTH_ENABLED=false` on the server and clear its configuration cache. Never commit the live `.env` values.

### Local vehicle-icon preview — 19 October 2026

The Rider app now keeps the standard vehicle-selection interface but has a safe local visual fallback while the live vehicle catalog is unfinished.

- Auto Rickshaw uses `src/assets/images/vehicles/auto-rickshaw.png`.
- Bike uses `src/assets/images/vehicles/bike.png`.
- Truck is stored at `src/assets/images/vehicles/truck.png` for the future cargo service; it is intentionally not displayed during the two-service Phase 1 release.

When the server has no enabled Ride vehicles, Auto Rickshaw and Bike appear as **Preview** cards. Tapping the booking button shows a message rather than creating a fake booking or fake fare. Once backend vehicle types, fares, and drivers are live, the API vehicle list replaces the local preview automatically.
