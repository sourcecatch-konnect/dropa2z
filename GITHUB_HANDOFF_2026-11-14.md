# Dropa2z source handoff — 14 November 2026

This snapshot combines the current local application changes with the three authentication commits already on GitHub (`e921b74`, `68f956a`, `8675492`). The login merge retains normalized email addresses, Driver identity resolution, and the existing environment-controlled, expiring scoped test-login mechanism. Scoped test login is disabled unless its server environment controls are explicitly configured.

## Project folders

- `Taxido_user`: customer Android/iOS application (installed Android name: Dropa2z).
- `Taxido_driver`: Driver Android/iOS application.
- `Taxido_laravel`: Laravel API, Admin, website, migrations and backend tests.
- `scripts`: build, deployment preparation and device inspection helpers.
- `DROPA2Z_*.md`: development history, known issues and manual test checklists.

## Private configuration required

The working PC and live server retain their existing credentials and signing material. This GitHub snapshot does not contain `.env` files, Android signing keystores, credential exports, `google-services.json`, database dumps, APKs, installed dependencies or runtime caches.

1. Install each application's dependencies using its package manifest and lock file. Install backend Composer dependencies in `Taxido_laravel`.
2. Configure the backend's private `.env`, database connection, mail, realtime and Google services for the target environment. `configuration/backend-services.env.example` lists the environment variables used by payment configuration and the general settings seeder; it contains no service credentials.
3. Payment configuration and the general settings seeder read credentials from environment variables. Supply the authorized values privately before enabling a provider or running seeders. Do not run seeders against production just to apply this source snapshot.
4. Restore each app's authorized Firebase configuration locally. Retain the existing package identifiers, OAuth configuration and signing certificates when building updates. `release-signing.gradle` and `scripts/Load-ReleaseSigning.ps1` document/use the signing safeguards; the actual keys are kept outside Git.
5. Public Maps/Firebase client API identifiers remain in their existing client configuration to preserve behavior. Restrict them by the correct app/package, signing fingerprint, API and website restrictions in Google Cloud. `.gitleaks.toml` narrowly allows these public client identifiers and dependency-lock checksums.

## Validation and release status

- The original working source produced the Rider 3.0.17 and Driver 3.0.11 universal release APKs on 14 November; existing signers were verified.
- The upload checkout is separate from the active testing folder. Its merged PHP and JavaScript/TypeScript source is syntax checked, and its files are scanned for secrets with Gitleaks.
- This repository upload does not deploy the backend or change installed phone apps. It does not represent a fresh end-to-end or multi-user acceptance test. Refer to the project log and bug/test checklists for unresolved behavior.
- The live Driver negative-balance allowance was disabled and existing negative Driver wallet balances reset through audited database adjustments on 14 November. Those are live database settings/history, not source-controlled data. The minimum remains INR 10; the known cash-commission debit limitation is recorded in the project log.
