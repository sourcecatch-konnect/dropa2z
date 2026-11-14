# Dropa2z UI update ? 4 November 2026

## Scope and source

Use the supplied Revamped Screens PNGs and SVGs for both native apps. Preserve real navigation, API calls, authentication, pricing, payments, document uploads, tracking and booking state. The homepage remains unchanged while its separate design decision is pending. The existing launcher icon remains unchanged.

## Implemented

- Import the supplied SVG artwork separately into each app. Add scoped screen, card, input and button styles; orange primary actions, black headings, light backgrounds, round white cards; preserve dark mode and the green wallet/referral and blue finance areas.
- Shared and tab headers display the supplied logo; retain back, notification, wallet and add-location actions. Refresh saved-location and delivery-list headers. Use supplied bottom-tab SVGs outside Home while retaining the existing real tabs.
- Apply the card styling across service selection, history states, settings, profile, saved places, promos, referrals, documents, wallet, top-up, chat, notifications, Driver dashboard, subscription, tickets, vehicle and bank details.
- Subscription plans use the actual Admin plan data and payment route; remove the old fixed-height carousel in favour of readable cards. No mock plan names, sample prices or sample bookings are introduced.
- Driver offline screen Retry checks connectivity and reports a failed retry. Wallet Gift Card explains that the feature is unavailable rather than silently ignoring the tap.
- Fix missing SignInWithMail and Login redirects to SignIn, Ride navigation to Delivery, ChooseRider to ChooseRiderScreen, missing package StopTimer route to existing active-trip Payment tracking, and the legacy add-location link to LocationSave.
- Implement Fleet refresh with existing account, driver-list, wallet and dashboard actions, an in-flight guard and visible refresh failure.
- Render read-only Driver vehicle price-type settings as static indicators rather than no-op checkboxes.

## Verification

- Rider: 49 tests across 8 suites passed (booking contacts, saved pins, saved address search, location selection, service options, and saved-location form).
- Direct Save form checks: posts selected address/coordinates, updates the existing record, shows server rejection without leaving the form, validates blank titles and prevents repeat-tap duplicate saves.
- Driver: 4 tests across 2 suites passed (customer details and actual subscription data, payment routing, current-plan protection and empty plans).
- Source scanner: no parse failures; no missing literal Driver routes. Two Rider missing links remain in the dormant carpool template, which is outside the Parcel/Freight service UI. Do not enable that template.
- The source scanner also flags decorative touch wrappers, dormant legacy screens and read-only controls. It does not establish that every network-dependent action works on the live server.
- Full release APK builds started for rider and driver with tag 20261104-Revamped. Packaging, phone transfer and startup checks will be recorded below when completed.
- Protected-screen visual QA and a real delivery/payment test are not yet completed for this UI version. Both apps were signed out at the last installed-version check. No login bypass or fabricated data was used.

## Reference screen coverage

PNG variants represent multiple states of the same live screen. Existing artwork is retained where the folder contains a flattened screenshot instead of an isolated illustration; SVG icons and logo are imported directly. Do not claim pixel-for-pixel coverage of unviewed authenticated states.

| Reference | Implementation area |
|---|---|
| User/01_Home | Home excluded pending design decision |
| User/02_Services | CategoryScreen and real Parcel/Freight options |
| User/03_History | RideScreen history header/tabs/cards |
| User/04_Active_deliveries | History active tab |
| User/05_Past_deliveries | History past tab |
| User/06_Settings | ProfileSetting menu cards |
| User/07_Profile_settings | EditProfile and shared inputs/buttons |
| User/08_Saved_locations | SavedLocation header, list and real pin selection |
| User/09_Promo_codes | PromoCodeScreen |
| User/10_Earn_money_referral | ReferralID real code/share/list |
| User/11_Referrals | ReferralList |
| User/12_Documents | Documents and published-policy links |
| User/13_Wallet | Wallet and balance/history components |
| User/14_Wallet_top_up | TopUpWallet and existing payment controls |
| User/15_Settings_more | Profile settings menu sections |
| User/16_App_settings | AppPageScreen with existing language/theme controls |
| User/17_Chat_with_staff | ChatScreen header/bubbles/send |
| User/18_Service_selection | Standalone LocationDrop; embedded homepage form retained |
| User/19_Select_location_on_map | LocationSelect functional map picker retained |
| User/20_Notifications | Notifications cards |
| User/21_Destination_search | Standalone LocationDrop search; homepage retained |
| User/22_Location_suggestions | Existing address/saved-place suggestions |
| User/24_Pending_delivery_details | PendingRide details and assigned-driver card |
| User/25_Pending_delivery_bill | PendingRide bill and invoice controls |
| User/26_Rebook_setup | Existing rebook flow and standalone LocationDrop |
| User/27_Add_saved_location | LocationSave map/address selection |
| User/28_Save_location_form | LocationSave title/type/Save form |
| Driver/01_No_internet_connection | Offline card and connectivity retry |
| Driver/02_Wallet_balance_alert | Existing wallet-balance alert; Home layout retained |
| Driver/03_Home | Home excluded pending design decision |
| Driver/04_Dashboard | Dashboard logo, cards and chart |
| Driver/05_My_deliveries | My Delivery header, tabs and cards |
| Driver/06_Active_deliveries | My Delivery active tab |
| Driver/07_Past_deliveries | My Delivery past tab |
| Driver/08_Cancelled_delivery_details | PendingDetails cancellation/detail cards |
| Driver/10_Settings | Settings profile and menu cards |
| Driver/11_Profile | ProfileSetting and shared inputs/buttons |
| Driver/12_Wallet | MyWallet and balance/history components |
| Driver/13_Wallet_top_up | TopUp and shared payment controls |
| Driver/14_App_settings | AppSettings and existing language/theme controls |
| Driver/15_Subscription_plans | Subscription real Admin plans and PaymentSelect |
| Driver/16_Support_tickets | SupportTicket list |
| Driver/17_Create_support_ticket | CreateTicket inputs, priority, attachments and submit |
| Driver/18_Chat_with_staff | Chat header, bubbles and send control |
| Driver/19_Settings_more | Settings menu and registration sections |
| Driver/20_Document_registration | DocumentsScreen real upload, preview, expiry/status and save |
| Driver/21_Vehicle_registration | VehicleDetail and shared registration inputs |
| Driver/22_Bank_details | BankDetails and existing payment-account form |
| Driver/23_Earn_money_referral | ReferralHome |
| Driver/24_Referrals | ReferralList |
| Driver/25_Incentives | Incentive cards |
| Driver/26_Earnings | Existing TotalEarnings with shared branded Header |
| Driver/27_Weekly_earnings | Existing earnings detail with shared branded Header |

## Homepage approved ? orange logo everywhere

The user subsequently approved the exact User/01_Home reference. Homepage is now included: festive approved artwork, live city/profile/notification/wallet actions, four controlled Admin-backed service choices, existing pickup/destination/stops/swap/map/saved-address controls, recent searches, compact real recent-delivery cards and orange Proceed. The native form remains mounted when switching services or opening the keyboard. Home uses a green selected tab; all tabs use intact icons, including the corrected sliders Settings icon.

Both apps use the orange approved wordmark in splash, login and shared headers; Android launcher resources use the supplied orange SVG. The source PNG is used only for illustration/logo regions; controls, text, amounts and records remain native and dynamic.

The new homepage integration test passed: all four service changes retain pickup/destination, and Proceed sends the correct Auto Freight category, vehicle kind and exact endpoints to Outstation. Regression count is now 54 tests (50 Rider, 4 Driver). New full APK tag: 20261104-Revamped-HomeOrange. Earlier 20261104-Revamped APKs omit this newly requested homepage/orange-logo update.
