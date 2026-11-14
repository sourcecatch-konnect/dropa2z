import {bookingSnapshot} from './bookingPeople';

// Legacy push notifications use `ride`; screen links use `rideData`.
// Never substitute a bid/request ID for the actual delivery ID.
export function pickupRoute(params: any) {
  const ride = bookingSnapshot(params?.rideData ?? params?.ride);
  const explicit = Number(params?.ride_Id);
  const snapshotId = Number(ride?.id);
  const id = Number.isInteger(explicit) && explicit > 0 ? explicit : snapshotId;
  return {id: Number.isInteger(id) && id > 0 ? id : undefined,
    ride: !ride?.id || Number(ride.id) === id ? ride : null};
}

export function startedPickup(response: any, rideId: number) {
  const ride = bookingSnapshot(response);
  const id = Number(response?.id ?? ride?.id);
  return id === rideId && ['started', 'in_progress', 'on_going'].includes(
    String(response?.ride_status?.slug ?? ride?.ride_status?.slug ?? '').toLowerCase());
}
