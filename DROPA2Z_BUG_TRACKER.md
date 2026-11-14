# Dropa2z — Bug tracker

Every defect found by **running** the platform, not by reading it.
Opened 21 October 2026, the day Dropa2z completed its first ride.

**Eighteen resolved, five open — 23 in all.** Of the ten, two were never code defects: one was a
switch turned off in the admin panel, and one was my own test calling the API wrongly. BUG-22 and BUG-23 were
deployed to production on 21 October and verified there.

The platform completes three consecutive rides with money moving correctly on each. That is
the backend proven, not the product finished.

---

## Open bugs

| ID | Bug | Severity | Blocked on |
|---|---|---|---|
| BUG-04 | Money stored as `double` across 35 columns in `rides` and `ride_requests` | High | **Your permission** — the `ALTER TABLE` was refused by the sandbox |
| BUG-05 | Maps REST key referrer-restricted, so the server trusts the client's distance | High | **You** — an additional IP-restricted key in Google Cloud Console |
| BUG-11 | Privacy policy URLs blank for both apps | Low | **You** — a policy must be written and hosted |
| BUG-12 | GST applied at 18%, unverified for passenger transport | Low | **Your CA** — not a technical question |
| BUG-19 | Notify Template pages 500 — `email_templates`, `sms_templates`, `push_notification_templates` all lack a `status` column the repositories read | High | Nothing — needs a reviewed migration |

---

## Fixed — first pass

### BUG-01 — `ride_status` table was empty

**Symptom.** `POST /api/ride/start-ride` returned HTTP 500 with
`Attempt to read property "name" on null`. The ride could be accepted but never started.

**Cause.** `RideRepository::startRide` builds its response from `$ride->ride_status->name`.
The `ride_status` table had zero rows, so `getRideStatusIdBySlug()` returned null,
`ride_status_id` was set to null, and the relation resolved to null.

I had seen that empty table during the earlier audit and dismissed it as harmless, assuming
statuses lived only in `RideStatusEnum`. They live in both: the enum supplies the slugs, the
table supplies the IDs the rides reference.

**Fix.** Ran the module's own `RideStatusSeeder` — idempotent, touches only that one table.
Eight rows now exist: requested, scheduled, accepted, rejected, arrived, started, cancelled,
completed.

**Verified.** `start-ride` now returns HTTP 200, and ride 100123 reached status `completed`.

### Not a bug — the queue connection

Worth recording because it looked like a dispatch bug for weeks.

`QUEUE_CONNECTION` was `sync`, which makes Laravel ignore `->delay()` and run queued jobs
inline. The 30-second driver acceptance window therefore expired in the same second it
opened, and `CheckDriverTimeoutJob` cancelled every request instantly.

Changed to `redis` with a worker running. The window now holds exactly 30 seconds —
confirmed: requested 10:34:50, cancelled 10:35:20.

> **Caveat.** That worker was started by hand with `nohup`. It will not survive a reboot, and
> while `QUEUE_CONNECTION` is `redis`, jobs stop entirely if it dies rather than falling back
> to inline execution. The systemd unit on your sir's list is now load-bearing.

---

## Resolved — 21 October

### BUG-02 — not a bug, my test was wrong

I reported that a driver could only ever complete one ride, because `is_on_ride` stayed at
`1` after completion. That was real, but the cause was my test harness, not the platform.

Completing a ride takes **two calls**, not one:

```
POST /api/ride/payment              settles the money
PUT  /api/ride/{id}  status=completed   closes the ride
```

Only the second resets `is_on_ride` to `0`, at `RideRepository.php:237`. My test only made
the first call, so the driver was left mid-ride and correctly excluded from dispatch.

**Verified by running three consecutive rides.** Rides 100128, 100130 and 100132 all
completed, with `is_on_ride` returning to `0` after each.

> **The lesson is for the app, not the backend: the driver app must call both endpoints.**
> If it only takes payment, every driver strands themselves after one trip. Worth checking in
> `Taxido_driver` before the first real test.

### BUG-03 — fixed, a switch was off

No money moved on a completed cash ride: wallet unchanged, zero wallet histories, zero
commission histories.

The cause was one line at the top of `CommissionTrait::calAdminDriverCommission`:

```php
$settings = getTaxidoSettings();
if ($settings['driver_commission']['status']) {
```

`driver_commission.status` was `'0'` in the admin panel, so the entire commission and
settlement block was skipped. The code was correct throughout; the feature was switched off.

**Fix.** Set it to `'1'`. The previous `taxido_settings` value is backed up on the server.

**Verified.** The driver wallet now moves on every completed cash ride, deducting ₹35.17:

| Entry | Amount |
|---|---|
| Platform fee | ₹11.00 |
| Tax | ₹21.67 |
| Admin commission | ₹2.50 |

Across three rides the wallet ran ₹500.00 → ₹464.83 → ₹429.66 → ₹394.49, exactly as expected.

**What this means operationally.** On a cash ride the driver physically collects ₹144.57 and
the platform debits ₹35.17 from their wallet. The driver nets ₹109.40, which is the
sub-total. The accounting is consistent — but a driver with an empty wallet cannot work, and
₹35 leaves their balance per trip. **Wallet top-ups are not optional, they are the business
model.**

---

## Fixed — second pass, 21 October

Six more closed, each verified by re-running the full lifecycle rather than by inspection.

| ID | Fix | Verified by |
|---|---|---|
| BUG-06 | `end_time` written on completion, in the driver completion branch | ride 100134 ended `10:58:53` |
| BUG-07 | `started` and `completed` rows written to `ride_status_activities` | full trail: requested, accepted, started, completed |
| BUG-08 | Completion rejected unless the ride is `started` or `arrived` | `PUT status=completed` before start returned **HTTP 400** |
| BUG-09 | Ran `NotificationTemplateSeeder` | 26 push templates, 4 SMS templates; the failing slug resolves |
| BUG-13 | Removed the duplicated `paymentStatus()` call in the cash branch | one call remains at `RideRepository.php:799` |

### What changed in the vendor's code

Three edits to `Modules/Taxido/app/Repositories/Api/RideRepository.php`, each marked with a
`// BUG-nn` comment so they stay findable. The original file is backed up on the server beside
`CommissionTrait.php` and JSON dumps of six tables.

**This is the first divergence from the vendor's source.** From here a Taxido update will not
merge cleanly without review, which makes the fork decision in Phase 6 of the checklist real
rather than theoretical.

### The final state of a ride

```
ride 100134  status=completed
requested  10:58:48
accepted
started    10:58:52
completed  10:58:53
rider pays 144.57 | wallet debited 35.17 | driver nets 109.40
```

---

## Admin panel sweep — 21 October

Every read-only admin page loaded as a logged-in administrator through Laravel's own HTTP
kernel, not merely checked for a redirect.

| Result | Count |
|---|---|
| Pages tested | 200 |
| **Working** | **175** |
| Failing, reachable from the sidebar | **0** |
| Failing, real but unlinked | 2 |
| Failing, phantom `/create` routes | 22 |
| Failing, test artifact | 1 |

The first run reported 176 failures including the dashboard. **That was wrong** — my harness
did not define `LARAVEL_START`, a constant `public/index.php` sets on every real request and
the admin footer template reads. Defining it dropped failures from 176 to 25. Worth recording,
because the same mistake would make anyone think the panel was broken when it is not.

`/admin/about-system` is the same kind of artifact: it reads `$_SERVER['SERVER_NAME']`, which
exists on a real browser request but not in CLI. **It works in your browser.**

The 22 `/create` failures are routes Laravel's resource helper registers automatically for
modules that have no create screen — `setting/create`, `taxido-setting/create`,
`driver-wallet/create` and similar. Nothing links to them.

> **Conclusion: nothing an operator can click in the sidebar is broken.**

---

---

## Fixed — third pass, 21 October

Two security defects from `DROPA2Z_ADMIN_AUDIT_2026-10-21.md`. Both were found by reading the
deployed route inventory, not by running the platform — the first entries here with that
provenance.

> **Renumbering.** The audit originally called these BUG-06 and BUG-07, which were already
> taken above by the `end_time` and `ride_status_activities` fixes. The audit's seven findings
> were renumbered into this document's namespace; its own header records the mapping. Its
> BUG-05 turned out to be **BUG-11**, already open here, so it did not get a new ID.

### BUG-23 — withdrawal status changeable through a GET request

**Severity P0, financial.** `GET admin/withdraw-request/status/{id}` and
`GET admin/fleet-withdraw-request/status/{id}` passed the request's `status` straight to the
repository, which updated the withdrawal record. Their middleware carried `web`, localization
and authentication — but **no action-specific permission check**. Any authenticated session
could move a driver or fleet withdrawal to any state by following a link.

**Fix.** Both routes and both handlers removed outright. Nothing in the codebase called them:
the withdrawal approval screens already post to the protected resource-update route, which
carries its own authorization. Verified by grep across routes, controllers and views — no
dangling references.

### BUG-22 — 135 destructive admin actions used GET

**Severity P1.** Delete, permanent-delete and restore were plain links. A prefetch, a crawler
or a cross-site request could fire them from a logged-in administrator's session, and Laravel's
CSRF protection does not cover GET.

**Fix.** 138 declarations converted across three route files, names and `can:` middleware
preserved on every one:

| Action | Verb | Count |
|---|---|---|
| `.destroy` | `DELETE` | 46 |
| `.forceDelete` | `DELETE` | 48 |
| `.restore` | `PATCH` | 44 |

`plugin.delete` was missed by the first sweep and converted afterwards — nothing in any view
links it. `backup/restore-backup` is deliberately **still GET**: it has its own separate
workflow and was left alone.

### The UI half, which is where it nearly went wrong

Converting the routes alone breaks every button that pointed at them, so the row actions in
`components/table/table-body.blade.php` became a `.secure-action-btn` that submits a shared
CSRF-protected form. Three defects in that first implementation, all caught before deployment:

**The shared modal reached no page that needed it.** `<x-modal.confirm />` was rendered on one
view — `admin/category/list.blade.php`, which does not use the table component — while **70
views use the table**. Every delete and restore button would have done nothing. It is now
included once in `admin/layouts/master.blade.php`.

**Its id collided with seven unrelated modals.** Chat, backup, cleanup-db, the three wallet
amount pages, withdraw-request drivers, and Ticket's own category list each already had an
`id="confirmation"`. Because the layout renders after `@yield('content')`, theirs would have
won in DOM order. The shared one was renamed `#secureActionConfirmation`, which avoided
touching any of those files.

**The modal shipped a live destructive default, and it was firing.** The form carried
`action="{{ route('admin.category.destroy', 1) }}"` with `_method=DELETE`. The category page's
own handler targeted `#deleteForm`, an id the same change had renamed to `#secureActionForm`,
so it silently stopped setting the action — **clicking delete on any category deleted category
1, every time.** The action is now empty, a submit guard blocks an unset action, and the
category page uses the shared mechanism.

The click handler also had to move out of the table component's `@push('scripts')` and onto the
modal component, or the category page would have had a modal and no handler.

**Eight files changed**, all view, test and route layer:

```
resources/views/components/modal/confirm.blade.php
resources/views/components/table/table-body.blade.php
resources/views/components/table/index.blade.php
resources/views/admin/layouts/master.blade.php
resources/views/admin/category/list.blade.php
resources/views/admin/category/childs.blade.php
tests/Unit/AdminRouteSecurityTest.php
routes/admin.php
```

Originals are in `DROPA2Z_fixbackup-20261021-150152/` beside this file. **This project is not
under version control, so that directory is the only way back.**

### What is not verified

`AdminRouteSecurityTest.php` was written with a regex missing its closing delimiter —
`"/Route::get\((?='[^']+\/(?:destroy|force-delete|restore)\/)"` — so `preg_match_all`
returned `false` and the assertion could never pass. Delimiter added, **but the test has still
never been executed: there is no PHP on the Windows machine.**

Nor have the blade changes been rendered. The route conversion is verified by inspection; the
UI is not. Before trusting this, click delete, permanent-delete and restore on a table page and
on the category page.

## Deployed — 21 October, 15:27

BUG-22 and BUG-23 are live. Backup of all ten original files:
`/home/dropa2z/deploy-backup-20261021-152749/` on the server — the only rollback path.

**Deployed by transforming the server's own files, not by copying the local ones.** The local
copy turned out to be stale: the server had **7 routes that do not exist locally** (2 in
`routes/admin.php`, modified server-side 11 September; 5 in the Taxido module, 22 September).
Copying would have deleted all seven. A before/after path-set diff proved the only paths that
changed were the two withdrawal endpoints being removed.

| Check | Result |
|---|---|
| Declarations converted | 46 destroy + 48 force-delete → `DELETE`, 44 restore → `PATCH` |
| Routes Laravel registers | 45 + 47 + 43 = **135** |
| Destructive routes still on GET | **0** |
| Withdrawal status endpoints | gone, and both `status()` handlers removed |
| Route totals | 138 / 265 / 58 — the 7 server-only routes survived |
| `php -l` on all 5 PHP files | clean |
| `php artisan view:cache` | all Blade templates compiled — first time these changes compiled anywhere |
| dropa2z.com | HTTP 200 |
| /admin/login | HTTP 200 |

`backup/restore-backup` is deliberately still GET.

The 135 figure reconciles the two numbers that had been confusing this: 138 declarations in the
route files, 3 of them shadowed, 135 registered — which is exactly the count the original audit
reported.

### Still not verified by a human

The delete, permanent-delete and restore buttons have not been **clicked**. Blade compiling
proves the templates are valid, not that the buttons work. This needs one manual test on a
record that does not matter.

### A note for future deployments

**The local project folder is not a deployable copy of the server.** It is missing those 7
routes, and the server has at least two files edited directly in production
(`RideRepository.php` earlier, these route files in September). There is no version control on
either side. Any future deployment has to diff first, as this one did.

---

## Fixed — fourth pass, 21 October

Four closed, one closed as not reproducible, one handed back as a decision. **All edits are on
the server only** — the local project copy was already stale and is now further behind.

### BUG-20 — raw translation keys on the Rides table

`rides.created_at` and `rides.action` did not exist in `Modules/Taxido/lang/en/static.php`, so
`__()` returned the key itself as the column heading. Added to **all four locales** the module
ships (en, de, es, fr) rather than relying on the English fallback.

**Verified:** `__('taxido::static.rides.created_at')` resolves per locale — Created At /
Erstellt am / Creado el / Créé le.

### BUG-16 — /admin/rating returned 500

Worse than “a missing class”. The vendor shipped **no `RatingTable` class, no rating views, and
no `RatingRepository::index()`** — three of the four pieces the screen needs. The route was
registered for a screen that was never built, nothing links to it, and it is not in the sidebar.

`index` is now excluded from the resource. **`rating.store` and `rating/ticket-status` were
kept** — contrary to my first assumption they are *not* dead: the ticket reply screen posts to
both. Removing the whole resource, the obvious fix, would have broken ticket ratings.

### BUG-17 — /admin/vehicle-surge-prices returned 500

`VehicleSurgePriceController::index($vehicleTypeId)` requires an argument; the plural resource
route called it with none (`ArgumentCountError`). `index` excluded; the working singular route
`vehicle-surge-price/{vehicleTypeId}` is untouched. Nothing referenced the broken one.

### BUG-21 — partly fixed, and partly not its own bug

Two halves, and only one was hardcoding.

**Fixed:** the dashboard services chart labelled its series with raw slugs — `'cab'`, `'parcel'`,
`'freight'`, `'ambulance'`. The passenger service's data *was* in the chart, shown as “cab”.
Labels now come from the services table, so it reads “Dropa2z Rides”. Slugs remain the data keys.

**Not a bug:** the Recent Rides tabs are already data-driven — `recent-rides.blade.php` loops
`$serviceCategories`. Parcel and Freight are the only tabs **because the Ride category belongs to
the disabled service**. That half is a symptom of BUG-24 and will resolve when BUG-24 does.

Also noticed, not fixed: the chart defines 4 series but only 3 colours, and `finddriver` has no
series at all.

### BUG-15 — closed, not reproducible

I could not reproduce it and found no defect to fix:

- all **10** `ride_status_activities()->create()` call sites set `'changed_at' => now()`
- `changed_at` **is** in the model's `$fillable`, so nothing is silently dropped
- all 34 rows now in the table have `changed_at` set — zero nulls

The rows I originally observed no longer exist (see below). Rather than invent a fix for
something I cannot demonstrate, this is closed. **If it reappears after a real ride, reopen it
with the row.**

### BUG-14 — not a money defect; a wording decision

`rides.driver_commission` holds the driver's **earning net of admin commission**
(₹109.40 − ₹2.50 = ₹106.90). The ₹109.40 I compared it against is `sub_total`. Both figures are
correct; they are different quantities.

The real problem is the label. `rides.driver_commission` and `invoice.driver_commission` both
read **“Driver Commission”**, which sounds like a charge *to* the driver when it is what the
driver *earns*.

I did not change it. It appears on the rider and driver **invoice**, and invoice wording is the
owner's call — not something to reword unilaterally on a financial document. Changing the API
field name is separately a bad idea: `RideResource`, `RideDetailResource`,
`RideRequestResource` and `DriverSelfResource` all expose it, and the apps are about to be built
against them.

---

---

## BUG-14 — fixed, 21 October

The owner approved relabelling. `rides.driver_commission` and `invoice.driver_commission` now
read **Driver Earning** instead of **Driver Commission**, which is what the figure actually is:
the driver's earning net of admin commission. **No data, schema or API field name changed** —
`RideResource`, `RideDetailResource`, `RideRequestResource` and `DriverSelfResource` still expose
`driver_commission`, so nothing the apps will be built against moved.

| Locale | rides / invoice | settings (left alone) |
|---|---|---|
| en | Driver Earning | Commission |
| de | Fahrerverdienst | Fahrerprovision |
| es | Ganancia del Conductor | Comisión |
| fr | Gain du chauffeur | Commission |

**A find-and-replace would have broken this.** In German and French the `settings` entry held the
*same string* as `rides` (`Fahrerprovision`, `Commission du chauffeur`), so replacing by value
would have renamed the commission **setting** as well — a different concept. Each of the five
edits was anchored on its neighbouring keys instead. Verified per locale afterwards: settings
unchanged everywhere, all four files pass `php -l`.

German's invoice label falls back to English; the German file has no `invoice.driver_commission`
key. Pre-existing, not introduced here.

### The process-limit scare, for the record

Mid-task the account hit its CloudLinux `nproc` cap and `bash: fork: Resource temporarily
unavailable` appeared. **I misdiagnosed this as the Desktop Commander agent being down.** It was
not: starting a second agent made npm/npx spawn a burst of processes and briefly exhausted the
cap. File reads kept working because the agent reads directly; only `start_process` needs to
fork a shell. The website stayed HTTP 200 throughout. It cleared on its own at 12 processes.

Lasting note: **two agents were left running on the same device id** — the original (up 2 days)
and a newly started one. That is the duplicate condition behind the `Exit 134 Aborted` seen at
the start of the day. Keep one.

---

## BUG-24 — fixed, 21 October 15:59

**The owner enabled the service in the admin panel.** I could not: this session's permission
guard refuses database writes ("Modify Shared Resources"), the same guard that refused the
BUG-04 `ALTER TABLE`.

Verified immediately after:

| Check | Before | After |
|---|---|---|
| `services.status` (id 6) | `0` | `1` |
| `HomeScreenRepository` resolves | **NULL** | **6** |
| Categories the rider app sees | none | `cat 19 ride` |
| Vehicle types under it | none | `vt 15 Bike` |

Also checked for collateral damage, since this was done by saving a form: `type` is still `cab`,
`is_primary` still `1`, and parcel / freight / ambulance / finddriver all retain their original
September `updated_at`. Nothing else moved.

**This also closed the second half of BUG-21.** Recent Rides was only ever showing Parcel and
Freight because it filters on visible service categories and the Ride category belonged to the
disabled service. It now qualifies. Not confirmed in the rendered UI.

### What it means

A rider opening the app now finds a working passenger flow offering **Bike, and only Bike**.
That is BUG-18, which this unblocks. The remaining input is the fare schedule — base fare, base
distance, per-km, waiting and cancellation for a passenger Auto in Jalgaon. The only Auto pricing
on the system is Parcel Auto's ₹26.00 base / ₹17.14 per km, which is **delivery** pricing and
must not be reused for passengers.

### How it got switched off

Still not established with certainty, but the evidence points one way: service 6 was created
23 September alongside parcel and freight (both still enabled), ambulance and finddriver were
deliberately disabled on 23 September at 08:04, and service 6 alone was modified on
21 October at 13:34 — the same afternoon its category, vehicle and Jalgaon fares were being
configured. Most likely an accidental save of the service edit form, whose status toggle sits on
the same screen. Worth knowing because it can happen again.

---

## BUG-18 — fixed, 21 October

A passenger Auto Rickshaw now exists under "Dropa2z Rides" beside the Bike, priced for Jalgaon.
Applied with a purpose-written seeder, `database/seeders/Dropa2zPassengerAutoSeeder.php`, not by
hand — every insert is guarded, so it is safe to re-run and reports "already present" instead of
duplicating. **The module's own broad seeder was not used**, per the standing constraint.

| | Seats | Base | Per km | Tax | Commission |
|---|---|---|---|---|---|
| Bike (vt 15) | 1 | ₹12.00 | ₹7.00 | tax_id 2 | fixed ₹2.50 |
| **Auto Rickshaw (vt 16)** | 3 | ₹26.00 | ₹17.14 | tax_id 2 | fixed ₹2.50 |

Created: `vehicle_types` id 16, plus rows in `vehicle_services`, `vehicle_categories`
(category 19) and `vehicle_type_zones` (zone 69). A 5.6 km trip prices at ₹96.27 before tax and
fees, against ₹40.70 for Bike.

### Where the fares came from — and a correction

I first told the owner that Parcel Auto's ₹26 / ₹17.14 was "delivery pricing, not passenger
economics", and proposed scaling the Bike row up for a three-seater. **That was wrong.** Those
are the figures on the Maharashtra Motor Vehicle Department's auto-rickshaw tariff card effective
01/02/2025 — ₹26 minimum for the first 1.5 km, ₹17.14 per km after. Someone had already entered
the RTO card.

It matters because auto fares in Maharashtra are regulated while bike-taxi rates are a separate,
cheaper category. Scaling ₹12/₹7 up by a seat multiplier would have produced a number with no
legal basis. The tariff card is the anchor.

### Open questions this leaves

1. **No vehicle image or map icon** — both left `null`. They are foreign keys into the media
   table and cannot be invented. Must be uploaded in Admin → Vehicle Type → Auto Rickshaw, or the
   rider app shows a placeholder and the map marker may not render.
2. **Jalgaon RTO fare unconfirmed.** Mumbai moved to ₹27 / ₹18.22 per km on 01/09/2026 with a 25%
   night surcharge. Whether Jalgaon adopted that revision was not established; the Feb 2025 state
   card was used as the safe default.
3. **Tax matches Bike (`tax_id 2`, 18%) and inherits BUG-12.** The owner chose consistency, but
   the two pre-existing rows disagreed — Bike charges tax, Parcel Auto does not — so one of them
   was already wrong. If 18% GST does not apply to passenger transport, both Bike and Auto now
   overcharge every rider. **BUG-12 is still open and still needs a CA.**
4. **Never ridden.** No ride has been booked on this vehicle type. The fare row exists; that the
   dispatch engine prices and matches on it is unproven.

## The test data is gone

Discovered while investigating BUG-14 and BUG-15:

| Table | Then | Now |
|---|---|---|
| `rides` | 7 completed test rides | **0 rows**, none soft-deleted |
| `ride_requests` | 88 | 15 |
| `ride_status_activities` | full trails | only `requested` (16) and `cancelled` (18) |

Rides 100128–100134 were **hard-deleted**, not trashed. I did not do this and do not know who
did — the admin panel has a database-cleanup tool.

**The code fixes from passes one to three are still in place.** What is gone is the evidence
that proved them. BUG-06, BUG-07, BUG-08 and BUG-13 were each verified against rides that no
longer exist, so nothing in this file can now be re-checked against data. The next real ride
re-establishes the baseline.

This is also why BUG-14 and BUG-15 had to be judged from code rather than from rows.

## Test evidence

Every step is a real HTTP call to `dropa2z.com` with Sanctum bearer tokens, not a direct
database write.

| Step | Call | Result |
|---|---|---|
| 1 | `POST /api/rideRequest` as rider 144 | 200, request 88, ₹144.57 |
| 2 | `AssignNextDriverJob` on the queue worker | driver 147 assigned, 30s window |
| 3 | `POST /api/accept-ride-request` as driver 147 | 201, ride 35 created |
| 4 | `POST /api/ride/start-ride` with OTP | 200, `start_time` set |
| 5 | `PUT /api/ride/{id}` status=completed | 200, `is_on_ride` cleared |
| 6 | `POST /api/ride/payment` | 200, `payment_status COMPLETED` |

### What this proves

The dispatch engine works. Pricing, zone resolution, Redis geospatial matching, eligibility
filtering, sequential assignment, the acceptance window, OTP verification, ride creation,
invoice generation and wallet settlement all executed correctly on real data, through the
public API.

That was the single largest unknown in this project, and it is now answered.

### What it does not prove

**The apps have never run against this backend. Not once.** Every bug here came from running
the backend; the app side has had no equivalent exercise. Expect 2–5 days of fixing after the
first successful login.

---

## How this list is maintained

A row is added whenever a test surfaces a defect, and moved to Fixed only when a re-run proves
it. New bugs will appear — the ones above came from a single five-step run; the next run
against a real app will find more, and that is the point of running it.


## 3 November 2026 ? New Rider/Driver bug batch

Implementation/deployment status and the complete pending user test list are maintained in [DROPA2Z_FIX_CHECKLIST_2026-11-03.md](DROPA2Z_FIX_CHECKLIST_2026-11-03.md). Backend and realtime infrastructure changes are deployed; app changes need updated builds. These reported bugs are not marked verified/resolved until the user tests the updated apps. Phone access was visual-only.
