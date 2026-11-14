# Rider and Driver changes — 6 November 2026

Changes are in the connected debug apps through Metro hot reload. No standalone release APK was rebuilt for this batch.

| Request | Implementation | Verification |
| --- | --- | --- |
| Your Places: Home, Shop, Godown | New defaults and matching shop/warehouse icons; existing saved records retained | Confirmed by user on A142 |
| Parcel Details: remove toll note and Description | Removed the form notice and description input; existing fare calculation retained | Source checked; fresh parcel form needs user check |
| Receiver contact import | Permission-based searchable contact picker; imports Indian mobile/name, deduplicates numbers; name remains editable | Phone/name normalization and registration-related regressions passed; user must test native contacts permission |
| Scooter in Choose a Vehicle | Shares actual Bike vehicle ID, fare and matching pool as approved; unique UI selection key and scooter illustration; preference stored in delivery details | Shared fare/backend-ID unit case passed; live Scooter booking pending |
| Rider delivery/PIN screen back control | Visible back arrow and Android back return to Home without cancelling the booking | Implemented; live accepted/arrived booking check pending |
| Rider Message button below viewport | Call/Message moved above PIN content in shared compact PickupCard | Callback regression tests passed; practice screenshot checked |
| Driver delivery back controls | Safe-area back controls on accepted pickup, pickup PIN, active drop and details screens | Implemented; accepted delivery check pending |
| Driver minimum wallet warning | Live Admin minimum set to ₹10; existing Allow Negative Balance=1 preserved | Server and Driver Redux snapshot both show 10; no wallets reset |
| Driver SOS / Locate / speed overlap | Separated controls above tabs; nearby button labelled and themed | A009P screenshots verified separation |
| Meaning of + button | Nearby fuel, EV charging, parking, washing and repair services | Kept existing handlers; labelled Nearby |
| Request card opens too low | Request sheet opens at 80%; removed fixed 50%-height content restriction | Source changed; incoming live request check pending |
| Arrived / drop cards too large or clipped | Compact pickup styling, scrollable drop sheet with 55%/85% positions and flexible action rows | Shared pickup rendering tests and practice screenshot checked; real multi-stop drop check pending |
| Four pickup PIN boxes | Four visible boxes backed by one BottomSheet-aware numeric input; explicit server verification retained | Source parsed; keyboard-on-live-pickup check pending |
| Account photos on both sides | Rider photo added to live ride response; Driver photo alias added; app accepts legacy and current photo fields | PHP lint passed; live accepted booking photo check pending |
| Driver logout layout | Replaced offset image/text layout with themed scrollable confirmation; actual logout/cancel handlers retained | Source parsed; user logout test pending |
| Vehicle Registration | Real editable form for unverified drivers using existing update/vehicle endpoint; verified vehicles clearly shown as locked for Admin review | Verified account page rendered on A009P; fresh unverified save pending |
| Registration vehicle photos | Provided Bike, four auto variants and Scooter vector guide; photo can select an eligible backend category; read-only guide available for verified accounts | Gallery rendered on A009P; no verified vehicle changed |
| Driver onboarding order | Contact verification → personal info → vehicle → driver and vehicle KYC → Admin verification | Multipart registration tests passed; fresh signup/approval pending |
| Training / Pro Driver | Six-step practice, on-device example screenshots, server progress, retries, mandatory training for new drivers after KYC approval; Admin Driver Details shows progress/badge | 3 PHP tests / 16 assertions passed; all six practice previews captured without progress writes; full fresh-account course pending |

## Backend deployment

- Deployed by surgical patches preserving unrelated live code.
- Backup: `/home/dropa2z/nov6-driver-flow-backup-20261106-161359`.
- Migration: `2026_11_06_160000_create_driver_training_progress_table`.
- Existing drivers remain available without mandatory retraining and do not receive a Pro badge automatically. New drivers must finish training before going online. Admin document approval remains required.
- Protected routes: `GET /api/driver/training` and `POST /api/driver/training/step`; Sanctum authentication, driver-role checks, Admin-verified status on progression, sequential/idempotent steps.
- Training state is saved separately from real bookings. Practice does not create rides, collect money, send messages or verify a real pickup PIN.
- Redis queue worker confirmed running after deployment (`2797056`).

## Checks passed

- Rider: 21 tests across receiver contacts, Scooter fare/pool, saved categories, booking review and booking snapshots.
- Driver: 16 tests across multipart registration, pickup-card contacts, wallet policy and request eligibility.
- Backend: 3 training progression tests / 16 assertions; staged PHP lint passed.
- Changed TS/TSX modules parsed successfully.
- On-device screenshots: separated Driver map controls, Rider default places, verified vehicle details and vehicle photo guide; six clearly labelled training previews.

## Next manual checks, one at a time

1. Parcel Details: import a receiver, edit their name, continue without Description.
2. Bike service → Scooter quote: confirm equal Bike fare and persistent Scooter selection, then book.
3. Accept a delivery: photos, top back button, Home resume card, four PIN boxes with keyboard open, visible Message control, and each drop/payment step.
4. New Driver: email/mobile verification, personal details, vehicle photos and selectors, KYC submission, Admin approval, required practice and Pro status.
5. Driver logout confirmation: cancel then confirm logout.

The live booking, native permission and fresh-registration checks above are not claimed complete by the code/unit checks.

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
