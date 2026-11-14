export const URL = 'https://dropa2z.com';

// Request screens poll for ride updates and initialise several APIs together.
// The old client-side global limiter incorrectly turned that normal traffic
// into fake 429 "Too many requests from server" errors.
export const ENABLE_GLOBAL_RATE_LIMIT = false
export const ENABLE_ENDPOINT_THROTTLE = false
export const ENABLE_TAB_GUARD = true
