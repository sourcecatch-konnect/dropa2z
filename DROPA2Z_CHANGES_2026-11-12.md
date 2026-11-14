# Changes ? 12 November 2026

- Rider startup: removed separate animated D mark; static full logo and startup authentication/settings flow retained.
- Home address controls: compact left-hand stacked map action, no action border; existing green/orange preserved; Swap/multistop controls reduced.
- Rider Settings: Documents menu replaced by separate Terms of Service and Privacy Policy routes, using published backend policy links. Driver KYC documents remain available.
- First deletion: repeat-deletion/Admin-unlock warning hidden until an earlier deletion/re-registration exists; two-step confirmation and backend protection retained.
- Delivery form moved into the vehicle-selection bottom sheet. Existing Outstation route redirects for compatibility. Direct fresh/rebooking callers use BookRide. Contact import removed from delivery form; Myself/contact selection remains. Optional photo and contact/weight fields persist through that flow.
- Weight quotes refresh with debounce, a latest-request guard and booking validation; previously applied coupons clear on weight change. Sheet snap points remain stable during keyboard transitions.
- Rider/Driver chat composers use bounded multiline inputs, fixed Send controls and safe-area padding. Failed sends retain drafts and attachments; duplicate taps guarded and sending bounded to 25 seconds. Missing booking chat metadata falls back to support instead of a NaN room. Ticket reply composers are initially visible in normal flex layout.
- Completion requests: bounded status/payment HTTP waits and completion reconciliation; no automatic payment retry. Full live completion still requires manual confirmation.
- Backend: fixed Rider cancellation notifying an array snapshot rather than a User model. Live narrow deployment backed up at /home/dropa2z/booking-notify-backup-20261112-052933.php. No booking/account/payment data changed.
- Prior document task: live signup/update file rules verified max:10240; previous deploy backup found at /home/dropa2z/DriverAuthController-docsize-backup-20261111-132344.php. Driver 10 MB client checks retained.
- Manual checklist: DROPA2Z_MANUAL_TESTS_2026-11-12.md.
- Verification: 19 Rider regression tests passed, plus 1 quote-race regression passed separately. Source parsing passed. Existing project-wide TypeScript failures remain; no claim of a clean whole-project check.
- Builds / physical checks: in progress.

- Web PHP upload check completed: upload_max_filesize=64M and post_max_size=64M under fpm-fcgi; temporary public probe removed automatically.
- Additional Driver API tests passed (2): bounded payment/completion calls and status read, validation errors propagated without a payment retry.
- Initial build verification found the packaging helper still expected old graphics markers. Updated its November 12 verification to require current booking/chat markers and retain exact-logo, signature, embedded-bundle and architecture checks.
- Final packaging rerun includes the contact-form route preservation and strict completion error propagation, found during regression review.

- Physical Rider checks: v3.0.4 launched without AndroidRuntime/ReactNativeJS errors, displayed separate Terms/Privacy entries, fetched the published Terms link, and showed the chat Send control. Opening the keyboard exposed Android overlay behaviour; fixed chat/ticket KeyboardAvoidingView to Android height mode with top safe-area offset. Final v3.0.5 build includes that correction; physical recheck pending.

- Android chat keyboard fix verified physically in Rider v3.0.7: full input and Send control remain above open keyboard (nov12-measured-chat-keyboard-final.png). Shared KeyboardViewport measures its screen origin and keyboard top, instead of depending on adjustResize; the same implementation is used in Driver chat and both ticket screens. Regression test passed for native-resize stability.
- User clarified map control placement: LEFT, not right. Final controls keep icon above caption, no action border and original colours; caption shrinks within one line instead of truncating.
- Physically opened the integrated vehicle/details sheet from a Jalgaon route; Contact name/number, Weight and optional photo are below the vehicle. Numeric weight input stays visible above keyboard. No booking submitted.
- User reported the options row covered by Review Booking. Moved Payment/Myself/Coupons into a fixed row outside the vertical form scroll, reserving the measured review-footer height. Final Rider packaging/visual check pending.

- Driver v3.0.6 physically launched and chat Send/input are fully above the keyboard (nov12-driver-chat-keyboard.png). Found an old card style wrapping the entire message list; removed its border/shadow for the final Driver package.
- No actual chat messages were sent during visual checks.

- Focused test totals: Rider 21 (20 earlier + measured keyboard viewport regression), Driver 16 (14 document regressions + 2 completion API regressions).
- User test checklist also copied to Windows Downloads/Dropa2z-Manual-Tests-2026-11-12.md.

- Rider sheet jump fix: removed the forced snap from the lower 55% stop to the upper 88% stop. This lets users drag the sheet down and restore more map visibility; the page still opens expanded initially. Rider build is in progress; manual drag check remains pending.
- Rider v3.0.10 (versionCode 11) built successfully and installed on A142. This release removes the forced snap from the lower sheet stop; APK copied to the phone Downloads folder. Drag/map behavior still needs a manual confirmation.
- Rider v3.0.11 (versionCode 12) built and installed on A142; persistent vertical scroll indicator added to the integrated vehicle/delivery form. APK copied to phone Downloads. The photo field should be reached by scrolling the form above the fixed Payment/Myself/Coupons and Review controls; physical scroll confirmation remains pending.

- Focused Choose Vehicle check on A142 (Rider v3.0.12 / code 13): Myself restores account name; profile has no phone, so the phone remains blank. Another saved contact populated name and phone. Bike Parcel displayed Bike at ?49.61 and Auto Parcel displayed Auto Rickshaw at ?77.22 on the same 3.38 km / 11 min route. Payment and Coupons sheets opened, optional photo launched the picker, and Review Booking showed required-field validation. No coupon/photo/payment was applied and no booking was submitted.

- Full Jest runs on November 12: Rider 43/46 suites ran successfully and 165 tests passed; 3 suites were blocked during initialization by navigation mock / `react-redux` ESM Jest configuration. Driver 18/20 suites ran successfully and 57 tests passed; 2 suites were blocked during initialization by AsyncStorage Jest setup / `react-redux` ESM configuration. No assertion failures were reported in the suites that ran.
- Full manual checklist is not complete: only A142 Rider is currently connected. Driver/Admin and realtime two-app scenarios remain unverified. Destructive account deletion, outbound chat, live booking creation/completion and cash settlement were not performed.
