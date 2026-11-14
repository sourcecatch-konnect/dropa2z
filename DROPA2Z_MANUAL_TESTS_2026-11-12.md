# Dropa2z manual test checklist ? 12 November 2026

Use the updated Rider and Driver apps. Check both light and dark mode. This checklist contains expected results, not claims that live tests already passed.

| ID | Test | Expected result |
|---|---|---|
| 1 | Close and reopen Rider | Static Dropa2z logo; no separate animated D spinner on the startup screen. Required account/settings loading still runs. |
| 2 | Open Home and inspect pickup/drop | Compact map icon above ?Choose on map?, at the left of each field; no border around that action; existing green/orange colours retained. |
| 3 | Tap each map action and return | Correct pickup/drop field opens; selected address and coordinates return to that field. |
| 4 | Enter long addresses and clear them | Address has more space; X clears only its field; smaller Swap/multistop controls remain tappable. |
| 5 | Use Swap and add/reorder/remove intermediate stops | Addresses AND coordinates follow the changes; pickup/drop remain correct. |
| 6 | Tap pickup, destination and stop inputs repeatedly | Suggestions remain selectable/scrollable; keyboard does not trigger repeated layout jumps. |
| 7 | Proceed with valid route | Vehicle selection opens directly; there is no preceding separate delivery-details page. |
| 8 | Scroll below vehicle choices; confirm a persistent scrollbar is visible | Contact name, contact number, country code, weight and optional photo are visible on the same scrollable sheet. No contact-import button appears here. |
| 9 | Type in every delivery input | Focused input stays above the keyboard; switching numeric/text keyboards does not reset the form. Scroll to all fields and dismiss keyboard. |
| 10 | Review with blank/invalid fields | Required field errors appear; invalid phone, zero/negative/non-numeric weight cannot create a booking. |
| 11 | Change weight repeatedly, including beyond a vehicle limit | Quote refreshes; stale responses cannot restore an older fare. Review is blocked until the current quote is ready. |
| 12 | Disable internet during a quote, then reconnect/retry | Visible retry message; no stale-price booking; retry recovers without losing the itinerary. |
| 13 | Select optional photo; open Myself/contact choice and return | Photo, contact details, weight, route and chosen stop coordinates remain present. No duplicate booking is created. |
| 14 | Open Payment/Myself/Coupons and slide their content | All three controls stay fully above Review Booking, including when the form is at its top or bottom. Existing options still open, slide and select; returning retains the delivery form. Weight changes clear previously validated coupons so they can be revalidated. |
| 15 | Review and confirm a test booking | Fare, weight, contact and optional photo match; exactly one booking is created. GST/goods-type validation still applies. |
| 16 | Open Settings, signed in and as guest | No Documents entry; separate Terms of Service and Privacy Policy entries are present. |
| 17 | Open each policy | Only the corresponding published policy links appear; they open correctly. An unpublished/unavailable policy shows an honest empty/retry state. |
| 18 | Open deletion on an account never previously deleted | Normal irreversible-deletion confirmation remains; no repeat-deletion/Admin-approval warning. Close without deleting your real account. |
| 19 | On a dedicated account deleted and registered once, open deletion | Repeat-deletion warning explains Admin approval on the next registration. Backend policy remains enforced. |
| 20 | Open Rider ? Chat with staff and active-booking Message driver | Correct conversation and visible Send button; composer stays inside screen bounds. |
| 21 | Open Driver ? Chat with staff and Message customer | Correct conversation and visible Send button; attachment and message controls stay separate. |
| 22 | In both apps, type short and multiline drafts and show/hide keyboard | Send stays visible; input grows only to a bounded height; long messages scroll; last messages are not covered by the composer. |
| 23 | Manually send text and an image in an authorised test conversation | Both arrive once in the intended conversation; double-tapping Send does not duplicate the message. |
| 24 | Disable internet and send in a test conversation | Sending stops with an error after timeout; draft/attachments are retained for retry; failed Driver optimistic message is removed. |
| 25 | Open ticket replies in each app | Input and Send are visible without an extra blank-area tap; footer does not overlap the message list. |
| 26 | Cancel a fresh test booking from Rider | Cancellation persists and Driver/Admin update; the server no longer throws the notify-on-array error. |
| 27 | Complete an authorised test delivery and confirm cash only if actually received | Button settles, payment status is confirmed and completion leads to the receipt. Slow/failed replies trigger a status read; no automatic money-changing retry. |
| 28 | Return Home/Active/History on both apps and refresh Admin | Same booking status and payment status everywhere; no duplicate active booking or completion. |

## Checks performed during implementation

- Rider regression tests: delivery form, booking review/resume, legal policy links, account-deletion gating, and out-of-order vehicle quote responses.
- Source syntax checked on modified screens.
- Live backend document rules confirmed as 10 MB; cancellation notification recipient fix deployed with a backup.
- Whole-repository TypeScript checking currently reports existing errors outside this change; it is not a clean project-wide typecheck.
- No real account was deleted, chat message sent, booking completed or cash payment recorded as part of the automated checks.
- Physical checks and build versions are recorded in DROPA2Z_CHANGES_2026-11-12.md as they finish.
| 29 | While on vehicle and delivery details, drag the sheet down to its lower stop | Sheet remains down instead of snapping back up; map area becomes visible. Drag it up again to return to vehicle/details. |


| 30 | Open delivery details while signed in | Contact name, phone and country code are prefilled from the Rider profile. |
| 31 | Choose Myself, then another phone contact, then Myself again | Each selection fills the visible fields; switching back restores the Rider’s details and clears the other-contact selection. |
| 32 | Select each vehicle and open Payment, Myself and Coupons; return and scroll to photo | Vehicle/fare selection updates; each footer option opens and closes; fields and optional photo remain reachable; sheet can be dragged down and up. Do not submit payment or a real booking. |

## Physical Rider check — 12 November 2026 (A142)

- Rider v3.0.12 / versionCode 13 loaded through Metro.
- “Myself” selection restored the signed-in account name. The profile has no phone number, so the phone field stayed blank; no number was fabricated.
- Selecting another saved contact filled the contact name and phone in the delivery form. The booking payload now follows the selected recipient mode/details.
- Bike Parcel opened Bike with a live quote of ₹49.61 for the 3.38 km / 11 min route. Auto Parcel opened Auto Rickshaw with a quote of ₹77.22 for the same route.
- Payment sheet opened (Cash and online method visible); it was closed without changing payment selection.
- Coupons sheet opened; no coupon was applied.
- Optional packed-item photo control opened Android’s photo picker; no photo was selected.
- Review Booking responded and displayed validation for missing recipient phone and weight. No booking was submitted.
- This is a focused physical check of the Choose Vehicle page, not a complete end-to-end delivery test. No Driver-side check was part of this request.

## Additional verification run — 12 November 2026

- Rider Jest: 43 suites passed; 3 suites could not start; 165 tests passed. The blocked suites were `homepageBooking.test.tsx` and `savedLocations.test.tsx` (Jest navigation mock lacks `createNavigationContainerRef`) plus `App.test.tsx` (Jest does not transform the `react-redux` ESM entry). These are test-runner setup failures, not assertion failures.
- Driver Jest: 18 suites passed; 2 suites could not start; 57 tests passed. `availabilityConfirmation.test.tsx` could not initialize AsyncStorage’s native module in Jest; `App.test.tsx` hit the same untransformed `react-redux` ESM entry. These are test-runner setup failures, not assertion failures.
- Live-device scope: only Rider device A142 is connected. The Choose Vehicle checks recorded above are complete for the available Bike Parcel and Auto Parcel choices. Driver, Admin, two-app realtime, and full live booking items in the checklist remain unverified on this run.
- Not performed: account deletion, sending test chat messages to another person, confirming a booking, completing a delivery, or recording cash payment.
