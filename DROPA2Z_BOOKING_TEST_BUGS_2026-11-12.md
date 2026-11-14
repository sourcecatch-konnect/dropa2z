# Live booking test and launch bug log — 12 November 2026

This records observed behaviour, proposed fixes, and verification separately. A full successful booking has not yet been confirmed in this session.

| ID | Observation | Cause / evidence | Fix and status |
|---|---|---|---|
| B01 | Quotes reject weights above 10 kg despite Bike 20 kg / Auto 90 kg service cards | Live BiddingTrait read global parcel_weight_limit=10. Service-card and booking-request validation already use 20/90. | Backed up live trait to /home/dropa2z/BiddingTrait-weight-backup-20261112.php and patched quote validation to use DeliveryServiceCards per vehicle. Live PHP lint passed; actual calculation accepted Bike20/Auto90 and rejected Bike21/Auto91. Rider integrated and legacy form validation corrected locally and hot-reloaded. Existing shared APK3.0.14 predates these additional fixes. |
| B02 | Acceptance swipes did not confirm assignment during live attempts | Requests222–224 reached Driver258, then timed out. No accepted Ride row was created. First attempt was already almost expired; subsequent swipe failure remains a device verification item. Slider recreated its responder on every one-second countdown render; request sheet could take gesture ownership. | Stabilized responder via useMemo/live width ref and disabled content-panning on request sheet, retaining handle dragging and list scrolling. Local patch; Driver debug installation/build in progress; do not mark passed yet. |
| B03 | Online Driver stopped matching a later request | Request225 had no driver pivot links while Driver258 remained online/available in DB. Redis driver_metadata:258 was missing (TTL -2). Location helper only sends updates after100m movement; metadata expires after600s. | Added60s fresh-location heartbeat through existing API without changing availability status. Clears timer on stop/restart. Await tests and physical verification. |
| B04 | Keyboard can partly cover contact-number input in vehicle sheet | Observed while entering test recipient number in current Rider debug session. | Open; needs focused keyboard test after sheet layout fixes. |
| B05 | Incoming Driver card displays literal null in goods description | Request descriptions contain string "null"; displayed alongside documents and1kg. | Open; display should omit null placeholders. |
| B06 | Duplicate ride-request push notifications / legacy Ride wording | Server log includes both NewRideRequestNotification and InstantRideRequestNotification for same request. | Investigation needed; do not claim duplicate delivery fixed. |
| B07 | Scheduled SMS/email support jobs log errors | SMS Template not found: ride-status-driver-requested; scheduled command:piping failed. | Open; affects launch notification reliability; do not disable channels or change credentials without tracing configuration. |

## Current test facts

- Status checked 13 November: Driver debug 3.0.8 (versionCode 13) APK and output metadata exist, generated 12 November at 17:06. Installation and physical verification of this build have not been confirmed.
- Focused regression tests passed: Driver slider, presence heartbeat and offer handling (8 tests); Rider vehicle limits and delivery validation (7 tests). B02/B03 still require device verification.
- Read-only server check on 12 November: CloudLinux account quota 1 CPU / 1 GiB, about 288 MiB used at inspection; queue worker and Reverb running; database and Redis reachable; sampled queues empty. Historical 27 failed jobs were 26 TestMail transport failures (October) and one newsletter address-format failure (6 November), not confirmed new booking failures. Hosting limits and successful connectivity do not establish public-launch capacity.

- A142 is the only connected phone. Rider283 (Shrikrushna) and Driver258 (Khala Khan) used in installed app sessions; recipient test number9823971070 explicitly approved by user.
- Bike route: Ayodhya Nagar → Khandesh Central Mall/Station Road, Jalgaon; approx3.74km,1kg, documents, quoted₹53.43. Driver card estimated earnings₹29.66.
- Test requests222–224 (#100298–100300) reached Driver258; then expired/cancelled. Request225 (#100301) was created without matching candidates and subsequently cancelled. No pickup OTP, parcel handoff, cash receipt or completed delivery is claimed.
- Earlier context identified ride75/#100293 as completed before this session; it is not evidence of this session's successful end-to-end test.
- Remote server reconnected as6a239cd4-be9c-49e3-bfee-0e629e83bf50. Changes are limited to issues found in this test; no claim that both apps are Play Store ready.
