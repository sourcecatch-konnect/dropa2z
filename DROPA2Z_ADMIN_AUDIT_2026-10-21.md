# Dropa2z Admin Audit — 21 October 2026

## Bug numbering

This document originally numbered its findings BUG-01 to BUG-07, which collided with seven
unrelated defects of the same IDs in `DROPA2Z_BUG_TRACKER.md`. They were renumbered on
21 October into the tracker's single namespace:

| Was | Now | Defect |
|---|---|---|
| BUG-01 | BUG-18 | Passenger Auto service not configured |
| BUG-02 | BUG-19 | Notification-template `status` column missing |
| BUG-03 | BUG-20 | Raw translation keys on the Rides table |
| BUG-04 | BUG-21 | Dropa2z Rides omitted from dashboard service views |
| BUG-05 | **BUG-11** | Privacy-policy URLs blank — not a new ID; the tracker already had this one |
| BUG-06 | BUG-22 | 135 destructive admin actions use GET |
| BUG-07 | BUG-23 | Withdrawal status changeable through GET |

**BUG-22 and BUG-23 are now fixed in local source.** See the tracker for what was changed and
what remains unverified.

## Scope and safety boundary

This is a live, read-only audit of the signed-in production admin panel and its deployed backend. Maps and Firebase were intentionally excluded because Firebase access is not currently available.

The audit did **not** submit forms, create or delete records, change a service status, alter wallets or payments, run database cleanup, create/restore backups, send notifications, or modify settings. Those are production-changing actions and need a separately agreed isolated test-data plan.

## What was tested

| Area | Result | Evidence |
|---|---|---|
| Admin route inventory | Reviewed | 770 admin routes: 477 GET/HEAD routes and 362 state-changing POST/PUT/PATCH/DELETE routes. |
| Dashboard | Pass with integration gap | Dashboard rendered. Counts match current live data: 2 riders, 0 verified drivers and 0 rides. |
| Service list and Dropa2z Rides editing screen | Pass | Service page and edit form opened. |
| Cab service categories and vehicle types | Fail — see BUG-18 | Only Bike is set up for the passenger Ride category. |
| Freight, Parcel and Find Driver categories; Freight, Parcel and Find Driver vehicle types | Pass | Each list page opened without a visible server or database error. |
| Rider and verified-driver lists | Pass | Both pages render. Driver list correctly shows no verified drivers. |
| Users, dispatchers, fleet managers, fleet vehicles and referrals | Pass | Each list page opened without a visible server or database error. |
| Ride requests, rides and ride reports | Pass with UI/data gaps | Lists and reports render without a server error. |
| Transaction reports | Pass | Filter screen and empty state render. |
| Support tickets | Pass | Ticket list renders its empty state. |
| Banners and onboarding | Pass | Both lists render with a valid empty state. |
| Blogs, Pages, Coupons, Extra Charges and Surge Prices | Pass | Each list page opened without a visible server or database error. |
| Testimonials, Settings, Menus, Activity Logs and Support Ticket dashboard | Pass | Each screen opened without a visible server or database error. |
| Website Content, Media, Chats, Airports and Preferences | Pass | Each screen opened without a visible server or database error. |
| Rental Vehicles, Ambulances, Hourly Packages, Documents and Cancellation Reasons | Pass | Each list page opened without a visible server or database error. |
| Roles, Languages, Taxes, Currencies, Plugins and About System | Pass | Each list page opened without a visible server or database error. |
| Robots, Landing Page, Subscribers, Customizations and Knowledge Base | Pass | Each screen opened without a visible server or database error. |
| Support executives, statuses, priorities, departments, form fields, settings, knowledge categories and tags | Pass | Each screen opened without a visible server or database error. |
| App Settings and App Configuration | Pass with feature/compliance gaps | Tabs and fields render; privacy fields are empty. |
| Backup inventory | Pass | Read-only backup page opens. No backup action was submitted. |
| Email notification templates | Fail — see BUG-19 | The page returns to Support Tickets with “Something went wrong with the database.” |
| Notification template backend | Fail — see BUG-19 | Email, SMS and push repositories request a missing `status` column. |
| Automated regression tests | Insufficient | Only the framework's two example test files exist. |

## Confirmed defects

### BUG-18 — Passenger Auto service is not configured

- **Severity:** P0 — blocks the requested Phase 1 service offering.
- **What happens:** The Cab vehicle-types page contains one active vehicle: **Bike**, attached to the `Dropa2z Rides` service and the `Ride` category. There is no Auto Rickshaw vehicle under that passenger category.
- **Current conflicting setup:** Existing Auto vehicle records are attached to Parcel/Freight instead of the passenger Ride category.
- **Impact:** A rider cannot choose Auto for a Dropa2z passenger ride. Only Bike can be surfaced from the current passenger setup.
- **Fix direction:** Create or correctly reassign an Auto Rickshaw vehicle type to `Dropa2z Rides` + `Ride`, attach it to the required zones and fare/surge rules, and confirm its active status. This needs a controlled production change.

### BUG-19 — Notification-template pages have a database schema mismatch

- **Severity:** P1 — notification configuration is broken.
- **Reproduction:** Open **Promotion Management → Notify Templates → Email**.
- **Observed result:** The admin panel shows “Something went wrong with the database” and remains/returns on the prior page.
- **Server evidence:** The live log reports `SQLSTATE[42S22]: Unknown column 'status'` for `email_templates`.
- **Root cause:**
  - `app/Repositories/Admin/EmailTemplateRepository.php` calls `EmailTemplate::pluck('status', 'slug')` and writes `status`.
  - The live `email_templates` table has no `status` column.
  - `SmsTemplateRepository` and `PushNotificationTemplateRepository` use the same missing column, while their live tables also lack it.
- **Impact:** Email templates fail now; SMS and push template pages/updates are at the same risk and must be fixed together.
- **Fix direction:** Add a safe, reviewed migration for the `status` column to all three template tables (with an explicit default and rollback), then verify Email, SMS and Push list/edit/update flows using isolated test templates.

### BUG-20 — Raw translation keys are shown on the Rides table

- **Severity:** P1 — visible admin UI defect.
- **Reproduction:** Open **Rides → All Rides**.
- **Observed result:** Two headers display raw vendor-prefixed translation keys instead of words for “Created At” and “Action.”
- **Impact:** The admin UI looks unfinished and exposes implementation details.
- **Fix direction:** Add/fix the corresponding translations in the active ride-module language file and verify English plus every enabled locale.

### BUG-21 — Custom Dropa2z Rides service is omitted from dashboard service views

- **Severity:** P1 — incomplete reporting for the new service.
- **Observed result:** The dashboard Service Categories selector offers Cab, Freight, Parcel and Ambulance, but not Dropa2z Rides. The Recent Rides area exposes Parcel and Freight tabs only.
- **Impact:** After Dropa2z rides begin, dashboard reporting will not provide a direct service view for the new passenger offering.
- **Fix direction:** Update dashboard service/category queries and UI tabs so enabled services are data-driven rather than restricted to the original fixed set.

### BUG-11 — Rider and driver privacy-policy URLs are blank

- **Severity:** P1 — store/compliance launch blocker.
- **Reproduction:** Open **App Settings → App Configuration**.
- **Observed result:** `Rider Privacy Policy` and `Driver Privacy Policy` are empty.
- **Impact:** The mobile apps have no configured privacy-policy destination, which is normally required before public mobile-store release.
- **Fix direction:** Publish approved Dropa2z privacy-policy pages, enter their HTTPS URLs, and test both app links once Firebase/mobile testing is available.

### BUG-22 — 135 admin delete, permanent-delete, and restore actions use GET requests

- **Severity:** P1 — security and data-integrity risk.
- **Evidence:** The deployed production route inventory contains **135** `GET|HEAD` routes whose paths perform `destroy`, `force-delete`, or `restore` actions. Examples include admin records for riders, drivers, vehicle types, banners, FAQs, zones, service-pricing records, support tickets, and notifications.
- **Why this is unsafe:** A GET request is intended to be safe to repeat and should not change data. Because Laravel's normal CSRF protection applies to state-changing form methods rather than GET requests, a logged-in administrator could trigger one of these actions through an unsafe link, browser prefetch, crawler, or a cross-site request.
- **Impact:** An authorised administrator's session could be used to accidentally delete, permanently delete, or restore records. Permission middleware narrows who can reach the action, but does not make a state-changing GET request safe.
- **Safe reproduction boundary:** This was confirmed from the deployed route list only. No destructive route was opened and no production record was changed.
- **Fix direction:** Replace each destructive/restore GET route with a `DELETE`, `POST`, or `PATCH` endpoint protected by CSRF middleware. Render these actions as forms or confirmation controls rather than direct links, retain existing permission checks, and add regression tests that a GET request returns `405 Method Not Allowed` while an authenticated CSRF-protected request succeeds.

### BUG-23 — Withdrawal status can be changed through GET endpoints

- **Severity:** P0 — financial-security risk.
- **Evidence:** The deployed route list exposes `GET|HEAD admin/withdraw-request/status/{id}` and `GET|HEAD admin/fleet-withdraw-request/status/{id}`. Their deployed middleware lists contain only `web`, localization, and authentication—no action-specific permission check. Their status handlers pass the request's `status` value to the repository, where it updates the matching withdrawal record and redirects with “Withdraw Request Status Updated Successfully.”
- **Impact:** A GET request with a status query parameter can alter a driver or fleet withdrawal state without the CSRF protection expected for a financial approval action. The missing action-specific permission middleware increases the risk of accidental or cross-site state changes from an authenticated session.
- **Safe reproduction boundary:** Verified using the deployed route list and source-to-handler trace only. No withdrawal page, status-control, or financial record was opened or changed.
- **Fix direction:** Change both endpoints to a CSRF-protected `PATCH` or `POST` route, validate the allowed status transition server-side, require the appropriate finance permission, record an immutable actor/time/status audit trail, and add tests rejecting GET requests and invalid transitions.

## Feature gaps requested for Dropa2z (not defects in the current product)

These were requested requirements but are not present in the current App Configuration UI:

1. Per-service toggles that control which services appear in the rider and driver apps.
2. Prebuilt festival/campaign templates (for example Diwali or Holi) with one safe enable/disable switch for app and web content.

These need a new data model, an admin permission-protected UI, app configuration API responses, cache invalidation, and mobile-app handling. They should not be added through the existing raw HTML/CSS/JS customization field.

## Operational blockers before true end-to-end ride testing

1. There are zero verified drivers in the live environment.
2. There are zero completed/current rides. The existing 15 ride requests are Parcel requests, not Dropa2z passenger rides.
3. Auto Rickshaw is not connected to the passenger Ride category.
4. Firebase and Maps tests are explicitly out of scope until the original Firebase project is accessible.

## Remaining test matrix — requires explicit production approval

The 362 state-changing routes cannot be safely exercised by opening every button on production. The remaining flows include:

- Create/edit/deactivate/delete operations for riders, drivers, services, vehicles, fares, zones, coupons, banners, blog/pages/FAQ, ticket data and templates.
- Financial actions: wallet credit/debit, commission, withdrawals, payment settings, subscriptions and refunds.
- Operations actions: dispatching, ride status changes, notifications, exports with data, cache clearing, backup creation/restore and database cleanup.
- Security/configuration actions: roles/permissions, authentication settings, API/SMS/payment credentials and system settings.

Payment-method and SMS-gateway configuration are intentionally excluded from the live test actions because they fall within the financial/credential boundary.

Before running these, use isolated records named `QA-DROPA2Z-YYYYMMDD-*`, keep an audit log, and delete only those exact records after verification. Financial, backup/restore, credential and role-permission actions should be individually approved at action time.

## Isolated QA record test — 21 October 2026

The approved non-financial test started with one isolated FAQ record only. No customer record, payment, wallet, setting, service, permission, backup or credential was changed.

| Step | Result | Evidence |
|---|---|---|
| Create FAQ | Pass | The admin confirmed creation and returned the FAQ list with record ID 9. |
| Read back in list | Pass | The newly created record appeared as the only FAQ in the list. |
| Open edit form | Pass | The form loaded the correct saved title and description. |
| Update FAQ | Pass | The admin confirmed update; the list showed the amended `— Updated` title. |
| Delete FAQ | Pass | The admin confirmed deletion; the active FAQ count returned to 0 and Trash showed 1 isolated record. |

**QA cleanup status:** FAQ ID `9` was moved to Trash. It has not been permanently deleted or restored.

## Recommended repair order

1. Fix BUG-23 so withdrawal statuses cannot be changed through a GET request.
2. Fix BUG-22 so destructive admin actions cannot be invoked through GET requests.
3. Fix BUG-18 so both Bike and Auto can be offered for passenger rides.
4. Fix BUG-19 with a reviewed database migration and test notification templates.
5. Fix BUG-20 and BUG-21 so the admin correctly represents Dropa2z Rides.
6. Publish and configure the two privacy-policy URLs (BUG-11).
7. Add service toggles and campaign-template architecture.
8. Build an isolated test environment and real automated tests before a public launch.

## Notes for future test work

- The 0-values shown on the dashboard are not currently treated as a dashboard defect; live database counts also show zero rides and zero verified drivers.
- Empty Banners and Onboarding lists rendered correctly; they are content gaps, not application failures.
- No conclusion is made here about Maps, Firebase, payment-gateway behaviour, mobile notifications or real rider/driver matching because those require unavailable access or controlled test data.
