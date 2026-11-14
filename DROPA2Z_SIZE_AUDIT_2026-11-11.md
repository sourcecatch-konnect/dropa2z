# Dropa2z APK size audit - 2026-11-11

Read-only analysis of the existing v3.0.0 release outputs. No APK was built for this audit, and no size-optimisation changes were applied to application code/assets. Subsequent user-authorized v3.0.1 builds are documented separately. Sizes below are decimal MB (1,000,000 bytes).

| App | Delivered universal APK | Existing ARM64 APK | Architecture-only reduction | APK Analyzer estimated ARM64 download |
|---|---:|---:|---:|---:|
| Rider | 104.04 MB | 54.77 MB | 49.28 MB (47.4%) | 36.47 MB |
| Driver | 144.46 MB | 68.96 MB | 75.50 MB (52.3%) | 42.55 MB |

The ARM64 figures come from already-built APKs with the same app versions; they are not guessed future targets. The download figures come from the Android SDK APK Analyzer `apk download-size` command. They estimate compressed downloads of the existing ARM64 APKs, not measured Play Console App Bundle delivery sizes or installed sizes. ABI-only packaging preserves app features on compatible ARM64 devices; a standalone ARM64 APK will not install on 32-bit or x86 devices. App Bundles let Play select the appropriate device configuration while supporting the declared architectures.

## Where the bytes are

| Component in universal APK | Rider | Driver |
|---|---:|---:|
| Native libraries (all four architectures) | 66.33 MB | 101.68 MB |
| Android DEX code | 13.08 MB | 16.17 MB |
| Hermes JS bundle | 9.41 MB | 8.24 MB |
| Images | 12.24 MB | 11.07 MB |
| Fonts | 0.24 MB | 0.24 MB |
| Other Android resources | 1.68 MB | 5.45 MB |

These are ZIP-entry bytes inside the APK; ZIP headers, signing/alignment and metadata account for the remainder. Native libraries and Hermes bundles are stored uncompressed for loading; recompressing them blindly is not the recommended performance optimisation.

## Further opportunities, ranked by functional risk

1. **Device-specific distribution / Play App Bundle:** the largest directly measured saving, as shown above. Keep ARM32 outputs for older supported devices and x86 outputs where needed. This changes distribution rather than feature behaviour.
2. **Lossless image encoding:** in-memory WebP probes of large static images preserve dimensions/pixels/transparency and show the following potential reductions before packaging validation. No actual image was replaced.
   - Rider: 16 large images probed; 1.94 MB potential entry-byte reduction. Exact final APK/download saving requires re-packaging and checking image rendering, including the brand logo and training screenshots.
   - Driver: 17 large images probed; 2.74 MB potential entry-byte reduction. Exact final APK/download saving requires re-packaging and checking image rendering, including the brand logo and training screenshots.
3. **Code/resource shrinking:** Rider release currently has minifyEnabled=false and shrinkResources=false. Driver already enables them, but broad keep rules preserve React Native, all Google Play Services, Firebase and AndroidX classes; it also disables obfuscation and several optimisations. Narrow rules only after release-device tests for Google login, Firebase/notifications/chat, navigation, document upload and PIN verification. Exact further saving is unmeasured; do not assign a guaranteed MB figure without an optimized build.
4. **Large JS-embedded artwork/data:** source maps include about 1.92 MB of vehicle artwork source in each app and about 1.45 MB of country-selector data. Driver also includes about 0.63 MB of text-encoding source. These are source-module sizes, not additive Hermes/APK savings. Preserve all map markers/vehicle icons/country selection/decoding functionality when reviewing whether binary assets or narrower imports would be more efficient.
5. **Duplicates/fonts:** exact duplicate resource/asset payload is only about 0.11 MB per app. All fonts together are about 0.24 MB per APK; three older GT Walsheim fonts are about 0.18 MB. Low-value cleanup compared with architecture packaging; verify no native text references before removing fonts.

## Features that must be preserved

- Driver navigation contributes a 9.68 MB ARM64 native Google navigation library plus attributable DEX/resources. The existing SDK also supplies maps/navigation-related functionality. Removing it would change the requested product.
- Driver Google navigation DEX attribution is about 7.63 MB before ZIP compression. Ads-related DEX packages, Firebase/Firestore and AndroidX are present; direct source inspection does not by itself prove them safe to remove. Existing ad components are imported in both apps, so ads are not classified as unused.
- Multiple location libraries are actively referenced in Driver pickup, trip and map screens. Consolidation needs behaviour tests for foreground/background tracking, permissions and geolocation; it is not a blind dependency deletion.
- Hermes, animation/worklet libraries, offline-bundled app code, notifications, contact/document uploads, current icons and booking flow remain intact. Smaller disk size alone does not prove smoother runtime performance.

## Conclusion

The main gap with the universal APK is packaging: existing ARM64 binaries are already about 55 MB Rider and 69 MB Driver, with estimated compressed downloads around 36.5 MB and 42.6 MB. About 2.0 MB / 2.7 MB of additional lossless image payload savings is measurable in memory. Further R8/JS/dependency savings need an actual optimized release build plus feature verification; no 31 MB or 38 MB final-size guarantee is made.

## Sources

- [Android app size guidance](https://developer.android.com/topic/performance/reduce-apk-size)
- [R8 optimisation guidance](https://developer.android.com/topic/performance/app-optimization/enable-app-optimization)
- [Hermes](https://reactnative.dev/docs/hermes)

Machine-readable evidence: apk-size-audit-20261111.json.
