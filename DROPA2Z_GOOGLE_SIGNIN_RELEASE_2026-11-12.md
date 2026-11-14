# Rider release Google sign-in investigation

- Reproduced on A142 with installed Rider 3.0.13: Google account chooser opens, selecting the previously authorized test account returns to login with "Google sign-in was cancelled or unavailable". The user did not cancel this reproduction.
- The app catch block displayed that same message for every SDK exception; no underlying Google error code was retained in the installed release logs. Therefore the exact SDK error code is not yet confirmed.
- Release APK package: `com.dropa2z.rider`.
- APK SHA-1: `74:C5:F4:FC:46:33:6D:4D:4D:68:6E:08:75:DC:BD:20:5A:E6:8C:6E`.
- APK SHA-256: `82:41:70:9F:CA:DF:2C:0D:A9:FF:F5:70:5F:38:BC:A4:DA:7B:7A:99:42:36:AC:6F:0D:03:CB:D3:FC:48:72:E7`.
- Saved `google-services.json` belongs to `dropa2z-two` and lists a different Android signing fingerprint, `5e8f16062ea3cd2c4a0d547876baa6f38cabf625`. Live Google Cloud/Firebase configuration has not been inspected; the saved JSON may be stale. Missing release certificate registration is the leading configuration issue to check.
- The configured web client ID differs from the web client listed in the saved JSON. This alone does not establish invalidity, since one project can have multiple web clients. Do not replace it without checking the Google project.

## Local source correction

Rider sign-in now handles SDK success/cancellation results explicitly, avoids submitting an empty account after cancellation, prevents concurrent attempts, logs SDK error code/message without account tokens, distinguishes configuration/Play services failures, and reapplies configuration if the web client ID changes. The changed TypeScript/JSX source parses successfully. These source changes have not been rebuilt or installed.

## Next live check

Firebase Console > project dropa2z-two > Project settings > General > Your apps > Android com.dropa2z.rider > SHA certificate fingerprints. Confirm/add the release SHA-1 above, then retry Google sign-in. If already registered, inspect Android OAuth package/fingerprint and the configured web client in Google Cloud, and obtain the actual SDK error code with the diagnostic source change.

Reference: https://react-native-google-signin.github.io/docs/troubleshooting
