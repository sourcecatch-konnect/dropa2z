# Dropa2z Android release preparation

Status: production signing and release-only HTTPS configuration prepared. A final signed release and end-to-end check are still required before public use.

## Signing files

New separate upload keys were generated because the owner confirmed no apps have been uploaded to Play. Private keys are outside the repository in `C:\Users\mishr\.dropa2z-signing`, protected by a restricted Windows ACL. Passwords are stored in Windows-user-encrypted credential XML files, not in Git, chat, build arguments or the application.

Back up the keys and recoverable credentials securely before publishing. The XML encryption is tied to this Windows user/machine; copying it alone to another computer is not a portable password backup. Do not regenerate or overwrite these keys after publishing. Google Play App Signing may use a separate app-signing certificate for distributed installations.

Public fingerprints: `C:\Users\mishr\.dropa2z-signing\public-fingerprints.txt`. Public PEM certificates are beside the keys. Register the appropriate certificate SHA-1/SHA-256 for each Android package in Firebase/Google Cloud before testing Google sign-in and restricted Maps keys in a production-signed build. Keep existing debug certificate registrations for development.

## Build commands — when ready

Run in PowerShell:

```powershell
cd D:\DROPA2Z\dropa2z-src
. .\scripts\Load-ReleaseSigning.ps1
cd .\Taxido_user\android
.\gradlew.bat :app:assembleRelease
cd ..\..\Taxido_driver\android
.\gradlew.bat :app:assembleRelease
```

Universal APKs: each project's `android\app\build\outputs\apk\release\app-universal-release.apk`. Google Play app bundles use `:app:bundleRelease`, after checking the same signing configuration.

Release signing is mandatory. The Gradle validation task rejects missing credentials and known debug signing rather than silently creating a debug-signed release. Debug builds and Metro keep their existing debug key and local HTTP access. Release traffic uses HTTPS.

## Required acceptance checks

- Fresh installation, onboarding, existing-account login and new Driver setup with actual email verification.
- Production certificate registered in Firebase/Google Cloud; Google sign-in and Maps tested from a release-signed installation.
- Rider Books Bike/Auto Parcel and Freight; quote, matching Driver, acceptance, pickup OTP, intermediate/final delivery confirmation, payment, history and optional review.
- Rider cancellation reaches Driver immediately; no stale active request or repeated acceptance.
- Driver Documents: JPG/PNG/PDF selection, 2 MB limit, required future expiry, replace/save, Admin pending-review entry and approval refresh. Test with genuine documents on the owner's account; no generated identity documents.
- Rider/Driver Documents: published Terms and Privacy open correctly. Delivery rules only appear when published; do not replace them with dummy policy text.
- Notifications/chat and app background/foreground recovery on both phones.
- Native launcher icons and all new artwork checked in the release, plus small-screen/large-font review.

References: https://reactnative.dev/docs/signed-apk-android and https://developer.android.com/privacy-and-security/security-config.
