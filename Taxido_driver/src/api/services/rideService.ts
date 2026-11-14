import {requireApiSuccess} from '../responseError'
import { ride, startRide, ambulanceRide, parcelStop } from '../endpoints/rideEndPoint'
import { GET_API, POST_API, PUT_API } from '../methods'
import { RidePostInterface } from '../interface/rideInterface'

export const rideDataGet = async (ride_id: number) => {
  return GET_API(`${ride}/${ride_id}`, {timeout:15000})
    .then(res => {
      return requireApiSuccess(res, 'Unable to update delivery. Please try again.')
    })
    .catch(e => {
      throw e
    })
}

export const rideDataGets = async () => {
  return GET_API(`${ride}`)
    .then(res => {
      return res
    })
    .catch(e => {
      return e?.response
    })
}

export const ambulanceRideData = async (data: RidePostInterface) => {
  return POST_API(data, `${ambulanceRide}`)
    .then(res => {
      return res
    })
    .catch(e => {
      return e?.response
    })
}

export const rideUpdate = async ({
  data,
  ride_id,
}: {
  data: any
  ride_id: number
}) => {
  return PUT_API(data, `${ride}/${ride_id}`, {timeout:25000})
    .then(res => {
      return requireApiSuccess(res, 'Delivery update was not confirmed. Refresh the delivery status before trying again.')
    })
    .catch(e => {
      throw e
    })
}

export const userstartRide = async (data: RidePostInterface) => {
  return POST_API(data, `${ride}/${startRide}`)
    .then(res => {
      return requireApiSuccess(res, 'Could not verify the pickup PIN. Please try again.')
    })
    .catch(e => {
      throw e
    })
}

export const updateParcelStop = async ({
  ride_id,
  action,
  stop_index,
}: {
  ride_id: number
  action: 'arrived' | 'delivered'
  stop_index: number
}) => {
  return POST_API({ action, stop_index }, parcelStop(ride_id))
    .then(res => res)
    .catch(e => e?.response)
}

const rideServices = {
  rideDataGet,
  rideDataGets,
  userstartRide,
  updateParcelStop,
  rideUpdate,
  ambulanceRideData,
}

export default rideServices
