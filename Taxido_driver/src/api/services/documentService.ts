import { document } from '../endpoints/documentEndPoint'
import { GET_API } from '../methods'
import {requireApiSuccess} from '../responseError'
import {documentItems} from '../../utils/registrationDocuments'

export const documentType = async ({ type }: { type: string }) => {
  if(type==='driver') {
    const responses=await Promise.all(['driver','vehicle'].map(async value=>requireApiSuccess(await GET_API(`${document}?type=${value}&status=1&paginate=100`),'Could not load registration documents.')));
    const data=responses.flatMap(response=>documentItems(response.data));
    return {...responses[0],data:{...responses[0].data,data:Array.from(new Map(data.map(item=>[item.id,item])).values())}};
  }
  const response=requireApiSuccess(await GET_API(`${document}?type=${type}&status=1&paginate=100`),'Could not load registration documents.');
  return {...response,data:{data:documentItems(response.data)}};
}

const documentServices = {
  documentType,
}

export default documentServices
