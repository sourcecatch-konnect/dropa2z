# Dropa2z Rider and Driver button/route audit ? 3 November 2026

Read-only audit of the current local source. No app code, database, Admin configuration or installed APK was changed. This report audits whether controls are wired; it is not a claim that every wired backend operation succeeds.

## Coverage

- Parsed all 833 Rider and 686 Driver JS/TS source files under src: 1,519 files, no parser failures. Also inspected both App.tsx/index.js entrypoints.
- Scanned 465 Rider and 354 Driver event-handler attributes, including navigation calls, empty callbacks, custom named callbacks and touchable/button elements without handlers.
- Compared calls against 83 Rider and 72 Driver registered stack/tab route names; reviewed data-driven Settings menus, nested navigation and reset targets. A name in a TypeScript route type alone is not a registered screen.
- Found **15 Rider calls to 8 missing route names**, plus **2 Driver calls to missing Ride**: **17 call sites / 9 app-specific missing route names**. Full call-site inventory below.
- Reviewed apparent no-handler results manually. Wrappers, sheet backgrounds, display cards and child-controlled radio buttons are not counted as broken buttons.
- Visibility is conditional on role, service type, history data, login state and Admin flags. Registered legacy screens without an incoming entry path are explicitly identified; do not treat them as buttons visible in today's parcel flow. Backend-provided URLs/menu values still need runtime checks.

## Current or configurable customer/driver entry paths

| ID | Control or trigger | What is wrong | Evidence |
|---|---|---|---|
| D01 | Driver: tap a non-ambulance booking request card when bidding is enabled | Calls missing Ride. Registered screen is Delivery. The direct Accept slider follows a different, wired handler. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_driver/src/screen/home/homeScreen/index.tsx:792); [Source](/D:/DROPA2Z/dropa2z-src/Taxido_driver/src/screen/home/component/upcomingRide.tsx/index.tsx:290) |
| D02 | Driver: Ride Info ? Accept / Place Bid for non-rental deliveries | Both use gotoRide ? missing Ride. Delivery is registered instead. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_driver/src/screen/myRide/rideInfo/index.tsx:26) |
| D03 | Fleet dashboard ? refresh icon | handleRefresh is an empty function. The icon gives no refresh action; Fleet mode only. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_driver/src/screen/fleet/fleetHome/index.tsx:590); [Source](/D:/DROPA2Z/dropa2z-src/Taxido_driver/src/screen/fleet/fleetHome/index.tsx:957) |
| R01 | Rider: guest wallet button on Home / Services / History headers | With no token and login_number=0, redirects to missing SignInWithMail. Signed-in wallet path goes to registered Wallet. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/components/homeScreen/headerContainer/headerContainer/index.tsx:35); [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/commonComponent/headerTab/index.tsx:33) |
| R02 | Rider: Saved Location action from booking, when authentication is required | The email-only guest branch also redirects to missing SignInWithMail. The registered login screen is SignIn. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/locationDrop/index.tsx:954) |
| R03 | Rider: Wallet ? Gift Card | Visible card has no onPress. It also displays a coming-soon image, so this is an explicit placeholder rather than a missing route typo. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/wallet/component/balanceTopup/index.tsx:109) |
| R04 | Rider: any authenticated action receiving an expired-session HTTP 401 | Interceptor clears the token then resets to missing Login. This is an automatic broken redirect, not a separate button. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/api/apiClient.ts:121) |

## Conditional rental/package and read-only controls

| ID | Control or trigger | What is wrong / condition | Evidence |
|---|---|---|---|
| R05 | Older Rental booking ? choose someone else/contact | navigate(ChooseRider); only ChooseRiderScreen is registered. Main BookRide uses its separate flow. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/bottomTab/category/selectRide/container/detailContainer/index.tsx:243) |
| R06 | Older HomeService category / scheduled location continuation | Three navigate(Ride) calls remain. The new Parcel/Freight Services cards already use Delivery and are excluded from this finding. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/components/homeScreen/topCategory/index.tsx:127); [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/components/homeScreen/topCategory/index.tsx:143); [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/homeScreen/component/index.tsx:114) |
| R07 | Find Driver and Rental saved-location guest authentication | Two more calls to missing SignInWithMail, conditional on email-only login configuration. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/findDriver/locationScreen/index.tsx:536); [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/rentalLocation/index.tsx:338) |
| R08 | Package-category completion transition | Two automatic completion paths navigate to missing StopTimer. Normal parcel/freight completion uses Payment instead. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/rideActive/index.tsx:259); [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/rideActive/index.tsx:299) |
| R09 | Older Rental location/time card ? Now | TouchableOpacity with no onPress; no time picker opens from this card. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/bottomTab/category/selectRide/container/locationTime/index.tsx:25) |
| R10 | Rental payment map ? Safety | Visible Safety button has no onPress. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/paymentRental/index.tsx:384) |
| D04 | Driver rental request ? Decline | The Decline control has no onPress; its adjacent Accept control does have a handler. Rental requests only. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_driver/src/screen/myRide/rentalDetails/index.tsx:701) |
| D05 | Driver Documents ? Update after all documents are verified | allVerified branch renders a grey Update button without onPress. Unverified branch has a working gotoDocument callback. Appears intentionally read-only, but the control is not explicitly disabled/explained. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_driver/src/screen/settings/documentDetail/index.tsx:565) |
| D06 | Driver Vehicle Detail ? Per Day / Per Hour / Per Km checkboxes | onPress is empty for all three. Adjacent vehicle fields are read-only too, suggesting a display-only section. This is a UI/affordance decision, not a missing navigation route. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_driver/src/screen/settings/vehicleDetail/index.tsx:333) |

## Dormant and older taxi/carpooling UI

These findings are real in their source components, but several are not exposed by the current Parcel/Freight home screen. Prefer removing unsupported legacy entry paths rather than silently enabling passenger transport features.

| ID | Control | Source finding / reachability | Evidence |
|---|---|---|---|
| R11 | Legacy completed-delivery screen ? Download Invoice | No onPress. CompleteRide is registered but no direct incoming navigation call was found. Current PendingRideScreen has a separate viewInvoice implementation. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/bottomTab/myRide/completeRideScreen/completeRide/index.tsx:74) |
| R12 | Legacy FindingDriver ? Cancel | Cancel button has no onPress. This old component is referenced by old Parcel/outstation widgets; it is separate from current BookRide request cancellation. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/bottomTab/category/findingDriver/index.tsx:85) |
| R13 | Ambulance Payment ? Apply coupon / Proceed to Pay | Both controls have no onPress; ambulance price card is also a touchable without an action. AmbulancePayment is registered, but no incoming navigation call was found. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/ambulance/ambulancePayment/index.tsx:138); [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/ambulance/ambulancePayment/index.tsx:205) |
| R14 | Carpooling Home ? Search Ride / Create Ride / swap arrows | All three touchables have no handler. CarpoolingHome is registered but no incoming call from current navigation was found. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/carpooling/carpoolingHome/index.tsx:69); [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/carpooling/carpoolingHome/index.tsx:72); [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/carpooling/carpoolingHome/index.tsx:103) |
| R15 | Publish Ride ? pickup field/map picker / swap arrows | Pickup calls empty gotoMap; swap has no onPress. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/carpooling/publishRide/index.tsx:28); [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/carpooling/publishRide/index.tsx:54) |
| R16 | Carpooling Edit Vehicle ? Add New Vehicle | No onPress. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/carpooling/editVehicle/index.tsx:51) |
| R17 | Carpooling Stopover ? Add Another City | No onPress. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/carpooling/stopover/index.tsx:72) |
| R18 | Carpooling Set Price ? Travel Preferences / Verify Now | Missing Preferences and Accountverification routes. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/carpooling/setPrice/index.tsx:135); [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/carpooling/setPrice/index.tsx:141) |
| R19 | Carpooling Details ? message / call icons | Both have no onPress. Report and View Details also appear as plain Text in this template, without interaction. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/carpooling/carpoolingDetails/index.tsx:177); [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/carpooling/carpoolingDetails/index.tsx:186) |
| R20 | Unused carpool ride-details component ? message / Book Now | No handlers. CarpolingRideDetails is not a registered screen. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/carpooling/carpolingRideDetails/index.tsx:115); [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/carpooling/carpolingRideDetails/index.tsx:166) |
| R21 | Unused carpool ride-list component ? filter / message / call | All lack handlers; this component is not a registered route. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/carpooling/rideList/index.tsx:22); [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/carpooling/rideList/index.tsx:60); [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/carpooling/rideList/index.tsx:69) |
| R22 | Old location popup ? Change / Confirm Location | Change has no handler; Confirm targets missing AddNewLocation. Its parent LocationScreen is not registered. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/locationScreen/locationDetails/index.tsx:34); [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/locationScreen/locationDetails/index.tsx:57) |
| R23 | Unused AddTopUp child ? Withdraw Balance | Button has no onPress. Current TopUpWallet renders its own working form and does not import this child. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/topUpWallet/component/addTopUp/index.tsx:53) |
| R24 | Old safety modal ? Call Police / Safety Support / location tile | Three touchables without handlers. ModalContect is mounted with modalVisible, but no code sets that state true in RideActive. The active Safety button uses a different SOS sheet. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/rideActive/component/modalContect/index.tsx:21); [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/rideActive/component/modalContect/index.tsx:26); [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/rideActive/component/modalContect/index.tsx:31) |
| D07 | Legacy CompleteDetails ? Download Invoice | Button has no onPress. Registered screen, but no incoming navigation call found; current history has separate invoice handling. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_driver/src/screen/myRide/completeDetails/index.tsx:17) |
| D08 | AddNewOffer ? Create Offer | Button has no onPress/API submit. Screen registered, but no incoming navigation call found. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_driver/src/screen/settings/addNewOffer/index.tsx:166) |
| D09 | Unused delivery-completion MapIcon ? shield / recenter | Two touchables without handlers. No rendered/imported MapIcon use found in current RideComplete. | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_driver/src/screen/home/rideComplete/component/mapIcon/index.tsx:11); [Source](/D:/DROPA2Z/dropa2z-src/Taxido_driver/src/screen/home/rideComplete/component/mapIcon/index.tsx:20) |

## Exact missing-route call sites

| App | Action | Missing route | File |
|---|---|---|---|
| Rider | reset | Login | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/api/apiClient.ts:121) |
| Rider | replace | SignInWithMail | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/commonComponent/headerTab/index.tsx:33) |
| Rider | replace | SignInWithMail | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/components/homeScreen/headerContainer/headerContainer/index.tsx:35) |
| Rider | navigate | Ride | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/components/homeScreen/topCategory/index.tsx:127) |
| Rider | navigate | Ride | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/components/homeScreen/topCategory/index.tsx:143) |
| Rider | navigate | ChooseRider | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/bottomTab/category/selectRide/container/detailContainer/index.tsx:243) |
| Rider | navigate | Preferences | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/carpooling/setPrice/index.tsx:135) |
| Rider | navigate | Accountverification | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/carpooling/setPrice/index.tsx:141) |
| Rider | replace | SignInWithMail | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/findDriver/locationScreen/index.tsx:536) |
| Rider | navigate | Ride | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/homeScreen/component/index.tsx:114) |
| Rider | replace | SignInWithMail | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/locationDrop/index.tsx:954) |
| Rider | navigate | AddNewLocation | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/locationScreen/locationDetails/index.tsx:57) |
| Rider | replace | SignInWithMail | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/rentalLocation/index.tsx:338) |
| Rider | navigate | StopTimer | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/rideActive/index.tsx:259) |
| Rider | navigate | StopTimer | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_user/src/screens/rideActive/index.tsx:299) |
| Driver | navigate | Ride | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_driver/src/screen/home/homeScreen/index.tsx:792) |
| Driver | navigate | Ride | [Source](/D:/DROPA2Z/dropa2z-src/Taxido_driver/src/screen/myRide/rideInfo/index.tsx:26) |

## Not classified as dead buttons

- Rider Wallet Top Up, current service cards, new service dropdown and location swap have handlers. Earlier Services ? Ride error was already fixed to Delivery before this audit.
- Driver direct Accept slider calls acceptRide and then AcceptFare. D01 is the separate bidding-card tap; D02 is the RideInfo Accept/Place Bid path.
- Radio-button wrappers in payment lists and the Myself selector have interaction on a parent or child; absence of a handler on the wrapper alone does not prove failure.
- Common modal surface wrappers intentionally consume/contain taps. The empty TouchableWithoutFeedback in the Rider review sheet contains working Close/rating actions; it is not a dead review-submit button.
- Driver rental vehicle-summary card and Rider destination labels are primarily display containers; missing navigation is not enough to call them broken.
- Profile Share opens the native share sheet; Privacy Policy opens a configured URL. These do not require app routes named Share or PrivacyPolicy.
- Missing reasons, OTP issues, rate limiting, payment failures and realtime delivery can affect otherwise wired buttons; those require separate API/runtime testing and are outside a missing-handler/route classification.

## Suggested fix order

1. D01/D02: correct the two Driver Ride destinations and verify their required booking parameters; test direct Accept and bidding separately.
2. R04: fix Rider expired-session reset to registered authentication screen.
3. R01/R02/R07: unify guest email-only authentication links with the real SignIn flow.
4. D03: implement Fleet refresh if Fleet is enabled.
5. Decide which conditional/dormant features should be removed, disabled with explanation or implemented. Do not build offers, carpooling, ambulance or withdrawal workflows solely because a template button exists.
6. For each approved fix, test the visible control and its intended server result on the phone; navigation existing by itself is not end-to-end verification.

## Evidence artifacts

Raw AST inventory: [button-route-audit.json](/D:/DROPA2Z/button-route-audit.json). Scanner: [button-route-audit.cjs](/D:/DROPA2Z/button-route-audit.cjs). Named-callback review additionally found empty PublishRide.gotoMap and FleetHome.handleRefresh, recorded above. No APK built or installed for this audit.
