import { ride, payment, invoice, locationChange } from "../endpoints/allRIdeEndpoint";
import { GET_API, POST_API, PUT_API } from "../methods";
import { PaymentInterface } from "../interface/allRideInterface";
import { requireApiSuccess } from "../responseError";

// A timed-out response can still mean the server saved the cancellation.
export const confirmPickupVehicle = async (rideId: number) => {
  const response = requireApiSuccess(await POST_API({}, `${ride}/${rideId}/confirm-pickup-vehicle`), 'Could not confirm this pickup vehicle.');
  const current = response.data?.data ?? response.data;
  if (!current?.parcel_delivery_progress?.pickup_vehicle_confirmed_at) throw new Error('Vehicle confirmation was not confirmed by the server.');
  return current;
};

// Read the authoritative status before reporting failure or allowing a retry.
export const cancelDelivery = async (ride_id: number, reason: string) => {
  if (!ride_id || !reason?.trim()) {
    throw new Error("Enter a cancellation reason before confirming.");
  }
  const endpoint = `${ride}/${ride_id}`;
  try {
    const response = requireApiSuccess(await PUT_API(endpoint, {
      status: "cancelled",
      cancellation_reason: reason.trim(),
    }, { timeout: 15000 }), "Could not cancel this delivery. Please try again.");
    if (response.data?.ride_status?.slug !== "cancelled") {
      throw new Error("Cancellation was not confirmed. Please check the delivery status and try again.");
    }
    return response.data;
  } catch (error) {
    try {
      const latest = requireApiSuccess(await GET_API(endpoint, { timeout: 10000 }), "Could not check delivery status.");
      const current = latest.data?.data ?? latest.data;
      if (current?.ride_status?.slug === "cancelled") return current;
    } catch {
      // Keep the original actionable cancellation error.
    }
    throw error;
  }
};


export const allRide = async (ride_id: number) => {
  const endpointWithParams = `${ride}/${ride_id}`;
  return GET_API(endpointWithParams)
    .then((res) => {

      return res;
    })
    .catch((e) => {
      return e?.response;
    });
};


export const allRides = async () => {
  const endpointWithParams = `${ride}`;
  return GET_API(endpointWithParams)
    .then((res) => {
      return res;
    })
    .catch((e) => {
      return e?.response;
    });
};


export const allpayment = async (data: PaymentInterface) => {
  return POST_API(data, payment)
    .then((res) => {
      return res;
    })
    .catch((e) => {
      return e?.response;
    });
};


export const rideUpdate = async ({ payload, ride_id }: { payload: any; ride_id: number }) => {
  return PUT_API(`${ride}/${ride_id}`, payload)

    .then((res) => {
      return res;
    })
    .catch((e) => {
      return e?.response;
    });
};


export const allInvoice = async (ride_number: number) => {
  const endpointWithParams = `${invoice}/${ride_number}`;
  return GET_API(endpointWithParams)
    .then((res) => {
      return res;
    })
    .catch((e) => {
      return e?.response;
    });
};

export const locationChanges = async (data: PaymentInterface) => {
  return POST_API(data, locationChange)
    .then((res) => {
      return res;
    })
    .catch((e) => {
      return e?.response;
    });
};



const allRideServices = {
  allRide,
  allpayment,
  allRides,
  rideUpdate,
  allInvoice,
  locationChanges
};

export default allRideServices;
