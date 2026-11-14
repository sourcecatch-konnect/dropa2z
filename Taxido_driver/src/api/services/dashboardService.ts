import {requireApiSuccess} from '../responseError'
import { dashBoard } from '../endpoints/dashboardEndPoint'
import { GET_API } from '../methods'

export const dashBoardData = async ({
  unit,
  zoneId,
  driver_id
}: {
  unit: string
  zoneId: number
  driver_id: number
}) => {
  return GET_API(`${dashBoard}?unit=${unit}&zoneId=${zoneId}&driver_id=${driver_id}`)
    .then(res => {
      return requireApiSuccess(res, 'Unable to load dashboard.')
    })
    .catch(e => {
      throw e
    })
}
const dashBoardService = {
  dashBoardData,
}

export default dashBoardService
