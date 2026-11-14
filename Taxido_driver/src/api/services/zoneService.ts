import { zoneUpdate, zoneRental, zoneCurrent, driverStatus } from '../endpoints/zoneEndPoint'
import { POST_API, GET_API } from '../methods'
import { ZoneUpdatePayload } from '../interface/zoneInterface'
import {requireApiSuccess} from '../responseError'

export const zone = async (data: ZoneUpdatePayload) => {
  return POST_API(data, zoneUpdate)
    .then(res => {
      return res
    })
    .catch(e => {
      return e?.response
    })
}

export const currentZone = async (lat: number, lng: number) => {
  const endpointWithParams = `${zoneCurrent}?lat=${lat}&lng=${lng}`
  return GET_API(endpointWithParams)
    .then(res => {
      return res
    })
    .catch(e => {
      return e?.response
    })
}

export const rentalZone = async (vehicle_type_id: number) => {
  return GET_API(`${zoneRental}?vehicle_type_id=${vehicle_type_id}`)
    .then(res => {
      return res
    })
    .catch(e => {
      return e?.response
    })
}

export const driversStatus = async (data: ZoneUpdatePayload) => {
  return requireApiSuccess(await POST_API(data, driverStatus, {timeout:12000}), 'Unable to change your availability. Please try again.')
}

const zoneService = {
  zone,
  rentalZone,
  currentZone,
  driversStatus
}

export default zoneService
