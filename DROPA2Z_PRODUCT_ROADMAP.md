# Dropa2z Product Roadmap

## Product direction

Dropa2z will be a fast, simple goods-and-passenger transport experience inspired by the usability of Porter, using original Dropa2z branding, copy, code, illustrations, and animations. We will not copy Porter's logos, images, text, or proprietary code.

Initial customer services:

1. Auto (Rickshaw)
2. Bike

## Phase 1 — Working MVP

### Rider app

- Sign in with phone OTP.
- Pick-up and drop location search.
- Auto and Bike service cards in the Services section.
- Fare estimate, booking confirmation, live booking status, cancellation, trip history, profile, and support.

### Driver app

- Driver sign in, document/profile status, availability toggle, incoming job request, accept/reject, trip navigation, trip completion, and earnings/history.

### Backend and admin

- Rider, driver, vehicle, zone, pricing, booking, and payment database records.
- Admin controls for only Auto and Bike, service zones, pricing, onboarding slides, and user/driver support.
- Rider and Driver API endpoints, authentication, validation, audit logs, and error handling.

### Required assets and services

- Dropa2z logo, colors, typography, app icon, splash image, and store screenshots.
- Original SVG icon set, empty states, error states, vehicle illustrations, and optional original Lottie animations.
- Map/geocoding/routing provider, SMS OTP provider, Firebase push notifications, payment gateway, and object storage for driver documents.

## Phase 2 — Real booking operations

- Driver discovery and dispatch by live location, service type, zone, and availability.
- Live booking updates, driver/rider location tracking, push notifications, trip OTP, cancellation rules, referral/coupon rules, ratings, and support tickets.
- Admin operations dashboard: driver approval, booking monitoring, refunds, price rules, abuse controls, and reports.
- Full Android test cycle for Auto and Bike, poor-network testing, location permission flows, and end-to-end booking tests.

## Phase 3 — Production scale and reliability

- Release pipeline: automated tests, staging environment, production approvals, rollback, and signed release builds.
- Observability: crash reporting, API error tracking, metrics, alerts, logs, and performance dashboards.
- Load testing for booking, location, payment, login, and notification spikes.
- Disaster recovery: encrypted backups, restore drills, database replication, and documented incident procedures.
- Security: HTTPS, token rotation, role-based admin access, rate limits, input validation, secret management, and security review.

## 500k-user architecture rule

500,000 registered users does not mean 500,000 simultaneous users, so we will set real traffic targets before launch. A single cPanel server is fine for development and early validation, but it is not the final architecture for high concurrent traffic.

Before a large launch, use:

- CDN and web application firewall in front of the API.
- Load-balanced API servers instead of one PHP server.
- Redis for cache, sessions, rate limiting, and queued work coordination.
- Dedicated queue workers for OTP, notifications, emails, receipts, image work, and reports.
- A managed database with backups, high availability, read replicas where needed, and connection pooling.
- A separate real-time/WebSocket service for live driver locations and booking updates.
- Object storage for uploads and a monitoring stack with alerting.

## Quality targets

- Smooth main flows on ordinary Android phones, including weak networks.
- No uncaught app errors in normal booking flows.
- Crash-free sessions target of 99.9% or higher.
- Measured startup, screen-render, API-latency, and booking-success targets before production.
- Every production change tested in staging, then released gradually with rollback ready.
