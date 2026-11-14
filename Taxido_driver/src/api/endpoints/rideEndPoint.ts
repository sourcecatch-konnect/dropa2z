export const ride = 'ride'
export const startRide = 'start-ride'
export const ambulanceRide = 'ride/ambulance/start-ride'
export const parcelStop = (rideId: number) => `${ride}/${rideId}/parcel-stop`
