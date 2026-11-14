# Two-phone visual and functional crosscheck ? 4 November 2026

Rider: A142 (00077344Q001174). Driver: A009P (00382769S001692). Compare against C:/Users/mishr/Downloads/Dropa2z Revamped Screens. Each screen is marked only after evidence from the intended foreground app. A capture of Porter on A142 was excluded. No completed delivery or payment is claimed from UI/unit checks.

| App | Card/screen | Current result |
|---|---|---|
| Rider | Home | Layout under review; heading/image fixes coded; four-service booking integration test passed |
| Rider | Services | Pending current-phone capture |
| Rider | History/Upcoming | Pending |
| Rider | History/Active | Pending |
| Rider | History/Past | Pending |
| Rider | Settings | New icon observed; full card review pending |
| Rider | Profile | Pending |
| Rider | Saved Locations | Save form regression tests passed; live save pending |
| Rider | Promo codes | Pending |
| Rider | Referral/List | Pending |
| Rider | Documents | Pending |
| Rider | Wallet/Top-up | Pending; no payment will be charged during layout checks |
| Rider | App Settings | Pending |
| Rider | Staff Chat | Pending |
| Rider | Map/Search/Saved Place | Pending |
| Rider | Booking details/bill/rebook | Pending |
| Driver | Home | A009P updated release installed; debug/hot reload preparing |
| Driver | Dashboard | Pending |
| Driver | Delivery lists/details | Pending |
| Driver | Settings/Profile | Pending |
| Driver | Wallet/Top-up | Pending; no payment will be charged during layout checks |
| Driver | App Settings | Pending |
| Driver | Subscription | Four regression checks including payment route passed; live visual review pending |
| Driver | Support tickets/Create ticket | Pending |
| Driver | Staff Chat | Pending |
| Driver | Documents/Vehicle/Bank | Pending |
| Driver | Referral/List | Pending |
| Driver | Incentives/Earnings | Pending; authenticated account/zone must be valid |

## 4 November 2026 — two-phone checks, 16:28 IST
- Rider A142 and Driver A009P checked concurrently using independent ADB calls; foreground package verified before each action.
- Found and fixed duplicate SVG clip identifiers causing partial Bike/Auto illustrations; each artwork instance now has distinct definitions.
- Refined Driver Dashboard spacing, orange earnings card and compact performance cards, retaining live values and Earnings navigation.
- Driver online/offline indicator previously displayed the next action's icon instead of current presence. It now explicitly displays the current Online/Offline state.
- Offline confirmation sheet was clipped behind the tab bar. Replaced only that sheet with a safe-area-aware native confirmation modal above the navigator; both actions visually verified on A009P.
- Presence changes now require a successful status API response before reporting success. Offline confirmation rechecks the latest driver profile; duplicate taps are guarded. Missing GPS no longer sets the UI online.
- Profile refresh errors now reject instead of replacing the account with an error body. Driver tabs remain Driver while the profile loads; Fleet requires explicit fleet_manager role.
- Driver test run: 4 suites / 9 checks passed (customer details, plans, availability dialog, account-refresh failures/success).
- Live A009P: confirmed Online -> offline dialog -> Confirm -> Offline. Both dialog buttons visible. No payment made.
- Live Rider A142: created Other saved location `UIcheck-20261104` using the real map-selected Jalgaon address; Save returned to the list and the new record is visible. Reopen/delete cleanup still pending.
- AuthKey DLT research: no verified free new PE operator registration. BSNL/MTNL official FAQs publish INR 5,000, SmartPing official PDF publishes INR 5,900 incl GST. AuthKey advertises free DLT registration but fee-waiver conditions need confirmation from its support. No account registration or purchase performed.
