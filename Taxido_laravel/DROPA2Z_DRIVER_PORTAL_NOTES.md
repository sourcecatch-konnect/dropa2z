# Dropa2z Driver Web Portal Notes

## What this adds

- A Chrome-first driver portal at `/cab/driver/login`.
- Driver-only email and password sign-in using the existing hashed account password.
- Online/offline status and browser location updates through the existing driver-state service.
- A five-second check for currently assigned ride requests. This is a reliable fallback while the live WebSocket configuration is repaired.
- Accept/reject controls, rider OTP trip start, and trip completion controls.
- Admin bell notifications when a rider creates a ride request.

## Important safety rules

- Only an enabled, verified account with the `driver` role can enter the portal.
- Every accept/reject action checks that the request is assigned to that exact driver and its 30-second response time has not expired.
- The same response check now protects the existing mobile API too.
- The portal never gives a driver access to `/admin`.

## Test flow

1. Open `/cab/driver/login` in Chrome and use one test-driver account.
2. Allow browser location when you turn the driver online.
3. In a second browser session, create a rider booking.
4. Keep the driver portal open. The request should appear within five seconds.
5. Accept it, ask the rider for the trip OTP, start the trip, then complete it.
6. Check the admin bell for the new ride-request alert.

## Known infrastructure issue

The deployed browser script currently tries to connect its WebSocket to `wss://127.0.0.1:8080`. A visitor's browser cannot reach the server's loopback address. The live host must be configured and the frontend assets rebuilt before WebSocket-based instant updates can work. The portal polling fallback avoids blocking functional testing until that is corrected.
