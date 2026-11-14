
export const URL = 'https://dropa2z.com';


// App polling from ride tracking and notifications was hitting this local burst
// guard and producing client-side 429s before the request reached the server.
export const ENABLE_GLOBAL_RATE_LIMIT = false;
export const ENABLE_ENDPOINT_THROTTLE = false;
export const ENABLE_TAB_GUARD = true;
