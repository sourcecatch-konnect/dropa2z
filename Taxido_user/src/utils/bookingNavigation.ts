// Resume a delivery as one screen above Home, rather than retaining an old
// search/pickup screen whose listeners and modal sheets can reopen underneath it.
export function bookingRouteIdentity(name: string, params: any): string {
  if (name === 'RideActive') return `ride:${params?.activeRideOTP?.id}`;
  if (name === 'Payment') return `ride:${params?.rideId}`;
  if (name === 'BookRide') return `request:${params?.countinueRideId}`;
  return `ride:${params?.item?.id}`;
}

export function bookingResumeState(state: any, name: string, params: any) {
  const home = state?.routes?.find((route: any) => route.name === 'MyTabs') || {name: 'MyTabs'};
  const identity = bookingRouteIdentity(name, params);
  const existing = state?.routes?.find((route: any) =>
    route.name === name && bookingRouteIdentity(name, route.params) === identity);
  return {index: 1, routes: [home, {...(existing || {}), name, params}]};
}

export function resumeBooking(navigation: any, name: string, params: any) {
  const state = navigation.getRootState?.() ?? navigation.getState?.();
  const next = bookingResumeState(state, name, params);
  if (navigation.resetRoot) navigation.resetRoot(next);
  else navigation.reset(next);
}
