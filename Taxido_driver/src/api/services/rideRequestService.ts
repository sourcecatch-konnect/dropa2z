import { rideRequest, accept_ride_request, reject_ride_request, sync_current_ride_request } from '../endpoints/rideRequestEndPoint'
import { GET_API, POST_API, PUT_API } from '../methods'
import { DriverRideRequest } from '../interface/rideRequestInterface'
import {requireApiSuccess} from '../responseError'

export const rideRequestValue = async (zone_id: number) => {
  return GET_API(`${rideRequest}?zones=${zone_id}`)
    .then(res => {
      return res
    })
    .catch(e => {
      return e?.response
    })
}

export const driverRequestValue = async (data: DriverRideRequest) => {
  return POST_API(data, rideRequest)
    .then(res => {
      return res
    })
    .catch(e => {
      return e?.response
    })
}

export const acceptRequestValue = async (data: DriverRideRequest) => {
  const response = await POST_API(data, accept_ride_request)

  // POST_API intentionally returns failed Axios responses for legacy callers.
  // Acceptance must reject here so the thunk/UI cannot mistake HTTP 4xx/5xx
  // responses for a completed request.
  if (
    !response ||
    response?.isAxiosError ||
    (typeof response?.status !== 'number' || response.status < 200 || response.status >= 300) ||
    response?.data?.success === false
  ) {
    const message =
      response?.data?.message ||
      response?.message ||
      'The ride could not be accepted. Please try again.'
    const error: any = new Error(message)
    error.response = response
    error.status = response?.status
    throw error
  }

  return response
}

export const rejectRequestValue = async (data: DriverRideRequest) => {
  const response=await POST_API(data,reject_ride_request)
  return requireApiSuccess(response,'The booking could not be declined. Please try again.')
}

export const cancelRideRequestValue = async (ride_riquest_id: number) => {
  return PUT_API(`${rideRequest}/${ride_riquest_id}`)
    .then(res => {
      return res
    })
    .catch(e => {
      return e?.response
    })
}
export const syncCurrentRideRequest = async () => {
  return GET_API(sync_current_ride_request)
    .then(res => {
      return res
    })
    .catch(e => {
      return e?.response
    })
}


const rideRequestService = {
  rideRequestValue,
  driverRequestValue,
  acceptRequestValue,
  cancelRideRequestValue,
  rejectRequestValue,
  syncCurrentRideRequest
}

export default rideRequestService
